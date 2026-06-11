/** 正式起卦/抽牌意图关键词（单聊与群聊共用） */
export const FORTUNE_REQUEST_PATTERN =
  /算一卦|起一卦|起卦|抽牌|占卜|看看运势|重新算|再算|再抽|再起|帮我算|算一下|卜一卦|拍一卦|拍一挂/;

export function isFortuneRequest(text: string): boolean {
  return FORTUNE_REQUEST_PATTERN.test(text.trim());
}
