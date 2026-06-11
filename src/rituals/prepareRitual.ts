import { castBaguaHexagram } from '@/services/bagua';
import { readBaziChart } from '@/services/bazi';
import { castOnmyojiSeal } from '@/services/onmyoji';
import { drawTarotSpread } from '@/services/tarot';
import { readZodiacChart } from '@/services/zodiac';
import { scanMbtiProfile } from '@/services/mbti';
import { tallyMerit } from '@/services/merit';
import { getCharacterById } from '@/constants/characters';
import { buildRitualContext } from '@/rituals/buildRitualContext';
import type {
  CharacterId,
  FortuneResultMeta,
  FortuneType,
  RitualData,
  UserProfile,
} from '@/types';

export interface PreparedRitual {
  meta: FortuneResultMeta;
  ritualContext: string;
  ritualData: RitualData;
}

export function prepareRitual(
  characterId: CharacterId,
  scene: FortuneType,
  profile?: UserProfile,
  userInput?: string
): PreparedRitual {
  const character = getCharacterById(characterId);
  const meta: FortuneResultMeta = {};
  const ritualData: RitualData = {};

  switch (character.ritual) {
    case 'tarot_draw': {
      const tarotCards = drawTarotSpread(scene);
      meta.tarotCards = tarotCards;
      ritualData.tarotCards = tarotCards;
      break;
    }
    case 'bagua_cast': {
      const hexagram = castBaguaHexagram(scene);
      meta.hexagram = hexagram;
      ritualData.hexagram = hexagram;
      break;
    }
    case 'onmyoji_seal': {
      const onmyoji = castOnmyojiSeal();
      meta.onmyoji = onmyoji;
      ritualData.onmyoji = onmyoji;
      break;
    }
    case 'zodiac_chart': {
      const zodiac = readZodiacChart(profile?.constellation.zodiac);
      meta.zodiac = zodiac;
      ritualData.zodiac = zodiac;
      break;
    }
    case 'bazi_chart': {
      const bazi = readBaziChart(profile?.bazi);
      meta.bazi = bazi;
      ritualData.bazi = bazi;
      break;
    }
    case 'mbti_scan': {
      const mbti = scanMbtiProfile(scene, profile?.mbtiType, profile?.bazi);
      meta.mbti = mbti;
      ritualData.mbti = mbti;
      break;
    }
    case 'merit_tally': {
      const merit = tallyMerit(scene);
      meta.merit = merit;
      ritualData.merit = merit;
      break;
    }
    default:
      break;
  }

  return {
    meta,
    ritualContext: buildRitualContext(scene, meta, characterId, profile, userInput),
    ritualData,
  };
}
