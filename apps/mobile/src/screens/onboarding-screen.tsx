import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme, StepIndicator, Input } from '@wbc/ui-native';

const brands = ['Mary Kay', 'Avon', 'Natura', 'Jequiti', 'Boticário'];

export function OnboardingScreen() {
  const { md3: c } = useTheme();
  const [step, setStep] = useState(0);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [customBrand, setCustomBrand] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const toggleBrand = (b: string) => {
    setSelectedBrands((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b],
    );
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContent}>
            {/* Aura glow + sparkle icon */}
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

            {/* Brand selection header */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel, { color: c.onSurface }]}>
                Which brand(s) do you work with?
              </Text>
              <Text style={[styles.stepLabel, { color: c.outline }]}>Step 1 of 5</Text>
            </View>

            {/* Brand chips */}
            <View style={styles.brandsGrid}>
              {brands.map((b) => {
                const selected = selectedBrands.includes(b);
                return (
                  <TouchableOpacity
                    key={b}
                    onPress={() => toggleBrand(b)}
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

              {/* + Other Brand chip */}
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

            {/* Info card */}
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

      case 1:
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

      case 2:
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

            {[
              { icon: '📱', label: 'WhatsApp', desc: 'Import from your WhatsApp contacts' },
              { icon: '📊', label: 'Spreadsheet', desc: 'Upload a CSV or Excel file' },
              { icon: '✏️', label: 'Manual Entry', desc: 'Add contacts one by one' },
            ].map((opt) => (
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

      case 3:
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

      case 4:
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

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: c.surface }]}>
      {/* Step indicator */}
      <View style={styles.indicatorRow}>
        <StepIndicator total={5} current={step} />
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>

      {/* Footer */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: c.surfaceContainerLowest,
            borderTopColor: c.outlineVariant + '33',
          },
        ]}
      >
        {/* Next button — full width purple */}
        <TouchableOpacity
          onPress={() => (step < 4 ? setStep(step + 1) : undefined)}
          activeOpacity={0.85}
          style={[
            styles.nextButton,
            {
              backgroundColor: c.primaryContainer,
              shadowColor: c.primaryContainer,
            },
          ]}
        >
          <Text style={styles.nextText}>
            {step === 4 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>

        {/* Skip / Back text */}
        {step === 0 ? (
          <TouchableOpacity
            onPress={() => setStep(step + 1)}
            activeOpacity={0.7}
            style={styles.skipButton}
          >
            <Text style={[styles.skipText, { color: c.onSurfaceVariant }]}>
              Skip for now
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => setStep(step - 1)}
            activeOpacity={0.7}
            style={styles.skipButton}
          >
            <Text style={[styles.skipText, { color: c.onSurfaceVariant }]}>
              Back
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  indicatorRow: { paddingTop: 56, paddingBottom: 16 },
  scroll: { paddingHorizontal: 24, paddingBottom: 24 },
  stepContent: { gap: 24 },

  /* Hero */
  heroSection: { alignItems: 'center', gap: 12, paddingTop: 8 },
  auraOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auraMiddle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 6,
  },
  iconBoxSmall: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  sparkleIcon: { fontSize: 26 },
  displayHeading: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: 'Epilogue',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Sora',
    fontWeight: '400',
    lineHeight: 20,
    maxWidth: 280,
    textAlign: 'center',
  },

  /* Section header */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 15,
    fontFamily: 'Sora',
    fontWeight: '600',
  },
  stepLabel: {
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },

  /* Chips */
  brandsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chipSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontFamily: 'Sora',
    fontWeight: '600',
    fontSize: 13,
  },
  chipUnselected: {
    borderWidth: 0.5,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chipTextUnselected: {
    fontFamily: 'Sora',
    fontWeight: '500',
    fontSize: 13,
  },
  chipDashed: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },

  /* Custom brand input */
  customBrandRow: { paddingTop: 4 },

  /* Info card */
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 0.5,
  },
  infoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIcon: { fontSize: 18 },
  infoTextBlock: { flex: 1, gap: 4 },
  infoTitle: {
    fontSize: 14,
    fontFamily: 'Sora',
    fontWeight: '700',
  },
  infoDesc: {
    fontSize: 12,
    fontFamily: 'Sora',
    fontWeight: '400',
    lineHeight: 18,
  },

  /* Import cards */
  importCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 0.5,
  },
  importIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importLabel: {
    fontSize: 14,
    fontFamily: 'Sora',
    fontWeight: '600',
  },
  importDesc: {
    fontSize: 11,
    fontFamily: 'Sora',
    fontWeight: '400',
    marginTop: 2,
  },

  /* Form fields */
  formFields: { gap: 16 },

  /* Footer */
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
    borderTopWidth: 0.5,
    gap: 12,
    alignItems: 'center',
  },
  nextButton: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
  nextText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Sora',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  skipButton: { paddingVertical: 8 },
  skipText: {
    fontSize: 13,
    fontFamily: 'Sora',
    fontWeight: '500',
  },
});
