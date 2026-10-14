import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuthStore } from '@task/core/features/auth/store/useAuthStore';
import type { AuthUser } from '@task/core/features/auth/types';
import { invitationsApi } from '@task/core/features/invitations/api';
import { InvitationTargetType } from '@task/core/features/invitations/types';
import { usersApi } from '@task/core/features/users/api';

import { Icon } from '@/components/icon';
import { Avatar, Sheet } from '@/components/ui';
import { useTheme } from '@/theme';

export interface InviteTarget {
  type: InvitationTargetType;
  id: number;
  name: string;
}

const displayName = (u: AuthUser) => `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email;

/**
 * Invite someone to a space or to a single list inside it. Access is granted
 * only when they accept — the backend creates a pending invitation and pushes
 * it to them over the hub.
 */
export function InviteSheet({
  visible,
  target,
  onClose,
}: {
  visible: boolean;
  target: InviteTarget | null;
  onClose: () => void;
}) {
  const theme = useTheme();
  const me = useAuthStore((s) => s.user);

  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [sending, setSending] = useState<number | null>(null);
  const [invited, setInvited] = useState<Record<number, 'sent' | string>>({});

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    setInvited({});
    setQuery('');
    usersApi
      .getAll()
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [visible]);

  const invite = async (user: AuthUser) => {
    if (!target) return;
    setSending(user.id);
    try {
      await invitationsApi.create({
        targetType: target.type,
        targetId: target.id,
        inviteeUserId: user.id,
      });
      setInvited((prev) => ({ ...prev, [user.id]: 'sent' }));
    } catch (err) {
      setInvited((prev) => ({
        ...prev,
        [user.id]: err instanceof Error ? err.message : 'Could not invite',
      }));
    } finally {
      setSending(null);
    }
  };

  // Never offer to invite yourself; you already own or belong to the target.
  const candidates = users
    .filter((u) => u.id !== me?.id)
    .filter((u) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return displayName(u).toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });

  const kind = target?.type === InvitationTargetType.Project ? 'list' : 'space';

  return (
    <Sheet visible={visible} title={`Share ${kind}`} onClose={onClose}>
      {target ? (
        <Text style={[styles.target, { color: theme.textSecondary }]} numberOfLines={1}>
          Inviting to <Text style={{ color: theme.textPrimary, fontWeight: '700' }}>{target.name}</Text>
        </Text>
      ) : null}

      <View style={[styles.search, { backgroundColor: theme.bgCanvas }]}>
        <Icon name="search" size={17} color={theme.textFaint} />
        <TextInput
          style={[styles.searchInput, { color: theme.textPrimary }]}
          placeholder="Search people"
          placeholderTextColor={theme.textFaint}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
      </View>

      {loading ? (
        <ActivityIndicator color={theme.accent} style={{ marginVertical: 24 }} />
      ) : candidates.length === 0 ? (
        <Text style={{ color: theme.textSecondary, paddingVertical: 18 }}>
          {query ? 'Nobody matches that search.' : 'No other people to invite.'}
        </Text>
      ) : (
        candidates.map((user) => {
          const state = invited[user.id];
          return (
            <View key={user.id} style={[styles.row, { borderBottomColor: theme.border }]}>
              <Avatar
                firstName={user.firstName}
                lastName={user.lastName}
                avatarUrl={user.avatarUrl}
                color={theme.accent}
                size={34}
              />
              <View style={styles.rowText}>
                <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={1}>
                  {displayName(user)}
                </Text>
                <Text style={[styles.email, { color: theme.textSecondary }]} numberOfLines={1}>
                  {state && state !== 'sent' ? state : user.email}
                </Text>
              </View>

              {state === 'sent' ? (
                <View style={styles.sent}>
                  <Icon name="check" size={17} color="#00c875" />
                  <Text style={{ color: '#00c875', fontSize: 13, fontWeight: '600' }}>Invited</Text>
                </View>
              ) : (
                <Pressable
                  onPress={() => invite(user)}
                  disabled={sending === user.id}
                  style={({ pressed }) => [
                    styles.inviteBtn,
                    { borderColor: theme.accentBorder, backgroundColor: theme.accentMuted, opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  {sending === user.id ? (
                    <ActivityIndicator size="small" color={theme.accent} />
                  ) : (
                    <Text style={{ color: theme.accent, fontSize: 13, fontWeight: '700' }}>Invite</Text>
                  )}
                </Pressable>
              )}
            </View>
          );
        })
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  target: { fontSize: 13, marginBottom: 12 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 13, height: 44 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth },
  rowText: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '600' },
  email: { fontSize: 12 },
  inviteBtn: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 7, minWidth: 74, alignItems: 'center' },
  sent: { flexDirection: 'row', alignItems: 'center', gap: 5 },
});
