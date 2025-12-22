/**
 * PropertyDetailScreen - Com tabs: Overview, Galeria, Documentos
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
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { apiService } from '../services/api';

type Tab = 'overview' | 'gallery' | 'docs';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  image_url?: string;
  images?: string[];
}

export default function PropertyDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = (route.params as any) || {};
  
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadPropertyDetail();
    }
  }, [id]);

  const loadPropertyDetail = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<Property>(`/mobile/properties/${id}`);
      setProperty(response);
    } catch (error) {
      console.error('Error loading property:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes do imóvel');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    Alert.alert('Partilhar', 'Funcionalidade em desenvolvimento');
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#00d9ff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color="#00d9ff" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'gallery' && styles.tabActive]}
          onPress={() => setActiveTab('gallery')}
        >
          <Text style={[styles.tabText, activeTab === 'gallery' && styles.tabTextActive]}>
            Galeria
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'docs' && styles.tabActive]}
          onPress={() => setActiveTab('docs')}
        >
          <Text style={[styles.tabText, activeTab === 'docs' && styles.tabTextActive]}>
            Documentos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && (
          <View>
            {/* Main Image */}
            <Image
              source={{
                uri: property.image_url || 'https://via.placeholder.com/400x300/1a1f2e/00d9ff?text=Imóvel',
              }}
              style={styles.mainImage}
            />

            {/* Property Info */}
            <View style={styles.infoSection}>
              <Text style={styles.propertyTitle}>{property.title}</Text>
              
              <View style={styles.locationRow}>
                <Ionicons name="location" size={20} color="#00d9ff" />
                <Text style={styles.locationText}>{property.location}</Text>
              </View>

              <Text style={styles.price}>
                {property.price?.toLocaleString('pt-PT', {
                  style: 'currency',
                  currency: 'EUR',
                  maximumFractionDigits: 0,
                })}
              </Text>

              {/* Features */}
              <View style={styles.featuresGrid}>
                {property.bedrooms && (
                  <View style={styles.featureCard}>
                    <Ionicons name="bed" size={28} color="#00d9ff" />
                    <Text style={styles.featureValue}>{property.bedrooms}</Text>
                    <Text style={styles.featureLabel}>Quartos</Text>
                  </View>
                )}
                {property.bathrooms && (
                  <View style={styles.featureCard}>
                    <Ionicons name="water" size={28} color="#00d9ff" />
                    <Text style={styles.featureValue}>{property.bathrooms}</Text>
                    <Text style={styles.featureLabel}>Casas de Banho</Text>
                  </View>
                )}
                {property.area && (
                  <View style={styles.featureCard}>
                    <Ionicons name="expand" size={28} color="#00d9ff" />
                    <Text style={styles.featureValue}>{property.area}m²</Text>
                    <Text style={styles.featureLabel}>Área</Text>
                  </View>
                )}
              </View>

              {/* Description */}
              {property.description && (
                <View style={styles.descriptionSection}>
                  <Text style={styles.sectionTitle}>Descrição</Text>
                  <Text style={styles.descriptionText}>{property.description}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {activeTab === 'gallery' && (
          <View style={styles.galleryContainer}>
            {property.images && property.images.length > 0 ? (
              property.images.map((imageUrl, index) => (
                <Image
                  key={index}
                  source={{ uri: imageUrl }}
                  style={styles.galleryImage}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="images-outline" size={64} color="#6b7280" />
                <Text style={styles.emptyStateText}>Sem fotos disponíveis</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'docs' && (
          <View style={styles.docsContainer}>
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={64} color="#6b7280" />
              <Text style={styles.emptyStateText}>Sem documentos disponíveis</Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    zIndex: 10,
    backgroundColor: 'rgba(10, 14, 26, 0.8)',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 217, 255, 0.2)',
    borderRadius: 20,
  },
  shareButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 217, 255, 0.2)',
    borderRadius: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 120,
    paddingBottom: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1a1f2e',
    borderWidth: 1,
    borderColor: '#374151',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#00d9ff20',
    borderColor: '#00d9ff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  tabTextActive: {
    color: '#00d9ff',
  },
  content: {
    flex: 1,
  },
  mainImage: {
    width: SCREEN_WIDTH,
    height: 300,
    backgroundColor: '#374151',
  },
  infoSection: {
    padding: 20,
  },
  propertyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '500',
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: '#00d9ff',
    marginBottom: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  featureCard: {
    flex: 1,
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00d9ff40',
  },
  featureValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 8,
    marginBottom: 4,
  },
  featureLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
  },
  descriptionSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    color: '#9ca3af',
    lineHeight: 24,
  },
  galleryContainer: {
    padding: 20,
    gap: 16,
  },
  galleryImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    backgroundColor: '#374151',
  },
  docsContainer: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 16,
  },
});
