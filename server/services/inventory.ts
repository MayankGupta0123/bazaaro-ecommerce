import mongoose from 'mongoose';
import { IOrder } from '../models/Order';
import { Product } from '../models/Product';

/**
 * Safely and atomically reduces warehouse inventory for all products in a paid order.
 * - Prevents stock from becoming negative ($gte: item.quantity).
 * - Updates inStock flag to false if stockCount reaches 0.
 * - Atomic at the MongoDB document level.
 */
export async function safelyDeductInventoryForOrder(order: IOrder): Promise<{
  success: boolean;
  deductedCount: number;
  warnings: string[];
}> {
  let deductedCount = 0;
  const warnings: string[] = [];

  for (const item of order.items) {
    const qty = Math.max(1, Number(item.quantity) || 1);

    const queryOr: any[] = [{ id: item.productId }];
    if (mongoose.isValidObjectId(item.productId)) {
      queryOr.push({ _id: item.productId });
    }

    try {
      // Atomic reduction preventing negative stock
      const updatedProduct = await Product.findOneAndUpdate(
        {
          $or: queryOr,
          stockCount: { $gte: qty },
        },
        {
          $inc: { stockCount: -qty },
        },
        { new: true }
      );

      if (updatedProduct) {
        deductedCount++;
        // If stock drops to zero or below, mark as out of stock
        if (updatedProduct.stockCount <= 0) {
          await Product.updateOne(
            { _id: updatedProduct._id },
            { inStock: false, stockCount: 0 }
          );
        }
      } else {
        // Fallback: product had undefined/null stockCount or less than required
        // Check current product
        const prod = await Product.findOne({ $or: queryOr });
        if (prod) {
          const currentStock = prod.stockCount || 0;
          const newStock = Math.max(0, currentStock - qty);
          await Product.updateOne(
            { _id: prod._id },
            {
              stockCount: newStock,
              inStock: newStock > 0,
            }
          );
          deductedCount++;
          warnings.push(`Stock adjusted with fallback for ${item.productId}`);
        } else {
          warnings.push(`Product not found during stock deduction: ${item.productId}`);
        }
      }
    } catch (err: any) {
      warnings.push(`Failed to decrement stock for ${item.productId}: ${err.message}`);
    }
  }

  return {
    success: deductedCount > 0,
    deductedCount,
    warnings,
  };
}
