import React from 'react';
import TarotRitual from '@/components/rituals/TarotRitual';
import BaguaRitual from '@/components/rituals/BaguaRitual';
import OnmyojiRitual from '@/components/rituals/OnmyojiRitual';
import ZodiacRitual from '@/components/rituals/ZodiacRitual';
import BaziRitual from '@/components/rituals/BaziRitual';
import MbtiRitual from '@/components/rituals/MbtiRitual';
import MeritRitual from '@/components/rituals/MeritRitual';
import type { RitualData, RitualType } from '@/types';

interface RitualHostProps {
  ritual: RitualType;
  visible: boolean;
  ready: boolean;
  characterLabel?: string;
  ritualData?: RitualData;
  onComplete: () => void;
}

export default function RitualHost({
  ritual,
  visible,
  ready,
  characterLabel,
  ritualData = {},
  onComplete,
}: RitualHostProps) {
  const common = { visible, ready, characterLabel, onComplete };

  switch (ritual) {
    case 'tarot_draw':
      return (
        <TarotRitual
          {...common}
          cards={ritualData.tarotCards ?? []}
        />
      );
    case 'bagua_cast':
      return <BaguaRitual {...common} hexagram={ritualData.hexagram} />;
    case 'onmyoji_seal':
      return <OnmyojiRitual {...common} onmyoji={ritualData.onmyoji} />;
    case 'zodiac_chart':
      return <ZodiacRitual {...common} zodiac={ritualData.zodiac} />;
    case 'bazi_chart':
      return <BaziRitual {...common} bazi={ritualData.bazi} />;
    case 'mbti_scan':
      return <MbtiRitual {...common} mbti={ritualData.mbti} />;
    case 'merit_tally':
      return <MeritRitual {...common} merit={ritualData.merit} />;
    default:
      return null;
  }
}
