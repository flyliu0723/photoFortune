import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cyberTheme } from '@/constants/theme';

interface ProfileModuleCardProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeTone?: 'required' | 'optional';
  collapsible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
}

export default function ProfileModuleCard({
  title,
  subtitle,
  badge,
  badgeTone = 'optional',
  collapsible,
  expanded = true,
  onToggle,
  children,
}: ProfileModuleCardProps) {
  const HeaderWrapper = collapsible ? TouchableOpacity : View;

  return (
    <View style={styles.card}>
      <HeaderWrapper
        style={styles.header}
        onPress={collapsible ? onToggle : undefined}
        activeOpacity={collapsible ? 0.7 : 1}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <View style={styles.headerRight}>
          {badge ? (
            <View
              style={[
                styles.badge,
                badgeTone === 'required' ? styles.badgeRequired : styles.badgeOptional,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  badgeTone === 'required' ? styles.badgeTextRequired : styles.badgeTextOptional,
                ]}
              >
                {badge}
              </Text>
            </View>
          ) : null}
          {collapsible ? (
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={cyberTheme.colors.textDim}
            />
          ) : null}
        </View>
      </HeaderWrapper>
      {expanded ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: cyberTheme.spacing.md,
    borderRadius: cyberTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,245,255,0.2)',
    backgroundColor: 'rgba(26,26,46,0.6)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: cyberTheme.spacing.md,
    paddingVertical: cyberTheme.spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(42,42,74,0.8)',
  },
  headerLeft: {
    flex: 1,
    paddingRight: cyberTheme.spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: cyberTheme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    color: cyberTheme.colors.textDim,
    fontSize: 11,
    marginTop: 2,
  },
  badge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeRequired: {
    backgroundColor: 'rgba(0,245,255,0.12)',
  },
  badgeOptional: {
    backgroundColor: 'rgba(107,107,141,0.15)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  badgeTextRequired: {
    color: cyberTheme.colors.primary,
  },
  badgeTextOptional: {
    color: cyberTheme.colors.textDim,
  },
  body: {
    padding: cyberTheme.spacing.md,
  },
});
