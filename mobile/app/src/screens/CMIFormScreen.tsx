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
import { firstImpressionService } from '../services/firstImpressionService';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { cloudinaryService } from '../services/cloudinary';
import { preAngariacaoService } from '../services/preAngariacaoService';
import { clientService } from '../services/clientService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/config';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

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

// Tipos de documentos para scan - SIMPLIFICADO com suporte a múltiplos
const DOCUMENT_CATEGORIES = [
  { 
    id: 'cc', 
    label: 'Cartão de Cidadão', 
    icon: 'card',
    hint: 'Adicione todos os CCs necessários (proprietários, herdeiros, cônjuges)',
    ocrType: 'cc_frente', // Tipo para OCR
  },
  { 
    id: 'caderneta_predial', 
    label: 'Caderneta Predial', 
    icon: 'document-text',
    hint: 'Uma caderneta por cada imóvel/artigo matricial',
    ocrType: 'caderneta_predial',
  },
  { 
    id: 'certidao_permanente', 
    label: 'Certidão Permanente', 
    icon: 'document',
    hint: 'Certidão de registo de cada imóvel',
    ocrType: 'certidao_permanente',
  },
  { 
    id: 'certificado_energetico', 
    label: 'Certificado Energético', 
    icon: 'flash',
    hint: 'Certificado de cada imóvel',
    ocrType: 'certificado_energetico',
  },
  { 
    id: 'licenca_utilizacao', 
    label: 'Licença de Utilização', 
    icon: 'clipboard',
    hint: 'Licença de habitação/utilização',
    ocrType: 'licenca_utilizacao',
  },
  { 
    id: 'outros', 
    label: 'Outros Documentos', 
    icon: 'folder-open',
    hint: 'Procurações, habilitações de herdeiros, etc.',
    ocrType: 'outro',
  },
];

// Manter compatibilidade com código antigo
const DOCUMENT_TYPES = DOCUMENT_CATEGORIES.map(c => ({ 
  id: c.id, 
  label: c.label, 
  icon: c.icon, 
  target: 0 
}));

// Estados civis
const ESTADOS_CIVIS = ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União de Facto'];

// Tipos de contrato
const TIPOS_CONTRATO = [
  { id: 'exclusivo', label: 'Exclusivo' },
  { id: 'nao_exclusivo', label: 'Não Exclusivo' },
  { id: 'partilhado', label: 'Partilhado' },
];

// Tipos de imóvel
const TIPOS_IMOVEL = [
  'Apartamento',
  'Moradia',
  'Terreno',
  'Loja',
  'Escritório',
  'Armazém',
  'Quinta',
  'Prédio',
];

// Natureza do negócio
const TIPOS_NEGOCIO = [
  { id: 'venda', label: 'Compra/Venda' },
  { id: 'arrendamento', label: 'Arrendamento' },
  { id: 'trespasse', label: 'Trespasse' },
];

// Tipo de comissão
const TIPOS_COMISSAO = [
  { id: 'percentagem', label: 'Percentagem (%)' },
  { id: 'valor_fixo', label: 'Valor Fixo (€)' },
];

// Forma de pagamento da comissão
const FORMAS_PAGAMENTO = [
  { id: 'cpcv', label: 'Toda no CPCV' },
  { id: 'escritura', label: 'Toda após Escritura' },
  { id: 'faseado', label: '50% CPCV + 50% Escritura' },
];

