import Budget from '../models/Budget.js';
import Expense from '../models/Expense.js';

export async function getBudgets(req, res, next) {
  try {
    const { month } = req.query;
    const query = { user: req.user._id };

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      query.month = month;
    }

    const budgets = await Budget.find(query).populate('category', 'name color icon');

    for (const budget of budgets) {
      const start = new Date(`${budget.month}-01T00:00:00.000Z`);
      const end = new Date(start);
      end.setUTCMonth(end.getUTCMonth() + 1);

      const [result] = await Expense.aggregate([
        { $match: { user: req.user._id, category: budget.category._id, date: { $gte: start, $lt: end } } },
        { $group: { _id: null, spent: { $sum: '$amount' } } },
      ]);
      budget._doc.spent = result ? result.spent : 0;
    }

    res.status(200).json({ budgets });
  } catch (error) {
    next(error);
  }
}

export async function createOrUpdateBudget(req, res, next) {
  try {
    const { category, month, amount } = req.body;

    if (!category || !month || !amount) {
      return res.status(400).json({ message: 'Category, month and amount are required' });
    }

    const budget = await Budget.findOneAndUpdate(
      { user: req.user._id, category, month },
      { amount },
      { new: true, upsert: true }
    ).populate('category', 'name color icon');

    res.status(200).json({ budget });
  } catch (error) {
    next(error);
  }
}

export async function deleteBudget(req, res, next) {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    res.status(200).json({ message: 'Budget deleted' });
  } catch (error) {
    next(error);
  }
}
