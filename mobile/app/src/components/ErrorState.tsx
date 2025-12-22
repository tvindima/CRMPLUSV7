import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, textStyles, radius } from '../theme';
import { NeonButton } from './NeonButton';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Algo correu mal',
  message,
  onRetry,
  retryLabel = 'Tentar novamente',
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        {onRetry && (
          <NeonButton
            title={retryLabel}
            onPress={onRetry}
            variant="secondary"
            style={styles.button}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  card: {
    backgroundColor: colors.card.primary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
    padding: spacing['3xl'],
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  title: {
    ...textStyles.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    ...textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  button: {
    width: '100%',
  },
});
