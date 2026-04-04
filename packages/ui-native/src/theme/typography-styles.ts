import { StyleSheet } from 'react-native';

export const fontFamilies = {
  headline: 'Epilogue',
  body: 'Sora',
  label: 'Manrope',
} as const;

export const textStyles = StyleSheet.create({
  'display-lg': { fontSize: 32, fontWeight: '800', lineHeight: 38.4, fontFamily: fontFamilies.headline },
  'heading-1': { fontSize: 24, fontWeight: '700', lineHeight: 31.2, fontFamily: fontFamilies.headline },
  'heading-2': { fontSize: 18, fontWeight: '700', lineHeight: 23.4, fontFamily: fontFamilies.headline },
  'heading-3': { fontSize: 15, fontWeight: '600', lineHeight: 21, fontFamily: fontFamilies.body },
  body: { fontSize: 14, fontWeight: '400', lineHeight: 21, fontFamily: fontFamilies.body },
  'body-small': { fontSize: 13, fontWeight: '400', lineHeight: 19.5, fontFamily: fontFamilies.body },
  caption: { fontSize: 11, fontWeight: '400', lineHeight: 15.4, fontFamily: fontFamilies.label },
  overline: { fontSize: 10, fontWeight: '700', lineHeight: 12, fontFamily: fontFamilies.label, letterSpacing: 1.5, textTransform: 'uppercase' },
});
