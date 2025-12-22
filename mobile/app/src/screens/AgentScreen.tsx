import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface AIFeature {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: [string, string];
}

const AI_FEATURES: AIFeature[] = [
  {
    id: 'schedule',
    title: 'Organização de Agenda',
    description: 'Otimizar horários e agendamentos',
    icon: 'calendar-outline',
    colors: ['#00d9ff', '#0ea5e9'],
  },
  {
    id: 'social-post',
    title: 'Criar Post para Redes Sociais',
    description: 'Gerar conteúdo para redes sociais',
    icon: 'image-outline',
    colors: ['#8b5cf6', '#7c3aed'],
  },
  {
    id: 'notes',
    title: 'Anotar Ideias / Notas Rápidas',
    description: 'Adicionar e organizar notas rápidas',
    icon: 'document-text-outline',
    colors: ['#d946ef', '#c026d3'],
  },
  {
    id: 'messages',
    title: 'Gerar Mensagens & E-mails',
    description: 'Criar mensagens profissionais',
    icon: 'mail-outline',
    colors: ['#00d9ff', '#8b5cf6'],
  },
  {
    id: 'valuation',
    title: 'Gerar Avaliação de Imóvel',
    description: 'Análise de preço com base em mercado',
    icon: 'analytics-outline',
    colors: ['#8b5cf6', '#d946ef'],
  },
];

export default function AgentScreen() {
  const navigation = useNavigation();

  const handleFeaturePress = (featureId: string) => {
    // TODO: Implementar navegação para telas específicas de cada feature
    console.log('Feature pressed:', featureId);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#00d9ff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assistente IA</Text>
        <View style={styles.headerAvatar}>
          <Ionicons name="person-circle-outline" size={40} color="#00d9ff" />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.featuresContainer}>
          {AI_FEATURES.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={styles.featureCard}
              onPress={() => handleFeaturePress(feature.id)}
            >
              <LinearGradient
                colors={[`${feature.colors[0]}20`, `${feature.colors[1]}20`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.featureGradient}
              >
                <View style={styles.featureContent}>
                  <View
                    style={[
                      styles.featureIconContainer,
                      { backgroundColor: `${feature.colors[0]}30` },
                    ]}
                  >
                    <Ionicons
                      name={feature.icon}
                      size={32}
                      color={feature.colors[0]}
                    />
                  </View>
                  
                  <View style={styles.featureTextContainer}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>
                      {feature.description}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color="#9ca3af"
                  />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Ionicons name="information-circle-outline" size={24} color="#00d9ff" />
          <Text style={styles.infoText}>
            Estas funcionalidades usam IA para otimizar o seu trabalho diário
          </Text>
        </View>
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00d9ff',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  featuresContainer: {
    padding: 20,
    gap: 16,
  },
  featureCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#00d9ff40',
    shadowColor: '#00d9ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  featureGradient: {
    padding: 16,
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    marginBottom: 100,
    borderWidth: 1,
    borderColor: '#00d9ff40',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#9ca3af',
    marginLeft: 12,
    lineHeight: 18,
  },
});
