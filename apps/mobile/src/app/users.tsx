import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@task/core/features/auth/store/useAuthStore';
import { UserRole, canManageUsers } from '@task/core/features/auth/types';
import { en as t } from '@task/core/i18n/dictionaries/en';
import { ManagedUser } from '@task/core/features/users/types';
import { useManagedUsers } from '@task/core/features/users/hooks/useManagedUsers';
import {
  canChangeRoles,
  creatableRoles,
  filterUsers,
  isValidTemporaryPassword,
  roleLabel,
  userFullName,
} from '@task/core/features/users/management';

import { Icon } from '@/components/icon';
import { Avatar, Chip, Empty, ErrorState, Field, Loading, PrimaryButton, Sheet, SheetOption } from '@/components/ui';
import { useTheme } from '@/theme';

const GREEN = '#2e9e5b';
const AMBER = '#d98a1c';

// What the bottom sheet is showing right now. One sheet with switching
// content, because stacking two Modals back to back is unreliable on iOS.
type SheetState =
  | { mode: 'actions'; user: ManagedUser }
  | { mode: 'reset'; user: ManagedUser }
  | { mode: 'create' }
  | null;

/**
 * User management, the mobile twin of the web /users page. Super Admin
 * manages Admins and Members; Admins manage Members only. The list, the
 * actions and the rules all come from @task/core, shared with the web app.
 */
