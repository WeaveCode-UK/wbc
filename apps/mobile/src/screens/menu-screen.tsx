import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, Avatar, ProgressBar } from '@wbc/ui-native';

const categories = [
  {
    label: 'Communication', color: '#8127E8',
    items: [
      { icon: 'campaign', label: 'Campanhas' },
      { icon: 'description', label: 'Templates' },
      { icon: 'chat_bubble', label: 'Respostas' },
    ],
  },
  {
    label: 'Products', color: '#F59E0B',
    items: [
      { icon: 'menu_book', label: 'Catalogo' },
      { icon: 'inventory_2', label: 'Estoque' },
      { icon: 'auto_awesome_motion', label: 'Vitrines' },
    ],
  },
  {
    label: 'Planning', color: '#10B981',
    items: [
      { icon: 'schedule', label: 'Agenda' },
      { icon: 'calendar_month', label: 'Calendario' },
      { icon: 'flag', label: 'Metas' },
    ],
  },
  {
    label: 'Team', color: '#3B82F6', badge: 'LEADER',
    items: [
      { icon: 'group', label: 'Minha Equipe' },
      { icon: 'rewarded_ads', label: 'Ranking' },
      { icon: 'assignment', label: 'Tarefas' },
    ],
  },
  {
    label: 'My Business', color: '#F43F5E',
    items: [
      { icon: 'web', label: 'Landing Page' },
      { icon: 'qr_code_2', label: 'QR Code' },
      { icon: 'share', label: 'Indicacoes' },
    ],
  },
  {
    label: 'Settings', color: '#64748B',
    items: [
      { icon: 'palette', label: 'Tema' },
      { icon: 'manage_accounts', label: 'Conta' },
      { icon: 'help', label: 'Suporte' },
    ],
  },
];

export function MenuScreen() {
  const { md3: c } = useTheme();

  return (
    <ScrollView style={[styles.scroll, { backgroundColor: c.surface }]} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.profileLeft}>
          <Avatar name="Elena Vance" size="lg" />
          <View>
            <Text style={[styles.profileName, { color: c.onSurface }]}>Elena Vance</Text>
            <Text style={[styles.profilePlan, { color: c.primaryContainer }]}>AURA LUXE PARTNER</Text>
          </View>
        </View>
      </View>

      {/* AI Banner */}
      <View style={styles.aiBanner}>
        <View style={styles.aiBannerContent}>
          <View style={styles.aiStatusRow}>
            <Text style={styles.aiStatusLabel}>AI ENGINE STATUS</Text>
          </View>
          <Text style={styles.aiGenerations}>24 Generations</Text>
          <Text style={styles.aiRemaining}>Remaining in your current cycle</Text>
          <View style={styles.aiBarContainer}>
            <View style={styles.aiBarTrack}>
              <View style={[styles.aiBarFill, { width: '72%' }]} />
            </View>
            <View style={styles.aiBarLabels}>
              <Text style={styles.aiBarLabel}>Usage: 72%</Text>
              <Text style={styles.aiBarLabel}>Reset in 4 days</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Categories */}
      {categories.map((cat) => (
        <View key={cat.label} style={styles.categorySection}>
          <View style={styles.categoryHeader}>
            <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
            <Text style={[styles.categoryLabel, { color: c.onSurfaceVariant }]}>{cat.label.toUpperCase()}</Text>
            {cat.badge && (
              <View style={styles.leaderBadge}>
                <Text style={styles.leaderBadgeText}>{cat.badge}</Text>
              </View>
            )}
          </View>
          <View style={styles.categoryGrid}>
            {cat.items.map((item) => (
              <TouchableOpacity
                key={item.label}
                activeOpacity={0.85}
                style={[styles.gridItem, { backgroundColor: c.surfaceContainerLowest }]}
              >
                <Text style={[styles.gridIcon, { color: cat.color }]}>{item.icon}</Text>
                <Text style={[styles.gridLabel, { color: c.onSurface }]}>{item.label.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* Export Card */}
      <View style={[styles.exportCard, { backgroundColor: c.surfaceContainerLow }]}>
        <View style={styles.exportAccent} />
        <Text style={[styles.exportTitle, { color: c.onSurface }]}>Exportar Dados</Text>
        <Text style={[styles.exportDesc, { color: c.onSurfaceVariant }]}>
          Baixe seu historico completo de vendas e estoque como CSV.
        </Text>
        <TouchableOpacity style={styles.exportBtn}>
          <Text style={[styles.exportBtnText, { color: c.primaryContainer }]}>INICIAR EXPORTACAO</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingTop: 80, paddingHorizontal: 16, gap: 24 },
  profileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileName: { fontSize: 15, fontWeight: '700', fontFamily: 'Epilogue', letterSpacing: -0.3 },
  profilePlan: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Manrope', marginTop: 2 },
  aiBanner: {
    borderRadius: 20, overflow: 'hidden',
    backgroundColor: '#8127E8',
    shadowColor: '#8127E8', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 8,
  },
  aiBannerContent: { padding: 24, gap: 4 },
  aiStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  aiStatusLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: 'rgba(255,255,255,0.7)', fontFamily: 'Manrope' },
  aiGenerations: { fontSize: 24, fontWeight: '700', fontFamily: 'Epilogue', color: '#FFFFFF' },
  aiRemaining: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'Manrope', fontWeight: '500' },
  aiBarContainer: { marginTop: 16, gap: 6 },
  aiBarTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden' },
  aiBarFill: { height: '100%', backgroundColor: '#FFFFFF', borderRadius: 3 },
  aiBarLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  aiBarLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: 'rgba(255,255,255,0.5)', fontFamily: 'Manrope', textTransform: 'uppercase' },
  categorySection: { gap: 12 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  categoryLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, fontFamily: 'Manrope' },
  leaderBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 4 },
  leaderBadgeText: { fontSize: 8, fontWeight: '700', color: '#2563EB', fontFamily: 'Manrope' },
  categoryGrid: { flexDirection: 'row', gap: 10 },
  gridItem: {
    flex: 1, aspectRatio: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#191C1E', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  gridIcon: { fontSize: 24, fontFamily: 'Material Symbols Outlined' },
  gridLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.3, fontFamily: 'Manrope', textAlign: 'center' },
  exportCard: { padding: 24, borderRadius: 16, gap: 8, position: 'relative', overflow: 'hidden' },
  exportAccent: { position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 4, backgroundColor: '#8127E8', borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  exportTitle: { fontSize: 14, fontWeight: '700', fontFamily: 'Epilogue', letterSpacing: -0.3 },
  exportDesc: { fontSize: 12, fontFamily: 'Manrope', lineHeight: 18 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  exportBtnText: { fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: 'Manrope' },
});
