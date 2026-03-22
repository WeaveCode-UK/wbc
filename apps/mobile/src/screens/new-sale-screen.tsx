import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, StepIndicator, Button, SearchBar, Card } from '@wbc/ui-native';

export function NewSaleScreen() {
  const { colors } = useTheme();
  const [step, setStep] = useState(0);

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Selecionar cliente</Text>
            <SearchBar placeholder="Buscar cliente..." />
            <TouchableOpacity style={[styles.clientItem, { backgroundColor: colors.bgSecondary }]}>
              <Text style={{ color: colors.textPrimary, fontFamily: 'Sora_400Regular' }}>Ana Silva</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.clientItem, { backgroundColor: colors.bgSecondary }]}>
              <Text style={{ color: colors.textPrimary, fontFamily: 'Sora_400Regular' }}>Beatriz Santos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.avulsaBtn, { borderColor: colors.borderSecondary }]}>
              <Text style={{ color: colors.textSecondary, fontFamily: 'Sora_400Regular' }}>Venda avulsa (sem cliente)</Text>
            </TouchableOpacity>
          </View>
        );
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Adicionar produtos</Text>
            <SearchBar placeholder="Buscar produto..." />
            <Card variant="flat"><Text style={{ color: colors.textSecondary, fontFamily: 'Sora_400Regular' }}>Selecione produtos da lista</Text></Card>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Pagamento</Text>
            <View style={styles.payRow}>
              {['PIX', 'Parcelado', 'Dinheiro'].map((m) => (
                <TouchableOpacity key={m} style={[styles.payChip, { backgroundColor: colors.primarySurface }]}>
                  <Text style={{ color: colors.primary, fontSize: 13, fontFamily: 'Sora_500Medium' }}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Confirmar venda</Text>
            <Card variant="elevated">
              <Text style={{ color: colors.textSecondary, fontFamily: 'Sora_400Regular' }}>Resumo da venda será exibido aqui</Text>
            </Card>
          </View>
        );
      default: return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgTertiary }]}>
      <View style={styles.indicatorRow}>
        <StepIndicator total={4} current={step} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>{renderStep()}</ScrollView>
      <View style={[styles.footer, { backgroundColor: colors.bgPrimary, borderTopColor: colors.borderTertiary }]}>
        {step > 0 && <Button variant="ghost" size="md" onPress={() => setStep(step - 1)}>Voltar</Button>}
        <View style={{ flex: 1 }} />
        <Button variant="primary" size="md" onPress={() => step < 3 ? setStep(step + 1) : undefined}>
          {step === 3 ? 'Confirmar' : 'Próximo'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  indicatorRow: { paddingVertical: 12 },
  scroll: { padding: 16 },
  stepContent: { gap: 12 },
  stepTitle: { fontSize: 18, fontWeight: '500', fontFamily: 'Sora_500Medium' },
  clientItem: { borderRadius: 10, padding: 14 },
  avulsaBtn: { borderWidth: 1, borderRadius: 10, padding: 14, borderStyle: 'dashed', alignItems: 'center' },
  payRow: { flexDirection: 'row', gap: 8 },
  payChip: { flex: 1, alignItems: 'center', borderRadius: 20, paddingVertical: 10 },
  footer: { flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 0.5, gap: 8 },
});
