import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, glow, textStyles } from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface NeonButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const NeonButton: React.FC<NeonButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[styles.button, isDisabled && styles.disabled, style]}
      >
        <LinearGradient
          colors={[colors.brand.cyan, colors.brand.purple]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, isDisabled && styles.gradientDisabled]}
        >
          {loading ? (
            <ActivityIndicator color={colors.text.primary} />
          ) : (
            <>
              {icon && <>{icon}</>}
              <Text style={[styles.text, styles.textPrimary, textStyle]}>
                {title}
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[styles.button, styles.buttonSecondary, isDisabled && styles.disabled, style]}
      >
        {loading ? (
          <ActivityIndicator color={colors.brand.magenta} />
        ) : (
          <>
            {icon && <>{icon}</>}
            <Text style={[styles.text, styles.textSecondary, textStyle]}>
              {title}
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  // Ghost variant
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[styles.buttonGhost, isDisabled && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={colors.text.secondary} />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text style={[styles.text, styles.textGhost, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
    overflow: 'hidden',
    ...glow.subtle,
  },
  gradient: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  gradientDisabled: {
    opacity: 0.5,
  },
  buttonSecondary: {
    backgroundColor: colors.card.primary,
    borderWidth: 1.5,
    borderColor: colors.brand.magenta,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  buttonGhost: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  text: {
    ...textStyles.button,
  },
  textPrimary: {
    color: colors.text.primary,
  },
  textSecondary: {
    color: colors.brand.magenta,
  },
  textGhost: {
    color: colors.text.secondary,
  },
  disabled: {
    opacity: 0.5,
  },
});
