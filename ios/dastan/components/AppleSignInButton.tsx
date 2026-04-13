import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { supabase } from "../lib/supabase";
import { radius, space } from "../lib/theme";

/**
 * Native "Sign in with Apple" button.
 *
 * Uses Apple's sanctioned `AppleAuthenticationButton` (renders the
 * official glyph + wordmark) and hands the identity token to Supabase.
 *
 * A hashed nonce is sent to Apple; the raw nonce is sent to Supabase —
 * Supabase compares `sha256(raw) === apple.nonce` to prevent replay.
 *
 * Hidden on Android / simulators that don't support it.
 */
export function AppleSignInButton({
  onError,
  onSuccess,
}: {
  onError?: (msg: string) => void;
  onSuccess?: () => void;
}) {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    AppleAuthentication.isAvailableAsync().then(setAvailable);
  }, []);

  if (!available) return null;

  return (
    <View style={styles.wrap}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={radius.pill}
        style={styles.button}
        onPress={async () => {
          try {
            const rawNonce = Crypto.randomUUID();
            const hashedNonce = await Crypto.digestStringAsync(
              Crypto.CryptoDigestAlgorithm.SHA256,
              rawNonce,
            );
            const credential = await AppleAuthentication.signInAsync({
              requestedScopes: [
                AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                AppleAuthentication.AppleAuthenticationScope.EMAIL,
              ],
              nonce: hashedNonce,
            });
            if (!credential.identityToken) {
              onError?.("Apple didn't return an identity token.");
              return;
            }
            const { error } = await supabase.auth.signInWithIdToken({
              provider: "apple",
              token: credential.identityToken,
              nonce: rawNonce,
            });
            if (error) {
              onError?.(error.message);
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Error,
              );
              return;
            }
            Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            );
            onSuccess?.();
          } catch (e: any) {
            // User cancelled — silent.
            if (e?.code === "ERR_REQUEST_CANCELED") return;
            onError?.(e?.message ?? String(e));
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: space.md,
  },
  button: {
    width: "100%",
    height: 54,
  },
});
