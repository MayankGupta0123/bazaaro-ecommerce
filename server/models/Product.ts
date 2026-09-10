import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IProduct extends Document {
  id: string; // custom ID like 'p1', 'p2' matching existing frontend data
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockCount: number;
  fastDelivery: string;
  tags: string[];
  specs: Record<string, string>;
  images: string[];
  description: string;
  warranty: string;
  emiStarting: number;
  madeInIndia?: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    id: {
      type: String,
      required: [true, 'Product custom ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      index: 'text',
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
      index: true,
    },
    originalPrice: {
      type: Number,
      required: [true, 'Original price is required'],
      min: [0, 'Original price cannot be negative'],
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    inStock: {
      type: Boolean,
      default: true,
      index: true,
    },
    stockCount: {
      type: Number,
      default: 10,
      min: 0,
    },
    fastDelivery: {
      type: String,
      default: 'Get it within 24-48 Hours',
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    specs: {
      type: Map,
      of: String,
      default: {},
    },
    images: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    warranty: {
      type: String,
      default: '1 Year Brand Domestic Warranty in India',
    },
    emiStarting: {
      type: Number,
      default: 0,
    },
    madeInIndia: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret: any) {
        // Convert specs Map to standard object if needed
        if (ret.specs instanceof Map) {
          ret.specs = Object.fromEntries(ret.specs);
        }
        return ret;
      },
    },
  }
);

// Compound index for fast filtering and sorting
ProductSchema.index({ category: 1, price: 1 });
ProductSchema.index({ brand: 1, price: 1 });

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
