/**
 * Login Screen - Redesigned to match mockup
 * Com 2FA Code
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

// CREDENCIAIS DE TESTE (mesma database do backoffice Railway)
const DEFAULT_EMAIL = 'tvindima@imoveismais.pt';
const DEFAULT_PASSWORD = 'testepassword123';

export default function LoginScreenV2() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState(DEFAULT_EMAIL);
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [code2FA, setCode2FA] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('⚠️ Campos obrigatórios', 'Preencha email e senha para continuar');
      return;
    }

    setLoading(true);
    try {
      console.log('[LOGIN] Tentando login com:', email);
      
      // Simulate 2FA requirement (você pode implementar lógica real aqui)
      const requires2FA = false; // Change to true para testar 2FA
      
      if (requires2FA && !show2FA) {
        setShow2FA(true);
        setLoading(false);
        return;
      }
      
      await signIn(email, password);
      console.log('[LOGIN] ✅ Login bem-sucedido!');
    } catch (error: any) {
      console.error('[LOGIN] ❌ Erro completo:', error);
      
      let errorMessage = 'Verifique suas credenciais e tente novamente';
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.detail) {
        errorMessage = error.detail;
      }
      
      Alert.alert('❌ Erro ao fazer login', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFillTestCredentials = () => {
    setEmail(DEFAULT_EMAIL);
    setPassword(DEFAULT_PASSWORD);
    Alert.alert(
      '✅ Credenciais de Teste',
      `Email: ${DEFAULT_EMAIL}\nPassword: testepassword123\n\n(Mesma database do backoffice Railway)`
    );
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          {/* Hexagon Logo with red glow */}
          <View style={styles.hexagonContainer}>
            <LinearGradient
              colors={['#ff0000', '#aa0000']}
              style={styles.hexagon}
            >
              <View style={styles.hexagonInner}>
                <Ionicons name="git-network-outline" size={48} color="#ff0000" />
              </View>
            </LinearGradient>
          </View>

          {/* CRM PLUS Text with gradient */}
          <View style={styles.titleContainer}>
            <LinearGradient
              colors={['#00d9ff', '#8b5cf6', '#d946ef']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.titleGradient}
            >
              <Text style={styles.title}>CRM PLUS</Text>
            </LinearGradient>
          </View>

          <Text style={styles.subtitle}>Plataforma de Gestão Imobiliária</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {!show2FA ? (
            <>
              {/* Email Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>E-mail</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#00d9ff" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="agente@example.com"
                    placeholderTextColor="#6b7280"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#00d9ff" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#6b7280"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <Ionicons 
                      name={showPassword ? "eye-outline" : "eye-off-outline"} 
                      size={20} 
                      color="#6b7280" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password */}
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Esqueceu a password?</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* 2FA Code Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Código 2FA</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#00d9ff" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="000000"
                    placeholderTextColor="#6b7280"
                    value={code2FA}
                    onChangeText={setCode2FA}
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!loading}
                  />
                </View>
              </View>

              <Text style={styles.twoFAInfo}>Insira o código de 6 dígitos do seu aplicativo autenticador</Text>
            </>
          )}

          {/* Login Button */}
          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ['#374151', '#1f2937'] : ['#00d9ff', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginButtonGradient}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'Autenticando...' : show2FA ? 'Verificar Código' : 'Entrar'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {show2FA && (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => {
                setShow2FA(false);
                setCode2FA('');
              }}
            >
              <Text style={styles.backButtonText}>Voltar ao Login</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>v1.0.0 • CRM PLUS Mobile</Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: 80,
    marginBottom: 40,
  },
  hexagonContainer: {
    marginBottom: 24,
  },
  hexagon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
  hexagonInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#0a0e1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    marginBottom: 8,
  },
  titleGradient: {
    paddingHorizontal: 2,
    paddingVertical: 2,
    borderRadius: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  formSection: {
    flex: 1,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00d9ff',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1f2e',
    borderWidth: 1,
    borderColor: '#00d9ff40',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#00d9ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 32,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  twoFAInfo: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: -8,
    marginBottom: 24,
    lineHeight: 18,
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#00d9ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonDisabled: {
    shadowOpacity: 0.1,
  },
  loginButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  backButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
});
