import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useTheme } from "@wbc/ui-native";
import { trpc, storeToken } from "../lib/trpc-client";

// F11 follow-up: minimal login screen for the mobile app. Posts to
// auth.signInForMobile, stores the resulting JWT in expo-secure-store
// and bubbles success up to the host so it can show the main shell.

interface LoginScreenProps {
  onAuthenticated: () => void;
}

export function LoginScreen({ onAuthenticated }: LoginScreenProps) {
  const { md3: c } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    try {
      const result = await trpc.auth.signInForMobile.mutate({
        email,
        password,
      });
      await storeToken(result.token);
      onAuthenticated();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha no login";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: c.surface }]}
    >
      <View style={styles.inner}>
        <Text style={[styles.title, { color: c.onSurface }]}>WBC</Text>
        <Text style={[styles.subtitle, { color: c.outline }]}>
          Entre para começar a sua jornada
        </Text>

        <View style={styles.field}>
          <Text style={[styles.label, { color: c.outline }]}>E-mail</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            style={[
              styles.input,
              { borderColor: c.outlineVariant, color: c.onSurface },
            ]}
            placeholder="seu@email.com"
            placeholderTextColor={c.outline}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: c.outline }]}>Senha</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            style={[
              styles.input,
              { borderColor: c.outlineVariant, color: c.onSurface },
            ]}
            placeholder="••••••••"
            placeholderTextColor={c.outline}
          />
        </View>

        {error && (
          <Text style={[styles.error, { color: c.error }]}>{error}</Text>
        )}

        <TouchableOpacity
          accessibilityRole="button"
          onPress={submit}
          disabled={loading || !email || !password}
          style={[
            styles.submit,
            {
              backgroundColor: c.primary,
              opacity: loading || !email || !password ? 0.6 : 1,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>Entrar</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center" },
  inner: { paddingHorizontal: 24, gap: 16 },
  title: {
    fontFamily: "Epilogue",
    fontSize: 36,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -1,
  },
  subtitle: {
    fontFamily: "Manrope",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  field: { gap: 4 },
  label: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  input: {
    fontFamily: "Manrope",
    fontSize: 14,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
  },
  error: {
    fontFamily: "Manrope",
    fontSize: 13,
    textAlign: "center",
  },
  submit: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  submitText: {
    color: "#FFFFFF",
    fontFamily: "Sora",
    fontSize: 14,
    fontWeight: "700",
  },
});
