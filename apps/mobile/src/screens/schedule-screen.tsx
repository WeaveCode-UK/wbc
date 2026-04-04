import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, SegmentedControl, Card } from '@wbc/ui-native';

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_DAYS = [
  [1, 2, 3, 4, 5, 6, 7],
  [8, 9, 10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19, 20, 21],
  [22, 23, 24, 25, 26, 27, 28],
  [29, 30, 31, 0, 0, 0, 0],
];

const EVENT_DOTS: Record<number, string> = {
  3: 'consultation', 7: 'delivery', 10: 'consultation', 14: 'demo',
  17: 'followup', 21: 'consultation', 24: 'delivery', 28: 'demo',
};

type CategoryKey = 'consultation' | 'delivery' | 'demo' | 'followup';

interface TimelineEvent {
  time: string;
  title: string;
  description: string;
  location: string;
  duration: string;
  category: CategoryKey;
}

const CATEGORIES: Record<CategoryKey, { label: string; colorKey: string }> = {
  consultation: { label: 'Consultation', colorKey: 'primary' },
  delivery: { label: 'Delivery', colorKey: 'secondary' },
  demo: { label: 'Product Demo', colorKey: 'emerald' },
  followup: { label: 'Follow-up', colorKey: 'error' },
};

const EVENTS: TimelineEvent[] = [
  { time: '09:00 AM', title: 'Skin Consultation', description: 'Full skin analysis and product recommendation', location: 'Atelier Studio B', duration: '1h 30min', category: 'consultation' },
  { time: '11:30 AM', title: 'Product Delivery', description: 'Order #1847 — Kit TimeWise + Serum', location: 'Rua das Flores, 123', duration: '30min', category: 'delivery' },
  { time: '02:00 PM', title: 'Product Demo Session', description: 'New skincare line demo for VIP group', location: 'Atelier Studio A', duration: '2h', category: 'demo' },
  { time: '04:30 PM', title: 'Follow-up Call', description: 'Post-purchase satisfaction check', location: 'Remote — WhatsApp', duration: '20min', category: 'followup' },
];

