/**
 * TaxCalculatorScreen - Calculadora de IMT & Imposto de Selo
 * Ferramenta utilitária standalone para simular impostos na aquisição de imóveis
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme';
import imtTables from '../config/imtTables.json';

type TipoImovel = 'habitacao' | 'comercial' | 'terreno';
type DestinoHabitacao = 'propria_permanente' | 'secundaria' | 'arrendamento';

interface ResultadoSimulacao {
  valorConsiderado: number;
  imt: number;
  impostoSelo: number;
  total: number;
  taxaImt: number;
  parcelaAbater: number;
}

export default function TaxCalculatorScreen({ navigation }: any) {
  // Estados dos inputs
  const [valorAquisicao, setValorAquisicao] = useState('');
  const [tipoImovel, setTipoImovel] = useState<TipoImovel | null>(null);
  const [destinoHabitacao, setDestinoHabitacao] = useState<DestinoHabitacao | null>(null);
  
  // Estado do resultado
  const [resultado, setResultado] = useState<ResultadoSimulacao | null>(null);
  
  // Estados UI dropdowns
  const [showTipoDropdown, setShowTipoDropdown] = useState(false);
  const [showDestinoDropdown, setShowDestinoDropdown] = useState(false);

  const tiposImovel = [
    { value: 'habitacao', label: 'Habitação' },
    { value: 'comercial', label: 'Comercial / Serviços' },
    { value: 'terreno', label: 'Terreno' },
  ];

  const destinosHabitacao = [
    { value: 'propria_permanente', label: 'Habitação própria permanente' },
    { value: 'secundaria', label: 'Habitação secundária / investimento' },
    { value: 'arrendamento', label: 'Arrendamento' },
  ];

  const formatarMoeda = (valor: number): string => {
    return valor.toLocaleString('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatarPercentagem = (valor: number): string => {
    return (valor * 100).toFixed(1) + '%';
  };

  const limparValor = (texto: string): string => {
    // Remove tudo exceto números e vírgula/ponto
    return texto.replace(/[^\d.,]/g, '').replace(',', '.');
  };

  const calcularIMT = (valor: number, tipoTabela: string): { imt: number; taxa: number; parcela: number } => {
    const tabela = (imtTables.imt as any)[tipoTabela];
    if (!tabela) {
      return { imt: 0, taxa: 0, parcela: 0 };
    }

    for (const escalao of tabela.escaloes) {
      // Se limite é null, aplica-se a todos os valores acima
      if (escalao.limite === null || valor <= escalao.limite) {
        const taxa = escalao.taxa;
        const parcela = escalao.parcela || 0;
        
        // Se tem nota "taxa única", aplicar diretamente
        if (escalao.nota === 'taxa única') {
          return { imt: valor * taxa, taxa, parcela: 0 };
        }
        
        // Fórmula: IMT = valor × taxa - parcela a abater
        const imt = Math.max(0, valor * taxa - parcela);
        return { imt, taxa, parcela };
      }
    }

    return { imt: 0, taxa: 0, parcela: 0 };
  };

  const obterTipoTabela = (): string | null => {
    if (tipoImovel === 'comercial') return 'comercial_servicos';
    if (tipoImovel === 'terreno') return 'terreno';
    if (tipoImovel === 'habitacao') {
      if (destinoHabitacao === 'propria_permanente') return 'habitacao_propria_permanente';
      if (destinoHabitacao === 'secundaria') return 'habitacao_secundaria';
      if (destinoHabitacao === 'arrendamento') return 'arrendamento';
    }
    return null;
  };

  const podeCaclular = (): boolean => {
    const valor = parseFloat(limparValor(valorAquisicao));
    if (isNaN(valor) || valor <= 0) return false;
    if (!tipoImovel) return false;
    if (tipoImovel === 'habitacao' && !destinoHabitacao) return false;
    return true;
  };

  const calcularImpostos = () => {
    const valor = parseFloat(limparValor(valorAquisicao));
    if (isNaN(valor) || valor <= 0) return;

    const tipoTabela = obterTipoTabela();
    if (!tipoTabela) return;

    // Calcular IMT
    const { imt, taxa, parcela } = calcularIMT(valor, tipoTabela);
    
    // Calcular Imposto de Selo (0.8%)
    const impostoSelo = valor * imtTables.impostoSelo.taxa;

    // Total
    const total = imt + impostoSelo;

    setResultado({
      valorConsiderado: valor,
      imt,
      impostoSelo,
      total,
      taxaImt: taxa,
      parcelaAbater: parcela,
    });
  };

  const limparResultado = () => {
    setResultado(null);
  };

  const handleValorChange = (text: string) => {
    setValorAquisicao(text);
    limparResultado();
  };

  const handleTipoChange = (tipo: TipoImovel) => {
    setTipoImovel(tipo);
    setShowTipoDropdown(false);
    // Limpar destino se não for habitação
    if (tipo !== 'habitacao') {
      setDestinoHabitacao(null);
    }
    limparResultado();
  };

  const handleDestinoChange = (destino: DestinoHabitacao) => {
    setDestinoHabitacao(destino);
    setShowDestinoDropdown(false);
    limparResultado();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color={colors.brand.cyan} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calculadora de Impostos</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Card 1 — Dados da aquisição */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calculator-outline" size={20} color={colors.brand.cyan} />
            <Text style={styles.cardTitle}>Dados da Aquisição</Text>
          </View>

          {/* Campo: Valor da aquisição */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Valor da aquisição (€) *</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={valorAquisicao}
                onChangeText={handleValorChange}
                placeholder="Ex: 250000"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="numeric"
              />
              <Text style={styles.inputSuffix}>€</Text>
            </View>
          </View>

          {/* Campo: Tipo de imóvel */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tipo de imóvel *</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => {
                setShowTipoDropdown(!showTipoDropdown);
                setShowDestinoDropdown(false);
              }}
            >
              <Text style={[
                styles.dropdownText,
                !tipoImovel && styles.dropdownPlaceholder
              ]}>
                {tipoImovel 
                  ? tiposImovel.find(t => t.value === tipoImovel)?.label 
                  : 'Selecionar tipo de imóvel'
                }
              </Text>
              <Ionicons 
                name={showTipoDropdown ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={colors.text.secondary} 
              />
            </TouchableOpacity>
            
            {showTipoDropdown && (
              <View style={styles.dropdownOptions}>
                {tiposImovel.map((tipo) => (
                  <TouchableOpacity
                    key={tipo.value}
                    style={[
                      styles.dropdownOption,
                      tipoImovel === tipo.value && styles.dropdownOptionActive
                    ]}
                    onPress={() => handleTipoChange(tipo.value as TipoImovel)}
                  >
                    <Text style={[
                      styles.dropdownOptionText,
                      tipoImovel === tipo.value && styles.dropdownOptionTextActive
                    ]}>
                      {tipo.label}
                    </Text>
                    {tipoImovel === tipo.value && (
                      <Ionicons name="checkmark" size={18} color={colors.brand.cyan} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Campo: Destino do imóvel (só se habitação) */}
          {tipoImovel === 'habitacao' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Destino do imóvel *</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => {
                  setShowDestinoDropdown(!showDestinoDropdown);
                  setShowTipoDropdown(false);
                }}
              >
                <Text style={[
                  styles.dropdownText,
                  !destinoHabitacao && styles.dropdownPlaceholder
                ]}>
                  {destinoHabitacao 
                    ? destinosHabitacao.find(d => d.value === destinoHabitacao)?.label 
                    : 'Selecionar destino'
                  }
                </Text>
                <Ionicons 
                  name={showDestinoDropdown ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={colors.text.secondary} 
                />
              </TouchableOpacity>
              
              {showDestinoDropdown && (
                <View style={styles.dropdownOptions}>
                  {destinosHabitacao.map((destino) => (
                    <TouchableOpacity
                      key={destino.value}
                      style={[
                        styles.dropdownOption,
                        destinoHabitacao === destino.value && styles.dropdownOptionActive
                      ]}
                      onPress={() => handleDestinoChange(destino.value as DestinoHabitacao)}
                    >
                      <Text style={[
                        styles.dropdownOptionText,
                        destinoHabitacao === destino.value && styles.dropdownOptionTextActive
                      ]}>
                        {destino.label}
                      </Text>
                      {destinoHabitacao === destino.value && (
                        <Ionicons name="checkmark" size={18} color={colors.brand.cyan} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Botão CTA */}
        <TouchableOpacity
          style={[
            styles.ctaButton,
            !podeCaclular() && styles.ctaButtonDisabled
          ]}
          onPress={calcularImpostos}
          disabled={!podeCaclular()}
        >
          <Ionicons name="calculator" size={20} color="#fff" />
          <Text style={styles.ctaButtonText}>Calcular impostos</Text>
        </TouchableOpacity>

        {/* Card 2 — Resultado da simulação */}
        {resultado && (
          <View style={styles.resultCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="receipt-outline" size={20} color={colors.success} />
              <Text style={styles.cardTitle}>Resultado da Simulação</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Valor considerado</Text>
              <Text style={styles.resultValue}>{formatarMoeda(resultado.valorConsiderado)}</Text>
            </View>

            <View style={styles.resultDivider} />

            <View style={styles.resultRow}>
              <View>
                <Text style={styles.resultLabel}>IMT</Text>
                <Text style={styles.resultSubLabel}>
                  Taxa: {formatarPercentagem(resultado.taxaImt)}
                  {resultado.parcelaAbater > 0 && ` | Parcela a abater: ${formatarMoeda(resultado.parcelaAbater)}`}
                </Text>
              </View>
              <Text style={styles.resultValue}>{formatarMoeda(resultado.imt)}</Text>
            </View>

            <View style={styles.resultRow}>
              <View>
                <Text style={styles.resultLabel}>Imposto de Selo</Text>
                <Text style={styles.resultSubLabel}>Taxa: 0,8%</Text>
              </View>
              <Text style={styles.resultValue}>{formatarMoeda(resultado.impostoSelo)}</Text>
            </View>

            <View style={styles.resultDivider} />

            <View style={styles.resultRowTotal}>
              <Text style={styles.resultTotalLabel}>Total estimado</Text>
              <Text style={styles.resultTotalValue}>{formatarMoeda(resultado.total)}</Text>
            </View>
          </View>
        )}

        {/* Nota legal */}
        <Text style={styles.legalNote}>
          Simulação indicativa. Valores não vinculativos.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  headerRight: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.card.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text.primary,
  },
  inputSuffix: {
    paddingRight: spacing.md,
    fontSize: 16,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  dropdownText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  dropdownPlaceholder: {
    color: colors.text.tertiary,
  },
  dropdownOptions: {
    marginTop: spacing.sm,
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.secondary,
  },
  dropdownOptionActive: {
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
  },
  dropdownOptionText: {
    fontSize: 15,
    color: colors.text.primary,
  },
  dropdownOptionTextActive: {
    color: colors.brand.cyan,
    fontWeight: '600',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.brand.cyan,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
  },
  ctaButtonDisabled: {
    backgroundColor: colors.text.disabled,
    opacity: 0.6,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  resultCard: {
    backgroundColor: colors.card.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  resultLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  resultSubLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  resultValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  resultDivider: {
    height: 1,
    backgroundColor: colors.border.secondary,
    marginVertical: spacing.sm,
  },
  resultRowTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  resultTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  resultTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.success,
  },
  legalNote: {
    fontSize: 12,
    color: colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
