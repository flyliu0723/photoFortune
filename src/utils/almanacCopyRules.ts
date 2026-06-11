import type { AlmanacEntry } from '@/constants/almanac';

/** 禁止出现的空泛词（title 或 desc 命中即不合格） */
export const BANNED_ALMANAC_WORDS = [
  '努力',
  '懒惰',
  '积极',
  '谨慎',
  '低调',
  '保持',
  '注意',
  '小心',
  '加油',
  '奋斗',
  '拼搏',
  '上进',
  '心态',
  '正能量',
  '今日宜',
  '今日忌',
  '宜努力',
  '忌懒惰',
  '顺其自然',
  '随缘',
  '万事',
  '平安',
  '顺利',
] as const;

/** 具体性信号：宜忌至少命中其一（动作/工具/时间/场景） */
const SPECIFICITY_PATTERNS = [
  /\d+点/,
  /\d+分钟/,
  /\d+秒/,
  /下午|上午|午休|下班|周一|周二|周三|周四|周五|站会|周会|早会/,
  /电脑|重启|键盘|鼠标|显示器|工位|伸懒腰|摸鱼/,
  /微信|钉钉|飞书|企微|邮件|群|@|已读|忙碌|状态/,
  /咖啡|奶茶|外卖|茶水间|打印机|厕所|带薪/,
  /老板|领导|HR|同事|甲方|会议|摄像头|麦克风/,
  /代码|部署|上线|Bug|周报|PPT|Excel|文档/,
  /耳机|静音|离席|绕道|准点|第一个|最后一个/,
];

function containsBanned(text: string): boolean {
  return BANNED_ALMANAC_WORDS.some((word) => text.includes(word));
}

function hasSpecificitySignal(text: string): boolean {
  return SPECIFICITY_PATTERNS.some((pattern) => pattern.test(text));
}

/** 单条宜忌是否足够具体 */
export function isSpecificAlmanacEntry(entry: AlmanacEntry): boolean {
  const title = entry.title.trim();
  const desc = entry.desc.trim();
  const combined = `${title}${desc}`;

  if (title.length < 3 || desc.length < 8) return false;
  if (containsBanned(combined)) return false;
  if (!hasSpecificitySignal(combined)) return false;

  return true;
}

/** 校验宜忌各 3 条是否全部达标 */
export function validateAlmanacEntries(yi: AlmanacEntry[], ji: AlmanacEntry[]): boolean {
  if (yi.length < 3 || ji.length < 3) return false;
  return [...yi, ...ji].every(isSpecificAlmanacEntry);
}

export const ALMANAC_RETRY_HINT = `（重要：每条宜忌必须是极其具体的职场微行为，禁止空泛词。
title 写具体动作（4-12字），desc 写时间/工具/后果/彩蛋（14-28字）。
正例：title「重启电脑」desc「系统更新卡住时离席5分钟，回来正好错过站会」
反例：title「今日宜努力」desc「保持积极心态」——绝对禁止）`;
