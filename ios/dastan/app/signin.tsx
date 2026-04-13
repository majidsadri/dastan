import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppleSignInButton } from "../components/AppleSignInButton";
import { BrandMark } from "../components/BrandMark";
import { supabase } from "../lib/supabase";
import { colors, fonts, radius, space, type } from "../lib/theme";

/**
 * Sign in — modal form. Uses Supabase auth directly; once signed in,
 * the root SessionProvider flips the Today screen from hero to
 * canvas and we dismiss the modal.
 */
export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.close}>
            <Text style={styles.closeGlyph}>✕</Text>
          </Pressable>
        </View>

        <BrandMark />

        <View style={styles.body}>
          <View style={styles.introBlock}>
            <Text style={styles.eyebrow}>WELCOME BACK</Text>
            <Text style={styles.title}>Sign in</Text>
            <Text style={styles.sub}>
              Your rituals, history, and favorites are waiting.
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              style={styles.input}
              placeholderTextColor={colors.inkMuted}
              placeholder="you@example.com"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              placeholderTextColor={colors.inkMuted}
              placeholder="••••••••"
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            disabled={loading}
            onPress={submit}
            style={({ pressed }) => [
              styles.cta,
              loading && { opacity: 0.6 },
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
          >
            {loading ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={styles.ctaText}>Sign in</Text>
            )}
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <AppleSignInButton
            onError={setError}
            onSuccess={() => router.back()}
          />

          <Pressable
            onPress={() => router.replace("/signup")}
            style={styles.switchLink}
          >
            <Text style={styles.switchLinkText}>
              New here? <Text style={styles.switchLinkStrong}>Create an account</Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: space.md,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  closeGlyph: { color: colors.inkMuted, fontSize: 16 },
  body: {
    flex: 1,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
  },
  introBlock: {
    alignItems: "center",
    marginBottom: space.lg,
  },
  eyebrow: {
    ...type.eyebrow,
    marginBottom: space.xs,
    textAlign: "center",
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 40,
    color: colors.ink,
    marginBottom: space.xs,
    textAlign: "center",
  },
  sub: {
    ...type.caption,
    textAlign: "center",
    marginBottom: 0,
  },
  field: { marginBottom: space.md },
  label: {
    ...type.uiLabel,
    fontSize: 10,
    color: colors.inkMuted,
    letterSpacing: 1.5,
    marginBottom: space.xs,
  },
  input: {
    ...type.body,
    fontSize: 17,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: space.md,
  },
  error: {
    ...type.bodySm,
    color: colors.danger,
    marginBottom: space.sm,
  },
  cta: {
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: space.md,
  },
  ctaText: { ...type.uiLabel, color: colors.bg, fontSize: 13 },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    marginTop: space.lg,
    marginBottom: space.xs,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairline,
  },
  dividerText: {
    ...type.uiLabel,
    fontSize: 10,
    color: colors.inkMuted,
    letterSpacing: 1.5,
  },
  switchLink: {
    marginTop: space.lg,
    alignItems: "center",
  },
  switchLinkText: { ...type.caption, fontSize: 14 },
  switchLinkStrong: { color: colors.gold, fontFamily: "Inter_600SemiBold" },
});
