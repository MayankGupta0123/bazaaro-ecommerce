import express, { Response } from 'express';
import mongoose from 'mongoose';
import { Wishlist } from '../models/Wishlist';
import { Product } from '../models/Product';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth';

const router = express.Router();

// Helper to retrieve populated wishlist
async function getPopulatedWishlist(userId: string | mongoose.Types.ObjectId) {
  let wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({ userId, productIds: [] });
  }

  const products = await Product.find({
    $or: [
      { id: { $in: wishlist.productIds } },
      { _id: { $in: wishlist.productIds.filter((id) => mongoose.isValidObjectId(id)) } },
    ],
    isActive: { $ne: false },
  }).lean();

  return products;
}

// GET /api/wishlist - Protected: Get user wishlist
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const products = await getPopulatedWishlist(req.user!.userId);
    return res.json({
      success: true,
      count: products.length,
      wishlist: products,
    });
  } catch (error: any) {
    console.error('[Get Wishlist Error]', error);
    return res.status(500).json({ error: 'Failed to retrieve wishlist' });
  }
});

// POST /api/wishlist/:productId - Protected: Add product to wishlist
router.post('/:productId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId } = req.params;

    // Validate product exists in MongoDB
    const queryOr: any[] = [{ id: productId }];
    if (mongoose.isValidObjectId(productId)) {
      queryOr.push({ _id: productId });
    }
    const product = await Product.findOne({ $or: queryOr, isActive: { $ne: false } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    let wishlist = await Wishlist.findOne({ userId: req.user!.userId });
    if (!wishlist) {
      wishlist = await Wishlist.create({ userId: req.user!.userId, productIds: [] });
    }

    // Prevent duplicate entries
    const alreadySaved = wishlist.productIds.includes(product.id) || wishlist.productIds.includes(product._id.toString());
    if (!alreadySaved) {
      wishlist.productIds.push(product.id);
      wishlist.productRefs.push(product._id as any);
      await wishlist.save();
    }

    const populated = await getPopulatedWishlist(req.user!.userId);
    return res.status(alreadySaved ? 200 : 201).json({
      success: true,
      message: alreadySaved ? 'Product already in wishlist' : 'Product added to wishlist',
      wishlist: populated,
    });
  } catch (error: any) {
    console.error('[Add Wishlist Error]', error);
    return res.status(500).json({ error: 'Failed to add product to wishlist' });
  }
});

// DELETE /api/wishlist/:productId - Protected: Remove product from wishlist
router.delete('/:productId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId } = req.params;

    let wishlist = await Wishlist.findOne({ userId: req.user!.userId });
    if (!wishlist) {
      wishlist = await Wishlist.create({ userId: req.user!.userId, productIds: [] });
    }

    wishlist.productIds = wishlist.productIds.filter((id) => id !== productId);
    wishlist.productRefs = wishlist.productRefs.filter((ref) => ref.toString() !== productId) as any;
    await wishlist.save();

    const populated = await getPopulatedWishlist(req.user!.userId);
    return res.json({
      success: true,
      message: 'Product removed from wishlist',
      wishlist: populated,
    });
  } catch (error: any) {
    console.error('[Remove Wishlist Error]', error);
    return res.status(500).json({ error: 'Failed to remove product from wishlist' });
  }
});

export default router;
