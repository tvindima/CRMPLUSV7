/**
 * ProfileScreenV5 - Perfil simplificado
 * Avatar, dados do agente, estatísticas rápidas e atalhos
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

interface AgentProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  photo?: string;
}

interface AgentStats {
  properties: number;
  leads: number;
  visits_today: number;
}

export default function ProfileScreenV5() {
  const navigation = useNavigation<NavigationProp<any>>();
  const { signOut, user } = useAuth();
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
  const [stats, setStats] = useState<AgentStats>({ properties: 0, leads: 0, visits_today: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const statsResponse = await apiService.get<any>('/mobile/dashboard/stats');
      setStats({
        properties: statsResponse.properties || 0,
        leads: statsResponse.leads || 0,
        visits_today: statsResponse.visits_today || 0,
      });
      
      if (statsResponse.agent_id) {
        const agentResponse = await apiService.get<any>(`/agents/${statsResponse.agent_id}`);
        setAgentProfile({
          id: agentResponse.id,
          name: agentResponse.name,
          email: agentResponse.email || user?.email || '',
          phone: agentResponse.phone || '',
          photo: agentResponse.photo,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
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

  const handleLogout = () => {
    Alert.alert(
      'Terminar Sessão',
      'Tem a certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const getDisplayName = () => {
    if (agentProfile?.name) {
      return agentProfile.name;
    }
    return 'Utilizador';
  };

  const getInitials = () => {
    if (agentProfile?.name) {
      const parts = agentProfile.name.split(' ');
      if (parts.length > 1) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`;
      }
      return parts[0][0];
    }
    return 'U';
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#00d9ff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Perfil</Text>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={24} color="#00d9ff" />
          </TouchableOpacity>
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            {getAvatarUrl() ? (
              <Image source={{ uri: getAvatarUrl()! }} style={styles.avatar} />
            ) : (
              <LinearGradient
                colors={['#00d9ff', '#8b5cf6', '#d946ef']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarInitials}>{getInitials()}</Text>
              </LinearGradient>
            )}
          </View>
          <Text style={styles.userName}>{getDisplayName()}</Text>
          <Text style={styles.userRole}>Agente Imobiliário</Text>
          <TouchableOpacity style={styles.editProfileButton}>
            <Ionicons name="create-outline" size={16} color="#00d9ff" />
            <Text style={styles.editProfileText}>Editar Perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Info */}
        <View style={styles.contactSection}>
          <View style={styles.contactItem}>
            <View style={[styles.contactIcon, { backgroundColor: '#00d9ff20' }]}>
              <Ionicons name="mail-outline" size={18} color="#00d9ff" />
            </View>
            <Text style={styles.contactText}>{agentProfile?.email || 'email@exemplo.com'}</Text>
          </View>
          {agentProfile?.phone && (
            <View style={styles.contactItem}>
              <View style={[styles.contactIcon, { backgroundColor: '#10b98120' }]}>
                <Ionicons name="call-outline" size={18} color="#10b981" />
              </View>
              <Text style={styles.contactText}>{agentProfile.phone}</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.properties}</Text>
            <Text style={styles.statLabel}>Imóveis</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.leads}</Text>
            <Text style={styles.statLabel}>Leads</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.visits_today}</Text>
            <Text style={styles.statLabel}>Visitas Hoje</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => navigation.navigate('Settings')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#8b5cf620' }]}>
              <Ionicons name="settings-outline" size={22} color="#8b5cf6" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Definições</Text>
              <Text style={styles.actionDesc}>Notificações, idioma, tema da app</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <View style={[styles.actionIcon, { backgroundColor: '#00d9ff20' }]}>
              <Ionicons name="help-circle-outline" size={22} color="#00d9ff" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Ajuda & Suporte</Text>
              <Text style={styles.actionDesc}>FAQ, contactar suporte</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <View style={[styles.actionIcon, { backgroundColor: '#f59e0b20' }]}>
              <Ionicons name="star-outline" size={22} color="#f59e0b" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Avaliar App</Text>
              <Text style={styles.actionDesc}>Deixe a sua opinião</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <View style={[styles.actionIcon, { backgroundColor: '#6b728020' }]}>
              <Ionicons name="document-text-outline" size={22} color="#6b7280" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Termos & Privacidade</Text>
              <Text style={styles.actionDesc}>Políticas e condições de uso</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Terminar Sessão</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Versão 1.0.0</Text>

        <View style={{ height: 120 }} />
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1f2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1f2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#00d9ff',
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#00d9ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
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
  avatarInitials: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 12,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00d9ff40',
    backgroundColor: '#00d9ff10',
  },
  editProfileText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#00d9ff',
  },
  contactSection: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1a1f2e',
    padding: 14,
    borderRadius: 12,
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactText: {
    fontSize: 14,
    color: '#ffffff',
    flex: 1,
  },
  statsSection: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#1a1f2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#00d9ff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#ffffff15',
    marginHorizontal: 10,
  },
  actionsSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1f2e',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    gap: 14,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 12,
    color: '#6b7280',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef444440',
    backgroundColor: '#ef444410',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6b7280',
    marginTop: 16,
  },
});
