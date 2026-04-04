import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '@wbc/ui-native';
import { FabActionSheet } from '../components/fab-action-sheet';

interface TabBarProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
}

const tabs = [
  { key: 'myday', label: 'MEU DIA', iconDefault: 'calendar_today', iconActive: 'calendar_today' },
  { key: 'clients', label: 'CLIENTES', iconDefault: 'group', iconActive: 'group' },
  { key: 'fab', label: '', iconDefault: 'add', iconActive: 'add' },
  { key: 'sales', label: 'VENDAS', iconDefault: 'payments', iconActive: 'payments' },
  { key: 'menu', label: 'MENU', iconDefault: 'menu', iconActive: 'menu' },
];

export function BottomTabBar({ activeTab, onTabPress }: TabBarProps) {
  const { md3: c } = useTheme();
  const [fabOpen, setFabOpen] = useState(false);

  return (
    <>
      <FabActionSheet visible={fabOpen} onClose={() => setFabOpen(false)} />
      <View style={[styles.bar, { backgroundColor: c.surface + 'E6' }]}>
        {tabs.map((tab) => {
          if (tab.key === 'fab') {
            return (
              <TouchableOpacity
                key="fab"
                onPress={() => setFabOpen(true)}
                activeOpacity={0.85}
                style={styles.fabBtn}
              >
                <View style={styles.fabGradient}>
                  <Text style={styles.fabIcon}>add</Text>
                </View>
              </TouchableOpacity>
            );
          }
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onTabPress(tab.key)}
              activeOpacity={0.7}
              style={styles.tab}
            >
              <Text style={[
                styles.tabIcon,
                { color: active ? '#8127E8' : c.onSurface + '66' },
              ]}>
                {tab.iconDefault}
              </Text>
              <Text style={[
                styles.tabLabel,
                { color: active ? '#8127E8' : c.onSurface + '66' },
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 28,
    paddingTop: 10,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#8127E8',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 10,
  },
  tab: { alignItems: 'center', gap: 3 },
  tabIcon: { fontSize: 24, fontFamily: 'Material Symbols Outlined' },
  tabLabel: { fontSize: 10, fontFamily: 'Sora', fontWeight: '500', letterSpacing: 1.2 },
  fabBtn: { marginTop: -32 },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8127E8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8127E8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  fabIcon: { fontSize: 28, color: '#FFFFFF', fontFamily: 'Material Symbols Outlined', fontWeight: '700' },
});
