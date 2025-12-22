/**
 * PropertiesScreen - Redesigned to match mockup
 * Lista com filtros: Todos, Ativos, Vendidos, Arrendados
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { apiService } from '../services/api';

type RootStackParamList = {
  PropertyDetail: { id: number };
  [key: string]: any;
};

type PropertyStatus = 'all' | 'active' | 'sold' | 'rented';

interface Property {
  id: number;
  title: string;
  location: string;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  image_url?: string;
  images?: string[];
  status: string;
}

const FILTERS: { label: string; value: PropertyStatus }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Ativos', value: 'active' },
  { label: 'Vendidos', value: 'sold' },
  { label: 'Arrendados', value: 'rented' },
];

export default function PropertiesScreenV3() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [activeFilter, setActiveFilter] = useState<PropertyStatus>('all');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProperties();
  }, [activeFilter]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const status = activeFilter === 'all' ? undefined : activeFilter;
      // my_properties=true filtra apenas imóveis do agente logado
      const params = new URLSearchParams();
      params.append('my_properties', 'true');
      if (status) params.append('status', status);
      
      const response = await apiService.get<any>(
        `/mobile/properties?${params.toString()}`
      );
      setProperties(response.items || response || []);
    } catch (error) {
      console.error('Error loading properties:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProperties();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Imóveis</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={24} color="#00d9ff" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterButton,
              activeFilter === filter.value && styles.filterButtonActive,
            ]}
            onPress={() => setActiveFilter(filter.value)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === filter.value && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Properties List */}
      <ScrollView
        style={styles.propertiesList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00d9ff"
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00d9ff" />
          </View>
        ) : properties.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={64} color="#6b7280" />
            <Text style={styles.emptyStateText}>Sem imóveis nesta categoria</Text>
          </View>
        ) : (
          properties.map((property) => (
            <TouchableOpacity
              key={property.id}
              style={styles.propertyCard}
              onPress={() => navigation.navigate('PropertyDetail', { id: property.id })}
            >
              <Image
                source={{
                  uri:
                    property.image_url ||
                    (property.images && property.images[0]) ||
                    'https://placehold.co/400x250/1a1f2e/00d9ff?text=Imóvel',
                }}
                style={styles.propertyImage}
              />
              
              <View style={styles.propertyInfo}>
                <Text style={styles.propertyTitle} numberOfLines={2}>
                  {property.title}
                </Text>
                
                <View style={styles.propertyLocation}>
                  <Ionicons name="location-outline" size={16} color="#9ca3af" />
                  <Text style={styles.propertyLocationText}>{property.location}</Text>
                </View>

                <View style={styles.propertyFeatures}>
                  {property.bedrooms && (
                    <View style={styles.feature}>
                      <Ionicons name="bed-outline" size={16} color="#00d9ff" />
                      <Text style={styles.featureText}>{property.bedrooms}</Text>
                    </View>
                  )}
                  {property.bathrooms && (
                    <View style={styles.feature}>
                      <Ionicons name="water-outline" size={16} color="#00d9ff" />
                      <Text style={styles.featureText}>{property.bathrooms}</Text>
                    </View>
                  )}
                  {property.area && (
                    <View style={styles.feature}>
                      <Ionicons name="expand-outline" size={16} color="#00d9ff" />
                      <Text style={styles.featureText}>{property.area}m²</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.propertyPrice}>
                  {property.price?.toLocaleString('pt-PT', {
                    style: 'currency',
                    currency: 'EUR',
                    maximumFractionDigits: 0,
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
  },
  searchButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersContainer: {
    maxHeight: 60,
    marginBottom: 16,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1a1f2e',
    borderWidth: 1,
    borderColor: '#374151',
  },
  filterButtonActive: {
    backgroundColor: '#00d9ff20',
    borderColor: '#00d9ff',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  filterTextActive: {
    color: '#00d9ff',
  },
  propertiesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 16,
  },
  propertyCard: {
    backgroundColor: '#1a1f2e',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#00d9ff40',
  },
  propertyImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#374151',
  },
  propertyInfo: {
    padding: 16,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  propertyLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  propertyLocationText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  propertyFeatures: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 13,
    color: '#e5e7eb',
    fontWeight: '600',
  },
  propertyPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: '#00d9ff',
  },
});
