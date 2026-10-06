import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@task/core/features/auth/store/useAuthStore';
import { changePassword } from '@task/core/features/auth/api';

import { useTheme } from '@/theme';

export default function SignInScreen() {
  const theme = useTheme();

  const login = useAuthStore((s) => s.login);
  const accessToken = useAuthStore((s) => s.accessToken);
  const mustChangePassword = useAuthStore((s) => s.mustChangePassword);
  const setMustChangePassword = useAuthStore((s) => s.setMustChangePassword);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // An admin-created account lands here with a token but no password of its
  // own. The root layout keeps treating it as signed out until this is done.
  const showChangeStep = Boolean(accessToken && mustChangePassword);

  const handleLogin = async () => {
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
      // On success the root layout swaps to (app) on its own — unless a
      // password change is required, in which case the step below renders.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  const handleChangePassword = async () => {
    setError(null);
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await changePassword({ currentPassword: password, newPassword });
      setMustChangePassword(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change password');
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = showChangeStep
    ? Boolean(newPassword && confirmPassword)
    : Boolean(email.trim() && password);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bgCanvas }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, { backgroundColor: theme.bgSurface, borderColor: theme.border }]}>
            <View style={styles.brand}>
              <Image
                source={require('../../assets/images/ciss-logo.png')}
                style={styles.logo}
                accessibilityLabel="CISS"
              />
              <Text style={[styles.brandText, { color: theme.textPrimary }]}>
                Click up CISS
              </Text>
            </View>

            {!showChangeStep ? (
              <>
                <Text style={[styles.title, { color: theme.textPrimary }]}>Sign in</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Use your team account.
                </Text>

                <Text style={[styles.label, { color: theme.textSecondary }]}>Email</Text>
                <TextInput
                  style={[styles.input, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.bgCanvas }]}
                  placeholder="you@example.com"
                  placeholderTextColor={theme.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="username"
                  editable={!busy}
                />

                <Text style={[styles.label, { color: theme.textSecondary }]}>Password</Text>
                <TextInput
                  style={[styles.input, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.bgCanvas }]}
                  placeholder="Your password"
                  placeholderTextColor={theme.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  textContentType="password"
                  editable={!busy}
                  onSubmitEditing={canSubmit && !busy ? handleLogin : undefined}
                />
              </>
            ) : (
              <>
                <Text style={[styles.title, { color: theme.textPrimary }]}>Set a new password</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Your password was set by an admin — choose your own before continuing.
                </Text>

                <Text style={[styles.label, { color: theme.textSecondary }]}>New password</Text>
                <TextInput
                  style={[styles.input, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.bgCanvas }]}
                  placeholder="At least 8 characters"
                  placeholderTextColor={theme.textSecondary}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  textContentType="newPassword"
                  editable={!busy}
                />

                <Text style={[styles.label, { color: theme.textSecondary }]}>Confirm new password</Text>
                <TextInput
                  style={[styles.input, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.bgCanvas }]}
                  placeholder="Repeat new password"
                  placeholderTextColor={theme.textSecondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  textContentType="newPassword"
                  editable={!busy}
                />
              </>
            )}

            {error ? (
              <View style={[styles.error, { backgroundColor: theme.mode === 'dark' ? '#3d1f26' : '#fdeaee' }]}>
                <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              onPress={showChangeStep ? handleChangePassword : handleLogin}
              disabled={busy || !canSubmit}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: theme.accent, opacity: busy || !canSubmit ? 0.5 : pressed ? 0.85 : 1 },
              ]}
            >
              {busy ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>
                  {showChangeStep ? 'Save and continue' : 'Sign in'}
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { borderWidth: 1, borderRadius: 14, padding: 24, gap: 6 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  logo: { width: 40, height: 40 },
  brandText: { fontSize: 17, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 14, marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '500', marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 9, paddingHorizontal: 13, paddingVertical: 12, fontSize: 15 },
  error: { borderRadius: 8, padding: 11, marginTop: 14 },
  errorText: { fontSize: 13 },
  button: { borderRadius: 9, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
});
