/**
 * MortgageSimulatorScreen - Simulador de Prestação de Crédito Habitação
 * Ferramenta utilitária standalone para simular prestação mensal indicativa
 * 
 * NOTA: Simulação meramente indicativa. Não constitui proposta de crédito.
 */

import React, { useState, useEffect } from 'react';
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
import mortgageRates from '../config/mortgageRates.json';
import { useTerminology } from '../contexts/TerminologyContext';

type TipoFinalidade = 'hpp' | 'secundaria';

interface ResultadoSimulacao {
  valorFinanciado: number;
  prestacaoMensal: number;
  taxaEsforco: number;
  taxaAnual: number;
  nivelRisco: 'confortavel' | 'aceitavel' | 'risco' | 'muito_alto';
}

export default function MortgageSimulatorScreen({ navigation }: any) {
  const { terms } = useTerminology();
  
  // Estados dos inputs - Card 1
  const [valorImovel, setValorImovel] = useState('');
  const [tipoFinalidade, setTipoFinalidade] = useState<TipoFinalidade | null>(null);
  
  // Estados dos inputs - Card 2
  const [percentagemEntrada, setPercentagemEntrada] = useState('');
  const [prazoCredito, setPrazoCredito] = useState<number | null>(null);
  
  // Estados dos inputs - Card 3
  const [rendimentoMensal, setRendimentoMensal] = useState('');
  const [outrosCreditos, setOutrosCreditos] = useState('');
  
  // Estado do resultado
  const [resultado, setResultado] = useState<ResultadoSimulacao | null>(null);
  
  // Estados UI dropdowns
  const [showTipoDropdown, setShowTipoDropdown] = useState(false);
  const [showPrazoDropdown, setShowPrazoDropdown] = useState(false);

  const tiposFinalidade = [
    { value: 'hpp', label: 'Habitação própria permanente' },
    { value: 'secundaria', label: 'Habitação secundária / investimento' },
  ];

  const prazosDisponiveis = mortgageRates.prazosDisponiveis.map(p => ({
    value: p,
    label: `${p} anos`,
  }));

  // Atualizar entrada default quando tipo muda
  useEffect(() => {
    if (tipoFinalidade && !percentagemEntrada) {
      const entradaDefault = tipoFinalidade === 'hpp' 
        ? mortgageRates.entradaMinima.hpp * 100 
        : mortgageRates.entradaMinima.secundaria * 100;
      setPercentagemEntrada(entradaDefault.toString());
    }
  }, [tipoFinalidade]);

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
    return texto.replace(/[^\d.,]/g, '').replace(',', '.');
  };

  const podeCalcular = (): boolean => {
    const valor = parseFloat(limparValor(valorImovel));
    const rendimento = parseFloat(limparValor(rendimentoMensal));
    const entrada = parseFloat(limparValor(percentagemEntrada));
    
    if (isNaN(valor) || valor <= 0) return false;
    if (!tipoFinalidade) return false;
    if (isNaN(entrada) || entrada < 0 || entrada >= 100) return false;
    if (!prazoCredito) return false;
    if (isNaN(rendimento) || rendimento <= 0) return false;
    
    return true;
  };

  const calcularPrestacao = () => {
    const valor = parseFloat(limparValor(valorImovel));
    const entrada = parseFloat(limparValor(percentagemEntrada)) / 100;
    const rendimento = parseFloat(limparValor(rendimentoMensal));
    const outros = parseFloat(limparValor(outrosCreditos)) || 0;
    
    if (!tipoFinalidade || !prazoCredito) return;

    // Valor financiado
    const valorFinanciado = valor * (1 - entrada);
    
    // Taxa anual nominal (TAN)
    const euribor = mortgageRates.euribor.taxa;
    const spread = tipoFinalidade === 'hpp' 
      ? mortgageRates.spread.hpp.taxa 
      : mortgageRates.spread.secundaria.taxa;
    const taxaAnual = euribor + spread;
    
    // Taxa mensal
    const taxaMensal = taxaAnual / 12;
    
    // Prazo em meses
    const prazoMeses = prazoCredito * 12;
    
    // Prestação mensal (método francês)
    // P = C × [ r / (1 − (1 + r)^−n ) ]
    const prestacaoMensal = valorFinanciado * (taxaMensal / (1 - Math.pow(1 + taxaMensal, -prazoMeses)));
    
    // Taxa de esforço
    const taxaEsforco = (prestacaoMensal + outros) / rendimento;
    
    // Nível de risco
    let nivelRisco: 'confortavel' | 'aceitavel' | 'risco' | 'muito_alto';
    if (taxaEsforco <= mortgageRates.taxaEsforcoLimites.confortavel) {
      nivelRisco = 'confortavel';
    } else if (taxaEsforco <= mortgageRates.taxaEsforcoLimites.aceitavel) {
      nivelRisco = 'aceitavel';
    } else if (taxaEsforco <= mortgageRates.taxaEsforcoLimites.risco) {
      nivelRisco = 'risco';
    } else {
      nivelRisco = 'muito_alto';
    }

    setResultado({
      valorFinanciado,
      prestacaoMensal,
      taxaEsforco,
      taxaAnual,
      nivelRisco,
    });
  };

  const limparResultado = () => {
    setResultado(null);
  };

  const handleInputChange = (setter: (value: string) => void) => (text: string) => {
    setter(text);
    limparResultado();
  };

  const handleTipoChange = (tipo: TipoFinalidade) => {
    setTipoFinalidade(tipo);
    setShowTipoDropdown(false);
    // Atualizar entrada default
    const entradaDefault = tipo === 'hpp' 
      ? mortgageRates.entradaMinima.hpp * 100 
      : mortgageRates.entradaMinima.secundaria * 100;
    setPercentagemEntrada(entradaDefault.toString());
    limparResultado();
  };

  const handlePrazoChange = (prazo: number) => {
    setPrazoCredito(prazo);
    setShowPrazoDropdown(false);
    limparResultado();
  };

  const getRiscoConfig = (nivel: string) => {
    switch (nivel) {
      case 'confortavel':
        return { label: 'Confortável', color: colors.success, icon: 'checkmark-circle' };
      case 'aceitavel':
        return { label: 'Aceitável', color: colors.warning, icon: 'alert-circle' };
      case 'risco':
        return { label: 'Risco Elevado', color: '#f97316', icon: 'warning' };
      case 'muito_alto':
        return { label: 'Risco Muito Alto', color: colors.error, icon: 'close-circle' };
      default:
        return { label: 'N/A', color: colors.text.tertiary, icon: 'help-circle' };
    }
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
        <Text style={styles.headerTitle}>Simulador de Prestação</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Card 1 — Dados do imóvel */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="home-outline" size={20} color={colors.brand.cyan} />
            <Text style={styles.cardTitle}>Dados do {terms.item}</Text>
          </View>

          {/* Campo: Valor do imóvel */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Valor do {terms.item} (€) *</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={valorImovel}
                onChangeText={handleInputChange(setValorImovel)}
                placeholder="Ex: 250000"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="numeric"
              />
              <Text style={styles.inputSuffix}>€</Text>
            </View>
          </View>

          {/* Campo: Tipo/finalidade */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tipo / finalidade *</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => {
                setShowTipoDropdown(!showTipoDropdown);
                setShowPrazoDropdown(false);
              }}
            >
              <Text style={[
                styles.dropdownText,
                !tipoFinalidade && styles.dropdownPlaceholder
              ]}>
                {tipoFinalidade 
                  ? tiposFinalidade.find(t => t.value === tipoFinalidade)?.label 
                  : 'Selecionar finalidade'
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
                {tiposFinalidade.map((tipo) => (
                  <TouchableOpacity
                    key={tipo.value}
                    style={[
                      styles.dropdownOption,
                      tipoFinalidade === tipo.value && styles.dropdownOptionActive
                    ]}
                    onPress={() => handleTipoChange(tipo.value as TipoFinalidade)}
                  >
                    <Text style={[
                      styles.dropdownOptionText,
                      tipoFinalidade === tipo.value && styles.dropdownOptionTextActive
                    ]}>
                      {tipo.label}
                    </Text>
                    {tipoFinalidade === tipo.value && (
                      <Ionicons name="checkmark" size={18} color={colors.brand.cyan} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Card 2 — Financiamento */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="cash-outline" size={20} color={colors.brand.magenta} />
            <Text style={styles.cardTitle}>Financiamento</Text>
          </View>

          {/* Campo: Percentagem de entrada */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Percentagem de entrada (%) *</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={percentagemEntrada}
                onChangeText={handleInputChange(setPercentagemEntrada)}
                placeholder={tipoFinalidade === 'hpp' ? '10' : '20'}
                placeholderTextColor={colors.text.tertiary}
                keyboardType="numeric"
              />
              <Text style={styles.inputSuffix}>%</Text>
            </View>
            <Text style={styles.inputHint}>
              Mínimo recomendado: {tipoFinalidade === 'hpp' ? '10%' : tipoFinalidade === 'secundaria' ? '20%' : '10-20%'}
            </Text>
          </View>

          {/* Campo: Prazo do crédito */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Prazo do crédito *</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => {
                setShowPrazoDropdown(!showPrazoDropdown);
                setShowTipoDropdown(false);
              }}
            >
              <Text style={[
                styles.dropdownText,
                !prazoCredito && styles.dropdownPlaceholder
              ]}>
                {prazoCredito 
                  ? `${prazoCredito} anos` 
                  : 'Selecionar prazo'
                }
              </Text>
              <Ionicons 
                name={showPrazoDropdown ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={colors.text.secondary} 
              />
            </TouchableOpacity>
            
            {showPrazoDropdown && (
              <View style={styles.dropdownOptions}>
                {prazosDisponiveis.map((prazo) => (
                  <TouchableOpacity
                    key={prazo.value}
                    style={[
                      styles.dropdownOption,
                      prazoCredito === prazo.value && styles.dropdownOptionActive
                    ]}
                    onPress={() => handlePrazoChange(prazo.value)}
                  >
                    <Text style={[
                      styles.dropdownOptionText,
                      prazoCredito === prazo.value && styles.dropdownOptionTextActive
                    ]}>
                      {prazo.label}
                    </Text>
                    {prazoCredito === prazo.value && (
                      <Ionicons name="checkmark" size={18} color={colors.brand.cyan} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Card 3 — Proponente */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-outline" size={20} color={colors.brand.purple} />
            <Text style={styles.cardTitle}>Proponente</Text>
          </View>

          {/* Campo: Rendimento mensal */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Rendimento mensal líquido (€) *</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={rendimentoMensal}
                onChangeText={handleInputChange(setRendimentoMensal)}
                placeholder="Ex: 2500"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="numeric"
              />
              <Text style={styles.inputSuffix}>€</Text>
            </View>
          </View>

          {/* Campo: Outros créditos */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Outros créditos mensais (€)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={outrosCreditos}
                onChangeText={handleInputChange(setOutrosCreditos)}
                placeholder="0"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="numeric"
              />
              <Text style={styles.inputSuffix}>€</Text>
            </View>
            <Text style={styles.inputHint}>
              Inclui crédito automóvel, pessoal, cartões, etc.
            </Text>
          </View>
        </View>

        {/* Botão CTA */}
        <TouchableOpacity
          style={[
            styles.ctaButton,
            !podeCalcular() && styles.ctaButtonDisabled
          ]}
          onPress={calcularPrestacao}
          disabled={!podeCalcular()}
        >
          <Ionicons name="calculator" size={20} color="#fff" />
          <Text style={styles.ctaButtonText}>Calcular prestação</Text>
        </TouchableOpacity>

        {/* Card 4 — Resultado da simulação */}
        {resultado && (
          <View style={styles.resultCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="receipt-outline" size={20} color={colors.success} />
              <Text style={styles.cardTitle}>Resultado da Simulação</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Valor financiado</Text>
              <Text style={styles.resultValue}>{formatarMoeda(resultado.valorFinanciado)}</Text>
            </View>

            <View style={styles.resultRow}>
              <View>
                <Text style={styles.resultLabel}>Taxa anual (TAN)</Text>
                <Text style={styles.resultSubLabel}>Euribor + Spread</Text>
              </View>
              <Text style={styles.resultValue}>{formatarPercentagem(resultado.taxaAnual)}</Text>
            </View>

            <View style={styles.resultDivider} />

            <View style={styles.resultRowHighlight}>
              <Text style={styles.resultHighlightLabel}>Prestação mensal estimada</Text>
              <Text style={styles.resultHighlightValue}>{formatarMoeda(resultado.prestacaoMensal)}</Text>
            </View>

            <View style={styles.resultDivider} />

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Taxa de esforço</Text>
              <Text style={styles.resultValue}>{formatarPercentagem(resultado.taxaEsforco)}</Text>
            </View>

            {/* Indicador de risco */}
            <View style={[
              styles.riskIndicator, 
              { borderColor: getRiscoConfig(resultado.nivelRisco).color }
            ]}>
              <Ionicons 
                name={getRiscoConfig(resultado.nivelRisco).icon as any} 
                size={24} 
                color={getRiscoConfig(resultado.nivelRisco).color} 
              />
              <View style={styles.riskContent}>
                <Text style={[
                  styles.riskLabel, 
                  { color: getRiscoConfig(resultado.nivelRisco).color }
                ]}>
                  {getRiscoConfig(resultado.nivelRisco).label}
                </Text>
                <Text style={styles.riskDescription}>
                  {resultado.nivelRisco === 'confortavel' && 'Taxa de esforço ≤ 30%'}
                  {resultado.nivelRisco === 'aceitavel' && 'Taxa de esforço entre 30% e 35%'}
                  {resultado.nivelRisco === 'risco' && 'Taxa de esforço entre 35% e 40%'}
                  {resultado.nivelRisco === 'muito_alto' && 'Taxa de esforço > 40%'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Nota legal */}
        <Text style={styles.legalNote}>
          Simulação meramente indicativa.{'\n'}
          Não constitui proposta de crédito nem garante aprovação.
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
  inputHint: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
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
  resultRowHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(0, 217, 255, 0.08)',
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  resultHighlightLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  resultHighlightValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.brand.cyan,
  },
  riskIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  riskContent: {
    flex: 1,
  },
  riskLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  riskDescription: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  legalNote: {
    fontSize: 12,
    color: colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
