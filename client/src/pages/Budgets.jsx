import { useEffect, useState } from 'react';
import { api, formatCurrency, currentMonth } from '../lib/api.js';
import { useCategories } from '../hooks/useCategories.js';

export default function Budgets() {
  const [month, setMonth] = useState(currentMonth());
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { categories } = useCategories();
  const [form, setForm] = useState({ category: '', amount: '' });

  const load = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/budgets?month=${month}`);
      setBudgets(data.budgets);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [month]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/budgets', { category: form.category, month, amount: form.amount });
      setForm({ category: '', amount: '' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this budget?')) return;
    try {
      await api.delete(`/budgets/${id}`);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Set Budget</h2>
          {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
              <select
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Monthly Limit (₹)</label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Save Budget
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Monthly Budgets</h2>
            <span className="text-sm font-medium text-gray-600">
              {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-brand-600" />
            </div>
          ) : budgets.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">No budgets set for this month</p>
          ) : (
            <ul className="space-y-4">
              {budgets.map((budget) => {
                const pct = budget.amount > 0 ? Math.round((budget.spent / budget.amount) * 100) : 0;
                const color = budget.category?.color || '#6366f1';
                return (
                  <li key={budget._id} className="rounded-lg border border-gray-100 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                        <span className="font-medium text-gray-900">{budget.category?.name}</span>
                      </div>
                      <button onClick={() => handleDelete(budget._id)} className="text-sm text-gray-400 hover:text-red-600">
                        Remove
                      </button>
                    </div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-gray-500">{formatCurrency(budget.spent)} of {formatCurrency(budget.amount)}</span>
                      <span className={`font-semibold ${pct > 100 ? 'text-red-600' : pct > 80 ? 'text-amber-600' : 'text-gray-600'}`}>
                        {pct}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className={`h-full rounded-full ${pct > 100 ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-brand-600'}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}