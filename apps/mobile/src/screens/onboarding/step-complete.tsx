import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@wbc/ui-native';
import { styles } from './styles';

export function StepComplete() {
  const { md3: c } = useTheme();

  return (
    <View style={styles.stepContent}>
      <View style={styles.heroSection}>
        <View style={[styles.auraOuter, { backgroundColor: c.success + '18' }]}>
          <View style={[styles.auraMiddle, { backgroundColor: c.success + '30' }]}>
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: c.surfaceContainerLowest,
                  shadowColor: c.success,
                },
              ]}
            >
              <Text style={styles.sparkleIcon}>🎉</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.displayHeading, { color: c.onSurface }]}>
          All Set!
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: c.onSurfaceVariant, textAlign: 'center' },
          ]}
        >
          Your account is configured. Ready to register your first sale?
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionLabel, { color: c.onSurface }]}>
          You're ready to go
        </Text>
        <Text style={[styles.stepLabel, { color: c.outline }]}>Step 5 of 5</Text>
      </View>
    </View>
  );
}
