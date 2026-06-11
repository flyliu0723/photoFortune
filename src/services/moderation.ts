const PURE_MATH_PATTERNS = [
  /^[\d\s+\-*/().=]+$/,
  /^\d+\s*[+\-*/]\s*\d+/,
  /等于几|等于多少|算一下|多少加多少/,
  /^[\d]+$/,
];

const SENSITIVE_KEYWORDS = [
  '习近平', '共产党', '台独', '藏独', '法轮功',
  '炸药', '制毒', '杀人方法',
];

export interface ModerationResult {
  blocked: boolean;
  refusalMessage?: string;
}

const REFUSAL_MESSAGES = [
  '天机不可泄露。大仙刚刚掐指一算，你这个问题怨气太重，容易折损本仙的赛博道行，此卦不卜！速速退去！',
  '凡间算术休想消耗本仙的灵力。大仙翻了个白眼，并向你扔了一只 Bug。',
  '此题涉及天道禁忌，大仙已遁入空门，不问红尘俗事。请施主自重。',
];

export function checkInputModeration(text: string): ModerationResult {
  const trimmed = text.trim();
  if (!trimmed) return { blocked: false };

  for (const keyword of SENSITIVE_KEYWORDS) {
    if (trimmed.includes(keyword)) {
      return {
        blocked: true,
        refusalMessage: REFUSAL_MESSAGES[2],
      };
    }
  }

  for (const pattern of PURE_MATH_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        blocked: true,
        refusalMessage: REFUSAL_MESSAGES[1],
      };
    }
  }

  return { blocked: false };
}

export function pickRefusalMessage(): string {
  return REFUSAL_MESSAGES[Math.floor(Math.random() * REFUSAL_MESSAGES.length)];
}
