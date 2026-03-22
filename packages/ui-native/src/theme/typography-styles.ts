import { StyleSheet } from 'react-native';

export const textStyles = StyleSheet.create({
  'heading-1': { fontSize: 24, fontWeight: '500', lineHeight: 31.2, fontFamily: 'Sora' },
  'heading-2': { fontSize: 18, fontWeight: '500', lineHeight: 23.4, fontFamily: 'Sora' },
  'heading-3': { fontSize: 15, fontWeight: '500', lineHeight: 21, fontFamily: 'Sora' },
  body: { fontSize: 14, fontWeight: '400', lineHeight: 21, fontFamily: 'Sora' },
  'body-small': { fontSize: 13, fontWeight: '400', lineHeight: 19.5, fontFamily: 'Sora' },
  caption: { fontSize: 11, fontWeight: '400', lineHeight: 15.4, fontFamily: 'Sora' },
  overline: { fontSize: 10, fontWeight: '500', lineHeight: 12, fontFamily: 'Sora', letterSpacing: 0.5, textTransform: 'uppercase' },
});
