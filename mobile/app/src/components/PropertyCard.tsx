import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, textStyles } from '../theme';

export interface PropertyCardData {
  id: number;
  title: string;
  price: number;
  type: string;
  typology?: string;
  area?: number;
  location?: string;
  status: string;
  photos?: string[];
  reference: string;
}

interface PropertyCardProps {
  property: PropertyCardData;
  onPress?: () => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onPress }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ativo':
        return colors.success;
      case 'reservado':
        return colors.warning;
      case 'vendido':
        return colors.text.tertiary;
      default:
        return colors.text.secondary;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const imageUrl = property.photos && property.photos.length > 0 
    ? property.photos[0] 
    : null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <LinearGradient
            colors={[colors.brand.purple, colors.brand.cyan]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.placeholderGradient}
          >
            <Text style={styles.placeholderIcon}>🏠</Text>
          </LinearGradient>
        )}
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(property.status) + '20' },
          ]}
        >
          <Text
            style={[styles.statusText, { color: getStatusColor(property.status) }]}
          >
            {property.status}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {property.title}
        </Text>
        <Text style={styles.price}>{formatPrice(property.price)}</Text>

        <View style={styles.details}>
          {property.typology && (
            <View style={styles.detailChip}>
              <Text style={styles.detailIcon}>🛏️</Text>
              <Text style={styles.detailText}>{property.typology}</Text>
            </View>
          )}
          {property.area && (
            <View style={styles.detailChip}>
              <Text style={styles.detailIcon}>📐</Text>
              <Text style={styles.detailText}>{property.area}m²</Text>
            </View>
          )}
          {property.location && (
            <View style={styles.detailChip}>
              <Text style={styles.detailIcon}>📍</Text>
              <Text style={styles.detailText} numberOfLines={1}>
                {property.location}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.reference}>Ref: {property.reference}</Text>
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
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 64,
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backdropFilter: 'blur(10px)',
  },
  statusText: {
    ...textStyles.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    ...textStyles.h4,
    color: colors.text.primary,
  },
  price: {
    ...textStyles.h3,
    color: colors.brand.cyan,
    fontWeight: '700',
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.card.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  detailIcon: {
    fontSize: 12,
  },
  detailText: {
    ...textStyles.caption,
    color: colors.text.secondary,
  },
  reference: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
});
