import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { invitationsApi } from '@task/core/features/invitations/api';
import { InvitationTargetType, type Invitation } from '@task/core/features/invitations/types';
import { useInvitationStore } from '@task/core/features/invitations/store/useInvitationStore';

import { Icon } from '@/components/icon';
import { Empty, Tile } from '@/components/ui';
import { useTheme } from '@/theme';

/**
 * Invitations to spaces and lists: accept or decline. Opened from the bell on
 * the Home screen (the web app shows the same list under its bell).
 */
export default function InvitationsScreen() {
  const theme = useTheme();

  const pending = useInvitationStore((s) => s.pendingInvitations);
  const isLoading = useInvitationStore((s) => s.isLoading);
  const fetchPending = useInvitationStore((s) => s.fetchPending);
  const removeInvitation = useInvitationStore((s) => s.removeInvitation);
  const bumpSidebar = useInvitationStore((s) => s.bumpSidebar);

  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchPending();
    }, [fetchPending])
  );

  const respond = async (invitation: Invitation, accept: boolean) => {
    setBusy(invitation.id);
    setError(null);
    try {
      await invitationsApi.respond(invitation.id, accept);
      removeInvitation(invitation.id);
      if (accept) {
        // Accepting grants access to new spaces/lists, so the tree must refetch.
        bumpSidebar();
        if (invitation.targetType === InvitationTargetType.Project && invitation.projectId) {
          router.push({
            pathname: '/project/[id]',
            params: { id: String(invitation.projectId), name: invitation.targetName },
          });
        } else if (invitation.spaceId) {
          router.push({
            pathname: '/space/[id]',
            params: { id: String(invitation.spaceId), name: invitation.targetName },
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not respond to the invitation');
    } finally {
      setBusy(null);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bgMain }}>
      <View style={styles.header}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          hitSlop={10}
          accessibilityLabel="Back"
          style={[styles.round, { backgroundColor: theme.bgHover }]}
        >
          <Icon name="back" size={20} color={theme.textSecondary} />
        </Pressable>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Invitations</Text>
        <View style={styles.round} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchPending} tintColor={theme.accent} />
        }
      >
        {error ? (
          <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
        ) : null}

        {pending.length === 0 ? (
          <Empty text="No invitations right now." />
        ) : (
          pending.map((invitation) => {
            const isProject = invitation.targetType === InvitationTargetType.Project;
            return (
              <View
                key={invitation.id}
                style={[styles.card, { borderColor: theme.border, backgroundColor: theme.bgCanvas }]}
              >
                <View style={styles.cardHead}>
                  <Tile
                    text={invitation.targetName.charAt(0).toUpperCase()}
                    color={isProject ? '#2684ff' : theme.accent}
                    size={36}
                  />
                  <View style={styles.cardText}>
                    <Text style={[styles.cardTitle, { color: theme.textPrimary }]} numberOfLines={2}>
                      {invitation.targetName}
                    </Text>
                    <Text style={[styles.cardSub, { color: theme.textSecondary }]} numberOfLines={2}>
                      {invitation.inviterName ? `${invitation.inviterName} invited you` : 'You were invited'}
                      {isProject ? ' to a list' : ' to a space'}
                    </Text>
                  </View>
                </View>

                <View style={styles.actions}>
                  <Pressable
                    onPress={() => respond(invitation, false)}
                    disabled={busy === invitation.id}
                    style={({ pressed }) => [
                      styles.btn,
                      { borderColor: theme.border, opacity: pressed ? 0.6 : 1 },
                    ]}
                  >
                    <Text style={{ color: theme.textSecondary, fontWeight: '600', fontSize: 14 }}>Decline</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => respond(invitation, true)}
                    disabled={busy === invitation.id}
                    style={({ pressed }) => [
                      styles.btn,
                      styles.btnAccept,
                      { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 },
                    ]}
                  >
                    {busy === invitation.id ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Icon name="check" size={16} color="#ffffff" />
                        <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 14 }}>Accept</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  round: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700' },
  body: { paddingHorizontal: 16, paddingBottom: 60, gap: 12 },
  error: { fontSize: 13, paddingBottom: 8 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 14 },
  cardHead: { flexDirection: 'row', gap: 12 },
  cardText: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSub: { fontSize: 13 },
  actions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
    minWidth: 96,
    justifyContent: 'center',
  },
  btnAccept: { borderWidth: 0 },
});
