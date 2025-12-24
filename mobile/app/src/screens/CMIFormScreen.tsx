/**
 * CMIFormScreen - Formulário do Contrato de Mediação Imobiliária
 * Layout similar ao CMI em papel com campos pré-preenchidos
 */
import React, { useState, useEffect, useRef } from 'react';
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
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import SignatureScreen from 'react-native-signature-canvas';
import { cmiService, CMI } from '../services/cmiService';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { cloudinaryService } from '../services/cloudinary';
import { preAngariacaoService } from '../services/preAngariacaoService';

interface Props {
  navigation: any;
  route: {
    params?: {
      cmiId?: number;
      firstImpressionId?: number;
      preAngariacaoId?: number;
    };
  };
}

// Tipos de documentos para scan
const DOCUMENT_TYPES = [
  { id: 'cc_frente', label: 'CC - Frente', icon: 'card' },
  { id: 'cc_verso', label: 'CC - Verso', icon: 'card-outline' },
  { id: 'caderneta_predial', label: 'Caderneta Predial', icon: 'document-text' },
  { id: 'certidao_permanente', label: 'Certidão Permanente', icon: 'document' },
  { id: 'licenca_utilizacao', label: 'Licença de Utilização', icon: 'clipboard' },
  { id: 'certificado_energetico', label: 'Certificado Energético', icon: 'flash' },
];

// Estados civis
const ESTADOS_CIVIS = ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União de Facto'];

// Tipos de contrato
const TIPOS_CONTRATO = [
  { id: 'exclusivo', label: 'Exclusivo' },
  { id: 'nao_exclusivo', label: 'Não Exclusivo' },
  { id: 'partilhado', label: 'Partilhado' },
];

