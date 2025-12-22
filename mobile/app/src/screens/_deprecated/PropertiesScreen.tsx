/**
 * Tela de Angariações do Agente
 * App B2E - Uso exclusivo de agentes imobiliários Imóveis Mais
 * Mostra apenas as propriedades angariadas pelo agente autenticado
 */

import React, { useState } from 'react';
import {
  View,
  FlatList,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';
import type { Property } from '../types';

export default function PropertiesScreen({ navigation }: any) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const statusFilters = [
    { label: 'Todas Minhas Angariações', value: null },
    { label: 'Disponível', value: 'available' },
    { label: 'Vendida', value: 'sold' },
    { label: 'Arrendada', value: 'rented' },
  ];

  const getStatusColor = (status: string | null) => {
    const colors: Record<string, string> = {
      available: Colors.light.success,
      sold: Colors.light.error,
      rented: Colors.light.warning,
      pending: Colors.light.info,
    };
    return colors[status || 'available'] || Colors.light.textSecondary;
  };

  const getStatusLabel = (status: string | null) => {
    const labels: Record<string, string> = {
      available: 'Disponível',
      sold: 'Vendida',
      rented: 'Arrendada',
      pending: 'Pendente',
    };
    return labels[status || 'available'] || '—';
  };

  const PropertyCard = ({ item }: { item: Property }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('PropertyDetails', { id: item.id })}
    >
      {item.photos && item.photos.length > 0 ? (
        <Image source={{ uri: item.photos[0] }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, styles.placeholderImage]}>
          <Text style={styles.placeholderText}>🏠</Text>
        </View>
      )}

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>

        <Text style={styles.cardLocation} numberOfLines={1}>
          📍 {item.location || 'Localização não definida'}
        </Text>

        <View style={styles.cardFooter}>
          <Text style={styles.cardPrice}>
            {item.price ? `€ ${item.price.toLocaleString('pt-PT')}` : 'Preço sob consulta'}
          </Text>
          <View style={styles.cardStats}>
            {item.area && (
              <Text style={styles.cardStat}>📐 {item.area}m²</Text>
            )}
            {item.bedrooms && (
              <Text style={styles.cardStat}>🛏️ {item.bedrooms}</Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar propriedades..."
          placeholderTextColor={Colors.light.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Status Filters */}
      <View style={styles.filtersContainer}>
        {statusFilters.map((filter) => (
          <TouchableOpacity
            key={filter.label}
            style={[
              styles.filterChip,
              statusFilter === filter.value && styles.filterChipActive,
            ]}
            onPress={() => setStatusFilter(filter.value)}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === filter.value && styles.filterChipTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Properties List */}
      <FlatList
        data={properties}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <PropertyCard item={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {}}
            colors={[Colors.light.primary]}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>🏠</Text>
              <Text style={styles.emptyTitle}>Nenhuma propriedade</Text>
              <Text style={styles.emptySubtitle}>
                As propriedades aparecerão aqui quando cadastradas
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  searchContainer: {
    padding: Spacing.lg,
    backgroundColor: Colors.light.surface,
    ...Shadows.sm,
  },
  searchInput: {
    backgroundColor: Colors.light.background,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.sizes.md,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filtersContainer: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Colors.light.surface,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
  },
  filterChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterChipText: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.text,
    fontWeight: Typography.weights.medium,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: Spacing.md,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.md,
  },
  cardImage: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.light.border,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
  },
  cardContent: {
    padding: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  cardTitle: {
    flex: 1,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.text,
    marginRight: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: Typography.sizes.xs,
    color: '#fff',
    fontWeight: Typography.weights.semibold,
  },
  cardLocation: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardPrice: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.light.primary,
  },
  cardStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cardStat: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyText: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});
