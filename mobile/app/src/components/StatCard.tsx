import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, textStyles } from '../theme';

interface StatCardProps {
  icon?: string;
  value: string | number;
  label: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  trend,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={['rgba(0, 217, 255, 0.1)', 'rgba(168, 85, 247, 0.1)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
        {trend && (
          <Text
            style={[
              styles.trend,
              trend.isPositive ? styles.trendPositive : styles.trendNegative,
            ]}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </Text>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.accent,
    overflow: 'hidden',
  },
  gradient: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  icon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  value: {
    ...textStyles.h2,
    color: colors.brand.cyan,
    fontWeight: '700',
  },
  label: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  trend: {
    ...textStyles.caption,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  trendPositive: {
    color: colors.success,
  },
  trendNegative: {
    color: colors.error,
  },
});
