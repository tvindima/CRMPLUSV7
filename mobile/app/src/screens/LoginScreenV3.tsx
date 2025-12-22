/**
 * LoginScreen V3 - Fiel ao mockup
 * Avatar guardado do último user, só password field, 2FA Code button
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Animated,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function LoginScreenV3() {
  const { signIn, loading: authLoading } = useAuth();
  const driver = Platform.OS !== 'web';
  
  // Stored user info
  const [savedUser, setSavedUser] = useState<{
    name: string;
    email: string;
    avatar_url: string;
  } | null>(null);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailField, setShowEmailField] = useState(false);
  
  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const loadingBarAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadSavedUser();
    startGlowAnimation();
  }, []);

  const loadSavedUser = async () => {
    try {
      const savedData = await AsyncStorage.getItem('last_logged_user');
      if (savedData) {
        const userData = JSON.parse(savedData);
        setSavedUser(userData);
        setEmail(userData.email);
      } else {
        // Se não houver user guardado, mostra campo email
        setShowEmailField(true);
      }
    } catch (error) {
      console.error('Error loading saved user:', error);
      setShowEmailField(true);
    }
  };

  const startGlowAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: driver,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: driver,
        }),
      ])
    ).start();
  };

  const animateLoadingBar = () => {
    loadingBarAnim.setValue(0);
    Animated.timing(loadingBarAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();
  };

  const handleLogin = async () => {
    if (!email || !password) {
      if (Platform.OS === 'web') {
        window.alert('Preencha todos os campos');
      }
      return;
    }

    setIsLoading(true);
    animateLoadingBar();

    try {
      await signIn(email, password);
      
      // Guardar dados do user para próximo login
      if (savedUser || email) {
        const userToSave = savedUser || { 
          name: email.split('@')[0], 
          email, 
          avatar_url: '' 
        };
        await AsyncStorage.setItem('last_logged_user', JSON.stringify(userToSave));
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (Platform.OS === 'web') {
        window.alert(error.message || 'Credenciais inválidas');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchAccount = () => {
    setSavedUser(null);
    setShowEmailField(true);
    setEmail('');
    setPassword('');
  };

  const handle2FA = () => {
    if (Platform.OS === 'web') {
      window.alert('2FA Code - Funcionalidade em desenvolvimento');
    }
  };

  const formatName = (name: string) => {
    if (!name) return 'User';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return `${parts[0]} ${parts[1][0]}.`;
    }
    return parts[0];
  };

  return (
    <View style={styles.container}>
      {/* Animated background gradient */}
      <LinearGradient
        colors={['#0a0e1a', '#111827', '#0a0e1a']}
        style={styles.backgroundGradient}
      />

      {/* Glow effects */}
      <Animated.View
        style={[
          styles.glowOrb1,
          {
            opacity: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 0.6],
            }),
          },
        ]}
      />
      <Animated.View
        style={[
          styles.glowOrb2,
          {
            opacity: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.4, 0.7],
            }),
          },
        ]}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header with CRM PLUS Logo */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/brand/logo-transparent.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Avatar Section */}
          {savedUser && !showEmailField ? (
            <View style={styles.avatarSection}>
              <View style={styles.avatarWrapper}>
                {/* Outer glow ring */}
                <Animated.View
                  style={[
                    styles.avatarGlow,
                    {
                      opacity: glowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.4, 0.8],
                      }),
                      transform: [
                        {
                          scale: glowAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.1],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                
                {/* Avatar image */}
                {savedUser.avatar_url ? (
                  <Image
                    source={{ uri: savedUser.avatar_url }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <LinearGradient
                    colors={['#374151', '#1f2937']}
                    style={styles.avatarPlaceholder}
                  >
                    <Text style={styles.avatarInitial}>
                      {savedUser.name?.[0]?.toUpperCase() || 'U'}
                    </Text>
                  </LinearGradient>
                )}
              </View>

              {/* User name */}
              <Text style={styles.userName}>{formatName(savedUser.name)}</Text>

              {/* Switch account link */}
              <TouchableOpacity onPress={handleSwitchAccount}>
                <Text style={styles.switchAccount}>Não é você? Trocar conta</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.titleSection}>
              <Text style={styles.title}>Bem-vindo</Text>
              <Text style={styles.subtitle}>Faça login para continuar</Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            {/* Email field - only if no saved user */}
            {showEmailField && (
              <View style={styles.inputContainer}>
                <LinearGradient
                  colors={['#1a1f2e', '#111827']}
                  style={styles.inputGradient}
                >
                  <Ionicons name="mail-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#6b7280"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </LinearGradient>
              </View>
            )}

            {/* Password field */}
            <View style={styles.inputContainer}>
              <LinearGradient
                colors={['#1a1f2e', '#111827']}
                style={styles.inputGradient}
              >
                <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#6b7280"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </LinearGradient>
            </View>

            {/* 2FA Code Button */}
            <TouchableOpacity style={styles.twoFAButton} onPress={handle2FA}>
              <View style={styles.twoFAContent}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#00d9ff" />
                <Text style={styles.twoFAText}>2FA Code</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={isLoading || authLoading}
            >
              <LinearGradient
                colors={['#00d9ff', '#00b8d9']}
                style={styles.loginGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading || authLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.loginText}>Entrar</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Esqueceu a password?</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom loading bar */}
      {(isLoading || authLoading) && (
        <View style={styles.loadingBarContainer}>
          <Animated.View
            style={[
              styles.loadingBar,
              {
                width: loadingBarAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          >
            <LinearGradient
              colors={['#00d9ff', '#d946ef']}
              style={styles.loadingBarGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>
      )}

      {/* Bottom indicator */}
      <View style={styles.bottomIndicator}>
        <View style={styles.indicatorBar} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a',
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  glowOrb1: {
    position: 'absolute',
    top: 100,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#00d9ff',
    opacity: 0.3,
    ...(Platform.OS === 'web' && { filter: 'blur(80px)' as any }),
  },
  glowOrb2: {
    position: 'absolute',
    bottom: 200,
    left: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#d946ef',
    opacity: 0.3,
    ...(Platform.OS === 'web' && { filter: 'blur(60px)' as any }),
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    marginBottom: 10,
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 75,
    backgroundColor: '#00d9ff',
    opacity: 0.5,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#00d9ff',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#00d9ff',
  },
  avatarInitial: {
    fontSize: 48,
    fontWeight: '700',
    color: '#9ca3af',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  switchAccount: {
    fontSize: 14,
    color: '#00d9ff',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
  },
  eyeButton: {
    padding: 4,
  },
  twoFAButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1f2e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
  },
  twoFAContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  twoFAText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  loginButton: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  loginGradient: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  loginText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  forgotPassword: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#6b7280',
  },
  loadingBarContainer: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    height: 4,
    backgroundColor: '#1a1f2e',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingBar: {
    height: '100%',
  },
  loadingBarGradient: {
    flex: 1,
  },
  bottomIndicator: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  indicatorBar: {
    width: 134,
    height: 5,
    backgroundColor: '#ffffff',
    borderRadius: 2.5,
  },
});