export function ScheduleScreen() {
  const { md3: c } = useTheme();
  const [view, setView] = useState('day');
  const [selectedDay, setSelectedDay] = useState(24);

  const getCategoryColor = (key: CategoryKey): string => {
    switch (key) {
      case 'consultation': return c.primaryContainer;
      case 'delivery': return c.secondary;
      case 'demo': return '#059669';
      case 'followup': return c.error;
    }
  };

  const getDotColor = (day: number): string | null => {
    const cat = EVENT_DOTS[day] as CategoryKey | undefined;
    if (!cat) return null;
    return getCategoryColor(cat);
  };

  return (
    <ScrollView style={[styles.scroll, { backgroundColor: c.surface }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.h1, { color: c.onSurface }]}>Schedule</Text>
        <Text style={[styles.subtitle, { color: c.outline }]}>Managing 12 upcoming atelier sessions</Text>
      </View>

      {/* View Toggle */}
      <SegmentedControl
        options={[
          { value: 'day', label: 'DAY' },
          { value: 'week', label: 'WEEK' },
          { value: 'month', label: 'MONTH' },
        ]}
        value={view}
        onChange={setView}
      />

      {/* Date Navigation */}
      <View style={styles.dateNav}>
        <TouchableOpacity activeOpacity={0.7} style={[styles.navArrow, { backgroundColor: c.surfaceContainerLow }]}>
          <Text style={{ color: c.onSurfaceVariant, fontSize: 16, fontWeight: '600' }}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={[styles.dateLabel, { color: c.onSurface }]}>October 24, 2023</Text>
        <TouchableOpacity activeOpacity={0.7} style={[styles.navArrow, { backgroundColor: c.surfaceContainerLow }]}>
          <Text style={{ color: c.onSurfaceVariant, fontSize: 16, fontWeight: '600' }}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      {/* Mini Calendar Card */}
      <View style={[styles.calendarCard, { backgroundColor: c.surfaceContainerLowest, borderColor: c.outlineVariant + '33' }]}>
        {/* Day Headers */}
        <View style={styles.calendarRow}>
          {DAYS_OF_WEEK.map((d, i) => (
            <View key={i} style={styles.calendarCell}>
              <Text style={[styles.dayHeader, { color: c.outline }]}>{d}</Text>
            </View>
          ))}
        </View>
        {/* Day Grid */}
        {MONTH_DAYS.map((week, wi) => (
          <View key={wi} style={styles.calendarRow}>
            {week.map((day, di) => {
              if (day === 0) return <View key={di} style={styles.calendarCell} />;
              const isSelected = day === selectedDay;
              const dotColor = getDotColor(day);
              return (
                <TouchableOpacity
                  key={di}
                  activeOpacity={0.7}
                  onPress={() => setSelectedDay(day)}
                  style={[
                    styles.calendarCell,
                    isSelected && { backgroundColor: c.primaryContainer, borderRadius: 12 },
                  ]}
                >
                  <Text style={[
                    styles.dayText,
                    { color: isSelected ? c.onPrimary : c.onSurface },
                    isSelected && { fontWeight: '700' },
                  ]}>
                    {day}
                  </Text>
                  {dotColor ? (
                    <View style={[styles.eventDot, { backgroundColor: isSelected ? c.onPrimary : dotColor }]} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Category Legend */}
      <View style={styles.legendRow}>
        {(Object.entries(CATEGORIES) as Array<[CategoryKey, { label: string }]>).map(([key, val]) => (
          <View key={key} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: getCategoryColor(key) }]} />
            <Text style={[styles.legendLabel, { color: c.outline }]}>{val.label}</Text>
          </View>
        ))}
      </View>

      {/* Timeline */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.overlineLabel, { color: c.primaryContainer }]}>TODAY&apos;S TIMELINE</Text>
      </View>

      <View style={styles.timeline}>
        <View style={[styles.timelineLine, { backgroundColor: c.surfaceContainerHigh }]} />

        {/* Current Time Marker */}
        <View style={[styles.currentTimeRow]}>
          <View style={[styles.currentTimeDot, { backgroundColor: c.error }]} />
          <View style={[styles.currentTimeLine, { backgroundColor: c.error }]} />
          <Text style={[styles.currentTimeLabel, { color: c.error }]}>NOW</Text>
        </View>

        {EVENTS.map((event, idx) => {
          const accentColor = getCategoryColor(event.category);
          return (
            <View key={idx} style={styles.timelineItem}>
              {/* Time Label */}
              <View style={styles.timeColumn}>
                <Text style={[styles.timeLabel, { color: c.outline }]}>{event.time}</Text>
              </View>
              {/* Dot */}
              <View style={[styles.timelineDot, { backgroundColor: accentColor, borderColor: c.surface }]} />
              {/* Event Card */}
              <View style={[
                styles.eventCard,
                {
                  backgroundColor: c.surfaceContainerLowest,
                  borderColor: c.outlineVariant + '33',
                  borderLeftColor: accentColor,
                },
              ]}>
                <View style={styles.eventCardHeader}>
                  <Text style={[styles.eventTitle, { color: c.onSurface }]}>{event.title}</Text>
                  <View style={[styles.durationBadge, { backgroundColor: accentColor + '1A' }]}>
                    <Text style={[styles.durationText, { color: accentColor }]}>{event.duration}</Text>
                  </View>
                </View>
                <Text style={[styles.eventDescription, { color: c.outline }]}>{event.description}</Text>
                <View style={styles.locationRow}>
                  <Text style={{ color: c.outline, fontSize: 11, fontFamily: 'Manrope' }}>📍</Text>
                  <Text style={[styles.locationText, { color: c.outline }]}>{event.location}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingTop: 80, paddingHorizontal: 16, gap: 20 },

  header: { gap: 4 },
  h1: { fontSize: 24, fontWeight: '700', fontFamily: 'Epilogue', lineHeight: 31.2 },
  subtitle: { fontSize: 13, fontWeight: '400', fontFamily: 'Sora', lineHeight: 19.5 },

  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  navArrow: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dateLabel: { fontSize: 15, fontWeight: '600', fontFamily: 'Sora' },

  calendarCard: {
    borderRadius: 20, padding: 16, borderWidth: 0.5,
    shadowColor: '#191C1E', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  calendarRow: { flexDirection: 'row' },
  calendarCell: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, gap: 2 },
  dayHeader: { fontSize: 10, fontWeight: '700', fontFamily: 'Manrope', letterSpacing: 1.5, textTransform: 'uppercase' },
  dayText: { fontSize: 13, fontWeight: '400', fontFamily: 'Sora' },
  eventDot: { width: 4, height: 4, borderRadius: 2 },

  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, paddingHorizontal: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, fontWeight: '400', fontFamily: 'Manrope' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  overlineLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Manrope' },

  timeline: { position: 'relative', gap: 20, paddingLeft: 4 },
  timelineLine: { position: 'absolute', left: 81, top: 8, bottom: 8, width: 2, borderRadius: 1 },

  currentTimeRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 72, marginBottom: 4 },
  currentTimeDot: { width: 10, height: 10, borderRadius: 5 },
  currentTimeLine: { flex: 1, height: 1.5, marginLeft: -1 },
  currentTimeLabel: { fontSize: 9, fontWeight: '700', fontFamily: 'Manrope', letterSpacing: 1, marginLeft: 8 },

  timelineItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  timeColumn: { width: 68, alignItems: 'flex-end', paddingTop: 14 },
  timeLabel: { fontSize: 11, fontWeight: '600', fontFamily: 'Manrope' },
  timelineDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 3, marginTop: 18 },

  eventCard: {
    flex: 1, padding: 14, borderRadius: 16, borderWidth: 0.5, borderLeftWidth: 4, gap: 6,
    shadowColor: '#191C1E', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  eventCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eventTitle: { fontSize: 14, fontWeight: '700', fontFamily: 'Sora' },
  durationBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999 },
  durationText: { fontSize: 10, fontWeight: '700', fontFamily: 'Manrope', letterSpacing: 0.5 },
  eventDescription: { fontSize: 12, fontWeight: '400', fontFamily: 'Sora', lineHeight: 18 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locationText: { fontSize: 11, fontWeight: '400', fontFamily: 'Manrope' },
});
