import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius, textStyles } from '../theme';

export interface VisitCardData {
  id: number;
  property_title: string;
  scheduled_at: string;
  lead_name?: string;
  reference: string;
  status: string;
}

interface VisitCardProps {
  visit: VisitCardData;
  onPress?: () => void;
}

export const VisitCard: React.FC<VisitCardProps> = ({ visit, onPress }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'agendada':
        return colors.info;
      case 'confirmada':
        return colors.success;
      case 'realizada':
        return colors.text.tertiary;
      case 'cancelada':
        return colors.error;
      default:
        return colors.text.secondary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const time = date.toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (isToday) return `Hoje às ${time}`;
    if (isTomorrow) return `Amanhã às ${time}`;

    return date.toLocaleDateString('pt-PT', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.icon}>🏠</Text>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={1}>
              {visit.property_title}
            </Text>
            <Text style={styles.reference}>Ref: {visit.reference}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(visit.status) + '20' },
            ]}
          >
            <Text
              style={[styles.statusText, { color: getStatusColor(visit.status) }]}
            >
              {visit.status}
            </Text>
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📅</Text>
            <Text style={styles.detailText}>{formatDate(visit.scheduled_at)}</Text>
          </View>
          {visit.lead_name && (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>👤</Text>
              <Text style={styles.detailText}>{visit.lead_name}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card.primary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  icon: {
    fontSize: 32,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...textStyles.h4,
    color: colors.text.primary,
  },
  reference: {
    ...textStyles.caption,
    color: colors.text.tertiary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  statusText: {
    ...textStyles.caption,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  details: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailIcon: {
    fontSize: 14,
  },
  detailText: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
  },
});
