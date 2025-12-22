/**
 * LeadDetailScreen - Redesigned to match mockup
 * 4 action buttons: Agendar Visita, Converter Cliente, Mensagem, Ligação
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { apiService } from '../services/api';

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  budget?: number;
  origin?: string;
  notes?: string;
  created_at: string;
}

export default function LeadDetailScreenV3() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = (route.params as any) || {};
  
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadLeadDetail();
    }
  }, [id]);

  const loadLeadDetail = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<Lead>(`/mobile/leads/${id}`);
      setLead(response);
    } catch (error) {
      console.error('Error loading lead:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes do lead');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleVisit = () => {
    Alert.alert('Agendar Visita', 'Funcionalidade em desenvolvimento');
    // TODO: Navigate to schedule visit screen
  };

  const handleConvertClient = async () => {
    Alert.alert(
      'Converter em Cliente',
      'Deseja converter este lead em cliente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await apiService.put(`/mobile/leads/${id}`, {
                status: 'converted',
              });
              Alert.alert('Sucesso', 'Lead convertido em cliente!');
              loadLeadDetail();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível converter o lead');
            }
          },
        },
      ]
    );
  };

  const handleSendMessage = () => {
    if (lead?.phone) {
      Linking.openURL(`sms:${lead.phone}`);
    } else {
      Alert.alert('Erro', 'Número de telefone não disponível');
    }
  };

  const handleCall = () => {
    if (lead?.phone) {
      Linking.openURL(`tel:${lead.phone}`);
    } else {
      Alert.alert('Erro', 'Número de telefone não disponível');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00d9ff" />
      </View>
    );
  }

  if (!lead) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return '#00d9ff';
      case 'contacted':
        return '#8b5cf6';
      case 'scheduled':
        return '#d946ef';
      case 'converted':
        return '#10b981';
      default:
        return '#9ca3af';
    }
  };

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
        <Text style={styles.headerTitle}>Detalhes do Lead</Text>
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="create-outline" size={24} color="#00d9ff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Lead Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#00d9ff', '#8b5cf6']}
              style={styles.avatar}
            >
              <Ionicons name="person" size={48} color="#ffffff" />
            </LinearGradient>
          </View>

          <Text style={styles.leadName}>{lead.name}</Text>
          
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(lead.status)}20` },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(lead.status) },
              ]}
            >
              {lead.status}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleScheduleVisit}
          >
            <LinearGradient
              colors={['#00d9ff20', '#00d9ff10']}
              style={styles.actionGradient}
            >
              <Ionicons name="calendar-outline" size={28} color="#00d9ff" />
              <Text style={styles.actionText}>Agendar{'\n'}Visita</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleConvertClient}
          >
            <LinearGradient
              colors={['#8b5cf620', '#8b5cf610']}
              style={styles.actionGradient}
            >
              <Ionicons name="checkmark-circle-outline" size={28} color="#8b5cf6" />
              <Text style={styles.actionText}>Converter{'\n'}Cliente</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSendMessage}
          >
            <LinearGradient
              colors={['#d946ef20', '#d946ef10']}
              style={styles.actionGradient}
            >
              <Ionicons name="chatbubble-outline" size={28} color="#d946ef" />
              <Text style={styles.actionText}>Mensagem</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCall}
          >
            <LinearGradient
              colors={['#10b98120', '#10b98110']}
              style={styles.actionGradient}
            >
              <Ionicons name="call-outline" size={28} color="#10b981" />
              <Text style={styles.actionText}>Ligação</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Contact Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contactos</Text>
          
          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={20} color="#00d9ff" />
            <Text style={styles.detailText}>{lead.email || 'Não informado'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={20} color="#00d9ff" />
            <Text style={styles.detailText}>{lead.phone}</Text>
          </View>

          {lead.origin && (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={20} color="#00d9ff" />
              <Text style={styles.detailText}>{lead.origin}</Text>
            </View>
          )}

          {lead.budget && (
            <View style={styles.detailRow}>
              <Ionicons name="cash-outline" size={20} color="#00d9ff" />
              <Text style={styles.detailText}>
                {lead.budget.toLocaleString('pt-PT', {
                  style: 'currency',
                  currency: 'EUR',
                })}
              </Text>
            </View>
          )}
        </View>

        {/* Notes */}
        {lead.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notas</Text>
            <Text style={styles.notesText}>{lead.notes}</Text>
          </View>
        )}

        {/* Timeline / History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Histórico</Text>
          <View style={styles.timelineItem}>
            <Ionicons name="time-outline" size={16} color="#9ca3af" />
            <Text style={styles.timelineText}>
              Criado em {new Date(lead.created_at).toLocaleDateString('pt-PT')}
            </Text>
          </View>
        </View>

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  editButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  infoCard: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#00d9ff40',
  },
  leadName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  actionButton: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#00d9ff40',
  },
  actionGradient: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 8,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1f2e',
  },
  detailText: {
    fontSize: 15,
    color: '#e5e7eb',
    fontWeight: '500',
  },
  notesText: {
    fontSize: 15,
    color: '#9ca3af',
    lineHeight: 22,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timelineText: {
    fontSize: 14,
    color: '#9ca3af',
  },
});
