import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, Toggle } from '@wbc/ui-native';

export function SettingsThemeScreen() {
  const { md3: c, theme, mode, setTheme, toggleMode } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.surface }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={[styles.overline, { color: c.outline }]}>APPEARANCE</Text>
      <Text style={[styles.title, { color: c.onSurface }]}>Theme</Text>

      {/* Theme Color Section */}
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: c.surfaceContainerLowest,
            borderColor: c.outlineVariant + '33',
          },
        ]}
      >
        <Text style={[styles.sectionLabel, { color: c.onSurfaceVariant }]}>THEME COLOR</Text>

        <View style={styles.themeRow}>
          {/* Default purple theme */}
          <TouchableOpacity
            onPress={() => setTheme('default')}
            activeOpacity={0.7}
            style={[
              styles.themeOption,
              {
                backgroundColor: c.surfaceContainerLow,
                borderColor: theme === 'default' ? c.primaryContainer : c.outlineVariant + '33',
                borderWidth: theme === 'default' ? 2 : 0.5,
              },
            ]}
          >
            <View style={[styles.themeCircle, { backgroundColor: '#8127E8' }]}>
              {theme === 'default' && <Text style={styles.themeCheck}>✓</Text>}
            </View>
            <Text style={[styles.themeLabel, { color: c.onSurface }]}>Purple</Text>
            <Text style={[styles.themeHint, { color: c.outline }]}>Default</Text>
          </TouchableOpacity>

          {/* Coming soon placeholder */}
          <View
            style={[
              styles.themeOption,
              {
                backgroundColor: c.surfaceContainerLow,
                borderColor: c.outlineVariant + '33',
                borderWidth: 0.5,
                opacity: 0.5,
              },
            ]}
          >
            <View style={[styles.themeCircle, { backgroundColor: c.surfaceContainerHigh }]}>
              <Text style={{ color: c.outline, fontSize: 14 }}>+</Text>
            </View>
            <Text style={[styles.themeLabel, { color: c.onSurface }]}>More</Text>
            <Text style={[styles.themeHint, { color: c.outline }]}>Coming soon</Text>
          </View>
        </View>
      </View>

      {/* Dark Mode Section */}
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: c.surfaceContainerLowest,
            borderColor: c.outlineVariant + '33',
          },
        ]}
      >
        <View style={styles.toggleRow}>
          <View style={styles.toggleLabelBlock}>
            <Text style={[styles.toggleTitle, { color: c.onSurface }]}>Dark Mode</Text>
            <Text style={[styles.toggleDesc, { color: c.outline }]}>
              {mode === 'dark' ? 'Currently active' : 'Switch to dark appearance'}
            </Text>
          </View>
          <Toggle value={mode === 'dark'} onChange={toggleMode} />
        </View>
      </View>

      {/* Live Preview Section */}
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: c.surfaceContainerLowest,
            borderColor: c.outlineVariant + '33',
          },
        ]}
      >
        <Text style={[styles.sectionLabel, { color: c.onSurfaceVariant }]}>LIVE PREVIEW</Text>

        {/* Preview card simulating a mini UI */}
        <View
          style={[
            styles.previewCard,
            {
              backgroundColor: c.surface,
              borderColor: c.outlineVariant + '33',
            },
          ]}
        >
          {/* Preview header */}
          <View style={styles.previewHeader}>
            <View style={[styles.previewAvatar, { backgroundColor: c.primaryContainer }]}>
              <Text style={styles.previewAvatarText}>WB</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.previewName, { color: c.onSurface }]}>Wave Beauty</Text>
              <Text style={[styles.previewSub, { color: c.outline }]}>Consultant</Text>
            </View>
            <View style={[styles.previewBadge, { backgroundColor: c.primaryContainer }]}>
              <Text style={styles.previewBadgeText}>PRO</Text>
            </View>
          </View>

          {/* Preview stat row */}
          <View style={styles.previewStatRow}>
            <View
              style={[
                styles.previewStat,
                {
                  backgroundColor: c.surfaceContainerLow,
                  borderColor: c.outlineVariant + '33',
                },
              ]}
            >
              <Text style={[styles.previewStatLabel, { color: c.outline }]}>SALES</Text>
              <Text style={[styles.previewStatValue, { color: c.onSurface }]}>R$ 8.4k</Text>
            </View>
            <View
              style={[
                styles.previewStat,
                {
                  backgroundColor: c.surfaceContainerLow,
                  borderColor: c.outlineVariant + '33',
                },
              ]}
            >
              <Text style={[styles.previewStatLabel, { color: c.outline }]}>CLIENTS</Text>
              <Text style={[styles.previewStatValue, { color: c.onSurface }]}>142</Text>
            </View>
          </View>

          {/* Preview button */}
          <View
            style={[
              styles.previewButton,
              { backgroundColor: c.primaryContainer },
            ]}
          >
            <Text style={styles.previewButtonText}>New Sale</Text>
          </View>
        </View>

        <Text style={[styles.previewCaption, { color: c.outline }]}>
          Colors update in real time as you change settings above.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, gap: 16, paddingBottom: 40 },

  /* Header */
  overline: {
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'Epilogue',
    letterSpacing: -0.3,
  },

  /* Section card */
  sectionCard: {
    borderRadius: 16,
    borderWidth: 0.5,
    padding: 16,
    gap: 14,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },

  /* Theme options */
  themeRow: { flexDirection: 'row', gap: 12 },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  themeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeCheck: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  themeLabel: {
    fontSize: 14,
    fontFamily: 'Sora',
    fontWeight: '600',
  },
  themeHint: {
    fontSize: 11,
    fontFamily: 'Sora',
    fontWeight: '400',
  },

  /* Toggle row */
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabelBlock: { flex: 1, gap: 2 },
  toggleTitle: {
    fontSize: 15,
    fontFamily: 'Sora',
    fontWeight: '600',
  },
  toggleDesc: {
    fontSize: 12,
    fontFamily: 'Sora',
    fontWeight: '400',
  },

  /* Preview */
  previewCard: {
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 14,
    gap: 12,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewAvatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Sora',
    fontWeight: '700',
  },
  previewName: {
    fontSize: 13,
    fontFamily: 'Sora',
    fontWeight: '600',
  },
  previewSub: {
    fontSize: 10,
    fontFamily: 'Sora',
    fontWeight: '400',
  },
  previewBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  previewBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Manrope',
    fontWeight: '700',
    letterSpacing: 1,
  },
  previewStatRow: { flexDirection: 'row', gap: 8 },
  previewStat: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 0.5,
    padding: 10,
    gap: 2,
  },
  previewStatLabel: {
    fontSize: 9,
    fontFamily: 'Manrope',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  previewStatValue: {
    fontSize: 16,
    fontFamily: 'Sora',
    fontWeight: '700',
  },
  previewButton: {
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Sora',
    fontWeight: '700',
  },
  previewCaption: {
    fontSize: 11,
    fontFamily: 'Sora',
    fontWeight: '400',
    textAlign: 'center',
  },
});
