import Expense from '../models/Expense.js';
import Budget from '../models/Budget.js';

export async function getMonthlySummary(req, res, next) {
  try {
    const { month } = req.query;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ message: 'A month in YYYY-MM format is required' });
    }

    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);

    const [totalResult, byCategory, budgets, topExpenses] = await Promise.all([
      Expense.aggregate([
        { $match: { user: req.user._id, date: { $gte: start, $lt: end } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: { user: req.user._id, date: { $gte: start, $lt: end } } },
        { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'cat' } },
        { $unwind: '$cat' },
        {
          $group: {
            _id: '$cat._id',
            name: { $first: '$cat.name' },
            color: { $first: '$cat.color' },
            icon: { $first: '$cat.icon' },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]),
      Budget.find({ user: req.user._id, month }).populate('category', 'name color icon'),
      Expense.find({ user: req.user._id, date: { $gte: start, $lt: end } })
        .sort({ amount: -1 })
        .limit(5)
        .populate('category', 'name color icon'),
    ]);

    const budgetsWithSpent = budgets.map((b) => {
      const catSpent = byCategory.find((c) => String(c._id) === String(b.category?._id));
      return {
        ...b.toObject(),
        spent: catSpent ? catSpent.total : 0,
      };
    });

    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = totalResult.length ? totalResult[0].total : 0;

    res.status(200).json({
      month,
      totalSpent,
      totalBudget,
      remaining: totalBudget - totalSpent,
      byCategory,
      budgets: budgetsWithSpent,
      topExpenses,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTrends(req, res, next) {
  try {
    const { months = 6 } = req.query;
    const count = Math.min(Math.max(parseInt(months, 10) || 6, 1), 24);

    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (count - 1), 1));

    const trends = await Expense.aggregate([
      { $match: { user: req.user._id, date: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({ trends });
  } catch (error) {
    next(error);
  }
}
