import Expense from '../models/Expense.js';
import Budget from '../models/Budget.js';

export async function getExpenses(req, res, next) {
  try {
    const query = { user: req.user._id };
    const { month, category, page = 1, limit = 50 } = req.query;

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const start = new Date(`${month}-01T00:00:00.000Z`);
      const end = new Date(start);
      end.setUTCMonth(end.getUTCMonth() + 1);
      query.date = { $gte: start, $lt: end };
    }

    if (category) {
      query.category = category;
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);

    const [expenses, total] = await Promise.all([
      Expense.find(query)
        .populate('category', 'name color icon')
        .sort({ date: -1, createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Expense.countDocuments(query),
    ]);

    res.status(200).json({ expenses, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (error) {
    next(error);
  }
}

export async function getExpenseById(req, res, next) {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id }).populate(
      'category',
      'name color icon'
    );
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.status(200).json({ expense });
  } catch (error) {
    next(error);
  }
}

export async function createExpense(req, res, next) {
  try {
    const { amount, category, date, note } = req.body;

    if (!amount || !category || !date) {
      return res.status(400).json({ message: 'Amount, category and date are required' });
    }

    const expense = await Expense.create({
      amount,
      category,
      date: new Date(date),
      note,
      user: req.user._id,
    });

    const populated = await expense.populate('category', 'name color icon');
    res.status(201).json({ expense: populated });
  } catch (error) {
    next(error);
  }
}

export async function updateExpense(req, res, next) {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const { amount, category, date, note } = req.body;
    if (amount !== undefined) expense.amount = amount;
    if (category !== undefined) expense.category = category;
    if (date !== undefined) expense.date = new Date(date);
    if (note !== undefined) expense.note = note;

    await expense.save();
    await expense.populate('category', 'name color icon');
    res.status(200).json({ expense });
  } catch (error) {
    next(error);
  }
}

export async function deleteExpense(req, res, next) {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.status(200).json({ message: 'Expense deleted' });

    await Budget.updateMany(
      { user: req.user._id, category: expense.category },
      { $inc: { spent: -expense.amount } }
    ).catch(() => {});
  } catch (error) {
    next(error);
  }
}
