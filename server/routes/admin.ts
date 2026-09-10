import express, { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest, authenticateToken, requireAdmin } from '../middleware/auth';
import { User } from '../models/User';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { Review } from '../models/Review';
import { updateProductRatingStats } from './reviews';

const router = express.Router();

// Strict Security: All routes in /api/admin require valid JWT and admin role
router.use(authenticateToken, requireAdmin);

/**
 * GET /api/admin/stats
 * Complete dashboard analytics and statistics calculated from MongoDB Atlas.
 * Revenue is strictly calculated from verified paid orders only.
 */
router.get('/stats', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const [
      totalUsers,
      totalProducts,
      totalCategories,
      totalOrders,
      paidOrdersCount,
      pendingPaymentsCount,
      cancelledOrdersCount,
      lowStockProducts,
      totalReviews,
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments({ isActive: { $ne: false } }),
      Category.countDocuments({ isActive: { $ne: false } }),
      Order.countDocuments(),
      Order.countDocuments({ paymentStatus: 'paid' }),
      Order.countDocuments({ paymentStatus: 'pending' }),
      Order.countDocuments({ status: 'Cancelled' }),
      Product.find({ stockCount: { $lte: 10 } })
        .select('id name brand price stockCount inStock category images')
        .limit(10)
        .lean(),
      Review.countDocuments(),
    ]);

    // Calculate revenue from verified paid orders ONLY
    const revenueAggregation = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' } } },
    ]);
    const totalRevenue = revenueAggregation[0]?.totalRevenue || 0;

    // Orders breakdown by fulfillment status
    const statusAggregation = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const ordersByStatus: Record<string, number> = {};
    for (const item of statusAggregation) {
      if (item._id) ordersByStatus[item._id] = item.count;
    }

    // Top selling products from verified paid orders
    const topProductsAggregation = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          brand: { $first: '$items.brand' },
          unitsSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { unitsSold: -1 } },
      { $limit: 5 },
    ]);

    // Recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    return res.json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        totalCategories,
        totalOrders,
        paidOrders: paidOrdersCount,
        pendingPayments: pendingPaymentsCount,
        cancelledOrders: cancelledOrdersCount,
        totalRevenue,
        totalReviews,
        lowStockCount: lowStockProducts.length,
        lowStockProducts,
        ordersByStatus,
        topSellingProducts: topProductsAggregation,
        recentOrders,
      },
    });
  } catch (error: any) {
    console.error('[Admin Stats Error]', error);
    return res.status(500).json({ error: 'Failed to compute dashboard analytics' });
  }
});

/**
 * GET /api/admin/users
 * Lists users with optional search and order count.
 */
router.get('/users', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search } = req.query;
    const query: any = {};

    if (search && typeof search === 'string') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 }).lean();

    // Attach order counts
    const userIds = users.map((u) => u._id);
    const orderCounts = await Order.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
    ]);

    const countMap = new Map<string, number>();
    for (const oc of orderCounts) {
      if (oc._id) countMap.set(oc._id.toString(), oc.count);
    }

    const enrichedUsers = users.map((u) => ({
      ...u,
      orderCount: countMap.get(u._id.toString()) || 0,
    }));

    return res.json({
      success: true,
      count: enrichedUsers.length,
      users: enrichedUsers,
    });
  } catch (error: any) {
    console.error('[Admin Users Error]', error);
    return res.status(500).json({ error: 'Failed to retrieve user list' });
  }
});

/**
 * PUT /api/admin/users/:id/role
 * Updates user role (customer <-> admin) with safety safeguards.
 * Prevents demoting the last admin or locking oneself out without other admins.
 */
