import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme, Card, Badge, Button, ProgressBar, SegmentedControl, Input, Avatar } from '@wbc/ui-native';

const PERIOD_OPTIONS = [
  { value: 'this', label: 'Este mes' },
  { value: 'last', label: 'Mes anterior' },
];

const STAT_CARDS = [
  { key: 'revenue', label: 'RECEITA', value: 'R$ 15.230', trend: '+12.5%', trendUp: true },
  { key: 'expenses', label: 'DESPESAS', value: 'R$ 3.200', trend: '-8.2%', trendUp: false },
  { key: 'profit', label: 'LUCRO LIQUIDO', value: 'R$ 12.030', trend: '+18.3%', trendUp: true },
  { key: 'margin', label: 'MARGEM MEDIA', value: '79%', trend: '+2.1%', trendUp: true },
] as const;

const RECEIVABLES = [
  { name: 'Ana Paula Silva', initials: 'AP', due: 'Vence em 3 dias', amount: 'R$ 450,00', status: 'warning' as const, statusLabel: 'Pendente' },
  { name: 'Mariana Costa', initials: 'MC', due: 'Atrasado 5 dias', amount: 'R$ 320,00', status: 'danger' as const, statusLabel: 'Atrasado' },
  { name: 'Beatriz Oliveira', initials: 'BO', due: 'Pago em 10/10', amount: 'R$ 180,00', status: 'success' as const, statusLabel: 'Pago' },
  { name: 'Fernanda Reis', initials: 'FR', due: 'Vence em 7 dias', amount: 'R$ 900,00', status: 'warning' as const, statusLabel: 'Pendente' },
];

const EXPENSE_CATEGORIES = [
  { label: 'Operacoes', pct: 46, variant: 'primary' as const },
  { label: 'Marketing', pct: 28, variant: 'warning' as const },
  { label: 'Salarios', pct: 17, variant: 'success' as const },
  { label: 'Outros', pct: 9, variant: 'danger' as const },
];

