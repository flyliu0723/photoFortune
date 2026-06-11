import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { cyberTheme } from '@/constants/theme';
import { APP_CONFIG, BIRTH_HOURS, ZODIAC_SIGNS } from '@/constants/config';
import { MBTI_TYPES } from '@/constants/mbti';
import { ZODIAC_EMOJI } from '@/constants/zodiacEmoji';
import ProfileModuleCard from '@/components/profile/ProfileModuleCard';
import { resolveAutoZodiac } from '@/utils/constellationProfile';
import { resolveNickname } from '@/utils/userProfile';
import { useUserStore, type ProfileFormData } from '@/stores/userStore';
import type { UserProfile } from '@/types';

const BLOOD_TYPES = ['A', 'B', 'AB', 'O'] as const;

function parseHourRange(label: string): string {
  const match = label.match(/\(([^)]+)\)/);
  return match ? match[1] : '';
}

interface ProfileFormProps {
  profile: UserProfile | null;
}

function buildDraftFromProfile(profile: UserProfile | null) {
  return {
    nickname: resolveNickname(profile),
    gender: profile?.bazi.gender ?? ('male' as const),
    birthDate: profile?.bazi.birthDate ?? '',
    birthHour: profile?.bazi.birthHour ?? '子',
    birthPlace: profile?.bazi.birthPlace ?? '',
    mbtiType: profile?.mbtiType ?? '',
    useManualZodiac: !!profile?.constellation.zodiacIsManual,
    zodiac: profile?.constellation.zodiac ?? '',
    moonSign: profile?.constellation.moonSign ?? '',
    risingSign: profile?.constellation.risingSign ?? '',
    bloodType: profile?.constellation.bloodType ?? '',
  };
}

