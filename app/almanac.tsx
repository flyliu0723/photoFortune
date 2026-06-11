import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { cyberTheme } from '@/constants/theme';
import AlmanacCalendar from '@/components/almanac/AlmanacCalendar';
import AlmanacModal from '@/components/almanac/AlmanacModal';
import { useAlmanacStore } from '@/stores/almanacStore';
import { useUserStore } from '@/stores/userStore';
import { getDateKey } from '@/utils/dailyAlmanac';

export default function AlmanacScreen() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [skipDraw, setSkipDraw] = useState(true);
  const profile = useUserStore((s) => s.profile);
  const hasValidCached = useAlmanacStore((s) => s.hasValidCached);

  const handleSelectDay = useCallback(
    (date: Date) => {
      const dateKey = getDateKey(date);
      const isToday = dateKey === getDateKey();
      const alreadyDrawn = hasValidCached(dateKey, profile ?? undefined);

      setSkipDraw(!isToday || alreadyDrawn);
      setSelectedDate(date);
    },
    [hasValidCached, profile]
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AlmanacCalendar onSelectDay={handleSelectDay} userProfile={profile} />

      <AlmanacModal
        visible={selectedDate != null}
        skipDraw={skipDraw}
        date={selectedDate ?? undefined}
        userProfile={profile}
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
