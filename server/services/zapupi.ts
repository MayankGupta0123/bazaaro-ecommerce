/**
 * ZapUPI Payment Gateway Integration Service
 * 
 * Secure server-side wrapper for ZapUPI REST API.
 * NEVER prints, logs, or returns the API key or secrets.
 */

export interface CreateZapUpiOrderParams {
  orderId: string;
  amount: number;
  customerMobile?: string;
  remark?: string;
  webhookUrl: string;
  cashierId?: string | number;
}

export interface CreateZapUpiOrderResult {
  success: boolean;
  paymentUrl?: string;
  orderId: string;
  txnId?: string;
  environment?: string;
  message?: string;
  error?: string;
  raw?: any;
}

export interface ZapUpiOrderStatusResult {
  success: boolean;
  isPaid: boolean;
  status: 'Success' | 'Failed' | 'Pending' | 'Error';
  orderId: string;
  amount?: number;
  txnId?: string;
  utr?: string;
  environment?: string;
  message?: string;
  raw?: any;
  error?: string;
}

function getZapKey(): string {
  const key = process.env.ZAPUPI_KEY_ID?.trim();
  if (!key) {
    throw new Error('ZapUPI API key is not configured in environment variables');
  }
  return key;
}

/**
 * Creates a payment order with ZapUPI and obtains the customer payment URL.
 */
export async function createZapUpiOrder(
  params: CreateZapUpiOrderParams
): Promise<CreateZapUpiOrderResult> {
  const zapKey = getZapKey();
  const cashierId = params.cashierId || process.env.ZAPUPI_CASHIER_ID || '3791';

  const formattedAmount = Number(params.amount).toFixed(2);
  const payload = {
    zap_key: zapKey,
    order_id: params.orderId,
    amount: formattedAmount,
    customer_mobile: params.customerMobile ? params.customerMobile.replace(/\D/g, '').slice(-10) : undefined,
    remark: params.remark || `Bazaaro | ${params.orderId}`,
    webhook_url: params.webhookUrl,
    cashier_id: cashierId,
    payment_mode: 'cashier',
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch('https://pay.zapupi.com/api/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const text = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      return {
        success: false,
        orderId: params.orderId,
        error: 'Invalid JSON response received from ZapUPI gateway',
      };
    }

    const isSuccess =
      data.status === 'success' ||
      data.status === true ||
      data.status === 'Success' ||
      Boolean(data.payment_url);

    const paymentUrl = data.payment_url || data.data?.payment_url;
    const txnId = data.txn_id || data.data?.txn_id;
    const environment = data.environment || data.data?.environment;

    if (!isSuccess || !paymentUrl) {
      return {
        success: false,
        orderId: params.orderId,
        message: data.message || 'Payment gateway order creation was rejected',
        error: data.message || 'Failed to obtain payment URL from ZapUPI',
        raw: data,
      };
    }

    return {
      success: true,
      paymentUrl,
      orderId: data.order_id || params.orderId,
      txnId,
      environment,
      message: data.message,
      raw: data,
    };
  } catch (err: any) {
    const isTimeout = err.name === 'AbortError';
    return {
      success: false,
      orderId: params.orderId,
      error: isTimeout
        ? 'Connection timed out while contacting ZapUPI gateway'
        : (err.message || 'Network error communicating with ZapUPI'),
    };
  }
}

/**
 * Queries the official payment status directly from ZapUPI's order-status API.
 */
export async function getZapUpiOrderStatus(
  zapupiOrderId: string
): Promise<ZapUpiOrderStatusResult> {
  const zapKey = getZapKey();

  const payload = {
    zap_key: zapKey,
    order_id: zapupiOrderId,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch('https://pay.zapupi.com/api/order-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const text = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      return {
        success: false,
        isPaid: false,
        status: 'Error',
        orderId: zapupiOrderId,
        error: 'Invalid JSON response received from ZapUPI gateway',
      };
    }

    // Determine status value
    const rawStatus = (
      data.status ||
      data.order_status ||
      data.data?.status ||
      ''
    ).toString();

    const isPaid =
      rawStatus.toLowerCase() === 'success' ||
      rawStatus.toLowerCase() === 'paid';

    const isFailed =
      rawStatus.toLowerCase() === 'failed' ||
      rawStatus.toLowerCase() === 'failure' ||
      rawStatus.toLowerCase() === 'cancelled';

    let normalizedStatus: 'Success' | 'Failed' | 'Pending' | 'Error' = 'Pending';
    if (isPaid) {
      normalizedStatus = 'Success';
    } else if (isFailed) {
      normalizedStatus = 'Failed';
    } else if (rawStatus.toLowerCase() === 'error') {
      normalizedStatus = 'Error';
    }

    const rawAmount = data.amount ?? data.pay_amount ?? data.data?.amount ?? data.data?.pay_amount;
    const amount = rawAmount !== undefined ? parseFloat(rawAmount) : undefined;
    const txnId = data.txn_id || data.data?.txn_id;
    const utr = data.utr || data.data?.utr;
    const environment = data.environment || data.data?.environment;

    return {
      success: normalizedStatus !== 'Error',
      isPaid,
      status: normalizedStatus,
      orderId: data.order_id || zapupiOrderId,
      amount,
      txnId,
      utr,
      environment,
      message: data.message,
      raw: data,
    };
  } catch (err: any) {
    const isTimeout = err.name === 'AbortError';
    return {
      success: false,
      isPaid: false,
      status: 'Error',
      orderId: zapupiOrderId,
      error: isTimeout
        ? 'Connection timed out while querying ZapUPI status'
        : (err.message || 'Network error verifying order status'),
    };
  }
}
