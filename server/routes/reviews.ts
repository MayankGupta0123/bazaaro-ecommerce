import express, { Response } from 'express';
import mongoose from 'mongoose';
import { Review } from '../models/Review';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { User } from '../models/User';
import {
  authenticateToken,
  optionalAuth,
  AuthenticatedRequest,
} from '../middleware/auth';

const router = express.Router({ mergeParams: true });

/**
 * Recalculates average rating, total review count, and star distribution
 * for a product, and persists the aggregated statistics to the Product model.
 */
export async function updateProductRatingStats(productId: string) {
  const reviews = await Review.find({ productId }).sort({ createdAt: -1 });
  const totalReviews = reviews.length;

  const ratingDistribution: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  let averageRating = 0;

  if (totalReviews > 0) {
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    averageRating = Math.round((sum / totalReviews) * 10) / 10;

    for (const r of reviews) {
      const star = Math.max(1, Math.min(5, Math.round(r.rating)));
      ratingDistribution[star] = (ratingDistribution[star] || 0) + 1;
    }
  }

  // Update Product model document
  const queryOr: any[] = [{ id: productId }];
  if (mongoose.isValidObjectId(productId)) {
    queryOr.push({ _id: productId });
  }

  const product = await Product.findOne({ $or: queryOr });
  if (product) {
    if (totalReviews > 0) {
      product.rating = averageRating;
      product.reviewCount = totalReviews;
    } else {
      product.reviewCount = 0;
    }
    await product.save();
  }

  return {
    averageRating: totalReviews > 0 ? averageRating : (product?.rating || 0),
    totalReviews,
    ratingDistribution,
  };
}

/**
 * Helper to find a product by custom ID or Mongo _id
 */
async function findProduct(productId: string) {
  const queryOr: any[] = [{ id: productId }];
  if (mongoose.isValidObjectId(productId)) {
    queryOr.push({ _id: productId });
  }
  return Product.findOne({ $or: queryOr, isActive: { $ne: false } });
}

// ==========================================
// 1. GET /api/products/:productId/reviews
// ==========================================
router.get('/products/:productId/reviews', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const product = await findProduct(productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const reviews = await Review.find({ productId: product.id }).sort({ createdAt: -1 }).lean();

    const stats = await updateProductRatingStats(product.id);

    let userHasPurchased = false;
    let userReview = null;

    if (req.user?.userId) {
      // Check if user has an existing review
      userReview = reviews.find((r) => r.userId?.toString() === req.user?.userId) || null;

      // Check if user has a paid order for this product
      const paidOrder = await Order.findOne({
        userId: req.user.userId,
        paymentStatus: 'paid',
        $or: [
          { 'items.productId': product.id },
          { 'items.productId': product._id.toString() },
          { 'items.productRef': product._id },
        ],
      });

      userHasPurchased = Boolean(paidOrder);
    }

    return res.json({
      success: true,
      productId: product.id,
      productName: product.name,
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
      ratingDistribution: stats.ratingDistribution,
      reviews,
      userHasPurchased,
      userReview,
    });
  } catch (error: any) {
    console.error('[Get Product Reviews Error]', error);
    return res.status(500).json({ error: 'Failed to fetch reviews for product' });
  }
});

