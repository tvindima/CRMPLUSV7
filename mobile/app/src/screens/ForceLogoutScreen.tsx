/**
 * ForceLogoutScreen - Força logout para renovar token com agent_id
 * TEMPORÁRIO - Remove depois do primeiro login
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ForceLogoutScreen() {
  const { signOut } = useAuth();

  useEffect(() => {
    forceLogoutAndCleanup();
  }, []);

  const forceLogoutAndCleanup = async () => {
    try {
      console.log('[FORCE LOGOUT] Limpando tokens antigos sem agent_id...');
      
      // Limpar completamente o AsyncStorage
      await AsyncStorage.clear();
      
      // Chamar o signOut do AuthContext
      await signOut();
      
      console.log('[FORCE LOGOUT] ✅ Logout forçado concluído!');
    } catch (error) {
      console.error('[FORCE LOGOUT] Erro:', error);
      // Mesmo com erro, limpar storage
      await AsyncStorage.clear();
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#00d9ff" />
      <Text style={styles.text}>A atualizar sessão...</Text>
      <Text style={styles.subtext}>Por favor aguarde</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 20,
  },
  subtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
});
