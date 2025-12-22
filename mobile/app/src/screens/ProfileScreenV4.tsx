/**
 * ProfileScreenV4 - Fiel ao mockup
 * Avatar grande, campos editáveis, configurações e botão Sair
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

interface AgentProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  photo?: string;
}

export default function ProfileScreenV4() {
  const navigation = useNavigation();
  const { signOut, user } = useAuth();
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    loadAgentProfile();
  }, []);

  const loadAgentProfile = async () => {
    try {
      const statsResponse = await apiService.get<any>('/mobile/dashboard/stats');
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
      console.error('Error loading agent:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarUrl = () => {
    if (agentProfile?.photo) {
      if (agentProfile.photo.startsWith('http')) {
        return agentProfile.photo;
      }
      return `https://fantastic-simplicity-production.up.railway.app${agentProfile.photo}`;
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
      const parts = agentProfile.name.split(' ');
      if (parts.length > 1) {
        return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
      }
      return parts[0];
    }
    return 'Utilizador';
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
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#00d9ff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Perfil</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            {getAvatarUrl() ? (
              <Image source={{ uri: getAvatarUrl()! }} style={styles.avatar} />
            ) : (
              <LinearGradient
                colors={['#ff00ff', '#00d9ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradient}
              >
                <Ionicons name="person" size={48} color="#fff" />
              </LinearGradient>
            )}
          </View>
          <Text style={styles.userName}>{getDisplayName()}</Text>
          <Text style={styles.userRole}>Agente Imobiliário</Text>
        </View>

        {/* Info Fields */}
        <View style={styles.fieldsSection}>
          {/* Nome */}
          <View style={styles.fieldCard}>
            <Ionicons name="person-outline" size={20} color="#00d9ff" />
            <Text style={styles.fieldValue}>{getDisplayName()}</Text>
            <TouchableOpacity>
              <Ionicons name="create-outline" size={20} color="#00d9ff" />
            </TouchableOpacity>
          </View>

          {/* Email */}
          <View style={styles.fieldCard}>
            <Ionicons name="mail-outline" size={20} color="#00d9ff" />
            <Text style={styles.fieldValue}>{agentProfile?.email || 'tiago@example.com'}</Text>
            <TouchableOpacity>
              <Ionicons name="create-outline" size={20} color="#00d9ff" />
            </TouchableOpacity>
          </View>

          {/* Telefone */}
          <View style={styles.fieldCard}>
            <Ionicons name="call-outline" size={20} color="#00d9ff" />
            <Text style={styles.fieldValue}>{agentProfile?.phone || '000 000 000'}</Text>
            <TouchableOpacity>
              <Ionicons name="create-outline" size={20} color="#00d9ff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Configurações */}
        <View style={styles.configSection}>
          <Text style={styles.sectionTitle}>Configurações</Text>

          {/* Notificações */}
          <View style={styles.configRow}>
            <View style={styles.configLeft}>
              <Ionicons name="notifications-outline" size={20} color="#9ca3af" />
              <Text style={styles.configLabel}>Notificações</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#333', true: '#00d9ff' }}
              thumbColor="#fff"
            />
          </View>

          {/* Idioma */}
          <TouchableOpacity style={styles.configRow}>
            <View style={styles.configLeft}>
              <Ionicons name="globe-outline" size={20} color="#9ca3af" />
              <Text style={styles.configLabel}>Idioma</Text>
            </View>
            <View style={styles.configRight}>
              <Text style={styles.configValue}>Português</Text>
              <Ionicons name="chevron-forward" size={16} color="#6b7280" />
            </View>
          </TouchableOpacity>

          {/* E-mail */}
          <TouchableOpacity style={styles.configRow}>
            <View style={styles.configLeft}>
              <Ionicons name="mail-outline" size={20} color="#9ca3af" />
              <Text style={styles.configLabel}>E-mail</Text>
            </View>
            <View style={styles.configRight}>
              <Text style={styles.configValue}>exemplo@email.com</Text>
              <Ionicons name="chevron-forward" size={16} color="#6b7280" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Notas Section */}
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Notas / Eventos Futuro</Text>
          <Text style={styles.notesText}>
            Curtiu a arquitetura da casa, quer conhecer as opções de financiamento.
          </Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LinearGradient
            colors={['#ff00ff40', '#cc66ff40']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.logoutGradient}
          >
            <Text style={styles.logoutText}>Sair</Text>
          </LinearGradient>
        </TouchableOpacity>

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
  headerTitle: {
    fontSize: 24,
    fontWeight: '300',
    color: '#ffffff',
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#00d9ff',
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#00d9ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
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
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#9ca3af',
  },
  fieldsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  fieldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#00d9ff30',
  },
  fieldValue: {
    flex: 1,
    fontSize: 15,
    color: '#ffffff',
    marginLeft: 12,
  },
  configSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  configRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1f2e',
  },
  configLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  configLabel: {
    fontSize: 15,
    color: '#ffffff',
  },
  configRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  configValue: {
    fontSize: 14,
    color: '#9ca3af',
  },
  notesSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  notesText: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 22,
  },
  logoutButton: {
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ff00ff60',
  },
  logoutGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
