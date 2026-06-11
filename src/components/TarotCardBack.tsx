import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { cyberTheme } from '@/constants/theme';

interface TarotCardBackProps {
  width?: number;
  height?: number;
}

export default function TarotCardBack({ width = 72, height = 108 }: TarotCardBackProps) {
  return (
    <LinearGradient
      colors={['#2A1530', '#1A1020', '#2A1530']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { width, height, borderRadius: width * 0.1 }]}
    >
      <View style={styles.innerBorder}>
        <Text style={[styles.symbol, { fontSize: width * 0.34 }]}>塔</Text>
        <Text style={styles.caption}>塔罗</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderColor: cyberTheme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  innerBorder: {
    flex: 1,
    alignSelf: 'stretch',
    margin: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,107,157,0.45)',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  symbol: {
    color: cyberTheme.colors.secondary,
    fontWeight: 'bold',
  },
  caption: {
    color: 'rgba(255,107,157,0.75)',
    fontSize: 10,
    marginTop: 4,
    letterSpacing: 2,
  },
});
