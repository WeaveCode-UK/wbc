import React from 'react';
import { View, Text } from 'react-native';
import { useTheme, Input } from '@wbc/ui-native';
import { styles } from './styles';

export function StepProfile() {
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
          <Text style={{ fontSize: 24 }}>👤</Text>
        </View>
        <Text style={[styles.displayHeading, { color: c.onSurface }]}>
          Your Profile
        </Text>
        <Text style={[styles.subtitle, { color: c.onSurfaceVariant }]}>
          Tell us a bit about yourself
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionLabel, { color: c.onSurface }]}>
          Basic information
        </Text>
        <Text style={[styles.stepLabel, { color: c.outline }]}>Step 2 of 5</Text>
      </View>

      <View style={styles.formFields}>
        <Input label="Name" placeholder="Maria da Silva" />
        <Input label="Phone" placeholder="+55 11 99999-9999" />
        <Input label="Landing page slug" placeholder="maria-silva" />
      </View>
    </View>
  );
}