export function FinanceScreen() {
  const { md3: c } = useTheme();
  const [period, setPeriod] = useState('this');
  const [costPrice, setCostPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');

  const statAccentColors: Record<string, string> = {
    revenue: c.primary,
    expenses: c.error,
    profit: '#059669',
    margin: c.primaryContainer,
  };

  const statIcons: Record<string, string> = {
    revenue: '💰',
    expenses: '📉',
    profit: '📈',
    margin: '📊',
  };

  return (
    <ScrollView style={[styles.scroll, { backgroundColor: c.surface }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.overline, { color: c.outline }]}>MANAGEMENT DASHBOARD</Text>
        <Text style={[styles.h1, { color: c.onSurface }]}>Financeiro</Text>
      </View>

      {/* Period Toggle */}
      <SegmentedControl options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />

      {/* Stat Cards Grid */}
      <View style={styles.statsGrid}>
        {STAT_CARDS.map((stat) => (
          <View key={stat.key} style={[
            styles.statCard,
            {
              backgroundColor: c.surfaceContainerLowest,
              borderColor: c.outlineVariant + '33',
              borderLeftColor: statAccentColors[stat.key],
            },
          ]}>
            <View style={styles.statCardHeader}>
              <Text style={[styles.overline, { color: c.outline }]}>{stat.label}</Text>
              <Text style={styles.statIcon}>{statIcons[stat.key]}</Text>
            </View>
            <Text style={[styles.statValue, { color: c.onSurface }]}>{stat.value}</Text>
            <Text style={[
              styles.statTrend,
              { color: stat.trendUp ? '#059669' : c.error },
            ]}>
              {stat.trend}
            </Text>
          </View>
        ))}
      </View>

      {/* Accounts Receivable */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.h2, { color: c.onSurface }]}>Contas a Receber</Text>
          <Badge variant="info">8 pendentes</Badge>
        </View>
        <View style={styles.receivablesList}>
          {RECEIVABLES.map((item, idx) => (
            <View key={idx} style={[styles.receivableItem, {
              backgroundColor: c.surfaceContainerLowest,
              borderColor: c.outlineVariant + '33',
            }]}>
              <Avatar name={item.name} size="md" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.receivableName, { color: c.onSurface }]}>{item.name}</Text>
                <Text style={[styles.receivableDue, { color: c.outline }]}>{item.due}</Text>
              </View>
              <View style={styles.receivableRight}>
                <Text style={[styles.receivableAmount, { color: c.onSurface }]}>{item.amount}</Text>
                <Badge variant={item.status}>{item.statusLabel}</Badge>
              </View>
              {item.status !== 'success' && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.collectBtn, { backgroundColor: c.primary + '1A' }]}
                >
                  <Text style={[styles.collectBtnText, { color: c.primary }]}>COBRAR</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Financial Tools */}
      <View style={[styles.toolsCard, { backgroundColor: c.primaryContainer }]}>
        <Text style={styles.toolsTitle}>Ferramentas Financeiras</Text>
        <Text style={styles.toolsSubtitle}>Calculadora de margem</Text>

        <View style={styles.toolsInputRow}>
          <View style={{ flex: 1 }}>
            <Input
              label="Preco de Custo"
              placeholder="R$ 0,00"
              value={costPrice}
              onChangeText={setCostPrice}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label="Preco de Venda"
              placeholder="R$ 0,00"
              value={sellPrice}
              onChangeText={setSellPrice}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={[styles.marginDisplay, { backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.15)' }]}>
          <Text style={styles.marginLabel}>Margem Projetada</Text>
          <Text style={styles.marginValue}>--%</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.reverseCalcBtn, { borderColor: 'rgba(255,255,255,0.2)' }]}
        >
          <Text style={styles.reverseCalcText}>Calculadora de Meta Reversa</Text>
        </TouchableOpacity>
      </View>

      {/* Expenses by Category */}
      <View style={styles.section}>
        <Text style={[styles.h2, { color: c.onSurface, marginBottom: 16 }]}>Despesas por Categoria</Text>
        <Card variant="elevated">
          <View style={styles.expensesList}>
            {EXPENSE_CATEGORIES.map((cat) => (
              <View key={cat.label} style={styles.expenseRow}>
                <View style={styles.expenseLabelRow}>
                  <Text style={[styles.expenseLabel, { color: c.onSurface }]}>{cat.label}</Text>
                  <Text style={[styles.expensePct, { color: c.outline }]}>{cat.pct}%</Text>
                </View>
                <ProgressBar value={cat.pct} variant={cat.variant} />
              </View>
            ))}
          </View>
        </Card>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingTop: 80, paddingHorizontal: 16, gap: 24 },

  /* Header */
  header: { gap: 4 },
  overline: {
    fontSize: 10, fontWeight: '700', fontFamily: 'Manrope',
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  h1: { fontSize: 24, fontWeight: '700', fontFamily: 'Epilogue', lineHeight: 31.2 },
  h2: { fontSize: 18, fontWeight: '700', fontFamily: 'Epilogue', lineHeight: 23.4 },

  /* Stat Cards */
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    width: '47%', flexGrow: 1, padding: 16, borderRadius: 16,
    borderWidth: 0.5, borderLeftWidth: 4, gap: 4,
    shadowColor: '#191C1E', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  statCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  statIcon: { fontSize: 16 },
  statValue: { fontSize: 20, fontWeight: '800', fontFamily: 'Epilogue', letterSpacing: -0.5, marginTop: 4 },
  statTrend: { fontSize: 12, fontWeight: '600', fontFamily: 'Sora' },

  /* Section */
  section: { gap: 0 },
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
  },

  /* Receivables */
  receivablesList: { gap: 10 },
  receivableItem: {
    flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16,
    borderWidth: 0.5, gap: 12,
    shadowColor: '#191C1E', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  receivableName: { fontSize: 14, fontWeight: '600', fontFamily: 'Sora' },
  receivableDue: { fontSize: 11, fontFamily: 'Manrope', marginTop: 2 },
  receivableRight: { alignItems: 'flex-end', gap: 4 },
  receivableAmount: { fontSize: 14, fontWeight: '700', fontFamily: 'Sora' },
  collectBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  collectBtnText: { fontSize: 9, fontWeight: '700', fontFamily: 'Manrope', letterSpacing: 1, textTransform: 'uppercase' },

  /* Financial Tools */
  toolsCard: {
    borderRadius: 24, padding: 24, gap: 16,
    shadowColor: '#8127E8', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 6,
  },
  toolsTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'Epilogue', color: '#FFFFFF' },
  toolsSubtitle: { fontSize: 13, fontWeight: '500', fontFamily: 'Sora', color: 'rgba(255,255,255,0.75)' },
  toolsInputRow: { flexDirection: 'row', gap: 12 },
  marginDisplay: {
    padding: 16, borderRadius: 16, borderWidth: 0.5,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  marginLabel: { fontSize: 13, fontWeight: '500', fontFamily: 'Sora', color: 'rgba(255,255,255,0.8)' },
  marginValue: { fontSize: 24, fontWeight: '800', fontFamily: 'Epilogue', color: '#FFFFFF' },
  reverseCalcBtn: {
    paddingVertical: 14, borderRadius: 12, borderWidth: 1,
    alignItems: 'center',
  },
  reverseCalcText: { fontSize: 13, fontWeight: '700', fontFamily: 'Sora', color: '#FFFFFF' },

  /* Expenses */
  expensesList: { gap: 16 },
  expenseRow: { gap: 8 },
  expenseLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  expenseLabel: { fontSize: 13, fontWeight: '600', fontFamily: 'Sora' },
  expensePct: { fontSize: 12, fontWeight: '600', fontFamily: 'Sora' },
});
