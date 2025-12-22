import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../services/api';
import LocationPicker from '../components/LocationPicker';

// Tipos de eventos
const EVENT_TYPES = [
  { value: 'other', label: 'Outro', icon: 'calendar-outline', color: '#6b7280' },
  { value: 'visit', label: 'Visita a Imóvel', icon: 'home-outline', color: '#3b82f6' },
  { value: 'meeting', label: 'Reunião', icon: 'people-outline', color: '#8b5cf6' },
  { value: 'task', label: 'Tarefa', icon: 'checkbox-outline', color: '#10b981' },
  { value: 'call', label: 'Chamada', icon: 'call-outline', color: '#f59e0b' },
  { value: 'personal', label: 'Pessoal', icon: 'happy-outline', color: '#ec4899' },
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

export default function AgendaScreen() {
  // Calendar state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('other');
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState(60);
  
  // Location state
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationData, setLocationData] = useState<{
    address: string;
    latitude: number | null;
    longitude: number | null;
  }>({
    address: '',
    latitude: null,
    longitude: null,
  });
  
  // Date/Time pickers
  const [selectedDateTime, setSelectedDateTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Properties & Leads
  const [properties, setProperties] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  
  // Load data
  useEffect(() => {
    loadEvents();
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
      
      setEvents(data || []);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProperties = async () => {
    try {
      const data = await apiService.get('/mobile/properties');
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
    
    // Garantir que data é futura (ou próxima)
    const now = new Date();
    if (selectedDateTime < now && (now.getTime() - selectedDateTime.getTime()) > 5 * 60 * 1000) {
      Alert.alert(
        'Data no Passado',
        'A data selecionada já passou. Deseja continuar mesmo assim?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', onPress: () => submitEvent() },
        ]
      );
      return;
    }
    
    await submitEvent();
  };

  const submitEvent = async () => {
    try {
      const payload: any = {
        title: title.trim(),
        event_type: eventType,
        scheduled_date: selectedDateTime.toISOString(),
        duration_minutes: duration,
        location: locationData.address.trim() || null,
        notes: notes.trim() || null,
      };
      
      // Adicionar coordenadas se existirem
      if (locationData.latitude && locationData.longitude) {
        payload.latitude = locationData.latitude;
        payload.longitude = locationData.longitude;
      }
      
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
    setLocationData({ address: '', latitude: null, longitude: null });
    setNotes('');
    setDuration(60);
    setSelectedDateTime(new Date());
    setSelectedPropertyId(null);
    setSelectedLeadId(null);
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      const newDateTime = new Date(selectedDateTime);
      newDateTime.setFullYear(date.getFullYear());
      newDateTime.setMonth(date.getMonth());
      newDateTime.setDate(date.getDate());
      setSelectedDateTime(newDateTime);
    }
  };

  const handleTimeChange = (event: any, time?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (time) {
      const newDateTime = new Date(selectedDateTime);
      newDateTime.setHours(time.getHours());
      newDateTime.setMinutes(time.getMinutes());
      setSelectedDateTime(newDateTime);
    }
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📅 Agenda</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
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
                  onPress={() => {/* TODO: Abrir detalhes */}}
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
                      color="#fff"
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Data */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Data</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#00d9ff" />
                <Text style={styles.dateTimeText}>
                  {selectedDateTime.toLocaleDateString('pt-PT', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Hora */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Hora</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time-outline" size={20} color="#00d9ff" />
                <Text style={styles.dateTimeText}>
                  {selectedDateTime.toLocaleTimeString('pt-PT', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Duração */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Duração</Text>
              <View style={styles.pickerContainer}>
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
                      color="#fff"
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Localização */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Localização</Text>
              
              <View style={styles.locationInputContainer}>
                <TextInput
                  style={[styles.input, styles.locationInput]}
                  placeholder="Ex: Escritório, Café Central, Online"
                  placeholderTextColor="#6b7280"
                  value={locationData.address}
                  onChangeText={(text) => setLocationData({ ...locationData, address: text })}
                />
                
                <TouchableOpacity
                  style={styles.mapIconButton}
                  onPress={() => setShowLocationPicker(true)}
                >
                  <Ionicons name="map" size={20} color="#00d9ff" />
                </TouchableOpacity>
              </View>
              
              {locationData.latitude && locationData.longitude && (
                <Text style={styles.coordsText}>
                  📍 {locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)}
                </Text>
              )}
            </View>

            {/* Imóvel (só se event_type = visit) */}
            {eventType === 'visit' && (
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Imóvel *</Text>
                <View style={styles.pickerContainer}>
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
                        label={`${prop.property_type} - ${prop.location}`} 
                        value={prop.id}
                        color="#fff"
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            )}

            {/* Lead (sempre opcional) */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Lead (opcional)</Text>
              <View style={styles.pickerContainer}>
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
                      color="#fff"
                    />
                  ))}
                </Picker>
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
              <LinearGradient 
                colors={['#00d9ff', '#0099cc']} 
                style={styles.createGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.createButtonText}>Criar Evento</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDateTime}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={new Date()}
            textColor="#fff"
          />
        )}

        {/* Time Picker */}
        {showTimePicker && (
          <DateTimePicker
            value={selectedDateTime}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
            is24Hour={true}
            textColor="#fff"
          />
        )}
      </Modal>

      {/* Location Picker Modal */}
      <LocationPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelectLocation={(location) => {
          setLocationData({
            address: location.address,
            latitude: location.latitude,
            longitude: location.longitude,
          });
          setShowLocationPicker(false);
        }}
        initialLocation={locationData.latitude && locationData.longitude ? locationData : undefined}
      />
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
    fontSize: 15,
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
    fontSize: 15,
    color: '#fff',
    marginLeft: 12,
    flex: 1,
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
    padding: 16,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  locationInputContainer: {
    position: 'relative',
  },
  locationInput: {
    paddingRight: 50, // Espaço para o ícone
  },
  mapIconButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coordsText: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
