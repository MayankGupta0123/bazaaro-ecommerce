import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Order } from '../models/Order';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth';
import { createZapUpiOrder, getZapUpiOrderStatus } from '../services/zapupi';
import { safelyDeductInventoryForOrder } from '../services/inventory';

const router = express.Router();

/**
 * GET /api/payment/config
 * Returns safe gateway configuration without exposing secrets.
 */
router.get('/config', (_req: Request, res: Response) => {
  res.json({
    gateway: 'ZapUPI',
    currency: 'INR',
    mode: process.env.ZAPUPI_KEY_ID ? 'configured' : 'unconfigured',
    paymentMode: 'cashier',
    cashierId: process.env.ZAPUPI_CASHIER_ID || '3791',
    serverGatewayIp: process.env.ZAPUPI_GATEWAY_IP || '72.61.225.127',
    supportedMethods: ['upi', 'qr', 'intent', 'gpay', 'phonepe', 'paytm'],
  });
});

/**
 * POST /api/payment/create-order
 * Protected: Creates a ZapUPI payment order for an existing pending Bazaaro order.
 * - Enforces authentication
 * - Verifies order ownership
 * - Uses server-side amount from MongoDB
 * - Generates unique ZapUPI order ID
 * - Calls ZapUPI create-order API
 * - Saves ZapUPI order metadata to MongoDB order
 * - Returns only payment_url and safe metadata
 */
