/**
 * ✨ FASE 2: Multi-Device Management Screen
 * Lista dispositivos ativos + Logout remoto
 * Endpoints: GET /auth/sessions, DELETE /auth/sessions/{id}, DELETE /auth/sessions/logout-all
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { sessionsService } from '../services/sessions';
import { LoadingState, EmptyState } from '../components';
import { colors, typography } from '../theme';
import type { ActiveSession } from '../services/sessions';

export default function ActiveDevicesScreen() {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load sessions ao montar
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await sessionsService.getSessions();
      setSessions(data);
    } catch (error: any) {
      Alert.alert('Erro', error.detail || 'Não foi possível carregar dispositivos');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  };

  const handleLogoutDevice = (sessionId: string, deviceName: string) => {
    Alert.alert(
      'Terminar Sessão',
      `Deseja terminar a sessão em "${deviceName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Terminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await sessionsService.logoutSession(sessionId);
              // Recarregar lista
              await loadSessions();
              Alert.alert('Sucesso', 'Sessão terminada com sucesso');
            } catch (error: any) {
              Alert.alert('Erro', error.detail || 'Não foi possível terminar a sessão');
            }
          },
        },
      ]
    );
  };

  const handleLogoutAllOthers = () => {
    Alert.alert(
      'Terminar Todas as Sessões',
      'Isto irá terminar todas as sessões EXCETO a atual. Confirma?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Terminar Todas',
          style: 'destructive',
          onPress: async () => {
            try {
              await sessionsService.logoutAllOthers();
              // Recarregar lista (deve mostrar apenas sessão atual)
              await loadSessions();
              Alert.alert('Sucesso', 'Todas as outras sessões foram terminadas');
            } catch (error: any) {
              Alert.alert('Erro', error.detail || 'Não foi possível terminar as sessões');
            }
          },
        },
      ]
    );
  };

  const getDeviceIcon = (deviceType: string): string => {
    if (deviceType.includes('iPhone') || deviceType.includes('iOS')) return 'phone-portrait';
    if (deviceType.includes('Android')) return 'phone-portrait';
    if (deviceType.includes('iPad')) return 'tablet-portrait';
    if (deviceType.includes('Mac')) return 'desktop';
    return 'hardware-chip';
  };

  const getDeviceLabel = (isCurrent: boolean): string => {
    return isCurrent ? 'Este Dispositivo' : 'Outro Dispositivo';
  };

  const renderSession = ({ item }: { item: ActiveSession }) => {
    const deviceIcon = getDeviceIcon(item.device_type);
    const deviceLabel = getDeviceLabel(item.is_current);

    return (
      <View style={[styles.sessionCard, item.is_current && styles.currentSession]}>
        <View style={styles.sessionHeader}>
          <View style={styles.deviceInfo}>
            <Icon name={deviceIcon} size={32} color={item.is_current ? colors.primary : colors.textSecondary} />
            <View style={styles.deviceText}>
              <Text style={styles.deviceType}>{item.device_type}</Text>
              <Text style={styles.deviceLabel}>{deviceLabel}</Text>
            </View>
          </View>

          {!item.is_current && (
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => handleLogoutDevice(item.id, item.device_type)}
            >
              <Icon name="log-out-outline" size={24} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.sessionDetails}>
          <View style={styles.detailRow}>
            <Icon name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>
              {item.location_city}, {item.location_country}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="time-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>
              Login: {new Date(item.created_at).toLocaleDateString('pt-PT', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="timer-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>
              Última atividade: {new Date(item.last_activity).toLocaleDateString('pt-PT', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          {item.ip_address && (
            <View style={styles.detailRow}>
              <Icon name="globe-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.detailText}>IP: {item.ip_address}</Text>
            </View>
          )}
        </View>

        {item.is_current && (
          <View style={styles.currentBadge}>
            <Icon name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.currentBadgeText}>Sessão Ativa</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return <LoadingState message="Carregando dispositivos..." />;
  }

  const otherSessions = sessions.filter((s) => !s.is_current);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Dispositivos Ativos</Text>
        <Text style={styles.subtitle}>
          {sessions.length} {sessions.length === 1 ? 'dispositivo' : 'dispositivos'} conectado
          {sessions.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {sessions.length === 0 ? (
        <EmptyState
          icon="phone-portrait-outline"
          title="Nenhum dispositivo ativo"
          description="Faça login em outros dispositivos para vê-los aqui."
        />
      ) : (
        <>
          <FlatList
            data={sessions}
            keyExtractor={(item) => item.id}
            renderItem={renderSession}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
            }
          />

          {otherSessions.length > 0 && (
            <View style={styles.footer}>
              <TouchableOpacity style={styles.logoutAllButton} onPress={handleLogoutAllOthers}>
                <Icon name="log-out" size={20} color="#fff" />
                <Text style={styles.logoutAllText}>Terminar Todas as Outras Sessões</Text>
              </TouchableOpacity>

              <Text style={styles.footerWarning}>
                ⚠️ Esta ação irá terminar todas as sessões exceto a atual
              </Text>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#fff',
  },
  title: {
    ...typography.heading2,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  listContent: {
    padding: 16,
  },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  currentSession: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deviceText: {
    marginLeft: 12,
    flex: 1,
  },
  deviceType: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: 2,
  },
  deviceLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  logoutButton: {
    padding: 8,
  },
  sessionDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  currentBadgeText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  logoutAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    borderRadius: 8,
    padding: 14,
    gap: 8,
  },
  logoutAllText: {
    ...typography.bodyBold,
    color: '#fff',
  },
  footerWarning: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});
