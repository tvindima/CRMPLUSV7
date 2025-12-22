import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';

interface Visit {
  id: number;
  scheduled_at: string;
  lead_name: string;
  property_title: string;
  property_location: string;
  status: string;
}

export default function AgendaScreen() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVisits();
  }, [selectedDate]);

  const loadVisits = async () => {
    setLoading(true);
    try {
      // TODO: Integrar com /visits/upcoming ou /calendar/day/{date}
      setTimeout(() => {
        setVisits([]);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Erro ao carregar visitas:', error);
      setLoading(false);
    }
  };

  const markedDates = {
    [selectedDate]: {
      selected: true,
      selectedColor: '#00d9ff',
    },
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agenda</Text>
        <Text style={styles.headerSubtitle}>Gerir visitas e compromissos</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <Calendar
            current={selectedDate}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            theme={{
              calendarBackground: '#1a1f2e',
              textSectionTitleColor: '#9ca3af',
              selectedDayBackgroundColor: '#00d9ff',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#00d9ff',
              dayTextColor: '#ffffff',
              textDisabledColor: '#6b7280',
              monthTextColor: '#ffffff',
              arrowColor: '#00d9ff',
            }}
            style={styles.calendar}
          />
        </View>

        {/* Visits List */}
        <View style={styles.visitsSection}>
          <Text style={styles.sectionTitle}>
            Visitas para {new Date(selectedDate).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long' })}
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color="#00d9ff" style={styles.loader} />
          ) : visits.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color="#6b7280" />
              <Text style={styles.emptyStateText}>Sem visitas agendadas</Text>
              <Text style={styles.emptyStateSubtext}>
                Agende uma nova visita para começar
              </Text>
            </View>
          ) : (
            visits.map((visit) => (
              <TouchableOpacity key={visit.id} style={styles.visitCard}>
                <View style={styles.visitHeader}>
                  <Text style={styles.visitTime}>
                    {new Date(visit.scheduled_at).toLocaleTimeString('pt-PT', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      visit.status === 'confirmed' && styles.statusConfirmed,
                    ]}
                  >
                    <Text style={styles.statusText}>{visit.status}</Text>
                  </View>
                </View>

                <Text style={styles.visitClient}>{visit.lead_name}</Text>
                <Text style={styles.visitProperty}>{visit.property_title}</Text>
                <Text style={styles.visitLocation}>{visit.property_location}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  calendarContainer: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#00d9ff40',
    shadowColor: '#00d9ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  calendar: {
    borderRadius: 16,
  },
  visitsSection: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  visitCard: {
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#00d9ff40',
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  visitTime: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00d9ff',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#374151',
  },
  statusConfirmed: {
    backgroundColor: '#10b98120',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
  },
  visitClient: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  visitProperty: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 4,
  },
  visitLocation: {
    fontSize: 13,
    color: '#9ca3af',
  },
});
