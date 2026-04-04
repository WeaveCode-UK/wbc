import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme, StepIndicator } from '@wbc/ui-native';
import { StepBrands } from './onboarding/step-brands';
import { StepProfile } from './onboarding/step-profile';
import { StepImport } from './onboarding/step-import';
import { StepReminders } from './onboarding/step-reminders';
import { StepComplete } from './onboarding/step-complete';
import { styles } from './onboarding/styles';

export function OnboardingScreen() {
  const { md3: c } = useTheme();
  const [step, setStep] = useState(0);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  const toggleBrand = (b: string) => {
    setSelectedBrands((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b],
    );
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return <StepBrands selectedBrands={selectedBrands} onToggleBrand={toggleBrand} />;
      case 1:
        return <StepProfile />;
      case 2:
        return <StepImport />;
      case 3:
        return <StepReminders />;
      case 4:
        return <StepComplete />;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: c.surface }]}>
      <View style={styles.indicatorRow}>
        <StepIndicator total={5} current={step} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: c.surfaceContainerLowest,
            borderTopColor: c.outlineVariant + '33',
          },
        ]}
      >
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
