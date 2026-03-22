import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, Toggle, Card } from '@wbc/ui-native';

export function SettingsThemeScreen() {
  const { colors, theme, mode, setTheme, toggleMode } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgTertiary }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Aparência</Text>

      <Card variant="elevated">
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Cor do tema</Text>
        <View style={styles.themeRow}>
          <TouchableOpacity onPress={() => setTheme('default')} style={[styles.themeOption, { borderColor: theme === 'default' ? colors.primary : colors.borderSecondary }]}>
            <View style={[styles.themeCircle, { backgroundColor: '#8127E8' }]} />
            <Text style={[styles.themeLabel, { color: colors.textPrimary }]}>Padrão</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTheme('rose')} style={[styles.themeOption, { borderColor: theme === 'rose' ? colors.primary : colors.borderSecondary }]}>
            <View style={[styles.themeCircle, { backgroundColor: '#E91E8C' }]} />
            <Text style={[styles.themeLabel, { color: colors.textPrimary }]}>Rose</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Card variant="elevated">
        <View style={styles.toggleRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Modo escuro</Text>
          <Toggle value={mode === 'dark'} onChange={toggleMode} />
        </View>
      </Card>

      <Card variant="flat">
        <Text style={[styles.previewLabel, { color: colors.textTertiary }]}>Preview ao vivo aplicado</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: '500', fontFamily: 'Sora_500Medium' },
  sectionTitle: { fontSize: 15, fontWeight: '500', fontFamily: 'Sora_500Medium', marginBottom: 8 },
  themeRow: { flexDirection: 'row', gap: 12 },
  themeOption: { flex: 1, alignItems: 'center', borderRadius: 12, borderWidth: 2, padding: 16, gap: 8 },
  themeCircle: { width: 32, height: 32, borderRadius: 16 },
  themeLabel: { fontSize: 13, fontFamily: 'Sora_500Medium' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewLabel: { fontSize: 11, fontFamily: 'Sora_400Regular', textAlign: 'center' },
});
