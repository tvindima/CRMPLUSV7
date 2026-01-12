/**
 * SettingsScreen - Definições da App
 * Notificações, idioma, tema da app, alteração de password
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services/api';

interface AppTheme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  preview: string[];
}

interface Assistant {
  id: number;
  email: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
}

const APP_THEMES: AppTheme[] = [
  {
    id: 'futuristic',
    name: 'Futurista',
    description: 'Cyberpunk com néons e gradientes',
    colors: { primary: '#00d9ff', secondary: '#8b5cf6', accent: '#d946ef' },
    preview: ['#0a0e1a', '#00d9ff', '#d946ef'],
  },
  {
    id: 'professional',
    name: 'Profissional',
    description: 'Clássico e elegante para negócios',
    colors: { primary: '#3b82f6', secondary: '#1e40af', accent: '#60a5fa' },
    preview: ['#111827', '#3b82f6', '#60a5fa'],
  },
  {
    id: 'luxury',
    name: 'Luxuoso',
    description: 'Dourado e sofisticado',
    colors: { primary: '#d4af37', secondary: '#b8860b', accent: '#ffd700' },
    preview: ['#1a1a1a', '#d4af37', '#ffd700'],
  },
  {
    id: 'feminine',
    name: 'Elegante Rosa',
    description: 'Suave e moderno com tons rosa',
    colors: { primary: '#ec4899', secondary: '#db2777', accent: '#f472b6' },
    preview: ['#1f1520', '#ec4899', '#f472b6'],
  },
  {
    id: 'nature',
    name: 'Natureza',
    description: 'Verde e sustentável',
    colors: { primary: '#10b981', secondary: '#059669', accent: '#34d399' },
    preview: ['#0f1a14', '#10b981', '#34d399'],
  },
  {
    id: 'minimalist',
    name: 'Minimalista',
    description: 'Clean e monocromático',
    colors: { primary: '#ffffff', secondary: '#d1d5db', accent: '#9ca3af' },
    preview: ['#18181b', '#ffffff', '#9ca3af'],
  },
];

const LANGUAGES = [
  { id: 'pt', name: 'Português', flag: '🇵🇹' },
  { id: 'en', name: 'English', flag: '🇬🇧' },
  { id: 'es', name: 'Español', flag: '🇪🇸' },
  { id: 'fr', name: 'Français', flag: '🇫🇷' },
];

const SETTINGS_STORAGE_KEY = '@crm_plus_settings';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { signOut, user } = useAuth();
  const { setTheme: setGlobalTheme, themeId: globalThemeId } = useTheme();
  
  // Notifications
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  
  // Language
  const [selectedLanguage, setSelectedLanguage] = useState('pt');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  
  // Theme
  const [selectedTheme, setSelectedTheme] = useState(globalThemeId || 'futuristic');
  const [showThemeModal, setShowThemeModal] = useState(false);

  // Password modals
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAssistantPasswordModal, setShowAssistantPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // Assistants
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(null);
  const [assistantNewPassword, setAssistantNewPassword] = useState('');
  const [assistantConfirmPassword, setAssistantConfirmPassword] = useState('');

  useEffect(() => {
    loadSettings();
    loadAssistants();
  }, []);

  const loadAssistants = async () => {
    try {
      const response = await apiService.get<Assistant[]>('/mobile/auth/assistants');
      setAssistants(response || []);
    } catch (error) {
      console.log('Sem assistentes ou erro ao carregar:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const settings = JSON.parse(stored);
        setPushEnabled(settings.pushEnabled ?? true);
        setEmailEnabled(settings.emailEnabled ?? true);
        setSoundEnabled(settings.soundEnabled ?? true);
        setVibrationEnabled(settings.vibrationEnabled ?? true);
        setSelectedLanguage(settings.language ?? 'pt');
        setSelectedTheme(settings.theme ?? 'futuristic');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings: any) => {
    try {
      const settings = {
        pushEnabled,
        emailEnabled,
        soundEnabled,
        vibrationEnabled,
        language: selectedLanguage,
        theme: selectedTheme,
        ...newSettings,
      };
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handlePushChange = (value: boolean) => {
    setPushEnabled(value);
    saveSettings({ pushEnabled: value });
  };

  const handleEmailChange = (value: boolean) => {
    setEmailEnabled(value);
    saveSettings({ emailEnabled: value });
  };

  const handleSoundChange = (value: boolean) => {
    setSoundEnabled(value);
    saveSettings({ soundEnabled: value });
  };

  const handleVibrationChange = (value: boolean) => {
    setVibrationEnabled(value);
    saveSettings({ vibrationEnabled: value });
  };

  const handleLanguageSelect = (langId: string) => {
    setSelectedLanguage(langId);
    saveSettings({ language: langId });
    setShowLanguageModal(false);
  };

  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId);
    setGlobalTheme(themeId); // Propagar para o ThemeContext
    saveSettings({ theme: themeId });
    setShowThemeModal(false);
  };

  const getCurrentLanguage = () => {
    return LANGUAGES.find(l => l.id === selectedLanguage) || LANGUAGES[0];
  };

  const getCurrentTheme = () => {
    return APP_THEMES.find(t => t.id === selectedTheme) || APP_THEMES[0];
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Erro', 'As passwords não coincidem');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Erro', 'A password deve ter pelo menos 6 caracteres');
      return;
    }

    setPasswordLoading(true);
    try {
      await apiService.post('/mobile/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      Alert.alert('Sucesso', 'Password alterada com sucesso');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.detail || 'Erro ao alterar password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleChangeAssistantPassword = async () => {
    if (!selectedAssistant) return;
    
    if (assistantNewPassword !== assistantConfirmPassword) {
      Alert.alert('Erro', 'As passwords não coincidem');
      return;
    }
    if (assistantNewPassword.length < 6) {
      Alert.alert('Erro', 'A password deve ter pelo menos 6 caracteres');
      return;
    }

    setPasswordLoading(true);
    try {
      await apiService.post('/mobile/auth/change-assistant-password', {
        assistant_id: selectedAssistant.id,
        new_password: assistantNewPassword,
      });
      Alert.alert('Sucesso', `Password de ${selectedAssistant.full_name} alterada com sucesso`);
      setShowAssistantPasswordModal(false);
      setSelectedAssistant(null);
      setAssistantNewPassword('');
      setAssistantConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.detail || 'Erro ao alterar password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const openAssistantPasswordModal = (assistant: Assistant) => {
    setSelectedAssistant(assistant);
    setAssistantNewPassword('');
    setAssistantConfirmPassword('');
    setShowAssistantPasswordModal(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#00d9ff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Definições</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificações</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#00d9ff20' }]}>
                <Ionicons name="notifications" size={20} color="#00d9ff" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Notificações Push</Text>
                <Text style={styles.settingDesc}>Receber alertas no dispositivo</Text>
              </View>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={handlePushChange}
              trackColor={{ false: '#333', true: '#00d9ff' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#8b5cf620' }]}>
                <Ionicons name="mail" size={20} color="#8b5cf6" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Notificações por Email</Text>
                <Text style={styles.settingDesc}>Receber resumos por email</Text>
              </View>
            </View>
            <Switch
              value={emailEnabled}
              onValueChange={handleEmailChange}
              trackColor={{ false: '#333', true: '#8b5cf6' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#10b98120' }]}>
                <Ionicons name="volume-high" size={20} color="#10b981" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Sons</Text>
                <Text style={styles.settingDesc}>Reproduzir sons nas notificações</Text>
              </View>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={handleSoundChange}
              trackColor={{ false: '#333', true: '#10b981' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#f59e0b20' }]}>
                <Ionicons name="phone-portrait" size={20} color="#f59e0b" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Vibração</Text>
                <Text style={styles.settingDesc}>Vibrar ao receber notificações</Text>
              </View>
            </View>
            <Switch
              value={vibrationEnabled}
              onValueChange={handleVibrationChange}
              trackColor={{ false: '#333', true: '#f59e0b' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Idioma</Text>
          
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => setShowLanguageModal(true)}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#ec489920' }]}>
                <Text style={styles.flagEmoji}>{getCurrentLanguage().flag}</Text>
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Idioma da App</Text>
                <Text style={styles.settingDesc}>{getCurrentLanguage().name}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aparência</Text>
          
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => setShowThemeModal(true)}
          >
            <View style={styles.settingLeft}>
              <View style={styles.themePreviewMini}>
                {getCurrentTheme().preview.map((color, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.themePreviewColor, 
                      { backgroundColor: color },
                      index === 0 && { flex: 2 }
                    ]} 
                  />
                ))}
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Tema da App</Text>
                <Text style={styles.settingDesc}>{getCurrentTheme().name}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Segurança</Text>
          
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => {
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
              setShowPasswordModal(true);
            }}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#00d9ff20' }]}>
                <Ionicons name="key" size={20} color="#00d9ff" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Alterar Password</Text>
                <Text style={styles.settingDesc}>Modificar a sua password de acesso</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>

          {assistants.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 20, marginBottom: 8 }]}>
                Passwords dos Assistentes
              </Text>
              {assistants.map((assistant) => (
                <TouchableOpacity 
                  key={assistant.id}
                  style={styles.settingRow}
                  onPress={() => openAssistantPasswordModal(assistant)}
                >
                  <View style={styles.settingLeft}>
                    <View style={[styles.settingIcon, { backgroundColor: '#8b5cf620' }]}>
                      <Ionicons name="person" size={20} color="#8b5cf6" />
                    </View>
                    <View style={styles.settingContent}>
                      <Text style={styles.settingTitle}>{assistant.full_name}</Text>
                      <Text style={styles.settingDesc}>{assistant.email}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados</Text>
          
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#ef444420' }]}>
                <Ionicons name="trash" size={20} color="#ef4444" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Limpar Cache</Text>
                <Text style={styles.settingDesc}>Libertar espaço no dispositivo</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#6b728020' }]}>
                <Ionicons name="cloud-download" size={20} color="#6b7280" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Exportar Dados</Text>
                <Text style={styles.settingDesc}>Descarregar os seus dados</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Logout Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sessão</Text>
          
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={async () => {
              // Na web, Alert.alert não funciona - usar window.confirm
              if (Platform.OS === 'web') {
                const confirmed = window.confirm('Tem a certeza que deseja sair da aplicação?');
                if (confirmed) {
                  await signOut();
                }
              } else {
                Alert.alert(
                  'Terminar Sessão',
                  'Tem a certeza que deseja sair da aplicação?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Sair', style: 'destructive', onPress: signOut },
                  ]
                );
              }
            }}
          >
            <Ionicons name="log-out-outline" size={24} color="#fff" />
            <Text style={styles.logoutText}>Terminar Sessão</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Language Modal */}
      <Modal
        visible={showLanguageModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Idioma</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.id}
                  style={[
                    styles.languageOption,
                    selectedLanguage === lang.id && styles.languageOptionActive,
                  ]}
                  onPress={() => handleLanguageSelect(lang.id)}
                >
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  <Text style={styles.languageName}>{lang.name}</Text>
                  {selectedLanguage === lang.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#00d9ff" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Theme Modal */}
      <Modal
        visible={showThemeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowThemeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tema da App</Text>
              <TouchableOpacity onPress={() => setShowThemeModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Escolha o estilo visual da aplicação
            </Text>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.themesGrid}>
                {APP_THEMES.map((theme) => (
                  <TouchableOpacity
                    key={theme.id}
                    style={[
                      styles.themeOption,
                      selectedTheme === theme.id && styles.themeOptionActive,
                    ]}
                    onPress={() => handleThemeSelect(theme.id)}
                  >
                    <View style={styles.themePreview}>
                      <View style={[styles.themePreviewBg, { backgroundColor: theme.preview[0] }]}>
                        <View style={styles.themePreviewUI}>
                          <View style={[styles.themePreviewBar, { backgroundColor: theme.preview[1] }]} />
                          <View style={styles.themePreviewCards}>
                            <View style={[styles.themePreviewCard, { backgroundColor: theme.preview[1] + '30' }]} />
                            <View style={[styles.themePreviewCard, { backgroundColor: theme.preview[2] + '30' }]} />
                          </View>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.themeName}>{theme.name}</Text>
                    <Text style={styles.themeDescription}>{theme.description}</Text>
                    {selectedTheme === theme.id && (
                      <View style={styles.themeCheck}>
                        <Ionicons name="checkmark-circle" size={24} color="#00d9ff" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Alterar Password</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalScroll}>
              <Text style={styles.inputLabel}>Password Atual</Text>
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholder="Introduza a password atual"
                placeholderTextColor="#6b7280"
              />

              <Text style={styles.inputLabel}>Nova Password</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="Introduza a nova password"
                placeholderTextColor="#6b7280"
              />

              <Text style={styles.inputLabel}>Confirmar Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Confirme a nova password"
                placeholderTextColor="#6b7280"
              />

              <TouchableOpacity 
                style={[styles.saveButton, passwordLoading && styles.saveButtonDisabled]}
                onPress={handleChangePassword}
                disabled={passwordLoading}
              >
                {passwordLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Assistant Password Modal */}
      <Modal
        visible={showAssistantPasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAssistantPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Password do Assistente</Text>
              <TouchableOpacity onPress={() => setShowAssistantPasswordModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalScroll}>
              {selectedAssistant && (
                <View style={styles.assistantInfo}>
                  <View style={[styles.settingIcon, { backgroundColor: '#8b5cf620' }]}>
                    <Ionicons name="person" size={24} color="#8b5cf6" />
                  </View>
                  <View>
                    <Text style={styles.assistantName}>{selectedAssistant.full_name}</Text>
                    <Text style={styles.assistantEmail}>{selectedAssistant.email}</Text>
                  </View>
                </View>
              )}

              <Text style={styles.inputLabel}>Nova Password</Text>
              <TextInput
                style={styles.input}
                value={assistantNewPassword}
                onChangeText={setAssistantNewPassword}
                secureTextEntry
                placeholder="Introduza a nova password"
                placeholderTextColor="#6b7280"
              />

              <Text style={styles.inputLabel}>Confirmar Password</Text>
              <TextInput
                style={styles.input}
                value={assistantConfirmPassword}
                onChangeText={setAssistantConfirmPassword}
                secureTextEntry
                placeholder="Confirme a nova password"
                placeholderTextColor="#6b7280"
              />

              <TouchableOpacity 
                style={[styles.saveButton, passwordLoading && styles.saveButtonDisabled]}
                onPress={handleChangeAssistantPassword}
                disabled={passwordLoading}
              >
                {passwordLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar Password</Text>
                )}
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1f2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00d9ff',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1f2e',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 12,
    color: '#6b7280',
  },
  flagEmoji: {
    fontSize: 24,
  },
  themePreviewMini: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  themePreviewColor: {
    flex: 1,
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
    maxHeight: 500,
  },
  // Language options
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    marginBottom: 10,
    gap: 14,
  },
  languageOptionActive: {
    borderWidth: 2,
    borderColor: '#00d9ff',
    backgroundColor: '#00d9ff10',
  },
  languageFlag: {
    fontSize: 28,
  },
  languageName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  // Theme options
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  themeOption: {
    width: '47%',
    padding: 12,
    backgroundColor: '#1a1f2e',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeOptionActive: {
    borderColor: '#00d9ff',
    backgroundColor: '#00d9ff10',
  },
  themePreview: {
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  themePreviewBg: {
    flex: 1,
    padding: 8,
  },
  themePreviewUI: {
    flex: 1,
  },
  themePreviewBar: {
    height: 6,
    width: '60%',
    borderRadius: 3,
    marginBottom: 8,
  },
  themePreviewCards: {
    flexDirection: 'row',
    gap: 6,
  },
  themePreviewCard: {
    flex: 1,
    height: 30,
    borderRadius: 6,
  },
  themeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  themeDescription: {
    fontSize: 11,
    color: '#6b7280',
  },
  themeCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#ef4444',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  input: {
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#fff',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffffff10',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
  },
  saveButton: {
    backgroundColor: '#00d9ff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonDisabled: {
    backgroundColor: '#00d9ff80',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0a0e1a',
  },
  assistantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
  },
  assistantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  assistantEmail: {
    fontSize: 13,
    color: '#6b7280',
  },
});
