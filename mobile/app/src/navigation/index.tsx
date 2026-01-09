/**
 * Configuração de navegação principal
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

// Screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreenV3 from '../screens/LoginScreenV3';
import HomeScreenV5 from '../screens/HomeScreenV5';
import PropertiesScreenV4 from '../screens/PropertiesScreenV4';
import PropertyDetailScreenV4 from '../screens/PropertyDetailScreenV4';
import LeadsScreenV4 from '../screens/LeadsScreenV4';
import NewLeadScreenV4 from '../screens/NewLeadScreenV4';
import LeadDetailScreenV4 from '../screens/LeadDetailScreenV4';
import AgendaScreenV5 from '../screens/AgendaScreenV5';
import VisitDetailScreenV4 from '../screens/VisitDetailScreenV4';
import AgentScreenV4 from '../screens/AgentScreenV4';
import ProfileScreenV6 from '../screens/ProfileScreenV6';
import SettingsScreen from '../screens/SettingsScreen';
import FirstImpressionListScreen from '../screens/FirstImpressionListScreen';
import FirstImpressionFormScreen from '../screens/FirstImpressionFormScreen';
import FirstImpressionSignatureScreen from '../screens/FirstImpressionSignatureScreen';
import CMIFormScreen from '../screens/CMIFormScreen';
import TaxCalculatorScreen from '../screens/TaxCalculatorScreen';
import MortgageSimulatorScreen from '../screens/MortgageSimulatorScreen';
import ClientsScreen from '../screens/ClientsScreen';
import EscrituraFormScreen from '../screens/EscrituraFormScreen';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Main: undefined;
  NewLead: undefined;
  LeadDetail: { id: number };
  PropertyDetail: { id: number };
  VisitDetail: { id: number };
  Settings: undefined;
  FirstImpressionList: undefined;
  FirstImpressionForm: { impressionId?: number };
  FirstImpressionSignature: { impressionId: number; clientName: string };
  CMIForm: { cmiId?: number; firstImpressionId?: number };
  TaxCalculator: undefined;
  MortgageSimulator: undefined;
  Clients: undefined;
  EscrituraForm: { escrituraId?: number; propertyId?: number; clientId?: number; preAngariacaoId?: number };
};

export type TabParamList = {
  Home: undefined;
  Leads: undefined;
  Propriedades: undefined;
  Agenda: undefined;
  IA: undefined;
  Perfil: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const HomeStack = createNativeStackNavigator();
const LeadsStack = createNativeStackNavigator();
const PropertiesStack = createNativeStackNavigator();
const AgendaStack = createNativeStackNavigator();
const IAStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0a0e1a' },
        headerTintColor: '#fff',
      }}
    >
      <HomeStack.Screen name="HomeMain" component={HomeScreenV5} options={{ headerShown: false }} />
      <HomeStack.Screen name="NewLead" component={NewLeadScreenV4} options={{ title: 'Novo Lead' }} />
      <HomeStack.Screen name="PropertyDetail" component={PropertyDetailScreenV4} options={{ title: 'Detalhe do Imóvel' }} />
      <HomeStack.Screen name="LeadDetail" component={LeadDetailScreenV4} options={{ title: 'Detalhe do Lead' }} />
      <HomeStack.Screen name="TaxCalculator" component={TaxCalculatorScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="MortgageSimulator" component={MortgageSimulatorScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="Clients" component={ClientsScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="EscrituraForm" component={EscrituraFormScreen} options={{ headerShown: false }} />
    </HomeStack.Navigator>
  );
}

function LeadsStackNavigator() {
  return (
    <LeadsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0a0e1a' },
        headerTintColor: '#fff',
      }}
    >
      <LeadsStack.Screen name="LeadsMain" component={LeadsScreenV4} options={{ headerShown: false }} />
      <LeadsStack.Screen name="NewLead" component={NewLeadScreenV4} options={{ title: 'Novo Lead' }} />
      <LeadsStack.Screen name="LeadDetail" component={LeadDetailScreenV4} options={{ title: 'Detalhe do Lead' }} />
      <LeadsStack.Screen name="Clients" component={ClientsScreen} options={{ headerShown: false }} />
    </LeadsStack.Navigator>
  );
}

function PropertiesStackNavigator() {
  return (
    <PropertiesStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0a0e1a' },
        headerTintColor: '#fff',
      }}
    >
      <PropertiesStack.Screen name="PropertiesMain" component={PropertiesScreenV4} options={{ headerShown: false }} />
      <PropertiesStack.Screen name="PropertyDetail" component={PropertyDetailScreenV4} options={{ title: 'Detalhe do Imóvel' }} />
      <PropertiesStack.Screen name="FirstImpressionList" component={FirstImpressionListScreen} options={{ headerShown: false }} />
      <PropertiesStack.Screen name="FirstImpressionForm" component={FirstImpressionFormScreen} options={{ title: '1ª Impressão' }} />
      <PropertiesStack.Screen name="FirstImpressionSignature" component={FirstImpressionSignatureScreen} options={{ title: 'Assinatura' }} />
      <PropertiesStack.Screen name="CMIForm" component={CMIFormScreen} options={{ title: 'Contrato de Mediação (CMI)' }} />
      <PropertiesStack.Screen name="EscrituraForm" component={EscrituraFormScreen} options={{ headerShown: false }} />
    </PropertiesStack.Navigator>
  );
}

function AgendaStackNavigator() {
  return (
    <AgendaStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0a0e1a' },
        headerTintColor: '#fff',
      }}
    >
      <AgendaStack.Screen name="AgendaMain" component={AgendaScreenV5} options={{ headerShown: false }} />
      <AgendaStack.Screen name="VisitDetail" component={VisitDetailScreenV4} options={{ title: 'Detalhe da Visita' }} />
      <AgendaStack.Screen name="EscrituraForm" component={EscrituraFormScreen} options={{ headerShown: false }} />
    </AgendaStack.Navigator>
  );
}

function IAStackNavigator() {
  return (
    <IAStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0a0e1a' },
        headerTintColor: '#fff',
      }}
    >
      <IAStack.Screen name="IAMain" component={AgentScreenV4} options={{ headerShown: false }} />
    </IAStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0a0e1a' },
        headerTintColor: '#fff',
      }}
    >
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreenV6} options={{ headerShown: false }} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Definições' }} />
    </ProfileStack.Navigator>
  );
}

// Tabs Navigator (após login)
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand.cyan,
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#0a0e1a',
          borderTopWidth: 1,
          borderTopColor: '#1a1f2e',
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
          position: 'absolute',
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Início',
          tabBarIcon: ({ focused }) => (
            <Ionicons 
              name={focused ? "home" : "home-outline"} 
              size={24} 
              color={focused ? colors.brand.cyan : colors.text.tertiary} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Leads"
        component={LeadsStackNavigator}
        options={{
          tabBarLabel: 'Leads',
          tabBarIcon: ({ focused }) => (
            <Ionicons 
              name={focused ? "person" : "person-outline"} 
              size={24} 
              color={focused ? colors.brand.cyan : colors.text.tertiary} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Propriedades"
        component={PropertiesStackNavigator}
        options={{
          tabBarLabel: 'Imóveis',
          tabBarIcon: ({ focused }) => (
            <Ionicons 
              name={focused ? "business" : "business-outline"} 
              size={24} 
              color={focused ? colors.brand.cyan : colors.text.tertiary} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Agenda"
        component={AgendaStackNavigator}
        options={{
          tabBarLabel: 'Agenda',
          tabBarIcon: ({ focused }) => (
            <Ionicons 
              name={focused ? "calendar" : "calendar-outline"} 
              size={24} 
              color={focused ? colors.brand.cyan : colors.text.tertiary} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="IA"
        component={IAStackNavigator}
        options={{
          tabBarLabel: 'IA',
          tabBarIcon: ({ focused }) => (
            <Ionicons 
              name={focused ? "grid" : "grid-outline"} 
              size={24} 
              color={focused ? colors.brand.cyan : colors.text.tertiary} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ focused }) => (
            <Ionicons 
              name={focused ? "person" : "person-outline"} 
              size={24} 
              color={focused ? colors.brand.cyan : colors.text.tertiary} 
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Stack Navigator para 1ª Impressões (permite navegação entre lista/form/signature)
function FirstImpressionStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => ({
        headerStyle: {
          backgroundColor: '#0a0e1a',
          borderBottomWidth: 1,
          borderBottomColor: '#1a1f2e',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        // ✅ BOTÃO VOLTAR (esquerda)
        headerLeft: () => {
          const canGoBack = navigation.canGoBack();
          if (!canGoBack) return null;
          
          return (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ 
                marginLeft: 16, 
                flexDirection: 'row', 
                alignItems: 'center',
                paddingVertical: 8,
              }}
            >
              <Ionicons name="chevron-back" size={28} color={colors.brand.cyan} />
              <Text style={{ 
                color: colors.brand.cyan, 
                fontSize: 17, 
                marginLeft: 4,
                fontWeight: '600',
              }}>
                Voltar
              </Text>
            </TouchableOpacity>
          );
        },
        // ✅ BOTÃO DASHBOARD (direita)
        headerRight: () => (
          <TouchableOpacity
            onPress={() => {
              // Navegar para tab Home
              navigation.navigate('Main', { screen: 'Home' });
            }}
            style={{ 
              marginRight: 16,
              padding: 8,
            }}
          >
            <Ionicons name="home" size={26} color={colors.brand.cyan} />
          </TouchableOpacity>
        ),
      })}
    >
      <Stack.Screen
        name="FirstImpressionList"
        component={FirstImpressionListScreen}
        options={{ 
          title: '1ª Impressões',
          headerLeft: () => null, // SEM botão voltar na lista principal
        }}
      />
      <Stack.Screen
        name="FirstImpressionForm"
        component={FirstImpressionFormScreen}
        options={({ route }) => ({
          title: route.params?.impressionId ? 'Editar 1ª Impressão' : 'Nova 1ª Impressão',
        })}
      />
      <Stack.Screen
        name="FirstImpressionSignature"
        component={FirstImpressionSignatureScreen}
        options={{ title: 'Assinatura' }}
      />
      <Stack.Screen
        name="CMIForm"
        component={CMIFormScreen}
        options={{ title: 'Contrato de Mediação (CMI)' }}
      />
    </Stack.Navigator>
  );
}

// Loading screen simples (sem navegação) para usar enquanto verifica auth
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <LinearGradient
        colors={[colors.background.primary, '#0a1628']}
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}
      >
        <ActivityIndicator size="large" color={colors.brand.cyan} />
        <Text style={{ color: colors.text.secondary, marginTop: 16 }}>A carregar...</Text>
      </LinearGradient>
    </View>
  );
}

export default function Navigation() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName={user ? "Main" : "Login"}
      >
        {user ? (
          // Utilizador autenticado - mostrar app
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="FirstImpressionList" component={FirstImpressionStackNavigator} />
          </>
        ) : (
          // Não autenticado - mostrar login
          <>
            <Stack.Screen name="Login" component={LoginScreenV3} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
});
