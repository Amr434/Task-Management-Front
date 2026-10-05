import Constants from 'expo-constants';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@task/core/features/auth/store/useAuthStore';
import { UserRole, canManageUsers } from '@task/core/features/auth/types';
import { roleLabel } from '@task/core/features/users/management';
import { useProfilePicture } from '@task/core/features/users/hooks/useProfilePicture';
import { en } from '@task/core/i18n/dictionaries/en';

import { Icon } from '@/components/icon';
import { Avatar } from '@/components/ui';
import { pickAvatar } from '@/features/attachments/pick';
import { useTheme } from '@/theme';

export default function ProfileScreen() {
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
  const picture = useProfilePicture();
  const apiUrl = (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? 'unknown';

  const choosePicture = async (source: 'library' | 'camera') => {
    try {
      const picked = await pickAvatar(source);
      if (picked) await picture.upload(picked.file);
    } catch (err) {
      Alert.alert(en.profilePicture, err instanceof Error ? err.message : 'Please try again.');
    }
  };

  const removePicture = async () => {
    try {
      await picture.remove();
    } catch (err) {
      Alert.alert(en.profilePicture, err instanceof Error ? err.message : 'Please try again.');
    }
  };

  const openPictureMenu = () => {
    Alert.alert(en.profilePicture, en.profilePictureHint, [
      { text: en.takePhoto, onPress: () => void choosePicture('camera') },
      { text: en.chooseFromLibrary, onPress: () => void choosePicture('library') },
      ...(user?.avatarUrl
        ? [{ text: en.removePhoto, style: 'destructive' as const, onPress: () => void removePicture() }]
        : []),
      { text: en.cancel, style: 'cancel' as const },
    ]);
  };

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
        <Pressable onPress={openPictureMenu} disabled={picture.busy} accessibilityLabel={en.changePhoto}>
          <Avatar
            firstName={user?.firstName}
            lastName={user?.lastName}
            avatarUrl={user?.avatarUrl}
            color={theme.accent}
            size={64}
          />
          <View style={[styles.cameraBadge, { backgroundColor: theme.accent, borderColor: theme.bgMain }]}>
            {picture.busy ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="camera" size={13} color="#fff" />}
          </View>
        </Pressable>
        <View style={styles.identityText}>
          <Text style={[styles.name, { color: theme.textPrimary }]}>{fullName || 'Signed in'}</Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>{user?.email}</Text>
          <Pressable onPress={openPictureMenu} disabled={picture.busy} hitSlop={6}>
            <Text style={[styles.changePhoto, { color: theme.accent }]}>
              {user?.avatarUrl ? en.changePhoto : en.uploadPhoto}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.rows}>
        <Row label="Role" value={roleLabel(user?.role ?? UserRole.Member, en)} />
        <Row label="Server" value={apiUrl} />
        <Row label="App version" value={Constants.expoConfig?.version ?? '1.0.0'} />
      </View>

      {canManageUsers(user?.role) ? (
        <Pressable
          onPress={() => router.push('/users')}
          style={({ pressed }) => [
            styles.manage,
            { borderColor: theme.border, backgroundColor: pressed ? theme.bgHover : theme.bgSurface },
          ]}
        >
          <Icon name="people" size={20} color={theme.accent} />
          <Text style={[styles.manageText, { color: theme.textPrimary }]}>{en.manageUsers}</Text>
          <Icon name="chevronRight" size={18} color={theme.textFaint} />
        </Pressable>
      ) : null}

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
  manage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 28,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  manageText: { flex: 1, fontSize: 15, fontWeight: '600' },
  changePhoto: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
