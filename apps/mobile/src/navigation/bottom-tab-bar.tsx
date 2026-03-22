import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '@wbc/ui-native';
import { FabActionSheet } from '../components/fab-action-sheet';

interface TabBarProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
}

const tabs = [
  { key: 'myday', label: 'Meu Dia', icon: '🏠' },
  { key: 'clients', label: 'Clientes', icon: '👥' },
  { key: 'fab', label: '', icon: '+' },
  { key: 'sales', label: 'Vendas', icon: '💰' },
  { key: 'menu', label: 'Menu', icon: '☰' },
];

export function BottomTabBar({ activeTab, onTabPress }: TabBarProps) {
  const { colors } = useTheme();
  const [fabOpen, setFabOpen] = useState(false);

  return (
    <>
      <FabActionSheet visible={fabOpen} onClose={() => setFabOpen(false)} />
      <View style={[styles.bar, { backgroundColor: colors.bgPrimary, borderTopColor: colors.borderTertiary }]}>
        {tabs.map((tab) => {
          if (tab.key === 'fab') {
            return (
              <TouchableOpacity key="fab" onPress={() => setFabOpen(true)} style={[styles.fabBtn, { backgroundColor: colors.primary }]}>
                <Text style={styles.fabIcon}>+</Text>
              </TouchableOpacity>
            );
          }
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity key={tab.key} onPress={() => onTabPress(tab.key)} style={styles.tab}>
              <Text style={{ fontSize: 20 }}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, { color: active ? colors.primary : colors.textTertiary }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderTopWidth: 0.5, paddingBottom: 24, paddingTop: 8 },
  tab: { alignItems: 'center', gap: 2 },
  tabLabel: { fontSize: 10, fontFamily: 'Sora_400Regular' },
  fabBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginTop: -24, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  fabIcon: { color: '#FFFFFF', fontSize: 24, fontWeight: '500' },
});
