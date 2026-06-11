import { ImageSourcePropType } from 'react-native';
import { MAJOR_ARCANA } from '@/constants/tarot';

/**
 * Rider-Waite-Smith 大阿卡纳牌面（公共领域扫描图）
 * 图源：terminal-tarot (MIT) / luciellaes CC0 系清理图
 */
const TAROT_IMAGE_SOURCES: ImageSourcePropType[] = [
  require('../../assets/tarot/00.jpg'),
  require('../../assets/tarot/01.jpg'),
  require('../../assets/tarot/02.jpg'),
  require('../../assets/tarot/03.jpg'),
  require('../../assets/tarot/04.jpg'),
  require('../../assets/tarot/05.jpg'),
  require('../../assets/tarot/06.jpg'),
  require('../../assets/tarot/07.jpg'),
  require('../../assets/tarot/08.jpg'),
  require('../../assets/tarot/09.jpg'),
  require('../../assets/tarot/10.jpg'),
  require('../../assets/tarot/11.jpg'),
  require('../../assets/tarot/12.jpg'),
  require('../../assets/tarot/13.jpg'),
  require('../../assets/tarot/14.jpg'),
  require('../../assets/tarot/15.jpg'),
  require('../../assets/tarot/16.jpg'),
  require('../../assets/tarot/17.jpg'),
  require('../../assets/tarot/18.jpg'),
  require('../../assets/tarot/19.jpg'),
  require('../../assets/tarot/20.jpg'),
  require('../../assets/tarot/21.jpg'),
];

export function getTarotCardImage(cardName: string): ImageSourcePropType | null {
  const index = (MAJOR_ARCANA as readonly string[]).indexOf(cardName);
  if (index < 0) return null;
  return TAROT_IMAGE_SOURCES[index] ?? null;
}