router.put('/users/:id/role', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['customer', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either "customer" or "admin"' });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Safety guard: if demoting an admin, ensure there is at least one other active admin
    if (targetUser.role === 'admin' && role === 'customer') {
      const activeAdminCount = await User.countDocuments({
        role: 'admin',
        isActive: { $ne: false },
      });

      if (activeAdminCount <= 1) {
        return res.status(400).json({
          error: 'Action blocked: Cannot demote the last remaining administrator on the platform',
        });
      }
    }

    targetUser.role = role;
    await targetUser.save();

    return res.json({
      success: true,
      message: `User role updated to "${role}" successfully`,
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
    });
  } catch (error: any) {
    console.error('[Admin Update Role Error]', error);
    return res.status(500).json({ error: 'Failed to update user role' });
  }
});

/**
 * PUT /api/admin/users/:id/status
 * Enable or disable a user account.
 * Safeguard: Cannot disable own admin account.
 */
router.put('/users/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean' });
    }

    // Safeguard: Prevent disabling self
    if (id === req.user!.userId && !isActive) {
      return res.status(400).json({ error: 'Action blocked: You cannot disable your own active account' });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    targetUser.isActive = isActive;
    await targetUser.save();

    return res.json({
      success: true,
      message: `User account has been ${isActive ? 'activated' : 'blocked'} successfully`,
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        isActive: targetUser.isActive,
      },
    });
  } catch (error: any) {
    console.error('[Admin Update User Status Error]', error);
    return res.status(500).json({ error: 'Failed to update user status' });
  }
});

/**
 * GET /api/admin/orders
 * Complete order list with search, fulfillment status filter, and payment status filter.
 */
router.get('/orders', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, status, paymentStatus } = req.query;
    const query: any = {};

    if (status && typeof status === 'string' && status !== 'all') {
      query.status = status;
    }

    if (paymentStatus && typeof paymentStatus === 'string' && paymentStatus !== 'all') {
      query.paymentStatus = paymentStatus;
    }

    if (search && typeof search === 'string') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { orderId: regex },
        { 'address.fullName': regex },
        { 'address.phone': regex },
        { 'address.city': regex },
        { trackingNumber: regex },
        { zapupiTxnId: regex },
      ];
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

    return res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error: any) {
    console.error('[Admin Orders Error]', error);
    return res.status(500).json({ error: 'Failed to retrieve orders list' });
  }
});

/**
 * GET /api/admin/orders/:id
 * Retrieve full order details.
 */
router.get('/orders/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const queryOr: any[] = [{ orderId: id }];
    if (mongoose.isValidObjectId(id)) {
      queryOr.push({ _id: id });
    }

    const order = await Order.findOne({ $or: queryOr }).lean();
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json({
      success: true,
      order,
    });
  } catch (error: any) {
    console.error('[Admin Order Detail Error]', error);
    return res.status(500).json({ error: 'Failed to retrieve order' });
  }
});

/**
 * PUT /api/admin/orders/:id/status
 * Update order fulfillment status.
 * Safeguard: Payment status CANNOT be manually set to 'paid' by admin.
 */
