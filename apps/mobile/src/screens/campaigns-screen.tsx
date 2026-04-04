import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useTheme, Button, Badge, Card } from '@wbc/ui-native';

const FILTER_CHIPS = [
  { key: 'vip', label: 'VIP' },
  { key: 'ativas', label: 'Ativas' },
  { key: 'aniversariantes', label: 'Aniversariantes' },
  { key: 'inativas', label: 'Inativas +30d' },
] as const;

const ATTACHMENT_TYPES = [
  { key: 'foto', label: 'Foto', icon: '📷' },
  { key: 'audio', label: 'Audio', icon: '🎙' },
  { key: 'pdf', label: 'PDF', icon: '📄' },
  { key: 'video', label: 'Video', icon: '🎬' },
] as const;

export function CampaignsScreen() {
  const { md3: c } = useTheme();
  const [activeChip, setActiveChip] = useState('vip');
  const [messageText, setMessageText] = useState(
    'Ola {nome}! Temos uma oferta especial para voce neste {data}. Confira nossos produtos com desconto exclusivo!'
  );

  return (
    <ScrollView style={[styles.scroll, { backgroundColor: c.surface }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.overline, { color: c.outline }]}>GROWTH TOOLS</Text>
          <Text style={[styles.h1, { color: c.onSurface }]}>Campanhas</Text>
        </View>
        <Button variant="primary" size="sm" onPress={() => {}}>Nova</Button>
      </View>

      {/* AI Assistant Banner */}
      <View style={styles.aiBanner}>
        <View style={styles.aiBannerContent}>
          <View style={styles.aiBannerTextRow}>
            <Text style={styles.aiBannerIcon}>✨</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiBannerTitle}>Assistente IA</Text>
              <Text style={styles.aiBannerDesc}>
                Gere mensagens personalizadas com inteligencia artificial para cada segmento de clientes.
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.aiBannerBtn} activeOpacity={0.8}>
            <Text style={styles.aiBannerBtnText}>Gerar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Destinatarias */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.h2, { color: c.onSurface }]}>Destinatarias</Text>
          <Badge variant="primary">128 selecionadas</Badge>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {FILTER_CHIPS.map((chip) => {
            const isActive = activeChip === chip.key;
            return (
              <TouchableOpacity
                key={chip.key}
                onPress={() => setActiveChip(chip.key)}
                activeOpacity={0.8}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isActive ? c.primaryContainer : c.surfaceContainerLow,
                    borderColor: isActive ? c.primaryContainer : c.outlineVariant + '33',
                  },
                ]}
              >
                <Text style={[
                  styles.chipText,
                  { color: isActive ? c.onPrimary : c.onSurfaceVariant },
                ]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Message Preview Card */}
      <Card variant="action" accentColor={c.primaryContainer}>
        <Text style={[styles.overline, { color: c.outline, marginBottom: 12 }]}>PREVIEW DA MENSAGEM</Text>
        <TextInput
          style={[styles.textarea, { backgroundColor: c.surfaceContainerLow, color: c.onSurface, borderColor: c.outlineVariant + '33' }]}
          value={messageText}
          onChangeText={setMessageText}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholderTextColor={c.outline}
        />
        <View style={styles.tagRow}>
          {['{nome}', '{data}'].map((tag) => (
            <TouchableOpacity
              key={tag}
              activeOpacity={0.8}
              style={[styles.variableTag, { backgroundColor: c.primaryFixed }]}
            >
              <Text style={[styles.variableTagText, { color: c.primary }]}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Attachments Grid */}
      <View style={styles.section}>
        <Text style={[styles.overline, { color: c.outline, marginBottom: 12, paddingHorizontal: 4 }]}>ANEXOS</Text>
        <View style={styles.attachGrid}>
          {ATTACHMENT_TYPES.map((att) => (
            <TouchableOpacity
              key={att.key}
              activeOpacity={0.8}
              style={[styles.attachBtn, {
                backgroundColor: c.surfaceContainerLowest,
                borderColor: c.outlineVariant + '33',
              }]}
            >
              <Text style={styles.attachIcon}>{att.icon}</Text>
              <Text style={[styles.attachLabel, { color: c.onSurfaceVariant }]}>{att.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button variant="outline" size="md" onPress={() => {}}>Enviar Teste pra mim</Button>
        <Button variant="primary" size="lg" onPress={() => {}}>Confirmar Disparo</Button>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingTop: 80, paddingHorizontal: 16, gap: 24 },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  overline: {
    fontSize: 10, fontWeight: '700', fontFamily: 'Manrope',
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  h1: { fontSize: 24, fontWeight: '700', fontFamily: 'Epilogue', lineHeight: 31.2, marginTop: 4 },
  h2: { fontSize: 18, fontWeight: '700', fontFamily: 'Epilogue', lineHeight: 23.4 },

  /* AI Banner */
  aiBanner: {
    borderRadius: 20, overflow: 'hidden',
    backgroundColor: '#8127E8',
    shadowColor: '#8127E8', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 6,
  },
  aiBannerContent: { padding: 20, gap: 16 },
  aiBannerTextRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  aiBannerIcon: { fontSize: 24, marginTop: 2 },
  aiBannerTitle: {
    fontSize: 15, fontWeight: '700', fontFamily: 'Sora', color: '#FFFFFF', marginBottom: 4,
  },
  aiBannerDesc: {
    fontSize: 13, fontWeight: '400', fontFamily: 'Sora', color: 'rgba(255,255,255,0.8)', lineHeight: 19.5,
  },
  aiBannerBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.2)',
  },
  aiBannerBtnText: {
    fontSize: 13, fontWeight: '700', fontFamily: 'Sora', color: '#FFFFFF',
  },

  /* Section */
  section: { gap: 0 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
  },

  /* Filter Chips */
  chipRow: { gap: 8, paddingVertical: 2, paddingHorizontal: 2 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999,
    borderWidth: 0.5,
  },
  chipText: { fontSize: 12, fontWeight: '600', fontFamily: 'Sora' },

  /* Textarea */
  textarea: {
    minHeight: 100, padding: 16, borderRadius: 12, fontSize: 14,
    fontFamily: 'Sora', lineHeight: 21, borderWidth: 0.5,
  },

  /* Variable Tags */
  tagRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  variableTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  variableTagText: { fontSize: 12, fontWeight: '600', fontFamily: 'Sora' },

  /* Attachments */
  attachGrid: { flexDirection: 'row', gap: 12 },
  attachBtn: {
    flex: 1, aspectRatio: 1, borderRadius: 16, borderWidth: 0.5,
    alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#191C1E', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  attachIcon: { fontSize: 24 },
  attachLabel: { fontSize: 11, fontWeight: '600', fontFamily: 'Manrope' },

  /* Action Buttons */
  actionButtons: { gap: 12 },
});
