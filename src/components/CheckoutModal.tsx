import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Building,
  CheckCircle2,
  Lock,
  ArrowRight,
  Printer,
  Sparkles,
  Settings,
  HelpCircle,
  Truck,
  AlertCircle
} from 'lucide-react';
import { CartItem, Address, Order } from '../types';
import { formatINR } from '../utils/format';
import { INDIAN_STATES } from '../data/products';
import { BazaaroLogo } from './BazaaroLogo';

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

  const [step, setStep] = useState<'address' | 'payment' | 'processing' | 'success'>('address');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay_upi' | 'razorpay_card' | 'razorpay_netbanking' | 'cod'>('razorpay_upi');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'phonepe' | 'paytm'>('gpay');
  const [upiVpa, setUpiVpa] = useState('rahul@okhdfcbank');

  // Test card states
  const [cardNumber, setCardNumber] = useState('4111 1111 1111 1111');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [cardHolder, setCardHolder] = useState('RAHUL SHARMA');

  // Razorpay configuration state
  const [razorpayKeyId, setRazorpayKeyId] = useState<string>('');
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState('');
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  useEffect(() => {
    // Fetch razorpay key config from backend
    fetch('/api/payment/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.razorpayKeyId) {
          setRazorpayKeyId(data.razorpayKeyId);
        }
      })
      .catch((err) => console.log('Payment config fetch error:', err));
  }, []);

  if (!isOpen) return null;

  const gstAmount = Math.round((total * 18) / 118);

  const handleSaveCustomKey = () => {
    setRazorpayKeyId(customKeyInput.trim());
    setShowKeyConfig(false);
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

      setPlacedOrder(formattedOrder);
      onOrderPlaced(formattedOrder);

      // If online payment via ZapUPI, initiate payment session and redirect
      if (!isCod) {
        const payRes = await fetch('/api/payment/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ orderId: serverOrder.orderId }),
        });

        const payData = await payRes.json();

        if (!payRes.ok || !payData.paymentUrl) {
          setCheckoutError(payData.error || payData.message || 'Failed to initialize ZapUPI payment gateway');
          setStep('payment');
          return;
        }

        // Redirect customer to ZapUPI's payment_url
        window.location.href = payData.paymentUrl;
        return;
      }

      setStep('success');
    } catch (err: any) {
      setCheckoutError(err.message || 'Network error placing order');
      setStep('address');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <BazaaroLogo size="sm" iconOnly theme="dark" />
            <div>
              <h3 className="text-sm font-bold">Bazaaro Secure Checkout</h3>
              <p className="text-[10px] text-slate-300">ZapUPI Payment Gateway (INR ₹)</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 text-amber-300 text-[11px] font-semibold px-2.5 py-1 rounded-lg">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>ZapUPI Verified</span>
            </div>
            {step !== 'processing' && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {checkoutError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{checkoutError}</span>
              </div>
              {!token && onRequireAuth && (
                <button
                  type="button"
                  onClick={onRequireAuth}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs shrink-0 cursor-pointer"
                >
                  Sign In
                </button>
              )}
            </div>
          )}

          {/* STEP 1: Address */}
          {step === 'address' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center">1</span>
                  Delivery Address in India
                </div>
                <span className="text-xs text-slate-400">Step 1 of 2</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={address.fullName}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile (+91)</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-2.5 rounded-l-xl border border-r-0 border-slate-300 bg-slate-100 text-slate-500 text-xs">
                      +91
                    </span>
                    <input
                      type="text"
                      maxLength={10}
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value.replace(/\D/g, '') })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-r-xl focus:border-amber-500 outline-hidden"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Flat / House No., Apartment, Street</label>
                  <input
                    type="text"
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PIN Code (6 digits)</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={address.pincode}
                    onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State</label>
                  <select
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 outline-hidden bg-white"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Landmark (Optional)</label>
                  <input
                    type="text"
                    value={address.landmark || ''}
                    onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
                    placeholder="Near Metro, Temple, etc."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Order preview bar */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">Order Total:</span>{' '}
                  <strong className="text-slate-900 text-sm">{formatINR(total)}</strong>
                </div>
                <div className="flex items-center gap-1 text-emerald-600 font-medium">
                  <Truck className="w-3.5 h-3.5" /> Express Dispatch
                </div>
              </div>

              <button
                onClick={() => setStep('payment')}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Continue to ZapUPI Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Payment */}
          {step === 'payment' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center">2</span>
                  Select Payment Method (ZapUPI Gateway)
                </div>
                <button
                  onClick={() => setStep('address')}
                  className="text-xs text-amber-600 font-semibold hover:underline"
                >
                  Edit Address
                </button>
              </div>

              {/* Amount bar */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">Payable Amount (INR)</div>
                  <div className="text-2xl font-black text-slate-900">{formatINR(total)}</div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-200 text-amber-900">
                    <ShieldCheck className="w-3.5 h-3.5" /> ZapUPI Gateway
                  </span>
                  <div className="text-[10px] text-slate-500 mt-1">256-Bit SSL Encrypted</div>
                </div>
              </div>

              {/* Payment Methods Tabs */}
              <div className="space-y-2.5">
                {/* 1. UPI */}
                <div
                  onClick={() => setPaymentMethod('razorpay_upi')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    paymentMethod === 'razorpay_upi'
                      ? 'border-amber-500 bg-amber-50/20 ring-1 ring-amber-500/30'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <Smartphone className="w-5 h-5 text-amber-600" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">Instant UPI (Recommended)</div>
                        <div className="text-[11px] text-slate-500">Google Pay, PhonePe, Paytm, BHIM</div>
                      </div>
                    </div>
                    <input
                      type="radio"
                      checked={paymentMethod === 'razorpay_upi'}
                      onChange={() => setPaymentMethod('razorpay_upi')}
                      className="accent-amber-600"
                    />
                  </div>

                  {paymentMethod === 'razorpay_upi' && (
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <div className="flex gap-2">
                        {(['gpay', 'phonepe', 'paytm'] as const).map((app) => (
                          <button
                            key={app}
                            type="button"
                            onClick={() => setSelectedUpiApp(app)}
                            className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-semibold capitalize transition-all ${
                              selectedUpiApp === app
                                ? 'border-amber-500 bg-white shadow-xs text-amber-900'
                                : 'border-slate-200 bg-slate-50 text-slate-600'
                            }`}
                          >
                            {app === 'gpay' ? 'Google Pay' : app === 'phonepe' ? 'PhonePe' : 'Paytm UPI'}
                          </button>
                        ))}
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">Enter UPI ID (VPA)</label>
                        <input
                          type="text"
                          value={upiVpa}
                          onChange={(e) => setUpiVpa(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-hidden focus:border-amber-500 bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Test Cards */}
                <div
                  onClick={() => setPaymentMethod('razorpay_card')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    paymentMethod === 'razorpay_card'
                      ? 'border-amber-500 bg-amber-50/20 ring-1 ring-amber-500/30'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="w-5 h-5 text-amber-600" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">Credit / Debit Card (Razorpay Test Card)</div>
                        <div className="text-[11px] text-slate-500">Visa, Mastercard, RuPay, Maestro</div>
                      </div>
                    </div>
                    <input
                      type="radio"
                      checked={paymentMethod === 'razorpay_card'}
                      onChange={() => setPaymentMethod('razorpay_card')}
                      className="accent-amber-600"
                    />
                  </div>

                  {paymentMethod === 'razorpay_card' && (
                    <div className="pt-3 border-t border-slate-100 space-y-2.5 text-xs">
                      <div className="p-2 rounded-lg bg-slate-100 text-[11px] text-slate-600 flex items-center justify-between">
                        <span>Razorpay Test Card pre-filled</span>
                        <span className="font-mono font-bold">OTP: 123456</span>
                      </div>
                      <div>
                        <label className="block font-medium text-slate-600 mb-1">Card Number</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono bg-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-medium text-slate-600 mb-1">Valid Thru</label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono bg-white"
                          />
                        </div>
                        <div>
                          <label className="block font-medium text-slate-600 mb-1">CVV</label>
                          <input
                            type="password"
                            maxLength={4}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Netbanking */}
                <div
                  onClick={() => setPaymentMethod('razorpay_netbanking')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    paymentMethod === 'razorpay_netbanking'
                      ? 'border-amber-500 bg-amber-50/20 ring-1 ring-amber-500/30'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Building className="w-5 h-5 text-amber-600" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">Netbanking</div>
                        <div className="text-[11px] text-slate-500">HDFC, ICICI, SBI, Axis, Kotak</div>
                      </div>
                    </div>
                    <input
                      type="radio"
                      checked={paymentMethod === 'razorpay_netbanking'}
                      onChange={() => setPaymentMethod('razorpay_netbanking')}
                      className="accent-amber-600"
                    />
                  </div>
                </div>
              </div>

              {/* Pay Button */}
              <div className="pt-2">
                <button
                  onClick={handleInitiatePayment}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Pay {formatINR(total)} via ZapUPI</span>
                </button>
                <p className="text-[10px] text-center text-slate-400 mt-2">
                  🔒 256-bit encrypted transaction • Instant UPI confirmation
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Processing */}
          {step === 'processing' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-amber-200 border-t-amber-600 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-amber-600">
                  ₹
                </div>
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Redirecting to ZapUPI Gateway...</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Creating secure payment session and reserving inventory from Bazaaro warehouse. Please do not close or refresh this window.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: Order Placed Success */}
          {step === 'success' && placedOrder && (
            <div className="space-y-5 animate-in fade-in zoom-in-95">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Payment Completed via ZapUPI
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  Shandaar! Your Order has been Placed.
                </h3>
                <p className="text-xs text-slate-600">
                  Thank you for shopping at Bazaaro — <em>Sab kuch, ek bazaar mein.</em>
                </p>
              </div>

              {/* Order Receipt Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Order ID</div>
                    <div className="font-mono font-bold text-slate-900 text-sm">{placedOrder.id}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Payment ID</div>
                    <div className="font-mono font-bold text-slate-700">{placedOrder.paymentId}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Deliver To:</span>
                    <strong className="text-slate-800">{placedOrder.address.fullName}</strong>
                    <div className="text-slate-600">{placedOrder.address.city}, {placedOrder.address.pincode}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Courier & ETA:</span>
                    <strong className="text-slate-800">{placedOrder.courier}</strong>
                    <div className="text-emerald-700 font-semibold">{placedOrder.estimatedDeliveryDate}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                  <span>Total Amount Paid (INR):</span>
                  <span className="text-amber-600 font-black">{formatINR(placedOrder.total)}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print Tax Invoice
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
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
