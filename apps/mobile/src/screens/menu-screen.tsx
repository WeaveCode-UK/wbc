import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, Avatar } from '@wbc/ui-native';

const groups = [
  { title: 'COMUNICAÇÃO', color: '#2563EB', items: [{ icon: '📢', label: 'Campanhas' }, { icon: '📝', label: 'Templates' }, { icon: '💬', label: 'Respostas' }] },
  { title: 'PRODUTOS', color: '#D97706', items: [{ icon: '📦', label: 'Catálogo' }, { icon: '🏪', label: 'Estoque' }, { icon: '🧪', label: 'Amostras' }] },
  { title: 'PLANEJAMENTO', color: '#8127E8', items: [{ icon: '📅', label: 'Agenda' }, { icon: '🗓️', label: 'Calendário' }, { icon: '🎯', label: 'Metas' }] },
  { title: 'EQUIPE', color: '#059669', items: [{ icon: '👩‍👩‍👧', label: 'Equipe' }, { icon: '🏆', label: 'Ranking' }, { icon: '📋', label: 'Tarefas' }] },
  { title: 'MEU NEGÓCIO', color: '#E91E8C', items: [{ icon: '📊', label: 'Financeiro' }, { icon: '🚚', label: 'Entregas' }, { icon: '🔗', label: 'Landing' }] },
  { title: 'CONFIGURAÇÕES', color: '#6B7280', items: [{ icon: '⚙️', label: 'Config' }, { icon: '🎨', label: 'Tema' }, { icon: '🌐', label: 'Idioma' }] },
];

export function MenuScreen() {
  const { colors } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgTertiary }]}>
      <View style={[styles.header, { backgroundColor: colors.bgPrimary }]}>
        <Avatar name="Maria Consultora" size="lg" />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={[styles.name, { color: colors.textPrimary }]}>Maria Consultora</Text>
          <Text style={[styles.plan, { color: colors.textTertiary }]}>Plano PRO</Text>
        </View>
      </View>

      <View style={[styles.aiBanner, { backgroundColor: colors.primarySurface }]}>
        <Text style={{ fontSize: 18 }}>✨</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.aiTitle, { color: colors.primary }]}>Assistente IA</Text>
          <Text style={[styles.aiSub, { color: colors.textTertiary }]}>28 gerações restantes</Text>
        </View>
      </View>

      {groups.map((group, gi) => (
        <View key={gi} style={styles.group}>
          <Text style={[styles.groupTitle, { color: group.color }]}>{group.title}</Text>
          <View style={styles.grid}>
            {group.items.map((item, ii) => (
              <TouchableOpacity key={ii} style={[styles.gridItem, { backgroundColor: colors.bgSecondary }]}>
                <View style={[styles.gridIcon, { backgroundColor: `${group.color}15` }]}>
                  <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                </View>
                <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 8 },
  name: { fontSize: 15, fontWeight: '500', fontFamily: 'Sora_500Medium' },
  plan: { fontSize: 11, fontFamily: 'Sora_400Regular' },
  aiBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, borderRadius: 10, padding: 12, marginBottom: 16 },
  aiTitle: { fontSize: 13, fontWeight: '500', fontFamily: 'Sora_500Medium' },
  aiSub: { fontSize: 11, fontFamily: 'Sora_400Regular' },
  group: { marginBottom: 20, paddingHorizontal: 16 },
  groupTitle: { fontSize: 10, fontWeight: '500', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, fontFamily: 'Sora_500Medium' },
  grid: { flexDirection: 'row', gap: 8 },
  gridItem: { flex: 1, alignItems: 'center', borderRadius: 12, padding: 12, gap: 6 },
  gridIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  gridLabel: { fontSize: 10, fontFamily: 'Sora_400Regular' },
});
