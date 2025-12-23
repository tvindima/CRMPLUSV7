import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { firstImpressionService } from '../services/firstImpressionService';
import { PhotoPicker } from '../components/PhotoPicker';

export default function FirstImpressionFormScreen({ navigation, route }) {
  const impressionId = route.params?.impressionId;
  const isEditMode = !!impressionId;

  // Estados Cliente
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [referredBy, setReferredBy] = useState('');

  // Estados CMI
  const [artigoMatricial, setArtigoMatricial] = useState('');
  const [tipologia, setTipologia] = useState('');
  const [areaBruta, setAreaBruta] = useState('');
  const [areaUtil, setAreaUtil] = useState('');
  const [estadoConservacao, setEstadoConservacao] = useState('');
  const [valorEstimado, setValorEstimado] = useState('');

  // Estados Localização
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');

  // Estados Fotos
  const [photos, setPhotos] = useState([]);

  // Estados Observações
  const [observations, setObservations] = useState('');

  // Estados UI
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // GPS AUTOMÁTICO ao montar componente
  useEffect(() => {
    if (isEditMode) {
      loadImpressionData();
    } else {
      getCurrentLocation();
    }
  }, []);

  const loadImpressionData = async () => {
    try {
      setLoadingData(true);
      const data = await firstImpressionService.getById(impressionId);

      setClientName(data.client_name || '');
      setClientPhone(data.client_phone || '');
      setClientEmail(data.client_email || '');
      setReferredBy(data.referred_by || '');
      
      setArtigoMatricial(data.artigo_matricial || '');
      setTipologia(data.tipologia || '');
      setAreaBruta(data.area_bruta?.toString() || '');
      setAreaUtil(data.area_util?.toString() || '');
      setEstadoConservacao(data.estado_conservacao || '');
      setValorEstimado(data.valor_estimado?.toString() || '');
      
      setLocation(data.location || '');
      setLatitude(data.latitude);
      setLongitude(data.longitude);
      
      setPhotos(data.photos || []);
      
      setObservations(data.observations || '');
    } catch (error) {
      console.error('Erro ao carregar:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados');
      navigation.goBack();
    } finally {
      setLoadingData(false);
    }
  };

  const getCurrentLocation = async () => {
    setGpsLoading(true);
    setGpsError('');

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setGpsError('Permissão GPS negada');
        setGpsLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);
      console.log('[GPS] ✅ Localização obtida:', loc.coords);
      setGpsLoading(false);
    } catch (error) {
      console.error('[GPS] ❌ Erro:', error);
      setGpsError('Erro ao obter GPS');
      setGpsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!clientName.trim()) {
      Alert.alert('Erro', 'Nome do cliente é obrigatório');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        client_name: clientName,
        client_phone: clientPhone || null,
        client_email: clientEmail || null,
        referred_by: referredBy || null,
        artigo_matricial: artigoMatricial || null,
        tipologia: tipologia || null,
        area_bruta: areaBruta ? parseFloat(areaBruta) : null,
        area_util: areaUtil ? parseFloat(areaUtil) : null,
        estado_conservacao: estadoConservacao || null,
        valor_estimado: valorEstimado ? parseFloat(valorEstimado) : null,
        location: location || null,
        latitude: latitude,
        longitude: longitude,
        photos: photos.length > 0 ? photos : null,
        observations: observations || null,
      };

      if (isEditMode) {
        await firstImpressionService.update(impressionId, payload);
        Alert.alert('Sucesso', 'Documento atualizado com sucesso!');
      } else {
        await firstImpressionService.create(payload);
        Alert.alert('Sucesso', 'Documento criado com sucesso!');
      }

      navigation.goBack();
    } catch (error) {
      console.error('[Form] ❌ Erro:', error);
      Alert.alert('Erro', error.message || 'Erro ao salvar documento');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00d9ff" />
        <Text style={styles.loadingText}>A carregar...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        
        {/* SEÇÃO CMI - PROEMINENTE NO TOPO */}
        <View style={styles.cmiSection}>
          <View style={styles.cmiSectionHeader}>
            <Ionicons name="document-text" size={24} color="#8b5cf6" />
            <Text style={styles.cmiSectionTitle}>📋 Contrato de Mediação (CMI)</Text>
          </View>
          <Text style={styles.cmiSectionHint}>
            Fotografe os documentos do proprietário para preencher automaticamente o CMI
          </Text>
          
          <TouchableOpacity
            style={styles.cmiMainButton}
            onPress={() => {
              if (isEditMode) {
                navigation.navigate('CMIForm', { firstImpressionId: impressionId });
              } else {
                Alert.alert(
                  'Guardar Primeiro',
                  'Guarde primeiro o documento de Primeira Impressão antes de criar o CMI.',
                  [{ text: 'OK' }]
                );
              }
            }}
          >
            <Ionicons name="camera" size={22} color="#fff" />
            <View style={styles.cmiButtonContent}>
              <Text style={styles.cmiMainButtonText}>Preencher CMI com Fotos</Text>
              <Text style={styles.cmiMainButtonSubtext}>CC, Caderneta Predial, Certidão...</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* SEÇÃO CLIENTE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Dados do Cliente</Text>
          <Text style={styles.hint}>
            Pode usar nome genérico se não for cliente direto (ex: "Amigo de João Silva")
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nome Completo *</Text>
            <TextInput
              style={styles.input}
              value={clientName}
              onChangeText={setClientName}
              placeholder="Ex: João Silva ou Amigo de Maria"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Referenciado por (opcional)</Text>
            <TextInput
              style={styles.input}
              value={referredBy}
              onChangeText={setReferredBy}
              placeholder="Ex: Tiago Menino, Maria Costa"
              placeholderTextColor="#666"
            />
            <Text style={styles.fieldHint}>Quem indicou este cliente/imóvel</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Telefone (opcional)</Text>
            <TextInput
              style={styles.input}
              value={clientPhone}
              onChangeText={setClientPhone}
              placeholder="+351 912 345 678"
              placeholderTextColor="#666"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email (opcional)</Text>
            <TextInput
              style={styles.input}
              value={clientEmail}
              onChangeText={setClientEmail}
              placeholder="cliente@example.com"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* SEÇÃO LOCALIZAÇÃO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Localização do Imóvel</Text>

          {/* GPS Status */}
          <View style={styles.gpsContainer}>
            {gpsLoading ? (
              <View style={styles.gpsLoading}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.gpsLoadingText}>A detetar GPS...</Text>
              </View>
            ) : latitude && longitude ? (
              <View style={styles.gpsSuccess}>
                <Ionicons name="location" size={20} color="#34C759" />
                <Text style={styles.gpsSuccessText}>
                  GPS: {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </Text>
              </View>
            ) : (
              <View style={styles.gpsError}>
                <Ionicons name="location-outline" size={20} color="#FF3B30" />
                <Text style={styles.gpsErrorText}>
                  {gpsError || 'GPS não disponível'}
                </Text>
                <TouchableOpacity onPress={getCurrentLocation} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Tentar novamente</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Morada</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={location}
              onChangeText={setLocation}
              placeholder="Rua, Cidade, Código Postal"
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
            />
            <Text style={styles.fieldHint}>Insira a morada manualmente</Text>
          </View>
        </View>

        {/* SEÇÃO FOTOS */}
        <View style={styles.section}>
          <PhotoPicker photos={photos} onPhotosChange={setPhotos} />
        </View>

        {/* SEÇÃO CMI */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📄 Dados CMI (Caderneta Predial)</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Artigo Matricial</Text>
            <TextInput
              style={styles.input}
              value={artigoMatricial}
              onChangeText={setArtigoMatricial}
              placeholder="Ex: 1234-2024"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Tipologia</Text>
              <TextInput
                style={styles.input}
                value={tipologia}
                onChangeText={setTipologia}
                placeholder="Ex: T3"
                placeholderTextColor="#666"
              />
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Estado</Text>
              <TextInput
                style={styles.input}
                value={estadoConservacao}
                onChangeText={setEstadoConservacao}
                placeholder="Ex: Bom"
                placeholderTextColor="#666"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Área Bruta (m²)</Text>
              <TextInput
                style={styles.input}
                value={areaBruta}
                onChangeText={setAreaBruta}
                placeholder="120.50"
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Área Útil (m²)</Text>
              <TextInput
                style={styles.input}
                value={areaUtil}
                onChangeText={setAreaUtil}
                placeholder="95.30"
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Valor Estimado (€)</Text>
            <TextInput
              style={styles.input}
              value={valorEstimado}
              onChangeText={setValorEstimado}
              placeholder="180000.00"
              placeholderTextColor="#666"
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* SEÇÃO OBSERVAÇÕES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Observações</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={observations}
              onChangeText={setObservations}
              placeholder="Notas adicionais sobre o imóvel ou cliente..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={5}
            />
          </View>
        </View>

        {/* BOTÃO SUBMIT */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEditMode ? 'Atualizar Documento' : 'Criar Documento'}
            </Text>
          )}
        </TouchableOpacity>

        {/* BOTÃO CMI - Só aparece em modo edição */}
        {isEditMode && (
          <TouchableOpacity
            style={styles.cmiButton}
            onPress={() => navigation.navigate('CMIForm', { firstImpressionId: impressionId })}
          >
            <Ionicons name="document-text" size={20} color="#fff" />
            <Text style={styles.cmiButtonText}>Criar CMI (Contrato de Mediação)</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    color: '#888',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#38383A',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  fieldHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  gpsContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#38383A',
  },
  gpsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gpsLoadingText: {
    fontSize: 14,
    color: '#888',
    marginLeft: 8,
  },
  gpsSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gpsSuccessText: {
    fontSize: 14,
    color: '#34C759',
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  gpsError: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  gpsErrorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginLeft: 8,
  },
  retryButton: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  retryButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  cmiButton: {
    flexDirection: 'row',
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  cmiButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  // Estilos para secção CMI proeminente
  cmiSection: {
    backgroundColor: '#1a1025',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  cmiSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  cmiSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  cmiSectionHint: {
    fontSize: 13,
    color: '#a78bfa',
    marginBottom: 16,
    lineHeight: 18,
  },
  cmiMainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  cmiButtonContent: {
    flex: 1,
  },
  cmiMainButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  cmiMainButtonSubtext: {
    fontSize: 12,
    color: '#ddd6fe',
    marginTop: 2,
  },
});
