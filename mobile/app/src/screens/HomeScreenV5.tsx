/**
 * HomeScreenV5 - Dashboard com atalhos personalizáveis
 * Contadores de métricas + ações rápidas + grid de atalhos customizáveis
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useAgent } from '../contexts/AgentContext';
import { apiService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DashboardStats {
  events_today?: number;
  visits_today?: number;
  tasks_today?: number;
  new_leads?: number;
  leads?: number;
  properties: number;
}

interface AgentProfile {
  photo?: string;
  avatar_url?: string;
  name?: string;
}

interface Shortcut {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
  enabled: boolean;
}

const ALL_SHORTCUTS: Shortcut[] = [
  { id: 'leads', label: 'Leads', icon: 'people', color: '#8b5cf6', route: 'Leads', enabled: true },
  { id: 'properties', label: 'Imóveis', icon: 'home', color: '#d946ef', route: 'Propriedades', enabled: true },
  { id: 'agenda', label: 'Agenda', icon: 'calendar', color: '#00d9ff', route: 'Agenda', enabled: true },
  { id: 'ai', label: 'Assistente IA', icon: 'sparkles', color: '#f59e0b', route: 'IA', enabled: true },
  { id: 'new-lead', label: 'Novo Lead', icon: 'person-add', color: '#10b981', route: 'NewLead', enabled: true },
  { id: 'site-editor', label: 'Editor Montra', icon: 'globe', color: '#ec4899', route: 'SiteEditor', enabled: true },
  { id: 'messages', label: 'Mensagens', icon: 'chatbubbles', color: '#06b6d4', route: 'Messages', enabled: false },
  { id: 'reports', label: 'Relatórios', icon: 'stats-chart', color: '#84cc16', route: 'Reports', enabled: false },
  { id: 'first-impression', label: '1ª Impressões', icon: 'document-text', color: '#8b5cf6', route: 'FirstImpressionList', enabled: true },
  { id: 'documents', label: 'Documentos', icon: 'folder', color: '#f97316', route: 'Documents', enabled: false },
  { id: 'contacts', label: 'Contactos', icon: 'call', color: '#14b8a6', route: 'Contacts', enabled: false },
  { id: 'notifications', label: 'Alertas', icon: 'notifications', color: '#ef4444', route: 'Notifications', enabled: false },
  { id: 'settings', label: 'Definições', icon: 'settings', color: '#6b7280', route: 'Perfil', enabled: false },
];

const STORAGE_KEY = '@crm_plus_shortcuts';

export default function HomeScreenV5({ navigation }: any) {
  const { user } = useAuth();
  const { agentProfile, stats: agentStats, loadAgentData, refreshAgentData } = useAgent();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    events_today: 0,
    new_leads: 0,
    properties: 0,
  });
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [tempShortcuts, setTempShortcuts] = useState<Shortcut[]>([]);
  
  // Editor Montra Modal
  const [showSiteEditorModal, setShowSiteEditorModal] = useState(false);
  const [siteTheme, setSiteTheme] = useState<'dark' | 'light'>('dark');
  const [heroProperties, setHeroProperties] = useState<number[]>([]);
  const [savingSitePrefs, setSavingSitePrefs] = useState(false);

  useEffect(() => {
    loadData();
    loadShortcuts();
    loadSitePreferences();
  }, []);

  // ✅ NOVO: Atualizar stats locais quando agentStats mudar
  useEffect(() => {
    if (agentStats) {
      setStats({
        ...agentStats,
        events_today: (agentStats.visits_today || 0) + (agentStats.tasks_today || 0),
      });
    }
  }, [agentStats]);

  const loadSitePreferences = async () => {
    try {
      const response = await apiService.get<any>('/mobile/site-preferences');
      if (response) {
        setSiteTheme(response.theme || 'dark');
        setHeroProperties(response.hero_property_ids || []);
      }
    } catch (error) {
      console.log('Could not load site preferences, using defaults');
    }
  };

  const saveSitePreferences = async () => {
    try {
      setSavingSitePrefs(true);
      await apiService.put('/mobile/site-preferences', {
        theme: siteTheme,
        hero_property_ids: heroProperties,
      });
      setShowSiteEditorModal(false);
    } catch (error) {
      console.error('Error saving site preferences:', error);
    } finally {
      setSavingSitePrefs(false);
    }
  };

  const loadShortcuts = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with ALL_SHORTCUTS to get any new shortcuts
        const merged = ALL_SHORTCUTS.map(s => {
          const found = parsed.find((p: Shortcut) => p.id === s.id);
          return found ? { ...s, enabled: found.enabled } : s;
        });
        setShortcuts(merged);
      } else {
        setShortcuts(ALL_SHORTCUTS);
      }
    } catch (error) {
      setShortcuts(ALL_SHORTCUTS);
    }
  };

  const saveShortcuts = async (newShortcuts: Shortcut[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newShortcuts));
      setShortcuts(newShortcuts);
    } catch (error) {
      console.error('Error saving shortcuts:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // ✅ OTIMIZADO: Uma única chamada via context (com cache de 30s)
      await loadAgentData();
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAgentData(); // Force refresh sem cache
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 19) return 'Boa tarde';
    return 'Boa noite';
  };

  const getFirstName = () => {
    if (agentProfile?.name) {
      return agentProfile.name.split(' ')[0];
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Agente';
  };

  const getAvatarUrl = () => {
    const candidate = agentProfile?.photo || agentProfile?.avatar_url || user?.avatar_url;
    if (!candidate) return null;

    // Se vier relativo, construir URL absoluto (web serve avatares públicos)
    if (candidate.startsWith('/')) {
      return `https://web-nymbcws7r-toinos-projects.vercel.app${candidate}`;
    }

    if (candidate.startsWith('http')) {
      return candidate;
    }

    // Fallback: servir do backend (ex.: /media/uploads/avatar.jpg)
    return `https://crmplusv7-production.up.railway.app${candidate}`;
  };

  const handleShortcutPress = (shortcut: Shortcut) => {
    console.log('Shortcut pressed:', shortcut.route);
    if (shortcut.route === 'SiteEditor') {
      setShowSiteEditorModal(true);
    } else {
      // Navigate to the route
      navigation.navigate(shortcut.route as any);
    }
  };

  const toggleShortcut = (id: string) => {
    setTempShortcuts(prev => 
      prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s)
    );
  };

  const openEditModal = () => {
    setTempShortcuts([...shortcuts]);
    setShowEditModal(true);
  };

  const saveEditModal = () => {
    saveShortcuts(tempShortcuts);
    setShowEditModal(false);
  };

  const enabledShortcuts = shortcuts.filter(s => s.enabled);
  const avatarUrl = getAvatarUrl();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00d9ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00d9ff" />
        }
      >
        {/* Header with Avatar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{getFirstName()}</Text>
          </View>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={() => navigation.navigate('Perfil')}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <LinearGradient
                colors={['#00d9ff', '#8b5cf6', '#d946ef']}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarInitial}>{getFirstName()[0]}</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>

        {/* Stats Cards with Quick Actions */}
        <View style={styles.statsContainer}>
          {/* Events Today */}
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigation.navigate('Agenda')}
          >
            <LinearGradient
              colors={['rgba(0,217,255,0.15)', 'rgba(0,217,255,0.05)']}
              style={styles.statGradient}
            >
              <Text style={styles.statValue}>{stats.events_today || 0}</Text>
              <Text style={styles.statLabel}>Eventos{'\n'}Hoje</Text>
              <TouchableOpacity 
                style={styles.quickAction}
                onPress={(e) => {
                  e.stopPropagation();
                  navigation.getParent()?.navigate('Agenda', { screen: 'AgendaMain', params: { createNew: true } });
                }}
              >
                <Ionicons name="add" size={14} color="#00d9ff" />
                <Text style={styles.quickActionText}>Novo</Text>
              </TouchableOpacity>
            </LinearGradient>
          </TouchableOpacity>

          {/* New Leads */}
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigation.getParent()?.navigate('Leads')}
          >
            <LinearGradient
              colors={['rgba(139,92,246,0.15)', 'rgba(139,92,246,0.05)']}
              style={styles.statGradient}
            >
              <Text style={[styles.statValue, { color: '#8b5cf6' }]}>
                {stats.new_leads || stats.leads || 0}
              </Text>
              <Text style={styles.statLabel}>Novos{'\n'}Leads</Text>
              <TouchableOpacity 
                style={[styles.quickAction, { borderColor: '#8b5cf6' }]}
                onPress={(e) => {
                  e.stopPropagation();
                  navigation.getParent()?.navigate('Leads', { screen: 'NewLead' });
                }}
              >
                <Ionicons name="add" size={14} color="#8b5cf6" />
                <Text style={[styles.quickActionText, { color: '#8b5cf6' }]}>Criar</Text>
              </TouchableOpacity>
            </LinearGradient>
          </TouchableOpacity>

          {/* Properties */}
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigation.getParent()?.navigate('Propriedades')}
          >
            <LinearGradient
              colors={['rgba(217,70,239,0.15)', 'rgba(217,70,239,0.05)']}
              style={styles.statGradient}
            >
              <Text style={[styles.statValue, { color: '#d946ef' }]}>{stats.properties}</Text>
              <Text style={styles.statLabel}>Imóveis</Text>
              <TouchableOpacity 
                style={[styles.quickAction, { borderColor: '#d946ef' }]}
                onPress={(e) => {
                  e.stopPropagation();
                  navigation.getParent()?.navigate('Propriedades', { screen: 'PropertiesMain', params: { openSearch: true } });
                }}
              >
                <Ionicons name="search" size={14} color="#d946ef" />
                <Text style={[styles.quickActionText, { color: '#d946ef' }]}>Pesquisar</Text>
              </TouchableOpacity>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Shortcuts Section */}
        <View style={styles.shortcutsSection}>
          <View style={styles.shortcutsHeader}>
            <Text style={styles.sectionTitle}>Atalhos Rápidos</Text>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={openEditModal}
            >
              <Ionicons name="pencil" size={16} color="#00d9ff" />
              <Text style={styles.editButtonText}>Editar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.shortcutsGrid}>
            {enabledShortcuts.map((shortcut) => (
              <TouchableOpacity
                key={shortcut.id}
                style={styles.shortcutItem}
                onPress={() => handleShortcutPress(shortcut)}
              >
                <View style={[styles.shortcutIcon, { backgroundColor: `${shortcut.color}20` }]}>
                  <Ionicons name={shortcut.icon} size={28} color={shortcut.color} />
                </View>
                <Text style={styles.shortcutLabel} numberOfLines={2}>
                  {shortcut.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Edit Shortcuts Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Personalizar Atalhos</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Selecione os atalhos que deseja ver no ecrã principal
            </Text>

            <View style={styles.selectAllContainer}>
              <TouchableOpacity 
                style={styles.selectAllButton}
                onPress={() => setTempShortcuts(prev => prev.map(s => ({ ...s, enabled: true })))}
              >
                <Ionicons name="checkbox" size={18} color="#10b981" />
                <Text style={styles.selectAllText}>Selecionar Todos</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.selectAllButton}
                onPress={() => setTempShortcuts(prev => prev.map(s => ({ ...s, enabled: false })))}
              >
                <Ionicons name="square-outline" size={18} color="#6b7280" />
                <Text style={[styles.selectAllText, { color: '#6b7280' }]}>Desselecionar</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {tempShortcuts.map((shortcut) => (
                <TouchableOpacity
                  key={shortcut.id}
                  style={[
                    styles.shortcutOption,
                    shortcut.enabled && styles.shortcutOptionActive,
                  ]}
                  onPress={() => toggleShortcut(shortcut.id)}
                >
                  <View style={[styles.shortcutOptionIcon, { backgroundColor: `${shortcut.color}20` }]}>
                    <Ionicons name={shortcut.icon} size={24} color={shortcut.color} />
                  </View>
                  <Text style={styles.shortcutOptionLabel}>{shortcut.label}</Text>
                  <View style={[
                    styles.checkbox,
                    shortcut.enabled && styles.checkboxActive,
                  ]}>
                    {shortcut.enabled && (
                      <Ionicons name="checkmark" size={16} color="#0a0e1a" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={saveEditModal}
              >
                <LinearGradient
                  colors={['#00d9ff', '#0099cc']}
                  style={styles.saveButtonGradient}
                >
                  <Text style={styles.saveButtonText}>Guardar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Site Editor Modal */}
      <Modal
        visible={showSiteEditorModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSiteEditorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editor Montra</Text>
              <TouchableOpacity onPress={() => setShowSiteEditorModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Personalize a sua página individual de agente
            </Text>

            <ScrollView style={styles.modalScroll}>
              {/* Theme Selection */}
              <Text style={styles.editorSectionTitle}>Tema da Página</Text>
              <View style={styles.themeOptions}>
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    siteTheme === 'dark' && styles.themeOptionActive,
                  ]}
                  onPress={() => setSiteTheme('dark')}
                >
                  <View style={styles.themePreviewDark}>
                    <View style={styles.themePreviewHeader} />
                    <View style={styles.themePreviewContent}>
                      <View style={[styles.themePreviewText, { backgroundColor: '#fff' }]} />
                      <View style={[styles.themePreviewText, { backgroundColor: '#ef4444', width: '40%' }]} />
                    </View>
                  </View>
                  <Text style={styles.themeLabel}>Dark</Text>
                  <Text style={styles.themeDescription}>Fundo escuro, texto branco e vermelho</Text>
                  {siteTheme === 'dark' && (
                    <View style={styles.themeCheck}>
                      <Ionicons name="checkmark-circle" size={20} color="#00d9ff" />
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    siteTheme === 'light' && styles.themeOptionActive,
                  ]}
                  onPress={() => setSiteTheme('light')}
                >
                  <View style={styles.themePreviewLight}>
                    <View style={[styles.themePreviewHeader, { backgroundColor: '#f3f4f6' }]} />
                    <View style={[styles.themePreviewContent, { backgroundColor: '#fff' }]}>
                      <View style={[styles.themePreviewText, { backgroundColor: '#1f2937' }]} />
                      <View style={[styles.themePreviewText, { backgroundColor: '#ef4444', width: '40%' }]} />
                    </View>
                  </View>
                  <Text style={styles.themeLabel}>Light</Text>
                  <Text style={styles.themeDescription}>Fundo claro, texto preto e vermelho</Text>
                  {siteTheme === 'light' && (
                    <View style={styles.themeCheck}>
                      <Ionicons name="checkmark-circle" size={20} color="#00d9ff" />
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.themeSyncNote}>
                <Ionicons name="information-circle" size={16} color="#f59e0b" />
                <Text style={styles.themeSyncText}>
                  O tema selecionado aqui será aplicado ao seu site montra individual. A sincronização pode demorar alguns segundos.
                </Text>
              </View>

              {/* Hero Properties */}
              <Text style={styles.editorSectionTitle}>Imóveis em Destaque (Hero)</Text>
              <Text style={styles.editorSectionDesc}>
                Selecione até 3 imóveis para aparecer no topo da sua página
              </Text>
              <TouchableOpacity 
                style={styles.selectPropertiesButton}
                onPress={() => {
                  setShowSiteEditorModal(false);
                  navigation.navigate('Propriedades', { selectForHero: true });
                }}
              >
                <Ionicons name="images-outline" size={20} color="#00d9ff" />
                <Text style={styles.selectPropertiesText}>Selecionar Imóveis para Hero</Text>
                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
              </TouchableOpacity>

              {/* Quick Actions */}
              <Text style={styles.editorSectionTitle}>Ações Rápidas</Text>
              <TouchableOpacity 
                style={styles.editorActionButton}
                onPress={() => {
                  setShowSiteEditorModal(false);
                  navigation.navigate('Propriedades');
                }}
              >
                <View style={[styles.editorActionIcon, { backgroundColor: '#8b5cf620' }]}>
                  <Ionicons name="create-outline" size={20} color="#8b5cf6" />
                </View>
                <View style={styles.editorActionContent}>
                  <Text style={styles.editorActionTitle}>Editar Descrições</Text>
                  <Text style={styles.editorActionDesc}>Ajustar descritivos dos seus imóveis</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.editorActionButton}
                onPress={() => {
                  setShowSiteEditorModal(false);
                  navigation.navigate('Propriedades');
                }}
              >
                <View style={[styles.editorActionIcon, { backgroundColor: '#ec489920' }]}>
                  <Ionicons name="images-outline" size={20} color="#ec4899" />
                </View>
                <View style={styles.editorActionContent}>
                  <Text style={styles.editorActionTitle}>Ordenar Fotos</Text>
                  <Text style={styles.editorActionDesc}>Alterar ordem das fotos dos imóveis</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.editorActionButton}>
                <View style={[styles.editorActionIcon, { backgroundColor: '#10b98120' }]}>
                  <Ionicons name="eye-outline" size={20} color="#10b981" />
                </View>
                <View style={styles.editorActionContent}>
                  <Text style={styles.editorActionTitle}>Pré-visualizar Página</Text>
                  <Text style={styles.editorActionDesc}>Ver como fica a sua página montra</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowSiteEditorModal(false)}
              >
                <Text style={styles.cancelButtonText}>Fechar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={saveSitePreferences}
                disabled={savingSitePrefs}
              >
                <LinearGradient
                  colors={['#00d9ff', '#0099cc']}
                  style={styles.saveButtonGradient}
                >
                  {savingSitePrefs ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Guardar Alterações</Text>
                  )}
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
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '400',
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 2,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#d946ef80',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minHeight: 140,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#00d9ff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
    lineHeight: 16,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 'auto',
    paddingTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00d9ff',
    alignSelf: 'flex-start',
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00d9ff',
  },
  shortcutsSection: {
    paddingHorizontal: 20,
  },
  shortcutsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editButtonText: {
    fontSize: 14,
    color: '#00d9ff',
    fontWeight: '500',
  },
  shortcutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  shortcutItem: {
    width: '21%',
    alignItems: 'center',
  },
  shortcutIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  shortcutLabel: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
    fontWeight: '500',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0a0e1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
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
  modalSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  modalScroll: {
    padding: 20,
    maxHeight: 400,
  },
  shortcutOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#1a1f2e',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  shortcutOptionActive: {
    borderColor: '#00d9ff40',
    backgroundColor: '#00d9ff10',
  },
  shortcutOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  shortcutOptionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#ffffff',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6b7280',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#00d9ff',
    borderColor: '#00d9ff',
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
  saveButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  // Editor Montra styles
  editorSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 20,
    marginBottom: 12,
  },
  editorSectionDesc: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 12,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#1a1f2e',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeOptionActive: {
    borderColor: '#00d9ff',
    backgroundColor: '#00d9ff10',
  },
  themePreviewDark: {
    height: 60,
    borderRadius: 8,
    backgroundColor: '#0a0e1a',
    overflow: 'hidden',
    marginBottom: 8,
  },
  themePreviewLight: {
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    overflow: 'hidden',
    marginBottom: 8,
  },
  themePreviewHeader: {
    height: 15,
    backgroundColor: '#1a1f2e',
  },
  themePreviewContent: {
    flex: 1,
    padding: 6,
    justifyContent: 'center',
    gap: 4,
  },
  themePreviewText: {
    height: 6,
    borderRadius: 3,
    width: '70%',
  },
  themeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  themeDescription: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  themeCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  selectPropertiesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#00d9ff40',
  },
  selectPropertiesText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#00d9ff',
  },
  editorActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
  },
  editorActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorActionContent: {
    flex: 1,
  },
  editorActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  editorActionDesc: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  themeSyncNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f59e0b15',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f59e0b30',
  },
  themeSyncText: {
    flex: 1,
    fontSize: 12,
    color: '#f59e0b',
    lineHeight: 18,
  },
  selectAllContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#1a1f2e',
  },
  selectAllText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#10b981',
  },
});
