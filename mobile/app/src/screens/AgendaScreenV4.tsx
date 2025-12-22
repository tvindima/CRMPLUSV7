/**
 * AgendaScreenV4 - Fiel ao mockup
 * Calendário horizontal, propriedade em destaque, lista de visitas
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
  Dimensions,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp, useRoute, RouteProp } from '@react-navigation/native';
import { apiService } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Tab = 'overview' | 'galeria' | 'docs' | 'historico';

interface AgentProfile {
  id: number;
  name: string;
  photo?: string;
}

interface Visit {
  id: number;
  scheduled_at: string;
  lead_name: string;
  property_title: string;
  property_location: string;
  property_image?: string;
  status: string;
}

interface FeaturedProperty {
  id: number;
  title: string;
  area?: number;
  price: number;
  images?: string[];
}

const TABS: { label: string; value: Tab }[] = [
  { label: 'Overview', value: 'overview' },
  { label: 'Galeria', value: 'galeria' },
  { label: 'Docs', value: 'docs' },
  { label: 'Histórico de Visitas', value: 'historico' },
];

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const EVENT_TYPES = [
  { id: 'visita', label: 'Visita', icon: 'home-outline', color: '#00d9ff' },
  { id: 'reuniao', label: 'Reunião', icon: 'people-outline', color: '#8b5cf6' },
  { id: 'chamada', label: 'Chamada', icon: 'call-outline', color: '#10b981' },
  { id: 'tarefa', label: 'Tarefa', icon: 'checkbox-outline', color: '#f59e0b' },
  { id: 'lembrete', label: 'Lembrete', icon: 'alarm-outline', color: '#ef4444' },
  { id: 'outro', label: 'Outro', icon: 'ellipsis-horizontal', color: '#6b7280' },
];

type RouteParams = {
  params?: {
    createNew?: boolean;
  };
};

export default function AgendaScreenV4() {
  const navigation = useNavigation<NavigationProp<any>>();
  const route = useRoute<RouteProp<RouteParams, 'params'>>();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [featuredProperty, setFeaturedProperty] = useState<FeaturedProperty | null>(null);
  const [loading, setLoading] = useState(true);
  
  // New Event Modal
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [newEventType, setNewEventType] = useState('visita');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventDate, setNewEventDate] = useState(new Date());
  const [newEventTime, setNewEventTime] = useState('10:00');

  useEffect(() => {
    loadData();
  }, []);

  // Check if we should open the create modal
  useEffect(() => {
    if (route.params?.createNew) {
      setShowNewEventModal(true);
      // Clear the param to avoid reopening
      navigation.setParams({ createNew: undefined });
    }
  }, [route.params?.createNew]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load agent profile
      const statsResponse = await apiService.get<any>('/mobile/dashboard/stats');
      if (statsResponse.agent_id) {
        const agentResponse = await apiService.get<any>(`/agents/${statsResponse.agent_id}`);
        setAgentProfile({
          id: agentResponse.id,
          name: agentResponse.name,
          photo: agentResponse.photo,
        });
      }

      // Load visits (mock for now)
      setVisits([
        {
          id: 1,
          scheduled_at: '2024-04-24T10:00:00',
          lead_name: 'Marcos Costa',
          property_title: 'Apartamento de Luxo',
          property_location: 'Parque das Nações, Lisboa',
          property_image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200',
          status: 'confirmed',
        },
        {
          id: 2,
          scheduled_at: '2024-04-24T13:30:00',
          lead_name: 'Joana Sousa',
          property_title: 'Moradia Moderna',
          property_location: 'Odivelas',
          property_image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200',
          status: 'pending',
        },
        {
          id: 3,
          scheduled_at: '2024-04-24T16:30:00',
          lead_name: 'Pedro Martins',
          property_title: 'Terreno Espaçoso',
          property_location: 'Setúbal',
          property_image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=200',
          status: 'confirmed',
        },
      ]);

      // Load featured property
      const propertiesResponse = await apiService.get<any>('/mobile/properties?my_properties=true&per_page=1');
      const props = propertiesResponse.items || propertiesResponse || [];
      if (props.length > 0) {
        setFeaturedProperty(props[0]);
      }
    } catch (error) {
      console.error('Error loading agenda:', error);
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

  const getWeekDays = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push({
        day: date.getDate(),
        date: date,
        hasEvents: [5, 6, 8].includes(date.getDate()), // Mock events
        isSelected: date.getDate() === selectedDate.getDate(),
      });
    }
    return days;
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatVisitDate = () => {
    return selectedDate.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' });
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
          <Text style={styles.headerTitle}>Agenda</Text>
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

        {/* Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.value}
              style={[styles.tab, activeTab === tab.value && styles.tabActive]}
              onPress={() => setActiveTab(tab.value)}
            >
              <Text style={[styles.tabText, activeTab === tab.value && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity>
            <Ionicons name="chevron-back" size={24} color="#00d9ff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.monthNavInner}>
            <Ionicons name="chevron-back" size={16} color="#fff" />
            <Text style={styles.monthText}>{formatMonth(selectedDate)}</Text>
            <Ionicons name="chevron-forward" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="chevron-forward" size={24} color="#00d9ff" />
          </TouchableOpacity>
        </View>

        {/* Week Days */}
        <View style={styles.weekContainer}>
          <View style={styles.weekHeader}>
            {WEEKDAYS.map((day, index) => (
              <Text key={index} style={styles.weekDayLabel}>{day}</Text>
            ))}
          </View>
          <View style={styles.weekDays}>
            {getWeekDays().map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.dayButton, day.isSelected && styles.dayButtonSelected]}
                onPress={() => setSelectedDate(day.date)}
              >
                <Text style={[styles.dayText, day.isSelected && styles.dayTextSelected]}>
                  {day.day}
                </Text>
                {day.hasEvents && <View style={styles.dayDot} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Featured Property */}
        {featuredProperty && (
          <View style={styles.featuredSection}>
            <Image
              source={{ uri: featuredProperty.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800' }}
              style={styles.featuredImage}
            />
            <View style={styles.featuredInfo}>
              <View style={styles.featuredRow}>
                <Ionicons name="home-outline" size={16} color="#00d9ff" />
                <Text style={styles.featuredTitle}>{featuredProperty.title}</Text>
                <Text style={styles.featuredArea}>{featuredProperty.area || 220} m²</Text>
                <Text style={styles.featuredPrice}>{formatPrice(featuredProperty.price)}</Text>
              </View>
            </View>
            
            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButtonPrimary}>
                <Ionicons name="calendar-outline" size={18} color="#00d9ff" />
                <Text style={styles.actionButtonPrimaryText}>Agendar Visita</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButtonSecondary}>
                <Ionicons name="chatbubble-outline" size={18} color="#9ca3af" />
                <Text style={styles.actionButtonSecondaryText}>Conversar com Lead</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Visits Section */}
        <View style={styles.visitsSection}>
          <Text style={styles.visitsSectionTitle}>
            <Text style={styles.visitsTitleCyan}>Visitas</Text> em {formatVisitDate()}
          </Text>

          {visits.map((visit) => (
            <TouchableOpacity 
              key={visit.id} 
              style={styles.visitCard}
              onPress={() => navigation.navigate('VisitDetail', { id: visit.id })}
            >
              <Image
                source={{ uri: visit.property_image }}
                style={styles.visitImage}
              />
              <View style={styles.visitInfo}>
                <Text style={styles.visitLeadName}>{visit.lead_name}</Text>
                <Text style={styles.visitPropertyTitle}>{visit.property_title}</Text>
                <Text style={styles.visitLocation}>{visit.property_location}</Text>
              </View>
              <Text style={styles.visitTime}>
                {new Date(visit.scheduled_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB - New Event Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setShowNewEventModal(true)}
      >
        <LinearGradient
          colors={['#00d9ff', '#0099cc']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* New Event Modal */}
      <Modal
        visible={showNewEventModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNewEventModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Agendamento</Text>
              <TouchableOpacity onPress={() => setShowNewEventModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Event Type Selection */}
              <Text style={styles.modalLabel}>Tipo de Evento</Text>
              <View style={styles.eventTypesGrid}>
                {EVENT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.eventTypeButton,
                      newEventType === type.id && { borderColor: type.color, backgroundColor: `${type.color}15` },
                    ]}
                    onPress={() => setNewEventType(type.id)}
                  >
                    <Ionicons 
                      name={type.icon as any} 
                      size={24} 
                      color={newEventType === type.id ? type.color : '#6b7280'} 
                    />
                    <Text style={[
                      styles.eventTypeLabel,
                      newEventType === type.id && { color: type.color },
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Title */}
              <Text style={styles.modalLabel}>Título</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: Visita ao T3 em Lisboa"
                placeholderTextColor="#6b7280"
                value={newEventTitle}
                onChangeText={setNewEventTitle}
              />

              {/* Description */}
              <Text style={styles.modalLabel}>Descrição (opcional)</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Adicione notas ou detalhes..."
                placeholderTextColor="#6b7280"
                value={newEventDescription}
                onChangeText={setNewEventDescription}
                multiline
                numberOfLines={3}
              />

              {/* Date */}
              <Text style={styles.modalLabel}>Data</Text>
              <TouchableOpacity style={styles.dateTimeButton}>
                <Ionicons name="calendar-outline" size={20} color="#00d9ff" />
                <Text style={styles.dateTimeText}>
                  {newEventDate.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
              </TouchableOpacity>

              {/* Time */}
              <Text style={styles.modalLabel}>Hora</Text>
              <View style={styles.timeOptions}>
                {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeChip,
                      newEventTime === time && styles.timeChipActive,
                    ]}
                    onPress={() => setNewEventTime(time)}
                  >
                    <Text style={[
                      styles.timeChipText,
                      newEventTime === time && styles.timeChipTextActive,
                    ]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowNewEventModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.createButton}
                onPress={() => {
                  // TODO: Save event to API
                  setShowNewEventModal(false);
                  setNewEventTitle('');
                  setNewEventDescription('');
                  setNewEventType('visita');
                }}
              >
                <LinearGradient
                  colors={['#00d9ff', '#0099cc']}
                  style={styles.createButtonGradient}
                >
                  <Text style={styles.createButtonText}>Criar Evento</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    fontSize: 32,
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
  tabsContainer: {
    marginTop: 8,
  },
  tabsContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#333',
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: '#1a1f2e',
    borderColor: '#00d9ff40',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 16,
  },
  monthNavInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'capitalize',
  },
  weekContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  weekDayLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    width: 40,
    textAlign: 'center',
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dayButton: {
    width: 40,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  dayButtonSelected: {
    backgroundColor: '#00d9ff',
    borderRadius: 12,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  dayTextSelected: {
    color: '#0a0e1a',
    fontWeight: '700',
  },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00d9ff',
    marginTop: 4,
  },
  featuredSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  featuredImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 12,
  },
  featuredInfo: {
    marginBottom: 12,
  },
  featuredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  featuredArea: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 8,
  },
  featuredPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00d9ff',
    marginLeft: 'auto',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00d9ff',
    backgroundColor: '#00d9ff10',
  },
  actionButtonPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00d9ff',
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: 'transparent',
  },
  actionButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  visitsSection: {
    paddingHorizontal: 20,
  },
  visitsSectionTitle: {
    fontSize: 18,
    fontWeight: '400',
    color: '#ffffff',
    marginBottom: 16,
  },
  visitsTitleCyan: {
    color: '#00d9ff',
    fontWeight: '600',
  },
  visitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffffff10',
  },
  visitImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  visitInfo: {
    flex: 1,
    marginLeft: 12,
  },
  visitLeadName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  visitPropertyTitle: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 2,
  },
  visitLocation: {
    fontSize: 12,
    color: '#6b7280',
  },
  visitTime: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  // FAB
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    borderRadius: 28,
    shadowColor: '#00d9ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0a0e1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#00d9ff40',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff10',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalScroll: {
    padding: 20,
    maxHeight: 450,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 10,
    marginTop: 16,
  },
  eventTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  eventTypeButton: {
    width: '30%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1a1f2e',
  },
  eventTypeLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 6,
  },
  modalInput: {
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  dateTimeText: {
    fontSize: 15,
    color: '#ffffff',
  },
  timeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1a1f2e',
    borderWidth: 1,
    borderColor: '#333',
  },
  timeChipActive: {
    backgroundColor: '#00d9ff20',
    borderColor: '#00d9ff',
  },
  timeChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  timeChipTextActive: {
    color: '#00d9ff',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#ffffff10',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6b7280',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  createButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  createButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
