import { formatUserProfile } from '@/utils/userProfile';
import { BANNED_ALMANAC_WORDS } from '@/utils/almanacCopyRules';
import type { UserProfile } from '@/types';

export const ALMANAC_SYSTEM_PROMPT = `你是「卦叽」App 的赛博黄历撰写官，专写打工人老黄历。
你的唯一任务：写出让人想截图的、极其具体的职场微行为宜忌。

风格：骚、损、有梗、像互联网嘴替，但不得辱骂、歧视、涉政、色情或真实人身攻击。
必须结合用户画像微调语气，但禁止生硬罗列星座/MBTI/生肖档案。
只输出合法 JSON，不要 markdown、不要解释、不要前后缀。`;

const BANNED_SAMPLE = BANNED_ALMANAC_WORDS.slice(0, 12).join('、');

export function buildAlmanacUserPrompt(options: {
  dateKey: string;
  weekday: string;
  userProfile?: UserProfile;
  strictRetry?: boolean;
}): string {
  const profileText = formatUserProfile(options.userProfile);
  const retryBlock = options.strictRetry
    ? `\n【上次不合格，务必改正】
你上次写了空泛词或不够具体。每条必须像「重启电脑 + 借机摸鱼5分钟」这种粒度，禁止「宜努力忌懒惰」。\n`
    : '';

  return `请为 ${options.dateKey}（${options.weekday}）生成一份「赛博打工人黄历」。
${retryBlock}
【用户画像】
${profileText}

【铁律 · 宜忌写法】
1. yi 与 ji 各 3 条，每条含 title（4-12字具体动作）与 desc（14-28字，写时间/工具/App/后果/彩蛋）
2. 必须是可执行的职场微行为，读者看完能立刻对号入座
3. 每条 desc 至少包含以下之一：具体时间点（如下午3点）、具体工具/App（微信/钉钉/飞书/邮件）、具体身体动作（伸懒腰/离席）、具体后果
4. 禁止空泛词：${BANNED_SAMPLE} 等
5. title 禁止出现「今日宜」「今日忌」

【正例 · 必须接近这种粒度】
宜 title「重启电脑」 desc「更新卡住时借机离席5分钟，回来正好错过站会」
宜 title「微信改忙碌」 desc「状态切忙碌后已读不回，群消息自动降频」
忌 title「3点前喝光咖啡」 desc「下午3点前喝完第一杯，4点必困，5点必加班」
忌 title「群里@老板」 desc「主动在群里@老板，活会从天而降，撤回已来不及」

【反例 · 绝对禁止】
宜 title「今日宜努力」 desc「保持积极心态，认真工作」
忌 title「忌懒惰」 desc「不要偷懒，要注意」

【其他字段】
1. level 从以下五选一：大吉、中吉、小吉、末吉、凶
2. 结合用户画像微调 1 条宜或 1 条忌的措辞（不要直说「你是INFP所以…」）
3. luckyNumber 为 1-9 整数
4. luckyDirection 为正东/正南/正西/正北/东南/西北之一
5. luckySeat 为具体工位彩蛋，如「背对老板办公室门」「显示器挡老板视线」
6. ganzhi 为趣味干支日名，如「丙午日」

【输出 JSON 格式】
{
  "level": "中吉",
  "yi": [
    { "title": "重启电脑", "desc": "更新卡住时借机离席5分钟，回来正好错过站会" },
    { "title": "...", "desc": "..." },
    { "title": "...", "desc": "..." }
  ],
  "ji": [
    { "title": "3点前喝光咖啡", "desc": "下午3点前喝完第一杯，4点必困，5点必加班" },
    { "title": "...", "desc": "..." },
    { "title": "...", "desc": "..." }
  ],
  "luckyNumber": 7,
  "luckyDirection": "正南",
  "luckySeat": "背对老板办公室门",
  "ganzhi": "甲辰日"
}`;
}
