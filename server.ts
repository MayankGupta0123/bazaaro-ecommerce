import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { handleAiShoppingAdvice } from './server/services/aiAdvisor';
import { connectDB, isDbConnected } from './server/config/db';
import { seedDatabaseIfEmpty } from './server/utils/seed';
import authRoutes from './server/routes/auth';
import productRoutes from './server/routes/products';
import categoryRoutes from './server/routes/categories';
import cartRoutes from './server/routes/cart';
import wishlistRoutes from './server/routes/wishlist';
import orderRoutes from './server/routes/orders';
import paymentRoutes from './server/routes/payment';
import adminRoutes from './server/routes/admin';
import reviewRoutes from './server/routes/reviews';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api', reviewRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    store: 'Bazaaro',
    tagline: 'Sab kuch, ek bazaar mein.',
    currency: 'INR',
    region: 'India',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    hasRazorpayKey: Boolean(process.env.RAZORPAY_KEY_ID || process.env.ZAPUPI_KEY_ID),
    hasDatabaseConnection: isDbConnected(),
    databaseStatus: isDbConnected() ? 'connected' : 'disconnected (set MONGODB_URI in .env)',
  });
});

// AI Shopping Assistant chat endpoint (Bazaaro Dost - Gemini & Live MongoDB Grounded)
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const advice = await handleAiShoppingAdvice(messages);
    return res.json({
      success: true,
      reply: advice.reply,
      recommendedProductIds: advice.recommendedProductIds,
      recommendedProducts: advice.recommendedProducts,
    });
  } catch (error: any) {
    console.error('[AI Chat Error]', error);
    return res.status(500).json({
      error: 'Failed to process AI shopping request',
      reply: 'Namaste! I encountered a momentary glitch. Please feel free to ask me again or browse our curated electronics below!',
    });
  }
});

async function startServer() {
  // Connect to MongoDB
  try {
    const dbConnected = await connectDB();
    if (dbConnected) {
      await seedDatabaseIfEmpty();
    }
  } catch (dbError: any) {
    console.warn('[MongoDB Startup Error]', dbError.message);
  }

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bazaaro Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
