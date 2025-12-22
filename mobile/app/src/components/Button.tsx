/**
 * Button - Componente de botão reutilizável
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  fullWidth?: boolean;
  style?: any;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  style,
}: ButtonProps) {
  const buttonStyles = [
    styles.button,
    styles[`${variant}Button`],
    styles[`${size}Button`],
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : Colors.light.primary} />
      ) : (
        <>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    fontSize: 20,
  },
  text: {
    fontWeight: Typography.weights.bold,
  },

  // Variants
  primaryButton: {
    backgroundColor: Colors.light.primary,
  },
  primaryText: {
    color: '#fff',
  },
  secondaryButton: {
    backgroundColor: Colors.light.secondary,
  },
  secondaryText: {
    color: '#fff',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  outlineText: {
    color: Colors.light.primary,
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: Colors.light.primary,
  },

  // Sizes
  smButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  smText: {
    fontSize: Typography.sizes.sm,
  },
  mdButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  mdText: {
    fontSize: Typography.sizes.md,
  },
  lgButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  lgText: {
    fontSize: Typography.sizes.lg,
  },
});
