import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import SignatureCanvas from 'react-native-signature-canvas';
import { firstImpressionService } from '../services/firstImpressionService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function FirstImpressionSignatureScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const impressionId = (route.params as any)?.impressionId;
  const clientName = (route.params as any)?.clientName || 'Cliente';

  const signatureRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Quando assinatura termina (usuário levanta o dedo)
  const handleSignatureEnd = () => {
    signatureRef.current?.readSignature();
  };

  // Capturar assinatura base64
  const handleSignatureOK = (signature: string) => {
    console.log('[Signature] ✅ Capturada (tamanho:', signature.length, ')');
    setSignatureData(signature);
    setShowPreview(true);
  };

  // Limpar canvas
  const handleClear = () => {
    signatureRef.current?.clearSignature();
    setSignatureData(null);
    setShowPreview(false);
  };

  // Confirmar e enviar para API
  const handleConfirm = async () => {
    if (!signatureData) {
      Alert.alert('Erro', 'Nenhuma assinatura capturada');
      return;
    }

    Alert.alert(
      'Confirmar Assinatura',
      `Confirmar assinatura de ${clientName}?\n\nEsta ação mudará o status do documento para "Assinado".`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              setLoading(true);

              // Enviar assinatura para API
              await firstImpressionService.addSignature(impressionId, signatureData);

              Alert.alert(
                '✅ Sucesso',
                'Assinatura adicionada com sucesso!',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Voltar para lista (2 níveis atrás)
                      navigation.navigate('FirstImpressionList' as never);
                    },
                  },
                ]
              );
            } catch (error: any) {
              console.error('[Signature] ❌ Erro ao enviar:', error);
              const errorMsg = error.response?.data?.detail || error.message || 'Erro desconhecido';
              Alert.alert('Erro', errorMsg);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // HTML do canvas (config)
  const webStyle = `
    .m-signature-pad {
      box-shadow: none;
      border: none;
      background-color: #ffffff;
    }
    .m-signature-pad--body {
      border: none;
    }
    .m-signature-pad--footer {
      display: none;
    }
    body, html {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
    }
  `;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#ef4444" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assinatura Digital</Text>
        <TouchableOpacity onPress={handleClear}>
          <Ionicons name="refresh" size={28} color="#00d9ff" />
        </TouchableOpacity>
      </View>

      {/* Info Cliente */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoLabel}>Cliente:</Text>
        <Text style={styles.infoValue}>{clientName}</Text>
        <Text style={styles.infoSubtext}>Por favor, assine no espaço abaixo</Text>
      </View>

      {/* Canvas de Assinatura */}
      <View style={styles.canvasContainer}>
        <SignatureCanvas
          ref={signatureRef}
          onEnd={handleSignatureEnd}
          onOK={handleSignatureOK}
          descriptionText=""
          clearText="Limpar"
          confirmText="Confirmar"
          webStyle={webStyle}
          autoClear={false}
          backgroundColor="#ffffff"
          penColor="#000000"
          minWidth={2}
          maxWidth={4}
        />
      </View>

      {/* Botões de Ação */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClear}
          disabled={loading}
        >
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
          <Text style={styles.clearButtonText}>Limpar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={loading || !signatureData}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.confirmButtonText}>Confirmar Assinatura</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal Preview Assinatura */}
      <Modal
        visible={showPreview}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={styles.previewOverlay}>
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>Preview da Assinatura</Text>

            {signatureData && (
              <View style={styles.previewImageContainer}>
                <img
                  src={signatureData}
                  alt="Assinatura"
                  style={{
                    width: '100%',
                    height: 200,
                    objectFit: 'contain',
                    backgroundColor: '#ffffff',
                    borderRadius: 12,
                  }}
                />
              </View>
            )}

            <View style={styles.previewActions}>
              <TouchableOpacity
                style={styles.previewCancelButton}
                onPress={() => {
                  setShowPreview(false);
                  handleClear();
                }}
              >
                <Text style={styles.previewCancelText}>Refazer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.previewConfirmButton}
                onPress={() => {
                  setShowPreview(false);
                  handleConfirm();
                }}
              >
                <Text style={styles.previewConfirmText}>Confirmar</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1f2e',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  infoContainer: {
    padding: 20,
    backgroundColor: '#1a1f2e',
    borderBottomWidth: 1,
    borderBottomColor: '#2d3748',
  },
  infoLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  infoSubtext: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  canvasContainer: {
    flex: 1,
    margin: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#2d3748',
    borderStyle: 'dashed',
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00d9ff',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    shadowColor: '#00d9ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  previewContainer: {
    backgroundColor: '#1a1f2e',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  previewImageContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  previewCancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#374151',
    alignItems: 'center',
  },
  previewCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
  },
  previewConfirmButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  previewConfirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