export default function ProfileForm({ profile }: ProfileFormProps) {
  const saveProfileForm = useUserStore((s) => s.saveProfileForm);
  const [draft, setDraft] = useState(() => buildDraftFromProfile(profile));
  const [calendarType, setCalendarType] = useState<'solar' | 'lunar'>('solar');
  const [westernExpanded, setWesternExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(buildDraftFromProfile(profile));
  }, [profile]);

  const autoZodiac = useMemo(() => resolveAutoZodiac(draft.birthDate), [draft.birthDate]);
  const displaySunSign = draft.useManualZodiac ? draft.zodiac : autoZodiac;

  const patch = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSign = (field: 'moonSign' | 'risingSign' | 'zodiac', sign: string) => {
    setDraft((prev) => ({
      ...prev,
      [field]: prev[field] === sign ? '' : sign,
    }));
  };

  const handleSave = async () => {
    if (!draft.birthDate.trim()) {
      Alert.alert('还差一步', '请填写出生日期，东方命盘才能起算');
      return;
    }

    const payload: ProfileFormData = {
      nickname: draft.nickname,
      gender: draft.gender,
      birthDate: draft.birthDate.trim(),
      birthHour: draft.birthHour,
      birthPlace: draft.birthPlace.trim() || undefined,
      mbtiType: draft.mbtiType || undefined,
      zodiacIsManual: draft.useManualZodiac,
      zodiac: draft.useManualZodiac ? draft.zodiac : undefined,
      moonSign: draft.moonSign || undefined,
      risingSign: draft.risingSign || undefined,
      bloodType: draft.bloodType || undefined,
    };

    setSaving(true);
    try {
      await saveProfileForm(payload);
      Alert.alert('激活成功', '赛博档案已写入，大仙们可以开始算你了');
    } finally {
      setSaving(false);
    }
  };

  const renderSignGrid = (
    field: 'moonSign' | 'risingSign' | 'zodiac',
    compact?: boolean
  ) => (
    <View style={[styles.signGrid, compact && styles.signGridCompact]}>
      {ZODIAC_SIGNS.map((sign) => {
        const active = draft[field] === sign;
        return (
          <TouchableOpacity
            key={sign}
            style={[styles.signBtn, active && styles.chipActive]}
            onPress={() => toggleSign(field, sign)}
          >
            <Text style={[styles.signBtnText, active && styles.chipTextActive]} numberOfLines={1}>
              {sign.replace('座', '')}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.heroTitle}>注入你的赛博基因</Text>
      <Text style={styles.heroHint}>填完点底部按钮，一次性激活档案</Text>

      {profile ? (
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {[
              resolveNickname(profile),
              profile.constellation.chineseZodiac,
              profile.constellation.zodiac,
              profile.constellation.moonSign
                ? `月${profile.constellation.moonSign.replace('座', '')}`
                : '',
              profile.mbtiType,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
      ) : null}

      <ProfileModuleCard title="基础识别" subtitle="大仙怎么称呼你" badge="必填" badgeTone="required">
        <Text style={styles.fieldLabel}>昵称</Text>
        <TextInput
          style={styles.input}
          value={draft.nickname}
          onChangeText={(v) => patch('nickname', v)}
          placeholder={APP_CONFIG.defaultNickname}
          placeholderTextColor={cyberTheme.colors.textDim}
          maxLength={20}
        />
        <Text style={styles.fieldHint}>默认「{APP_CONFIG.defaultNickname}」，对话里会用这个叫你</Text>

        <Text style={styles.fieldLabel}>性别</Text>
        <View style={styles.row2}>
          {(['male', 'female'] as const).map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.chip, draft.gender === g && styles.chipActive]}
              onPress={() => patch('gender', g)}
            >
              <Text style={[styles.chipText, draft.gender === g && styles.chipTextActive]}>
                {g === 'male' ? '男' : '女'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ProfileModuleCard>

      <ProfileModuleCard
        title="东方命盘算力"
        subtitle="八字排盘核心输入"
        badge="必填"
        badgeTone="required"
      >
        <View style={styles.row2}>
          {(['solar', 'lunar'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.chip, calendarType === type && styles.chipActive]}
              onPress={() => setCalendarType(type)}
            >
              <Text style={[styles.chipText, calendarType === type && styles.chipTextActive]}>
                {type === 'solar' ? '公历' : '农历'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>出生日期（{calendarType === 'solar' ? '公历' : '农历'}）</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={cyberTheme.colors.textDim}
          value={draft.birthDate}
          onChangeText={(v) => patch('birthDate', v)}
          keyboardType="numbers-and-punctuation"
        />

        <Text style={styles.fieldLabel}>出生时辰</Text>
        <View style={styles.hourGrid}>
          {BIRTH_HOURS.map((hour) => {
            const active = draft.birthHour === hour.value;
            return (
              <TouchableOpacity
                key={hour.value}
                style={[styles.hourCell, active && styles.chipActive]}
                onPress={() => patch('birthHour', hour.value)}
              >
                <Text style={[styles.hourChar, active && styles.chipTextActive]}>{hour.value}</Text>
                <Text style={[styles.hourRange, active && styles.hourRangeActive]} numberOfLines={1}>
                  {parseHourRange(hour.label)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.fieldLabel}>出生地（选填）</Text>
        <TextInput
          style={styles.input}
          placeholder="如：北京市，用于真太阳时校准"
          placeholderTextColor={cyberTheme.colors.textDim}
          value={draft.birthPlace}
          onChangeText={(v) => patch('birthPlace', v)}
        />
      </ProfileModuleCard>

      <ProfileModuleCard
        title="西方星盘补全"
        subtitle="占星魔女专用加成"
        badge="选填"
        badgeTone="optional"
        collapsible
        expanded={westernExpanded}
        onToggle={() => setWesternExpanded((v) => !v)}
      >
        <Text style={styles.fieldLabel}>太阳星座</Text>
        {!draft.birthDate ? (
          <View style={styles.sunDisabled}>
            <Text style={styles.sunDisabledText}>填写出生日期后自动亮起</Text>
          </View>
        ) : (
          <>
            {displaySunSign && !draft.useManualZodiac ? (
              <View style={styles.sunBadge}>
                <Text style={styles.sunBadgeText}>
                  {ZODIAC_EMOJI[displaySunSign] ?? '✦'} {displaySunSign}
                </Text>
                <Text style={styles.sunBadgeHint}>已根据出生日期自动推算</Text>
              </View>
            ) : null}
            <View style={styles.row2}>
              <TouchableOpacity
                style={[styles.chip, !draft.useManualZodiac && styles.chipActive]}
                onPress={() => patch('useManualZodiac', false)}
              >
                <Text style={[styles.chipText, !draft.useManualZodiac && styles.chipTextActive]}>
                  用自动推算
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chip, draft.useManualZodiac && styles.chipActive]}
                onPress={() => patch('useManualZodiac', true)}
              >
                <Text style={[styles.chipText, draft.useManualZodiac && styles.chipTextActive]}>
                  手动指定
                </Text>
              </TouchableOpacity>
            </View>
            {draft.useManualZodiac ? renderSignGrid('zodiac', true) : null}
          </>
        )}

        <Text style={[styles.fieldLabel, styles.fieldGap]}>月亮星座</Text>
        <Text style={styles.fieldHint}>不知道可跳过</Text>
        {renderSignGrid('moonSign', true)}

        <Text style={[styles.fieldLabel, styles.fieldGap]}>上升星座</Text>
        <Text style={styles.fieldHint}>不知道可跳过</Text>
        {renderSignGrid('risingSign', true)}
      </ProfileModuleCard>

      <ProfileModuleCard
        title="现代赛博标签"
        subtitle="MBTI 与人格侧写"
        badge="选填"
        badgeTone="optional"
      >
        <Text style={styles.fieldLabel}>MBTI 人格</Text>
        <View style={styles.mbtiGrid}>
          {MBTI_TYPES.map((type) => {
            const active = draft.mbtiType === type;
            return (
              <TouchableOpacity
                key={type}
                style={[styles.mbtiBtn, active && styles.chipActive]}
                onPress={() => patch('mbtiType', active ? '' : type)}
              >
                <Text style={[styles.mbtiText, active && styles.chipTextActive]}>{type}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.fieldLabel, styles.fieldGap]}>血型</Text>
        <View style={styles.row4}>
          {BLOOD_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.bloodBtn, draft.bloodType === type && styles.chipActive]}
              onPress={() => patch('bloodType', draft.bloodType === type ? '' : type)}
            >
              <Text style={[styles.chipText, draft.bloodType === type && styles.chipTextActive]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ProfileModuleCard>

      <View style={styles.saveBar}>
        <Text style={styles.saveHint}>所有模块填写完毕后，点击下方一次性保存</Text>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>
            {saving ? '写入中…' : '激活我的赛博档案'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: cyberTheme.spacing.sm,
  },
  heroTitle: {
    color: cyberTheme.colors.primary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroHint: {
    color: cyberTheme.colors.textDim,
    fontSize: 12,
    marginBottom: cyberTheme.spacing.md,
  },
  summary: {
    backgroundColor: 'rgba(0,245,255,0.06)',
    borderRadius: cyberTheme.borderRadius.sm,
    padding: cyberTheme.spacing.sm,
    marginBottom: cyberTheme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.15)',
  },
  summaryText: {
    color: cyberTheme.colors.primary,
    fontSize: 12,
    lineHeight: 18,
  },
  fieldLabel: {
    color: cyberTheme.colors.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: cyberTheme.spacing.xs,
    marginTop: cyberTheme.spacing.sm,
  },
  fieldGap: {
    marginTop: cyberTheme.spacing.md,
  },
  fieldHint: {
    color: cyberTheme.colors.textDim,
    fontSize: 11,
    marginBottom: cyberTheme.spacing.sm,
  },
  input: {
    backgroundColor: cyberTheme.colors.background,
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    borderRadius: cyberTheme.borderRadius.sm,
    padding: cyberTheme.spacing.sm,
    color: cyberTheme.colors.text,
    fontSize: 15,
  },
  row2: {
    flexDirection: 'row',
    gap: cyberTheme.spacing.sm,
  },
  row4: {
    flexDirection: 'row',
    gap: cyberTheme.spacing.sm,
  },
  chip: {
    flex: 1,
    paddingVertical: cyberTheme.spacing.sm,
    borderRadius: cyberTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    alignItems: 'center',
    backgroundColor: cyberTheme.colors.background,
  },
  chipActive: {
    borderColor: cyberTheme.colors.primary,
    backgroundColor: 'rgba(0,245,255,0.12)',
  },
  chipText: {
    color: cyberTheme.colors.textDim,
    fontSize: 14,
  },
  chipTextActive: {
    color: cyberTheme.colors.primary,
    fontWeight: '700',
  },
  hourGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hourCell: {
    width: '23%',
    minWidth: 72,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: cyberTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    alignItems: 'center',
    backgroundColor: cyberTheme.colors.background,
  },
  hourChar: {
    color: cyberTheme.colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  hourRange: {
    color: cyberTheme.colors.textDim,
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
  },
  hourRangeActive: {
    color: cyberTheme.colors.primary,
  },
  sunDisabled: {
    padding: cyberTheme.spacing.md,
    borderRadius: cyberTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  sunDisabledText: {
    color: cyberTheme.colors.textDim,
    fontSize: 12,
    textAlign: 'center',
  },
  sunBadge: {
    padding: cyberTheme.spacing.md,
    borderRadius: cyberTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.35)',
    backgroundColor: 'rgba(0,245,255,0.08)',
    marginBottom: cyberTheme.spacing.sm,
  },
  sunBadgeText: {
    color: cyberTheme.colors.primary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  sunBadgeHint: {
    color: cyberTheme.colors.textDim,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  signGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  signGridCompact: {
    gap: 5,
  },
  signBtn: {
    width: '15%',
    minWidth: 42,
    paddingVertical: 6,
    borderRadius: cyberTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    alignItems: 'center',
    backgroundColor: cyberTheme.colors.background,
  },
  signBtnText: {
    color: cyberTheme.colors.textDim,
    fontSize: 11,
  },
  mbtiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mbtiBtn: {
    width: '22%',
    minWidth: 64,
    paddingVertical: 8,
    borderRadius: cyberTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    alignItems: 'center',
    backgroundColor: cyberTheme.colors.background,
  },
  mbtiText: {
    color: cyberTheme.colors.textDim,
    fontSize: 11,
    fontWeight: '600',
  },
  bloodBtn: {
    flex: 1,
    paddingVertical: cyberTheme.spacing.sm,
    borderRadius: cyberTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: cyberTheme.colors.border,
    alignItems: 'center',
    backgroundColor: cyberTheme.colors.background,
  },
  saveBar: {
    marginTop: cyberTheme.spacing.sm,
    paddingTop: cyberTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,245,255,0.2)',
  },
  saveHint: {
    color: cyberTheme.colors.textDim,
    fontSize: 11,
    textAlign: 'center',
    marginBottom: cyberTheme.spacing.sm,
  },
  saveBtn: {
    backgroundColor: cyberTheme.colors.accent,
    borderRadius: cyberTheme.borderRadius.md,
    paddingVertical: cyberTheme.spacing.md,
    alignItems: 'center',
    shadowColor: cyberTheme.colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: cyberTheme.colors.background,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
