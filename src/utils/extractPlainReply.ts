const PLAIN_REPLY_FIELDS = [
  'refusalMessage',
  'diagnosis',
  'summary',
  'content',
  'reply',
  'text',
  'message',
  'answer',
] as const;

function pickStringField(record: Record<string, unknown>): string {
  for (const key of PLAIN_REPLY_FIELDS) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

/** 从模型输出中提取可展示的纯文本回复 */
export function extractPlainReply(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return '';

  try {
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
      const fromObject = pickStringField(parsed);
      if (fromObject) return fromObject;
    }
  } catch {
    // 非 JSON，直接返回原文
  }

  return trimmed
    .replace(/^```[\w]*\n?/gm, '')
    .replace(/```$/gm, '')
    .trim();
}

/** 判断回复是否有实质内容（非空、非占位 JSON） */
export function isMeaningfulReply(text: string, minLength = 6): boolean {
  const normalized = text.trim();
  if (normalized.length < minLength) return false;
  if (normalized === '{}' || normalized === '[]') return false;
  if (/^[\{\[]/.test(normalized) && /[\}\]]$/.test(normalized) && normalized.length < 80) {
    return false;
  }
  return true;
}

export function truncateForPrompt(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}
