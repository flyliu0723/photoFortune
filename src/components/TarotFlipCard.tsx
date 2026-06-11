import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import TarotCardBack from '@/components/TarotCardBack';
import TarotCardFace from '@/components/TarotCardFace';
import type { TarotCardDraw } from '@/types';

interface TarotFlipCardProps {
  card: TarotCardDraw;
  flipped: boolean;
  width?: number;
  height?: number;
  onPress?: () => void;
}

export default function TarotFlipCard({
  card,
  flipped,
  width = 72,
  height = 108,
  onPress,
}: TarotFlipCardProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(flipped ? 1 : 0, { duration: 680 });
  }, [flipped, progress]);

  const backStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(progress.value, [0, 1], [0, 180]);
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
      opacity: progress.value < 0.5 ? 1 : 0,
    };
  });

  const frontStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(progress.value, [0, 1], [180, 360]);
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
      opacity: progress.value >= 0.5 ? 1 : 0,
    };
  });

  const content = (
    <View style={[styles.stage, { width, height }]}>
      <Animated.View style={[styles.face, backStyle]}>
        <TarotCardBack width={width} height={height} />
      </Animated.View>
      <Animated.View style={[styles.face, frontStyle]}>
        <TarotCardFace
          name={card.name}
          reversed={card.reversed}
          size="compact"
          width={width}
          height={height}
          showName={false}
        />
      </Animated.View>
    </View>
  );

  if (flipped && onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  stage: {},
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backfaceVisibility: 'hidden',
  },
});
