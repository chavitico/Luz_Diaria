import { useState, useCallback, useEffect } from 'react';
import { useUser, useAppStore } from '@/lib/store';
import { fetchWithTimeout } from '@/lib/fetch';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';

const EMERGENCY_OWNER_IDS: string[] = [
  'cmml8uiit0000m2vluztbkjwf', // Chavitico – canonical production userId
];

export type AdminRole = 'OWNER' | 'MODERATOR' | 'USER' | null;

export interface AdminRoleState {
  role: AdminRole;
  checking: boolean;
  isOwner: boolean;
  isModerator: boolean;
  isAdmin: boolean;
  pendingTickets: number;
  pendingTestimonies: number;
  reload: () => void;
}

export function useAdminRole(active: boolean): AdminRoleState {
  const user = useUser();
  const updateUser = useAppStore((s) => s.updateUser);

  const [role, setRole] = useState<AdminRole>(null);
  const [checking, setChecking] = useState(false);
  const [pendingTickets, setPendingTickets] = useState(0);
  const [pendingTestimonies, setPendingTestimonies] = useState(0);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  const loadPendingCounts = useCallback(async (userId: string) => {
    try {
      const [ticketRes, testimonyRes] = await Promise.all([
        fetchWithTimeout(`${BACKEND_URL}/api/support/admin/counts`, {
          headers: { 'X-User-Id': userId },
        }).catch(() => null),
        fetchWithTimeout(`${BACKEND_URL}/api/testimonies/admin/counts`, {
          headers: { 'X-User-Id': userId },
        }).catch(() => null),
      ]);
      if (ticketRes?.ok) {
        const data = await ticketRes.json() as { pendingTickets?: number };
        setPendingTickets(data.pendingTickets ?? 0);
      }
      if (testimonyRes?.ok) {
        const data = await testimonyRes.json() as { pendingTestimonies?: number };
        setPendingTestimonies(data.pendingTestimonies ?? 0);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    if (!active || !user?.id) return;

    const localId = user.id;
    const localRole = (user?.role as AdminRole) ?? 'USER';
    const isEmergency = EMERGENCY_OWNER_IDS.includes(localId);

    if (localRole === 'OWNER' || localRole === 'MODERATOR' || isEmergency) {
      const immediateRole = isEmergency ? 'OWNER' : localRole;
      setRole(immediateRole);
      loadPendingCounts(localId);
    } else {
      setRole(null);
    }

    setChecking(true);

    fetchWithTimeout(`${BACKEND_URL}/api/gamification/me`, {
      headers: {
        'X-User-Id': localId,
        ...(user.nickname ? { 'X-User-Nickname': user.nickname } : {}),
      },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((profile: { id?: string; role?: string } | null) => {
        if (!profile?.role && !isEmergency) {
          setRole(localRole);
          return;
        }
        const backendRole = (profile?.role as AdminRole) ?? localRole;
        const finalRole = isEmergency && backendRole !== 'OWNER' ? 'OWNER' : backendRole;

        setRole(finalRole);

        const updates: Record<string, string> = {};
        if (backendRole && backendRole !== localRole) updates.role = backendRole as string;
        if (profile?.id && profile.id !== localId) updates.id = profile.id;
        if (Object.keys(updates).length > 0) {
          updateUser(updates as Parameters<typeof updateUser>[0]);
        }
        if (finalRole === 'OWNER' || finalRole === 'MODERATOR') {
          loadPendingCounts(profile?.id ?? localId);
        }
      })
      .catch(() => {
        const fallback = isEmergency ? 'OWNER' : localRole;
        setRole(fallback);
        if (fallback === 'OWNER' || fallback === 'MODERATOR') loadPendingCounts(localId);
      })
      .finally(() => setChecking(false));
  }, [active, user?.id, tick, loadPendingCounts]);

  const isOwner = role === 'OWNER';
  const isModerator = role === 'MODERATOR';
  const isAdmin = isOwner || isModerator;

  return { role, checking, isOwner, isModerator, isAdmin, pendingTickets, pendingTestimonies, reload };
}
