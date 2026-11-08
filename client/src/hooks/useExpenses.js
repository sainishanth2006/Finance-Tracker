import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export function useExpenses(month) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (month) params.set('month', month);
      const data = await api.get(`/expenses?${params.toString()}`);
      setExpenses(data.expenses);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [month]);

  const addExpense = async (payload) => {
    await api.post('/expenses', payload);
    await load();
  };

  return { expenses, loading, error, addExpense, reload: load };
}
