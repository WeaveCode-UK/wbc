import { registerRootComponent } from 'expo';
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useFonts, Sora_400Regular, Sora_500Medium } from '@expo-google-fonts/sora';
import { NativeThemeProvider, useTheme } from '@wbc/ui-native';

function AppContent() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bgTertiary }]}>
      <Text style={[styles.title, { color: colors.primary, fontFamily: 'Sora_500Medium' }]}>WBC</Text>
      <Text style={[styles.subtitle, { color: colors.textPrimary, fontFamily: 'Sora_500Medium' }]}>Wave Beauty Consultant</Text>
      <Text style={[styles.caption, { color: colors.textTertiary, fontFamily: 'Sora_400Regular' }]}>Mobile app em construção</Text>
    </View>
  );
}

function App() {
  const [fontsLoaded] = useFonts({
    Sora_400Regular,
    Sora_500Medium,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#8127E8" />
      </View>
    );
  }

  return (
    <NativeThemeProvider>
      <AppContent />
    </NativeThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 32,
  },
  subtitle: {
    fontSize: 18,
    marginTop: 8,
  },
  caption: {
    fontSize: 13,
    marginTop: 4,
  },
});

registerRootComponent(App);
