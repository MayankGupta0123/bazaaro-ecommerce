import React from 'react';
import { X, Package, Truck, CheckCircle2, Clock, MapPin, Printer, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { Order } from '../types';
import { formatINR } from '../utils/format';
import { printOrderReceipt } from '../utils/printReceipt';

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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-bazaaro-surface rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-700/50 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-slate-400" />
            <h3 className="font-semibold text-slate-100 text-lg tracking-wide">Order History</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {orders.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-5">
                <Package className="w-8 h-8 text-slate-400" />
              </div>
              <h4 className="text-lg font-semibold text-slate-200">No Orders Yet</h4>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                Place your first order to see it here.
              </p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="p-5 rounded-xl border border-slate-700/50 bg-slate-800/20 space-y-5"
              >
                {/* Order Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-700/50">
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">
                      ORDER ID
                    </span>
                    <span className="text-sm font-medium text-slate-200">{order.id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">
                      ORDER PLACED
                    </span>
                    <span className="text-sm text-slate-300 font-medium">{order.date}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">
                      TOTAL AMOUNT
                    </span>
                    <span className="text-sm font-semibold text-slate-100">{formatINR(order.total)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                      order.status === 'Cancelled'
                        ? 'bg-rose-50 text-rose-600 border-rose-200'
                        : order.status === 'Delivered'
                        ? 'bg-emerald-900/20 text-emerald-500 border-emerald-500/30'
                        : order.status === 'Placed'
                        ? 'bg-slate-800 text-slate-300 border-slate-700'
                        : 'bg-emerald-900/20 text-emerald-500 border-emerald-500/30'
                    }`}>
                      {order.status === 'Cancelled' ? (
                        <X className="w-3.5 h-3.5" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      {order.status}
                    </span>

                    {order.paymentStatus === 'paid' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-900/20 text-emerald-500 border border-emerald-500/30">
                        <ShieldCheck className="w-3.5 h-3.5" /> Paid
                      </span>
                    ) : order.paymentStatus === 'failed' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200">
                        <AlertCircle className="w-3.5 h-3.5" /> Payment Failed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        <Clock className="w-3.5 h-3.5" /> Payment Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-4 text-sm">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 object-contain rounded-xl bg-[#F5F5F7] mix-blend-multiply p-2 border border-slate-200/10 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-200 truncate mb-1">{item.product.name}</div>
                        <div className="text-xs text-slate-400">
                          Qty: {item.quantity} • <span className="text-slate-200 font-medium">{formatINR(item.product.price)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tracking Stepper */}
                {order.status !== 'Cancelled' && (
                  <div className="pt-4 border-t border-slate-700/50">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                      <span className="flex items-center gap-2 font-medium text-slate-300">
                        <Truck className="w-4 h-4 text-slate-400" />
                        Dispatched via {order.courier} (Tracking: {order.trackingNumber})
                      </span>
                      <span className="text-emerald-500 font-medium">ETA: {order.estimatedDeliveryDate}</span>
                    </div>

                    {/* Visual Stepper */}
                    <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                      <div className="space-y-1.5">
                        <div className="h-1.5 rounded-full bg-emerald-500"></div>
                        <span className="font-semibold text-slate-200">Confirmed</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className={`h-1.5 rounded-full ${['Packed', 'Dispatched', 'Out for Delivery', 'Delivered'].includes(order.status) ? 'bg-emerald-500' : 'bg-slate-800'}`}></div>
                        <span className={`font-semibold ${['Packed', 'Dispatched', 'Out for Delivery', 'Delivered'].includes(order.status) ? 'text-slate-200' : 'text-slate-500'}`}>Packed</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className={`h-1.5 rounded-full ${['Dispatched', 'Out for Delivery', 'Delivered'].includes(order.status) ? 'bg-emerald-500' : 'bg-slate-800'}`}></div>
                        <span className={`font-semibold ${['Dispatched', 'Out for Delivery', 'Delivered'].includes(order.status) ? 'text-slate-200' : 'text-slate-500'}`}>In Transit</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className={`h-1.5 rounded-full ${order.status === 'Delivered' ? 'bg-emerald-500' : 'bg-slate-800'}`}></div>
                        <span className={order.status === 'Delivered' ? 'text-slate-200 font-semibold' : 'text-slate-500'}>Delivered</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Address & Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-700/50 text-sm text-slate-400">
                  <div className="flex items-center gap-1.5 truncate text-xs">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Deliver to {order.address.city}, {order.address.pincode}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    {order.paymentStatus !== 'paid' && order.status !== 'Cancelled' && (
                      <div className="flex items-center gap-3">
                        {onPayOrder && (
                          <button
                            onClick={() => onPayOrder(order.id)}
                            className="text-slate-200 hover:text-white font-semibold text-xs cursor-pointer hover:underline flex items-center gap-1"
                          >
                            <span>Pay Now</span>
                          </button>
                        )}
                        {onVerifyPayment && (
                          <button
                            onClick={() => onVerifyPayment(order.id)}
                            className="text-slate-400 hover:text-slate-200 font-medium text-xs cursor-pointer hover:underline flex items-center gap-1.5"
                            title="Sync status with payment gateway"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Verify Status</span>
                          </button>
                        )}
                      </div>
                    )}
                    {onCancelOrder && ['Placed', 'Confirmed', 'Packed'].includes(order.status) && (
                      <button
                        onClick={() => onCancelOrder(order.id)}
                        className="text-rose-500 hover:text-rose-400 font-semibold text-xs cursor-pointer hover:underline"
                      >
                        Cancel Order
                      </button>
                    )}
                    <button
                      onClick={() => printOrderReceipt(order)}
                      className="text-slate-400 hover:text-slate-200 font-medium text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print</span>
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
