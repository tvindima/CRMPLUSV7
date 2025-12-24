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
import { preAngariacaoService } from '../services/preAngariacaoService';
import { Linking } from 'react-native';

export default function FirstImpressionFormScreen({ navigation, route }) {
  const initialId = route.params?.impressionId ?? null;
  const initialPreAngId = route.params?.preAngariacaoId ?? null;
  const [impressionId, setImpressionId] = useState<number | null>(initialId);
  const [preAngariacaoId, setPreAngariacaoId] = useState<number | null>(initialPreAngId);
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

  // Estados Fotos/Documentos
  const [photos, setPhotos] = useState([]);
  const [attachments, setAttachments] = useState<{ name: string; url: string; type?: string }[]>([]);

  // Estados Observações
  const [observations, setObservations] = useState('');

  // Estados UI
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [status, setStatus] = useState<'draft' | 'signed' | 'completed' | 'cancelled'>('draft');

  // GPS AUTOMÁTICO ao montar componente
  useEffect(() => {
    if (isEditMode && impressionId) {
      loadImpressionData(impressionId);
    } else {
      getCurrentLocation();
    }
  }, [impressionId]);

  const loadImpressionData = async (id: number) => {
    try {
      setLoadingData(true);
      const data = await firstImpressionService.getById(id);

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
      setAttachments(data.attachments || []);

      // Buscar pré-angariação ligada
      try {
        const pre = await preAngariacaoService.getByFirstImpression(id);
        if (pre?.id) setPreAngariacaoId(pre.id);
      } catch (e) {
        // silencioso se não existir ainda
      }
      
      setObservations(data.observations || '');
      setStatus((data.status as any) || 'draft');
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

  const buildPayload = () => ({
    client_name: clientName,
    client_phone: clientPhone && clientPhone.trim().length >= 9 ? clientPhone : null,
    client_email: clientEmail?.trim() ? clientEmail.trim() : null,
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
    attachments: attachments.length > 0 ? attachments : null,
    observations: observations || null,
  });

  const handleSubmit = async () => {
    if (!clientName.trim()) {
      Alert.alert('Erro', 'Nome do cliente é obrigatório');
      return;
    }

    setLoading(true);

    try {
      const payload = buildPayload();

      if (isEditMode && impressionId) {
        await firstImpressionService.update(impressionId, payload);
        Alert.alert('Sucesso', 'Documento atualizado com sucesso!');
        setStatus((prev) => prev); // status permanece
      } else {
        const created = await firstImpressionService.create(payload);
        setImpressionId(created.id);
        if (created.status) setStatus(created.status as any);
        // Criar pré-angariação ligada a esta 1ª impressão
        try {
          const pre = await preAngariacaoService.createFromFirstImpression(created.id);
          if (pre?.id) setPreAngariacaoId(pre.id);
        } catch (e) {
          console.warn('Pré-angariação não criada automaticamente:', e);
        }
        Alert.alert('Sucesso', 'Documento criado e pasta de pré-angariação aberta!');
      }

      navigation.goBack();
    } catch (error: any) {
      console.error('[Form] ❌ Erro:', error);
      const message = error?.detail || error?.message || 'Erro ao salvar documento';
      Alert.alert('Erro', message);
    } finally {
      setLoading(false);
    }
  };

  const ensureCMI = async () => {
    const workingName = clientName?.trim() || '';
    const nameParts = workingName.split(/\s+/).filter(Boolean);
    if (nameParts.length < 2) {
      Alert.alert(
        'Preencha o nome',
        'Indique nome e apelido para avançar (ex.: João Silva).'
      );
      return;
    }

    // Já existe? Navega de imediato
    if (impressionId) {
      let targetPreId = preAngariacaoId;
      if (!targetPreId) {
        try {
          const pre = await preAngariacaoService.getByFirstImpression(impressionId);
          if (pre?.id) {
            targetPreId = pre.id;
            setPreAngariacaoId(pre.id);
          }
        } catch (e) {
          console.warn('Pré-angariação não encontrada ao abrir CMI:', e);
        }
      }
      navigation.navigate('CMIForm', { firstImpressionId: impressionId, preAngariacaoId: targetPreId || undefined });
      return;
    }

    // Criar rascunho rápido e ir para CMI
    setLoading(true);
    try {
      const payload = {
        ...buildPayload(),
        client_name: workingName, // garantir mínimo 2 palavras
      };
      const created = await firstImpressionService.create(payload);
      setImpressionId(created.id);
      if (created.status) setStatus(created.status as any);
      let createdPreId: number | null = null;
      try {
        const pre = await preAngariacaoService.createFromFirstImpression(created.id);
        if (pre?.id) {
          createdPreId = pre.id;
          setPreAngariacaoId(pre.id);
        }
      } catch (e: any) {
        console.warn('Pré-angariação não criada automaticamente:', e);
      }
      navigation.navigate('CMIForm', { firstImpressionId: created.id, preAngariacaoId: createdPreId || undefined });
    } catch (error: any) {
      console.error('[CMI] ❌ Erro ao criar rascunho:', error);
      const message = error?.detail || error?.message || 'Não foi possível abrir o CMI.';
      Alert.alert('Erro', message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (nextStatus: 'completed' | 'cancelled') => {
    if (!impressionId) return;
    if (status === 'completed' || status === 'cancelled') return;

    const label = nextStatus === 'completed' ? 'concluir' : 'cancelar';
    Alert.alert(
      `Confirmar ${label}`,
      `Tem a certeza que deseja ${label} este documento?`,
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await firstImpressionService.update(impressionId, { status: nextStatus });
              setStatus(nextStatus);
              Alert.alert('Sucesso', `Documento ${label}do.`);
            } catch (error: any) {
              console.error('[Status] ❌ Erro:', error);
              Alert.alert('Erro', error.message || 'Não foi possível atualizar o status');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
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
           style={[styles.cmiMainButton, loading && { opacity: 0.6 }]}
           onPress={ensureCMI}
           disabled={loading}
         >
           <Ionicons name="camera" size={22} color="#fff" />
           <View style={styles.cmiButtonContent}>
             <Text style={styles.cmiMainButtonText}>Preencher CMI com Fotos</Text>
             <Text style={styles.cmiMainButtonSubtext}>CC, Caderneta Predial, Certidão...</Text>
           </View>
           <Ionicons name="chevron-forward" size={20} color="#fff" />
         </TouchableOpacity>

          {/* Assinatura direta */}
          {impressionId && (
            <TouchableOpacity
              style={[styles.cmiMainButton, { marginTop: 10, backgroundColor: '#111827', borderColor: '#00d9ff', borderWidth: 1 }]}
              onPress={() => navigation.navigate('FirstImpressionSignature' as never, { impressionId, clientName } as never)}
            >
              <Ionicons name="create-outline" size={20} color="#00d9ff" />
              <View style={styles.cmiButtonContent}>
                <Text style={[styles.cmiMainButtonText, { color: '#00d9ff' }]}>Assinar documento</Text>
                <Text style={[styles.cmiMainButtonSubtext, { color: '#9ca3af' }]}>Assinatura digital do cliente</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#00d9ff" />
            </TouchableOpacity>
          )}
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
              nativeID="client_name"
              name="client_name"
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
              nativeID="referred_by"
              name="referred_by"
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
              nativeID="client_phone"
              name="client_phone"
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
              nativeID="client_email"
              name="client_email"
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
              nativeID="imovel_morada"
              name="imovel_morada"
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

        {/* SEÇÃO DOCUMENTOS */}
        <View style={styles.section}>
          <View style={styles.attachHeader}>
            <Text style={styles.sectionTitle}>📄 Documentos anexados</Text>
          </View>

          {attachments.length === 0 ? (
            <Text style={styles.emptyAttachments}>Sem documentos anexados.</Text>
          ) : (
            attachments.map((att, idx) => (
              <TouchableOpacity
                key={`${att.url}-${idx}`}
                style={styles.attachmentItem}
                onPress={() => Linking.openURL(att.url)}
              >
                <View style={styles.attachmentInfo}>
                  <Ionicons name="document-text-outline" size={18} color="#9ca3af" />
                  <View>
                    <Text style={styles.attachmentName}>{att.name}</Text>
                    {att.type && <Text style={styles.attachmentMeta}>{att.type}</Text>}
                  </View>
                </View>
                <Ionicons name="open-outline" size={18} color="#00d9ff" />
              </TouchableOpacity>
            ))
          )}
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

        {/* AÇÕES DE STATUS */}
        {impressionId && (
          <View style={styles.statusActions}>
            <TouchableOpacity
              style={[
                styles.statusButton,
                { backgroundColor: '#10b981' },
                (status === 'completed' || status === 'cancelled') && styles.statusButtonDisabled,
              ]}
              disabled={status === 'completed' || status === 'cancelled'}
              onPress={() => handleStatusChange('completed')}
            >
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={styles.statusButtonText}>Marcar como Concluído</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.statusButton,
                { backgroundColor: '#ef4444' },
                (status === 'completed' || status === 'cancelled') && styles.statusButtonDisabled,
              ]}
              disabled={status === 'completed' || status === 'cancelled'}
              onPress={() => handleStatusChange('cancelled')}
            >
              <Ionicons name="close-circle" size={18} color="#fff" />
              <Text style={styles.statusButtonText}>Cancelar documento</Text>
            </TouchableOpacity>

            <Text style={styles.statusLabel}>Status atual: {status}</Text>
          </View>
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
  statusActions: {
    marginTop: 12,
    gap: 8,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
  },
  statusButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  statusButtonDisabled: {
    opacity: 0.5,
  },
  statusLabel: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 4,
  },
  attachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00d9ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  attachButtonDisabled: {
    opacity: 0.6,
  },
  attachButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  attachmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1f2e',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2d3748',
    marginTop: 8,
  },
  attachmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  attachmentName: {
    color: '#fff',
    fontWeight: '600',
  },
  attachmentMeta: {
    color: '#9ca3af',
    fontSize: 12,
  },
  emptyAttachments: {
    color: '#9ca3af',
    fontSize: 14,
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