// ==========================================
// 2. POST /api/products/:productId/reviews
// ==========================================
router.post('/products/:productId/reviews', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const { rating, comment, title } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // 1. Validate Product exists
    const product = await findProduct(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // 2. Validate Rating
    if (rating === undefined || rating === null || !Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5 stars' });
    }
    const numRating = Number(rating);

    // 3. Validate Comment
    if (!comment || typeof comment !== 'string' || comment.trim().length < 5) {
      return res.status(400).json({ error: 'Review comment must be at least 5 characters long' });
    }
    if (comment.trim().length > 1000) {
      return res.status(400).json({ error: 'Review comment cannot exceed 1000 characters' });
    }

    // 4. Prevent Duplicate Reviews: Check if user already reviewed this product
    const existingReview = await Review.findOne({
      productId: product.id,
      userId,
    });
    if (existingReview) {
      return res.status(400).json({
        error: 'You have already submitted a review for this product. You can update your existing review.',
        reviewId: existingReview._id,
      });
    }

    // 5. Backend Purchase Verification: Verify customer has completed a paid order containing this product
    const paidOrder = await Order.findOne({
      userId,
      paymentStatus: 'paid',
      $or: [
        { 'items.productId': product.id },
        { 'items.productId': product._id.toString() },
        { 'items.productRef': product._id },
      ],
    });

    if (!paidOrder) {
      return res.status(403).json({
        error: 'Only verified purchasers who have completed a paid order for this product can submit a review.',
      });
    }

    // 6. User metadata lookup for reviewer name and city
    const userDoc = await User.findById(userId);
    const userName = userDoc?.name || req.user?.name || 'Verified Customer';
    const userCity = paidOrder.address?.city || userDoc?.addresses?.[0]?.city || 'India';

    // 7. Create Review document
    const newReview = await Review.create({
      productId: product.id,
      productRef: product._id,
      userId: new mongoose.Types.ObjectId(userId),
      userName,
      userCity,
      rating: numRating,
      title: title ? String(title).trim() : '',
      comment: comment.trim(),
      verifiedPurchase: true,
    });

    // 8. Re-aggregate product rating statistics
    const stats = await updateProductRatingStats(product.id);

    return res.status(201).json({
      success: true,
      message: 'Thank you! Your verified customer review has been published.',
      review: newReview,
      stats,
    });
  } catch (error: any) {
    console.error('[Create Review Error]', error);
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'You have already submitted a review for this product.',
      });
    }
    return res.status(500).json({ error: error.message || 'Failed to submit review' });
  }
});

// ==========================================
// 3. PUT /api/reviews/:id
// ==========================================
router.put('/reviews/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rating, comment, title } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid review ID format' });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Ownership check: Only owner or admin can edit
    if (userRole !== 'admin' && review.userId?.toString() !== userId) {
      return res.status(403).json({ error: 'You are not authorized to modify another customer’s review' });
    }

    // Validate rating if provided
    if (rating !== undefined) {
      if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
        return res.status(400).json({ error: 'Rating must be an integer between 1 and 5 stars' });
      }
      review.rating = Number(rating);
    }

    // Validate comment if provided
    if (comment !== undefined) {
      if (typeof comment !== 'string' || comment.trim().length < 5) {
        return res.status(400).json({ error: 'Review comment must be at least 5 characters long' });
      }
      if (comment.trim().length > 1000) {
        return res.status(400).json({ error: 'Review comment cannot exceed 1000 characters' });
      }
      review.comment = comment.trim();
    }

    if (title !== undefined) {
      review.title = String(title).trim();
    }

    await review.save();

    // Re-aggregate product stats
    const stats = await updateProductRatingStats(review.productId);

    return res.json({
      success: true,
      message: 'Review updated successfully',
      review,
      stats,
    });
  } catch (error: any) {
    console.error('[Update Review Error]', error);
    return res.status(500).json({ error: error.message || 'Failed to update review' });
  }
});

// ==========================================
// 4. DELETE /api/reviews/:id
// ==========================================
router.delete('/reviews/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid review ID format' });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Ownership check: Customer can delete own review, Admin can delete any review (moderation)
    if (userRole !== 'admin' && review.userId?.toString() !== userId) {
      return res.status(403).json({ error: 'You are not authorized to delete another customer’s review' });
    }

    const productId = review.productId;
    await Review.findByIdAndDelete(id);

    // Re-aggregate product stats
    const stats = await updateProductRatingStats(productId);

    return res.json({
      success: true,
      message: userRole === 'admin' ? 'Review removed by administrator' : 'Review deleted successfully',
      stats,
    });
  } catch (error: any) {
    console.error('[Delete Review Error]', error);
    return res.status(500).json({ error: error.message || 'Failed to delete review' });
  }
});

// Single review retrieval GET /api/reviews/:id
router.get('/reviews/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid review ID format' });
    }
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    return res.json({ success: true, review });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve review' });
  }
});

export default router;

