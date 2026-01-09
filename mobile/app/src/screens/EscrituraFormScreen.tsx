/**
 * EscrituraFormScreen - Formulário para Marcar Escritura
 * Permite ao agente agendar escrituras com sincronização automática ao backoffice
 */
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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import DateTimePickerWrapper from '../components/DateTimePickerWrapper';

interface Props {
  navigation: any;
  route: {
    params?: {
      escrituraId?: number;  // Para edição
      propertyId?: number;   // Imóvel associado
      clientId?: number;     // Cliente associado
      preAngariacaoId?: number; // Pré-angariação associada
    };
  };
}

interface EscrituraData {
  property_id: number | null;
  agent_id: number;
  client_id: number | null;
  data_escritura: Date;
  hora_escritura: string;
  local_escritura: string;
  morada_cartorio: string;
  nome_comprador: string;
  nif_comprador: string;
  nome_vendedor: string;
  nif_vendedor: string;
  valor_venda: string;
  valor_comissao: string;
  percentagem_comissao: string;
  notas: string;
}

interface Property {
  id: number;
  reference: string;
  titulo: string;
  morada?: string;
  preco_venda?: number;
}

const EscrituraFormScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user } = useAuth();
  const editingId = route.params?.escrituraId;
  const isEditing = !!editingId;
  
  // Estados
  const [loading, setLoading] = useState(false);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [saving, setSaving] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Dados do formulário
  const [formData, setFormData] = useState<EscrituraData>({
    property_id: route.params?.propertyId || null,
    agent_id: user?.agent_id || 0,
    client_id: route.params?.clientId || null,
    data_escritura: new Date(),
    hora_escritura: '10:00',
    local_escritura: '',
    morada_cartorio: '',
    nome_comprador: '',
    nif_comprador: '',
    nome_vendedor: '',
    nif_vendedor: '',
    valor_venda: '',
    valor_comissao: '',
    percentagem_comissao: '5',
    notas: '',
  });

  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Carregar dados
  useEffect(() => {
    loadProperties();
    if (isEditing) {
      loadEscritura();
    }
    if (route.params?.propertyId) {
      loadPropertyDetails(route.params.propertyId);
    }
  }, []);

  const loadProperties = async () => {
    setLoadingProperties(true);
    try {
      const response = await apiService.get('/mobile/properties', { limit: 500 });
      if (response?.items) {
        setProperties(response.items);
      } else if (Array.isArray(response)) {
        setProperties(response);
      }
    } catch (error) {
      console.error('Erro ao carregar imóveis:', error);
    } finally {
      setLoadingProperties(false);
    }
  };

  const loadPropertyDetails = async (propertyId: number) => {
    try {
      const response = await apiService.get(`/mobile/properties/${propertyId}`);
      if (response) {
        setSelectedProperty(response);
        // Pré-preencher valor de venda se disponível
        if (response.preco_venda && !formData.valor_venda) {
          setFormData(prev => ({
            ...prev,
            valor_venda: response.preco_venda.toString(),
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes do imóvel:', error);
    }
  };

  const loadEscritura = async () => {
    setLoading(true);
    try {
      const response = await apiService.get(`/escrituras/${editingId}`);
      if (response.data) {
        const e = response.data;
        setFormData({
          property_id: e.property_id,
          agent_id: e.agent_id,
          client_id: e.client_id,
          data_escritura: new Date(e.data_escritura),
          hora_escritura: e.hora_escritura || '10:00',
          local_escritura: e.local_escritura || '',
          morada_cartorio: e.morada_cartorio || '',
          nome_comprador: e.nome_comprador || '',
          nif_comprador: e.nif_comprador || '',
          nome_vendedor: e.nome_vendedor || '',
          nif_vendedor: e.nif_vendedor || '',
          valor_venda: e.valor_venda?.toString() || '',
          valor_comissao: e.valor_comissao?.toString() || '',
          percentagem_comissao: e.percentagem_comissao?.toString() || '5',
          notas: e.notas || '',
        });
        if (e.property_id) {
          loadPropertyDetails(e.property_id);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar escritura:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados da escritura');
    } finally {
      setLoading(false);
    }
  };

  // Calcular comissão automaticamente
  const calcularComissao = (valorVenda: string, percentagem: string) => {
    const venda = parseFloat(valorVenda.replace(/[^\d.-]/g, '')) || 0;
    const perc = parseFloat(percentagem) || 0;
    const comissao = venda * (perc / 100);
    return comissao.toFixed(2);
  };

  const handleValorVendaChange = (valor: string) => {
    // Limpar e formatar
    const numerico = valor.replace(/[^\d]/g, '');
    const valorNumerico = numerico ? (parseInt(numerico) / 100).toFixed(2) : '';
    
    setFormData(prev => ({
      ...prev,
      valor_venda: valorNumerico,
      valor_comissao: valorNumerico ? calcularComissao(valorNumerico, prev.percentagem_comissao) : '',
    }));
  };

  const handlePercentagemChange = (percentagem: string) => {
    setFormData(prev => ({
      ...prev,
      percentagem_comissao: percentagem,
      valor_comissao: prev.valor_venda ? calcularComissao(prev.valor_venda, percentagem) : '',
    }));
  };

  const handleSelectProperty = (property: Property) => {
    setSelectedProperty(property);
    setFormData(prev => ({
      ...prev,
      property_id: property.id,
      valor_venda: property.preco_venda?.toString() || prev.valor_venda,
    }));
    setShowPropertyModal(false);
    
    // Recalcular comissão
    if (property.preco_venda) {
      setFormData(prev => ({
        ...prev,
        valor_comissao: calcularComissao(property.preco_venda!.toString(), prev.percentagem_comissao),
      }));
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, data_escritura: selectedDate }));
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      setFormData(prev => ({ ...prev, hora_escritura: `${hours}:${minutes}` }));
    }
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return num.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
  };

  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString('pt-PT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const validate = () => {
    if (!formData.property_id) {
      Alert.alert('Erro', 'Selecione o imóvel');
      return false;
    }
    if (!formData.local_escritura.trim()) {
      Alert.alert('Erro', 'Indique o local da escritura (cartório/notário)');
      return false;
    }
    if (!formData.valor_venda || parseFloat(formData.valor_venda) <= 0) {
      Alert.alert('Erro', 'Indique o valor de venda');
      return false;
    }
    if (!formData.nome_vendedor.trim()) {
      Alert.alert('Erro', 'Indique o nome do vendedor');
      return false;
    }
    if (!formData.nome_comprador.trim()) {
      Alert.alert('Erro', 'Indique o nome do comprador');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    setSaving(true);
    try {
      const payload = {
        property_id: formData.property_id,
        agent_id: user?.agent_id || formData.agent_id,
        client_id: formData.client_id,
        data_escritura: formData.data_escritura.toISOString(),
        hora_escritura: formData.hora_escritura,
        local_escritura: formData.local_escritura,
        morada_cartorio: formData.morada_cartorio,
        nome_comprador: formData.nome_comprador,
        nif_comprador: formData.nif_comprador,
        nome_vendedor: formData.nome_vendedor,
        nif_vendedor: formData.nif_vendedor,
        valor_venda: parseFloat(formData.valor_venda) || 0,
        valor_comissao: parseFloat(formData.valor_comissao) || 0,
        percentagem_comissao: parseFloat(formData.percentagem_comissao) || 5,
        notas: formData.notas,
      };
      
      let response;
      if (isEditing) {
        response = await apiService.put(`/escrituras/${editingId}`, payload);
      } else {
        response = await apiService.post('/escrituras/', payload);
      }
      
      if (response.data?.success) {
        Alert.alert(
          '✅ Sucesso',
          isEditing 
            ? 'Escritura atualizada com sucesso!' 
            : 'Escritura agendada!\n\nO backoffice será notificado para preparar a documentação.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error: any) {
      console.error('Erro ao salvar escritura:', error);
      Alert.alert('Erro', error.response?.data?.detail || 'Não foi possível salvar a escritura');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a56db" />
        <Text style={styles.loadingText}>A carregar...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Editar Escritura' : 'Marcar Escritura'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color="#1a56db" />
          <Text style={styles.infoBannerText}>
            O staff será notificado automaticamente para preparar a documentação necessária.
          </Text>
        </View>

        {/* === SECÇÃO: IMÓVEL === */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="home" size={18} color="#1a56db" /> Imóvel
          </Text>
          
          <TouchableOpacity 
            style={styles.selectorButton}
            onPress={() => setShowPropertyModal(true)}
          >
            {selectedProperty ? (
              <View style={styles.selectedItem}>
                <Text style={styles.selectedItemTitle}>{selectedProperty.reference}</Text>
                <Text style={styles.selectedItemSubtitle} numberOfLines={1}>
                  {selectedProperty.titulo || selectedProperty.morada}
                </Text>
                {selectedProperty.preco_venda && (
                  <Text style={styles.selectedItemPrice}>
                    {formatCurrency(selectedProperty.preco_venda.toString())}
                  </Text>
                )}
              </View>
            ) : (
              <View style={styles.selectorPlaceholder}>
                <Ionicons name="add-circle-outline" size={24} color="#6b7280" />
                <Text style={styles.selectorPlaceholderText}>Selecionar Imóvel</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* === SECÇÃO: DATA E LOCAL === */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="calendar" size={18} color="#1a56db" /> Data e Local
          </Text>

          <View style={styles.row}>
            {/* Data */}
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Data *</Text>
              {Platform.OS === 'web' ? (
                <View style={styles.dateButton}>
                  <Ionicons name="calendar-outline" size={20} color="#1a56db" />
                  <input
                    type="date"
                    value={formData.data_escritura.toISOString().split('T')[0]}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e: any) => {
                      const newDate = new Date(e.target.value);
                      setFormData(prev => ({ ...prev, data_escritura: newDate }));
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#374151',
                      fontSize: 16,
                      marginLeft: 8,
                      outline: 'none',
                    } as any}
                  />
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#1a56db" />
                  <Text style={styles.dateButtonText}>
                    {formData.data_escritura.toLocaleDateString('pt-PT')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            {/* Hora */}
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Hora *</Text>
              {Platform.OS === 'web' ? (
                <View style={styles.dateButton}>
                  <Ionicons name="time-outline" size={20} color="#1a56db" />
                  <input
                    type="time"
                    value={formData.hora_escritura}
                    onChange={(e: any) => {
                      setFormData(prev => ({ ...prev, hora_escritura: e.target.value }));
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#374151',
                      fontSize: 16,
                      marginLeft: 8,
                      outline: 'none',
                    } as any}
                  />
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color="#1a56db" />
                  <Text style={styles.dateButtonText}>{formData.hora_escritura}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text style={styles.dateDisplayText}>
            {formatDateDisplay(formData.data_escritura)} às {formData.hora_escritura}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Local (Cartório/Notário) *</Text>
            <TextInput
              style={styles.input}
              value={formData.local_escritura}
              onChangeText={(text) => setFormData(prev => ({ ...prev, local_escritura: text }))}
              placeholder="Ex: Cartório Notarial de Lisboa"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Morada do Cartório</Text>
            <TextInput
              style={styles.input}
              value={formData.morada_cartorio}
              onChangeText={(text) => setFormData(prev => ({ ...prev, morada_cartorio: text }))}
              placeholder="Rua, Número, Código Postal"
              multiline
            />
          </View>
        </View>

        {/* === SECÇÃO: PARTES === */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="people" size={18} color="#1a56db" /> Partes Envolvidas
          </Text>

          {/* Vendedor */}
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>Vendedor</Text>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 2, marginRight: 8 }]}>
                <Text style={styles.label}>Nome *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.nome_vendedor}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, nome_vendedor: text }))}
                  placeholder="Nome completo"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>NIF</Text>
                <TextInput
                  style={styles.input}
                  value={formData.nif_vendedor}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, nif_vendedor: text }))}
                  placeholder="NIF"
                  keyboardType="numeric"
                  maxLength={9}
                />
              </View>
            </View>
          </View>

          {/* Comprador */}
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>Comprador</Text>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 2, marginRight: 8 }]}>
                <Text style={styles.label}>Nome *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.nome_comprador}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, nome_comprador: text }))}
                  placeholder="Nome completo"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>NIF</Text>
                <TextInput
                  style={styles.input}
                  value={formData.nif_comprador}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, nif_comprador: text }))}
                  placeholder="NIF"
                  keyboardType="numeric"
                  maxLength={9}
                />
              </View>
            </View>
          </View>
        </View>

        {/* === SECÇÃO: VALORES === */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="cash" size={18} color="#1a56db" /> Valores
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Valor de Venda *</Text>
            <View style={styles.currencyInputContainer}>
              <Text style={styles.currencySymbol}>€</Text>
              <TextInput
                style={styles.currencyInput}
                value={formData.valor_venda}
                onChangeText={handleValorVendaChange}
                placeholder="0,00"
                keyboardType="numeric"
              />
            </View>
            {formData.valor_venda && (
              <Text style={styles.valueFormatted}>{formatCurrency(formData.valor_venda)}</Text>
            )}
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Comissão (%)</Text>
              <TextInput
                style={styles.input}
                value={formData.percentagem_comissao}
                onChangeText={handlePercentagemChange}
                placeholder="5"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 2 }]}>
              <Text style={styles.label}>Valor Comissão</Text>
              <View style={styles.currencyInputContainer}>
                <Text style={styles.currencySymbol}>€</Text>
                <TextInput
                  style={[styles.currencyInput, { backgroundColor: '#f3f4f6' }]}
                  value={formData.valor_comissao}
                  editable={false}
                  placeholder="Calculado automaticamente"
                />
              </View>
            </View>
          </View>

          {formData.valor_comissao && parseFloat(formData.valor_comissao) > 0 && (
            <View style={styles.comissaoBox}>
              <Ionicons name="checkmark-circle" size={20} color="#059669" />
              <Text style={styles.comissaoText}>
                Comissão: {formatCurrency(formData.valor_comissao)}
              </Text>
            </View>
          )}
        </View>

        {/* === SECÇÃO: NOTAS === */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="document-text" size={18} color="#1a56db" /> Notas
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notas}
            onChangeText={(text) => setFormData(prev => ({ ...prev, notas: text }))}
            placeholder="Informações adicionais, observações..."
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Botões */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.submitButton, saving && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>
                  {isEditing ? 'Guardar' : 'Marcar Escritura'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal Seleção de Imóvel */}
      <Modal
        visible={showPropertyModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecionar Imóvel</Text>
            <TouchableOpacity onPress={() => setShowPropertyModal(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          
          {loadingProperties ? (
            <ActivityIndicator size="large" color="#1a56db" style={{ marginTop: 40 }} />
          ) : (
            <ScrollView style={styles.modalList}>
              {properties.map((property) => (
                <TouchableOpacity
                  key={property.id}
                  style={[
                    styles.propertyItem,
                    selectedProperty?.id === property.id && styles.propertyItemSelected
                  ]}
                  onPress={() => handleSelectProperty(property)}
                >
                  <View style={styles.propertyInfo}>
                    <Text style={styles.propertyReference}>{property.reference}</Text>
                    <Text style={styles.propertyTitle} numberOfLines={1}>
                      {property.titulo || property.morada || 'Sem título'}
                    </Text>
                    {property.preco_venda && (
                      <Text style={styles.propertyPrice}>
                        {formatCurrency(property.preco_venda.toString())}
                      </Text>
                    )}
                  </View>
                  {selectedProperty?.id === property.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#1a56db" />
                  )}
                </TouchableOpacity>
              ))}
              {properties.length === 0 && (
                <Text style={styles.emptyText}>Nenhum imóvel disponível</Text>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Date Pickers - Apenas para mobile (Android/iOS) */}
      {Platform.OS !== 'web' && showDatePicker && (
        <DateTimePickerWrapper
          value={formData.data_escritura}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}
      
      {Platform.OS !== 'web' && showTimePicker && (
        <DateTimePickerWrapper
          value={(() => {
            const [hours, minutes] = formData.hora_escritura.split(':');
            const date = new Date();
            date.setHours(parseInt(hours), parseInt(minutes));
            return date;
          })()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1a56db',
  },
  infoBannerText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1f2937',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  selectorPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorPlaceholderText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#6b7280',
  },
  selectedItem: {
    flex: 1,
  },
  selectedItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a56db',
  },
  selectedItemSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  selectedItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginTop: 4,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#1f2937',
  },
  dateDisplayText: {
    fontSize: 14,
    color: '#1a56db',
    fontStyle: 'italic',
    marginBottom: 16,
    textAlign: 'center',
  },
  partyBox: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#f9fafb',
  },
  partyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  currencyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  currencySymbol: {
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  currencyInput: {
    flex: 1,
    paddingVertical: 10,
    paddingRight: 12,
    fontSize: 15,
    color: '#1f2937',
  },
  valueFormatted: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'right',
  },
  comissaoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  comissaoText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#059669',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#1a56db',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalList: {
    flex: 1,
    padding: 16,
  },
  propertyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  propertyItemSelected: {
    borderColor: '#1a56db',
    backgroundColor: '#eff6ff',
  },
  propertyInfo: {
    flex: 1,
  },
  propertyReference: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a56db',
  },
  propertyTitle: {
    fontSize: 14,
    color: '#374151',
    marginTop: 4,
  },
  propertyPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 15,
    marginTop: 40,
  },
});

export default EscrituraFormScreen;
