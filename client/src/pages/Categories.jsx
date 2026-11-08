import { useState } from 'react';
import { api } from '../lib/api.js';
import { useCategories } from '../hooks/useCategories.js';

const emptyForm = { name: '', color: '#6366f1', icon: 'tag' };

export default function Categories() {
  const { categories, loading, error, reload } = useCategories();
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.post('/categories', form);
      setForm(emptyForm);
      await reload();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category? Its expenses and budgets will also be removed.')) return;
    try {
      await api.delete(`/categories/${id}`);
      await reload();
    } catch (err) {
      alert(err.message);
    }
  };

  if (error) {
    return <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Categories</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Add Category</h2>
          {formError && <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{formError}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Groceries"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Color</label>
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="h-10 w-full cursor-pointer rounded-md border border-gray-300"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Add Category
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Your Categories</h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-brand-600" />
            </div>
          ) : categories.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500">No categories yet</p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {categories.map((c) => (
                <li key={c._id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center gap-3">
                    <span className="h-4 w-4 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="font-medium text-gray-900">{c.name}</span>
                  </div>
                  <button onClick={() => handleDelete(c._id)} className="text-sm text-gray-400 hover:text-red-600">
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}