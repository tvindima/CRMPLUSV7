import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { cloudinaryService } from '../services/cloudinary';

interface PhotoPickerProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
}

// ✅ CONSTANTE LIMITE (fácil alterar)
const MAX_PHOTOS = 30;

// Helper: converter URI local para URL Cloudinary
const uploadToCloudinary = async (uri: string): Promise<string> => {
  try {
    // Se já é URL http, não precisa upload
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      return uri;
    }
    
    const filename = `photo-${Date.now()}.jpg`;
    
    // Web: blob: URI - precisa converter para base64
    if (Platform.OS === 'web' && uri.startsWith('blob:')) {
      const response = await fetch(uri);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const b64 = result.substring(result.indexOf(',') + 1);
          resolve(b64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const url = await cloudinaryService.uploadFile(uri, filename, blob.type || 'image/jpeg', base64);
      console.log('[PhotoPicker] ✅ Uploaded to Cloudinary:', url);
      return url;
    }
    
    // Native: file: URI ou asset-library:
    const url = await cloudinaryService.uploadFile(uri, filename, 'image/jpeg');
    console.log('[PhotoPicker] ✅ Uploaded to Cloudinary:', url);
    return url;
  } catch (error) {
    console.error('[PhotoPicker] ❌ Upload failed:', error);
    throw error;
  }
};

