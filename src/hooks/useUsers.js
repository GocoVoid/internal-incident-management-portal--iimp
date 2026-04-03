import { useState, useEffect, useCallback } from 'react';
import { getUsers, getSupportStaff, toggleUserStatus, unlockUser, createUser, updateUser } from '../services/userService';

export const useUsers = (params = {}) => {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUsers(params);
      setUsers(data?.content ?? data ?? []);
    } catch (err) {
      setError(err?.message ?? 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleStatus = useCallback(async (id, isActive) => {
    await toggleUserStatus(id, isActive);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive } : u));
  }, []);

  const unlock = useCallback(async (id) => {
    await unlockUser(id);
    setUsers(prev => prev.map(u => u.id === id
      ? { ...u, failedLoginAttempts: 0, lockedUntil: null }
      : u
    ));
  }, []);

  const create = useCallback(async (data) => {
    const newUser = await createUser(data);
    setUsers(prev => [newUser, ...prev]);
    return newUser;
  }, []);

  const update = useCallback(async (id, data) => {
    const updated = await updateUser(id, data);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updated } : u));
    return updated;
  }, []);

  return { users, loading, error, refetch: fetchUsers, toggleStatus, unlock, create, update };
};

export const useSupportStaff = (department) => {
  const [staff,   setStaff]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSupportStaff()
      .then(data => setStaff(data ?? []))
      .catch(() => setStaff([]))
      .finally(() => setLoading(false));
  }, [department]);

  return { staff, loading };
};

