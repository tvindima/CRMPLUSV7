import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface EscrituraItem {
  id: number;
  property_id: number | null;
  client_id: number | null;
  data_escritura: string;
  hora_escritura?: string | null;
  local_escritura?: string | null;
  status: string;
  fatura_emitida?: boolean;
  fatura_pedida?: boolean;
  numero_fatura?: string | null;
  property_reference?: string | null;
  property_title?: string | null;
}

const formatDateTime = (iso: string, hora?: string | null) => {
  try {
    const date = new Date(iso);
    if (hora) {
      const [h, m] = hora.split(':');
      date.setHours(parseInt(h || '0', 10), parseInt(m || '0', 10));
    }
    return `${date.toLocaleDateString('pt-PT')} ${date.toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  } catch {
    return iso;
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case 'agendada':
      return 'Agendada';
    case 'confirmada':
      return 'Confirmada';
    case 'realizada':
      return 'Realizada';
    case 'cancelada':
      return 'Cancelada';
    case 'adiada':
      return 'Adiada';
    default:
      return status || '—';
  }
};

const EscriturasListScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [items, setItems] = useState<EscrituraItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadEscrituras = useCallback(async () => {
    if (!user?.agent_id) return;
    setLoading(true);
    try {
      const response: any = await apiService.get(`/escrituras?agent_id=${user.agent_id}&limit=100&status=`);
      const payload = response?.items || response?.data?.items || response || [];
      const sorted = [...payload].sort((a: EscrituraItem, b: EscrituraItem) => {
        return new Date(a.data_escritura).getTime() - new Date(b.data_escritura).getTime();
      });
      setItems(sorted);
    } catch (error: any) {
      console.error('Erro ao carregar escrituras', error);
      const detail = error?.detail || error?.response?.data?.detail || 'Não foi possível carregar as escrituras';
      Alert.alert('Erro', detail);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.agent_id]);

  useFocusEffect(
    useCallback(() => {
      loadEscrituras();
    }, [loadEscrituras])
  );

  const renderItem = ({ item }: { item: EscrituraItem }) => {
    const invoiceState = item.fatura_emitida
      ? 'Emitida'
      : item.fatura_pedida
      ? 'Pedido enviado'
      : 'Pendente';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() =>
          navigation.navigate('EscrituraForm', {
            escrituraId: item.id,
            propertyId: item.property_id,
            clientId: item.client_id,
          })
        }
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Escritura #{item.id}</Text>
          <View style={[styles.statusBadge, styles[`status_${item.status}`] || styles.status_default]}>
            <Text style={styles.statusText}>{statusLabel(item.status)}</Text>
          </View>
        </View>
        <Text style={styles.dateText}>{formatDateTime(item.data_escritura, item.hora_escritura)}</Text>
        {item.property_reference && (
          <Text style={styles.metaText}>Imóvel: {item.property_reference}</Text>
        )}
        {item.local_escritura && <Text style={styles.metaText}>Local: {item.local_escritura}</Text>}
        <View style={styles.invoiceRow}>
          <Ionicons
            name={item.fatura_emitida ? 'checkmark-done' : item.fatura_pedida ? 'mail-open' : 'mail-unread'}
            size={16}
            color={item.fatura_emitida ? '#059669' : item.fatura_pedida ? '#d97706' : '#b45309'}
          />
          <Text style={styles.invoiceText}>{invoiceState}</Text>
          {item.numero_fatura && <Text style={styles.invoiceMeta}>#{item.numero_fatura}</Text>}
        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              navigation.navigate('EscrituraForm', {
                escrituraId: item.id,
                propertyId: item.property_id,
                clientId: item.client_id,
              })
            }
          >
            <Ionicons name="open-outline" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Detalhe / Fatura</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Minhas Escrituras</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.loader}> 
          <ActivityIndicator size="large" color="#1a56db" />
          <Text style={styles.loaderText}>A carregar escrituras...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.listContainer}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadEscrituras(); }} />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={40} color="#9ca3af" />
              <Text style={styles.emptyText}>Ainda não tem escrituras.</Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.navigate('EscrituraForm')}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.primaryButtonText}>Marcar Escritura</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e2e8f0',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    marginTop: 12,
    color: '#475569',
    fontSize: 15,
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    flexGrow: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    textTransform: 'capitalize',
  },
  status_agendada: { backgroundColor: '#e0f2fe' },
  status_confirmada: { backgroundColor: '#dcfce7' },
  status_realizada: { backgroundColor: '#ecfeff' },
  status_cancelada: { backgroundColor: '#fee2e2' },
  status_adiada: { backgroundColor: '#fef9c3' },
  status_default: { backgroundColor: '#e2e8f0' },
  dateText: {
    marginTop: 8,
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
  metaText: {
    marginTop: 4,
    fontSize: 13,
    color: '#475569',
  },
  invoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  invoiceText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  invoiceMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1a56db',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 80,
  },
  emptyText: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default EscriturasListScreen;
