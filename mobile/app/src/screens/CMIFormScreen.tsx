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

  // Qual cliente está a ser preenchido pelo OCR (1 ou 2)
  const [ocrTargetCliente, setOcrTargetCliente] = useState<1 | 2>(1);

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

  useEffect(() => {
    loadData();
    loadAgentData();
    ensurePreAngariacao();
  }, []);

  const mapDocs = (docs?: any[]) => {
    const counts: Record<string, number> = {};
    (docs || []).forEach((d) => {
      const key = d?.type || 'outro';
      counts[key] = (counts[key] || 0) + 1;
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
      if (Platform.OS === 'web') {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } else {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const res = reader.result as string;
            resolve(res.substring(res.indexOf(',') + 1));
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob as any);
        });
        const fileUri = `${FileSystem.cacheDirectory}cmi-${cmi.numero_contrato || cmi.id}.pdf`;
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
  const openDocumentScanner = (docType: string, targetCliente: 1 | 2 = 1) => {
    setCurrentDocType(docType);
    setOcrTargetCliente(targetCliente);  // Define qual cliente preencher
    setShowCameraModal(true);
  };

  const docTypeToPreKey = (docType: string) => {
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
        
        // IMPORTANTE: Usar o tipo detectado pelo backend, não o tipo enviado pelo utilizador
        // O backend faz classificação automática e pode corrigir o tipo
        const tipoDocumento = ocrResult.tipo || currentDocType;
        console.log('[OCR] Tipo detectado pelo backend:', tipoDocumento);
        
        // Preencher campos automaticamente baseado no tipo de documento DETECTADO
        if (tipoDocumento === 'cc_frente' || tipoDocumento === 'cc_verso') {
          // Decidir qual cliente preencher baseado em ocrTargetCliente
          if (ocrTargetCliente === 2) {
            // SEGUNDO OUTORGANTE
            if (dados.nome) {
              setCliente2Nome(dados.nome);
              camposPreenchidos++;
            }
            if (dados.nif) {
              setCliente2Nif(dados.nif);
              camposPreenchidos++;
            }
            if (dados.numero_documento) {
              setCliente2Cc(dados.numero_documento);
              camposPreenchidos++;
            }
            if (dados.validade) {
              setCliente2CcValidade(dados.validade);
              camposPreenchidos++;
            }
          } else {
            // PRIMEIRO OUTORGANTE (default)
            if (dados.nome) {
              setClienteNome(dados.nome);
              camposPreenchidos++;
            }
            if (dados.nif) {
              setClienteNif(dados.nif);
              camposPreenchidos++;
            }
            if (dados.numero_documento) {
              setClienteCc(dados.numero_documento);
              camposPreenchidos++;
            }
            if (dados.validade) {
              setClienteCcValidade(dados.validade);
              camposPreenchidos++;
            }
          }
        } else if (tipoDocumento === 'caderneta_predial') {
          if (dados.artigo_matricial) {
            setImovelArtigoMatricial(dados.artigo_matricial);
            camposPreenchidos++;
          }
          if (dados.area_bruta) {
            setImovelAreaBruta(dados.area_bruta);
            camposPreenchidos++;
          }
          if (dados.area_util) {
            setImovelAreaUtil(dados.area_util);
            camposPreenchidos++;
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
        } else if (tipoDocumento === 'certidao_permanente') {
          if (dados.artigo_matricial) {
            setImovelArtigoMatricial(dados.artigo_matricial);
            camposPreenchidos++;
          }
          if (dados.area_bruta) {
            setImovelAreaBruta(dados.area_bruta);
            camposPreenchidos++;
          }
          if (dados.area_util) {
            setImovelAreaUtil(dados.area_util);
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
          if (dados.concelho) {
            setImovelConcelho(dados.concelho);
            camposPreenchidos++;
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

  const pickDocumentFromLibrary = async (docType: string) => {
    // Permite carregar documentos mesmo sem CMI - OCR standalone
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
        setPendingDocs((prev) => [
          ...prev,
          {
            docType,
            uri: result.assets[0].uri,
            mime: result.assets[0].mimeType || 'image/jpeg',
            name: result.assets[0].fileName || `${docType}-${Date.now()}.jpg`,
            base64: result.assets[0].base64,
          },
        ]);
        if (result.assets[0].base64) {
          await processOcrFromBase64(result.assets[0].base64);
        }
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📷 Digitalizar Documentos</Text>
            {savedDocs.length > 0 && (
              <TouchableOpacity onPress={() => setShowDocsModal(true)}>
                <Text style={styles.manageDocsLink}>Gerir ({savedDocs.length})</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.hint}>Fotografe ou anexe da galeria/ficheiros para preencher automaticamente</Text>
          
          <View style={styles.docList}>
            {DOCUMENT_TYPES.map((doc) => (
              <View key={doc.id} style={styles.docCard}>
                <View style={styles.docInfo}>
                  <Ionicons name={doc.icon as any} size={24} color="#00d9ff" />
                  <Text style={styles.docLabel}>{doc.label}</Text>
                </View>
                <View style={styles.docStatusRow}>
                  {savedDocsMap[docTypeToPreKey(doc.id)] ? (
                    <Text style={styles.docBadgeSaved}>
                      ✓ {savedDocsMap[docTypeToPreKey(doc.id)]} carregado(s)
                    </Text>
                  ) : (
                    <Text style={styles.docBadgeEmpty}>Nenhum carregado</Text>
                  )}
                  {pendingDocs.filter((d) => d.docType === doc.id).length > 0 && (
                    <Text style={styles.docBadgePending}>
                      {pendingDocs.filter((d) => d.docType === doc.id).length} por guardar
                    </Text>
                  )}
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
                
                {/* Mostrar documentos pendentes para este tipo */}
                {pendingDocs.filter((d) => d.docType === doc.id).map((pendingDoc, idx) => {
                  const globalIdx = pendingDocs.findIndex((d) => d === pendingDoc);
                  return (
                    <View key={idx} style={styles.pendingDocItem}>
                      <Ionicons name="time-outline" size={14} color="#fbbf24" />
                      <Text style={styles.pendingDocName} numberOfLines={1}>{pendingDoc.name}</Text>
                      <TouchableOpacity onPress={() => handleRemovePendingDoc(globalIdx)}>
                        <Ionicons name="close-circle" size={20} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
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
            
            {/* Botão para scan CC do 2º outorgante */}
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => openDocumentScanner('cc_frente', 2)}
            >
              <Ionicons name="camera" size={20} color="#FFF" />
              <Text style={styles.scanButtonText}>Scan CC do 2º Outorgante</Text>
            </TouchableOpacity>

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
          style={[styles.pdfButton, pdfLoading && styles.saveButtonDisabled]}
          onPress={handleGeneratePdf}
          disabled={pdfLoading}
        >
          {pdfLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="document" size={20} color="#fff" />
              <Text style={styles.pdfButtonText}>Gerar PDF</Text>
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
