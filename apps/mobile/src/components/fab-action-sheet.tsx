import React from 'react';
import { View, TouchableOpacity, Text, Modal, StyleSheet } from 'react-native';
import { useTheme } from '@wbc/ui-native';

interface FabActionSheetProps {
  visible: boolean;
  onClose: () => void;
}

const actions = [
  { icon: 'point_of_sale', label: 'Nova Venda', color: '#8127E8' },
  { icon: 'person_add', label: 'Nova Cliente', color: '#8127E8' },
  { icon: 'campaign', label: 'Nova Campanha', color: '#8127E8' },
  { icon: 'auto_awesome', label: 'Pedir pra IA', highlight: true, color: '#FFFFFF' },
];

export function FabActionSheet({ visible, onClose }: FabActionSheetProps) {
  const { md3: c } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={[styles.sheet, { backgroundColor: c.surfaceContainerLowest }]}>
          <View style={[styles.handle, { backgroundColor: c.surfaceContainerHigh }]} />
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerIcon, { backgroundColor: c.primaryContainer + '1A' }]}>
                <Text style={[styles.iconText, { color: c.primaryContainer }]}>person</Text>
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: c.onSurface }]}>Consultora Premium</Text>
                <Text style={[styles.headerSub, { color: c.outline }]}>Plano Diamante</Text>
              </View>
            </View>
          </View>
          <View style={styles.actions}>
            {actions.map((action, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.item,
                  action.highlight && styles.highlightItem,
                ]}
                activeOpacity={0.85}
                onPress={onClose}
              >
                <Text style={[styles.iconText, { color: action.color }]}>{action.icon}</Text>
                <Text style={[
                  styles.label,
                  { color: action.highlight ? '#FFFFFF' : c.onSurfaceVariant },
                  action.highlight && styles.highlightLabel,
                ]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 40, borderTopRightRadius: 40,
    paddingBottom: 40, paddingTop: 16, paddingHorizontal: 24,
    borderLeftWidth: 4, borderLeftColor: '#8127E8',
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', paddingBottom: 20, borderBottomWidth: 0.5, borderBottomColor: '#EDEEF0' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '700', fontFamily: 'Sora' },
  headerSub: { fontSize: 11, fontFamily: 'Manrope', marginTop: 2 },
  actions: { gap: 4, paddingTop: 16 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderRadius: 12 },
  highlightItem: { backgroundColor: '#8127E8', shadowColor: '#8127E8', shadowOpacity: 0.2, shadowRadius: 12, elevation: 4 },
  highlightLabel: { fontWeight: '700' },
  label: { fontSize: 14, fontFamily: 'Sora' },
  iconText: { fontSize: 24, fontFamily: 'Material Symbols Outlined' },
});
