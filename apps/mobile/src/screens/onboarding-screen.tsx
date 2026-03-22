import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, StepIndicator, Button, Input } from '@wbc/ui-native';

const brands = ['Mary Kay', 'Avon', 'Natura', 'Jequiti', 'Boticário'];

export function OnboardingScreen() {
  const { colors } = useTheme();
  const [step, setStep] = useState(0);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  const toggleBrand = (b: string) => {
    setSelectedBrands((prev) => prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]);
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.emoji, { textAlign: 'center' }]}>💜</Text>
            <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Bem-vinda ao WBC!</Text>
            <Text style={[styles.stepDesc, { color: colors.textTertiary }]}>Selecione as marcas que você trabalha</Text>
            <View style={styles.brandsGrid}>
              {brands.map((b) => (
                <TouchableOpacity key={b} onPress={() => toggleBrand(b)} style={[styles.brandChip, { backgroundColor: selectedBrands.includes(b) ? colors.primarySurface : colors.bgSecondary, borderColor: selectedBrands.includes(b) ? colors.primary : colors.borderSecondary }]}>
                  <Text style={{ color: selectedBrands.includes(b) ? colors.primary : colors.textSecondary, fontFamily: 'Sora_500Medium', fontSize: 13 }}>{b}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Seu perfil</Text>
            <Input label="Nome" placeholder="Maria da Silva" />
            <Input label="Telefone" placeholder="+5511999999999" />
            <Input label="Slug da landing page" placeholder="maria-silva" />
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Importar contatos</Text>
            {['📱 WhatsApp', '📊 Planilha', '✏️ Manual'].map((opt, i) => (
              <TouchableOpacity key={i} style={[styles.importOption, { backgroundColor: colors.bgSecondary }]}>
                <Text style={{ color: colors.textPrimary, fontFamily: 'Sora_400Regular', fontSize: 14 }}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Lembretes</Text>
            <Text style={[styles.stepDesc, { color: colors.textTertiary }]}>Configure seus lembretes automáticos</Text>
          </View>
        );
      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.emoji, { textAlign: 'center' }]}>🎉</Text>
            <Text style={[styles.stepTitle, { color: colors.textPrimary, textAlign: 'center' }]}>Tudo pronto!</Text>
            <Text style={[styles.stepDesc, { color: colors.textTertiary, textAlign: 'center' }]}>Sua conta está configurada. Vamos registrar sua primeira venda?</Text>
          </View>
        );
      default: return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgTertiary }]}>
      <View style={styles.indicatorRow}><StepIndicator total={5} current={step} /></View>
      <ScrollView contentContainerStyle={styles.scroll}>{renderStep()}</ScrollView>
      <View style={[styles.footer, { backgroundColor: colors.bgPrimary, borderTopColor: colors.borderTertiary }]}>
        {step > 0 && <Button variant="ghost" size="md" onPress={() => setStep(step - 1)}>Voltar</Button>}
        <View style={{ flex: 1 }} />
        <Button variant="primary" size="md" onPress={() => step < 4 ? setStep(step + 1) : undefined}>
          {step === 4 ? 'Começar!' : 'Próximo'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  indicatorRow: { paddingVertical: 16 },
  scroll: { padding: 16 },
  stepContent: { gap: 16 },
  emoji: { fontSize: 48 },
  stepTitle: { fontSize: 24, fontWeight: '500', fontFamily: 'Sora_500Medium' },
  stepDesc: { fontSize: 13, fontFamily: 'Sora_400Regular' },
  brandsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  brandChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  importOption: { borderRadius: 10, padding: 16 },
  footer: { flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 0.5, gap: 8 },
});
