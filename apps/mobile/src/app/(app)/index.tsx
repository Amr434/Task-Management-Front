import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuthStore } from '@task/core/features/auth/store/useAuthStore';
import { getSpaces } from '@task/core/features/spaces/api';
import type { Space } from '@task/core/features/spaces/types';

import { useTheme } from '@/theme';

// Phase 0 end state: proves the whole chain works on a device — the session
// came out of the Keychain, apiClient attached the bearer token, and the .NET
// API answered. The real Spaces UI arrives in Phase 1.
export default function SpacesScreen() {
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setSpaces(await getSpaces());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load spaces');
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load().finally(() => setRefreshing(false));
  }, [load]);

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');

  return (
    <View style={[styles.screen, { backgroundColor: theme.bgMain }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.headerText}>
          <Text style={[styles.hello, { color: theme.textPrimary }]}>
            {fullName || user?.email || 'Signed in'}
          </Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>{user?.email}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={logout}
          style={({ pressed }) => [
            styles.logout,
            { borderColor: theme.border, opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Log out</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centre}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : error ? (
        <View style={styles.centre}>
          <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
          <Pressable onPress={onRefresh} style={[styles.retry, { backgroundColor: theme.accent }]}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={spaces}
          keyExtractor={(s) => String(s.id)}
          contentContainerStyle={spaces.length ? styles.list : styles.listEmpty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
          }
          ListEmptyComponent={
            <Text style={[styles.sub, { color: theme.textSecondary }]}>
              No spaces yet.
            </Text>
          }
          renderItem={({ item }) => (
            <View style={[styles.row, { borderColor: theme.border, backgroundColor: theme.bgHover }]}>
              <View style={[styles.dot, { backgroundColor: item.color || theme.accent }]}>
                <Text style={styles.dotText}>{(item.icon || item.name?.[0] || '?').slice(0, 2)}</Text>
              </View>
              <Text style={[styles.rowText, { color: theme.textPrimary }]} numberOfLines={1}>
                {item.name}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerText: { flex: 1, gap: 2 },
  hello: { fontSize: 16, fontWeight: '600' },
  sub: { fontSize: 13 },
  logout: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  errorText: { fontSize: 14, textAlign: 'center' },
  retry: { borderRadius: 8, paddingHorizontal: 18, paddingVertical: 10 },
  retryText: { color: '#ffffff', fontWeight: '600' },
  list: { padding: 16, gap: 10 },
  listEmpty: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 10, padding: 14 },
  dot: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  dotText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  rowText: { fontSize: 15, fontWeight: '500', flex: 1 },
});
