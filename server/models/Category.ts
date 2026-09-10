import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ICategory extends Document {
  key: string;
  label: string;
  iconName: string;
  description?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    key: {
      type: String,
      required: [true, 'Category key is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    label: {
      type: String,
      required: [true, 'Category label is required'],
      trim: true,
    },
    iconName: {
      type: String,
      required: [true, 'Icon name is required'],
      default: 'LayoutGrid',
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