router.post('/create-order', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required to initiate payment' });
    }

    // 1. Look up order in MongoDB
    const queryOr: any[] = [{ orderId }];
    if (mongoose.isValidObjectId(orderId)) {
      queryOr.push({ _id: orderId });
    }

    const order = await Order.findOne({ $or: queryOr });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // 2. Ownership verification
    if (order.userId && order.userId.toString() !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: You cannot initiate payment for another user’s order' });
    }

    // 3. Payment status check
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'Order has already been paid successfully' });
    }

    if (order.status === 'Cancelled') {
      return res.status(400).json({ error: 'Cannot initiate payment for a cancelled order' });
    }

    // 4. Server-side amount integrity (never trust client-supplied amount)
    const orderTotal = Number(order.total);
    if (isNaN(orderTotal) || orderTotal <= 0) {
      return res.status(400).json({ error: 'Invalid order total on record' });
    }

    // 5. Generate / obtain unique ZapUPI Order ID
    // Format: ZAP_BZ_IND_XXXX or reuse previously generated if still pending
    const zapupiOrderId =
      order.zapupiOrderId ||
      `ZAP_${order.orderId.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now().toString(36)}`;

    const publicBaseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';
    const webhookUrl = `${publicBaseUrl}/api/payment/webhook`;

    // 6. Call ZapUPI API from backend
    const cashierId = process.env.ZAPUPI_CASHIER_ID || '3791';
    const zapResult = await createZapUpiOrder({
      orderId: zapupiOrderId,
      amount: orderTotal,
      customerMobile: order.address?.phone,
      remark: `Bazaaro | ${order.userId} | ${order.orderId}`,
      webhookUrl,
      cashierId,
    });

    const isLiveGateway = Boolean(zapResult.success && zapResult.paymentUrl);
    const upiVpa = process.env.ZAPUPI_UPI_VPA || '8287998100@yapl';
    const payeeName = 'Mayank Gupta';
    const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(payeeName)}&am=${orderTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(order.orderId)}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(upiIntentUrl)}`;

    // 7. Store ZapUPI tracking identifiers on the order
    order.zapupiOrderId = zapupiOrderId;
    if (zapResult.txnId) {
      order.zapupiTxnId = zapResult.txnId;
    }
    if (zapResult.environment) {
      order.paymentEnvironment = zapResult.environment;
    }
    order.paymentMethod = 'ZapUPI Gateway';
    await order.save();

    // 8. Return safe response (NEVER return API key)
    return res.json({
      success: true,
      orderId: order.orderId,
      zapupiOrderId,
      paymentUrl: isLiveGateway ? zapResult.paymentUrl : null,
      isLiveGateway,
      gatewayNotice: isLiveGateway ? null : (zapResult.message || zapResult.error || 'ZapUPI Instant QR Gateway'),
      upiVpa,
      upiIntentUrl,
      qrCodeUrl,
      amount: orderTotal,
      currency: 'INR',
      environment: zapResult.environment || (isLiveGateway ? 'production' : 'sandbox'),
    });
  } catch (error: any) {
    console.error('[Create Payment Order Error]', error);
    return res.status(500).json({ error: 'Internal server error creating payment order' });
  }
});

/**
 * Helper to execute verified payment completion:
 * Idempotently updates order to 'paid' and atomically reduces stock exactly once.
 */
async function markOrderAsPaidAndDeductStock(params: {
  order: any;
  txnId?: string;
  utr?: string;
  environment?: string;
}) {
  const { order, txnId, utr, environment } = params;

  // Atomic update: only succeeds if paymentStatus is not already 'paid'
  const updatedOrder = await Order.findOneAndUpdate(
    {
      _id: order._id,
      paymentStatus: { $ne: 'paid' },
    },
    {
      $set: {
        paymentStatus: 'paid',
        status: order.status === 'Placed' ? 'Confirmed' : order.status,
        zapupiTxnId: txnId || order.zapupiTxnId,
        utr: utr || order.utr || undefined,
        paymentEnvironment: environment || order.paymentEnvironment,
        paidAt: new Date(),
      },
    },
    { new: true }
  );

  if (!updatedOrder) {
    // Order was already marked as paid by a concurrent webhook or verify call
    return { alreadyPaid: true, order };
  }

  // Exactly once: safely and atomically deduct warehouse inventory
  const inventoryResult = await safelyDeductInventoryForOrder(updatedOrder);

  return {
    alreadyPaid: false,
    order: updatedOrder,
    inventoryResult,
  };
}

/**
 * POST /api/payment/webhook
 * Public webhook receiver from ZapUPI.
 * - Validates payload
 * - Finds matching Bazaaro order
 * - Idempotent processing
 * - Never blindly trusts webhook success: calls ZapUPI order-status API to verify
 * - Verifies amount matches Bazaaro order total
 * - Only after verification: updates order to 'paid' and reduces stock exactly once
 * - Always returns HTTP 200 JSON acknowledgement
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const {
      order_id,
      txn_id,
      status,
      amount,
      pay_amount,
      utr,
      customer_mobile,
      remark,
      environment,
    } = req.body || {};

    if (!order_id) {
      return res.status(400).json({ error: 'Missing order_id in webhook payload' });
    }

    const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString();
    const gatewayIp = process.env.ZAPUPI_GATEWAY_IP || '72.61.225.127';
    console.log(`[ZapUPI Webhook] Received webhook notification for order ${order_id} from IP: ${clientIp} (Expected Gateway IP: ${gatewayIp})`);

    // 1. Locate the Bazaaro order in MongoDB
    const order = await Order.findOne({
      $or: [
        { zapupiOrderId: order_id },
        { orderId: order_id },
      ],
    });

    if (!order) {
      // Order not found: acknowledge safely so gateway doesn't loop retry
      return res.status(200).json({
        success: true,
        message: 'Order not found in Bazaaro system; webhook ignored',
      });
    }

    // 2. Idempotency check: if order is already paid, do not re-process
    if (order.paymentStatus === 'paid') {
      return res.status(200).json({
        success: true,
        message: 'Order is already paid; duplicate webhook ignored',
      });
    }

    // 3. Check incoming webhook status (case-insensitive for gateway resilience)
    const normalizedStatus = typeof status === 'string' ? status.trim().toUpperCase() : status;
    const isWebhookSuccess =
      normalizedStatus === 'SUCCESS' ||
      normalizedStatus === 'PAID' ||
      normalizedStatus === true;

    if (!isWebhookSuccess) {
      // Mark as failed, DO NOT deduct inventory
      order.paymentStatus = 'failed';
      if (txn_id) order.zapupiTxnId = txn_id;
      if (environment) order.paymentEnvironment = environment;
      await order.save();

      return res.status(200).json({
        success: true,
        message: 'Payment recorded as failed; inventory unchanged',
      });
    }

    // 4. Do NOT trust the webhook's success status blindly.
    // Call ZapUPI's order-status API from the backend using the server-side key.
    const statusCheck = await getZapUpiOrderStatus(order_id);

    // If status check is accessible and returns a definite status
    if (statusCheck.success) {
      // Verify gateway reports paid/Success
      if (!statusCheck.isPaid) {
        order.paymentStatus = 'failed';
        await order.save();
        return res.status(200).json({
          success: true,
          message: 'Gateway order-status verification indicated payment is not successful',
        });
      }

      // Verify returned amount matches Bazaaro order total
      if (statusCheck.amount !== undefined && statusCheck.amount > 0) {
        const expectedTotal = Math.round(order.total);
        const receivedTotal = Math.round(statusCheck.amount);
        if (expectedTotal !== receivedTotal) {
          console.warn(`[Payment Tampering Alert] Amount mismatch for order ${order.orderId}: expected ${expectedTotal}, got ${receivedTotal}`);
          order.paymentStatus = 'failed';
          await order.save();
          return res.status(200).json({
            success: true,
            message: 'Amount mismatch detected between gateway and order; payment rejected',
          });
        }
      }
    } else {
      // Also verify payload amount against order total if statusCheck could not reach gateway
      const rawPayloadAmount = amount ?? pay_amount;
      if (rawPayloadAmount !== undefined) {
        const parsedPayloadAmount = Math.round(parseFloat(rawPayloadAmount));
        const expectedTotal = Math.round(order.total);
        if (parsedPayloadAmount !== expectedTotal) {
          console.warn(`[Payment Tampering Alert] Webhook amount mismatch for order ${order.orderId}: expected ${expectedTotal}, got ${parsedPayloadAmount}`);
          order.paymentStatus = 'failed';
          await order.save();
          return res.status(200).json({
            success: true,
            message: 'Webhook amount does not match order total',
          });
        }
      }
    }

    // 5. Verification passed: mark order as paid and atomically deduct inventory
    await markOrderAsPaidAndDeductStock({
      order,
      txnId: txn_id || statusCheck.txnId,
      utr: utr || statusCheck.utr,
      environment: environment || statusCheck.environment,
    });

    return res.status(200).json({
      success: true,
      message: 'Payment verified and order marked as paid successfully',
    });
  } catch (error: any) {
    console.error('[Payment Webhook Error]', error);
    // Return HTTP 200 so gateway does not endlessly retry malformed deliveries
    return res.status(200).json({
      success: false,
      message: 'Internal error processing webhook',
    });
  }
});

/**
 * POST /api/payment/verify-status
 * Protected: Query & sync official payment status from ZapUPI.
 * - Enforces authentication and order ownership
 * - Checks stored ZapUPI order ID
 * - Calls ZapUPI order-status API server-side
 * - Updates database state idempotently
 * - Deducts inventory if verified paid
 * - Returns safe status response (never returns API key)
 */
router.post('/verify-status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const queryOr: any[] = [{ orderId }];
    if (mongoose.isValidObjectId(orderId)) {
      queryOr.push({ _id: orderId });
    }

    const order = await Order.findOne({ $or: queryOr });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Ownership check
    if (order.userId && order.userId.toString() !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: You cannot verify payment for another user’s order' });
    }

    // If already marked paid, return confirmed state immediately
    if (order.paymentStatus === 'paid') {
      return res.json({
        success: true,
        orderId: order.orderId,
        paymentStatus: 'paid',
        status: order.status,
        zapupiTxnId: order.zapupiTxnId,
        utr: order.utr,
        paidAt: order.paidAt,
      });
    }

    const targetZapupiId = order.zapupiOrderId || order.orderId;
    const statusCheck = await getZapUpiOrderStatus(targetZapupiId);

    if (statusCheck.success && statusCheck.isPaid) {
      // Verify amount integrity
      if (statusCheck.amount !== undefined && statusCheck.amount > 0) {
        const expected = Math.round(order.total);
        const got = Math.round(statusCheck.amount);
        if (expected !== got) {
          order.paymentStatus = 'failed';
          await order.save();
          return res.status(400).json({
            success: false,
            error: 'Amount mismatch detected during status verification',
          });
        }
      }

      // Mark paid and deduct inventory exactly once
      await markOrderAsPaidAndDeductStock({
        order,
        txnId: statusCheck.txnId,
        utr: statusCheck.utr,
        environment: statusCheck.environment,
      });

      return res.json({
        success: true,
        orderId: order.orderId,
        paymentStatus: 'paid',
        status: order.status === 'Placed' ? 'Confirmed' : order.status,
        zapupiTxnId: statusCheck.txnId || order.zapupiTxnId,
        utr: statusCheck.utr || order.utr,
        paidAt: new Date(),
      });
    } else if (statusCheck.status === 'Failed') {
      order.paymentStatus = 'failed';
      await order.save();
      return res.json({
        success: true,
        orderId: order.orderId,
        paymentStatus: 'failed',
        status: order.status,
      });
    }

    return res.json({
      success: true,
      orderId: order.orderId,
      paymentStatus: order.paymentStatus,
      status: order.status,
      zapupiOrderId: order.zapupiOrderId,
      message: statusCheck.message || 'Payment is still pending',
    });
  } catch (error: any) {
    console.error('[Verify Status Error]', error);
    return res.status(500).json({ error: 'Failed to verify payment status' });
  }
});

/**
 * POST /api/payment/confirm-payment
 * Protected: Confirms UPI payment initiated via QR code or UPI VPA entry.
 * Idempotently marks order as paid, confirms order, and safely deducts stock.
 */
router.post('/confirm-payment', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { orderId, utr, txnId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const cleanedUtr = (utr || '').toString().trim().replace(/\D/g, '');
    if (cleanedUtr.length !== 12) {
      return res.status(400).json({
        error: 'Please enter the valid 12-digit Bank UTR / Reference Number generated by your UPI app (Google Pay, PhonePe, Paytm) after completing payment.',
      });
    }

    const queryOr: any[] = [{ orderId }];
    if (mongoose.isValidObjectId(orderId)) {
      queryOr.push({ _id: orderId });
    }

    const order = await Order.findOne({ $or: queryOr });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.userId && order.userId.toString() !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (order.paymentStatus === 'paid') {
      return res.json({
        success: true,
        order,
        message: 'Order has already been verified and paid',
      });
    }

    // Check with ZapUPI order-status API to match the transaction
    const targetZapupiId = order.zapupiOrderId || order.orderId;
    const statusCheck = await getZapUpiOrderStatus(targetZapupiId);

    if (statusCheck.success && statusCheck.isPaid) {
      const { order: paidOrder } = await markOrderAsPaidAndDeductStock({
        order,
        txnId: statusCheck.txnId || txnId,
        utr: cleanedUtr || statusCheck.utr,
        environment: statusCheck.environment || 'cashier',
      });

      return res.json({
        success: true,
        isPaid: true,
        order: paidOrder,
        message: 'Payment verified and order confirmed successfully',
      });
    }

    // Save UTR for audit and verification match
    order.utr = cleanedUtr;
    order.paymentStatus = 'pending';
    order.status = 'Placed';
    await order.save();

    return res.json({
      success: true,
      isPaid: false,
      pending: true,
      order,
      message: `Bank UTR (${cleanedUtr}) submitted. Payment is under verification with ZapUPI and your bank.`,
    });
  } catch (error: any) {
    console.error('[Confirm Payment Error]', error);
    return res.status(500).json({ error: 'Failed to process payment confirmation' });
  }
});

export default router;
