import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { cyberTheme } from '@/constants/theme';
import { getDateKey, isAlmanacCacheValid } from '@/utils/dailyAlmanac';
import { capturePosterImage, savePosterToAlbum } from '@/services/sharePoster';
import { useAlmanacStore } from '@/stores/almanacStore';
import DailyAlmanacCard from '@/components/almanac/DailyAlmanacCard';
import AlmanacDrawOverlay from '@/components/almanac/AlmanacDrawOverlay';
import AlmanacEmptyState from '@/components/almanac/AlmanacEmptyState';
import type { UserProfile } from '@/types';

type ViewPhase = 'draw' | 'detail';

interface AlmanacModalProps {
  visible: boolean;
  skipDraw?: boolean;
  date?: Date;
  userProfile?: UserProfile | null;
  onClose: () => void;
}

export default function AlmanacModal({
  visible,
  skipDraw = false,
  date,
  userProfile,
  onClose,
}: AlmanacModalProps) {
  const dateTime = date ? date.getTime() : null;
  const viewDate = useMemo(
    () => (dateTime != null ? new Date(dateTime) : new Date()),
    [dateTime]
  );
  const dateKey = useMemo(() => getDateKey(viewDate), [viewDate]);
  const todayKey = getDateKey();
  const isToday = dateKey === todayKey;
  const isPast = dateKey < todayKey;

  const cachedEntry = useAlmanacStore((s) => s.cache[dateKey] ?? null);
  const isGeneratingToday = useAlmanacStore((s) => s.isGeneratingToday);
  const ensureTodayAlmanac = useAlmanacStore((s) => s.ensureTodayAlmanac);
  const markSeenToday = useAlmanacStore((s) => s.markSeenToday);

  const almanac =
    cachedEntry && (!isToday || isAlmanacCacheValid(cachedEntry, userProfile))
      ? cachedEntry
      : null;

  const [phase, setPhase] = useState<ViewPhase>(skipDraw ? 'detail' : 'draw');
  const [saving, setSaving] = useState(false);
  const cardRef = useRef<View>(null);

  useEffect(() => {
    if (!visible) return;
    setPhase(skipDraw ? 'detail' : 'draw');
    setSaving(false);
  }, [visible, skipDraw, dateKey]);

  useEffect(() => {
    if (!visible || !isToday) return;
    if (almanac) {
      void markSeenToday();
      return;
    }

    let cancelled = false;
    void (async () => {
      await ensureTodayAlmanac(userProfile ?? undefined);
      if (!cancelled) {
        void markSeenToday();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, isToday, dateKey, almanac, userProfile, ensureTodayAlmanac, markSeenToday]);

  const handleSave = async () => {
    if (saving || !almanac) return;
    setSaving(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const uri = await capturePosterImage(cardRef);
      const result = await savePosterToAlbum(uri);
      Alert.alert(result === 'saved' ? '已保存' : '已分享', '赛博黄历已生成');
    } catch (err) {
      Alert.alert('生成失败', err instanceof Error ? err.message : '请稍后再试');
    } finally {
      setSaving(false);
    }
  };

  const renderBody = () => {
    if (isPast && !almanac) {
      return (
        <AlmanacEmptyState
          title="当日未求签"
          message="天机只会在点击当天的日历格时生成，过期不补。"
          icon="time-outline"
        />
      );
    }

    if (isToday && !almanac && isGeneratingToday) {
      return (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={cyberTheme.colors.primary} />
          <Text style={styles.loadingText}>南天门正在撰写今日黄历…</Text>
          <Text style={styles.loadingHint}>结合你的生辰与画像，专属签运生成中</Text>
        </View>
      );
    }

    if (isToday && !almanac) {
      return (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={cyberTheme.colors.primary} />
          <Text style={styles.loadingText}>正在准备今日签筒…</Text>
        </View>
      );
    }

    if (!almanac) return null;

    if (phase === 'draw' && isToday) {
      return (
        <AlmanacDrawOverlay
          level={almanac.level}
          levelColor={almanac.levelColor}
          onComplete={() => setPhase('detail')}
        />
      );
    }

    return (
      <View style={styles.detailWrap}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <DailyAlmanacCard ref={cardRef} almanac={almanac} />
          {almanac.source === 'ai' ? (
            <Text style={styles.aiBadge}>✦ 今日 AI 定制 · 结合你的画像</Text>
          ) : null}
        </ScrollView>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color={cyberTheme.colors.background} />
            ) : (
              <>
                <Ionicons
                  name="download-outline"
                  size={18}
                  color={cyberTheme.colors.background}
                />
                <Text style={styles.actionBtnText}>保存 / 分享黄历</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={24} color={cyberTheme.colors.textDim} />
        </TouchableOpacity>
        {renderBody()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: cyberTheme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  closeBtn: {
    position: 'absolute',
    top: 48,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingWrap: {
    alignItems: 'center',
    paddingHorizontal: cyberTheme.spacing.xl,
  },
  loadingText: {
    color: cyberTheme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: cyberTheme.spacing.lg,
    letterSpacing: 1,
  },
  loadingHint: {
    color: cyberTheme.colors.textDim,
    fontSize: 13,
    marginTop: cyberTheme.spacing.sm,
  },
  detailWrap: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  aiBadge: {
    color: cyberTheme.colors.accent,
    fontSize: 11,
    letterSpacing: 1,
    marginTop: cyberTheme.spacing.sm,
  },
  actions: {
    width: '100%',
    alignItems: 'center',
    paddingTop: cyberTheme.spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: cyberTheme.spacing.xl,
    paddingVertical: 12,
    borderRadius: cyberTheme.borderRadius.md,
    backgroundColor: cyberTheme.colors.primary,
    minWidth: 200,
  },
  actionBtnText: {
    color: cyberTheme.colors.background,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
