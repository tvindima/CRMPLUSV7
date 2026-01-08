import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { apiService } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Tipos de eventos
const EVENT_TYPES = [
  { value: 'other', label: 'Outro', icon: 'calendar-outline', color: '#6b7280' },
  { value: 'visit', label: 'Visita a Imóvel', icon: 'home-outline', color: '#3b82f6' },
  { value: 'meeting', label: 'Reunião', icon: 'people-outline', color: '#8b5cf6' },
  { value: 'task', label: 'Tarefa', icon: 'checkbox-outline', color: '#10b981' },
  { value: 'call', label: 'Chamada', icon: 'call-outline', color: '#f59e0b' },
  { value: 'personal', label: 'Pessoal', icon: 'happy-outline', color: '#ec4899' },
  { value: 'birthday', label: 'Aniversário', icon: 'gift-outline', color: '#ff69b4' },
];

// Durações
const DURATIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1h30' },
  { value: 120, label: '2 horas' },
  { value: 180, label: '3 horas' },
];

// Todos os horários (0-23h)
const ALL_TIMES = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

export default function AgendaScreen() {
  // Calendar state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('other');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState(60);
  
  // Date/Time state
  const [selectedDateTime, setSelectedDateTime] = useState(new Date());
  const [showDateModal, setShowDateModal] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  
  // Properties & Leads
  const [properties, setProperties] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);

  // Load data
  useEffect(() => {
    loadEvents();
    loadBirthdays();
    loadProperties();
    loadLeads();
  }, [selectedDate]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const start = new Date(selectedDate);
      start.setDate(1);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      
      const data = await apiService.get('/mobile/events', {
        params: {
          start_date: start.toISOString(),
          end_date: end.toISOString(),
        },
      });
      
      setEvents((prev) => {
        // Manter aniversários (ids começam com 'birthday_')
        const birthdays = prev.filter((e: any) => String(e.id).startsWith('birthday_'));
        return [...(data || []), ...birthdays];
      });
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar aniversários do mês e adicioná-los como eventos virtuais
  const loadBirthdays = async () => {
    try {
      // Carregar aniversários dos próximos 60 dias para cobrir 2 meses
      const response: any = await apiService.get('/clients/birthdays', {
        params: { days_ahead: 60 }
      });
      
      if (response?.items) {
        // Converter aniversários em eventos virtuais (não editáveis)
        const birthdayEvents = response.items.map((client: any) => ({
          id: `birthday_${client.id}`,
          title: `🎂 ${client.nome} faz ${client.age} anos`,
          event_type: 'birthday',
          scheduled_date: client.birthday_date + 'T09:00:00',
          duration_minutes: 0,
          location: null,
          notes: `Tel: ${client.telefone || '-'} | Email: ${client.email || '-'}`,
          is_birthday: true, // Flag para identificar eventos de aniversário
          client_id: client.id,
          client_phone: client.telefone,
          client_email: client.email,
        }));
        
        setEvents((prev) => {
          // Remover aniversários antigos e adicionar novos
          const nonBirthdays = prev.filter((e: any) => !String(e.id).startsWith('birthday_'));
          return [...nonBirthdays, ...birthdayEvents];
        });
      }
    } catch (error) {
      console.log('Não foi possível carregar aniversários:', error);
    }
  };

  const loadProperties = async () => {
    try {
      const data = await apiService.get('/properties');
      setProperties(data || []);
    } catch (error) {
      console.error('Erro ao carregar imóveis:', error);
    }
  };

  const loadLeads = async () => {
    try {
      const data = await apiService.get('/mobile/leads');
      setLeads(data || []);
    } catch (error) {
      console.error('Erro ao carregar leads:', error);
    }
  };

  const handleCreateEvent = async () => {
    // Validações
    if (!title.trim()) {
      Alert.alert('Campo Obrigatório', 'Por favor, preencha o título do evento');
      return;
    }
    
    if (eventType === 'visit' && !selectedPropertyId) {
      Alert.alert('Campo Obrigatório', 'Visitas requerem seleção de imóvel');
      return;
    }
    
    await submitEvent();
  };

  const submitEvent = async () => {
    try {
      // ✅ Garantir data futura
      const now = new Date();
      let eventDate = new Date(selectedDateTime);
      
      if (eventDate <= now) {
        eventDate = new Date(now.getTime() + 60 * 60 * 1000); // +1h
        console.log('⚠️ Data ajustada para:', eventDate.toISOString());
      }
      
      const payload: any = {
        title: title.trim(),
        event_type: eventType,
        scheduled_date: eventDate.toISOString(),
        duration_minutes: duration,
        location: location.trim() || null,
        notes: notes.trim() || null,
      };
      
      // Adicionar property_id só se for visita
      if (eventType === 'visit' && selectedPropertyId) {
        payload.property_id = selectedPropertyId;
      }
      
      // Adicionar lead_id se selecionado
      if (selectedLeadId) {
        payload.lead_id = selectedLeadId;
      }
      
      console.log('📤 Criando evento:', payload);
      
      await apiService.post('/mobile/events', payload);
      
      Alert.alert('✅ Sucesso', 'Evento criado com sucesso!');
      setShowModal(false);
      resetForm();
      loadEvents();
    } catch (error: any) {
      console.error('❌ Erro ao criar evento:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'Erro desconhecido';
      Alert.alert('Erro', errorMsg);
    }
  };

  const resetForm = () => {
    setTitle('');
    setEventType('other');
    setLocation('');
    setNotes('');
    setDuration(60);
    setSelectedDateTime(new Date());
    setSelectedPropertyId(null);
    setSelectedLeadId(null);
  };

  const getEventTypeConfig = (type: string) => {
    return EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[0];
  };

  const eventsForSelectedDate = events.filter(event => {
    const eventDate = new Date(event.scheduled_date).toISOString().split('T')[0];
    return eventDate === selectedDate;
  });

  const markedDates = events.reduce((acc: any, event) => {
    const date = new Date(event.scheduled_date).toISOString().split('T')[0];
    const config = getEventTypeConfig(event.event_type);
    acc[date] = { 
      marked: true, 
      dotColor: config.color,
    };
    return acc;
  }, {});

  markedDates[selectedDate] = {
    ...markedDates[selectedDate],
    selected: true,
    selectedColor: '#00d9ff',
  };

  // Gerar dias do mês para date picker
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    
    return days;
  };

  // Mudar mês no date picker
  const changeMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(tempDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setTempDate(newDate);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📅 Agenda</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.addButton, styles.escrituraButton]}
            onPress={() => navigation.navigate('EscrituraForm')}
          >
            <Ionicons name="document-text-outline" size={20} color="#fff" />
            <Text style={styles.escrituraButtonText}>Escritura</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowModal(true)}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Calendar */}
      <Calendar
        current={selectedDate}
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        theme={{
          backgroundColor: '#0a0e1a',
          calendarBackground: '#1a1f2e',
          textSectionTitleColor: '#9ca3af',
          selectedDayBackgroundColor: '#00d9ff',
          selectedDayTextColor: '#fff',
          todayTextColor: '#00d9ff',
          dayTextColor: '#fff',
          textDisabledColor: '#4b5563',
          monthTextColor: '#fff',
          arrowColor: '#00d9ff',
        }}
      />

      {/* Eventos do dia */}
      <ScrollView style={styles.eventsList}>
        <Text style={styles.dateTitle}>
          {new Date(selectedDate).toLocaleDateString('pt-PT', { 
            day: 'numeric', 
            month: 'long',
            year: 'numeric'
          })}
        </Text>
        
        {loading ? (
          <ActivityIndicator size="large" color="#00d9ff" style={{ marginTop: 20 }} />
        ) : eventsForSelectedDate.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#6b7280" />
            <Text style={styles.emptyText}>Sem eventos neste dia</Text>
            <Text style={styles.emptySubtext}>Toque no + para criar um evento</Text>
          </View>
        ) : (
          eventsForSelectedDate
            .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
            .map((event) => {
              const config = getEventTypeConfig(event.event_type);
              const time = new Date(event.scheduled_date).toLocaleTimeString('pt-PT', { 
                hour: '2-digit', 
                minute: '2-digit' 
              });
              
              return (
                <TouchableOpacity
                  key={event.id}
                  style={[styles.eventCard, { borderLeftColor: config.color }]}
                >
                  <View style={styles.eventTime}>
                    <Text style={styles.timeText}>{time}</Text>
                    <View style={[styles.typeBadge, { backgroundColor: config.color + '20' }]}>
                      <Ionicons name={config.icon as any} size={16} color={config.color} />
                    </View>
                  </View>
                  
                  <View style={styles.eventContent}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventType}>{config.label}</Text>
                    {event.location && (
                      <Text style={styles.eventLocation}>📍 {event.location}</Text>
                    )}
                    {event.notes && (
                      <Text style={styles.eventNotes} numberOfLines={2}>{event.notes}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
        )}
      </ScrollView>

      {/* Modal Criar Evento */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={28} color="#ef4444" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Novo Evento</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Título */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Título *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Reunião com cliente, Almoço de equipa"
                placeholderTextColor="#6b7280"
                value={title}
                onChangeText={setTitle}
                autoFocus
              />
            </View>

            {/* Tipo de Evento */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Tipo de Evento</Text>
              <View style={styles.pickerContainer}>
                {Platform.OS === 'web' ? (
                  <select
                    value={eventType}
                    onChange={(e: any) => setEventType(e.target.value)}
                    style={{
                      width: '100%',
                      height: 50,
                      backgroundColor: '#1a1f2e',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 12,
                      paddingLeft: 14,
                      paddingRight: 40,
                      fontSize: 16,
                      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
                      fontWeight: '500',
                      outline: 'none',
                      cursor: 'pointer',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2300d9ff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      backgroundSize: '20px',
                    }}
                  >
                    {EVENT_TYPES.map((type) => (
                      <option 
                        key={type.value} 
                        value={type.value} 
                        style={{ 
                          backgroundColor: '#1a1f2e', 
                          color: '#fff',
                          fontSize: 16,
                          padding: '12px',
                        }}
                      >
                        {type.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Picker
                    selectedValue={eventType}
                    onValueChange={(value) => setEventType(value)}
                    style={styles.picker}
                    dropdownIconColor="#00d9ff"
                  >
                    {EVENT_TYPES.map((type) => (
                      <Picker.Item 
                        key={type.value} 
                        label={type.label} 
                        value={type.value}
                        color={Platform.OS === 'ios' ? '#fff' : '#000'}
                      />
                    ))}
                  </Picker>
                )}
              </View>
            </View>

            {/* Data - EDITÁVEL */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Data</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => {
                  setTempDate(selectedDateTime);
                  setShowDateModal(true);
                }}
              >
                <Ionicons name="calendar-outline" size={20} color="#00d9ff" />
                <Text style={styles.dateTimeText}>
                  {selectedDateTime.toLocaleDateString('pt-PT', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Hora - TODOS OS HORÁRIOS */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Hora</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.timeButtonsRow}>
                  {ALL_TIMES.map((time) => {
                    const currentTime = selectedDateTime.toTimeString().slice(0, 5);
                    const isSelected = currentTime === time;
                    
                    return (
                      <TouchableOpacity
                        key={time}
                        style={[styles.timeButton, isSelected && styles.timeButtonActive]}
                        onPress={() => {
                          const [hours, minutes] = time.split(':');
                          const newDateTime = new Date(selectedDateTime);
                          newDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                          setSelectedDateTime(newDateTime);
                        }}
                      >
                        <Text style={[styles.timeButtonText, isSelected && styles.timeButtonTextActive]}>
                          {time}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            {/* Duração */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Duração</Text>
              <View style={styles.pickerContainer}>
                {Platform.OS === 'web' ? (
                  <select
                    value={duration}
                    onChange={(e: any) => setDuration(parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      height: 50,
                      backgroundColor: '#1a1f2e',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 12,
                      paddingLeft: 14,
                      paddingRight: 40,
                      fontSize: 16,
                      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
                      fontWeight: '500',
                      outline: 'none',
                      cursor: 'pointer',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2300d9ff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      backgroundSize: '20px',
                    }}
                  >
                    {DURATIONS.map((d) => (
                      <option 
                        key={d.value} 
                        value={d.value} 
                        style={{ 
                          backgroundColor: '#1a1f2e', 
                          color: '#fff',
                          fontSize: 16,
                          padding: '12px',
                        }}
                      >
                        {d.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Picker
                    selectedValue={duration}
                    onValueChange={(value) => setDuration(value)}
                    style={styles.picker}
                    dropdownIconColor="#00d9ff"
                  >
                    {DURATIONS.map((d) => (
                      <Picker.Item 
                        key={d.value} 
                        label={d.label} 
                        value={d.value}
                        color={Platform.OS === 'ios' ? '#fff' : '#000'}
                      />
                    ))}
                  </Picker>
                )}
              </View>
            </View>

            {/* Localização */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Localização</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Escritório, Café Central, Online"
                placeholderTextColor="#6b7280"
                value={location}
                onChangeText={setLocation}
              />
            </View>

            {/* Imóvel (só se event_type = visit) */}
            {eventType === 'visit' && (
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Imóvel *</Text>
                <View style={styles.pickerContainer}>
                  {Platform.OS === 'web' ? (
                    <select
                      value={selectedPropertyId || ''}
                      onChange={(e: any) => setSelectedPropertyId(e.target.value ? parseInt(e.target.value) : null)}
                      style={{
                        width: '100%',
                        height: 50,
                        backgroundColor: '#1a1f2e',
                        color: selectedPropertyId ? '#fff' : '#6b7280',
                        border: 'none',
                        borderRadius: 12,
                        paddingLeft: 14,
                        paddingRight: 40,
                        fontSize: 16,
                        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
                        fontWeight: '500',
                        outline: 'none',
                        cursor: 'pointer',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        appearance: 'none',
                        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2300d9ff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        backgroundSize: '20px',
                      }}
                    >
                      <option value="" style={{ backgroundColor: '#1a1f2e', color: '#6b7280', fontSize: 16 }}>Selecionar Imóvel...</option>
                      {properties.map((prop) => (
                        <option 
                          key={prop.id} 
                          value={prop.id} 
                          style={{ 
                            backgroundColor: '#1a1f2e',
                            color: '#fff',
                            fontSize: 16,
                            padding: '12px',
                          }}
                        >
                          {`${prop.property_type} - ${prop.address}`}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Picker
                      selectedValue={selectedPropertyId}
                      onValueChange={(value) => setSelectedPropertyId(value)}
                      style={styles.picker}
                      dropdownIconColor="#00d9ff"
                    >
                      <Picker.Item label="Selecionar Imóvel..." value={null} color="#6b7280" />
                      {properties.map((prop) => (
                        <Picker.Item 
                          key={prop.id} 
                          label={`${prop.property_type} - ${prop.address}`} 
                          value={prop.id}
                          color={Platform.OS === 'ios' ? '#fff' : '#000'}
                        />
                      ))}
                    </Picker>
                  )}
                </View>
              </View>
            )}

            {/* Lead (sempre opcional) */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Lead (opcional)</Text>
              <View style={styles.pickerContainer}>
                {Platform.OS === 'web' ? (
                  <select
                    value={selectedLeadId || ''}
                    onChange={(e: any) => setSelectedLeadId(e.target.value ? parseInt(e.target.value) : null)}
                    style={{
                      width: '100%',
                      height: 50,
                      backgroundColor: '#1a1f2e',
                      color: selectedLeadId ? '#fff' : '#6b7280',
                      border: 'none',
                      borderRadius: 12,
                      paddingLeft: 14,
                      paddingRight: 40,
                      fontSize: 16,
                      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
                      fontWeight: '500',
                      outline: 'none',
                      cursor: 'pointer',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2300d9ff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      backgroundSize: '20px',
                    }}
                  >
                    <option value="" style={{ backgroundColor: '#1a1f2e', color: '#6b7280', fontSize: 16 }}>Nenhum</option>
                    {leads.map((lead) => (
                      <option 
                        key={lead.id} 
                        value={lead.id} 
                        style={{ 
                          backgroundColor: '#1a1f2e',
                          color: '#fff',
                          fontSize: 16,
                          padding: '12px',
                        }}
                      >
                        {`${lead.name} - ${lead.phone}`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Picker
                    selectedValue={selectedLeadId}
                    onValueChange={(value) => setSelectedLeadId(value)}
                    style={styles.picker}
                    dropdownIconColor="#00d9ff"
                  >
                    <Picker.Item label="Nenhum" value={null} color="#6b7280" />
                    {leads.map((lead) => (
                      <Picker.Item 
                        key={lead.id} 
                        label={`${lead.name} - ${lead.phone}`} 
                        value={lead.id}
                        color={Platform.OS === 'ios' ? '#fff' : '#000'}
                      />
                    ))}
                  </Picker>
                )}
              </View>
            </View>

            {/* Notas */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Notas</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Observações adicionais..."
                placeholderTextColor="#6b7280"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            {/* Botão Criar */}
            <TouchableOpacity 
              style={styles.createButton} 
              onPress={handleCreateEvent}
              activeOpacity={0.8}
            >
              <View style={styles.createGradient}>
                <Text style={styles.createButtonText}>Criar Evento</Text>
              </View>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* Modal de Seleção de Data */}
      <Modal
        visible={showDateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={styles.dateModalOverlay}>
          <View style={styles.dateModalContent}>
            {/* Header */}
            <View style={styles.dateModalHeader}>
              <TouchableOpacity onPress={() => setShowDateModal(false)}>
                <Text style={styles.dateModalCancel}>Cancelar</Text>
              </TouchableOpacity>
              
              <View style={styles.dateModalTitleContainer}>
                <TouchableOpacity onPress={() => changeMonth('prev')}>
                  <Ionicons name="chevron-back" size={24} color="#00d9ff" />
                </TouchableOpacity>
                
                <Text style={styles.dateModalTitle}>
                  {tempDate.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
                </Text>
                
                <TouchableOpacity onPress={() => changeMonth('next')}>
                  <Ionicons name="chevron-forward" size={24} color="#00d9ff" />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity onPress={() => {
                const newDateTime = new Date(selectedDateTime);
                newDateTime.setFullYear(tempDate.getFullYear());
                newDateTime.setMonth(tempDate.getMonth());
                newDateTime.setDate(tempDate.getDate());
                setSelectedDateTime(newDateTime);
                setShowDateModal(false);
              }}>
                <Text style={styles.dateModalConfirm}>OK</Text>
              </TouchableOpacity>
            </View>
            
            {/* Dias do Mês */}
            <ScrollView style={styles.dateModalDays}>
              {getDaysInMonth(tempDate).map((day) => {
                const isSelected = day.toDateString() === tempDate.toDateString();
                const isToday = day.toDateString() === new Date().toDateString();
                const isPast = day < new Date() && !isToday;
                
                return (
                  <TouchableOpacity
                    key={day.toISOString()}
                    style={[
                      styles.dayButton,
                      isSelected && styles.dayButtonSelected,
                      isToday && styles.dayButtonToday,
                      isPast && styles.dayButtonPast,
                    ]}
                    onPress={() => setTempDate(day)}
                    disabled={isPast}
                  >
                    <Text style={[
                      styles.dayButtonText,
                      isSelected && styles.dayButtonTextSelected,
                      isPast && styles.dayButtonTextPast,
                    ]}>
                      {day.getDate()}
                    </Text>
                    <Text style={[
                      styles.dayButtonWeekday,
                      isSelected && styles.dayButtonWeekdaySelected,
                    ]}>
                      {day.toLocaleDateString('pt-PT', { weekday: 'short' })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
    fontWeight: '700',
    color: '#fff',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00d9ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00d9ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  escrituraButton: {
    width: 'auto',
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#059669',
    flexDirection: 'row',
    gap: 6,
  },
  escrituraButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  eventsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginVertical: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventTime: {
    marginRight: 16,
    alignItems: 'center',
    minWidth: 60,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  typeBadge: {
    padding: 8,
    borderRadius: 8,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  eventType: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  eventNotes: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0a0e1a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1f2e',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  fieldContainer: {
    marginTop: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2d3748',
    overflow: 'hidden',
  },
  picker: {
    color: '#fff',
    height: 50,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
    flex: 1,
  },
  timeButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  timeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2d3748',
    backgroundColor: '#1a1f2e',
    minWidth: 70,
    alignItems: 'center',
  },
  timeButtonActive: {
    borderColor: '#00d9ff',
    backgroundColor: '#00d9ff20',
  },
  timeButtonText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  timeButtonTextActive: {
    color: '#00d9ff',
    fontWeight: '600',
  },
  createButton: {
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#00d9ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  createGradient: {
    backgroundColor: '#00d9ff',
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  
  // Date Modal Styles
  dateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  dateModalContent: {
    backgroundColor: '#1a1f2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  dateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2d3748',
  },
  dateModalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dateModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    minWidth: 150,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  dateModalCancel: {
    fontSize: 16,
    color: '#ef4444',
  },
  dateModalConfirm: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
  },
  dateModalDays: {
    padding: 16,
  },
  dayButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#0a0e1a',
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  dayButtonSelected: {
    borderColor: '#00d9ff',
    backgroundColor: '#00d9ff20',
  },
  dayButtonToday: {
    borderColor: '#f59e0b',
  },
  dayButtonPast: {
    opacity: 0.4,
  },
  dayButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  dayButtonTextSelected: {
    color: '#00d9ff',
  },
  dayButtonTextPast: {
    color: '#6b7280',
  },
  dayButtonWeekday: {
    fontSize: 14,
    color: '#9ca3af',
    textTransform: 'capitalize',
  },
  dayButtonWeekdaySelected: {
    color: '#00d9ff',
  },
});
