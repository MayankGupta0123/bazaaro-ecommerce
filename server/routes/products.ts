import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();

// GET /api/products - Public listing with search, filters, sort, pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      rating,
      onlyInStock,
      onlyMadeInIndia,
      sortBy = 'featured',
      page = '1',
      limit = '50',
    } = req.query;

    const query: any = { isActive: { $ne: false } };

    // 1. Category Filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // 2. Brand Filter
    if (brand && typeof brand === 'string' && brand.trim()) {
      query.brand = brand.trim();
    }

    // 3. Search Query
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, 'i');
      query.$or = [
        { name: regex },
        { brand: regex },
        { category: regex },
        { tags: { $in: [regex] } },
        { description: regex },
      ];
    }

    // 4. Price Range Filter (in INR)
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // 5. Minimum Rating Filter
    if (rating) {
      query.rating = { $gte: Number(rating) };
    }

    // 6. In-Stock Filter
    if (onlyInStock === 'true') {
      query.inStock = true;
    }

    // 7. Made In India Filter
    if (onlyMadeInIndia === 'true') {
      query.madeInIndia = true;
    }

    // 8. Sorting
    let sort: any = { createdAt: -1 };
    switch (sortBy) {
      case 'price-asc':
        sort = { price: 1 };
        break;
      case 'price-desc':
        sort = { price: -1 };
        break;
      case 'rating':
        sort = { rating: -1 };
        break;
      case 'discount':
        sort = { discountPercent: -1 };
        break;
      case 'featured':
      default:
        sort = { rating: -1, reviewCount: -1 };
        break;
    }

    // 9. Pagination
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 50));
    const skip = (pageNum - 1) * limitNum;

    // Execute queries in parallel
    const [products, total, availableBrands] = await Promise.all([
      Product.find(query).sort(sort).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(query),
      Product.distinct('brand', { isActive: { $ne: false } }),
    ]);

    return res.json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      products,
      availableBrands,
    });
  } catch (error: any) {
    console.error('[Products List Error]', error);
    return res.status(500).json({ error: 'Failed to fetch products from database' });
  }
});

// GET /api/products/:id - Public single product details by custom ID or Mongo _id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const queryOr: any[] = [{ id }];
    if (mongoose.isValidObjectId(id)) {
      queryOr.push({ _id: id });
    }

    const product = await Product.findOne({ $or: queryOr, isActive: { $ne: false } }).lean();

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json({
      success: true,
      product,
    });
  } catch (error: any) {
    console.error('[Product Detail Error]', error);
    return res.status(500).json({ error: 'Failed to retrieve product details' });
  }
});

// POST /api/products - Protected (Admin only) create product
router.post('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const productData = req.body;

    if (!productData.name || !productData.price || !productData.category || !productData.brand) {
      return res.status(400).json({
        error: 'Product name, brand, category, and price are required fields',
      });
    }

    // Auto-assign custom id if not provided
    if (!productData.id) {
      productData.id = `p_${Date.now().toString(36)}`;
    }

    // Ensure originalPrice exists for Mongoose validation
    if (!productData.originalPrice && productData.price) {
      productData.originalPrice = productData.price;
    }

    // Calculate discount percent if not provided
    if (productData.originalPrice && productData.price && !productData.discountPercent) {
      productData.discountPercent = Math.round(
        ((productData.originalPrice - productData.price) / productData.originalPrice) * 100
      );
    }

    const newProduct = await Product.create(productData);

    return res.status(201).json({
      success: true,
      message: 'Product created successfully in MongoDB',
      product: newProduct,
    });
  } catch (error: any) {
    console.error('[Create Product Error]', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'A product with this custom ID already exists' });
    }
    return res.status(500).json({ error: error.message || 'Failed to create product' });
  }
});

// PUT /api/products/:id - Protected (Admin only) update product
router.put('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const queryOr: any[] = [{ id }];
    if (mongoose.isValidObjectId(id)) {
      queryOr.push({ _id: id });
    }

    // Recalculate discount percent if prices are updated
    if (updateData.originalPrice && updateData.price) {
      updateData.discountPercent = Math.round(
        ((updateData.originalPrice - updateData.price) / updateData.originalPrice) * 100
      );
    }

    const updatedProduct = await Product.findOneAndUpdate({ $or: queryOr }, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found to update' });
    }

    return res.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct,
    });
  } catch (error: any) {
    console.error('[Update Product Error]', error);
    return res.status(500).json({ error: error.message || 'Failed to update product' });
  }
});

// DELETE /api/products/:id - Protected (Admin only) delete product
router.delete('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const queryOr: any[] = [{ id }];
    if (mongoose.isValidObjectId(id)) {
      queryOr.push({ _id: id });
    }

    const deletedProduct = await Product.findOneAndDelete({ $or: queryOr });

    if (!deletedProduct) {
      return res.status(404).json({ error: 'Product not found to delete' });
    }

    return res.json({
      success: true,
      message: 'Product deleted successfully from MongoDB',
      deletedId: deletedProduct.id,
    });
  } catch (error: any) {
    console.error('[Delete Product Error]', error);
    return res.status(500).json({ error: error.message || 'Failed to delete product' });
  }
});

export default router;