export default function CMIFormScreen({ navigation, route }: Props) {
  const cmiId = route.params?.cmiId;
  const firstImpressionId = route.params?.firstImpressionId;
  const preAngariacaoIdProp = route.params?.preAngariacaoId;
  const isEditMode = !!cmiId;

  // Auth context - para obter nome do agente
  const { user } = useAuth();

  // Estados do CMI
  const [cmi, setCmi] = useState<CMI | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // === AGENTE RESPONSÁVEL ===
  const [agenteNome, setAgenteNome] = useState('');
  const [agenteNif, setAgenteNif] = useState('');

  // === SECÇÃO 1: CLIENTE (1º Outorgante) ===
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

  // === SECÇÃO 1B: SEGUNDO OUTORGANTE (co-proprietário, herdeiro, cônjuge) ===
  const [showCliente2, setShowCliente2] = useState(false);
  const [cliente2Nome, setCliente2Nome] = useState('');
  const [cliente2Nif, setCliente2Nif] = useState('');
  const [cliente2Cc, setCliente2Cc] = useState('');
  const [cliente2CcValidade, setCliente2CcValidade] = useState('');
  const [cliente2Morada, setCliente2Morada] = useState('');
  const [cliente2Telefone, setCliente2Telefone] = useState('');
  const [cliente2Email, setCliente2Email] = useState('');

  // === PROPRIETÁRIOS ADICIONAIS (herdeiros, co-proprietários) ===
  interface ProprietarioExtra {
    nome: string;
    nif: string;
    cc: string;
    ccValidade: string;
    morada: string;
  }
  const [proprietariosExtras, setProprietariosExtras] = useState<ProprietarioExtra[]>([]);

  // Qual cliente está a ser preenchido pelo OCR (1 = principal, 2 = segundo, 3+ = extras)
  const [ocrTargetCliente, setOcrTargetCliente] = useState<number>(1);

  // === SECÇÃO 2: IMÓVEL ===
  const [imovelTipo, setImovelTipo] = useState('');
  const [imovelTipologia, setImovelTipologia] = useState('');
  const [imovelMorada, setImovelMorada] = useState('');
  const [imovelCodigoPostal, setImovelCodigoPostal] = useState('');
  const [imovelFreguesia, setImovelFreguesia] = useState('');
  const [imovelConcelho, setImovelConcelho] = useState('');
  const [imovelArtigoMatricial, setImovelArtigoMatricial] = useState('');
  const [imovelConservatoria, setImovelConservatoria] = useState('');
  const [imovelNumeroDescricao, setImovelNumeroDescricao] = useState('');
  const [imovelAreaBruta, setImovelAreaBruta] = useState('');
  const [imovelAreaUtil, setImovelAreaUtil] = useState('');
  const [imovelEstadoConservacao, setImovelEstadoConservacao] = useState('');
  const [imovelCertificadoEnergetico, setImovelCertificadoEnergetico] = useState('');

  // === SECÇÃO 3: CONDIÇÕES ===
  const [tipoContrato, setTipoContrato] = useState('exclusivo');
  const [tipoNegocio, setTipoNegocio] = useState('venda');
  const [valorPretendido, setValorPretendido] = useState('');
  const [valorMinimo, setValorMinimo] = useState('');
  const [tipoComissao, setTipoComissao] = useState('percentagem');
  const [comissaoPercentagem, setComissaoPercentagem] = useState('5');
  const [comissaoValorFixo, setComissaoValorFixo] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('cpcv');
  const [prazoMeses, setPrazoMeses] = useState('6');

  // === MODAIS ===
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);  // Modal para gerir documentos
  const [currentDocType, setCurrentDocType] = useState('');

  // === ASSINATURAS ===
  const [assinaturaCliente, setAssinaturaCliente] = useState<string | null>(null);
  const [preAngariacaoId, setPreAngariacaoId] = useState<number | null>(preAngariacaoIdProp ?? null);
  const [savedDocs, setSavedDocs] = useState<any[]>([]);
  const [savedDocsMap, setSavedDocsMap] = useState<Record<string, number>>({});
  const [pendingDocs, setPendingDocs] = useState<
    { docType: string; uri: string; mime: string; name: string; base64?: string }[]
  >([]);

  // Refs
  const signatureRef = useRef<any>(null);
  const hasUnsavedChanges = useRef(false);

  useEffect(() => {
    loadData();
    loadAgentData();
    ensurePreAngariacao();
  }, []);

  // Auto-save quando sai do ecrã
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', async (e: any) => {
      if (!hasUnsavedChanges.current || !cmi?.id) return;
      
      // Guardar automaticamente antes de sair
      try {
        await handleAutoSave();
        console.log('[CMI] ✅ Auto-save ao sair');
      } catch (error) {
        console.warn('[CMI] ⚠️ Auto-save falhou:', error);
      }
    });

    return unsubscribe;
  }, [navigation, cmi?.id]);

  // Marcar como tendo alterações não guardadas
  const markUnsaved = () => {
    hasUnsavedChanges.current = true;
  };

  // Auto-save silencioso (sem alerts)
  const handleAutoSave = async () => {
    if (!cmi?.id) return;
    
    const convertDateToISO = (dateStr: string | undefined): string | undefined => {
      if (!dateStr) return undefined;
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return undefined;
    };

    await cmiService.update(cmi.id, {
      cliente_nome: clienteNome || undefined,
      cliente_estado_civil: clienteEstadoCivil || undefined,
      cliente_nif: clienteNif || undefined,
      cliente_cc: clienteCc || undefined,
      cliente_cc_validade: convertDateToISO(clienteCcValidade),
      cliente_morada: clienteMorada || undefined,
      cliente_codigo_postal: clienteCodigoPostal || undefined,
      cliente_localidade: clienteLocalidade || undefined,
      cliente_telefone: clienteTelefone || undefined,
      cliente_email: clienteEmail || undefined,
      cliente2_nome: cliente2Nome || undefined,
      cliente2_nif: cliente2Nif || undefined,
      cliente2_cc: cliente2Cc || undefined,
      imovel_tipo: imovelTipo || undefined,
      imovel_tipologia: imovelTipologia || undefined,
      imovel_morada: imovelMorada || undefined,
      imovel_codigo_postal: imovelCodigoPostal || undefined,
      imovel_freguesia: imovelFreguesia || undefined,
      imovel_concelho: imovelConcelho || undefined,
      imovel_artigo_matricial: imovelArtigoMatricial || undefined,
      valor_pretendido: valorPretendido ? parseFloat(valorPretendido) : undefined,
      valor_minimo: valorMinimo ? parseFloat(valorMinimo) : undefined,
    });
    
    hasUnsavedChanges.current = false;
  };

  const mapDocs = (docs?: any[]) => {
    const counts: Record<string, number> = {};
    // Mapear tipos do backend para IDs das categorias na UI
    const typeToCategory: Record<string, string> = {
      'documentos_proprietario': 'cc',
      'caderneta_predial': 'caderneta_predial',
      'certidao_permanente': 'certidao_permanente',
      'licenca_utilizacao': 'licenca_utilizacao',
      'certificado_energetico': 'certificado_energetico',
      'outro': 'outros',
    };
    (docs || []).forEach((d) => {
      const backendType = d?.type || 'outro';
      const categoryId = typeToCategory[backendType] || 'outros';
      counts[categoryId] = (counts[categoryId] || 0) + 1;
    });
    setSavedDocsMap(counts);
    setSavedDocs(docs || []);
  };

  const loadPreAngariacaoDocs = async (preId?: number) => {
    const target = preId || preAngariacaoId;
    if (!target) return;
    try {
      const pre = await preAngariacaoService.getById(target);
      mapDocs(pre?.documentos);
    } catch (e) {
      console.warn('Não foi possível carregar documentos da pré-angariação', e);
    }
  };

  // Remover documento guardado
  const handleRemoveDocument = async (docIndex: number, docName: string) => {
    if (!preAngariacaoId) {
      Alert.alert('Erro', 'Pré-angariação não encontrada');
      return;
    }

    const confirmDelete = Platform.OS === 'web' 
      ? window.confirm(`Eliminar "${docName}"?`)
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Eliminar Documento',
            `Tem a certeza que quer eliminar "${docName}"?`,
            [
              { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Eliminar', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });

    if (!confirmDelete) return;

    try {
      await preAngariacaoService.removeDocumento(preAngariacaoId, docIndex);
      // Recarregar lista de documentos
      await loadPreAngariacaoDocs(preAngariacaoId);
      Alert.alert('Sucesso', 'Documento eliminado');
    } catch (error: any) {
      console.error('Erro ao eliminar documento:', error);
      Alert.alert('Erro', error.message || 'Não foi possível eliminar o documento');
    }
  };

  // Remover documento pendente (ainda não guardado)
  const handleRemovePendingDoc = (index: number) => {
    setPendingDocs((prev) => prev.filter((_, i) => i !== index));
  };

  const ensurePreAngariacao = async () => {
    if (preAngariacaoId) {
      await loadPreAngariacaoDocs(preAngariacaoId);
      return;
    }
    if (!firstImpressionId) return;
    try {
      const pre = await preAngariacaoService.getByFirstImpression(firstImpressionId);
      if (pre?.id) {
        setPreAngariacaoId(pre.id);
        mapDocs(pre.documentos);
      }
    } catch (e) {
      // ignorar se ainda não existir
    }
  };

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
          await ensurePreAngariacao();
          Alert.alert('CMI Criado', `Contrato ${data.numero_contrato} criado com sucesso!`);
        } catch (error: any) {
          // Se já existir, buscar e abrir o existente
          if (error?.detail && typeof error.detail === 'string' && error.detail.includes('Já existe CMI')) {
            const existing = await cmiService.getByFirstImpression(firstImpressionId);
            setCmi(existing);
            populateFields(existing);
            await ensurePreAngariacao();
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
    // Cliente 1 (Primeiro Outorgante)
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

    // Cliente 2 (Segundo Outorgante - se existir)
    if (data.cliente2_nome || data.cliente2_nif || data.cliente2_cc) {
      setShowCliente2(true);
      setCliente2Nome(data.cliente2_nome || '');
      setCliente2Nif(data.cliente2_nif || '');
      setCliente2Cc(data.cliente2_cc || '');
    }

    // Imóvel
    setImovelTipo(data.imovel_tipo || '');
    setImovelTipologia(data.imovel_tipologia || '');
    setImovelMorada(data.imovel_morada || '');
    setImovelCodigoPostal(data.imovel_codigo_postal || '');
    setImovelFreguesia(data.imovel_freguesia || '');
    setImovelConcelho(data.imovel_concelho || '');
    setImovelArtigoMatricial(data.imovel_artigo_matricial || '');
    setImovelConservatoria(data.imovel_conservatoria || '');
    setImovelNumeroDescricao(data.imovel_numero_descricao || '');
    setImovelAreaBruta(data.imovel_area_bruta?.toString() || '');
    setImovelAreaUtil(data.imovel_area_util?.toString() || '');
    setImovelEstadoConservacao(data.imovel_estado_conservacao || '');
    setImovelCertificadoEnergetico(data.imovel_certificado_energetico || '');

    // Condições
    setTipoContrato(data.tipo_contrato || 'exclusivo');
    setTipoNegocio(data.tipo_negocio || 'venda');
    setValorPretendido(data.valor_pretendido?.toString() || '');
    setValorMinimo(data.valor_minimo?.toString() || '');
    // Determinar tipo de comissão baseado nos dados
    if (data.comissao_valor_fixo && parseFloat(data.comissao_valor_fixo.toString()) > 0) {
      setTipoComissao('valor_fixo');
      setComissaoValorFixo(data.comissao_valor_fixo.toString());
    } else {
      setTipoComissao('percentagem');
      setComissaoPercentagem(data.comissao_percentagem?.toString() || '5');
    }
    setFormaPagamento(data.opcao_pagamento || 'cpcv');
    setPrazoMeses(data.prazo_meses?.toString() || '6');

    // Agente (se existir no CMI, usar; senão manter o do login)
    if (data.agente_nome) setAgenteNome(data.agente_nome);

    // Assinaturas
    setAssinaturaCliente(data.assinatura_cliente || null);
  };

  const handleSave = async () => {
    if (!cmi) return;

    setSaving(true);
    try {
      // Garantir token em memória
      const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (storedToken) {
        apiService.setAccessToken(storedToken);
      }

      // Upload e gravação dos documentos pendentes
      if (pendingDocs.length > 0) {
        if (!preAngariacaoId && firstImpressionId) {
          await ensurePreAngariacao();
        }
        const targetPreId = preAngariacaoId;
        if (!targetPreId) {
          throw new Error('Pré-angariação não encontrada para guardar documentos.');
        }

        const payloads: any[] = [];
        for (const doc of pendingDocs) {
          const tipoDocumento =
            doc.docType === 'caderneta_predial' ? 'caderneta_predial' :
            doc.docType === 'certidao_permanente' ? 'certidao_permanente' :
            doc.docType === 'licenca_utilizacao' ? 'licenca_utilizacao' :
            doc.docType === 'certificado_energetico' ? 'certificado_energetico' :
            'documentos_proprietario';

          const url = await cloudinaryService.uploadFile(doc.uri, doc.name, doc.mime, doc.base64);
          payloads.push({ type: tipoDocumento, name: doc.name, url });
        }

        const updatedPre = await preAngariacaoService.addDocumento(targetPreId, payloads);
        if (updatedPre?.documentos) {
          mapDocs(updatedPre.documentos);
        }
        setPendingDocs([]);
      }

      // Converter data DD/MM/YYYY para ISO (YYYY-MM-DD) para o backend
      const convertDateToISO = (dateStr: string | undefined): string | undefined => {
        if (!dateStr) return undefined;
        // Se já está em formato ISO, retorna
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
        // Converter DD/MM/YYYY para YYYY-MM-DD
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return undefined;  // Data inválida
      };

      await cmiService.update(cmi.id, {
        cliente_nome: clienteNome,
        cliente_estado_civil: clienteEstadoCivil || undefined,
        cliente_nif: clienteNif || undefined,
        cliente_cc: clienteCc || undefined,
        cliente_cc_validade: convertDateToISO(clienteCcValidade),
        cliente_morada: clienteMorada || undefined,
        cliente_codigo_postal: clienteCodigoPostal || undefined,
        cliente_localidade: clienteLocalidade || undefined,
        cliente_telefone: clienteTelefone || undefined,
        cliente_email: clienteEmail || undefined,
        // Segundo outorgante (co-proprietário, herdeiro, cônjuge)
        cliente2_nome: cliente2Nome || undefined,
        cliente2_nif: cliente2Nif || undefined,
        cliente2_cc: cliente2Cc || undefined,
        imovel_tipo: imovelTipo || undefined,
        imovel_tipologia: imovelTipologia || undefined,
        imovel_morada: imovelMorada || undefined,
        imovel_codigo_postal: imovelCodigoPostal || undefined,
        imovel_freguesia: imovelFreguesia || undefined,
        imovel_concelho: imovelConcelho || undefined,
        imovel_artigo_matricial: imovelArtigoMatricial || undefined,
        imovel_conservatoria: imovelConservatoria || undefined,
        imovel_numero_descricao: imovelNumeroDescricao || undefined,
        imovel_area_bruta: imovelAreaBruta ? parseFloat(imovelAreaBruta) : undefined,
        imovel_area_util: imovelAreaUtil ? parseFloat(imovelAreaUtil) : undefined,
        imovel_estado_conservacao: imovelEstadoConservacao || undefined,
        imovel_certificado_energetico: imovelCertificadoEnergetico || undefined,
        tipo_contrato: tipoContrato,
        tipo_negocio: tipoNegocio,
        valor_pretendido: valorPretendido ? parseFloat(valorPretendido) : undefined,
        valor_minimo: valorMinimo ? parseFloat(valorMinimo) : undefined,
        comissao_percentagem: tipoComissao === 'percentagem' && comissaoPercentagem ? parseFloat(comissaoPercentagem) : undefined,
        comissao_valor_fixo: tipoComissao === 'valor_fixo' && comissaoValorFixo ? parseFloat(comissaoValorFixo) : undefined,
        opcao_pagamento: formaPagamento,
        prazo_meses: prazoMeses ? parseInt(prazoMeses) : undefined,
        agente_nome: agenteNome || undefined,
      });

      // Sincronizar dados principais para a Pré-Angariação (visível no backoffice)
      if (preAngariacaoId) {
        await preAngariacaoService.update(preAngariacaoId, {
          proprietario_nome: clienteNome || undefined,
          proprietario_nif: clienteNif || undefined,
          proprietario_telefone: clienteTelefone || undefined,
          proprietario_email: clienteEmail || undefined,
          morada: imovelMorada || undefined,
          freguesia: imovelFreguesia || undefined,
          concelho: imovelConcelho || undefined,
          tipologia: imovelTipologia || undefined,
          area_bruta: imovelAreaBruta ? parseFloat(imovelAreaBruta) : undefined,
          area_util: imovelAreaUtil ? parseFloat(imovelAreaUtil) : undefined,
          estado_conservacao: imovelEstadoConservacao || undefined,
          valor_pretendido: valorPretendido ? parseFloat(valorPretendido) : undefined,
        });
      }

      // Sincronizar nome do cliente para a 1ª Impressão (atualiza "A Identificar")
      if (firstImpressionId && clienteNome && clienteNome !== 'A Identificar') {
        try {
          // Preparar attachments a partir dos documentos guardados na pré-angariação
          const attachmentsToSync = savedDocs
            .filter((d: any) => d && d.url)
            .map((d: any) => ({
              name: d.name || d.type || 'Documento',
              url: d.url,
              type: d.type || 'outro',
            }));
          
          await firstImpressionService.update(firstImpressionId, {
            client_name: clienteNome,
            client_nif: clienteNif || undefined,
            client_phone: clienteTelefone || undefined,
            client_email: clienteEmail || undefined,
            // SYNC: Sincronizar documentos como attachments
            attachments: attachmentsToSync.length > 0 ? attachmentsToSync : undefined,
          });
          console.log('[CMI] ✅ FirstImpression atualizada com nome e documentos:', attachmentsToSync.length);
        } catch (e) {
          console.warn('[CMI] ⚠️ Não foi possível atualizar FirstImpression:', e);
        }
      }

      Alert.alert('Sucesso', 'Contrato guardado com sucesso!');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePdf = async () => {
    if (!cmi?.id) {
      Alert.alert('Aviso', 'Guarde o contrato antes de gerar o PDF.');
      return;
    }
    setPdfLoading(true);
    try {
      const blob = await cmiService.getPdf(cmi.id);
      const filename = `cmi-${cmi.numero_contrato || cmi.id}.pdf`;
      
      if (Platform.OS === 'web') {
        // Tentar usar Web Share API (funciona bem no iOS Safari)
        if (navigator.share && navigator.canShare) {
          try {
            const file = new File([blob], filename, { type: 'application/pdf' });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: `CMI ${cmi.numero_contrato || ''}`,
              });
              return; // Sucesso - sair
            }
          } catch (shareError: any) {
            // Se o user cancelou, não mostrar erro
            if (shareError.name === 'AbortError') {
              return;
            }
            console.log('[PDF] Share API falhou, tentando download:', shareError);
          }
        }
        
        // Fallback: download direto
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } else {
        // React Native nativo
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const res = reader.result as string;
            resolve(res.substring(res.indexOf(',') + 1));
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob as any);
        });
        const fileUri = `${FileSystem.cacheDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, { mimeType: 'application/pdf' });
        } else {
          Alert.alert('PDF gerado', 'PDF disponível em cache do aplicativo.');
        }
      }
    } catch (error: any) {
      console.error('[PDF] ❌ Erro:', error);
      Alert.alert('Erro', error?.detail || error?.message || 'Não foi possível gerar o PDF.');
    } finally {
      setPdfLoading(false);
    }
  };

  // === CÂMARA / OCR ===
  const openDocumentScanner = (categoryId: string) => {
    // Encontrar categoria para determinar tipo de OCR
    const category = DOCUMENT_CATEGORIES.find(c => c.id === categoryId);
    const ocrType = category?.ocrType || 'outros';
    
    setCurrentDocType(ocrType);
    // O target cliente será determinado automaticamente pelo OCR
    // baseado no NIF/nome detectado vs dados existentes
    setOcrTargetCliente(0); // 0 = auto-detect
    setShowCameraModal(true);
  };

  const docTypeToPreKey = (docType: string) => {
    // cc2_frente e cc2_verso também vão para documentos_proprietario
    if (docType === 'cc2_frente' || docType === 'cc2_verso') {
      return 'documentos_proprietario';
    }
    return docType === 'caderneta_predial' ? 'caderneta_predial'
      : docType === 'certidao_permanente' ? 'certidao_permanente'
      : docType === 'licenca_utilizacao' ? 'licenca_utilizacao'
      : docType === 'certificado_energetico' ? 'certificado_energetico'
      : 'documentos_proprietario';
  };

  const persistDocumento = async (fileUri: string, fileName: string, mimeType: string, base64?: string) => {
    let targetPreId = preAngariacaoId;
    if (!targetPreId && firstImpressionId) {
      try {
        const pre = await preAngariacaoService.getByFirstImpression(firstImpressionId);
        if (pre?.id) {
          targetPreId = pre.id;
          setPreAngariacaoId(pre.id);
        }
      } catch {
        // sem pre-angariação ligada
      }
    }
    if (!targetPreId) return null;
    // Upload para Cloudinary e salvar em pré-angariação
    const url = await cloudinaryService.uploadFile(fileUri, fileName, mimeType, base64);
    const tipoDocumento =
      currentDocType === 'caderneta_predial' ? 'caderneta_predial' :
      currentDocType === 'certidao_permanente' ? 'certidao_permanente' :
      currentDocType === 'licenca_utilizacao' ? 'licenca_utilizacao' :
      currentDocType === 'certificado_energetico' ? 'certificado_energetico' :
      'documentos_proprietario'; // CC frente/verso => documentos_proprietario

    await preAngariacaoService.addDocumento(targetPreId, {
      type: tipoDocumento,
      name: fileName,
      url,
    });

    return url;
  };

  const processOcrFromBase64 = async (base64: string) => {
    // Processar via OCR - funciona com ou sem CMI
    Alert.alert('A Processar', 'A extrair dados do documento...');
    
    try {
      // Usar endpoint standalone se não houver CMI, ou endpoint normal se houver
      let ocrResult;
      if (cmi) {
        ocrResult = await cmiService.processOCR(cmi.id, currentDocType, base64);
      } else {
        // OCR standalone - permite extrair dados antes de criar CMI
        ocrResult = await cmiService.processOCRStandalone(currentDocType, base64);
      }

      console.log('[OCR] Resultado:', JSON.stringify(ocrResult, null, 2));

      if (ocrResult.sucesso) {
        const dados = ocrResult.dados_extraidos;
        let camposPreenchidos = 0;
        
        // IMPORTANTE: Usar o tipo detectado pelo backend
        const tipoDocumento = ocrResult.tipo || currentDocType;
        console.log('[OCR] Tipo detectado pelo backend:', tipoDocumento);
        
        // CARTÃO DE CIDADÃO - Auto-detectar próximo slot disponível
        if (tipoDocumento === 'cc_frente' || tipoDocumento === 'cc_verso' || tipoDocumento === 'cc') {
          // Verificar se é um CC novo ou actualização de existente
          const nifDetectado = dados.nif;
          const nomeDetectado = dados.nome;
          
          // Verificar se já temos este NIF/pessoa registado
          const isCliente1 = clienteNif === nifDetectado || (nomeDetectado && clienteNome === nomeDetectado);
          const isCliente2 = cliente2Nif === nifDetectado || (nomeDetectado && cliente2Nome === nomeDetectado);
          const extraIdx = proprietariosExtras.findIndex(p => p.nif === nifDetectado || p.nome === nomeDetectado);
          
          if (isCliente1) {
            // Actualizar cliente 1
            if (dados.nome && !clienteNome) { setClienteNome(dados.nome); camposPreenchidos++; }
            if (dados.nif && !clienteNif) { setClienteNif(dados.nif); camposPreenchidos++; }
            if (dados.numero_documento) { setClienteCc(dados.numero_documento); camposPreenchidos++; }
            if (dados.validade) { setClienteCcValidade(dados.validade); camposPreenchidos++; }
          } else if (isCliente2) {
            // Actualizar cliente 2
            if (dados.nome && !cliente2Nome) { setCliente2Nome(dados.nome); camposPreenchidos++; }
            if (dados.nif && !cliente2Nif) { setCliente2Nif(dados.nif); camposPreenchidos++; }
            if (dados.numero_documento) { setCliente2Cc(dados.numero_documento); camposPreenchidos++; }
            if (dados.validade) { setCliente2CcValidade(dados.validade); camposPreenchidos++; }
          } else if (extraIdx >= 0) {
            // Actualizar proprietário extra existente
            setProprietariosExtras(prev => {
              const updated = [...prev];
              if (dados.nome) updated[extraIdx].nome = dados.nome;
              if (dados.nif) updated[extraIdx].nif = dados.nif;
              if (dados.numero_documento) updated[extraIdx].cc = dados.numero_documento;
              if (dados.validade) updated[extraIdx].ccValidade = dados.validade;
              return updated;
            });
            camposPreenchidos++;
          } else {
            // NOVO PROPRIETÁRIO - encontrar próximo slot disponível
            if (!clienteNome && !clienteNif) {
              // Slot 1 vazio
              if (dados.nome) { setClienteNome(dados.nome); camposPreenchidos++; }
              if (dados.nif) { setClienteNif(dados.nif); camposPreenchidos++; }
              if (dados.numero_documento) { setClienteCc(dados.numero_documento); camposPreenchidos++; }
              if (dados.validade) { setClienteCcValidade(dados.validade); camposPreenchidos++; }
            } else if (!cliente2Nome && !cliente2Nif) {
              // Slot 2 vazio
              setShowCliente2(true);
              if (dados.nome) { setCliente2Nome(dados.nome); camposPreenchidos++; }
              if (dados.nif) { setCliente2Nif(dados.nif); camposPreenchidos++; }
              if (dados.numero_documento) { setCliente2Cc(dados.numero_documento); camposPreenchidos++; }
              if (dados.validade) { setCliente2CcValidade(dados.validade); camposPreenchidos++; }
            } else {
              // Adicionar aos extras (herdeiros, co-proprietários)
              setProprietariosExtras(prev => [...prev, {
                nome: dados.nome || '',
                nif: dados.nif || '',
                cc: dados.numero_documento || '',
                ccValidade: dados.validade || '',
                morada: dados.morada || clienteMorada || '',
              }]);
              camposPreenchidos++;
            }
          }
          
          // === AUTO-CRIAR CLIENTE NA BD ===
          // Criar automaticamente o proprietário como cliente "vendedor"
          if (user?.agent_id && dados.nome && preAngariacaoId) {
            try {
              const clientResult = await clientService.createFromAngariacao(
                user.agent_id,
                preAngariacaoId,
                {
                  nome: dados.nome,
                  nif: dados.nif,
                  cc: dados.numero_documento,
                  cc_validade: dados.validade,
                  data_nascimento: dados.data_nascimento,
                  morada: dados.morada || clienteMorada,
                }
              );
              console.log('[OCR] Cliente criado/atualizado:', clientResult.action, clientResult.client?.nome);
            } catch (clientError) {
              console.warn('[OCR] Erro ao criar cliente (não crítico):', clientError);
            }
          }
        } else if (tipoDocumento === 'caderneta_predial') {
          // === PROPRIETÁRIO DA CADERNETA (NIF/Nome do titular registado na matriz) ===
          // ATENÇÃO: A caderneta pode estar DESATUALIZADA!
          // Ex: Imóvel comprado recentemente mas matriz ainda não actualizada
          // Ex: Herança - caderneta ainda tem o falecido
          // Por isso, NÃO auto-preencher cliente a partir da caderneta!
          // Os dados do cliente devem vir APENAS do CC (quem assina o CMI)
          const proprietarioNif = dados.proprietario_nif || dados.nif_titular;
          const proprietarioNome = dados.proprietario_nome || dados.nome_titular;
          
          if (proprietarioNif || proprietarioNome) {
            // Apenas LOG informativo - NÃO preencher automaticamente
            console.log('[OCR Caderneta] ℹ️ Titular registado na matriz:');
            console.log('[OCR Caderneta]    Nome:', proprietarioNome || '(não extraído)');
            console.log('[OCR Caderneta]    NIF:', proprietarioNif || '(não extraído)');
            console.log('[OCR Caderneta] ⚠️ NOTA: Caderneta pode estar desatualizada!');
            console.log('[OCR Caderneta]    Use o CC para identificar quem assina o CMI.');
          }
          
          // === DADOS DO IMÓVEL (estes sim, preencher automaticamente) ===
          if (dados.artigo_matricial) {
            // ACUMULAR artigos matriciais para múltiplos prédios vendidos em conjunto
            const novoArtigo = String(dados.artigo_matricial || '').trim();
            if (novoArtigo) {
              setImovelArtigoMatricial((prev) => {
                const prevStr = String(prev || '').trim();
                if (!prevStr) return novoArtigo;
                const artigos = prevStr.split(',').map((a) => a.trim());
                if (artigos.includes(novoArtigo)) return prevStr;
                return `${prevStr}, ${novoArtigo}`;
              });
              camposPreenchidos++;
            }
          }
          if (dados.tipo_imovel) {
            // ACUMULAR tipos de imóvel (ex: "Habitação + Arrecadação")
            const novoTipo = String(dados.tipo_imovel || '').trim();
            if (novoTipo) {
              setImovelTipo((prev) => {
                const prevStr = String(prev || '').trim();
                if (!prevStr) return novoTipo;
                if (prevStr.toLowerCase().includes(novoTipo.toLowerCase())) return prevStr;
                return `${prevStr} + ${novoTipo}`;
              });
              camposPreenchidos++;
            }
          }
          if (dados.tipologia) {
            // ACUMULAR tipologias (ex: "T4 + Arrecadações")
            const novaTipologia = String(dados.tipologia || '').trim();
            if (novaTipologia) {
              setImovelTipologia((prev) => {
                const prevStr = String(prev || '').trim();
                if (!prevStr) return novaTipologia;
                if (prevStr.toLowerCase().includes(novaTipologia.toLowerCase())) return prevStr;
                return `${prevStr} + ${novaTipologia}`;
              });
              camposPreenchidos++;
            }
          }
          if (dados.area_bruta) {
            // ACUMULAR áreas para múltiplos prédios
            const novaArea = String(dados.area_bruta || '').trim();
            if (novaArea) {
              setImovelAreaBruta((prev) => {
                const prevStr = String(prev || '').trim();
                if (!prevStr) return novaArea;
                const areaAnterior = parseFloat(prevStr.replace(',', '.')) || 0;
                const areaNova = parseFloat(novaArea.replace(',', '.')) || 0;
                return (areaAnterior + areaNova).toFixed(2).replace('.', ',');
              });
              camposPreenchidos++;
            }
          }
          if (dados.area_util) {
            // ACUMULAR áreas para múltiplos prédios
            const novaAreaUtil = String(dados.area_util || '').trim();
            if (novaAreaUtil) {
              setImovelAreaUtil((prev) => {
                const prevStr = String(prev || '').trim();
                if (!prevStr) return novaAreaUtil;
                const areaAnterior = parseFloat(prevStr.replace(',', '.')) || 0;
                const areaNova = parseFloat(novaAreaUtil.replace(',', '.')) || 0;
                return (areaAnterior + areaNova).toFixed(2).replace('.', ',');
              });
              camposPreenchidos++;
            }
          }
          if (dados.morada) {
            setImovelMorada(dados.morada);
            camposPreenchidos++;
          }
          if (dados.codigo_postal) {
            setImovelCodigoPostal(dados.codigo_postal);
            camposPreenchidos++;
          }
          if (dados.freguesia) {
            setImovelFreguesia(dados.freguesia);
            camposPreenchidos++;
          }
          if (dados.concelho) {
            setImovelConcelho(dados.concelho);
            camposPreenchidos++;
          }
          // Valor patrimonial - usar como referência para valor pretendido se não houver
          if (dados.valor_patrimonial && !valorPretendido) {
            console.log('[OCR Caderneta] ℹ️ Valor patrimonial disponível:', dados.valor_patrimonial);
            // Não definir automaticamente - é só referência
          }
        } else if (tipoDocumento === 'certidao_permanente') {
          if (dados.artigo_matricial) {
            // ACUMULAR artigos matriciais para múltiplos prédios
            const novoArtigo = String(dados.artigo_matricial || '').trim();
            if (novoArtigo) {
              setImovelArtigoMatricial((prev) => {
                const prevStr = String(prev || '').trim();
                if (!prevStr) return novoArtigo;
                const artigos = prevStr.split(',').map((a) => a.trim());
                if (artigos.includes(novoArtigo)) return prevStr;
                return `${prevStr}, ${novoArtigo}`;
              });
              camposPreenchidos++;
            }
          }
          if (dados.conservatoria) {
            setImovelConservatoria(dados.conservatoria);
            camposPreenchidos++;
          }
          if (dados.numero_descricao) {
            setImovelNumeroDescricao(dados.numero_descricao);
            camposPreenchidos++;
          }
          if (dados.area_bruta) {
            setImovelAreaBruta(dados.area_bruta.toString());
            camposPreenchidos++;
          }
          if (dados.morada) {
            setImovelMorada(dados.morada);
            camposPreenchidos++;
          }
          if (dados.freguesia) {
            setImovelFreguesia(dados.freguesia);
            camposPreenchidos++;
          }
          if (dados.tipo_imovel) {
            setImovelTipo(dados.tipo_imovel);
            camposPreenchidos++;
          }
          // Proprietários da certidão permanente (array)
          // ATENÇÃO: A certidão pode não estar actualizada (registo ainda não feito)
          // Apenas LOG informativo - os dados do cliente vêm do CC
          if (dados.proprietarios && Array.isArray(dados.proprietarios)) {
            console.log('[OCR Certidão] ℹ️ Proprietários registados (SUJEITOS ATIVOS):');
            dados.proprietarios.forEach((prop: { nome?: string; nif?: string }, index: number) => {
              console.log(`[OCR Certidão]    ${index + 1}. ${prop.nome || '?'} - NIF: ${prop.nif || '?'}`);
            });
            console.log('[OCR Certidão] ⚠️ NOTA: Registo pode estar desatualizado!');
            console.log('[OCR Certidão]    Use o CC para identificar quem assina o CMI.');
          }
        } else if (tipoDocumento === 'certificado_energetico') {
          if (dados.classe_energetica) {
            setImovelCertificadoEnergetico(dados.classe_energetica);
            camposPreenchidos++;
          }
        }

        console.log('[OCR] Campos preenchidos:', camposPreenchidos);

        Alert.alert(
          'Documento Processado',
          `${ocrResult.mensagem}\n\nConfiança: ${(ocrResult.confianca * 100).toFixed(0)}%\n\n${camposPreenchidos > 0 ? `${camposPreenchidos} campos preenchidos automaticamente.` : 'Verifique os dados e preencha manualmente se necessário.'}`
        );
      } else {
        Alert.alert('Erro OCR', ocrResult.mensagem || 'Não foi possível processar o documento');
      }
    } catch (error: any) {
      console.error('[OCR] Erro:', error);
      Alert.alert('Erro', error.message || 'Erro ao processar documento');
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

      // Permite capturar documento mesmo sem CMI - OCR standalone
      if (!result.canceled && result.assets[0]) {
        setShowCameraModal(false);
        setPendingDocs((prev) => [
          ...prev,
          {
            docType: currentDocType,
            uri: result.assets[0].uri,
            mime: result.assets[0].mimeType || 'image/jpeg',
            name: `${currentDocType}-${Date.now()}.jpg`,
            base64: result.assets[0].base64,
          },
        ]);
        if (result.assets[0].base64) {
          await processOcrFromBase64(result.assets[0].base64);
        }
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao capturar documento');
    }
  };

  const pickDocumentFromLibrary = async (categoryId: string) => {
    // Permite carregar documentos mesmo sem CMI - OCR standalone
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Permita acesso à galeria para anexar o documento.');
        return;
      }

      // Encontrar categoria para determinar tipo de OCR
      const category = DOCUMENT_CATEGORIES.find(c => c.id === categoryId);
      const ocrType = category?.ocrType || 'outros';
      
      setCurrentDocType(ocrType);
      setOcrTargetCliente(0); // Auto-detect
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true, // Permitir múltiplos documentos
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        // Processar todos os documentos selecionados
        for (const asset of result.assets) {
          setPendingDocs((prev) => [
            ...prev,
            {
              docType: ocrType,
              uri: asset.uri,
              mime: asset.mimeType || 'image/jpeg',
              name: asset.fileName || `${categoryId}-${Date.now()}.jpg`,
              base64: asset.base64,
            },
          ]);
          
          // Processar OCR para TODOS os documentos (CC, caderneta, certidão, etc.)
          if (asset.base64) {
            await processOcrFromBase64(asset.base64);
          }
        }
        
        Alert.alert('Sucesso', `${result.assets.length} documento(s) adicionado(s)`);
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao anexar documento da galeria');
    }
  };

  // === CÁLCULO DE PROGRESSO ===
  const calculateProgress = () => {
    const requiredFields = [
      { name: 'Nome do Cliente', value: clienteNome },
      { name: 'NIF do Cliente', value: clienteNif },
      { name: 'CC do Cliente', value: clienteCc },
      { name: 'Morada do Cliente', value: clienteMorada },
      { name: 'Telefone do Cliente', value: clienteTelefone },
      { name: 'Morada do Imóvel', value: imovelMorada },
      { name: 'Tipo de Imóvel', value: imovelTipo },
      { name: 'Valor Pretendido', value: valorPretendido },
    ];
    const filledCount = requiredFields.filter(f => f.value?.trim()).length;
    return {
      percentage: Math.round((filledCount / requiredFields.length) * 100),
      filled: filledCount,
      total: requiredFields.length,
      missingFields: requiredFields.filter(f => !f.value?.trim()).map(f => f.name),
    };
  };

  const progress = calculateProgress();

  // === ASSINATURAS ===
  const openSignatureModal = () => {
    // Validar campos obrigatórios antes de permitir assinatura
    if (progress.percentage < 75) {
      Alert.alert(
        'Campos em Falta',
        `Por favor preencha pelo menos 75% dos campos obrigatórios antes de assinar.\n\nProgresso atual: ${progress.percentage}%\n\nCampos em falta:\n• ${progress.missingFields.slice(0, 5).join('\n• ')}`,
        [{ text: 'OK' }]
      );
      return;
    }
    setShowSignatureModal(true);
  };

  const handleSignature = async (signature: string) => {
    if (!cmi) return;

    setShowSignatureModal(false);

    try {
      // Capturar local da assinatura automaticamente
      const local = imovelConcelho || imovelFreguesia || 'Leiria';
      await cmiService.addClientSignature(cmi.id, signature, local);
      setAssinaturaCliente(signature);
      Alert.alert(
        '✅ Assinatura Registada',
        `Assinatura do cliente guardada com sucesso!\n\nLocal: ${local}\nData: ${new Date().toLocaleDateString('pt-PT')}`
      );
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
          
          {/* BARRA DE PROGRESSO */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Preenchimento</Text>
              <Text style={[styles.progressValue, progress.percentage === 100 && { color: '#34C759' }]}>
                {progress.percentage}%
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[
                styles.progressBarFill,
                { width: `${progress.percentage}%` },
                progress.percentage === 100 && { backgroundColor: '#34C759' },
                progress.percentage >= 75 && progress.percentage < 100 && { backgroundColor: '#00d9ff' },
                progress.percentage < 75 && { backgroundColor: '#FF9500' },
              ]} />
            </View>
            <Text style={styles.progressHint}>
              {progress.percentage < 75 ? `${progress.missingFields.length} campos em falta para assinar` :
               progress.percentage < 100 ? 'Pronto para assinar!' : '✓ Completo'}
            </Text>
          </View>
        </View>

        {/* SCAN DOCUMENTOS - INTERFACE SIMPLIFICADA */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📷 Digitalizar Documentos</Text>
            {savedDocs.length > 0 && (
              <TouchableOpacity onPress={() => setShowDocsModal(true)}>
                <Text style={styles.manageDocsLink}>Ver todos ({savedDocs.length})</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.hint}>
            Adicione múltiplos documentos de cada tipo. O OCR extrairá automaticamente os dados de todos.
          </Text>
          
          {/* CATEGORIAS DE DOCUMENTOS */}
          <View style={styles.docCategories}>
            {DOCUMENT_CATEGORIES.map((cat) => {
              const savedCount = savedDocsMap[cat.id] || 0;
              const pendingCount = pendingDocs.filter(d => d.docType === cat.ocrType).length;
              const totalCount = savedCount + pendingCount;
              
              return (
                <View key={cat.id} style={styles.docCategory}>
                  <View style={styles.docCategoryHeader}>
                    <View style={styles.docCategoryInfo}>
                      <View style={[styles.docCategoryIcon, totalCount > 0 && styles.docCategoryIconActive]}>
                        <Ionicons name={cat.icon as any} size={24} color={totalCount > 0 ? '#fff' : '#00d9ff'} />
                      </View>
                      <View style={styles.docCategoryText}>
                        <Text style={styles.docCategoryLabel}>{cat.label}</Text>
                        <Text style={styles.docCategoryHint}>{cat.hint}</Text>
                      </View>
                    </View>
                    {totalCount > 0 && (
                      <View style={styles.docCountBadge}>
                        <Text style={styles.docCountText}>{totalCount}</Text>
                      </View>
                    )}
                  </View>
                  
                  {/* Lista de documentos desta categoria */}
                  {totalCount > 0 && (
                    <View style={styles.docCategoryList}>
                      {/* Documentos guardados */}
                      {savedDocs.filter(d => d.type === cat.id).map((doc, idx) => (
                        <View key={`saved-${idx}`} style={styles.docCategoryItem}>
                          <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                          <Text style={styles.docCategoryItemText} numberOfLines={1}>
                            {doc.name || `${cat.label} ${idx + 1}`}
                          </Text>
                          <Text style={styles.docCategoryItemStatus}>Guardado</Text>
                        </View>
                      ))}
                      {/* Documentos pendentes */}
                      {pendingDocs.filter(d => d.docType === cat.ocrType).map((doc, idx) => (
                        <View key={`pending-${idx}`} style={styles.docCategoryItem}>
                          <Ionicons name="time-outline" size={16} color="#fbbf24" />
                          <Text style={styles.docCategoryItemText} numberOfLines={1}>
                            {doc.name}
                          </Text>
                          <TouchableOpacity 
                            onPress={() => handleRemovePendingDoc(pendingDocs.indexOf(doc))}
                            style={styles.docCategoryItemRemove}
                          >
                            <Ionicons name="close-circle" size={18} color="#FF3B30" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                  
                  {/* Botões de ação */}
                  <View style={styles.docCategoryActions}>
                    <TouchableOpacity
                      style={styles.docCategoryBtn}
                      onPress={() => openDocumentScanner(cat.id)}
                    >
                      <Ionicons name="camera" size={18} color="#00d9ff" />
                      <Text style={styles.docCategoryBtnText}>Fotografar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.docCategoryBtn}
                      onPress={() => pickDocumentFromLibrary(cat.id)}
                    >
                      <Ionicons name="images" size={18} color="#00d9ff" />
                      <Text style={styles.docCategoryBtnText}>Galeria</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
          
          {/* Resumo de proprietários detectados */}
          {(clienteNome || cliente2Nome || proprietariosExtras.length > 0) && (
            <View style={styles.detectedOwners}>
              <Text style={styles.detectedOwnersTitle}>👥 Proprietários Detectados</Text>
              {clienteNome && (
                <View style={styles.detectedOwnerItem}>
                  <Ionicons name="person" size={16} color="#00d9ff" />
                  <Text style={styles.detectedOwnerName}>{clienteNome}</Text>
                  <Text style={styles.detectedOwnerRole}>Principal</Text>
                </View>
              )}
              {cliente2Nome && (
                <View style={styles.detectedOwnerItem}>
                  <Ionicons name="person" size={16} color="#8b5cf6" />
                  <Text style={styles.detectedOwnerName}>{cliente2Nome}</Text>
                  <Text style={styles.detectedOwnerRole}>2º Outorgante</Text>
                </View>
              )}
              {proprietariosExtras.map((prop, idx) => (
                <View key={idx} style={styles.detectedOwnerItem}>
                  <Ionicons name="person-add" size={16} color="#10b981" />
                  <Text style={styles.detectedOwnerName}>{prop.nome}</Text>
                  <Text style={styles.detectedOwnerRole}>Adicional {idx + 1}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* SECÇÃO 1: DADOS DO CLIENTE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 PRIMEIRO OUTORGANTE (Cliente)</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nome Completo *</Text>
            <TextInput
              style={styles.input}
              value={clienteNome}
              onChangeText={(v) => { setClienteNome(v); markUnsaved(); }}
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
                onChangeText={(v) => { setClienteNif(v); markUnsaved(); }}
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

          {/* Botão para adicionar segundo outorgante */}
          {!showCliente2 && (
            <TouchableOpacity
              style={styles.addOutorganteButton}
              onPress={() => setShowCliente2(true)}
            >
              <Ionicons name="person-add" size={20} color="#007AFF" />
              <Text style={styles.addOutorganteText}>Adicionar 2º Outorgante (co-proprietário, herdeiro, cônjuge)</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* SECÇÃO 1B: SEGUNDO OUTORGANTE (se existir) */}
        {showCliente2 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>👥 SEGUNDO OUTORGANTE</Text>
              <TouchableOpacity onPress={() => setShowCliente2(false)}>
                <Ionicons name="close-circle" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
            
            {/* Info: CCs são adicionados na secção de Documentos */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#007AFF" />
              <Text style={styles.infoText}>
                Adicione CCs na secção "Documentos" acima. O sistema detecta automaticamente a que outorgante pertence.
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nome Completo</Text>
              <TextInput
                style={styles.input}
                value={cliente2Nome}
                onChangeText={setCliente2Nome}
                placeholder="Nome completo"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>NIF</Text>
                <TextInput
                  style={styles.input}
                  value={cliente2Nif}
                  onChangeText={setCliente2Nif}
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
                  value={cliente2Cc}
                  onChangeText={setCliente2Cc}
                  placeholder="12345678"
                  placeholderTextColor="#666"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Telefone</Text>
                <TextInput
                  style={styles.input}
                  value={cliente2Telefone}
                  onChangeText={setCliente2Telefone}
                  placeholder="912 345 678"
                  placeholderTextColor="#666"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={cliente2Email}
                  onChangeText={setCliente2Email}
                  placeholder="email@exemplo.com"
                  placeholderTextColor="#666"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
          </View>
        )}

        {/* PROPRIETÁRIOS EXTRAS (herdeiros, co-proprietários adicionais) */}
        {proprietariosExtras.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>👥 OUTORGANTES ADICIONAIS ({proprietariosExtras.length})</Text>
              <TouchableOpacity 
                onPress={() => setProprietariosExtras(prev => [...prev, { nome: '', nif: '', cc: '', ccValidade: '', morada: '' }])}
              >
                <Ionicons name="add-circle" size={24} color="#00d9ff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>Herdeiros, co-proprietários ou outros outorgantes detectados via OCR</Text>
            
            {proprietariosExtras.map((prop, idx) => (
              <View key={idx} style={styles.extraOwnerCard}>
                <View style={styles.extraOwnerHeader}>
                  <Text style={styles.extraOwnerTitle}>Outorgante {idx + 3}</Text>
                  <TouchableOpacity onPress={() => setProprietariosExtras(prev => prev.filter((_, i) => i !== idx))}>
                    <Ionicons name="trash" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.row}>
                  <View style={[styles.inputContainer, { flex: 2 }]}>
                    <Text style={styles.label}>Nome</Text>
                    <TextInput
                      style={styles.input}
                      value={prop.nome}
                      onChangeText={(v) => setProprietariosExtras(prev => {
                        const updated = [...prev];
                        updated[idx].nome = v;
                        return updated;
                      })}
                      placeholder="Nome completo"
                      placeholderTextColor="#666"
                    />
                  </View>
                  <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
                    <Text style={styles.label}>NIF</Text>
                    <TextInput
                      style={styles.input}
                      value={prop.nif}
                      onChangeText={(v) => setProprietariosExtras(prev => {
                        const updated = [...prev];
                        updated[idx].nif = v;
                        return updated;
                      })}
                      placeholder="123456789"
                      placeholderTextColor="#666"
                      keyboardType="number-pad"
                      maxLength={9}
                    />
                  </View>
                </View>
                
                <View style={styles.row}>
                  <View style={[styles.inputContainer, styles.halfWidth]}>
                    <Text style={styles.label}>CC</Text>
                    <TextInput
                      style={styles.input}
                      value={prop.cc}
                      onChangeText={(v) => setProprietariosExtras(prev => {
                        const updated = [...prev];
                        updated[idx].cc = v;
                        return updated;
                      })}
                      placeholder="12345678"
                      placeholderTextColor="#666"
                    />
                  </View>
                  <View style={[styles.inputContainer, styles.halfWidth]}>
                    <Text style={styles.label}>Validade CC</Text>
                    <TextInput
                      style={styles.input}
                      value={prop.ccValidade}
                      onChangeText={(v) => setProprietariosExtras(prev => {
                        const updated = [...prev];
                        updated[idx].ccValidade = v;
                        return updated;
                      })}
                      placeholder="DD/MM/AAAA"
                      placeholderTextColor="#666"
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* SECÇÃO 2: DADOS DO IMÓVEL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏠 IMÓVEL</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tipo de Imóvel</Text>
            <View style={styles.chipContainer}>
              {TIPOS_IMOVEL.map((tipo) => (
                <TouchableOpacity
                  key={tipo}
                  style={[styles.chip, imovelTipo === tipo && styles.chipSelected]}
                  onPress={() => setImovelTipo(tipo)}
                >
                  <Text style={[styles.chipText, imovelTipo === tipo && styles.chipTextSelected]}>
                    {tipo}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tipologia (nº assoalhadas)</Text>
            <TextInput
              style={styles.input}
              value={imovelTipologia}
              onChangeText={setImovelTipologia}
              placeholder="T3"
              placeholderTextColor="#666"
            />
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

          {/* Tipo de Contrato */}
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

          {/* Natureza do Negócio */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Natureza do Negócio</Text>
            <View style={styles.chipContainer}>
              {TIPOS_NEGOCIO.map((tipo) => (
                <TouchableOpacity
                  key={tipo.id}
                  style={[styles.chip, tipoNegocio === tipo.id && styles.chipSelected]}
                  onPress={() => setTipoNegocio(tipo.id)}
                >
                  <Text style={[styles.chipText, tipoNegocio === tipo.id && styles.chipTextSelected]}>
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

          {/* Tipo de Comissão */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tipo de Comissão</Text>
            <View style={styles.chipContainer}>
              {TIPOS_COMISSAO.map((tipo) => (
                <TouchableOpacity
                  key={tipo.id}
                  style={[styles.chip, tipoComissao === tipo.id && styles.chipSelected]}
                  onPress={() => setTipoComissao(tipo.id)}
                >
                  <Text style={[styles.chipText, tipoComissao === tipo.id && styles.chipTextSelected]}>
                    {tipo.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            {tipoComissao === 'percentagem' ? (
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
            ) : (
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Valor Fixo (€)</Text>
                <TextInput
                  style={styles.input}
                  value={comissaoValorFixo}
                  onChangeText={setComissaoValorFixo}
                  placeholder="5000"
                  placeholderTextColor="#666"
                  keyboardType="decimal-pad"
                />
              </View>
            )}

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

          {/* Forma de Pagamento da Comissão */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Pagamento da Comissão</Text>
            <View style={styles.chipContainer}>
              {FORMAS_PAGAMENTO.map((forma) => (
                <TouchableOpacity
                  key={forma.id}
                  style={[styles.chip, formaPagamento === forma.id && styles.chipSelected]}
                  onPress={() => setFormaPagamento(forma.id)}
                >
                  <Text style={[styles.chipText, formaPagamento === forma.id && styles.chipTextSelected]}>
                    {forma.label}
                  </Text>
                </TouchableOpacity>
              ))}
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

        {/* BOTÃO PARTILHAR PDF */}
        <TouchableOpacity
          style={[styles.pdfButton, pdfLoading && styles.saveButtonDisabled]}
          onPress={handleGeneratePdf}
          disabled={pdfLoading}
        >
          {pdfLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="share-outline" size={20} color="#fff" />
              <Text style={styles.pdfButtonText}>Partilhar PDF</Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>

      {/* MODAL GERIR DOCUMENTOS */}
      <Modal visible={showDocsModal} animationType="slide" transparent>
        <View style={styles.docsModalOverlay}>
          <View style={styles.docsModalContent}>
            <View style={styles.docsModalHeader}>
              <Text style={styles.docsModalTitle}>Documentos Carregados</Text>
              <TouchableOpacity onPress={() => setShowDocsModal(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.docsModalList}>
              {savedDocs.length === 0 ? (
                <Text style={styles.docsModalEmpty}>Nenhum documento carregado</Text>
              ) : (
                savedDocs.map((doc, index) => (
                  <View key={index} style={styles.docsModalItem}>
                    <View style={styles.docsModalItemInfo}>
                      <Ionicons name="document-text" size={20} color="#00d9ff" />
                      <View style={styles.docsModalItemText}>
                        <Text style={styles.docsModalItemName} numberOfLines={1}>
                          {doc.name || `Documento ${index + 1}`}
                        </Text>
                        <Text style={styles.docsModalItemType}>
                          {doc.type || 'Tipo desconhecido'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={styles.docsModalDeleteBtn}
                      onPress={() => handleRemoveDocument(index, doc.name || `Documento ${index + 1}`)}
                    >
                      <Ionicons name="trash" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.docsModalCloseBtn}
              onPress={() => setShowDocsModal(false)}
            >
              <Text style={styles.docsModalCloseBtnText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  progressContainer: {
    width: '100%',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    color: '#888',
    fontSize: 12,
  },
  progressValue: {
    color: '#00d9ff',
    fontSize: 14,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00d9ff',
    borderRadius: 3,
  },
  progressHint: {
    color: '#666',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  // === ESTILOS PARA CATEGORIAS DE DOCUMENTOS ===
  docCategories: {
    gap: 12,
  },
  docCategory: {
    backgroundColor: '#0a0e1a',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  docCategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  docCategoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  docCategoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#1a1f2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docCategoryIconActive: {
    backgroundColor: '#00d9ff',
  },
  docCategoryText: {
    flex: 1,
  },
  docCategoryLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  docCategoryHint: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
  docCountBadge: {
    backgroundColor: '#00d9ff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  docCountText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
  },
  docCategoryList: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#222',
    gap: 6,
  },
  docCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  docCategoryItemText: {
    flex: 1,
    color: '#ccc',
    fontSize: 12,
  },
  docCategoryItemStatus: {
    color: '#34C759',
    fontSize: 11,
  },
  docCategoryItemRemove: {
    padding: 4,
  },
  docCategoryActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  docCategoryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00d9ff',
  },
  docCategoryBtnText: {
    color: '#00d9ff',
    fontSize: 13,
    fontWeight: '600',
  },
  // === PROPRIETÁRIOS DETECTADOS ===
  detectedOwners: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#0d1117',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#238636',
  },
  detectedOwnersTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  detectedOwnerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  detectedOwnerName: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
  },
  detectedOwnerRole: {
    color: '#888',
    fontSize: 11,
  },
  // === PROPRIETÁRIOS EXTRAS ===
  extraOwnerCard: {
    backgroundColor: '#0a0e1a',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  extraOwnerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  extraOwnerTitle: {
    color: '#00d9ff',
    fontSize: 14,
    fontWeight: '600',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addOutorganteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addOutorganteText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1a1f2e',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  infoText: {
    color: '#888',
    fontSize: 13,
    flex: 1,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00d9ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  scanButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
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
  docStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  docBadgeSaved: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '700',
  },
  docBadgePending: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '700',
  },
  docBadgeEmpty: {
    color: '#888',
    fontSize: 12,
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
  manageDocsLink: {
    color: '#00d9ff',
    fontSize: 14,
    fontWeight: '600',
  },
  pendingDocItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1a1f2e',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  pendingDocName: {
    flex: 1,
    color: '#fbbf24',
    fontSize: 12,
  },
  // Modal Gerir Documentos
  docsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  docsModalContent: {
    backgroundColor: '#1a1f2e',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    padding: 20,
  },
  docsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  docsModalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  docsModalList: {
    maxHeight: 400,
  },
  docsModalEmpty: {
    color: '#888',
    textAlign: 'center',
    padding: 20,
  },
  docsModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0a0e1a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  docsModalItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  docsModalItemText: {
    flex: 1,
  },
  docsModalItemName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  docsModalItemType: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  docsModalDeleteBtn: {
    padding: 8,
  },
  docsModalCloseBtn: {
    backgroundColor: '#00d9ff',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  docsModalCloseBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
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
