import express, { Response } from 'express';
import mongoose from 'mongoose';
import { Order, IOrderItem } from '../models/Order';
import { Cart } from '../models/Cart';
import { Product } from '../models/Product';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth';

const router = express.Router();

// Supported promotional coupons and rules
const SUPPORTED_COUPONS: Record<string, { minSpend: number; discountPercent?: number; flatDiscount?: number }> = {
  BAZAARO10: { minSpend: 999, discountPercent: 10 },
  DESITECH: { minSpend: 4999, discountPercent: 15 },
  FIRST500: { minSpend: 2499, flatDiscount: 500 },
};

// POST /api/orders - Protected: Create a new database-backed order from user cart
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const address = req.body.address || req.body.shippingAddress;
    const { couponCode, paymentMethod } = req.body;

    // 1. Validate shipping address
    if (!address) {
      return res.status(400).json({ error: 'Shipping address is required' });
    }

    const { fullName, phone, street, city, state, pincode } = address;
    if (!fullName?.trim() || !phone?.trim() || !street?.trim() || !city?.trim() || !state?.trim() || !pincode?.trim()) {
      return res.status(400).json({ error: 'All address fields (Full Name, Phone, Street, City, State, PIN) are required' });
    }

    const cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length < 10) {
      return res.status(400).json({ error: 'Please provide a valid 10-digit Indian phone number' });
    }

    const cleanedPincode = pincode.replace(/\D/g, '');
    if (cleanedPincode.length !== 6) {
      return res.status(400).json({ error: 'Please provide a valid 6-digit Indian postal PIN code' });
    }

    // 2. Retrieve user's cart from MongoDB
    const cart = await Cart.findOne({ userId });
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty. Please add items to bag before placing an order.' });
    }

    // 3. Verify every product exists, is in stock, and has sufficient warehouse quantity
    const orderItems: IOrderItem[] = [];
    let subtotal = 0;

    for (const item of cart.items) {
      if (!item.quantity || item.quantity <= 0) {
        return res.status(400).json({ error: `Invalid quantity (${item.quantity}) in bag` });
      }

      const queryOr: any[] = [{ id: item.productId }];
      if (mongoose.isValidObjectId(item.productId)) {
        queryOr.push({ _id: item.productId });
      }

      const product = await Product.findOne({ $or: queryOr, isActive: { $ne: false } });

      if (!product) {
        return res.status(400).json({ error: `Product (${item.productId}) is no longer available in catalog.` });
      }

      if (!product.inStock) {
        return res.status(400).json({ error: `"${product.name}" is currently out of stock.` });
      }

      if (product.stockCount !== undefined && product.stockCount > 0 && item.quantity > product.stockCount) {
        return res.status(400).json({
          error: `Insufficient stock for "${product.name}". Requested ${item.quantity}, but only ${product.stockCount} available.`,
        });
      }

      // Snapshot immutable product data with current server price
      orderItems.push({
        productId: product.id,
        productRef: product._id as any,
        name: product.name,
        brand: product.brand,
        price: product.price, // Live server database price (prevents client manipulation)
        quantity: item.quantity,
        image: product.images?.[0] || '',
      });

      subtotal += product.price * item.quantity;
    }

    // 4. Server-side coupon discount calculation
    let couponDiscount = 0;
    const appliedCode = (couponCode || cart.couponCode || '').trim().toUpperCase();

    if (appliedCode) {
      const couponRule = SUPPORTED_COUPONS[appliedCode];
      if (!couponRule) {
        return res.status(400).json({ error: `Coupon "${appliedCode}" is not valid.` });
      }

      if (subtotal < couponRule.minSpend) {
        return res.status(400).json({
          error: `Coupon "${appliedCode}" requires a minimum order of ₹${couponRule.minSpend.toLocaleString('en-IN')}.`,
        });
      }

      if (couponRule.discountPercent) {
        couponDiscount = Math.round((subtotal * couponRule.discountPercent) / 100);
      } else if (couponRule.flatDiscount) {
        couponDiscount = couponRule.flatDiscount;
      }
    }

    // 5. Delivery fee calculation (Free above ₹499)
    const deliveryFee = subtotal >= 499 ? 0 : 70;

    // 6. Calculate total and 18% inclusive GST
    const total = Math.max(0, subtotal - couponDiscount + deliveryFee);
    const gstAmount = Math.round((total * 18) / 118);

    // 7. Generate Indian order tracking identifiers
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderId = `BZ-IND-2026-${randomSuffix}`;
    const trackingNumber = `BD${Math.floor(100000000 + Math.random() * 900000000)}IN`;

    // 8. Create Order document in MongoDB Atlas
    const order = await Order.create({
      orderId,
      userId,
      items: orderItems,
      subtotal,
      discount: 0,
      couponDiscount,
      couponCode: appliedCode || undefined,
      deliveryFee,
      gstAmount,
      total,
      address: {
        fullName: fullName.trim(),
        phone: cleanedPhone,
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: cleanedPincode,
        landmark: address.landmark?.trim() || '',
        type: address.type === 'work' ? 'work' : 'home',
      },
      paymentMethod: paymentMethod || 'Razorpay Test Mode (Pending)',
      paymentId: `pay_pending_${Math.random().toString(36).substring(2, 10)}`,
      paymentStatus: 'pending', // Maintained as pending for Phase 6
      status: 'Placed',
      courier: 'BlueDart Express',
      trackingNumber,
      estimatedDeliveryDate: 'Within 24-48 Hours',
    });

    // 9. Clear the cart in MongoDB only after successful order creation
    cart.items = [] as any;
    cart.couponCode = undefined;
    await cart.save();

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order,
    });
  } catch (error: any) {
    console.error('[Create Order Error]', error);
    return res.status(500).json({ error: error.message || 'Failed to create order' });
  }
});

