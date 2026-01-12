/**
 * ProfileScreenV6 - Perfil completo com edição
 * Avatar, dados editáveis, bio, redes sociais
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import * as ImagePicker from 'expo-image-picker';
import { useTerminology } from '../contexts/TerminologyContext';

interface AgentProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  photo?: string;
  avatar_url?: string;
  bio?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  twitter?: string;
  tiktok?: string;
  whatsapp?: string;
}

interface AgentStats {
  properties: number;
  leads: number;
  visits_today: number;
}

const SOCIAL_NETWORKS = [
  { id: 'instagram', label: 'Instagram', icon: 'logo-instagram', color: '#E4405F', placeholder: '@username' },
  { id: 'facebook', label: 'Facebook', icon: 'logo-facebook', color: '#1877F2', placeholder: 'facebook.com/username' },
  { id: 'linkedin', label: 'LinkedIn', icon: 'logo-linkedin', color: '#0A66C2', placeholder: 'linkedin.com/in/username' },
  { id: 'twitter', label: 'X (Twitter)', icon: 'logo-twitter', color: '#000000', placeholder: 'x.com/username' },
  { id: 'tiktok', label: 'TikTok', icon: 'logo-tiktok', color: '#000000', placeholder: '@username' },
  { id: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366', placeholder: '+351 900 000 000' },
];

export default function ProfileScreenV6() {
  const navigation = useNavigation<NavigationProp<any>>();
  const { signOut, user } = useAuth();
  const { terms } = useTerminology();
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [stats, setStats] = useState<AgentStats>({ properties: 0, leads: 0, visits_today: 0 });
  const [loading, setLoading] = useState(true);
  
  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editFacebook, setEditFacebook] = useState('');
  const [editLinkedin, setEditLinkedin] = useState('');
  const [editTwitter, setEditTwitter] = useState('');
  const [editTiktok, setEditTiktok] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const statsResponse = await apiService.get<any>('/mobile/dashboard/stats');
      setStats({
        properties: statsResponse.properties || 0,
        leads: statsResponse.leads || 0,
        visits_today: statsResponse.visits_today || 0,
      });
      
      if (statsResponse.agent_id) {
        const agentResponse = await apiService.get<any>(`/agents/${statsResponse.agent_id}`);
        
        // Clean phone number (remove .0 if present)
        let phone = agentResponse.phone || '';
        if (phone.endsWith('.0')) {
          phone = phone.slice(0, -2);
        }
        // Remove any decimal points from phone
        phone = phone.replace(/\.0$/, '').replace(/\.0/g, '');
        
        // Also load site preferences for bio and social networks
        let sitePrefs = { bio: '', instagram: '', facebook: '', linkedin: '', twitter: '', tiktok: '', whatsapp: '' };
        try {
          const prefsResponse = await apiService.get<any>('/mobile/site-preferences');
          if (prefsResponse) {
            sitePrefs = {
              bio: prefsResponse.bio || '',
              instagram: prefsResponse.instagram || '',
              facebook: prefsResponse.facebook || '',
              linkedin: prefsResponse.linkedin || '',
              twitter: prefsResponse.twitter || '',
              tiktok: prefsResponse.tiktok || '',
              whatsapp: prefsResponse.whatsapp || '',
            };
          }
        } catch (e) {
          console.log('Could not load site preferences');
        }
        
        setAgentProfile({
          id: agentResponse.id,
          name: agentResponse.name,
          email: agentResponse.email || user?.email || '',
          phone: phone,
          photo: agentResponse.photo,
          bio: sitePrefs.bio || agentResponse.bio || '',
          instagram: sitePrefs.instagram || agentResponse.instagram || '',
          facebook: sitePrefs.facebook || agentResponse.facebook || '',
          linkedin: sitePrefs.linkedin || agentResponse.linkedin || '',
          twitter: sitePrefs.twitter || '',
          tiktok: sitePrefs.tiktok || '',
          whatsapp: sitePrefs.whatsapp || agentResponse.whatsapp || phone,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarUrl = () => {
    const candidate = agentProfile?.photo || agentProfile?.avatar_url || (user as any)?.avatar_url;
    if (!candidate) return null;
    
    // Se vier relativo (ex.: /media/avatars/...), servir pelo domínio público/web
    if (candidate.startsWith('/')) {
      return `https://web-nymbcws7r-toinos-projects.vercel.app${candidate}`;
    }
    return candidate;
  };

  // =====================================================
  // ALTERAR FOTO DE PERFIL
  // =====================================================
  const handleChangePhoto = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', '📷 Tirar Foto', '🖼️ Escolher da Galeria'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            takePhotoFromCamera();
          } else if (buttonIndex === 2) {
            pickPhotoFromGallery();
          }
        }
      );
    } else {
      // Android e Web
      Alert.alert(
        'Alterar Foto',
        'Como deseja escolher a nova foto?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: '📷 Tirar Foto', onPress: takePhotoFromCamera },
          { text: '🖼️ Galeria', onPress: pickPhotoFromGallery },
        ]
      );
    }
  };

  const takePhotoFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita acesso à câmara nas definições.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadNewPhoto(result.assets[0].uri);
    }
  };

  const pickPhotoFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita acesso à galeria nas definições.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadNewPhoto(result.assets[0].uri);
    }
  };

  const uploadNewPhoto = async (imageUri: string) => {
    if (!agentProfile?.id) return;

    setUploadingPhoto(true);
    try {
      // Criar FormData com a imagem
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('file', {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      // Upload via endpoint de foto do agente (shared com backoffice)
      const response = await apiService.uploadFile<{ photo: string }>(
        `/agents/${agentProfile.id}/upload-photo`,
        formData
      );

      if (response?.photo) {
        // Atualizar estado local
        setAgentProfile(prev => prev ? { ...prev, photo: response.photo } : null);
        Alert.alert('Sucesso! 🎉', 'Foto de perfil atualizada com sucesso!');
      }
    } catch (error: any) {
      console.error('Erro ao carregar foto:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a foto. Tente novamente.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleLogout = async () => {
    // Na web, Alert.alert não funciona - usar window.confirm
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Tem a certeza que deseja sair?');
      if (confirmed) {
        await signOut();
      }
    } else {
      Alert.alert(
        'Terminar Sessão',
        'Tem a certeza que deseja sair?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Sair', style: 'destructive', onPress: signOut },
        ]
      );
    }
  };

  const openEditModal = () => {
    if (agentProfile) {
      setEditName(agentProfile.name);
      setEditPhone(agentProfile.phone || '');
      setEditBio(agentProfile.bio || '');
      setEditInstagram(agentProfile.instagram || '');
      setEditFacebook(agentProfile.facebook || '');
      setEditLinkedin(agentProfile.linkedin || '');
      setEditTwitter(agentProfile.twitter || '');
      setEditTiktok(agentProfile.tiktok || '');
      setEditWhatsapp(agentProfile.whatsapp || '');
    }
    setShowEditModal(true);
  };

  const saveProfile = async () => {
    if (!agentProfile?.id) {
      Alert.alert('Erro', 'Não foi possível identificar o agente.');
      return;
    }
    
    try {
      // 1. Atualizar dados do agente (nome, telefone) na tabela agents
      await apiService.put(`/agents/${agentProfile.id}`, {
        name: editName,
        phone: editPhone,
      });
      
      // 2. Guardar bio e redes sociais nas site preferences
      await apiService.put('/mobile/site-preferences', {
        bio: editBio,
        instagram: editInstagram,
        facebook: editFacebook,
        linkedin: editLinkedin,
        twitter: editTwitter,
        tiktok: editTiktok,
        whatsapp: editWhatsapp,
      });
      
      // 3. Atualizar estado local
      setAgentProfile({
        ...agentProfile,
        name: editName,
        phone: editPhone,
        bio: editBio,
        instagram: editInstagram,
        facebook: editFacebook,
        linkedin: editLinkedin,
        twitter: editTwitter,
        tiktok: editTiktok,
        whatsapp: editWhatsapp,
      });
      
      setShowEditModal(false);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!\nAs alterações serão visíveis em todos os dispositivos.');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Erro', 'Não foi possível guardar o perfil. Verifique a sua ligação.');
    }
  };

  const getDisplayName = () => {
    return agentProfile?.name || 'Utilizador';
  };

  const getInitials = () => {
    if (agentProfile?.name) {
      const parts = agentProfile.name.split(' ');
      if (parts.length > 1) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`;
      }
      return parts[0][0];
    }
    return 'U';
  };

  const formatPhone = (phone: string) => {
    // Remove .0 suffix and format
    let cleaned = phone.replace(/\.0$/, '').replace(/\.0/g, '');
    return cleaned;
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
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#00d9ff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Perfil</Text>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={24} color="#00d9ff" />
          </TouchableOpacity>
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity 
            style={styles.avatarWrapper}
            onPress={handleChangePhoto}
            disabled={uploadingPhoto}
          >
            {uploadingPhoto ? (
              <View style={styles.avatarLoading}>
                <ActivityIndicator size="large" color="#00d9ff" />
                <Text style={styles.avatarLoadingText}>A carregar...</Text>
              </View>
            ) : getAvatarUrl() ? (
              <>
                <Image 
                  source={{ uri: getAvatarUrl()! }} 
                  style={styles.avatar}
                  resizeMode="cover"
                />
                <View style={styles.avatarOverlay}>
                  <Ionicons name="camera" size={24} color="#fff" />
                </View>
              </>
            ) : (
              <LinearGradient
                colors={['#00d9ff', '#8b5cf6', '#d946ef']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarInitials}>{getInitials()}</Text>
                <View style={styles.avatarOverlay}>
                  <Ionicons name="camera" size={24} color="#fff" />
                </View>
              </LinearGradient>
            )}
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Toque para alterar foto</Text>
          <Text style={styles.userName}>{getDisplayName()}</Text>
          <Text style={styles.userRole}>{terms.agentRole}</Text>
          <TouchableOpacity style={styles.editProfileButton} onPress={openEditModal}>
            <Ionicons name="create-outline" size={16} color="#00d9ff" />
            <Text style={styles.editProfileText}>Editar Perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Bio Section */}
        {agentProfile?.bio && (
          <View style={styles.bioSection}>
            <Text style={styles.bioText}>{agentProfile.bio}</Text>
          </View>
        )}

        {/* Contact Info */}
        <View style={styles.contactSection}>
          <View style={styles.contactItem}>
            <View style={[styles.contactIcon, { backgroundColor: '#00d9ff20' }]}>
              <Ionicons name="mail-outline" size={18} color="#00d9ff" />
            </View>
            <Text style={styles.contactText}>{agentProfile?.email || 'email@exemplo.com'}</Text>
          </View>
          {agentProfile?.phone && (
            <View style={styles.contactItem}>
              <View style={[styles.contactIcon, { backgroundColor: '#10b98120' }]}>
                <Ionicons name="call-outline" size={18} color="#10b981" />
              </View>
              <Text style={styles.contactText}>{formatPhone(agentProfile.phone)}</Text>
            </View>
          )}
        </View>

        {/* Social Networks */}
        {(agentProfile?.instagram || agentProfile?.facebook || agentProfile?.linkedin || agentProfile?.whatsapp) && (
          <View style={styles.socialSection}>
            <Text style={styles.sectionTitle}>Redes Sociais</Text>
            <View style={styles.socialGrid}>
              {agentProfile?.instagram && (
                <TouchableOpacity style={styles.socialButton}>
                  <View style={[styles.socialIcon, { backgroundColor: '#E4405F20' }]}>
                    <Ionicons name="logo-instagram" size={22} color="#E4405F" />
                  </View>
                </TouchableOpacity>
              )}
              {agentProfile?.facebook && (
                <TouchableOpacity style={styles.socialButton}>
                  <View style={[styles.socialIcon, { backgroundColor: '#1877F220' }]}>
                    <Ionicons name="logo-facebook" size={22} color="#1877F2" />
                  </View>
                </TouchableOpacity>
              )}
              {agentProfile?.linkedin && (
                <TouchableOpacity style={styles.socialButton}>
                  <View style={[styles.socialIcon, { backgroundColor: '#0A66C220' }]}>
                    <Ionicons name="logo-linkedin" size={22} color="#0A66C2" />
                  </View>
                </TouchableOpacity>
              )}
              {agentProfile?.whatsapp && (
                <TouchableOpacity style={styles.socialButton}>
                  <View style={[styles.socialIcon, { backgroundColor: '#25D36620' }]}>
                    <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.properties}</Text>
            <Text style={styles.statLabel}>Imóveis</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.leads}</Text>
            <Text style={styles.statLabel}>Leads</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.visits_today}</Text>
            <Text style={styles.statLabel}>Visitas Hoje</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => navigation.navigate('Settings')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#8b5cf620' }]}>
              <Ionicons name="settings-outline" size={22} color="#8b5cf6" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Definições</Text>
              <Text style={styles.actionDesc}>Notificações, idioma, tema da app</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <View style={[styles.actionIcon, { backgroundColor: '#00d9ff20' }]}>
              <Ionicons name="help-circle-outline" size={22} color="#00d9ff" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Ajuda & Suporte</Text>
              <Text style={styles.actionDesc}>FAQ, contactar suporte</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <View style={[styles.actionIcon, { backgroundColor: '#6b728020' }]}>
              <Ionicons name="document-text-outline" size={22} color="#6b7280" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Termos & Privacidade</Text>
              <Text style={styles.actionDesc}>Políticas e condições de uso</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#fff" />
          <Text style={styles.logoutText}>Terminar Sessão</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Versão 1.0.0</Text>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Perfil</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Basic Info */}
              <Text style={styles.modalSectionTitle}>Informações Básicas</Text>
              
              <Text style={styles.modalLabel}>Nome</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="O seu nome"
                placeholderTextColor="#6b7280"
                value={editName}
                onChangeText={setEditName}
              />

              <Text style={styles.modalLabel}>Telefone</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="+351 900 000 000"
                placeholderTextColor="#6b7280"
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
              />

              <Text style={styles.modalLabel}>Bio</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Escreva uma breve apresentação sobre si..."
                placeholderTextColor="#6b7280"
                value={editBio}
                onChangeText={setEditBio}
                multiline
                numberOfLines={4}
              />

              {/* Social Networks */}
              <Text style={styles.modalSectionTitle}>Redes Sociais</Text>

              {SOCIAL_NETWORKS.map((network) => (
                <View key={network.id}>
                  <Text style={styles.modalLabel}>
                    <Ionicons name={network.icon as any} size={14} color={network.color} /> {network.label}
                  </Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder={network.placeholder}
                    placeholderTextColor="#6b7280"
                    value={
                      network.id === 'instagram' ? editInstagram :
                      network.id === 'facebook' ? editFacebook :
                      network.id === 'linkedin' ? editLinkedin :
                      editWhatsapp
                    }
                    onChangeText={
                      network.id === 'instagram' ? setEditInstagram :
                      network.id === 'facebook' ? setEditFacebook :
                      network.id === 'linkedin' ? setEditLinkedin :
                      setEditWhatsapp
                    }
                  />
                </View>
              ))}

              <Text style={styles.modalNote}>
                As suas redes sociais serão visíveis no seu perfil público no site montra.
              </Text>
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
                onPress={saveProfile}
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
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1f2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#00d9ff',
    overflow: 'hidden',
    marginBottom: 8,
    shadowColor: '#00d9ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    position: 'relative',
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
    position: 'relative',
  },
  avatarInitials: {
    fontSize: 42,
    fontWeight: '700',
    color: '#ffffff',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 36,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLoading: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1f2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLoadingText: {
    fontSize: 10,
    color: '#00d9ff',
    marginTop: 4,
  },
  avatarHint: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 12,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 12,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00d9ff40',
    backgroundColor: '#00d9ff10',
  },
  editProfileText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#00d9ff',
  },
  bioSection: {
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    marginBottom: 16,
  },
  bioText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 22,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  contactSection: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1a1f2e',
    padding: 14,
    borderRadius: 12,
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactText: {
    fontSize: 14,
    color: '#ffffff',
    flex: 1,
  },
  socialSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  socialGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    alignItems: 'center',
  },
  socialIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsSection: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#1a1f2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#00d9ff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#ffffff15',
    marginHorizontal: 10,
  },
  actionsSection: {
    paddingHorizontal: 20,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1f2e',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    gap: 14,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 12,
    color: '#6b7280',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#ef4444',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6b7280',
    marginTop: 16,
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
    maxHeight: '90%',
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
    maxHeight: 500,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00d9ff',
    marginTop: 16,
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
    marginBottom: 8,
    marginTop: 12,
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalNote: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 16,
    fontStyle: 'italic',
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
});
