import { useState, useEffect } from 'react';
import { api, formatCurrency, formatDate, currentMonth } from '../lib/api.js';
import { useCategories } from '../hooks/useCategories.js';
import { useExpenses } from '../hooks/useExpenses.js';

const emptyForm = { amount: '', category: '', date: new Date().toISOString().slice(0, 10), note: '' };

export default function Expenses() {
  const [month, setMonth] = useState(currentMonth());
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [budgets, setBudgets] = useState([]);
  const { categories } = useCategories();
  const { expenses, loading, addExpense, reload } = useExpenses(month);

  // Load budgets for current month to detect budget limits
  useEffect(() => {
    const loadBudgets = async () => {
      try {
        const data = await api.get(`/budgets?month=${month}`);
        setBudgets(data.budgets || []);
      } catch (e) {
        // non-blocking
      }
    };
    loadBudgets();
  }, [month]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await addExpense(form);
      setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 10) });
      // Refresh budgets to get updated spent amounts
      const data = await api.get(`/budgets?month=${month}`);
      setBudgets(data.budgets || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Find the budget for currently selected category
  const selectedBudget = budgets.find((b) => b.category?._id === form.category);
  const inputAmount = parseFloat(form.amount) || 0;
  const currentSpent = selectedBudget?.spent || 0;
  const budgetLimit = selectedBudget?.amount || 0;
  const projectedTotal = currentSpent + inputAmount;
  const isOverBudget = selectedBudget && projectedTotal > budgetLimit;
  const overAmount = projectedTotal - budgetLimit;

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      await reload();
    } catch (err) {
      alert(err.message);
    }
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Add Expense</h2>
          {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                name="amount"
                required
                value={form.amount}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
              <select
                name="category"
                required
                value={form.category}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              >
                <option value="">Select category</option>
                {categories.map((c) => {
                  const b = budgets.find((item) => item.category?._id === c._id);
                  return (
                    <option key={c._id} value={c._id}>
                      {c.name} {b ? `(Budget: ${formatCurrency(b.amount)})` : ''}
                    </option>
                  );
                })}
              </select>
              {selectedBudget && (
                <p className="mt-1 text-xs text-gray-500">
                  Current spent: {formatCurrency(currentSpent)} / {formatCurrency(budgetLimit)}
                </p>
              )}
            </div>

            {isOverBudget && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 animate-pulse">
                <div className="flex items-start gap-2">
                  <span className="text-base">⚠️</span>
                  <div>
                    <p className="font-semibold text-amber-900">Budget Warning!</p>
                    <p className="mt-0.5 text-amber-800">
                      Adding this expense will exceed the monthly budget of{' '}
                      <strong>{formatCurrency(budgetLimit)}</strong> for this category by{' '}
                      <strong className="text-red-700">{formatCurrency(overAmount)}</strong>.
                    </p>
                    <p className="mt-1 text-[11px] text-amber-700">
                      Projected total: {formatCurrency(projectedTotal)} ({Math.round((projectedTotal / budgetLimit) * 100)}%)
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                name="date"
                required
                value={form.date}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Note (optional)</label>
              <input
                type="text"
                name="note"
                value={form.note}
                onChange={handleChange}
                placeholder="Add a note"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className={`w-full rounded-md px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 ${
                isOverBudget ? 'bg-amber-600 hover:bg-amber-700' : 'bg-brand-600 hover:bg-brand-700'
              }`}
            >
              {submitting ? 'Adding...' : isOverBudget ? 'Add Anyway (Exceeds Budget)' : 'Add Expense'}
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Transactions</h2>
            <span className="text-sm font-medium text-gray-600">Total: {formatCurrency(total)}</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-brand-600" />
            </div>
          ) : expenses.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">No expenses for this month</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {expenses.map((expense) => (
                <li key={expense._id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold"
                      style={{ backgroundColor: `${expense.category?.color}20`, color: expense.category?.color }}
                    >
                      {expense.category?.name?.charAt(0) || '?'}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{expense.category?.name || 'Uncategorized'}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(expense.date)}
                        {expense.note ? ` · ${expense.note}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">{formatCurrency(expense.amount)}</span>
                    <button
                      onClick={() => handleDelete(expense._id)}
                      className="text-sm text-gray-400 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}