import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, spacing, radius, textStyles } from '../theme';
import { NeonButton } from './NeonButton';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  destructive = false,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <BlurView intensity={20} style={styles.blur}>
          <View style={styles.modal}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            
            <View style={styles.actions}>
              <NeonButton
                title={cancelLabel}
                onPress={onCancel}
                variant="ghost"
                style={styles.button}
              />
              <NeonButton
                title={confirmLabel}
                onPress={onConfirm}
                variant={destructive ? 'secondary' : 'primary'}
                style={styles.button}
              />
            </View>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blur: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
  },
  modal: {
    backgroundColor: colors.card.elevated,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.accent,
    padding: spacing['3xl'],
    width: '100%',
    maxWidth: 400,
    gap: spacing.lg,
  },
  title: {
    ...textStyles.h3,
    color: colors.text.primary,
    textAlign: 'center',
  },
  message: {
    ...textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  button: {
    flex: 1,
  },
});