router.put('/orders/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      'Placed',
      'Confirmed',
      'Packed',
      'Dispatched',
      'Out for Delivery',
      'Delivered',
      'Cancelled',
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}`,
      });
    }

    const queryOr: any[] = [{ orderId: id }];
    if (mongoose.isValidObjectId(id)) {
      queryOr.push({ _id: id });
    }

    const order = await Order.findOne({ $or: queryOr });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.status = status;
    await order.save();

    return res.json({
      success: true,
      message: `Order status updated to "${status}"`,
      order,
    });
  } catch (error: any) {
    console.error('[Admin Update Order Status Error]', error);
    return res.status(500).json({ error: 'Failed to update order status' });
  }
});

/**
 * Product Management Admin Endpoints
 */
router.post('/products', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      brand,
      category,
      price,
      originalPrice,
      discountPercent,
      stockCount = 10,
      inStock = true,
      description = '',
      images = [],
      specs = {},
      fastDelivery = 'Express Delivery',
      warranty = '1 Year Official Warranty',
      madeInIndia = false,
      tags = [],
    } = req.body;

    if (!name?.trim() || !brand?.trim() || !category?.trim() || price === undefined) {
      return res.status(400).json({ error: 'Name, brand, category, and price are required' });
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ error: 'Price must be a non-negative number' });
    }

    const customId = `p_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const product = await Product.create({
      id: customId,
      name: name.trim(),
      brand: brand.trim(),
      category: category.trim().toLowerCase(),
      price: numPrice,
      originalPrice: originalPrice ? Number(originalPrice) : numPrice,
      discountPercent: discountPercent ? Number(discountPercent) : 0,
      rating: 4.5,
      reviewCount: 1,
      inStock: Boolean(inStock),
      stockCount: Number(stockCount) || 0,
      fastDelivery,
      warranty,
      madeInIndia: Boolean(madeInIndia),
      description,
      images: Array.isArray(images) && images.length > 0 ? images : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'],
      specs: specs || {},
      tags: Array.isArray(tags) ? tags : [],
      emiStarting: Math.round(numPrice / 12),
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    });
  } catch (error: any) {
    console.error('[Admin Create Product Error]', error);
    return res.status(500).json({ error: error.message || 'Failed to create product' });
  }
});

router.put('/products/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const queryOr: any[] = [{ id }];
    if (mongoose.isValidObjectId(id)) {
      queryOr.push({ _id: id });
    }

    const product = await Product.findOne({ $or: queryOr });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const {
      name,
      brand,
      category,
      price,
      originalPrice,
      discountPercent,
      stockCount,
      inStock,
      description,
      images,
      specs,
      warranty,
      fastDelivery,
      madeInIndia,
      isActive,
    } = req.body;

    if (name !== undefined) product.name = name.trim();
    if (brand !== undefined) product.brand = brand.trim();
    if (category !== undefined) product.category = category.trim().toLowerCase();
    if (price !== undefined) {
      const p = Number(price);
      if (p >= 0) {
        product.price = p;
        product.emiStarting = Math.round(p / 12);
      }
    }
    if (originalPrice !== undefined) product.originalPrice = Number(originalPrice);
    if (discountPercent !== undefined) product.discountPercent = Number(discountPercent);
    if (stockCount !== undefined) {
      product.stockCount = Number(stockCount);
      if (product.stockCount <= 0) product.inStock = false;
    }
    if (inStock !== undefined) product.inStock = Boolean(inStock);
    if (description !== undefined) product.description = description;
    if (images !== undefined && Array.isArray(images)) product.images = images;
    if (specs !== undefined) product.specs = specs;
    if (warranty !== undefined) product.warranty = warranty;
    if (fastDelivery !== undefined) product.fastDelivery = fastDelivery;
    if (madeInIndia !== undefined) product.madeInIndia = Boolean(madeInIndia);
    if (isActive !== undefined) product.isActive = Boolean(isActive);

    await product.save();

    return res.json({
      success: true,
      message: 'Product updated successfully',
      product,
    });
  } catch (error: any) {
    console.error('[Admin Update Product Error]', error);
    return res.status(500).json({ error: error.message || 'Failed to update product' });
  }
});

router.delete('/products/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const queryOr: any[] = [{ id }];
    if (mongoose.isValidObjectId(id)) {
      queryOr.push({ _id: id });
    }

    const product = await Product.findOne({ $or: queryOr });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Soft delete by setting isActive: false
    product.isActive = false;
    await product.save();

    return res.json({
      success: true,
      message: 'Product deleted successfully',
      productId: product.id,
    });
  } catch (error: any) {
    console.error('[Admin Delete Product Error]', error);
    return res.status(500).json({ error: 'Failed to delete product' });
  }
});

/**
 * Category Management Admin Endpoints
 */
