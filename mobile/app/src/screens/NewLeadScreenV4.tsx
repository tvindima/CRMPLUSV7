/**
 * NewLeadScreenV4 - Fiel ao mockup
 * Formulário elegante com campos e ícones à direita
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
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

const ORIGIN_OPTIONS = ['Site', 'Facebook', 'Instagram', 'Referência', 'Outro'];

export default function NewLeadScreenV4() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
  const [showOriginOptions, setShowOriginOptions] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    interest: '',
    budget: '',
    origin: 'Site',
  });

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

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone) {
      Alert.alert('Campos obrigatórios', 'Preencha pelo menos Nome e Telefone');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        origin: formData.origin || null,
        budget: formData.budget ? parseInt(formData.budget.replace(/[^0-9]/g, '')) : null,
        notes: formData.interest || null,
      };

      await apiService.post('/mobile/leads', payload);
      Alert.alert('Sucesso', 'Lead criado com sucesso!');
      
      // ✅ NOVO: Forçar reload da lista (tab + stack)
      navigation.navigate('Leads', {
        screen: 'LeadsMain',
        params: { refresh: Date.now() },
      } as any);
    } catch (error: any) {
      console.error('Error creating lead:', error);
      Alert.alert('Erro', error.detail || 'Erro ao criar lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#00d9ff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Novo Lead</Text>
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

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Nome */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Nome</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Nome do interessado"
                placeholderTextColor="#6b7280"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                editable={!loading}
              />
              <Ionicons name="person-outline" size={20} color="#00d9ff" />
            </View>
          </View>

          {/* E-mail */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>E-mail</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="exemplo@email.com"
                placeholderTextColor="#6b7280"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
              <Ionicons name="mail-outline" size={20} color="#00d9ff" />
            </View>
          </View>

          {/* Telefone */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Telefone</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="000 000 000"
                placeholderTextColor="#6b7280"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
                editable={!loading}
              />
              <Ionicons name="call-outline" size={20} color="#00d9ff" />
            </View>
          </View>

          {/* Interesse */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Interesse</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Selecione uma ou mais propriedades"
                placeholderTextColor="#6b7280"
                value={formData.interest}
                onChangeText={(text) => setFormData({ ...formData, interest: text })}
                editable={!loading}
              />
              <Ionicons name="home-outline" size={20} color="#00d9ff" />
            </View>
          </View>

          {/* Orçamento */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Orçamento</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.currencyPrefix}>€</Text>
              <TextInput
                style={[styles.input, styles.inputWithPrefix]}
                placeholder="Orçamento estimado"
                placeholderTextColor="#6b7280"
                value={formData.budget}
                onChangeText={(text) =>
                  setFormData({ ...formData, budget: text.replace(/[^0-9]/g, '') })
                }
                keyboardType="numeric"
                editable={!loading}
              />
              <Ionicons name="layers-outline" size={20} color="#00d9ff" />
            </View>
          </View>

          {/* Origem */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Origem</Text>
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => setShowOriginOptions(!showOriginOptions)}
            >
              <View style={styles.originRow}>
                <Ionicons name="globe-outline" size={20} color="#00d9ff" />
                <Text style={styles.originText}>{formData.origin}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </TouchableOpacity>
            
            {showOriginOptions && (
              <View style={styles.originOptions}>
                {ORIGIN_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.originOption,
                      formData.origin === option && styles.originOptionActive,
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, origin: option });
                      setShowOriginOptions(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.originOptionText,
                        formData.origin === option && styles.originOptionTextActive,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={['#ff00ff', '#00d9ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.submitText}>+ Criar Lead</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a',
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
  },
  backButton: {
    marginRight: 8,
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00d9ff',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#ffffff',
  },
  inputWithPrefix: {
    marginLeft: 8,
  },
  currencyPrefix: {
    fontSize: 15,
    color: '#6b7280',
  },
  originRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  originText: {
    fontSize: 15,
    color: '#ffffff',
  },
  originOptions: {
    marginTop: 8,
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  originOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  originOptionActive: {
    backgroundColor: '#00d9ff20',
  },
  originOptionText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  originOptionTextActive: {
    color: '#00d9ff',
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
