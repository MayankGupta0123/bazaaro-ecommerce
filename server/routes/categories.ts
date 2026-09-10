import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Category } from '../models/Category';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();

// GET /api/categories - Public list of active categories
router.get('/', async (_req: Request, res: Response) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1 }).lean();

    return res.json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error: any) {
    console.error('[Categories List Error]', error);
    return res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/categories - Protected (Admin only) create category
router.post('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { key, label, iconName, description, displayOrder } = req.body;

    if (!key || !label) {
      return res.status(400).json({ error: 'Category key and label are required' });
    }

    const normalizedKey = key.trim().toLowerCase();

    const existing = await Category.findOne({ key: normalizedKey });
    if (existing) {
      return res.status(400).json({ error: 'A category with this key already exists' });
    }

    const newCategory = await Category.create({
      key: normalizedKey,
      label: label.trim(),
      iconName: iconName || 'LayoutGrid',
      description: description ? description.trim() : '',
      displayOrder: displayOrder !== undefined ? Number(displayOrder) : 0,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: 'Category created successfully in MongoDB',
      category: newCategory,
    });
  } catch (error: any) {
    console.error('[Create Category Error]', error);
    return res.status(500).json({ error: error.message || 'Failed to create category' });
  }
});

// PUT /api/categories/:id - Protected (Admin only) update category
router.put('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const queryOr: any[] = [{ key: id }];
    if (mongoose.isValidObjectId(id)) {
      queryOr.push({ _id: id });
    }

    const updated = await Category.findOneAndUpdate({ $or: queryOr }, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Category not found to update' });
    }

    return res.json({
      success: true,
      message: 'Category updated successfully',
      category: updated,
    });
  } catch (error: any) {
    console.error('[Update Category Error]', error);
    return res.status(500).json({ error: error.message || 'Failed to update category' });
  }
});

// DELETE /api/categories/:id - Protected (Admin only) delete category
router.delete('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const queryOr: any[] = [{ key: id }];
    if (mongoose.isValidObjectId(id)) {
      queryOr.push({ _id: id });
    }

    const deleted = await Category.findOneAndDelete({ $or: queryOr });

    if (!deleted) {
      return res.status(404).json({ error: 'Category not found to delete' });
    }

    return res.json({
      success: true,
      message: 'Category deleted successfully from MongoDB',
      deletedKey: deleted.key,
    });
  } catch (error: any) {
    console.error('[Delete Category Error]', error);
    return res.status(500).json({ error: error.message || 'Failed to delete category' });
  }
});

export default router;