export default function UsersScreen() {
  const theme = useTheme();
  const currentUser = useAuthStore((s) => s.user);
  const currentRole = currentUser?.role ?? UserRole.Member;
  const allowed = canManageUsers(currentRole);

  const { users, isLoading, error, busy, reload, setStatus, updateRole, resetPassword, createUser } =
    useManagedUsers(allowed);

  const [search, setSearch] = useState('');
  const [sheet, setSheet] = useState<SheetState>(null);

  // Form state for the reset-password and create sheets.
  const [tempPassword, setTempPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>(UserRole.Member);

  const filtered = useMemo(() => filterUsers(users, search), [users, search]);
  const roles = creatableRoles(currentRole);

  const close = () => setSheet(null);

  // Runs an action; shows the backend's message if it fails.
  const attempt = async (action: () => Promise<void>, onDone: () => void = close) => {
    try {
      await action();
      onDone();
    } catch (err) {
      Alert.alert('Something went wrong', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  const openCreate = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setTempPassword('');
    setNewRole(UserRole.Member);
    setSheet({ mode: 'create' });
  };

  const openReset = (user: ManagedUser) => {
    setTempPassword('');
    setSheet({ mode: 'reset', user });
  };

  // iOS won't show an Alert while a Modal is still sliding away, so the
  // confirmations wait for the sheet to finish closing first.
  const afterSheetCloses = (fn: () => void) => {
    close();
    setTimeout(fn, 350);
  };

  const confirmDeactivate = (user: ManagedUser) =>
    afterSheetCloses(() =>
    Alert.alert(t.deactivateUserTitle, t.deactivateUserConfirm.replace('{name}', userFullName(user)), [
      { text: t.cancel, style: 'cancel' },
      { text: t.deactivate, style: 'destructive', onPress: () => void attempt(() => setStatus(user, false)) },
    ]),
    );

  const confirmRole = (user: ManagedUser, role: UserRole) =>
    afterSheetCloses(() =>
    Alert.alert(
      t.changeRoleTitle,
      t.changeRoleConfirm.replace('{name}', userFullName(user)).replace('{role}', roleLabel(role, t)),
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: role === UserRole.Admin ? t.makeAdmin : t.makeMember,
          onPress: () => void attempt(() => updateRole(user, role)),
        },
      ],
    ),
    );

  const header = (
    <View style={styles.header}>
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
        hitSlop={10}
        accessibilityLabel="Back"
        style={[styles.round, { backgroundColor: theme.bgHover }]}
      >
        <Icon name="back" size={20} color={theme.textSecondary} />
      </Pressable>
      <Text style={[styles.title, { color: theme.textPrimary }]}>{t.manageUsers}</Text>
      {allowed ? (
        <Pressable
          onPress={openCreate}
          hitSlop={10}
          accessibilityLabel={t.addUser}
          style={({ pressed }) => [styles.round, { backgroundColor: theme.accent, opacity: pressed ? 0.8 : 1 }]}
        >
          <Icon name="personAdd" size={19} color="#fff" />
        </Pressable>
      ) : (
        <View style={styles.round} />
      )}
    </View>
  );

  if (!allowed) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bgMain }}>
        {header}
        <Empty text={t.notAllowedToManageUsers} />
      </SafeAreaView>
    );
  }

  if (isLoading) return <Loading />;
  if (error && users.length === 0) return <ErrorState message={error} onRetry={reload} />;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.bgMain }}>
      {header}

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={false} onRefresh={reload} tintColor={theme.accent} />}
      >
        <Text style={[styles.rules, { color: theme.textSecondary }]}>{t.userManagementRules}</Text>

        <View style={[styles.search, { backgroundColor: theme.bgHover }]}>
          <Icon name="search" size={17} color={theme.textFaint} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t.searchUsers}
            placeholderTextColor={theme.textFaint}
            autoCapitalize="none"
            style={[styles.searchInput, { color: theme.textPrimary }]}
          />
        </View>

        {filtered.length === 0 ? (
          <Empty text={t.noUsersFound} />
        ) : (
          filtered.map((user) => {
            const isMe = user.id === currentUser?.id;
            return (
              <Pressable
                key={user.id}
                disabled={!user.canManage}
                onPress={() => setSheet({ mode: 'actions', user })}
                style={({ pressed }) => [
                  styles.card,
                  {
                    borderColor: theme.border,
                    backgroundColor: pressed ? theme.bgHover : theme.bgSurface,
                    opacity: user.isActive ? 1 : 0.6,
                  },
                ]}
              >
                <Avatar
                  firstName={user.firstName}
                  lastName={user.lastName}
                  avatarUrl={user.avatarUrl}
                  color={theme.accent}
                  size={38}
                />
                <View style={styles.cardText}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={1}>
                      {userFullName(user)}
                    </Text>
                    {isMe ? <Chip text={t.you} color={theme.accent} /> : null}
                  </View>
                  <Text style={[styles.email, { color: theme.textSecondary }]} numberOfLines={1}>
                    {user.email}
                  </Text>
                  <View style={styles.chips}>
                    <Chip text={roleLabel(user.role, t)} color={theme.accent} />
                    <Chip
                      text={user.isActive ? t.statusActive : t.statusInactive}
                      color={user.isActive ? GREEN : theme.danger}
                    />
                    {user.mustChangePassword ? <Chip text={t.temporaryPasswordBadge} color={AMBER} /> : null}
                  </View>
                </View>
                {user.canManage ? <Icon name="chevronRight" size={18} color={theme.textFaint} /> : null}
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <Sheet
        visible={sheet !== null}
        title={
          sheet?.mode === 'create'
            ? t.addUser
            : sheet?.mode === 'reset'
              ? t.resetPasswordTitle.replace('{name}', userFullName(sheet.user))
              : sheet
                ? userFullName(sheet.user)
                : ''
        }
        onClose={close}
      >
        {sheet?.mode === 'actions' ? (
          <View style={styles.sheetBody}>
            {canChangeRoles(currentRole) ? (
              sheet.user.role === UserRole.Admin ? (
                <SheetOption label={t.makeMember} onPress={() => confirmRole(sheet.user, UserRole.Member)} />
              ) : (
                <SheetOption label={t.makeAdmin} onPress={() => confirmRole(sheet.user, UserRole.Admin)} />
              )
            ) : null}
            <SheetOption label={t.resetPassword} onPress={() => openReset(sheet.user)} />
            {sheet.user.isActive ? (
              <SheetOption label={t.deactivate} color={theme.danger} onPress={() => confirmDeactivate(sheet.user)} />
            ) : (
              <SheetOption
                label={t.activate}
                color={GREEN}
                onPress={() => attempt(() => setStatus(sheet.user, true))}
              />
            )}
          </View>
        ) : null}

        {sheet?.mode === 'reset' ? (
          <View style={styles.sheetBody}>
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              {t.resetPasswordMessage.replace('{name}', userFullName(sheet.user))}
            </Text>
            <Field
              label={t.temporaryPassword}
              value={tempPassword}
              onChangeText={setTempPassword}
              placeholder={t.temporaryPasswordHint}
              autoCapitalize="none"
              autoFocus
            />
            <PrimaryButton
              label={t.resetPassword}
              busy={busy}
              disabled={!isValidTemporaryPassword(tempPassword)}
              onPress={() => attempt(() => resetPassword(sheet.user, tempPassword))}
            />
          </View>
        ) : null}

        {sheet?.mode === 'create' ? (
          <View style={styles.sheetBody}>
            <Field label={t.firstName} value={firstName} onChangeText={setFirstName} autoCapitalize="words" autoFocus />
            <Field label={t.lastName} value={lastName} onChangeText={setLastName} autoCapitalize="words" />
            <Field
              label={t.email}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Field
              label={t.temporaryPassword}
              value={tempPassword}
              onChangeText={setTempPassword}
              placeholder={t.temporaryPasswordHint}
              autoCapitalize="none"
            />
            <Text style={[styles.label, { color: theme.textSecondary }]}>{t.roleColumn}</Text>
            {roles.length > 1 ? (
              roles.map((r) => (
                <SheetOption key={r} label={roleLabel(r, t)} selected={newRole === r} onPress={() => setNewRole(r)} />
              ))
            ) : (
              <Text style={[styles.hint, { color: theme.textSecondary }]}>
                {t.roleMember} · {t.adminCanCreateMembersOnly}
              </Text>
            )}
            <View style={{ height: 12 }} />
            <PrimaryButton
              label={t.create}
              busy={busy}
              disabled={!firstName.trim() || !email.trim() || !isValidTemporaryPassword(tempPassword)}
              onPress={() =>
                attempt(() =>
                  createUser({
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    email: email.trim(),
                    password: tempPassword,
                    role: roles.includes(newRole) ? newRole : UserRole.Member,
                  }),
                )
              }
            />
          </View>
        ) : null}
      </Sheet>
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
  body: { padding: 16, paddingBottom: 60, gap: 10 },
  rules: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardText: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 15, fontWeight: '600', flexShrink: 1 },
  email: { fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  sheetBody: { paddingBottom: 24 },
  hint: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 7 },
});
