import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { classificationColors } from '@wbc/shared/src/theme/colors';
import { useTheme } from '../theme/theme-provider';

type Size = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  name: string;
  src?: string;
  size?: Size;
  classification?: 'A' | 'B' | 'C';
}

const sizes: Record<Size, number> = { sm: 28, md: 40, lg: 48, xl: 64 };
const fontSizes: Record<Size, number> = { sm: 10, md: 13, lg: 16, xl: 20 };

export function Avatar({ name, src, size = 'md', classification }: AvatarProps) {
  const { md3: c } = useTheme();
  const s = sizes[size];
  const initials = name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  const bg = classification ? classificationColors[classification].bg : c.primaryContainer;
  const color = classification ? classificationColors[classification].text : c.onPrimary;

  if (src) {
    return (
      <View style={[styles.ring, { width: s + 4, height: s + 4, borderRadius: (s + 4) / 2, borderColor: c.primary + '1A' }]}>
        <Image source={{ uri: src }} style={{ width: s, height: s, borderRadius: s / 2 }} />
      </View>
    );
  }

  return (
    <View style={[styles.circle, { width: s, height: s, borderRadius: s / 2, backgroundColor: bg }]}>
      <Text style={{ color, fontSize: fontSizes[size], fontWeight: '600', fontFamily: 'Sora' }}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  ring: { alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
});
