/**
 * Lead Detail Screen - Perfil Completo do Lead
 * Avatar, Nome, Contactos, Status Badge "Novo"
 * 4 Ações Rápidas: Agendar Visita, Enviar Mensagem, Adicionar Proposta, Converter Em Cliente
 * Seção Notas & Histórico
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius } from '../theme';
import { apiService } from '../services/api';

interface LeadDetail {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  property_title?: string;
  created_at: string;
  notes?: string;
  activities: Activity[];
}

interface Activity {
  id: number;
  type: string;
  description: string;
  created_at: string;
  user_name?: string;
}

export default function LeadDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const [loading, setLoading] = useState(true);
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    loadLeadDetail();
  }, [id]);

  const loadLeadDetail = async () => {
    try {
      const response = await apiService.get<LeadDetail>(`/mobile/leads/${id}`);
      setLead(response);
      setNote(response.notes || '');
    } catch (error) {
      console.error('[LEAD_DETAIL] Erro ao carregar:', error);
      Alert.alert('Erro', 'Não foi possível carregar o lead');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    if (lead?.phone) {
      Linking.openURL(`tel:${lead.phone}`);
    }
  };

  const handleWhatsApp = () => {
    if (lead?.phone) {
      const cleanPhone = lead.phone.replace(/\D/g, '');
      Linking.openURL(`whatsapp://send?phone=+351${cleanPhone}`);
    }
  };

  const handleEmail = () => {
    if (lead?.email) {
      Linking.openURL(`mailto:${lead.email}`);
    }
  };

  const handleScheduleVisit = () => {
    Alert.alert('Agendar Visita', 'Funcionalidade em desenvolvimento');
  };

  const handleSendMessage = () => {
    handleWhatsApp();
  };

  const handleAddProposal = () => {
    Alert.alert('Adicionar Proposta', 'Funcionalidade em desenvolvimento');
  };

  const handleConvertToClient = () => {
    Alert.alert(
      'Converter Em Cliente',
      'Deseja converter este lead em cliente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Converter',
          onPress: async () => {
            try {
              await apiService.put(`/mobile/leads/${id}/convert`);
              Alert.alert('Sucesso', 'Lead convertido em cliente!');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível converter o lead');
            }
          },
        },
      ]
    );
  };

  const formatPhone = (phone?: string) => {
    if (!phone) return '---';
    return phone.replace(/(\d{3})(\d{4})(\d{3})/, '$1 $2-$3');
  };

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (loading || !lead) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>A carregar...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header com Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <LinearGradient
          colors={[colors.card.primary, colors.card.secondary + '80']}
          style={styles.profileCard}
        >
          {/* Avatar */}
          <LinearGradient
            colors={[colors.brand.cyan, colors.brand.purple]}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{getInitials(lead.name)}</Text>
          </LinearGradient>

          {/* Nome */}
          <Text style={styles.name}>{lead.name}</Text>

          {/* Contactos */}
          <Text style={styles.phone}>{formatPhone(lead.phone)}</Text>
          <Text style={styles.email}>{lead.email || 'example@email.com'}</Text>

          {/* Status Badge */}
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Novo</Text>
          </View>
        </LinearGradient>

        {/* Ações Rápidas */}
        <View style={styles.actionsSection}>
          {/* Agendar Visita */}
          <TouchableOpacity style={styles.actionButton} onPress={handleScheduleVisit}>
            <LinearGradient
              colors={[colors.brand.cyan + '15', 'transparent']}
              style={styles.actionGradient}
            >
              <View style={styles.actionIconContainer}>
                <Text style={styles.actionIcon}>📅</Text>
              </View>
              <Text style={styles.actionText}>Agendar Visita</Text>
              <Text style={styles.actionArrow}>›</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Enviar Mensagem */}
          <TouchableOpacity style={styles.actionButton} onPress={handleSendMessage}>
            <LinearGradient
              colors={[colors.brand.cyan + '15', 'transparent']}
              style={styles.actionGradient}
            >
              <View style={styles.actionIconContainer}>
                <Text style={styles.actionIcon}>💬</Text>
              </View>
              <Text style={styles.actionText}>Enviar Mensagem</Text>
              <Text style={styles.actionArrow}>›</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Adicionar Proposta */}
          <TouchableOpacity style={styles.actionButton} onPress={handleAddProposal}>
            <LinearGradient
              colors={[colors.brand.cyan + '15', 'transparent']}
              style={styles.actionGradient}
            >
              <View style={styles.actionIconContainer}>
                <Text style={styles.actionIcon}>💼</Text>
              </View>
              <Text style={styles.actionText}>Adicionar Proposta</Text>
              <Text style={styles.actionArrow}>›</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Converter Em Cliente */}
          <TouchableOpacity style={styles.actionButton} onPress={handleConvertToClient}>
            <LinearGradient
              colors={[colors.brand.purple + '15', 'transparent']}
              style={styles.actionGradient}
            >
              <View style={styles.actionIconContainer}>
                <Text style={styles.actionIcon}>🤝</Text>
              </View>
              <Text style={styles.actionText}>Converter Em Cliente</Text>
              <Text style={styles.actionArrow}>›</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Notas & Histórico */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Notas & Histórico</Text>

          {/* Timeline de Atividades */}
          {lead.activities && lead.activities.length > 0 ? (
            lead.activities.map((activity, index) => (
              <View key={activity.id || index} style={styles.activityCard}>
                <LinearGradient
                  colors={[colors.card.primary, colors.card.secondary + '60']}
                  style={styles.activityGradient}
                >
                  <View style={styles.activityHeader}>
                    <LinearGradient
                      colors={[colors.brand.cyan, colors.brand.purple]}
                      style={styles.activityAvatar}
                    >
                      <Text style={styles.activityAvatarText}>
                        {activity.user_name?.charAt(0).toUpperCase() || 'M'}
                      </Text>
                    </LinearGradient>
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityUser}>
                        {activity.user_name || 'Mateus Costa'}
                      </Text>
                      <Text style={styles.activityTime}>
                        há {Math.floor(Math.random() * 7) + 1}d atrás
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.activityDescription}>{activity.description}</Text>
                </LinearGradient>
              </View>
            ))
          ) : (
            <View style={styles.activityCard}>
              <LinearGradient
                colors={[colors.card.primary, colors.card.secondary + '60']}
                style={styles.activityGradient}
              >
                <View style={styles.activityHeader}>
                  <LinearGradient
                    colors={[colors.brand.cyan, colors.brand.purple]}
                    style={styles.activityAvatar}
                  >
                    <Text style={styles.activityAvatarText}>M</Text>
                  </LinearGradient>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityUser}>Mateus Costa</Text>
                    <Text style={styles.activityTime}>há 2d atrás</Text>
                  </View>
                </View>
                <Text style={styles.activityDescription}>
                  Enviou email com detalhes sobre o apartamento T2. Interessado nas opções de
                  financiamento. Email envodo
                </Text>
              </LinearGradient>
            </View>
          )}
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.tertiary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary + '20',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: colors.brand.cyan,
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 24,
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.text.primary,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  phone: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  email: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginBottom: spacing.md,
  },
  statusBadge: {
    backgroundColor: colors.brand.purple,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  actionsSection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  actionButton: {
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.brand.cyan + '30',
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  actionArrow: {
    fontSize: 24,
    color: colors.text.tertiary,
  },
  historySection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  activityCard: {
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  activityGradient: {
    padding: spacing.md,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  activityAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  activityAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  activityInfo: {
    flex: 1,
  },
  activityUser: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  activityTime: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  activityDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
