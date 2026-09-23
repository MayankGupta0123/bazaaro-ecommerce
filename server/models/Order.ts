import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IOrderItem {
  productId: string;
  productRef?: mongoose.Types.ObjectId;
  name: string;
  brand: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface IOrderAddress {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  type: 'home' | 'work';
}

export interface IOrder extends Document {
  orderId: string; // e.g. BZ-IND-2026-8942
  userId?: mongoose.Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  discount: number;
  couponDiscount: number;
  couponCode?: string;
  deliveryFee: number;
  gstAmount: number;
  total: number;
  address: IOrderAddress;
  paymentMethod: string;
  paymentId: string;
  zapupiOrderId?: string;
  zapupiTxnId?: string;
  utr?: string;
  paidAt?: Date;
  paymentEnvironment?: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  status: 'Placed' | 'Confirmed' | 'Packed' | 'Dispatched' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  courier: string;
  trackingNumber: string;
  estimatedDeliveryDate: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: String, required: true },
    productRef: { type: Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    brand: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String },
  },
  { _id: true }
);

const OrderAddressSchema = new Schema<IOrderAddress>(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: { type: String },
    type: { type: String, enum: ['home', 'work'], default: 'home' },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderId: {
      type: String,
      required: [true, 'Order ID is required'],
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    items: [OrderItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    couponDiscount: {
      type: Number,
      default: 0,
    },
    couponCode: {
      type: String,
      trim: true,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    gstAmount: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    address: {
      type: OrderAddressSchema,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentId: {
      type: String,
      required: true,
      index: true,
    },
    zapupiOrderId: {
      type: String,
      index: true,
      sparse: true,
    },
    zapupiTxnId: {
      type: String,
      index: true,
      sparse: true,
    },
    utr: {
      type: String,
    },
    paidAt: {
      type: Date,
    },
    paymentEnvironment: {
      type: String,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    status: {
      type: String,
      enum: ['Placed', 'Confirmed', 'Packed', 'Dispatched', 'Out for Delivery', 'Delivered', 'Cancelled'],
      default: 'Placed',
      index: true,
    },
    courier: {
      type: String,
      default: 'BlueDart Express',
    },
    trackingNumber: {
      type: String,
      default: () => `BD${Math.floor(100000000 + Math.random() * 900000000)}IN`,
    },
    estimatedDeliveryDate: {
      type: String,
      default: 'Within 24-48 Hours',
    },
  },
  {
    timestamps: true,
  }
);

export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
