import type { FortuneType } from '@/types';

const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'] as const;

const ENERGY_TIPS = [
  '今日宜摸鱼，忌跟路人抢黄灯',
  '宜带薪如厕，忌主动揽活',
  '宜朝吉方先走三步，忌跟老板对视',
  '宜多喝热水，忌在群里已读不回',
] as const;

export interface FeaturedScene {
  mode: FortuneType;
  title: string;
  subtitle: string;
}

export function getDailyEnergyTip(): string {
  const index = new Date().getDate() % ENERGY_TIPS.length;
  return ENERGY_TIPS[index];
}

export function getFeaturedScene(): FeaturedScene {
  const day = new Date().getDay();

  if (day === 0 || day === 6) {
    return {
      mode: 'travel',
      title: '周末出关，先看看路况',
      subtitle: '拍鞋或防盗门 · 测今日出行是否遇沙雕',
    };
  }

  const dayName = WEEKDAY_NAMES[day];
  return {
    mode: 'work',
    title: `今日周${dayName}，打卡煞气极重`,
    subtitle: '点击直拍工位 · 开启搬砖续命局',
  };
}
