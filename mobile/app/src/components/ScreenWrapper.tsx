import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, layout } from '../theme';

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
  noScroll?: boolean;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  style,
  noPadding = false,
}) => {
  return (
    <LinearGradient
      colors={colors.background.gradient}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View
          style={[
            styles.container,
            !noPadding && styles.padded,
            style,
          ]}
        >
          {children}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: layout.screenPadding,
  },
});
