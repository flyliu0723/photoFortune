import React from 'react';
import FortuneBubble from '@/components/FortuneBubble';
import type { FortuneResult } from '@/types';

interface ResultBubbleProps {
  result: FortuneResult;
  onLongPress?: () => void;
  onCrossRead?: () => void;
  crossReadDisabled?: boolean;
}

export default function ResultBubble({
  result,
  onLongPress,
  onCrossRead,
  crossReadDisabled,
}: ResultBubbleProps) {
  return (
    <FortuneBubble
      result={result}
      onLongPress={onLongPress}
      onCrossRead={onCrossRead}
      crossReadDisabled={crossReadDisabled}
    />
  );
}
