import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { api, formatCurrency, formatDate, currentMonth } from '../lib/api.js';

const COLORS = ['#6366f1', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#ec4899', '#6b7280'];

export default function Dashboard() {
  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const summaryData = await api.get(`/analytics/summary?month=${month}`);
        setSummary(summaryData);
        setError('');
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [month]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-brand-600" />
      </div>
    );
  }

  if (error) {
    return <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>;
  }

  const spentPct = summary?.totalBudget > 0 ? Math.round((summary.totalSpent / summary.totalBudget) * 100) : 0;

  // Detect any categories that exceeded their budget
  const overBudgetCategories = (summary?.budgets || []).filter(
    (b) => b.category && (b.spent || 0) > b.amount
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      {overBudgetCategories.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-800">Budget Limit Exceeded</h3>
              <p className="mt-1 text-sm text-red-700">
                You have exceeded the allocated budget in {overBudgetCategories.length} {overBudgetCategories.length === 1 ? 'category' : 'categories'}:
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {overBudgetCategories.map((b) => {
                  const overBy = (b.spent || 0) - b.amount;
                  return (
                    <span
                      key={b._id}
                      className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800"
                    >
                      <strong>{b.category.name}:</strong> spent {formatCurrency(b.spent)} of {formatCurrency(b.amount)}
                      <span className="text-red-900 font-semibold">(+{formatCurrency(overBy)} over)</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-sm font-medium text-gray-500">Total Spent</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(summary.totalSpent)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-sm font-medium text-gray-500">Monthly Budget</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(summary.totalBudget)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-sm font-medium text-gray-500">{summary.remaining >= 0 ? 'Remaining' : 'Over Budget'}</p>
          <p className={`mt-2 text-2xl font-bold ${summary.remaining >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
            {formatCurrency(Math.abs(summary.remaining))}
          </p>
        </div>
      </div>

      {summary.totalBudget > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium text-gray-600">Budget usage</span>
            <span className={spentPct > 100 ? 'font-semibold text-red-600' : spentPct > 80 ? 'font-semibold text-amber-600' : 'font-semibold text-gray-900'}>
              {spentPct}%
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className={`h-full rounded-full transition-all ${spentPct > 100 ? 'bg-red-500' : spentPct > 80 ? 'bg-amber-500' : 'bg-brand-600'}`}
              style={{ width: `${Math.min(spentPct, 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Spending by Category</h2>
          {summary.byCategory.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No expenses recorded this month</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={summary.byCategory}
                  dataKey="total"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => entry.name}
                >
                  {summary.byCategory.map((entry, index) => (
                    <Cell key={index} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Top 5 Highest Expenses</h2>
            <span className="text-xs font-medium text-gray-500">This Month</span>
          </div>

          {!summary.topExpenses || summary.topExpenses.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No expenses recorded this month</p>
          ) : (
            <div className="space-y-4">
              {summary.topExpenses.map((expense, idx) => {
                const maxAmount = summary.topExpenses[0]?.amount || 1;
                const barWidth = Math.round((expense.amount / maxAmount) * 100);
                const categoryColor = expense.category?.color || '#6366f1';

                return (
                  <div key={expense._id || idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-gray-500 bg-gray-100">
                          {idx + 1}
                        </span>
                        <span
                          className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: categoryColor }}
                        />
                        <span className="font-medium text-gray-800 truncate">
                          {expense.note || expense.category?.name || 'Expense'}
                        </span>
                        {expense.note && expense.category?.name && (
                          <span className="text-xs text-gray-400 hidden sm:inline">
                            ({expense.category.name})
                          </span>
                        )}
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className="font-bold text-gray-900">{formatCurrency(expense.amount)}</span>
                        <span className="ml-2 text-xs text-gray-400">
                          {formatDate(expense.date)}
                        </span>
                      </div>
                    </div>
                    {/* Visual relative bar */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: categoryColor,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}