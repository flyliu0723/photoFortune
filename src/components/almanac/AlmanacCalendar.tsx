import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { cyberTheme } from '@/constants/theme';
import { FORTUNE_LEVEL_COLOR, type FortuneLevel } from '@/constants/almanac';
import { getDateKey } from '@/utils/dailyAlmanac';
import { useAlmanacStore } from '@/stores/almanacStore';

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

interface DayCell {
  date: Date;
  dateKey: string;
  day: number;
  isToday: boolean;
  isFuture: boolean;
  level: FortuneLevel | null;
}

interface AlmanacCalendarProps {
  /** 选中某一天（今天或过去）时回调 */
  onSelectDay: (date: Date) => void;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export default function AlmanacCalendar({ onSelectDay }: AlmanacCalendarProps) {
  const cache = useAlmanacStore((s) => s.cache);
  const today = useMemo(() => startOfDay(new Date()), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const isCurrentMonth =
    cursor.getFullYear() === today.getFullYear() && cursor.getMonth() === today.getMonth();

  const { cells, leadingBlanks } = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayKey = getDateKey(today);

    const list: DayCell[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateKey = getDateKey(date);
      list.push({
        date,
        dateKey,
        day: d,
        isToday: dateKey === todayKey,
        isFuture: date.getTime() > today.getTime(),
        level: cache[dateKey]?.level ?? null,
      });
    }
    return { cells: list, leadingBlanks: firstDay.getDay() };
  }, [cursor, cache, today]);

  const drawnCount = useMemo(
    () => cells.filter((c) => c.level).length,
    [cells]
  );

  const goPrevMonth = () => {
    void Haptics.selectionAsync();
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goNextMonth = () => {
    if (isCurrentMonth) return;
    void Haptics.selectionAsync();
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDayPress = (cell: DayCell) => {
    if (cell.isFuture) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectDay(cell.date);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.monthBar}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={goPrevMonth}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={20} color={cyberTheme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>
          {cursor.getFullYear()} 年 {cursor.getMonth() + 1} 月
        </Text>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={goNextMonth}
          disabled={isCurrentMonth}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={isCurrentMonth ? cyberTheme.colors.border : cyberTheme.colors.primary}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.summary}>本月已求签 {drawnCount} 天</Text>

      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((label) => (
          <Text key={label} style={styles.weekLabel}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <View key={`blank-${i}`} style={styles.cell} />
        ))}
        {cells.map((cell) => (
          <TouchableOpacity
            key={cell.dateKey}
            style={styles.cell}
            onPress={() => handleDayPress(cell)}
            disabled={cell.isFuture}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.dayInner,
                cell.isToday && styles.dayToday,
                cell.level && !cell.isToday && styles.dayDrawn,
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  cell.isFuture && styles.dayTextFuture,
                  cell.isToday && styles.dayTextToday,
                ]}
              >
                {cell.day}
              </Text>
            </View>
            {cell.level ? (
              <View
                style={[styles.levelDot, { backgroundColor: FORTUNE_LEVEL_COLOR[cell.level] }]}
              />
            ) : (
              <View style={styles.levelDotPlaceholder} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.legend}>
        {Object.entries(FORTUNE_LEVEL_COLOR).map(([level, color]) => (
          <View key={level} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>{level}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.hint}>有圆点的日子可回看 · 未来尚未揭晓 · 过期不补签</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: cyberTheme.spacing.md,
  },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: cyberTheme.spacing.md,
  },
  navBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthLabel: {
    color: cyberTheme.colors.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: cyberTheme.fonts.fortune,
  },
  summary: {
    color: cyberTheme.colors.accent,
    fontSize: 12,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: cyberTheme.spacing.md,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: cyberTheme.spacing.sm,
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    color: cyberTheme.colors.textDim,
    fontSize: 12,
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 6,
  },
  dayInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayToday: {
    borderColor: cyberTheme.colors.primary,
    backgroundColor: 'rgba(0,245,255,0.1)',
  },
  dayDrawn: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  dayText: {
    color: cyberTheme.colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  dayTextFuture: {
    color: cyberTheme.colors.border,
  },
  dayTextToday: {
    color: cyberTheme.colors.primary,
    fontWeight: '800',
  },
  levelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  levelDotPlaceholder: {
    width: 6,
    height: 6,
    marginTop: 4,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: cyberTheme.spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: cyberTheme.colors.textDim,
    fontSize: 11,
  },
  hint: {
    color: cyberTheme.colors.textDim,
    fontSize: 11,
    textAlign: 'center',
    marginTop: cyberTheme.spacing.md,
    letterSpacing: 0.5,
  },
});
