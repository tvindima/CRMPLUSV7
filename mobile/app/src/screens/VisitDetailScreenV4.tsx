/**
 * VisitDetailScreenV4 - Fiel ao mockup
 * Detalhe de visita agendada com imagem, ações e detalhes
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
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { apiService } from '../services/api';

interface AgentProfile {
  id: number;
  name: string;
  photo?: string;
}

interface VisitDetail {
  id: number;
  scheduled_at: string;
  lead_name: string;
  lead_phone?: string;
  lead_email?: string;
  lead_photo?: string;
  property_title: string;
  property_location: string;
  property_image?: string;
  notes?: string;
  status: string;
}

export default function VisitDetailScreenV4() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = (route.params as any) || {};

  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
  const [visit, setVisit] = useState<VisitDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

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

      // Mock visit data for demo
      setVisit({
        id: id || 1,
        scheduled_at: '2024-04-24T13:30:00',
        lead_name: 'João Menezes',
        lead_phone: '000 000 000',
        lead_email: 'exemplo@email.com',
        lead_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
        property_title: 'Moradia Moderna',
        property_location: 'Odivelas',
        property_image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
        notes: 'Curtiu a arquitetura da casa, quer conhecer as opções de financiamento.',
        status: 'confirmed',
      });
    } catch (error) {
      console.error('Error loading visit:', error);
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const time = date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    const day = date.getDate();
    const month = date.toLocaleDateString('pt-PT', { month: 'long' });
    return `${time}, ${day} ${month.charAt(0).toUpperCase() + month.slice(1)}`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  };

  const handleCheckIn = () => {
    Alert.alert('Check-In', 'Check-in confirmado com sucesso!');
  };

  const handleReschedule = () => {
    Alert.alert('Reagendar', 'Funcionalidade em desenvolvimento');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00d9ff" />
      </View>
    );
  }

  if (!visit) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color="#00d9ff" />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>Visita Agendada</Text>
              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={16} color="#00d9ff" />
                <Text style={styles.dateText}>{formatDateTime(visit.scheduled_at)}</Text>
              </View>
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

        {/* Lead Info */}
        <View style={styles.leadSection}>
          <View style={styles.leadRow}>
            {visit.lead_photo ? (
              <Image source={{ uri: visit.lead_photo }} style={styles.leadAvatar} />
            ) : (
              <View style={styles.leadAvatarPlaceholder}>
                <Ionicons name="person" size={24} color="#6b7280" />
              </View>
            )}
            <View style={styles.leadInfo}>
              <Text style={styles.leadName}>{visit.lead_name}</Text>
              <Text style={styles.leadProperty}>{visit.property_title}</Text>
              <Text style={styles.leadLocation}>{visit.property_location}</Text>
            </View>
          </View>
        </View>

        {/* Property Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: visit.property_image }}
            style={styles.propertyImage}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButtonPrimary} onPress={handleCheckIn}>
            <Ionicons name="calendar-outline" size={18} color="#00d9ff" />
            <Text style={styles.actionButtonPrimaryText}>Confirmar Check-In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButtonSecondary} onPress={handleReschedule}>
            <Ionicons name="chatbubble-outline" size={18} color="#9ca3af" />
            <Text style={styles.actionButtonSecondaryText}>Reagendar</Text>
          </TouchableOpacity>
        </View>

        {/* Details Section */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Detalhes</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Ionicons name="time-outline" size={18} color="#00d9ff" />
              <Text style={styles.detailLabel}>Hora</Text>
            </View>
            <Text style={styles.detailValue}>{formatTime(visit.scheduled_at)}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Ionicons name="home-outline" size={18} color="#00d9ff" />
              <Text style={styles.detailLabel}>Imóvel</Text>
            </View>
            <View style={styles.detailRight}>
              <Text style={styles.detailValue}>{visit.property_title}</Text>
              <Text style={styles.detailSubvalue}>{visit.property_location}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Ionicons name="call-outline" size={18} color="#00d9ff" />
              <Text style={styles.detailLabel}>Telefone</Text>
            </View>
            <Text style={styles.detailValue}>{visit.lead_phone}</Text>
          </View>

          <TouchableOpacity style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Ionicons name="mail-outline" size={18} color="#00d9ff" />
              <Text style={styles.detailLabel}>E-mail</Text>
            </View>
            <View style={styles.detailRight}>
              <Text style={styles.detailValue}>{visit.lead_email}</Text>
              <Ionicons name="chevron-forward" size={16} color="#6b7280" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Notes Section */}
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Notas / Eventos Futuro</Text>
          <Text style={styles.notesText}>{visit.notes}</Text>
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
    alignItems: 'flex-start',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  headerInfo: {
    marginLeft: 8,
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '300',
    color: '#ffffff',
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    color: '#9ca3af',
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
  leadSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  leadRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leadAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  leadAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1a1f2e',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00d9ff',
    marginBottom: 2,
  },
  leadProperty: {
    fontSize: 14,
    color: '#ffffff',
  },
  leadLocation: {
    fontSize: 13,
    color: '#9ca3af',
  },
  imageContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  propertyImage: {
    width: '100%',
    height: 200,
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
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1f2e',
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailLabel: {
    fontSize: 15,
    color: '#ffffff',
  },
  detailRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailValue: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'right',
  },
  detailSubvalue: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'right',
  },
  notesSection: {
    paddingHorizontal: 20,
  },
  notesText: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 22,
  },
});
