import Constants from 'expo-constants';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@task/core/features/auth/store/useAuthStore';
import { UserRole } from '@task/core/features/auth/types';

import { Tile } from '@/components/ui';
import { useTheme } from '@/theme';

export default function ProfileScreen() {
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || '?';
  const apiUrl = (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? 'unknown';

  const confirmLogout = () => {
    Alert.alert('Log out', 'Sign out of this device?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bgMain }}>
    <ScrollView contentContainerStyle={styles.body}>
      <View style={styles.identity}>
        <Tile text={initials} color={theme.accent} />
        <View style={styles.identityText}>
          <Text style={[styles.name, { color: theme.textPrimary }]}>{fullName || 'Signed in'}</Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>{user?.email}</Text>
        </View>
      </View>

      <View style={styles.rows}>
        <Row label="Role" value={user?.role === UserRole.Admin ? 'Admin' : 'Member'} />
        <Row label="Server" value={apiUrl} />
        <Row label="App version" value={Constants.expoConfig?.version ?? '1.0.0'} />
      </View>

      <Pressable onPress={confirmLogout} style={({ pressed }) => [styles.logout, { opacity: pressed ? 0.6 : 1 }]}>
        <Text style={{ color: theme.danger, fontWeight: '600', fontSize: 15 }}>Log out</Text>
      </Pressable>
    </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: theme.textPrimary }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, paddingTop: 32, paddingBottom: 150 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 28 },
  identityText: { flex: 1, gap: 3 },
  name: { fontSize: 19, fontWeight: '700' },
  sub: { fontSize: 14 },
  rows: {},
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 14, borderBottomWidth: 1 },
  rowLabel: { fontSize: 14, width: 96 },
  rowValue: { flex: 1, fontSize: 14, textAlign: 'right' },
  logout: { marginTop: 36, alignItems: 'center', paddingVertical: 14 },
});
