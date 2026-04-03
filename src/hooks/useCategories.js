import { useState, useEffect, useCallback } from 'react';
import { getCategories } from '../services/categoryService';

export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCategories();
      setCategories(data ?? []);
    } catch (err) {
      setError(err?.message ?? 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const categoryNames = categories.map(c => c.categoryName);
  const PRIORITIES    = ['Low', 'Medium', 'High', 'Critical'];
  const STATUSES      = ['Open', 'In Progress', 'Resolved', 'Closed'];

  return { categories, categoryNames, PRIORITIES, STATUSES, loading, error, refetch: fetch };
};
