import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  Lock,
  ArrowRight,
  Printer,
  Truck,
  AlertCircle,
  QrCode,
  ExternalLink,
  Copy,
  Check,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { CartItem, Address, Order } from '../types';
import { formatINR } from '../utils/format';
import { INDIAN_STATES } from '../data/products';
import { BazaaroLogo } from './BazaaroLogo';
import { printOrderReceipt } from '../utils/printReceipt';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  discount: number;
  couponDiscount: number;
  couponCode?: string;
  deliveryFee: number;
  total: number;
  onOrderPlaced: (order: Order) => void;
  token?: string | null;
  onRequireAuth?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  subtotal,
  discount,
  couponDiscount,
  couponCode,
  deliveryFee,
  total,
  onOrderPlaced,
  token,
  onRequireAuth,
}) => {
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  // Address state
  const [address, setAddress] = useState<Address>({
    fullName: 'Rahul Sharma',
    phone: '9876543210',
    street: 'Flat 402, Lotus Grandeur, 14th Main',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    landmark: 'Near Indiranagar Metro Station',
    type: 'home',
  });

  const [step, setStep] = useState<'address' | 'payment' | 'processing' | 'upi_payment' | 'success'>('address');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cod'>('upi');
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [upiData, setUpiData] = useState<{
    qrCodeUrl: string;
    upiIntentUrl: string;
    upiVpa: string;
    isLiveGateway: boolean;
    paymentUrl: string | null;
    amount: number;
    orderId: string;
    gatewayNotice?: string | null;
  } | null>(null);
  const [enteredUtr, setEnteredUtr] = useState('');
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [copiedVpa, setCopiedVpa] = useState(false);

  if (!isOpen) return null;

  const gstAmount = Math.round((total * 18) / 118);

  const handleCopyVpa = () => {
    if (upiData?.upiVpa) {
      navigator.clipboard.writeText(upiData.upiVpa);
      setCopiedVpa(true);
      setTimeout(() => setCopiedVpa(false), 2000);
    }
  };

  const handleConfirmUpiPayment = async () => {
    if (!pendingOrder || !token) return;
    setCheckoutError(null);

    const cleanedUtr = enteredUtr.trim().replace(/\D/g, '');
    if (cleanedUtr.length !== 12) {
      setCheckoutError('Please enter the valid 12-digit Bank UTR / Reference Number from your payment app receipt (Google Pay, PhonePe, Paytm).');
      return;
    }

    setIsVerifyingPayment(true);

    try {
      const res = await fetch('/api/payment/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: pendingOrder.id,
          utr: cleanedUtr,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCheckoutError(data.error || 'Failed to verify payment reference.');
        setIsVerifyingPayment(false);
        return;
      }

      const serverOrder = data.order || pendingOrder;
      const confirmedOrder: Order = {
        ...pendingOrder,
        paymentStatus: data.isPaid ? 'paid' : 'pending',
        status: data.isPaid ? 'Confirmed' : 'Placed',
        paymentId: serverOrder.zapupiTxnId || serverOrder.paymentId || `UTR_${cleanedUtr}`,
        utr: cleanedUtr,
        zapupiTxnId: serverOrder.zapupiTxnId,
      };

      setPlacedOrder(confirmedOrder);
      onOrderPlaced(confirmedOrder);
      setStep('success');
    } catch (err: any) {
      setCheckoutError(err.message || 'Error processing payment confirmation');
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  const handleInitiatePayment = async () => {
    setCheckoutError(null);

    if (!token) {
      setCheckoutError('Please sign in to your Bazaaro account to complete checkout and save your order.');
      if (onRequireAuth) onRequireAuth();
      return;
    }

    setStep('processing');

    try {
      const isCod = paymentMethod === 'cod';
      const paymentLabel = isCod
        ? 'Cash on Delivery'
        : 'ZapUPI Gateway';

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          address,
          couponCode,
          paymentMethod: paymentLabel,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCheckoutError(data.error || 'Failed to place order. Please review your cart and details.');
        setStep('address');
        return;
      }

      const serverOrder = data.order;
      const formattedOrder: Order = {
        id: serverOrder.orderId,
        date: new Date(serverOrder.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        items: serverOrder.items.map((i: any) => ({
          product: {
            id: i.productId,
            name: i.name,
            brand: i.brand,
            price: i.price,
            images: i.image ? [i.image] : [],
          } as any,
          quantity: i.quantity,
        })),
        subtotal: serverOrder.subtotal,
        discount: serverOrder.discount || 0,
        couponDiscount: serverOrder.couponDiscount || 0,
        couponCode: serverOrder.couponCode,
        deliveryFee: serverOrder.deliveryFee || 0,
        gstAmount: serverOrder.gstAmount || 0,
        total: serverOrder.total,
        address: serverOrder.address,
        paymentMethod: serverOrder.paymentMethod,
        paymentId: serverOrder.paymentId,
        paymentStatus: serverOrder.paymentStatus,
        status: serverOrder.status,
        courier: serverOrder.courier,
        trackingNumber: serverOrder.trackingNumber,
        estimatedDeliveryDate: serverOrder.estimatedDeliveryDate,
      };

      if (isCod) {
        setPlacedOrder(formattedOrder);
        onOrderPlaced(formattedOrder);
        setStep('success');
        return;
      }

      // Online payment via ZapUPI
      setPendingOrder(formattedOrder);

      const payRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId: serverOrder.orderId }),
      });

      const payData = await payRes.json();

      if (!payRes.ok) {
        setCheckoutError(payData.error || payData.message || 'Failed to initialize ZapUPI payment gateway');
        setStep('payment');
        return;
      }

      if (payData.isLiveGateway && payData.paymentUrl) {
        window.location.href = payData.paymentUrl;
        return;
      }

      const defaultVpa = payData.upiVpa || '8287998100@yapl';
      const payeeName = 'Mayank Gupta';
      const fallbackQr = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(`upi://pay?pa=${encodeURIComponent(defaultVpa)}&pn=${encodeURIComponent(payeeName)}&am=${formattedOrder.total.toFixed(2)}&cu=INR&tn=${encodeURIComponent(formattedOrder.id)}`)}`;
      const fallbackIntent = `upi://pay?pa=${encodeURIComponent(defaultVpa)}&pn=${encodeURIComponent(payeeName)}&am=${formattedOrder.total.toFixed(2)}&cu=INR&tn=${encodeURIComponent(formattedOrder.id)}`;

      setUpiData({
        qrCodeUrl: payData.qrCodeUrl || fallbackQr,
        upiIntentUrl: payData.upiIntentUrl || fallbackIntent,
        upiVpa: defaultVpa,
        isLiveGateway: Boolean(payData.isLiveGateway),
        paymentUrl: payData.paymentUrl || null,
        amount: formattedOrder.total,
        orderId: formattedOrder.id,
        gatewayNotice: payData.gatewayNotice,
      });

      setStep('upi_payment');
    } catch (err: any) {
      setCheckoutError(err.message || 'Network error placing order');
      setStep('payment');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-bazaaro-surface rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-700/50 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BazaaroLogo size="sm" iconOnly />
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Secure Checkout</h3>
              <p className="text-[10px] text-slate-400 font-medium">Bazaaro Official Payments (INR ₹)</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-800/50 border border-slate-700 text-slate-300 text-[11px] font-semibold px-2.5 py-1 rounded-md">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Bank-grade Security</span>
            </div>
            {step !== 'processing' && (
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-slate-300 hover:bg-slate-800 p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-bazaaro-surface">
          {checkoutError && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span className="font-medium">{checkoutError}</span>
              </div>
              {!token && onRequireAuth && (
                <button
                  type="button"
                  onClick={onRequireAuth}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs shrink-0 cursor-pointer transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          )}

          {/* STEP 1: Address */}
          {step === 'address' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
                <div className="font-semibold text-slate-100 text-sm flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-xs flex items-center justify-center font-medium">1</span>
                  Delivery Details
                </div>
                <span className="text-xs text-slate-500 font-medium">Step 1 of 2</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block font-medium text-slate-400 mb-1.5 text-xs">Full Name</label>
                  <input
                    type="text"
                    value={address.fullName}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-slate-200 rounded-xl focus:border-slate-500 outline-hidden transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-400 mb-1.5 text-xs">Phone Number (+91)</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-700 bg-slate-800/30 text-slate-500 text-sm">
                      +91
                    </span>
                    <input
                      type="text"
                      maxLength={10}
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value.replace(/\D/g, '') })}
                      className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-slate-200 rounded-r-xl focus:border-slate-500 outline-hidden transition-colors"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-400 mb-1.5 text-xs">Street Address / Area</label>
                  <input
                    type="text"
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-slate-200 rounded-xl focus:border-slate-500 outline-hidden transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-400 mb-1.5 text-xs">City</label>
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-slate-200 rounded-xl focus:border-slate-500 outline-hidden transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-400 mb-1.5 text-xs">PIN Code (6 digits)</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={address.pincode}
                    onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-slate-200 rounded-xl focus:border-slate-500 outline-hidden transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-400 mb-1.5 text-xs">State</label>
                  <select
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-slate-200 rounded-xl focus:border-slate-500 outline-hidden transition-colors cursor-pointer"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s} className="bg-slate-800">{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-400 mb-1.5 text-xs">Landmark (Optional)</label>
                  <input
                    type="text"
                    value={address.landmark || ''}
                    onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
                    placeholder="Near Metro, Temple, etc."
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-slate-200 rounded-xl focus:border-slate-500 outline-hidden transition-colors"
                  />
                </div>
              </div>

              {/* Order preview bar */}
              <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 flex items-center justify-between text-sm">
                <div>
                  <span className="text-slate-500">Order Total:</span>{' '}
                  <strong className="text-slate-100 font-semibold">{formatINR(total)}</strong>
                </div>
                <div className="flex items-center gap-2 text-slate-400 font-medium text-xs">
                  <Truck className="w-4 h-4" /> Standard Delivery
                </div>
              </div>

              <button
                onClick={() => setStep('payment')}
                className="w-full py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-white text-slate-900 font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Continue to Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Payment */}
          {step === 'payment' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
                <div className="font-semibold text-slate-100 text-sm flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-xs flex items-center justify-center font-medium">2</span>
                  Select Payment Method
                </div>
                <button
                  onClick={() => setStep('address')}
                  className="text-xs text-slate-400 font-medium hover:text-slate-200 transition-colors"
                >
                  Edit Address
                </button>
              </div>

              {/* Amount bar */}
              <div className="p-5 rounded-xl bg-slate-800/30 border border-slate-700/50 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-medium mb-1">Amount to Pay (INR)</div>
                  <div className="text-2xl font-semibold text-slate-100">{formatINR(total)}</div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-900/20 text-emerald-500 border border-emerald-500/30">
                    <ShieldCheck className="w-4 h-4" /> Secure Payment
                  </span>
                  <div className="text-[10px] text-slate-500 mt-2 font-medium">Powered by ZapUPI Gateway</div>
                </div>
              </div>

              {/* Payment Methods Tabs */}
              <div className="space-y-3">
                {/* 1. ZapUPI Online Gateway */}
                <div
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    paymentMethod === 'upi'
                      ? 'border-slate-500 bg-slate-800/50'
                      : 'border-slate-700/50 bg-transparent hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Smartphone className={`w-5 h-5 ${paymentMethod === 'upi' ? 'text-slate-200' : 'text-slate-500'}`} />
                      <div>
                        <div className="text-sm font-medium text-slate-200">Instant UPI & QR Code (Recommended)</div>
                        <div className="text-xs text-slate-500 mt-0.5">Google Pay, PhonePe, Paytm, BHIM, Cred & Any UPI App</div>
                      </div>
                    </div>
                    <input
                      type="radio"
                      checked={paymentMethod === 'upi'}
                      onChange={() => setPaymentMethod('upi')}
                      className="accent-slate-200 w-4 h-4"
                    />
                  </div>

                  {paymentMethod === 'upi' && (
                    <div className="pt-4 mt-2 border-t border-slate-700/50 space-y-3">
                      <div className="p-3 rounded-lg bg-emerald-900/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center justify-between font-medium">
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Dynamic QR Code & Direct UPI Intent Powered by ZapUPI</span>
                        </span>
                        <span className="font-mono font-bold tracking-wider text-[11px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">0% Surcharge</span>
                      </div>
                      <p className="text-[11px] text-slate-400 px-1 leading-relaxed">
                        Click below to open the payment view to scan dynamic QR code, enter your UPI ID, or use any UPI app.
                      </p>
                    </div>
                  )}
                </div>

                {/* 2. Cash on Delivery (COD) */}
                <div
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    paymentMethod === 'cod'
                      ? 'border-slate-500 bg-slate-800/50'
                      : 'border-slate-700/50 bg-transparent hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Truck className={`w-5 h-5 ${paymentMethod === 'cod' ? 'text-slate-200' : 'text-slate-500'}`} />
                      <div>
                        <div className="text-sm font-medium text-slate-200">Cash on Delivery (COD)</div>
                        <div className="text-xs text-slate-500 mt-0.5">Pay via cash or UPI QR upon doorstep delivery</div>
                      </div>
                    </div>
                    <input
                      type="radio"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="accent-slate-200 w-4 h-4"
                    />
                  </div>
                </div>
              </div>

              {/* Pay Button */}
              <div className="pt-4">
                <button
                  onClick={handleInitiatePayment}
                  className="w-full py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-white text-slate-900 font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>{paymentMethod === 'cod' ? `Place COD Order (${formatINR(total)})` : `Pay with ZapUPI (${formatINR(total)})`}</span>
                </button>
                <p className="text-[10px] text-center text-slate-500 mt-3 font-medium">
                  By continuing, you agree to Bazaaro's Terms of Service and Privacy Policy.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Processing */}
          {step === 'processing' && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-slate-400 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-slate-100">Initializing ZapUPI Gateway</h4>
                <p className="text-sm text-slate-400 max-w-sm mt-2 mx-auto">
                  Generating dynamic QR code & secure UPI session. Please do not close or refresh this window.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3.5: UPI & QR Code Payment */}
          {step === 'upi_payment' && pendingOrder && upiData && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 py-2">
              <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
                <button
                  onClick={() => setStep('payment')}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Change Method
                </button>
                <div className="text-xs text-slate-400 font-mono">
                  Order: <strong className="text-slate-200">{pendingOrder.id}</strong>
                </div>
              </div>

              {/* Amount Display */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Amount Due</div>
                  <div className="text-2xl font-bold text-slate-100">{formatINR(pendingOrder.total)}</div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-900/20 text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" /> ZapUPI Secure
                  </span>
                </div>
              </div>

              {/* Dynamic QR Code Card */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-700/70 text-center space-y-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-center gap-2">
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <span>Scan Dynamic UPI QR Code</span>
                </div>

                <div className="inline-block p-3 bg-white rounded-2xl shadow-xl border border-slate-200">
                  <img
                    src={upiData.qrCodeUrl}
                    alt="ZapUPI Dynamic QR"
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain block mx-auto"
                  />
                </div>

                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Scan using <strong className="text-slate-200">Google Pay, PhonePe, Paytm, BHIM, Cred</strong> or any bank UPI app to pay ₹{pendingOrder.total.toLocaleString('en-IN')}.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300 font-mono flex items-center gap-2">
                    <span>UPI ID: {upiData.upiVpa}</span>
                    <button
                      type="button"
                      onClick={handleCopyVpa}
                      className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Copy UPI ID"
                    >
                      {copiedVpa ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {upiData.paymentUrl && (
                    <a
                      href={upiData.paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
                    >
                      <span>Open ZapUPI Page</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <a
                    href={upiData.upiIntentUrl}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-xs font-semibold text-emerald-300 flex items-center gap-1.5 transition-colors sm:hidden"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Pay in App</span>
                  </a>
                </div>
              </div>

              {/* Step 2: Enter 12-Digit Bank UTR / Reference ID */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-200">
                    Step 2: Enter 12-Digit Bank UTR / Reference No.
                  </label>
                  <span className="text-[11px] font-mono text-emerald-400">
                    {enteredUtr.length}/12 digits
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  After completing payment in Google Pay, PhonePe, or Paytm, copy the 12-digit <strong>UPI Ref No. / UTR</strong> from your transaction receipt and enter it here:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={12}
                    placeholder="e.g. 408712345678"
                    value={enteredUtr}
                    onChange={(e) => setEnteredUtr(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 text-slate-100 rounded-xl text-xs font-mono tracking-wider outline-hidden focus:border-emerald-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleConfirmUpiPayment}
                    disabled={isVerifyingPayment || enteredUtr.length !== 12}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-500/10"
                  >
                    {isVerifyingPayment ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Verifying...
                      </span>
                    ) : (
                      'Verify & Confirm'
                    )}
                  </button>
                </div>
                {checkoutError && (
                  <p className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg">
                    {checkoutError}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Order Placed Success */}
          {step === 'success' && placedOrder && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 py-4">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-900/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-100">
                  Order Placed Successfully.
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Your order has been confirmed.
                </p>
              </div>

              {/* Order Receipt Card */}
              <div className="p-5 rounded-xl bg-slate-800/30 border border-slate-700/50 text-xs space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-700/50">
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Order ID</div>
                    <div className="font-mono font-medium text-slate-200 text-sm">{placedOrder.id}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Payment Ref</div>
                    <div className="font-mono font-medium text-slate-300">{placedOrder.paymentId}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block mb-1">Deliver To:</span>
                    <strong className="text-slate-200">{placedOrder.address.fullName}</strong>
                    <div className="text-slate-400 mt-0.5">{placedOrder.address.city}, {placedOrder.address.pincode}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Delivery Partner & ETA:</span>
                    <strong className="text-slate-200">{placedOrder.courier}</strong>
                    <div className="text-emerald-400 font-medium mt-0.5">{placedOrder.estimatedDeliveryDate}</div>
                  </div>
                </div>

                <div className="pt-3 mt-1 border-t border-slate-700/50 flex justify-between font-semibold text-slate-100 text-sm">
                  <span>Amount Paid:</span>
                  <span>{formatINR(placedOrder.total)}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => printOrderReceipt(placedOrder)}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-200 text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print Receipt
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-white text-slate-900 text-sm font-semibold transition-colors cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
