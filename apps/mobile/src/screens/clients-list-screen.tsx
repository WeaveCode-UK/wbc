import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useTheme, SearchBar, SegmentedControl, Avatar, Badge, ListItem } from '@wbc/ui-native';

const mockClients = [
  { id: '1', name: 'Ana Silva', phone: '+5511999...', classification: 'A' as const, status: 'Ativa' },
  { id: '2', name: 'Beatriz Santos', phone: '+5511998...', classification: 'B' as const, status: 'Ativa' },
  { id: '3', name: 'Carla Oliveira', phone: '+5511997...', classification: 'C' as const, status: 'Lead' },
];

export function ClientsListScreen() {
  const { colors } = useTheme();
  const [segment, setSegment] = useState('all');
  const [search, setSearch] = useState('');

  return (
    <View style={[styles.container, { backgroundColor: colors.bgTertiary }]}>
      <View style={[styles.header, { backgroundColor: colors.bgPrimary }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Clientes</Text>
        <SearchBar placeholder="Buscar cliente..." value={search} onChangeText={setSearch} />
        <SegmentedControl
          options={[{ value: 'all', label: 'Todas' }, { value: 'active', label: 'Ativas' }, { value: 'leads', label: 'Leads' }, { value: 'inactive', label: 'Inativas' }]}
          value={segment}
          onChange={setSegment}
        />
      </View>

      <View style={styles.abcRow}>
        {[{ label: 'Total', value: '50', color: colors.textPrimary }, { label: 'A', value: '10', color: colors.success }, { label: 'B', value: '15', color: colors.warning }, { label: 'C', value: '25', color: colors.textTertiary }].map((s, i) => (
          <View key={i} style={[styles.abcCard, { backgroundColor: colors.bgSecondary }]}>
            <Text style={[styles.abcValue, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.abcLabel, { color: colors.textTertiary }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      <FlatList
        data={mockClients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ListItem
            avatar={<Avatar name={item.name} size="md" classification={item.classification} />}
            title={item.name}
            subtitle={item.phone}
            right={<Badge variant={item.classification === 'A' ? 'success' : item.classification === 'B' ? 'warning' : 'neutral'}>{item.classification}</Badge>}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: '500', fontFamily: 'Sora_500Medium' },
  abcRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  abcCard: { flex: 1, alignItems: 'center', borderRadius: 10, padding: 8 },
  abcValue: { fontSize: 18, fontWeight: '500', fontFamily: 'Sora_500Medium' },
  abcLabel: { fontSize: 10, fontFamily: 'Sora_400Regular' },
  list: { paddingHorizontal: 16 },
});
