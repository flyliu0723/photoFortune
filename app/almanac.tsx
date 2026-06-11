import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { cyberTheme } from '@/constants/theme';
import AlmanacCalendar from '@/components/almanac/AlmanacCalendar';
import AlmanacModal from '@/components/almanac/AlmanacModal';

export default function AlmanacScreen() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AlmanacCalendar onSelectDay={setSelectedDate} />

      <AlmanacModal
        visible={selectedDate != null}
        skipDraw
        date={selectedDate ?? undefined}
        onClose={() => setSelectedDate(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cyberTheme.colors.background,
  },
  content: {
    paddingVertical: cyberTheme.spacing.md,
    paddingBottom: cyberTheme.spacing.xl,
  },
});
