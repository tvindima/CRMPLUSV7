/**
 * SplashScreenV4 - Fiel ao mockup
 * Logo CRM PLUS com ícone hexagonal vermelho e loading dots
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SplashScreenV4() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animateDots = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot1, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot1, {
            toValue: 0.3,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot2, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot2, {
            toValue: 0.3,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot3, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot3, {
            toValue: 0.3,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animateDots();
  }, []);

  return (
    <View style={styles.container}>
      {/* Hexagon Logo */}
      <View style={styles.logoContainer}>
        <Svg width={120} height={140} viewBox="0 0 120 140">
          {/* Hexagon outline */}
          <Path
            d="M60 10 L105 35 L105 95 L60 120 L15 95 L15 35 Z"
            fill="none"
            stroke="#ff3b5c"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          {/* Inner circuit icon */}
          <Circle cx="45" cy="65" r="8" fill="none" stroke="#ff3b5c" strokeWidth="3" />
          <Path
            d="M45 73 L45 95"
            stroke="#ff3b5c"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <Path
            d="M45 57 L45 45 L60 45"
            stroke="#ff3b5c"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Plus sign */}
          <Path
            d="M75 45 L75 55 M70 50 L80 50"
            stroke="#ff3b5c"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </Svg>
      </View>

      {/* CRM PLUS Text */}
      <View style={styles.textContainer}>
        <Text style={styles.crmText}>CRM</Text>
        <Text style={styles.plusText}> PLUS</Text>
      </View>

      {/* Loading Dots */}
      <View style={styles.dotsContainer}>
        <Animated.View style={[styles.dot, styles.dotPurple, { opacity: dot1 }]} />
        <Animated.View style={[styles.dot, styles.dotWhite, { opacity: dot2 }]} />
        <Animated.View style={[styles.dot, styles.dotCyan, { opacity: dot3 }]} />
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
    marginBottom: 24,
    shadowColor: '#ff3b5c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  crmText: {
    fontSize: 42,
    fontWeight: '700',
    color: '#00d9ff',
    textShadowColor: '#00d9ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  plusText: {
    fontSize: 42,
    fontWeight: '700',
    color: '#cc66ff',
    textShadowColor: '#cc66ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotPurple: {
    backgroundColor: '#6633ff',
  },
  dotWhite: {
    backgroundColor: '#ffffff',
  },
  dotCyan: {
    backgroundColor: '#00d9ff',
  },
});
