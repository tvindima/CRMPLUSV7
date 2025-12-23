/**
 * AgentScreenV4 - Assistente IA fiel ao mockup
 * Lista de funcionalidades IA com ícones e setas
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { apiService } from '../services/api';

interface AgentProfile {
  id: number;
  name: string;
  photo?: string;
}

interface IAOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
}

const IA_OPTIONS: IAOption[] = [
  {
    id: 'agenda',
    title: 'Organização de Agenda',
    subtitle: 'Otimizar horários e agendamentos',
    icon: '📋',
    color: '#00d9ff',
  },
  {
    id: 'social',
    title: 'Criar Post para Redes Sociais',
    subtitle: 'Gerar conteúdo para redes sociais',
    icon: '📱',
    color: '#ff6b9d',
  },
  {
    id: 'notes',
    title: 'Anotar Ideias / Notas Rápidas',
    subtitle: 'Adicionar e organizar notas rápidas',
    icon: '💡',
    color: '#00d9ff',
  },
  {
    id: 'messages',
    title: 'Gerar Mensagens & E-mails',
    subtitle: 'Criar mensagens profissionais',
    icon: '✉️',
    color: '#00d9ff',
  },
  {
    id: 'evaluation',
    title: 'Gerar Avaliação de Imóvel',
    subtitle: 'Análise de preço com base em mercado',
    icon: '📊',
    color: '#00d9ff',
  },
];

export default function AgentScreenV4() {
  const navigation = useNavigation();
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
      return `https://crmplusv7-production.up.railway.app${agentProfile.photo}`;
    }
    return null;
  };

  const handleOptionPress = (option: IAOption) => {
    // TODO: Navegar para ecrã específico de cada funcionalidade
    console.log('Selected IA option:', option.id);
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
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#00d9ff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Assistente IA</Text>
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

      {/* Options List */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {IA_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.optionCard}
            onPress={() => handleOptionPress(option)}
          >
            <LinearGradient
              colors={['#1a1f2e', '#151a28']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.optionGradient}
            >
              {/* Icon */}
              <View style={styles.optionIcon}>
                <Text style={styles.optionEmoji}>{option.icon}</Text>
              </View>

              {/* Text */}
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
              </View>

              {/* Arrow */}
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </LinearGradient>
          </TouchableOpacity>
        ))}

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
    paddingBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  optionCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#00d9ff30',
  },
  optionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0a0e1a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionEmoji: {
    fontSize: 24,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00d9ff',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#9ca3af',
  },
});
