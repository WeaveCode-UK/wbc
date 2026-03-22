import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme, Card, Badge, Button } from '@wbc/ui-native';

export function CampaignsScreen() {
  const { colors } = useTheme();
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgTertiary }]} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Campanhas</Text>
        <Button variant="primary" size="sm" onPress={() => {}}>Nova</Button>
      </View>
      {[{ name: 'Dia das Mães', status: 'Enviada', statusV: 'success' as const, stats: '45 receberam, 12 responderam' }, { name: 'Promoção Inverno', status: 'Rascunho', statusV: 'neutral' as const, stats: '30 destinatárias' }].map((c, i) => (
        <Card key={i} variant="elevated">
          <View style={styles.campRow}>
            <View style={{ flex: 1 }}><Text style={[styles.campName, { color: colors.textPrimary }]}>{c.name}</Text><Text style={[styles.campStats, { color: colors.textTertiary }]}>{c.stats}</Text></View>
            <Badge variant={c.statusV}>{c.status}</Badge>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '500', fontFamily: 'Sora_500Medium' },
  campRow: { flexDirection: 'row', alignItems: 'center' },
  campName: { fontSize: 13, fontWeight: '500', fontFamily: 'Sora_500Medium' },
  campStats: { fontSize: 11, fontFamily: 'Sora_400Regular', marginTop: 2 },
});
