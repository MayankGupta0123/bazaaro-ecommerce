import bcrypt from 'bcryptjs';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { CATEGORIES, PRODUCTS } from '../../src/data/products';

export async function seedDatabaseIfEmpty(): Promise<void> {
  try {
    // 1. Seed Categories
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      console.log('[Seed] Populating initial categories into MongoDB...');
      const categoryDocs = CATEGORIES.filter((c) => c.key !== 'all').map((cat, idx) => ({
        key: cat.key,
        label: cat.label,
        iconName: cat.iconName,
        isActive: true,
        displayOrder: idx + 1,
      }));
      await Category.insertMany(categoryDocs);
      console.log(`[Seed] Seeded ${categoryDocs.length} categories successfully.`);
    }

    // 2. Seed Products (Idempotent: populate initial or sync newly added products)
    const existingProducts = await Product.find({}, 'id').lean();
    const existingIdSet = new Set(existingProducts.map((p) => p.id));
    const missingProducts = PRODUCTS.filter((prod) => !existingIdSet.has(prod.id));

    if (missingProducts.length > 0) {
      console.log(`[Seed] Populating ${missingProducts.length} new electronic products into MongoDB...`);
      const productDocs = missingProducts.map((prod) => ({
        id: prod.id,
        name: prod.name,
        brand: prod.brand,
        category: prod.category,
        price: prod.price,
        originalPrice: prod.originalPrice,
        discountPercent: prod.discountPercent,
        rating: prod.rating,
        reviewCount: prod.reviewCount,
        inStock: prod.inStock,
        stockCount: prod.stockCount || 15,
        fastDelivery: prod.fastDelivery,
        tags: prod.tags,
        specs: prod.specs,
        images: prod.images,
        description: prod.description,
        warranty: prod.warranty,
        emiStarting: prod.emiStarting,
        madeInIndia: prod.madeInIndia || false,
        isActive: true,
      }));
      await Product.insertMany(productDocs);
      console.log(`[Seed] Seeded ${productDocs.length} new products successfully.`);
    }

    // Sync updated images for all products to MongoDB
    const bulkOps = PRODUCTS.map((prod) => ({
      updateOne: {
        filter: { id: prod.id },
        update: {
          $set: {
            images: prod.images,
          },
        },
      },
    }));
    if (bulkOps.length > 0) {
      await Product.bulkWrite(bulkOps);
      console.log(`[Seed] Synced verified product images across ${bulkOps.length} products.`);
    }

    // 3. Seed Users (Default Admin & Customer for easy evaluation)
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Seed] Creating initial admin and demo customer in MongoDB...');
      const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
      const customerPasswordHash = await bcrypt.hash('Customer@123', 10);

      await User.create([
        {
          name: 'Bazaaro Administrator',
          email: 'admin@bazaaro.in',
          password: adminPasswordHash,
          role: 'admin',
          phone: '9876500001',
          addresses: [],
        },
        {
          name: 'Rahul Sharma',
          email: 'rahul@bazaaro.in',
          password: customerPasswordHash,
          role: 'customer',
          phone: '9876543210',
          addresses: [
            {
              fullName: 'Rahul Sharma',
              phone: '9876543210',
              street: 'Flat 402, Lotus Grandeur, 14th Main',
              city: 'Bengaluru',
              state: 'Karnataka',
              pincode: '560001',
              landmark: 'Near Indiranagar Metro',
              type: 'home',
              isDefault: true,
            },
          ],
        },
      ]);
      console.log('[Seed] Seeded initial Admin (admin@bazaaro.in) and Customer (rahul@bazaaro.in).');
    }
  } catch (error: any) {
    console.warn('[Seed Warning] Could not complete database seeding:', error.message);
  }
}
