/**
 * PropertiesScreenV4 - Fiel ao mockup
 * Lista de imóveis com filtros completos como no site montra
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
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { apiService } from '../services/api';

type RootStackParamList = {
  PropertyDetail: { id: number };
  [key: string]: any;
};

interface AgentProfile {
  id: number;
  name: string;
  photo?: string;
}

interface Property {
  id: number;
  title: string;
  location: string;
  municipality?: string;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  usable_area?: number;
  images?: string[];
  status: string;
  property_type?: string;
  business_type?: string;
  typology?: string;
  featured?: boolean;
  lead_name?: string;
  visit_tomorrow?: boolean;
}

interface Filters {
  myProperties: boolean;
  businessType: string;
  propertyType: string;
  typology: string;
  municipality: string;
  priceMin: string;
  priceMax: string;
  areaMin: string;
  areaMax: string;
}

const BUSINESS_TYPES = ['Todos', 'Venda', 'Arrendamento'];
const PROPERTY_TYPES = ['Todos', 'Apartamento', 'Moradia', 'Terreno Urbano', 'Terreno Rústico', 'Armazém', 'Casa Antiga'];
const TYPOLOGIES = ['Todos', 'T1', 'T2', 'T3', 'T3+1', 'T4', 'T4+1', 'T5', 'T6+'];
const MUNICIPALITIES = ['Todos', 'Lisboa', 'Cascais', 'Leiria', 'Coimbra', 'Alcobaça', 'Batalha', 'Nazaré', 'Ourém', 'Marinha Grande', 'Lousã'];

export default function PropertiesScreenV4() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    myProperties: true,
    businessType: 'Todos',
    propertyType: 'Todos',
    typology: 'Todos',
    municipality: 'Todos',
    priceMin: '',
    priceMax: '',
    areaMin: '',
    areaMax: '',
  });
  const [tempFilters, setTempFilters] = useState<Filters>(filters);

  useEffect(() => {
    loadData();
  }, [filters.myProperties]);

  useEffect(() => {
    applyFilters();
  }, [properties, filters]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load agent profile
      const statsResponse = await apiService.get<any>('/mobile/dashboard/stats');
      if (statsResponse.agent_id) {
        const agentResponse = await apiService.get<any>(`/agents/${statsResponse.agent_id}`);
        setAgentProfile({
          id: agentResponse.id,
          name: agentResponse.name,
          photo: agentResponse.photo,
        });
      }

      // Load properties based on myProperties filter
      const endpoint = filters.myProperties 
        ? '/mobile/properties?my_properties=true'
        : '/mobile/properties';
      const response = await apiService.get<any>(endpoint);
      const props = response.items || response || [];
      
      setProperties(props);
    } catch (error) {
      console.error('Error loading properties:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...properties];

    // Filter by business type
    if (filters.businessType !== 'Todos') {
      result = result.filter(p => p.business_type === filters.businessType);
    }

    // Filter by property type
    if (filters.propertyType !== 'Todos') {
      result = result.filter(p => p.property_type === filters.propertyType);
    }

    // Filter by typology
    if (filters.typology !== 'Todos') {
      result = result.filter(p => p.typology === filters.typology);
    }

    // Filter by municipality
    if (filters.municipality !== 'Todos') {
      result = result.filter(p => p.municipality === filters.municipality);
    }

    // Filter by price range
    if (filters.priceMin) {
      const min = parseInt(filters.priceMin);
      result = result.filter(p => p.price >= min);
    }
    if (filters.priceMax) {
      const max = parseInt(filters.priceMax);
      result = result.filter(p => p.price <= max);
    }

    // Filter by area range
    if (filters.areaMin) {
      const min = parseInt(filters.areaMin);
      result = result.filter(p => (p.usable_area || p.area || 0) >= min);
    }
    if (filters.areaMax) {
      const max = parseInt(filters.areaMax);
      result = result.filter(p => (p.usable_area || p.area || 0) <= max);
    }

    setFilteredProperties(result);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (!filters.myProperties) count++;
    if (filters.businessType !== 'Todos') count++;
    if (filters.propertyType !== 'Todos') count++;
    if (filters.typology !== 'Todos') count++;
    if (filters.municipality !== 'Todos') count++;
    if (filters.priceMin) count++;
    if (filters.priceMax) count++;
    if (filters.areaMin) count++;
    if (filters.areaMax) count++;
    return count;
  };

  const clearFilters = () => {
    const defaultFilters: Filters = {
      myProperties: true,
      businessType: 'Todos',
      propertyType: 'Todos',
      typology: 'Todos',
      municipality: 'Todos',
      priceMin: '',
      priceMax: '',
      areaMin: '',
      areaMax: '',
    };
    setTempFilters(defaultFilters);
  };

  const applyTempFilters = () => {
    setFilters(tempFilters);
    setShowFilterModal(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getAvatarUrl = () => {
    if (agentProfile?.photo) {
      if (agentProfile.photo.startsWith('http')) {
        return agentProfile.photo;
      }
      return `https://crmplusv7-production.up.railway.app${agentProfile.photo}`;
    }
    return null;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00d9ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#00d9ff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Imóveis</Text>
        </View>
        <TouchableOpacity style={styles.avatarContainer}>
          {getAvatarUrl() ? (
            <Image source={{ uri: getAvatarUrl()! }} style={styles.avatar} />
          ) : (
            <LinearGradient
              colors={['#ff00ff', '#00d9ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGradient}
            >
              <Ionicons name="person" size={24} color="#fff" />
            </LinearGradient>
          )}
        </TouchableOpacity>
      </View>

      {/* Filter Button */}
      <TouchableOpacity 
        style={styles.filterButton}
        onPress={() => {
          setTempFilters(filters);
          setShowFilterModal(true);
        }}
      >
        <LinearGradient
          colors={['#00d9ff20', '#00d9ff10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.filterGradient}
        >
          <Ionicons name="filter" size={18} color="#00d9ff" />
          <Text style={styles.filterText}>Filtrar</Text>
          {getActiveFiltersCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Properties Count */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {filteredProperties.length} {filteredProperties.length === 1 ? 'imóvel' : 'imóveis'}
          {filters.myProperties ? ' (meus)' : ' (agência)'}
        </Text>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* My Properties Toggle */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Proprietário</Text>
                <View style={styles.filterChips}>
                  <TouchableOpacity
                    style={[styles.filterChip, tempFilters.myProperties && styles.filterChipActive]}
                    onPress={() => setTempFilters({ ...tempFilters, myProperties: true })}
                  >
                    <Text style={[styles.filterChipText, tempFilters.myProperties && styles.filterChipTextActive]}>
                      Meus Imóveis
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterChip, !tempFilters.myProperties && styles.filterChipActive]}
                    onPress={() => setTempFilters({ ...tempFilters, myProperties: false })}
                  >
                    <Text style={[styles.filterChipText, !tempFilters.myProperties && styles.filterChipTextActive]}>
                      Todos da Agência
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Business Type */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Tipo de Negócio</Text>
                <View style={styles.filterChips}>
                  {BUSINESS_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.filterChip, tempFilters.businessType === type && styles.filterChipActive]}
                      onPress={() => setTempFilters({ ...tempFilters, businessType: type })}
                    >
                      <Text style={[styles.filterChipText, tempFilters.businessType === type && styles.filterChipTextActive]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Property Type */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Tipo de Imóvel</Text>
                <View style={styles.filterChips}>
                  {PROPERTY_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.filterChip, tempFilters.propertyType === type && styles.filterChipActive]}
                      onPress={() => setTempFilters({ ...tempFilters, propertyType: type })}
                    >
                      <Text style={[styles.filterChipText, tempFilters.propertyType === type && styles.filterChipTextActive]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Typology */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Tipologia</Text>
                <View style={styles.filterChips}>
                  {TYPOLOGIES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.filterChip, tempFilters.typology === type && styles.filterChipActive]}
                      onPress={() => setTempFilters({ ...tempFilters, typology: type })}
                    >
                      <Text style={[styles.filterChipText, tempFilters.typology === type && styles.filterChipTextActive]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Municipality */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Concelho</Text>
                <View style={styles.filterChips}>
                  {MUNICIPALITIES.map((mun) => (
                    <TouchableOpacity
                      key={mun}
                      style={[styles.filterChip, tempFilters.municipality === mun && styles.filterChipActive]}
                      onPress={() => setTempFilters({ ...tempFilters, municipality: mun })}
                    >
                      <Text style={[styles.filterChipText, tempFilters.municipality === mun && styles.filterChipTextActive]}>
                        {mun}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Price Range */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Preço (€)</Text>
                <View style={styles.rangeInputs}>
                  <TextInput
                    style={styles.rangeInput}
                    placeholder="Mínimo"
                    placeholderTextColor="#6b7280"
                    keyboardType="numeric"
                    value={tempFilters.priceMin}
                    onChangeText={(text) => setTempFilters({ ...tempFilters, priceMin: text.replace(/[^0-9]/g, '') })}
                  />
                  <Text style={styles.rangeSeparator}>-</Text>
                  <TextInput
                    style={styles.rangeInput}
                    placeholder="Máximo"
                    placeholderTextColor="#6b7280"
                    keyboardType="numeric"
                    value={tempFilters.priceMax}
                    onChangeText={(text) => setTempFilters({ ...tempFilters, priceMax: text.replace(/[^0-9]/g, '') })}
                  />
                </View>
              </View>

              {/* Area Range */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Área (m²)</Text>
                <View style={styles.rangeInputs}>
                  <TextInput
                    style={styles.rangeInput}
                    placeholder="Mínimo"
                    placeholderTextColor="#6b7280"
                    keyboardType="numeric"
                    value={tempFilters.areaMin}
                    onChangeText={(text) => setTempFilters({ ...tempFilters, areaMin: text.replace(/[^0-9]/g, '') })}
                  />
                  <Text style={styles.rangeSeparator}>-</Text>
                  <TextInput
                    style={styles.rangeInput}
                    placeholder="Máximo"
                    placeholderTextColor="#6b7280"
                    keyboardType="numeric"
                    value={tempFilters.areaMax}
                    onChangeText={(text) => setTempFilters({ ...tempFilters, areaMax: text.replace(/[^0-9]/g, '') })}
                  />
                </View>
              </View>

              <View style={{ height: 100 }} />
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearButtonText}>Limpar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={applyTempFilters}>
                <LinearGradient
                  colors={['#00d9ff', '#0099cc']}
                  style={styles.applyButtonGradient}
                >
                  <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Properties List */}
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00d9ff"
          />
        }
      >
        {filteredProperties.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="home-outline" size={64} color="#6b7280" />
            <Text style={styles.emptyStateText}>Nenhum imóvel encontrado</Text>
            <Text style={styles.emptyStateSubtext}>Tente ajustar os filtros</Text>
          </View>
        ) : (
          filteredProperties.map((property, index) => (
            <TouchableOpacity
              key={property.id}
              style={[
                styles.propertyCard,
                property.featured && styles.propertyCardFeatured,
              ]}
              onPress={() => navigation.navigate('PropertyDetail', { id: property.id })}
            >
              {/* Property Image */}
              <Image
                source={{ uri: property.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200' }}
                style={styles.propertyImage}
              />

              {/* Property Info */}
              <View style={styles.propertyInfo}>
                {/* Type Badge */}
                {property.business_type && (
                  <View style={[styles.typeBadge, property.business_type === 'Arrendamento' && styles.typeBadgeRent]}>
                    <Text style={styles.typeBadgeText}>{property.business_type}</Text>
                  </View>
                )}

                {/* Title */}
                <Text style={styles.propertyTitle} numberOfLines={1}>
                  {property.title || `${property.property_type} ${property.typology || ''}`}
                </Text>

                {/* Location */}
                <Text style={styles.propertyLocation} numberOfLines={1}>
                  {property.municipality || property.location}
                </Text>

                {/* Price */}
                <Text style={styles.propertyPrice}>
                  {formatPrice(property.price)}
                  {property.business_type === 'Arrendamento' && '/mês'}
                </Text>
              </View>

              {/* Chat Icon */}
              <TouchableOpacity style={styles.chatButton}>
                <Ionicons name="chatbubble-ellipses" size={20} color="#00d9ff" />
              </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0e1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a1f2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '300',
    color: '#ffffff',
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ff00ff80',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButton: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  filterGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00d9ff40',
  },
  filterText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#00d9ff',
    flex: 1,
  },
  filterMenu: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00d9ff40',
    overflow: 'hidden',
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff10',
  },
  filterOptionActive: {
    backgroundColor: '#00d9ff15',
  },
  filterOptionText: {
    flex: 1,
    fontSize: 14,
    color: '#9ca3af',
  },
  filterOptionTextActive: {
    color: '#00d9ff',
    fontWeight: '600',
  },
  countContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  countText: {
    fontSize: 13,
    color: '#6b7280',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0a0e1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#00d9ff40',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff10',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalScroll: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00d9ff',
    marginBottom: 12,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1f2e',
    borderWidth: 1,
    borderColor: '#333',
  },
  filterChipActive: {
    backgroundColor: '#00d9ff20',
    borderColor: '#00d9ff',
  },
  filterChipText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  filterChipTextActive: {
    color: '#00d9ff',
    fontWeight: '600',
  },
  rangeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rangeInput: {
    flex: 1,
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#333',
    color: '#ffffff',
    fontSize: 14,
  },
  rangeSeparator: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#ffffff10',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff6b6b',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff6b6b',
  },
  applyButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  applyButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  filterBadge: {
    backgroundColor: '#00d9ff',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0a0e1a',
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
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  typeBadge: {
    backgroundColor: '#00d9ff20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  typeBadgeRent: {
    backgroundColor: '#ff6b6b20',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#00d9ff',
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  propertyCard: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#1a1f2e',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffffff10',
    alignItems: 'center',
  },
  propertyCardHighlight: {
    borderColor: '#00d9ff60',
    shadowColor: '#00d9ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  propertyCardFeatured: {
    borderColor: '#00ff8860',
  },
  propertyImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },
  propertyInfo: {
    flex: 1,
    marginLeft: 12,
  },
  leadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  leadName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  visitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#00d9ff20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  visitBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#00d9ff',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  propertyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  featuredBadge: {
    backgroundColor: '#00ff8830',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  featuredBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#00ff88',
  },
  propertyLocation: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 4,
  },
  propertyPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#00d9ff',
  },
  chatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00d9ff15',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
