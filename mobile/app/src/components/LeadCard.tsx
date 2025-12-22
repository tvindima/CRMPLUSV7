import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius, textStyles } from '../theme';

export interface LeadCardData {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  status: string;
  source?: string;
  created_at: string;
}

interface LeadCardProps {
  lead: LeadCardData;
  onPress?: () => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead, onPress }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'novo':
        return colors.brand.cyan;
      case 'em_contacto':
        return colors.warning;
      case 'convertido':
        return colors.success;
      case 'perdido':
        return colors.error;
      default:
        return colors.text.tertiary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'novo':
        return 'Novo';
      case 'em_contacto':
        return 'Em contacto';
      case 'convertido':
        return 'Convertido';
      case 'perdido':
        return 'Perdido';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Há minutos';
    if (diffInHours < 24) return `Há ${diffInHours}h`;
    if (diffInHours < 48) return 'Ontem';

    return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{lead.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.name} numberOfLines={1}>
            {lead.name}
          </Text>
          <Text style={styles.time}>{formatDate(lead.created_at)}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(lead.status) + '20' },
          ]}
        >
          <Text style={[styles.statusText, { color: getStatusColor(lead.status) }]}>
            {getStatusLabel(lead.status)}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        {lead.phone && (
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📞</Text>
            <Text style={styles.detailText}>{lead.phone}</Text>
          </View>
        )}
        {lead.email && (
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>✉️</Text>
            <Text style={styles.detailText} numberOfLines={1}>
              {lead.email}
            </Text>
          </View>
        )}
        {lead.source && (
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📍</Text>
            <Text style={styles.detailText}>{lead.source}</Text>
          </View>
        )}
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
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.brand.purple + '30',
    borderWidth: 2,
    borderColor: colors.brand.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...textStyles.h4,
    color: colors.brand.purple,
    fontWeight: '700',
  },
  headerContent: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    ...textStyles.h4,
    color: colors.text.primary,
  },
  time: {
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
    flex: 1,
  },
});
