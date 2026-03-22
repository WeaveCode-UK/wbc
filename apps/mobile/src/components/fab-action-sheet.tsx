import React from 'react';
import { View, TouchableOpacity, Text, Modal, StyleSheet } from 'react-native';
import { useTheme } from '@wbc/ui-native';

interface FabActionSheetProps {
  visible: boolean;
  onClose: () => void;
}

const actions = [
  { icon: '💰', label: 'Nova venda', bgKey: 'primarySurface' as const, textKey: 'primary' as const },
  { icon: '👤', label: 'Nova cliente', bgKey: 'successBg' as const, textKey: 'success' as const },
  { icon: '💬', label: 'Enviar mensagem', bgKey: 'infoBg' as const, textKey: 'info' as const },
  { icon: '📢', label: 'Nova campanha', bgKey: 'warningBg' as const, textKey: 'warning' as const },
  { icon: '✨', label: 'Pedir pra IA', bgKey: 'primarySurface' as const, textKey: 'primary' as const },
];

export function FabActionSheet({ visible, onClose }: FabActionSheetProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={[styles.sheet, { backgroundColor: colors.bgPrimary }]}>
          <View style={[styles.handle, { backgroundColor: colors.borderSecondary }]} />
          {actions.map((action, i) => (
            <TouchableOpacity key={i} style={styles.item} onPress={onClose}>
              <View style={[styles.iconBox, { backgroundColor: colors[action.bgKey] }]}>
                <Text style={{ fontSize: 18 }}>{action.icon}</Text>
              </View>
              <Text style={[styles.label, { color: colors.textPrimary }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 32, paddingTop: 12, paddingHorizontal: 16 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  iconBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 14, fontFamily: 'Sora_400Regular' },
});
