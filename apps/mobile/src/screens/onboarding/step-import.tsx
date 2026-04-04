import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@wbc/ui-native';
import { styles } from './styles';

const importOptions = [
  { icon: '📱', label: 'WhatsApp', desc: 'Import from your WhatsApp contacts' },
  { icon: '📊', label: 'Spreadsheet', desc: 'Upload a CSV or Excel file' },
  { icon: '✏️', label: 'Manual Entry', desc: 'Add contacts one by one' },
];

export function StepImport() {
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
          <Text style={{ fontSize: 24 }}>📋</Text>
        </View>
        <Text style={[styles.displayHeading, { color: c.onSurface }]}>
          Import Contacts
        </Text>
        <Text style={[styles.subtitle, { color: c.onSurfaceVariant }]}>
          Bring your existing clients into WBC
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionLabel, { color: c.onSurface }]}>
          Choose a method
        </Text>
        <Text style={[styles.stepLabel, { color: c.outline }]}>Step 3 of 5</Text>
      </View>

      {importOptions.map((opt) => (
        <TouchableOpacity
          key={opt.label}
          activeOpacity={0.7}
          style={[
            styles.importCard,
            {
              backgroundColor: c.surfaceContainerLowest,
              borderColor: c.outlineVariant + '33',
            },
          ]}
        >
          <View style={[styles.importIconBox, { backgroundColor: c.primaryContainer + '1A' }]}>
            <Text style={{ fontSize: 20 }}>{opt.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.importLabel, { color: c.onSurface }]}>
              {opt.label}
            </Text>
            <Text style={[styles.importDesc, { color: c.outline }]}>
              {opt.desc}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}
