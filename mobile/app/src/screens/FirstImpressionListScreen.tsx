import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { firstImpressionService, FirstImpressionListItem } from '../services/firstImpressionService';
import { preAngariacaoService } from '../services/preAngariacaoService';

const STATUS_COLORS = {
  draft: '#6b7280',
  signed: '#3b82f6',
  completed: '#10b981',
  cancelled: '#ef4444',
  cancelado: '#ef4444',
};

const STATUS_LABELS = {
  draft: 'Rascunho',
  signed: 'Assinado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  cancelado: 'Cancelado',
};

export default function FirstImpressionListScreen() {
  const navigation = useNavigation();
  
  const [impressions, setImpressions] = useState<FirstImpressionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'draft' | 'signed' | 'completed'>('all');

  // Carregar lista
  const loadImpressions = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      const filters = filter !== 'all' ? { status: filter } : undefined;
      const data = await firstImpressionService.list(filters);
      const visible = data.filter((item) => item.status !== 'cancelled' && item.status !== 'cancelado');
      setImpressions(visible);
    } catch (error: any) {
      console.error('Erro ao carregar First Impressions:', error);
      Alert.alert('Erro', 'Não foi possível carregar as pré-angariações');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Recarregar ao focar tela
  useFocusEffect(
    useCallback(() => {
      loadImpressions();
    }, [filter])
  );

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadImpressions(false);
  };

  // Apagar documento (agente): marcar como cancelado e cancelar pré-angariação, mas sem remover do admin
  const handleDelete = (id: number, clientName: string) => {
    Alert.alert(
      'Apagar pré-angariação',
      `Esta ação é irreversível. Confirmar apagar a pré-angariação de ${clientName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Cancelar pré-angariação ligada (sem apagar para admin)
              try {
                const pre = await preAngariacaoService.getByFirstImpression(id);
                if (pre?.id) {
                  await preAngariacaoService.update(pre.id, { status: 'cancelado' } as any);
                }
              } catch (e) {
                // se não existir, seguir
              }
              // Marcar 1ª impressão como cancelada em vez de apagar
              await firstImpressionService.update(id, { status: 'cancelled' } as any);
              setImpressions((prev) => prev.filter((it) => it.id !== id));
              Alert.alert('Sucesso', 'Pré-angariação removida da sua lista.');
            } catch (error) {
              console.error('Erro ao apagar:', error);
              Alert.alert('Erro', 'Não foi possível apagar. Tente novamente.');
            }
          },
        },
      ]
    );
  };

  // Renderizar card
  const renderItem = ({ item }: { item: FirstImpressionListItem }) => {
    const statusColor = STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] || '#6b7280';
    const statusLabel = STATUS_LABELS[item.status as keyof typeof STATUS_LABELS] || item.status;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('FirstImpressionForm' as never, { impressionId: item.id } as never)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitle}>
            <Ionicons name="folder" size={20} color="#00d9ff" />
            <Text style={styles.clientName}>{item.client_name}</Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>

          {item.status === 'signed' && (
            <View style={styles.signedBadge}>
              <Ionicons name="create" size={14} color="#8b5cf6" />
              <Text style={styles.signedText}>Assinado</Text>
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={16} color="#9ca3af" />
            <Text style={styles.infoText}>{item.client_phone}</Text>
          </View>

          {item.client_nif && (
            <View style={styles.infoRow}>
              <Ionicons name="card-outline" size={16} color="#9ca3af" />
              <Text style={styles.infoText}>NIF: {item.client_nif}</Text>
            </View>
          )}

          {item.tipologia && (
            <View style={styles.infoRow}>
              <Ionicons name="home-outline" size={16} color="#9ca3af" />
              <Text style={styles.infoText}>{item.tipologia}</Text>
            </View>
          )}

          {item.artigo_matricial && (
            <View style={styles.infoRow}>
              <Ionicons name="folder-outline" size={16} color="#9ca3af" />
              <Text style={styles.infoText}>Artigo: {item.artigo_matricial}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>
            {new Date(item.created_at).toLocaleDateString('pt-PT', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </Text>

          {item.pdf_url && (
            <View style={styles.pdfBadge}>
              <Ionicons name="document" size={14} color="#10b981" />
              <Text style={styles.pdfText}>PDF</Text>
            </View>
          )}

          {item.status === 'draft' && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(item.id, item.client_name)}
            >
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📁 Pré-Angariações</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('FirstImpressionForm' as never)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filtros */}
      <View style={styles.filters}>
        {(['all', 'draft', 'signed', 'completed'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'Todos' : STATUS_LABELS[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00d9ff" />
        </View>
      ) : impressions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="folder-open-outline" size={64} color="#6b7280" />
          <Text style={styles.emptyText}>Nenhuma pré-angariação encontrada</Text>
          <Text style={styles.emptySubtext}>Crie uma nova tocando no botão +</Text>
        </View>
      ) : (
        <FlatList
          data={impressions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00d9ff" />
          }
        />
      )}
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
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1f2e',
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  filterButtonActive: {
    backgroundColor: '#00d9ff20',
    borderColor: '#00d9ff',
  },
  filterText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#00d9ff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#9ca3af',
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#1a1f2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  signedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#8b5cf620',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  signedText: {
    fontSize: 11,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  cardBody: {
    gap: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2d3748',
  },
  dateText: {
    fontSize: 12,
    color: '#6b7280',
  },
  pdfBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10b98120',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pdfText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
});
