import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@wbc/ui-native';
import { styles } from './styles';

export function StepReminders() {
  const { md3: c } = useTheme();

  return (
    <View style={styles.stepContent}>
      <View style={styles.heroSection}>
        <View
          style={[
            styles.iconBoxSmall,
            {
              backgroundColor: c.surfaceContainerLowest,
              shadowColor: c.primaryContainer,
            },
          ]}
        >
          <Text style={{ fontSize: 24 }}>🔔</Text>
        </View>
        <Text style={[styles.displayHeading, { color: c.onSurface }]}>
          Reminders
        </Text>
        <Text style={[styles.subtitle, { color: c.onSurfaceVariant }]}>
          Set up automatic follow-up reminders
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionLabel, { color: c.onSurface }]}>
          Smart notifications
        </Text>
        <Text style={[styles.stepLabel, { color: c.outline }]}>Step 4 of 5</Text>
      </View>

      <View
        style={[
          styles.infoCard,
          {
            backgroundColor: c.surfaceContainerLowest,
            borderColor: c.outlineVariant + '33',
          },
        ]}
      >
        <View style={[styles.infoIconBox, { backgroundColor: c.primaryContainer + '1A' }]}>
          <Text style={[styles.infoIcon, { color: c.primaryContainer }]}>⏰</Text>
        </View>
        <View style={styles.infoTextBlock}>
          <Text style={[styles.infoTitle, { color: c.onSurface }]}>
            Auto-reminders
          </Text>
          <Text style={[styles.infoDesc, { color: c.onSurfaceVariant }]}>
            WBC will remind you to follow up with clients based on purchase cycles and preferences.
          </Text>
        </View>
      </View>
    </View>
  );
}
