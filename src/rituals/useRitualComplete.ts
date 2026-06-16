import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Haptics from 'expo-haptics';

interface UseRitualCompleteOptions {
  visible: boolean;
  ready: boolean;
  canComplete?: boolean;
  minMs?: number;
  onComplete: () => void;
}

export function useRitualComplete({
  visible,
  ready,
  canComplete = true,
  minMs = 2600,
  onComplete,
}: UseRitualCompleteOptions) {
  const completedRef = useRef(false);
  const startTimeRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  const [foregroundTick, setForegroundTick] = useState(0);

  onCompleteRef.current = onComplete;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setForegroundTick((tick) => tick + 1);
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!visible) {
      completedRef.current = false;
      return;
    }
    startTimeRef.current = Date.now();
    completedRef.current = false;
  }, [visible]);

  useEffect(() => {
    if (!visible || !ready || !canComplete || completedRef.current) return;

    const elapsed = Date.now() - startTimeRef.current;
    const delay = Math.max(0, minMs - elapsed);

    const timer = setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onCompleteRef.current();
    }, delay);

    return () => clearTimeout(timer);
  }, [visible, ready, canComplete, minMs, foregroundTick]);
}