export const PhotoPicker: React.FC<PhotoPickerProps> = ({ photos, onPhotosChange }) => {
  const [loading, setLoading] = useState(false);

  const requestPermissions = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraPermission.status !== 'granted' || galleryPermission.status !== 'granted') {
      Alert.alert(
        'Permissões necessárias',
        'Por favor, permita acesso à câmara e galeria nas definições do dispositivo.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir Definições', onPress: () => {
            Alert.alert('Info', 'Vá a Definições > Aplicações > CRM Plus > Permissões');
          }},
        ]
      );
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    // ✅ VALIDAR limite ANTES de abrir câmara
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert(
        'Limite atingido', 
        `Máximo de ${MAX_PHOTOS} fotos por documento.\n\nRemova fotos existentes para adicionar novas.`
      );
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setLoading(true);

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // Upload imediato para Cloudinary
        const cloudinaryUrl = await uploadToCloudinary(result.assets[0].uri);
        const newPhotos = [...photos, cloudinaryUrl];
        onPhotosChange(newPhotos);
        console.log('[PhotoPicker] ✅ Foto tirada e uploaded:', cloudinaryUrl);
      }
    } catch (error) {
      console.error('[PhotoPicker] ❌ Erro câmara/upload:', error);
      Alert.alert('Erro', 'Erro ao tirar foto ou fazer upload. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const pickFromGallery = async () => {
    // ✅ VALIDAR limite ANTES de abrir galeria
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert(
        'Limite atingido',
        `Máximo de ${MAX_PHOTOS} fotos por documento.\n\nRemova fotos existentes para adicionar novas.`
      );
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    // ✅ CALCULAR quantas fotos ainda pode adicionar
    const remainingSlots = MAX_PHOTOS - photos.length;

    setLoading(true);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        allowsEditing: false,
        quality: 0.8,
        selectionLimit: remainingSlots,  // ✅ Limitar seleção dinâmicamente
      });

      if (!result.canceled && result.assets.length > 0) {
        const newUris = result.assets.map((asset) => asset.uri);
        const totalPhotos = photos.length + newUris.length;
        
        // ✅ VALIDAR total (double-check)
        if (totalPhotos > MAX_PHOTOS) {
          Alert.alert(
            'Limite excedido',
            `Só pode adicionar ${remainingSlots} foto${remainingSlots > 1 ? 's' : ''}.\n\nMáximo: ${MAX_PHOTOS} por documento.`
          );
          return;
        }
        
        // Upload todas as fotos para Cloudinary
        const uploadedUrls: string[] = [];
        for (const uri of newUris) {
          try {
            const cloudinaryUrl = await uploadToCloudinary(uri);
            uploadedUrls.push(cloudinaryUrl);
          } catch (e) {
            console.warn('[PhotoPicker] ⚠️ Falha upload de uma foto:', e);
          }
        }
        
        if (uploadedUrls.length === 0) {
          Alert.alert('Erro', 'Não foi possível fazer upload das fotos. Tente novamente.');
          return;
        }
        
        const newPhotos = [...photos, ...uploadedUrls];
        onPhotosChange(newPhotos);
        console.log('[PhotoPicker] ✅ Fotos uploaded:', uploadedUrls.length);
        
        // ✅ INFO quando atingir limite
        if (newPhotos.length === MAX_PHOTOS) {
          Alert.alert(
            'Limite atingido',
            `${MAX_PHOTOS} fotos adicionadas.\n\nPara adicionar mais, remova fotos existentes.`
          );
        }
      }
    } catch (error) {
      console.error('[PhotoPicker] ❌ Erro galeria:', error);
      Alert.alert('Erro', 'Erro ao selecionar fotos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const removePhoto = (index: number) => {
    Alert.alert(
      'Remover Foto',
      'Tem certeza que deseja remover esta foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            const newPhotos = photos.filter((_, i) => i !== index);
            onPhotosChange(newPhotos);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>📸 Fotos do Imóvel</Text>
        {/* ✅ CONTADOR com progresso */}
        <Text style={[
          styles.counter,
          photos.length >= MAX_PHOTOS && styles.counterMax
        ]}>
          {photos.length}/{MAX_PHOTOS}
        </Text>
      </View>

      {/* Botões Câmara/Galeria */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[
            styles.button, 
            styles.cameraButton,
            photos.length >= MAX_PHOTOS && styles.buttonDisabled
          ]}
          onPress={takePhoto}
          disabled={loading || photos.length >= MAX_PHOTOS}
        >
          <Ionicons name="camera" size={24} color="#fff" />
          <Text style={styles.buttonText}>Tirar Foto</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button, 
            styles.galleryButton,
            photos.length >= MAX_PHOTOS && styles.buttonDisabled
          ]}
          onPress={pickFromGallery}
          disabled={loading || photos.length >= MAX_PHOTOS}
        >
          <Ionicons name="images" size={24} color="#fff" />
          <Text style={styles.buttonText}>Galeria</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>A processar...</Text>
        </View>
      )}

      {/* Grid de Fotos */}
      {photos.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.photoScroll}
          contentContainerStyle={styles.photoScrollContent}
        >
          {photos.map((uri, index) => (
            <View key={`${uri}-${index}`} style={styles.photoContainer}>
              <Image source={{ uri }} style={styles.photo} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removePhoto(index)}
              >
                <Ionicons name="close-circle" size={28} color="#FF3B30" />
              </TouchableOpacity>
              {/* ✅ NÚMERO da foto */}
              <View style={styles.photoNumber}>
                <Text style={styles.photoNumberText}>{index + 1}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {photos.length === 0 && (
        <Text style={styles.hint}>Nenhuma foto adicionada</Text>
      )}

      {/* ✅ HINT quando próximo do limite */}
      {photos.length > 0 && photos.length < MAX_PHOTOS && (
        <Text style={styles.remainingText}>
          Pode adicionar mais {MAX_PHOTOS - photos.length} foto{MAX_PHOTOS - photos.length > 1 ? 's' : ''}
        </Text>
      )}

      {/* ✅ WARNING quando limite atingido */}
      {photos.length >= MAX_PHOTOS && (
        <View style={styles.maxWarning}>
          <Ionicons name="warning" size={16} color="#FF9500" />
          <Text style={styles.maxWarningText}>
            Limite máximo atingido ({MAX_PHOTOS} fotos)
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  counter: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  counterMax: {
    color: '#FF9500',
    backgroundColor: '#2C1C0E',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  cameraButton: {
    backgroundColor: '#007AFF',
  },
  galleryButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  loadingText: {
    color: '#888',
    marginLeft: 8,
    fontSize: 14,
  },
  photoScroll: {
    marginTop: 4,
  },
  photoScrollContent: {
    paddingRight: 12,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 12,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#1C1C1E',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#000',
    borderRadius: 14,
  },
  photoNumber: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  photoNumberText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  hint: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  remainingText: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  maxWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C1C0E',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  maxWarningText: {
    color: '#FF9500',
    fontSize: 13,
    fontWeight: '600',
  },
});
