import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme, Input } from '@wbc/ui-native';
import { styles } from './styles';

const brands = ['Mary Kay', 'Avon', 'Natura', 'Jequiti', 'Boticário'];

interface StepBrandsProps {
  selectedBrands: string[];
  onToggleBrand: (brand: string) => void;
}

export function StepBrands({ selectedBrands, onToggleBrand }: StepBrandsProps) {
  const { md3: c } = useTheme();
  const [customBrand, setCustomBrand] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  return (
    <View style={styles.stepContent}>
      <View style={styles.heroSection}>
        <View style={[styles.auraOuter, { backgroundColor: c.primaryContainer + '18' }]}>
          <View style={[styles.auraMiddle, { backgroundColor: c.primaryContainer + '30' }]}>
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: c.surfaceContainerLowest,
                  shadowColor: c.primaryContainer,
                },
              ]}
            >
              <Text style={styles.sparkleIcon}>✦</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.displayHeading, { color: c.onSurface }]}>
          Welcome to WBC
        </Text>
        <Text style={[styles.subtitle, { color: c.onSurfaceVariant }]}>
          Your beauty business, simplified and smarter.
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionLabel, { color: c.onSurface }]}>
          Which brand(s) do you work with?
        </Text>
        <Text style={[styles.stepLabel, { color: c.outline }]}>Step 1 of 5</Text>
      </View>

      <View style={styles.brandsGrid}>
        {brands.map((b) => {
          const selected = selectedBrands.includes(b);
          return (
            <TouchableOpacity
              key={b}
              onPress={() => onToggleBrand(b)}
              activeOpacity={0.7}
              style={[
                selected
                  ? [styles.chipSelected, { backgroundColor: c.primaryContainer }]
                  : [
                      styles.chipUnselected,
                      {
                        backgroundColor: c.surfaceContainerLowest,
                        borderColor: c.outlineVariant + '55',
                      },
                    ],
              ]}
            >
              {selected && <Text style={styles.checkmark}>✓</Text>}
              <Text
                style={
                  selected
                    ? styles.chipTextSelected
                    : [styles.chipTextUnselected, { color: c.onSurface }]
                }
              >
                {b}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          onPress={() => setShowCustomInput(!showCustomInput)}
          activeOpacity={0.7}
          style={[styles.chipDashed, { borderColor: c.outlineVariant + '88' }]}
        >
          <Text style={[styles.chipTextUnselected, { color: c.onSurfaceVariant }]}>
            + Other Brand
          </Text>
        </TouchableOpacity>
      </View>

      {showCustomInput && (
        <View style={styles.customBrandRow}>
          <Input
            label="Brand name"
            placeholder="Type brand name..."
            value={customBrand}
            onChangeText={setCustomBrand}
          />
        </View>
      )}

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
          <Text style={[styles.infoIcon, { color: c.primaryContainer }]}>💡</Text>
        </View>
        <View style={styles.infoTextBlock}>
          <Text style={[styles.infoTitle, { color: c.onSurface }]}>
            Tailored Inventory
          </Text>
          <Text style={[styles.infoDesc, { color: c.onSurfaceVariant }]}>
            We'll customize your catalog and inventory based on the brands you select.
          </Text>
        </View>
      </View>
    </View>
  );
}
