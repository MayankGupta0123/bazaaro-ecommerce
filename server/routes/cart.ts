import express, { Response } from 'express';
import mongoose from 'mongoose';
import { Cart } from '../models/Cart';
import { Product } from '../models/Product';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth';

const router = express.Router();

// Helper to retrieve and populate user cart with full product documents
async function getPopulatedCart(userId: string | mongoose.Types.ObjectId) {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }

  const productIds = cart.items.map((i) => i.productId);
  const products = await Product.find({
    $or: [
      { id: { $in: productIds } },
      { _id: { $in: productIds.filter((id) => mongoose.isValidObjectId(id)) } },
    ],
  }).lean();

  const productMap = new Map<string, any>();
  products.forEach((p) => {
    productMap.set(p.id, p);
    productMap.set(p._id.toString(), p);
  });

  const formattedItems: any[] = [];
  let subtotal = 0;
  let itemCount = 0;

  for (const item of cart.items) {
    const product = productMap.get(item.productId);
    if (product) {
      formattedItems.push({
        product,
        quantity: item.quantity,
      });
      subtotal += product.price * item.quantity;
      itemCount += item.quantity;
    }
  }

  return {
    items: formattedItems,
    couponCode: cart.couponCode || '',
    itemCount,
    subtotal,
  };
}

// GET /api/cart - Protected: Fetch user cart
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cartData = await getPopulatedCart(req.user!.userId);
    return res.json({
      success: true,
      cart: cartData,
    });
  } catch (error: any) {
    console.error('[Get Cart Error]', error);
    return res.status(500).json({ error: 'Failed to retrieve user cart' });
  }
});

// POST /api/cart/items - Protected: Add item to cart
router.post('/items', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive number' });
    }

    // Look up product in MongoDB
    const queryOr: any[] = [{ id: productId }];
    if (mongoose.isValidObjectId(productId)) {
      queryOr.push({ _id: productId });
    }

    const product = await Product.findOne({ $or: queryOr, isActive: { $ne: false } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!product.inStock) {
      return res.status(400).json({ error: 'Product is currently out of stock' });
    }

    let cart = await Cart.findOne({ userId: req.user!.userId });
    if (!cart) {
      cart = await Cart.create({ userId: req.user!.userId, items: [] });
    }

    const existingItem = cart.items.find((i) => i.productId === product.id || i.productId === product._id.toString());
    const currentQty = existingItem ? existingItem.quantity : 0;
    const requestedTotal = currentQty + qty;

    // Validate available stock limit
    if (product.stockCount !== undefined && product.stockCount > 0 && requestedTotal > product.stockCount) {
      return res.status(400).json({
        error: `Cannot add ${qty} item(s). Total in bag (${requestedTotal}) would exceed available stock of ${product.stockCount}.`,
      });
    }

    if (existingItem) {
      existingItem.quantity = requestedTotal;
    } else {
      cart.items.push({
        productId: product.id,
        productRef: product._id as any,
        quantity: qty,
        priceAtAddition: product.price,
      });
    }

    await cart.save();

    const cartData = await getPopulatedCart(req.user!.userId);
    return res.status(201).json({
      success: true,
      message: 'Item added to cart',
      cart: cartData,
    });
  } catch (error: any) {
    console.error('[Add Cart Item Error]', error);
    return res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// PUT /api/cart/items/:productId - Protected: Update item quantity
router.put('/items/:productId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    const qty = parseInt(quantity);
    if (isNaN(qty)) {
      return res.status(400).json({ error: 'Invalid quantity provided' });
    }

    let cart = await Cart.findOne({ userId: req.user!.userId });
    if (!cart) {
      cart = await Cart.create({ userId: req.user!.userId, items: [] });
    }

    // If quantity is 0 or negative, remove item
    if (qty <= 0) {
      cart.items = cart.items.filter((i) => i.productId !== productId) as any;
      await cart.save();
      const cartData = await getPopulatedCart(req.user!.userId);
      return res.json({
        success: true,
        message: 'Item removed from cart',
        cart: cartData,
      });
    }

    // Check stock limit for the product
    const queryOr: any[] = [{ id: productId }];
    if (mongoose.isValidObjectId(productId)) {
      queryOr.push({ _id: productId });
    }
    const product = await Product.findOne({ $or: queryOr });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.stockCount !== undefined && product.stockCount > 0 && qty > product.stockCount) {
      return res.status(400).json({
        error: `Requested quantity (${qty}) exceeds available stock of ${product.stockCount}.`,
      });
    }

    const item = cart.items.find((i) => i.productId === productId);
    if (item) {
      item.quantity = qty;
    } else {
      cart.items.push({
        productId: product.id,
        productRef: product._id as any,
        quantity: qty,
        priceAtAddition: product.price,
      });
    }

    await cart.save();

    const cartData = await getPopulatedCart(req.user!.userId);
    return res.json({
      success: true,
      message: 'Cart quantity updated',
      cart: cartData,
    });
  } catch (error: any) {
    console.error('[Update Cart Error]', error);
    return res.status(500).json({ error: 'Failed to update cart quantity' });
  }
});

// DELETE /api/cart/items/:productId - Protected: Remove single item
router.delete('/items/:productId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId } = req.params;

    let cart = await Cart.findOne({ userId: req.user!.userId });
    if (!cart) {
      cart = await Cart.create({ userId: req.user!.userId, items: [] });
    }

    cart.items = cart.items.filter((i) => i.productId !== productId) as any;
    await cart.save();

    const cartData = await getPopulatedCart(req.user!.userId);
    return res.json({
      success: true,
      message: 'Item removed from cart',
      cart: cartData,
    });
  } catch (error: any) {
    console.error('[Remove Cart Item Error]', error);
    return res.status(500).json({ error: 'Failed to remove item from cart' });
  }
});

// DELETE /api/cart - Protected: Clear entire cart
router.delete('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    let cart = await Cart.findOne({ userId: req.user!.userId });
    if (cart) {
      cart.items = [] as any;
      cart.couponCode = undefined;
      await cart.save();
    }

    return res.json({
      success: true,
      message: 'Cart cleared successfully',
      cart: {
        items: [],
        couponCode: '',
        itemCount: 0,
        subtotal: 0,
      },
    });
  } catch (error: any) {
    console.error('[Clear Cart Error]', error);
    return res.status(500).json({ error: 'Failed to clear cart' });
  }
});

export default router;
