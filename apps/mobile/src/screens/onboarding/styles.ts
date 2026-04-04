import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  indicatorRow: { paddingTop: 56, paddingBottom: 16 },
  scroll: { paddingHorizontal: 24, paddingBottom: 24 },
  stepContent: { gap: 24 },

  /* Hero */
  heroSection: { alignItems: 'center', gap: 12, paddingTop: 8 },
  auraOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auraMiddle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 6,
  },
  iconBoxSmall: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  sparkleIcon: { fontSize: 26 },
  displayHeading: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: 'Epilogue',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Sora',
    fontWeight: '400',
    lineHeight: 20,
    maxWidth: 280,
    textAlign: 'center',
  },

  /* Section header */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 15,
    fontFamily: 'Sora',
    fontWeight: '600',
  },
  stepLabel: {
    fontSize: 10,
    fontFamily: 'Manrope',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },

  /* Chips */
  brandsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chipSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontFamily: 'Sora',
    fontWeight: '600',
    fontSize: 13,
  },
  chipUnselected: {
    borderWidth: 0.5,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chipTextUnselected: {
    fontFamily: 'Sora',
    fontWeight: '500',
    fontSize: 13,
  },
  chipDashed: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },

  /* Custom brand input */
  customBrandRow: { paddingTop: 4 },

  /* Info card */
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 0.5,
  },
  infoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIcon: { fontSize: 18 },
  infoTextBlock: { flex: 1, gap: 4 },
  infoTitle: {
    fontSize: 14,
    fontFamily: 'Sora',
    fontWeight: '700',
  },
  infoDesc: {
    fontSize: 12,
    fontFamily: 'Sora',
    fontWeight: '400',
    lineHeight: 18,
  },

  /* Import cards */
  importCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 0.5,
  },
  importIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importLabel: {
    fontSize: 14,
    fontFamily: 'Sora',
    fontWeight: '600',
  },
  importDesc: {
    fontSize: 11,
    fontFamily: 'Sora',
    fontWeight: '400',
    marginTop: 2,
  },

  /* Form fields */
  formFields: { gap: 16 },

  /* Footer */
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
    borderTopWidth: 0.5,
    gap: 12,
    alignItems: 'center',
  },
  nextButton: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
  nextText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Sora',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  skipButton: { paddingVertical: 8 },
  skipText: {
    fontSize: 13,
    fontFamily: 'Sora',
    fontWeight: '500',
  },
});
