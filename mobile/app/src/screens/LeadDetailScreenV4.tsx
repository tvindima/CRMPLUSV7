/**
 * LeadDetailScreen V4 - Fiel ao mockup
 * Avatar grande, 4 action buttons, Notas & Histórico com timeline
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
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { apiService } from '../services/api';

interface Lead {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  budget?: number;
  origin?: string;
  notes?: string;
  created_at: string;
  avatar_url?: string;
  property_interest?: string;
}

interface HistoryItem {
  id: number;
  type: 'email' | 'call' | 'visit' | 'note';
  description: string;
  created_at: string;
  agent_name?: string;
  agent_avatar?: string;
}

export default function LeadDetailScreenV4() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = (route.params as any) || {};

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (id) {
      loadLeadDetail();
      loadHistory();
    }
  }, [id]);

  const loadLeadDetail = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<Lead>(`/mobile/leads/${id}`);
      setLead(response);
    } catch (error) {
      console.error('Error loading lead:', error);
      if (Platform.OS === 'web') {
        window.alert('Não foi possível carregar os detalhes do lead');
      } else {
        Alert.alert('Erro', 'Não foi possível carregar os detalhes do lead');
      }
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    // Mock history - em produção vem da API
    setHistory([
      {
        id: 1,
        type: 'email',
        description: 'Enviou email com detalhes sobre o apartamento T2. Interessado nas opções de financiamento.',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        agent_name: 'Mateus Costa',
      },
      {
        id: 2,
        type: 'call',
        description: 'Ligação de follow-up. Cliente confirmou interesse na visita.',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        agent_name: 'Mateus Costa',
      },
    ]);
  };

  const handleScheduleVisit = () => {
    if (Platform.OS === 'web') {
      window.alert('Agendar Visita - Funcionalidade em desenvolvimento');
    } else {
      Alert.alert('Agendar Visita', 'Funcionalidade em desenvolvimento');
    }
  };

  const handleSendMessage = () => {
    if (lead?.phone) {
      Linking.openURL(`sms:${lead.phone}`);
    } else if (Platform.OS === 'web') {
      window.alert('Número de telefone não disponível');
    } else {
      Alert.alert('Erro', 'Número de telefone não disponível');
    }
  };

  const handleAddProposal = () => {
    if (Platform.OS === 'web') {
      window.alert('Adicionar Proposta - Funcionalidade em desenvolvimento');
    } else {
      Alert.alert('Adicionar Proposta', 'Funcionalidade em desenvolvimento');
    }
  };

  const handleConvertClient = async () => {
    const doConvert = async () => {
      try {
        await apiService.put(`/mobile/leads/${id}`, { status: 'converted' });
        if (Platform.OS === 'web') {
          window.alert('Lead convertido em cliente!');
        } else {
          Alert.alert('Sucesso', 'Lead convertido em cliente!');
        }
        loadLeadDetail();
      } catch (error) {
        if (Platform.OS === 'web') {
          window.alert('Não foi possível converter o lead');
        } else {
          Alert.alert('Erro', 'Não foi possível converter o lead');
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Deseja converter este lead em cliente?')) {
        doConvert();
      }
    } else {
      Alert.alert('Converter em Cliente', 'Deseja converter este lead em cliente?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: doConvert },
      ]);
    }
  };

  const handleOpenMenu = () => {
    // Menu options
  };

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'new':
        return { label: 'Novo', color: '#00d9ff', bg: '#00d9ff20' };
      case 'contacted':
        return { label: 'Em Contacto', color: '#8b5cf6', bg: '#8b5cf620' };
      case 'qualified':
        return { label: 'Qualificado', color: '#10b981', bg: '#10b98120' };
      case 'converted':
        return { label: 'Convertido', color: '#10b981', bg: '#10b98120' };
      case 'lost':
        return { label: 'Perdido', color: '#ef4444', bg: '#ef444420' };
      default:
        return { label: status || 'Novo', color: '#00d9ff', bg: '#00d9ff20' };
    }
  };

  const formatTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'hoje';
    if (days === 1) return 'há 1d atrás';
    return `há ${days}d atrás`;
  };

  const formatPhone = (phone?: string) => {
    if (!phone) return '000 0000-000';
    // Simple formatting
    return phone.replace(/(\d{3})(\d{4})(\d{3})/, '$1 $2-$3');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00d9ff" />
      </View>
    );
  }

  if (!lead) return null;

  const statusConfig = getStatusConfig(lead.status);

  return (
    <View style={styles.container}>
      {/* Header with back and menu */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#00d9ff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton} onPress={handleOpenMenu}>
          <Ionicons name="ellipsis-vertical" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          {/* Avatar with glow */}
          <View style={styles.avatarContainer}>
            {lead.avatar_url ? (
              <Image source={{ uri: lead.avatar_url }} style={styles.avatarImage} />
            ) : (
              <LinearGradient colors={['#374151', '#1f2937']} style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={64} color="#6b7280" />
              </LinearGradient>
            )}
            {/* Cyan/magenta ring */}
            <LinearGradient
              colors={['#00d9ff', '#d946ef']}
              style={styles.avatarRing}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </View>

          {/* Name */}
          <Text style={styles.leadName}>{lead.name || 'User X'}</Text>

          {/* Phone */}
          <Text style={styles.leadPhone}>{formatPhone(lead.phone)}</Text>

          {/* Email */}
          <Text style={styles.leadEmail}>{lead.email || 'example@email.com'}</Text>

          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          {/* Agendar Visita */}
          <TouchableOpacity style={styles.actionButton} onPress={handleScheduleVisit}>
            <View style={styles.actionContent}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="calendar-outline" size={24} color="#00d9ff" />
              </View>
              <Text style={styles.actionText}>Agendar Visita</Text>
            </View>
            <View style={styles.actionRight}>
              <Ionicons name="information-circle-outline" size={18} color="#6b7280" />
              <View style={styles.actionDot} />
            </View>
          </TouchableOpacity>

          {/* Enviar Mensagem */}
          <TouchableOpacity style={styles.actionButton} onPress={handleSendMessage}>
            <View style={styles.actionContent}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="chatbubble-ellipses-outline" size={24} color="#00d9ff" />
              </View>
              <Text style={styles.actionText}>Enviar Mensagem</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>

          {/* Adicionar Proposta */}
          <TouchableOpacity style={styles.actionButton} onPress={handleAddProposal}>
            <View style={styles.actionContent}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="document-text-outline" size={24} color="#00d9ff" />
              </View>
              <Text style={styles.actionText}>Adicionar Proposta</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>

          {/* Converter Em Cliente */}
          <TouchableOpacity style={styles.actionButton} onPress={handleConvertClient}>
            <View style={styles.actionContent}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="heart-outline" size={24} color="#d946ef" />
              </View>
              <Text style={styles.actionText}>Converter Em Cliente</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Notas & Histórico */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Notas & Histórico</Text>

          {history.map((item) => (
            <View key={item.id} style={styles.historyItem}>
              {/* Agent avatar */}
              <View style={styles.historyAvatar}>
                {item.agent_avatar ? (
                  <Image source={{ uri: item.agent_avatar }} style={styles.historyAvatarImage} />
                ) : (
                  <LinearGradient
                    colors={['#374151', '#1f2937']}
                    style={styles.historyAvatarPlaceholder}
                  >
                    <Text style={styles.historyAvatarInitial}>
                      {item.agent_name?.[0] || 'A'}
                    </Text>
                  </LinearGradient>
                )}
              </View>

              {/* History content */}
              <View style={styles.historyContent}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyAgentName}>{item.agent_name}</Text>
                  <Text style={styles.historyTime}>{formatTimeAgo(item.created_at)}</Text>
                </View>
                <Text style={styles.historyDescription}>{item.description}</Text>
                {item.type === 'email' && (
                  <Text style={styles.historyMeta}>Email enviado</Text>
                )}
              </View>
            </View>
          ))}

          {history.length === 0 && (
            <View style={styles.emptyHistory}>
              <Ionicons name="document-text-outline" size={32} color="#6b7280" />
              <Text style={styles.emptyHistoryText}>Sem histórico ainda</Text>
            </View>
          )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 64,
    opacity: 0.6,
    zIndex: -1,
  },
  leadName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  leadPhone: {
    fontSize: 18,
    color: '#e5e7eb',
    marginBottom: 4,
    letterSpacing: 1,
  },
  leadEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1f2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#00d9ff15',
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#0a0e1a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  actionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f59e0b',
  },
  historySection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: '#1a1f2e',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  historyAvatar: {
    marginRight: 12,
  },
  historyAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  historyAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyAvatarInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
  },
  historyContent: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyAgentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  historyTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  historyDescription: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 18,
  },
  historyMeta: {
    fontSize: 11,
    color: '#00d9ff',
    marginTop: 4,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#1a1f2e',
    borderRadius: 16,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
});
