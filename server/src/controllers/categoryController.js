import Category from '../models/Category.js';
import Expense from '../models/Expense.js';
import Budget from '../models/Budget.js';

export async function getCategories(req, res, next) {
  try {
    const categories = await Category.find({ user: req.user._id }).sort({ name: 1 });
    res.status(200).json({ categories });
  } catch (error) {
    next(error);
  }
}

export async function createCategory(req, res, next) {
  try {
    const { name, color, icon } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const existing = await Category.findOne({ user: req.user._id, name });
    if (existing) {
      return res.status(409).json({ message: 'A category with this name already exists' });
    }

    const category = await Category.create({ name, color, icon, user: req.user._id });
    res.status(201).json({ category });
  } catch (error) {
    next(error);
  }
}

export async function updateCategory(req, res, next) {
  try {
    const category = await Category.findOne({ _id: req.params.id, user: req.user._id });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    Object.assign(category, req.body);
    await category.save();
    res.status(200).json({ category });
  } catch (error) {
    next(error);
  }
}

export async function deleteCategory(req, res, next) {
  try {
    const category = await Category.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await Expense.deleteMany({ category: category._id });
    await Budget.deleteMany({ category: category._id });

    res.status(200).json({ message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
}
