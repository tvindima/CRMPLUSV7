import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RootStackParamList = {
  Main: undefined;
  Login: undefined;
};

export default function SplashScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const logoScale = new Animated.Value(0.8);
  const logoOpacity = new Animated.Value(0);
  const dotAnim1 = new Animated.Value(0);
  const dotAnim2 = new Animated.Value(0);
  const dotAnim3 = new Animated.Value(0);

  useEffect(() => {
    // Logo animation
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Loading dots animation
    const animateDots = () => {
      Animated.sequence([
        Animated.timing(dotAnim1, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dotAnim2, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dotAnim3, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.delay(200),
        Animated.parallel([
          Animated.timing(dotAnim1, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.timing(dotAnim2, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.timing(dotAnim3, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ]).start(() => animateDots());
    };

    setTimeout(() => animateDots(), 600);

    // Check auth and navigate
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      setTimeout(() => {
        if (token) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      }, 2500);
    } catch (error) {
      console.error('Error checking auth:', error);
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' as never }],
        });
      }, 2500);
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo Hexagon */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        {/* Red Hexagon with glow */}
        <View style={styles.hexagonGlow}>
          <View style={styles.hexagon}>
            <View style={styles.hexagonInner}>
              {/* Circuit lines */}
              <View style={styles.circuitContainer}>
                <View style={styles.circuitDot1} />
                <View style={styles.circuitLine1} />
                <View style={styles.circuitDot2} />
                <View style={styles.circuitLine2} />
                <View style={styles.circuitPlus} />
              </View>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* CRM PLUS Text with gradient */}
      <Animated.View style={[styles.textContainer, { opacity: logoOpacity }]}>
        <LinearGradient
          colors={['#00d9ff', '#8b5cf6', '#d946ef']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.textGradient}
        >
          <View style={styles.textWrapper}>
            <View style={styles.crmText} />
            <View style={styles.plusText} />
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Loading dots */}
      <View style={styles.dotsContainer}>
        <Animated.View
          style={[
            styles.dot,
            {
              backgroundColor: '#00d9ff',
              opacity: dotAnim1,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            {
              backgroundColor: '#8b5cf6',
              opacity: dotAnim2,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            {
              backgroundColor: '#d946ef',
              opacity: dotAnim3,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 40,
  },
  hexagonGlow: {
    shadowColor: '#ff0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 20,
  },
  hexagon: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hexagonInner: {
    width: 160,
    height: 160,
    borderWidth: 4,
    borderColor: '#ff0000',
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    transform: [{ rotate: '30deg' }],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  circuitContainer: {
    width: 80,
    height: 80,
    transform: [{ rotate: '-30deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  circuitDot1: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff0000',
    position: 'absolute',
    top: 10,
    left: 20,
    shadowColor: '#ff0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  circuitLine1: {
    width: 2,
    height: 30,
    backgroundColor: '#ff0000',
    position: 'absolute',
    top: 22,
    left: 25,
    shadowColor: '#ff0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  circuitDot2: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff0000',
    position: 'absolute',
    bottom: 20,
    left: 20,
    shadowColor: '#ff0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  circuitLine2: {
    width: 30,
    height: 2,
    backgroundColor: '#ff0000',
    position: 'absolute',
    bottom: 26,
    right: 18,
    shadowColor: '#ff0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  circuitPlus: {
    width: 20,
    height: 20,
    position: 'absolute',
    bottom: 16,
    right: 8,
  },
  textContainer: {
    marginBottom: 60,
  },
  textGradient: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  textWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  crmText: {
    width: 120,
    height: 50,
  },
  plusText: {
    width: 80,
    height: 50,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    position: 'absolute',
    bottom: 120,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowColor: '#00d9ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
});
