import React from 'react';
import { X, Package, Truck, CheckCircle2, Clock, MapPin, Printer, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { Order } from '../types';
import { formatINR } from '../utils/format';

interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onCancelOrder?: (orderId: string) => Promise<void> | void;
  onVerifyPayment?: (orderId: string) => Promise<void> | void;
  onPayOrder?: (orderId: string) => Promise<void> | void;
}

export const OrdersModal: React.FC<OrdersModalProps> = ({
  isOpen,
  onClose,
  orders,
  onCancelOrder,
  onVerifyPayment,
  onPayOrder,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-base">Your Bazaaro Orders</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Package className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-800">No Orders Placed Yet</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                When you purchase electronics using Razorpay test mode, your orders and real-time shipment status will appear here!
              </p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-xs"
              >
                {/* Order Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      ORDER ID
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900">{order.id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      ORDER DATE
                    </span>
                    <span className="text-xs text-slate-600 font-medium">{order.date}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      TOTAL (INR)
                    </span>
                    <span className="text-xs font-black text-amber-600">{formatINR(order.total)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      order.status === 'Cancelled'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : order.status === 'Delivered'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : order.status === 'Placed'
                        ? 'bg-amber-50 text-amber-800 border border-amber-300'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {order.status === 'Cancelled' ? (
                        <X className="w-3 h-3" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      {order.status}
                    </span>

                    {order.paymentStatus === 'paid' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="w-3 h-3" /> Paid (ZapUPI)
                      </span>
                    ) : order.paymentStatus === 'failed' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertCircle className="w-3 h-3" /> Unpaid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Clock className="w-3 h-3" /> Payment Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-3 text-xs">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 object-contain rounded-lg bg-slate-50 p-1 border border-slate-100"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-800 truncate">{item.product.name}</div>
                        <div className="text-[11px] text-slate-500">
                          Qty: {item.quantity} • {formatINR(item.product.price)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tracking Stepper */}
                {order.status !== 'Cancelled' && (
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Truck className="w-3.5 h-3.5 text-amber-600" />
                        Shipped via {order.courier} (AWB: {order.trackingNumber})
                      </span>
                      <span className="text-emerald-700 font-bold">ETA: {order.estimatedDeliveryDate}</span>
                    </div>

                    {/* Visual Stepper */}
                    <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                      <div className="space-y-1">
                        <div className="h-1.5 rounded-full bg-emerald-500"></div>
                        <span className="font-bold text-slate-800">Confirmed</span>
                      </div>
                      <div className="space-y-1">
                        <div className={`h-1.5 rounded-full ${['Packed', 'Dispatched', 'Out for Delivery', 'Delivered'].includes(order.status) ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                        <span className="font-bold text-slate-800">Packed</span>
                      </div>
                      <div className="space-y-1">
                        <div className={`h-1.5 rounded-full ${['Dispatched', 'Out for Delivery', 'Delivered'].includes(order.status) ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                        <span className="font-semibold text-slate-600">In Transit</span>
                      </div>
                      <div className="space-y-1">
                        <div className={`h-1.5 rounded-full ${order.status === 'Delivered' ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                        <span className="text-slate-400">Delivered</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Address & Actions */}
                <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1 truncate text-[11px]">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>Deliver to {order.address.city}, {order.address.pincode}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {order.paymentStatus !== 'paid' && order.status !== 'Cancelled' && (
                      <div className="flex items-center gap-2">
                        {onPayOrder && (
                          <button
                            onClick={() => onPayOrder(order.id)}
                            className="text-amber-600 hover:text-amber-700 font-bold text-xs cursor-pointer hover:underline flex items-center gap-1"
                          >
                            <span>Pay with ZapUPI</span>
                          </button>
                        )}
                        {onVerifyPayment && (
                          <button
                            onClick={() => onVerifyPayment(order.id)}
                            className="text-slate-600 hover:text-slate-800 font-medium text-xs cursor-pointer hover:underline flex items-center gap-1"
                            title="Sync status with ZapUPI gateway"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Verify Status</span>
                          </button>
                        )}
                      </div>
                    )}
                    {onCancelOrder && ['Placed', 'Confirmed', 'Packed'].includes(order.status) && (
                      <button
                        onClick={() => onCancelOrder(order.id)}
                        className="text-rose-600 hover:text-rose-700 font-semibold text-xs cursor-pointer hover:underline"
                      >
                        Cancel Order
                      </button>
                    )}
                    <button
                      onClick={() => window.print()}
                      className="text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Invoice</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
