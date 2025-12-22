/**
 * Skeleton Loader - Componente de carregamento
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { Colors, BorderRadius } from '../constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export default function Skeleton({ 
  width = '100%', 
  height = 20, 
  borderRadius = BorderRadius.md,
  style 
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  const driver = Platform.OS !== 'web';

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: driver,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: driver,
        }),
      ])
    ).start();
  }, [opacity, driver]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * Skeleton para card de propriedade
 */
export function SkeletonPropertyCard() {
  return (
    <View style={styles.card}>
      <Skeleton height={180} borderRadius={BorderRadius.lg} style={{ marginBottom: 12 }} />
      <Skeleton width="80%" height={24} style={{ marginBottom: 8 }} />
      <Skeleton width="60%" height={20} style={{ marginBottom: 8 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
        <Skeleton width="30%" height={24} />
        <Skeleton width="40%" height={24} />
      </View>
    </View>
  );
}

/**
 * Skeleton para card de lead
 */
export function SkeletonLeadCard() {
  return (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Skeleton width={48} height={48} borderRadius={BorderRadius.full} style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <Skeleton width="70%" height={20} style={{ marginBottom: 6 }} />
          <Skeleton width="50%" height={16} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <Skeleton width={80} height={32} borderRadius={BorderRadius.full} />
        <Skeleton width={80} height={32} borderRadius={BorderRadius.full} />
        <Skeleton width={80} height={32} borderRadius={BorderRadius.full} />
      </View>
    </View>
  );
}

/**
 * Skeleton para card de visita
 */
export function SkeletonVisitCard() {
  return (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Skeleton width={60} height={60} borderRadius={BorderRadius.md} style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <Skeleton width="80%" height={20} style={{ marginBottom: 6 }} />
          <Skeleton width="60%" height={16} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.light.textSecondary + '30',
  },
  card: {
    backgroundColor: Colors.light.surface,
    padding: 16,
    borderRadius: BorderRadius.lg,
    marginBottom: 12,
  },
});
