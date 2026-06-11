import { formatUserProfile } from '@/utils/userProfile';
import { BANNED_ALMANAC_WORDS } from '@/utils/almanacCopyRules';
import type { PersonalizedAlmanacCore } from '@/utils/dailyAlmanac';
import type { UserProfile } from '@/types';

export const ALMANAC_SYSTEM_PROMPT = `你是「卦叽」App 的赛博黄历撰写官，专写打工人老黄历。
你的唯一任务：写出让人想截图的、极其具体的职场微行为宜忌。

风格：骚、损、有梗、像互联网嘴替，但不得辱骂、歧视、涉政、色情或真实人身攻击。
必须结合用户画像深度定制宜忌文案，同一日期不同用户必须写出明显不同的 desc。
禁止生硬罗列星座/MBTI/生肖档案，但要让人感觉到「这是写给我的」。
只输出合法 JSON，不要 markdown、不要解释、不要前后缀。`;

const BANNED_SAMPLE = BANNED_ALMANAC_WORDS.slice(0, 12).join('、');

export function buildAlmanacUserPrompt(options: {
  dateKey: string;
  weekday: string;
  userProfile?: UserProfile;
  personalizedCore: PersonalizedAlmanacCore;
  strictRetry?: boolean;
}): string {
  const profileText = formatUserProfile(options.userProfile);
  const { personalizedCore: core } = options;
  const retryBlock = options.strictRetry
    ? `\n【上次不合格，务必改正】
你上次写了空泛词或不够具体。每条必须像「重启电脑 + 借机摸鱼5分钟」这种粒度，禁止「宜努力忌懒惰」。\n`
    : '';

  const referenceYi = core.yi
    .map((item, index) => `${index + 1}. ${item.title}：${item.desc}`)
    .join('\n');
  const referenceJi = core.ji
    .map((item, index) => `${index + 1}. ${item.title}：${item.desc}`)
    .join('\n');

  return `请为 ${options.dateKey}（${options.weekday}）生成一份「赛博打工人黄历」。
${retryBlock}
【用户画像】
${profileText}

【专属签运锚点 · 不得修改以下字段】
以下数值已由用户档案+日期锁定，JSON 中必须原样输出：
- level: "${core.level}"
- luckyNumber: ${core.luckyNumber}
- luckyDirection: "${core.luckyDirection}"
- luckySeat: "${core.luckySeat}"
- ganzhi: "${core.ganzhi}"
- personalSeed: ${core.personalSeed}（仅供你理解差异化，不要输出此字段）

【宜忌参考条目 · 必须以此为主题改写】
宜（可微调 title，desc 必须结合用户画像重写）：
${referenceYi}
忌（可微调 title，desc 必须结合用户画像重写）：
${referenceJi}

【铁律 · 宜忌写法】
1. yi 与 ji 各 3 条，每条含 title（4-12字具体动作）与 desc（14-28字，写时间/工具/App/后果/彩蛋）
2. 必须是可执行的职场微行为，读者看完能立刻对号入座
3. 每条 desc 至少包含以下之一：具体时间点（如下午3点）、具体工具/App（微信/钉钉/飞书/邮件）、具体身体动作（伸懒腰/离席）、具体后果
4. 禁止空泛词：${BANNED_SAMPLE} 等
5. title 禁止出现「今日宜」「今日忌」
6. 至少 2 条宜或忌的 desc 要暗合用户画像（如十神卷王、水逆、INFP 内耗等），禁止直说「你是 INFP 所以…」

【正例 · 必须接近这种粒度】
宜 title「重启电脑」 desc「更新卡住时借机离席5分钟，回来正好错过站会」
忌 title「3点前喝光咖啡」 desc「下午3点前喝完第一杯，4点必困，5点必加班」

【反例 · 绝对禁止】
宜 title「今日宜努力」 desc「保持积极心态，认真工作」

【输出 JSON 格式】
{
  "level": "${core.level}",
  "yi": [
    { "title": "...", "desc": "..." },
    { "title": "...", "desc": "..." },
    { "title": "...", "desc": "..." }
  ],
  "ji": [
    { "title": "...", "desc": "..." },
    { "title": "...", "desc": "..." },
    { "title": "...", "desc": "..." }
  ],
  "luckyNumber": ${core.luckyNumber},
  "luckyDirection": "${core.luckyDirection}",
  "luckySeat": "${core.luckySeat}",
  "ganzhi": "${core.ganzhi}"
}`;
}
