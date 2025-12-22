/**
 * ProfileScreen - Redesigned conforme mockup
 * Avatar, dados editáveis, configurações, logout
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

interface AgentProfile {
  photo?: string;
  avatar_url?: string;
  name?: string;
  phone?: string;
}

export default function ProfileScreenV3() {
  const { user, signOut } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);

  useEffect(() => {
    loadAgentProfile();
  }, []);

  const loadAgentProfile = async () => {
    try {
      const statsResponse = await apiService.get<any>('/mobile/dashboard/stats');
      if (statsResponse?.agent_id) {
        try {
          const agentResponse = await apiService.get<any>(`/agents/${statsResponse.agent_id}`);
          if (agentResponse) {
            setAgentProfile({
              photo: agentResponse.photo,
              avatar_url: agentResponse.avatar_url,
              name: agentResponse.name,
              phone: agentResponse.phone,
            });
          }
        } catch (agentError) {
          console.log('Could not load agent profile');
        }
      }
    } catch (error) {
      console.error('Error loading agent profile:', error);
    }
  };

  const getAvatarUrl = () => {
    if (agentProfile?.photo) return agentProfile.photo;
    if (agentProfile?.avatar_url) {
      if (agentProfile.avatar_url.startsWith('/')) {
        return `https://fantastic-simplicity-production.up.railway.app${agentProfile.avatar_url}`;
      }
      return agentProfile.avatar_url;
    }
    return null;
  };

  const handleLogout = async () => {
    // No web, window.confirm funciona melhor que Alert.alert
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Tem certeza que deseja sair da aplicação?');
      if (confirmed) {
        await signOut();
      }
    } else {
      Alert.alert(
        'Sair',
        'Tem certeza que deseja sair da aplicação?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Sair',
            style: 'destructive',
            onPress: async () => {
              await signOut();
            },
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Perfil</Text>
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {getAvatarUrl() ? (
              <Image source={{ uri: getAvatarUrl()! }} style={styles.avatarImage} />
            ) : (
              <LinearGradient
                colors={['#00d9ff', '#8b5cf6']}
                style={styles.avatarGradient}
              >
                <Ionicons name="person" size={64} color="#ffffff" />
              </LinearGradient>
            )}
          </View>
          <Text style={styles.userName}>{user?.name || agentProfile?.name || 'Agente'}</Text>
          <Text style={styles.userRole}>Agente Imobiliário</Text>
        </View>

        {/* Editable Info */}
        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color="#00d9ff" />
            <Text style={styles.infoLabel}>Nome</Text>
            <Text style={styles.infoValue}>{user?.name || 'Tiago V.'}</Text>
            <TouchableOpacity>
              <Ionicons name="create-outline" size={20} color="#00d9ff" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color="#00d9ff" />
            <Text style={styles.infoLabel}>E-mail</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {user?.email || 'tiago@example.com'}
            </Text>
            <TouchableOpacity>
              <Ionicons name="create-outline" size={20} color="#00d9ff" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color="#00d9ff" />
            <Text style={styles.infoLabel}>Telefone</Text>
            <Text style={styles.infoValue}>000 000 000</Text>
            <TouchableOpacity>
              <Ionicons name="create-outline" size={20} color="#00d9ff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Configurações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações</Text>

          <View style={styles.settingRow}>
            <Ionicons name="notifications-outline" size={24} color="#00d9ff" />
            <Text style={styles.settingLabel}>Notificações</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#374151', true: '#00d9ff40' }}
              thumbColor={notificationsEnabled ? '#00d9ff' : '#9ca3af'}
            />
          </View>

          <TouchableOpacity style={styles.settingRow}>
            <Ionicons name="globe-outline" size={24} color="#00d9ff" />
            <Text style={styles.settingLabel}>Idioma</Text>
            <Text style={styles.settingValue}>Português</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <Ionicons name="mail-outline" size={24} color="#00d9ff" />
            <Text style={styles.settingLabel}>E-mail</Text>
            <Text style={styles.settingValue} numberOfLines={1}>
              exemplo@email.com
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Notas / Eventos Futuro */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notas / Eventos Futuro</Text>
          <Text style={styles.notesText}>
            Curtiu a arquitetura da casa, quer conhecer as opções de financiamento.
          </Text>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LinearGradient
              colors={['#ef444420', '#dc262610']}
              style={styles.logoutGradient}
            >
              <Text style={styles.logoutText}>Sair</Text>
            </LinearGradient>
          </TouchableOpacity>
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
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#00d9ff',
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#00d9ff40',
  },
  avatarGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#00d9ff40',
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1f2e',
  },
  infoLabel: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '600',
    width: 80,
  },
  infoValue: {
    flex: 1,
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1f2e',
  },
  settingLabel: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  settingValue: {
    fontSize: 14,
    color: '#9ca3af',
    marginRight: 8,
  },
  notesText: {
    fontSize: 15,
    color: '#9ca3af',
    lineHeight: 22,
    padding: 16,
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00d9ff40',
  },
  logoutButton: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ef444440',
  },
  logoutGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ef4444',
  },
});
