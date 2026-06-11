import React, { useState, useEffect } from 'react';
import { View, Text, TextStyle, StyleProp, StyleSheet } from 'react-native';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  style?: StyleProp<TextStyle>;
  onComplete?: () => void;
}

export default function TypewriterText({
  text,
  speed = 28,
  style,
  onComplete,
}: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let index = 0;

    const timer = setInterval(() => {
      index += 1;
      if (index <= text.length) {
        setDisplayed(text.slice(0, index));
      } else {
        clearInterval(timer);
        setDone(true);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, onComplete]);

  return (
    <View style={styles.wrap}>
      <Text style={[style, styles.placeholder]} accessibilityElementsHidden>
        {text}
      </Text>
      <Text style={[style, styles.overlay]}>
        {displayed}
        {!done && '|'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  placeholder: {
    opacity: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