export default function CMIFormScreen({ navigation, route }: Props) {
  const cmiId = route.params?.cmiId;
  const firstImpressionId = route.params?.firstImpressionId;
  const preAngariacaoId = route.params?.preAngariacaoId;
  const isEditMode = !!cmiId;

  // Auth context - para obter nome do agente
  const { user } = useAuth();

  // Estados do CMI
  const [cmi, setCmi] = useState<CMI | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // === AGENTE RESPONSÁVEL ===
  const [agenteNome, setAgenteNome] = useState('');
  const [agenteNif, setAgenteNif] = useState('');

  // === SECÇÃO 1: CLIENTE ===
  const [clienteNome, setClienteNome] = useState('');
  const [clienteEstadoCivil, setClienteEstadoCivil] = useState('');
  const [clienteNif, setClienteNif] = useState('');
  const [clienteCc, setClienteCc] = useState('');
  const [clienteCcValidade, setClienteCcValidade] = useState('');
  const [clienteMorada, setClienteMorada] = useState('');
  const [clienteCodigoPostal, setClienteCodigoPostal] = useState('');
  const [clienteLocalidade, setClienteLocalidade] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');

  // === SECÇÃO 2: IMÓVEL ===
  const [imovelTipo, setImovelTipo] = useState('Apartamento');
  const [imovelTipologia, setImovelTipologia] = useState('');
  const [imovelMorada, setImovelMorada] = useState('');
  const [imovelCodigoPostal, setImovelCodigoPostal] = useState('');
  const [imovelFreguesia, setImovelFreguesia] = useState('');
  const [imovelConcelho, setImovelConcelho] = useState('');
  const [imovelArtigoMatricial, setImovelArtigoMatricial] = useState('');
  const [imovelAreaBruta, setImovelAreaBruta] = useState('');
  const [imovelAreaUtil, setImovelAreaUtil] = useState('');
  const [imovelEstadoConservacao, setImovelEstadoConservacao] = useState('');

  // === SECÇÃO 3: CONDIÇÕES ===
  const [tipoContrato, setTipoContrato] = useState('exclusivo');
  const [valorPretendido, setValorPretendido] = useState('');
  const [valorMinimo, setValorMinimo] = useState('');
  const [comissaoPercentagem, setComissaoPercentagem] = useState('5');
  const [prazoMeses, setPrazoMeses] = useState('6');

  // === MODAIS ===
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [currentDocType, setCurrentDocType] = useState('');

  // === ASSINATURAS ===
  const [assinaturaCliente, setAssinaturaCliente] = useState<string | null>(null);

  // Refs
  const signatureRef = useRef<any>(null);

  useEffect(() => {
    loadData();
    loadAgentData();
  }, []);

  const loadAgentData = async () => {
    try {
      // Carregar dados do agente logado
      const statsResponse: any = await apiService.get('/mobile/dashboard/stats');
      if (statsResponse?.agent) {
        const agent = statsResponse.agent;
        setAgenteNome(agent.name || '');
        setAgenteNif(agent.nif || '');
      }
    } catch (error) {
      console.log('Não foi possível carregar dados do agente:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      if (cmiId) {
        // Carregar CMI existente
        const data = await cmiService.getById(cmiId);
        setCmi(data);
        populateFields(data);
      } else if (firstImpressionId) {
        try {
          // Tentar criar novo CMI a partir da 1ª Impressão
          const data = await cmiService.createFromFirstImpression(firstImpressionId);
          setCmi(data);
          populateFields(data);
          Alert.alert('CMI Criado', `Contrato ${data.numero_contrato} criado com sucesso!`);
        } catch (error: any) {
          // Se já existir, buscar e abrir o existente
          if (error?.detail && typeof error.detail === 'string' && error.detail.includes('Já existe CMI')) {
            const existing = await cmiService.getByFirstImpression(firstImpressionId);
            setCmi(existing);
            populateFields(existing);
            Alert.alert('CMI existente', `Abrindo ${existing.numero_contrato} já criado para esta 1ª impressão.`);
          } else {
            throw error;
          }
        }
      }
    } catch (error: any) {
      console.error('Erro ao carregar CMI:', error);
      Alert.alert('Erro', error.message || 'Não foi possível carregar o CMI');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const populateFields = (data: CMI) => {
    // Cliente
    setClienteNome(data.cliente_nome || '');
    setClienteEstadoCivil(data.cliente_estado_civil || '');
    setClienteNif(data.cliente_nif || '');
    setClienteCc(data.cliente_cc || '');
    setClienteCcValidade(data.cliente_cc_validade || '');
    setClienteMorada(data.cliente_morada || '');
    setClienteCodigoPostal(data.cliente_codigo_postal || '');
    setClienteLocalidade(data.cliente_localidade || '');
    setClienteTelefone(data.cliente_telefone || '');
    setClienteEmail(data.cliente_email || '');

    // Imóvel
    setImovelTipo(data.imovel_tipo || 'Apartamento');
    setImovelTipologia(data.imovel_tipologia || '');
    setImovelMorada(data.imovel_morada || '');
    setImovelCodigoPostal(data.imovel_codigo_postal || '');
    setImovelFreguesia(data.imovel_freguesia || '');
    setImovelConcelho(data.imovel_concelho || '');
    setImovelArtigoMatricial(data.imovel_artigo_matricial || '');
    setImovelAreaBruta(data.imovel_area_bruta?.toString() || '');
    setImovelAreaUtil(data.imovel_area_util?.toString() || '');
    setImovelEstadoConservacao(data.imovel_estado_conservacao || '');

    // Condições
    setTipoContrato(data.tipo_contrato || 'exclusivo');
    setValorPretendido(data.valor_pretendido?.toString() || '');
    setValorMinimo(data.valor_minimo?.toString() || '');
    setComissaoPercentagem(data.comissao_percentagem?.toString() || '5');
    setPrazoMeses(data.prazo_meses?.toString() || '6');

    // Assinaturas
    setAssinaturaCliente(data.assinatura_cliente || null);
    setAssinaturaMediador(data.assinatura_mediador || null);
  };

  const handleSave = async () => {
    if (!cmi) return;

    setSaving(true);
    try {
      await cmiService.update(cmi.id, {
        cliente_nome: clienteNome,
        cliente_estado_civil: clienteEstadoCivil || undefined,
        cliente_nif: clienteNif || undefined,
        cliente_cc: clienteCc || undefined,
        cliente_cc_validade: clienteCcValidade || undefined,
        cliente_morada: clienteMorada || undefined,
        cliente_codigo_postal: clienteCodigoPostal || undefined,
        cliente_localidade: clienteLocalidade || undefined,
        cliente_telefone: clienteTelefone || undefined,
        cliente_email: clienteEmail || undefined,
        imovel_tipo: imovelTipo || undefined,
        imovel_tipologia: imovelTipologia || undefined,
        imovel_morada: imovelMorada || undefined,
        imovel_codigo_postal: imovelCodigoPostal || undefined,
        imovel_freguesia: imovelFreguesia || undefined,
        imovel_concelho: imovelConcelho || undefined,
        imovel_artigo_matricial: imovelArtigoMatricial || undefined,
        imovel_area_bruta: imovelAreaBruta ? parseFloat(imovelAreaBruta) : undefined,
        imovel_area_util: imovelAreaUtil ? parseFloat(imovelAreaUtil) : undefined,
        imovel_estado_conservacao: imovelEstadoConservacao || undefined,
        tipo_contrato: tipoContrato,
        valor_pretendido: valorPretendido ? parseFloat(valorPretendido) : undefined,
        valor_minimo: valorMinimo ? parseFloat(valorMinimo) : undefined,
        comissao_percentagem: comissaoPercentagem ? parseFloat(comissaoPercentagem) : undefined,
        prazo_meses: prazoMeses ? parseInt(prazoMeses) : undefined,
        agente_nome: agenteNome || undefined,
      });

      Alert.alert('Sucesso', 'Contrato guardado com sucesso!');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao guardar');
    } finally {
      setSaving(false);
    }
  };

  // === CÂMARA / OCR ===
  const openDocumentScanner = (docType: string) => {
    setCurrentDocType(docType);
    setShowCameraModal(true);
  };

  const persistDocumento = async (fileUri: string, fileName: string, mimeType: string) => {
    if (!preAngariacaoId) return null;
    // Upload para Cloudinary e salvar em pré-angariação
    const url = await cloudinaryService.uploadFile(fileUri, fileName, mimeType);
    const tipoDocumento =
      currentDocType === 'caderneta_predial' ? 'caderneta_predial' :
      currentDocType === 'certidao_permanente' ? 'certidao_permanente' :
      currentDocType === 'licenca_utilizacao' ? 'licenca_utilizacao' :
      currentDocType === 'certificado_energetico' ? 'certificado_energetico' :
      'documentos_proprietario'; // CC frente/verso => documentos_proprietario

    await preAngariacaoService.addDocumento(preAngariacaoId, {
      type: tipoDocumento,
      name: fileName,
      url,
    });

    return url;
  };

  const processOcrFromBase64 = async (base64: string, fileMeta?: { uri: string; name: string; mime: string }) => {
    if (!cmi) {
      Alert.alert('Erro', 'CMI ainda não foi criado.');
      return;
    }
    // Upload e persistir documento
    if (fileMeta) {
      try {
        await persistDocumento(fileMeta.uri, fileMeta.name, fileMeta.mime);
      } catch (e: any) {
        console.warn('[Docs] ❌ Erro ao guardar documento:', e?.message || e);
      }
    }
    // Processar via OCR
    Alert.alert('A Processar', 'A extrair dados do documento...');
    
    const ocrResult = await cmiService.processOCR(
      cmi.id,
      currentDocType,
      base64
    );

    if (ocrResult.sucesso) {
      // Preencher campos automaticamente
      if (currentDocType === 'cc_frente' || currentDocType === 'cc_verso') {
        if (ocrResult.dados_extraidos.nome) {
          setClienteNome(ocrResult.dados_extraidos.nome);
        }
        if (ocrResult.dados_extraidos.nif) {
          setClienteNif(ocrResult.dados_extraidos.nif);
        }
        if (ocrResult.dados_extraidos.numero_documento) {
          setClienteCc(ocrResult.dados_extraidos.numero_documento);
        }
      } else if (currentDocType === 'caderneta_predial') {
        if (ocrResult.dados_extraidos.artigo_matricial) {
          setImovelArtigoMatricial(ocrResult.dados_extraidos.artigo_matricial);
        }
        if (ocrResult.dados_extraidos.area_bruta) {
          setImovelAreaBruta(ocrResult.dados_extraidos.area_bruta);
        }
      }

      Alert.alert(
        'Documento Processado',
        `${ocrResult.mensagem}\n\nConfiança: ${(ocrResult.confianca * 100).toFixed(0)}%\n\nVerifique os campos preenchidos.`
      );
    }
  };

  const captureDocument = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão Negada', 'Precisa permitir acesso à câmara');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0] && cmi) {
        setShowCameraModal(false);
        await processOcrFromBase64(result.assets[0].base64 || '', {
          uri: result.assets[0].uri,
          name: `${currentDocType}-${Date.now()}.jpg`,
          mime: result.assets[0].mimeType || 'image/jpeg',
        });
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao capturar documento');
    }
  };

  const pickDocumentFromLibrary = async (docType: string) => {
    if (!cmi) {
      Alert.alert('Erro', 'CMI ainda não foi criado.');
      return;
    }
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Permita acesso à galeria para anexar o documento.');
        return;
      }

      setCurrentDocType(docType);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        await processOcrFromBase64(result.assets[0].base64 || '', {
          uri: result.assets[0].uri,
          name: result.assets[0].fileName || `${docType}-${Date.now()}.jpg`,
          mime: result.assets[0].mimeType || 'image/jpeg',
        });
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao anexar documento da galeria');
    }
  };

  // === ASSINATURAS ===
  const openSignatureModal = () => {
    setShowSignatureModal(true);
  };

  const handleSignature = async (signature: string) => {
    if (!cmi) return;

    setShowSignatureModal(false);

    try {
      await cmiService.addClientSignature(cmi.id, signature);
      setAssinaturaCliente(signature);
      Alert.alert('Sucesso', 'Assinatura do cliente registada!');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao guardar assinatura');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00d9ff" />
        <Text style={styles.loadingText}>A carregar CMI...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>CONTRATO DE MEDIAÇÃO IMOBILIÁRIA</Text>
          <Text style={styles.contractNumber}>{cmi?.numero_contrato}</Text>
          <View style={[styles.statusBadge, { backgroundColor: cmi?.status === 'assinado' ? '#34C759' : '#FF9500' }]}>
            <Text style={styles.statusText}>{cmi?.status?.toUpperCase()}</Text>
          </View>
        </View>

        {/* SCAN DOCUMENTOS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📷 Digitalizar Documentos</Text>
          <Text style={styles.hint}>Fotografe ou anexe da galeria/ficheiros para preencher automaticamente</Text>
          
          <View style={styles.docList}>
            {DOCUMENT_TYPES.map((doc) => (
              <View key={doc.id} style={styles.docCard}>
                <View style={styles.docInfo}>
                  <Ionicons name={doc.icon as any} size={24} color="#00d9ff" />
                  <Text style={styles.docLabel}>{doc.label}</Text>
                </View>
                <View style={styles.docActions}>
                  <TouchableOpacity
                    style={styles.docButton}
                    onPress={() => openDocumentScanner(doc.id)}
                  >
                    <Ionicons name="camera" size={16} color="#fff" />
                    <Text style={styles.docButtonText}>Fotografar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.docButton, styles.docButtonAlt]}
                    onPress={() => pickDocumentFromLibrary(doc.id)}
                  >
                    <Ionicons name="images" size={16} color="#fff" />
                    <Text style={styles.docButtonText}>Anexar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* SECÇÃO 1: DADOS DO CLIENTE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 PRIMEIRO OUTORGANTE (Cliente)</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nome Completo *</Text>
            <TextInput
              style={styles.input}
              value={clienteNome}
              onChangeText={setClienteNome}
              placeholder="Nome completo"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>NIF</Text>
              <TextInput
                style={styles.input}
                value={clienteNif}
                onChangeText={setClienteNif}
                placeholder="123456789"
                placeholderTextColor="#666"
                keyboardType="number-pad"
                maxLength={9}
              />
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>CC/BI</Text>
              <TextInput
                style={styles.input}
                value={clienteCc}
                onChangeText={setClienteCc}
                placeholder="12345678"
                placeholderTextColor="#666"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Estado Civil</Text>
            <View style={styles.chipContainer}>
              {ESTADOS_CIVIS.map((estado) => (
                <TouchableOpacity
                  key={estado}
                  style={[styles.chip, clienteEstadoCivil === estado && styles.chipSelected]}
                  onPress={() => setClienteEstadoCivil(estado)}
                >
                  <Text style={[styles.chipText, clienteEstadoCivil === estado && styles.chipTextSelected]}>
                    {estado}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Morada</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={clienteMorada}
              onChangeText={setClienteMorada}
              placeholder="Rua, Nº, Andar"
              placeholderTextColor="#666"
              multiline
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Text style={styles.label}>Código Postal</Text>
              <TextInput
                style={styles.input}
                value={clienteCodigoPostal}
                onChangeText={setClienteCodigoPostal}
                placeholder="1000-000"
                placeholderTextColor="#666"
              />
            </View>

            <View style={[styles.inputContainer, { flex: 2, marginLeft: 10 }]}>
              <Text style={styles.label}>Localidade</Text>
              <TextInput
                style={styles.input}
                value={clienteLocalidade}
                onChangeText={setClienteLocalidade}
                placeholder="Lisboa"
                placeholderTextColor="#666"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Telefone</Text>
              <TextInput
                style={styles.input}
                value={clienteTelefone}
                onChangeText={setClienteTelefone}
                placeholder="912 345 678"
                placeholderTextColor="#666"
                keyboardType="phone-pad"
              />
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={clienteEmail}
                onChangeText={setClienteEmail}
                placeholder="email@exemplo.com"
                placeholderTextColor="#666"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        {/* SECÇÃO 2: DADOS DO IMÓVEL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏠 IMÓVEL</Text>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Tipo</Text>
              <TextInput
                style={styles.input}
                value={imovelTipo}
                onChangeText={setImovelTipo}
                placeholder="Apartamento"
                placeholderTextColor="#666"
              />
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Tipologia</Text>
              <TextInput
                style={styles.input}
                value={imovelTipologia}
                onChangeText={setImovelTipologia}
                placeholder="T3"
                placeholderTextColor="#666"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Morada do Imóvel</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={imovelMorada}
              onChangeText={setImovelMorada}
              placeholder="Endereço completo do imóvel"
              placeholderTextColor="#666"
              multiline
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Freguesia</Text>
              <TextInput
                style={styles.input}
                value={imovelFreguesia}
                onChangeText={setImovelFreguesia}
                placeholder="Freguesia"
                placeholderTextColor="#666"
              />
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Concelho</Text>
              <TextInput
                style={styles.input}
                value={imovelConcelho}
                onChangeText={setImovelConcelho}
                placeholder="Concelho"
                placeholderTextColor="#666"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Artigo Matricial</Text>
            <TextInput
              style={styles.input}
              value={imovelArtigoMatricial}
              onChangeText={setImovelArtigoMatricial}
              placeholder="Nº da Caderneta Predial"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Área Bruta (m²)</Text>
              <TextInput
                style={styles.input}
                value={imovelAreaBruta}
                onChangeText={setImovelAreaBruta}
                placeholder="120"
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Área Útil (m²)</Text>
              <TextInput
                style={styles.input}
                value={imovelAreaUtil}
                onChangeText={setImovelAreaUtil}
                placeholder="95"
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>

        {/* SECÇÃO 3: CONDIÇÕES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 CONDIÇÕES DO CONTRATO</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tipo de Contrato</Text>
            <View style={styles.chipContainer}>
              {TIPOS_CONTRATO.map((tipo) => (
                <TouchableOpacity
                  key={tipo.id}
                  style={[styles.chip, tipoContrato === tipo.id && styles.chipSelected]}
                  onPress={() => setTipoContrato(tipo.id)}
                >
                  <Text style={[styles.chipText, tipoContrato === tipo.id && styles.chipTextSelected]}>
                    {tipo.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Valor Pretendido (€)</Text>
              <TextInput
                style={styles.input}
                value={valorPretendido}
                onChangeText={setValorPretendido}
                placeholder="250000"
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Valor Mínimo (€)</Text>
              <TextInput
                style={styles.input}
                value={valorMinimo}
                onChangeText={setValorMinimo}
                placeholder="230000"
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Comissão (%)</Text>
              <TextInput
                style={styles.input}
                value={comissaoPercentagem}
                onChangeText={setComissaoPercentagem}
                placeholder="5"
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Prazo (meses)</Text>
              <TextInput
                style={styles.input}
                value={prazoMeses}
                onChangeText={setPrazoMeses}
                placeholder="6"
                placeholderTextColor="#666"
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>

        {/* SECÇÃO 4: ANGARIADOR RESPONSÁVEL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 ANGARIADOR RESPONSÁVEL</Text>
          <Text style={styles.hint}>Dados preenchidos automaticamente com base no login</Text>

          <View style={styles.agentInfoBox}>
            <View style={styles.agentInfoRow}>
              <Ionicons name="person" size={20} color="#00d9ff" />
              <Text style={styles.agentInfoLabel}>Nome:</Text>
              <Text style={styles.agentInfoValue}>{agenteNome || 'A carregar...'}</Text>
            </View>
            {agenteNif && (
              <View style={styles.agentInfoRow}>
                <Ionicons name="document-text" size={20} color="#00d9ff" />
                <Text style={styles.agentInfoLabel}>NIF:</Text>
                <Text style={styles.agentInfoValue}>{agenteNif}</Text>
              </View>
            )}
          </View>
        </View>

        {/* SECÇÃO 5: ASSINATURAS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✍️ ASSINATURAS</Text>
          <Text style={styles.hint}>Assinatura apenas do(s) proprietário(s)</Text>

          <View style={styles.signatureRow}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Proprietário / Cliente</Text>
              {assinaturaCliente ? (
                <View style={styles.signatureWithImage}>
                  <Image
                    source={{ uri: assinaturaCliente }}
                    style={styles.signatureImage}
                    resizeMode="contain"
                  />
                  <TouchableOpacity
                    style={styles.resignButton}
                    onPress={() => {
                      setAssinaturaCliente(null);
                      openSignatureModal();
                    }}
                  >
                    <Ionicons name="refresh" size={16} color="#fff" />
                    <Text style={styles.resignText}>Reassinar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.signatureButton}
                  onPress={() => openSignatureModal()}
                >
                  <Ionicons name="finger-print" size={48} color="#00d9ff" />
                  <Text style={styles.signatureButtonText}>Toque para Assinar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* BOTÃO GUARDAR */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="save" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Guardar Contrato</Text>
            </>
          )}
        </TouchableOpacity>

        {/* BOTÃO GERAR PDF */}
        <TouchableOpacity
          style={styles.pdfButton}
          onPress={() => Alert.alert('Em breve', 'Geração de PDF será implementada')}
        >
          <Ionicons name="document" size={20} color="#fff" />
          <Text style={styles.pdfButtonText}>Gerar PDF</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* MODAL ASSINATURA - Fullscreen como entregas de estafetas */}
      <Modal visible={showSignatureModal} animationType="slide">
        <View style={styles.signatureModal}>
          <View style={styles.signatureHeader}>
            <TouchableOpacity 
              style={styles.signatureCloseButton}
              onPress={() => setShowSignatureModal(false)}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <View style={styles.signatureHeaderCenter}>
              <Ionicons name="person" size={24} color="#00d9ff" />
              <Text style={styles.signatureModalTitle}>Assinatura do Proprietário</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.signatureInstructions}>
            <Text style={styles.signatureInstructionsText}>
              ✍️ Assine com o dedo na área abaixo
            </Text>
          </View>
          
          <View style={styles.signatureCanvasContainer}>
            <SignatureScreen
              ref={signatureRef}
              onOK={handleSignature}
              onEmpty={() => Alert.alert('Aviso', 'Por favor assine primeiro')}
              descriptionText=""
              clearText="Limpar"
              confirmText="Confirmar Assinatura"
              webStyle={`
                .m-signature-pad { 
                  background-color: #ffffff; 
                  border-radius: 12px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .m-signature-pad--body { 
                  border: none; 
                }
                .m-signature-pad--footer { 
                  background-color: #0a0e1a; 
                  padding: 16px;
                  margin-top: 16px;
                }
                .m-signature-pad--footer .button { 
                  background-color: #00d9ff; 
                  color: #000;
                  font-weight: bold;
                  padding: 16px 32px;
                  border-radius: 12px;
                  font-size: 16px;
                }
                .m-signature-pad--footer .button.clear {
                  background-color: #ef4444;
                  color: white;
                }
              `}
              penColor="#000"
              backgroundColor="#ffffff"
            />
          </View>

          <View style={styles.signatureLegalText}>
            <Text style={styles.legalText}>
              Ao assinar, confirmo que li e aceito os termos do contrato de mediação imobiliária.
            </Text>
          </View>
        </View>
      </Modal>

      {/* MODAL CÂMARA */}
      <Modal visible={showCameraModal} animationType="slide">
        <View style={styles.cameraModal}>
          <View style={styles.cameraHeader}>
            <Text style={styles.cameraTitle}>
              Fotografar: {DOCUMENT_TYPES.find(d => d.id === currentDocType)?.label}
            </Text>
            <TouchableOpacity onPress={() => setShowCameraModal(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.cameraInstructions}>
            <Ionicons name="camera" size={48} color="#00d9ff" />
            <Text style={styles.cameraText}>
              Posicione o documento dentro do enquadramento
            </Text>
            <Text style={styles.cameraHint}>
              Certifique-se de que há boa iluminação
            </Text>
          </View>

          <TouchableOpacity style={styles.captureButton} onPress={captureDocument}>
            <Ionicons name="camera" size={32} color="#fff" />
            <Text style={styles.captureButtonText}>Fotografar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0e1a',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  contractNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#00d9ff',
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  hint: {
    color: '#888',
    fontSize: 12,
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 12,
  },
  label: {
    color: '#888',
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#0a0e1a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfWidth: {
    flex: 1,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#0a0e1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  chipSelected: {
    backgroundColor: '#00d9ff',
    borderColor: '#00d9ff',
  },
  chipText: {
    color: '#888',
    fontSize: 12,
  },
  chipTextSelected: {
    color: '#000',
    fontWeight: '600',
  },
  docList: {
    gap: 10,
  },
  docCard: {
    backgroundColor: '#0a0e1a',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  docInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  docLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  docActions: {
    flexDirection: 'row',
    gap: 10,
  },
  docButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00d9ff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  docButtonAlt: {
    backgroundColor: '#8b5cf6',
  },
  docButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  signatureRow: {
    flexDirection: 'row',
    gap: 12,
  },
  signatureBox: {
    flex: 1,
    backgroundColor: '#0a0e1a',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#333',
  },
  signatureLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
  },
  signatureButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  signatureButtonText: {
    color: '#00d9ff',
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  signatureWithImage: {
    flex: 1,
    width: '100%',
  },
  signatureImage: {
    width: '100%',
    height: 60,
    marginBottom: 8,
  },
  resignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  resignText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00d9ff',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginTop: 12,
  },
  pdfButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  signatureModal: {
    flex: 1,
    backgroundColor: '#0a0e1a',
  },
  signatureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#1a1f2e',
  },
  signatureCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ef444440',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signatureHeaderCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signatureModalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  signatureInstructions: {
    padding: 16,
    alignItems: 'center',
  },
  signatureInstructionsText: {
    color: '#888',
    fontSize: 14,
  },
  signatureCanvasContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  signatureLegalText: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#1a1f2e',
  },
  legalText: {
    color: '#666',
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  cameraModal: {
    flex: 1,
    backgroundColor: '#0a0e1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1f2e',
  },
  cameraTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cameraInstructions: {
    alignItems: 'center',
    padding: 32,
  },
  cameraText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  cameraHint: {
    color: '#888',
    fontSize: 12,
    marginTop: 8,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00d9ff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
    marginTop: 32,
  },
  captureButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  // === ESTILOS DO AGENTE ===
  agentInfoBox: {
    backgroundColor: '#0a0e1a',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#00d9ff30',
  },
  agentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  agentInfoLabel: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
    width: 50,
  },
  agentInfoValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
