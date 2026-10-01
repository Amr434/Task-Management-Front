import { useCallback, useEffect, useState } from 'react';
import { registerUser } from '../../auth/api';
import { RegisterUserRequest, UserRole } from '../../auth/types';
import { usersApi } from '../api';
import { ManagedUser } from '../types';

const messageOf = (err: unknown) => (err instanceof Error ? err.message : String(err));

// Everything the "Manage Users" screen needs, shared by web and mobile:
// the list, loading/error state, and the actions. Each action updates the list
// on success and throws on failure, so the caller shows the error its own way
// (alert on web, Alert on mobile).
export function useManagedUsers(enabled: boolean) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setUsers(await usersApi.getManaged());
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // First load. Written without a synchronous setState so it's safe in effects.
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    usersApi
      .getManaged()
      .then((data) => { if (!cancelled) setUsers(data); })
      .catch((err) => { if (!cancelled) setError(messageOf(err)); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [enabled]);

  // Runs one action and swaps the updated user into the list.
  const run = useCallback(async (action: () => Promise<ManagedUser>) => {
    setBusy(true);
    try {
      const updated = await action();
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } finally {
      setBusy(false);
    }
  }, []);

  const setStatus = useCallback(
    (user: ManagedUser, isActive: boolean) => run(() => usersApi.setStatus(user.id, isActive)),
    [run],
  );

  const updateRole = useCallback(
    (user: ManagedUser, role: UserRole) => run(() => usersApi.updateRole(user.id, role)),
    [run],
  );

  const resetPassword = useCallback(
    (user: ManagedUser, newPassword: string) => run(() => usersApi.resetPassword(user.id, newPassword)),
    [run],
  );

  const createUser = useCallback(
    async (data: RegisterUserRequest) => {
      setBusy(true);
      try {
        await registerUser(data);
      } finally {
        setBusy(false);
      }
      await reload();
    },
    [reload],
  );

  return { users, isLoading, error, busy, reload, setStatus, updateRole, resetPassword, createUser };
}
