import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { classificationColors } from '@wbc/shared';

type Size = 'sm' | 'md' | 'lg';

interface AvatarProps {
  name: string;
  src?: string;
  size?: Size;
  classification?: 'A' | 'B' | 'C';
}

const sizes: Record<Size, number> = { sm: 28, md: 36, lg: 48 };
const fontSizes: Record<Size, number> = { sm: 10, md: 12, lg: 14 };

export function Avatar({ name, src, size = 'md', classification }: AvatarProps) {
  const s = sizes[size];
  const initials = name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  const bg = classification ? classificationColors[classification].bg : '#8127E8';
  const color = classification ? classificationColors[classification].text : '#FFFFFF';

  if (src) {
    return <Image source={{ uri: src }} style={{ width: s, height: s, borderRadius: s / 2 }} />;
  }

  return (
    <View style={[styles.circle, { width: s, height: s, borderRadius: s / 2, backgroundColor: bg }]}>
      <Text style={{ color, fontSize: fontSizes[size], fontWeight: '500', fontFamily: 'Sora' }}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
});
