/**
 * VisitDetailScreen - Confirmar Check-In, Reagendar, Feedback
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { apiService } from '../services/api';

interface Visit {
  id: number;
  scheduled_at: string;
  lead_name: string;
  lead_phone: string;
  lead_email: string;
  property_title: string;
  property_location: string;
  property_image?: string;
  notes?: string;
  status: string;
}

export default function VisitDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = (route.params as any) || {};
  
  const [visit, setVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (id) {
      loadVisitDetail();
    }
  }, [id]);

  const loadVisitDetail = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<Visit>(`/mobile/visits/${id}`);
      setVisit(response);
      setFeedback(response.notes || '');
    } catch (error) {
      console.error('Error loading visit:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes da visita');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      await apiService.post(`/mobile/visits/${id}/check-in`, {});
      Alert.alert('Sucesso', 'Check-in confirmado!');
      loadVisitDetail();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível fazer check-in');
    }
  };

  const handleReschedule = () => {
    Alert.alert('Reagendar', 'Funcionalidade em desenvolvimento');
  };

  const handleSaveFeedback = async () => {
    try {
      await apiService.post(`/mobile/visits/${id}/feedback`, {
        notes: feedback,
      });
      Alert.alert('Sucesso', 'Feedback guardado!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível guardar feedback');
    }
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#00d9ff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Visita Agendada</Text>
        <View style={styles.headerAvatar}>
          <Ionicons name="person-circle-outline" size={40} color="#00d9ff" />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Date/Time */}
        <View style={styles.dateTimeSection}>
          <Ionicons name="calendar" size={24} color="#00d9ff" />
          <Text style={styles.dateTimeText}>
            {new Date(visit.scheduled_at).toLocaleString('pt-PT', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {/* Client Info */}
        <View style={styles.section}>
          <View style={styles.clientHeader}>
            <View style={styles.clientAvatar}>
              <Ionicons name="person" size={32} color="#00d9ff" />
            </View>
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>{visit.lead_name}</Text>
              <Text style={styles.clientContact}>{visit.lead_phone}</Text>
              <Text style={styles.clientContact}>{visit.lead_email}</Text>
            </View>
          </View>
        </View>

        {/* Property Info */}
        <View style={styles.section}>
          {visit.property_image && (
            <Image
              source={{ uri: visit.property_image }}
              style={styles.propertyImage}
            />
          )}
          <Text style={styles.propertyTitle}>{visit.property_title}</Text>
          <View style={styles.propertyLocation}>
            <Ionicons name="location" size={16} color="#00d9ff" />
            <Text style={styles.propertyLocationText}>{visit.property_location}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCheckIn}>
            <LinearGradient
              colors={['#00d9ff', '#0ea5e9']}
              style={styles.actionGradient}
            >
              <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
              <Text style={styles.actionButtonText}>Confirmar Check-In</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButtonSecondary} onPress={handleReschedule}>
            <LinearGradient
              colors={['#8b5cf620', '#8b5cf610']}
              style={styles.actionGradient}
            >
              <Ionicons name="time" size={24} color="#8b5cf6" />
              <Text style={[styles.actionButtonText, { color: '#8b5cf6' }]}>
                Reagendar
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalhes</Text>
          
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color="#00d9ff" />
            <Text style={styles.detailLabel}>Hora</Text>
            <Text style={styles.detailValue}>
              {new Date(visit.scheduled_at).toLocaleTimeString('pt-PT', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="business-outline" size={20} color="#00d9ff" />
            <Text style={styles.detailLabel}>Imóvel</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {visit.property_title}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={20} color="#00d9ff" />
            <Text style={styles.detailLabel}>Telefone</Text>
            <Text style={styles.detailValue}>{visit.lead_phone}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={20} color="#00d9ff" />
            <Text style={styles.detailLabel}>E-mail</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {visit.lead_email}
            </Text>
          </View>
        </View>

        {/* Notes/Feedback */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notas e Sugestões</Text>
          <View style={styles.feedbackContainer}>
            <TextInput
              style={styles.feedbackInput}
              placeholder="Adicionar notas e sugestões da visita..."
              placeholderTextColor="#6b7280"
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <TouchableOpacity style={styles.voiceButton}>
              <Ionicons name="mic" size={24} color="#00d9ff" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.saveFeedbackButton} onPress={handleSaveFeedback}>
            <LinearGradient
              colors={['#00d9ff', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveFeedbackGradient}
            >
              <Text style={styles.saveFeedbackText}>Guardar Feedback</Text>
            </LinearGradient>
          </TouchableOpacity>
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
    color: '#00d9ff',
  },
  headerAvatar: {
    width: 40,
    height: 40,
  },
  content: {
    flex: 1,
  },
  dateTimeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#00d9ff20',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#00d9ff40',
  },
  dateTimeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00d9ff',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  clientAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#00d9ff20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#00d9ff40',
  },
  clientInfo: {},
  clientName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  clientContact: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 2,
  },
  propertyImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#374151',
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  propertyLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  propertyLocationText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonSecondary: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#8b5cf640',
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
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
  detailLabel: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '600',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  feedbackContainer: {
    position: 'relative',
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00d9ff40',
    marginBottom: 16,
  },
  feedbackInput: {
    padding: 16,
    fontSize: 15,
    color: '#ffffff',
    minHeight: 140,
  },
  voiceButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00d9ff20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveFeedbackButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveFeedbackGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveFeedbackText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
