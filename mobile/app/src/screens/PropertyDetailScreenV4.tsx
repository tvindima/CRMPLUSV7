/**
 * PropertyDetailScreenV4 - Fiel ao mockup
 * Header com título e localização, tabs, imagem, detalhes e descrição
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { apiService } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Tab = 'overview' | 'galeria' | 'docs' | 'historico';

interface AgentProfile {
  id: number;
  name: string;
  photo?: string;
}

interface Property {
  id: number;
  title: string;
  description?: string;
  location: string;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  type?: string;
  status?: string;
  parking_spaces?: number;
  images?: string[];
}

const TABS: { label: string; value: Tab }[] = [
  { label: 'Overview', value: 'overview' },
  { label: 'Galeria', value: 'galeria' },
  { label: 'Docs', value: 'docs' },
  { label: 'Histórico de Visitas', value: 'historico' },
];

export default function PropertyDetailScreenV4() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = (route.params as any) || {};

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [property, setProperty] = useState<Property | null>(null);
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load property
      const propertyResponse = await apiService.get<Property>(`/mobile/properties/${id}`);
      setProperty(propertyResponse);

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
    } catch (error) {
      console.error('Error loading property:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes do imóvel');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
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

  if (!property) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={24} color="#00d9ff" />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>{property.title}</Text>
              <Text style={styles.headerSubtitle}>{property.location}</Text>
            </View>
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

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.value}
              style={[styles.tab, activeTab === tab.value && styles.tabActive]}
              onPress={() => setActiveTab(tab.value)}
            >
              <Text style={[styles.tabText, activeTab === tab.value && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Main Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: property.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800' }}
            style={styles.mainImage}
          />
        </View>

        {/* Property Info */}
        <View style={styles.propertyInfo}>
          <View style={styles.propertyRow}>
            <Ionicons name="home-outline" size={18} color="#00d9ff" />
            <Text style={styles.propertyTitle}>{property.title}</Text>
            <Text style={styles.propertyArea}>{property.area || 220} m²</Text>
            <Text style={styles.propertyPrice}>{formatPrice(property.price)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButtonPrimary}>
            <Ionicons name="calendar-outline" size={18} color="#00d9ff" />
            <Text style={styles.actionButtonPrimaryText}>Agendar Visita</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButtonSecondary}>
            <Ionicons name="chatbubble-outline" size={18} color="#9ca3af" />
            <Text style={styles.actionButtonSecondaryText}>Conversar com Lead</Text>
          </TouchableOpacity>
        </View>

        {/* Details Section */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Detalhes</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailPlus}>+</Text>
            <Text style={styles.detailLabel}>Tipo</Text>
            <Text style={styles.detailValue}>{property.type || property.title}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailPlus}>+</Text>
            <Text style={styles.detailLabel}>Quartos</Text>
            <Text style={styles.detailValue}>{property.bedrooms || 3}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailPlus}>+</Text>
            <Text style={styles.detailLabel}>WC</Text>
            <Text style={styles.detailValue}>{property.bathrooms || 4}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailPlus}>+</Text>
            <Text style={styles.detailLabel}>Área</Text>
            <Text style={styles.detailValue}>{property.area || 220} m²</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailPlus}>+</Text>
            <Text style={styles.detailLabel}>Estacionamento</Text>
            <Text style={styles.detailValue}>{property.parking_spaces || 2} lugares</Text>
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Descrição</Text>
          <Text style={styles.descriptionText}>
            {property.description || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, neoscitgu nem ae tantus malesuads lagrisi'}
          </Text>
        </View>

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
  scrollView: {
    flex: 1,
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
    flex: 1,
  },
  backButton: {
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '300',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
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
  tabsContainer: {
    marginTop: 8,
  },
  tabsContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#333',
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: '#1a1f2e',
    borderColor: '#00d9ff40',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  imageContainer: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#00d9ff40',
  },
  mainImage: {
    width: '100%',
    height: 220,
  },
  propertyInfo: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  propertyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  propertyArea: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 8,
  },
  propertyPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00d9ff',
    marginLeft: 'auto',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  actionButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00d9ff',
    backgroundColor: '#00d9ff10',
  },
  actionButtonPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00d9ff',
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: 'transparent',
  },
  actionButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  detailsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailPlus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00d9ff',
    marginRight: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#9ca3af',
    width: 120,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  descriptionSection: {
    paddingHorizontal: 20,
  },
  descriptionText: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 22,
  },
});
