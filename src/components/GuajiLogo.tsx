import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { cyberTheme } from '@/constants/theme';

interface GuajiLogoProps {
  size?: number;
  showMustache?: boolean;
}

export default function GuajiLogo({ size = 64, showMustache = true }: GuajiLogoProps) {
  const ringSize = size;
  const innerSize = size * 0.55;

  return (
    <View style={[styles.wrap, { width: ringSize, height: ringSize + (showMustache ? 12 : 0) }]}>
      <View
        style={[
          styles.lens,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
          },
        ]}
      >
        <View
          style={[
            styles.bagua,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
            },
          ]}
        >
          <Text style={[styles.baguaText, { fontSize: innerSize * 0.45 }]}>☯</Text>
        </View>
        <View style={[styles.lensRing, { width: ringSize - 8, height: ringSize - 8, borderRadius: (ringSize - 8) / 2 }]} />
      </View>
      {showMustache && (
        <View style={styles.mustache}>
          <View style={styles.mustacheLeft} />
          <View style={styles.mustacheRight} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  lens: {
    backgroundColor: cyberTheme.colors.surface,
    borderWidth: 3,
    borderColor: cyberTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  lensRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.4)',
  },
  bagua: {
    backgroundColor: 'rgba(0,245,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: cyberTheme.colors.primary,
  },
  baguaText: {
    color: cyberTheme.colors.primary,
  },
  mustache: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  mustacheLeft: {
    width: 14,
    height: 6,
    borderBottomWidth: 2,
    borderBottomColor: cyberTheme.colors.primary,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 2,
    transform: [{ rotate: '-8deg' }],
  },
  mustacheRight: {
    width: 14,
    height: 6,
    borderBottomWidth: 2,
    borderBottomColor: cyberTheme.colors.primary,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 10,
    transform: [{ rotate: '8deg' }],
  },
});
