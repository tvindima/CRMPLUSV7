/**
 * NewLeadScreen - Formulário de criação de lead
 * 6 campos: Nome, Telefone, Email, Origem, Orçamento, Notas
 */

import React, { useState } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { apiService } from '../services/api';

export default function NewLeadScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    origin: '',
    budget: '',
    notes: '',
  });

  const handleSubmit = async () => {
    // Validação
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
        budget: formData.budget ? parseInt(formData.budget) : null,
        notes: formData.notes || null,
      };

      await apiService.post('/mobile/leads', payload);
      Alert.alert('Sucesso', 'Lead criado com sucesso!');
      navigation.goBack();
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#00d9ff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novo Lead</Text>
        <View style={styles.headerSpacer} />
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
            <Text style={styles.inputLabel}>
              Nome <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#00d9ff"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="João Silva"
                placeholderTextColor="#6b7280"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                editable={!loading}
              />
            </View>
          </View>

          {/* Telefone */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>
              Telefone <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="call-outline"
                size={20}
                color="#00d9ff"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="+351 912 345 678"
                placeholderTextColor="#6b7280"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
                editable={!loading}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#00d9ff"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="joao@example.com"
                placeholderTextColor="#6b7280"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
          </View>

          {/* Origem */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Origem</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="location-outline"
                size={20}
                color="#00d9ff"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Facebook, Instagram, Website..."
                placeholderTextColor="#6b7280"
                value={formData.origin}
                onChangeText={(text) => setFormData({ ...formData, origin: text })}
                editable={!loading}
              />
            </View>
          </View>

          {/* Orçamento */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Orçamento (€)</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="cash-outline"
                size={20}
                color="#00d9ff"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="250000"
                placeholderTextColor="#6b7280"
                value={formData.budget}
                onChangeText={(text) =>
                  setFormData({ ...formData, budget: text.replace(/[^0-9]/g, '') })
                }
                keyboardType="numeric"
                editable={!loading}
              />
            </View>
          </View>

          {/* Notas */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Notas</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Observações adicionais..."
                placeholderTextColor="#6b7280"
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!loading}
              />
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <LinearGradient
            colors={loading ? ['#374151', '#1f2937'] : ['#00d9ff', '#8b5cf6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitButtonGradient}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Criando...' : 'Criar Lead'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
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
  required: {
    color: '#ef4444',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1f2e',
    borderWidth: 1,
    borderColor: '#00d9ff40',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  textArea: {
    minHeight: 100,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#0a0e1a',
    borderTopWidth: 1,
    borderTopColor: '#1a1f2e',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
});