// GET /api/orders - Protected: Retrieve user order history
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    // Admins can see all orders if query param all=true, customers see only their own
    const query: any = req.user!.role === 'admin' && req.query.all === 'true' ? {} : { userId };

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

    return res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error: any) {
    console.error('[Get Orders Error]', error);
    return res.status(500).json({ error: 'Failed to retrieve orders' });
  }
});

// GET /api/orders/:id - Protected: Get order details by orderId or _id
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const queryOr: any[] = [{ orderId: id }];
    if (mongoose.isValidObjectId(id)) {
      queryOr.push({ _id: id });
    }

    const order = await Order.findOne({ $or: queryOr }).lean();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Security check: Customer can only view their own order
    if (order.userId && order.userId.toString() !== req.user!.userId && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: You cannot view another customer’s order' });
    }

    return res.json({
      success: true,
      order,
    });
  } catch (error: any) {
    console.error('[Get Order Detail Error]', error);
    return res.status(500).json({ error: 'Failed to retrieve order details' });
  }
});

// PUT /api/orders/:id/cancel - Protected: Cancel an order if allowed
router.put('/:id/cancel', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const queryOr: any[] = [{ orderId: id }];
    if (mongoose.isValidObjectId(id)) {
      queryOr.push({ _id: id });
    }

    const order = await Order.findOne({ $or: queryOr });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Security check: Only order owner or admin can cancel
    if (order.userId && order.userId.toString() !== req.user!.userId && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: You cannot cancel another customer’s order' });
    }

    // Check cancellation eligibility
    const cancellableStatuses = ['Placed', 'Confirmed', 'Packed'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        error: `Order cannot be cancelled because it is already marked as "${order.status}".`,
      });
    }

    order.status = 'Cancelled';
    await order.save();

    return res.json({
      success: true,
      message: 'Order cancelled successfully',
      order,
    });
  } catch (error: any) {
    console.error('[Cancel Order Error]', error);
    return res.status(500).json({ error: 'Failed to cancel order' });
  }
});

export default router;