router.post('/categories', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { key, label, iconName = 'LayoutGrid', description = '', displayOrder = 0 } = req.body;

    if (!key?.trim() || !label?.trim()) {
      return res.status(400).json({ error: 'Category key and label are required' });
    }

    const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '-');
    const existing = await Category.findOne({ key: cleanKey });
    if (existing) {
      return res.status(400).json({ error: `Category key "${cleanKey}" already exists` });
    }

    const category = await Category.create({
      key: cleanKey,
      label: label.trim(),
      iconName,
      description,
      displayOrder: Number(displayOrder) || 0,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category,
    });
  } catch (error: any) {
    console.error('[Admin Create Category Error]', error);
    return res.status(500).json({ error: error.message || 'Failed to create category' });
  }
});

router.put('/categories/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const queryOr: any[] = [{ key: id }];
    if (mongoose.isValidObjectId(id)) {
      queryOr.push({ _id: id });
    }

    const category = await Category.findOne({ $or: queryOr });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const { label, iconName, description, displayOrder, isActive } = req.body;
    if (label !== undefined) category.label = label.trim();
    if (iconName !== undefined) category.iconName = iconName.trim();
    if (description !== undefined) category.description = description;
    if (displayOrder !== undefined) category.displayOrder = Number(displayOrder);
    if (isActive !== undefined) category.isActive = Boolean(isActive);

    await category.save();

    return res.json({
      success: true,
      message: 'Category updated successfully',
      category,
    });
  } catch (error: any) {
    console.error('[Admin Update Category Error]', error);
    return res.status(500).json({ error: error.message || 'Failed to update category' });
  }
});

router.delete('/categories/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const queryOr: any[] = [{ key: id }];
    if (mongoose.isValidObjectId(id)) {
      queryOr.push({ _id: id });
    }

    const category = await Category.findOne({ $or: queryOr });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    category.isActive = false;
    await category.save();

    return res.json({
      success: true,
      message: 'Category deactivated successfully',
      categoryKey: category.key,
    });
  } catch (error: any) {
    console.error('[Admin Delete Category Error]', error);
    return res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ==========================================
// 6. Review Moderation Endpoints
// ==========================================

/**
 * GET /api/admin/reviews
 * List all customer reviews with product and user details for moderation.
 */
router.get('/reviews', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, rating, page = '1', limit = '50' } = req.query;

    const query: any = {};

    if (rating && !isNaN(Number(rating))) {
      query.rating = Number(rating);
    }

    if (search && typeof search === 'string' && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { userName: regex },
        { userCity: regex },
        { title: regex },
        { comment: regex },
        { productId: regex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      Review.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Review.countDocuments(query),
    ]);

    // Enrich with product names
    const productIds = Array.from(new Set(reviews.map((r) => r.productId)));
    const products = await Product.find({ id: { $in: productIds } }).select('id name images brand').lean();
    const productMap = new Map<string, any>();
    for (const p of products) {
      productMap.set(p.id, p);
    }

    const enrichedReviews = reviews.map((r) => {
      const prod = productMap.get(r.productId);
      return {
        ...r,
        productName: prod?.name || `Product #${r.productId}`,
        productBrand: prod?.brand || '',
        productImage: prod?.images?.[0] || '',
      };
    });

    return res.json({
      success: true,
      count: enrichedReviews.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      reviews: enrichedReviews,
    });
  } catch (error: any) {
    console.error('[Admin Get Reviews Error]', error);
    return res.status(500).json({ error: 'Failed to fetch reviews for moderation' });
  }
});

/**
 * DELETE /api/admin/reviews/:id
 * Moderate/remove an inappropriate review.
 */
router.delete('/reviews/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid review ID format' });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found to moderate' });
    }

    const productId = review.productId;
    await Review.findByIdAndDelete(id);

    // Re-aggregate product stats
    const stats = await updateProductRatingStats(productId);

    return res.json({
      success: true,
      message: 'Review removed by administrator',
      stats,
    });
  } catch (error: any) {
    console.error('[Admin Moderate Review Error]', error);
    return res.status(500).json({ error: 'Failed to remove review' });
  }
});

export default router;

