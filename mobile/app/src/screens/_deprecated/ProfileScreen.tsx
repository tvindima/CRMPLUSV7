/**
 * Perfil do Agente Imobiliário
 * App B2E - Uso exclusivo de agentes imobiliários Imóveis Mais
 * Configurações pessoais e informações da conta do agente
 */

import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Switch,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [darkMode, setDarkMode] = React.useState(false);
  const [notifications, setNotifications] = React.useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const MenuItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showArrow = true,
    rightComponent,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showArrow?: boolean;
    rightComponent?: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.menuItemLeft}>
        <Text style={styles.menuIcon}>{icon}</Text>
        <View style={styles.menuItemText}>
          <Text style={styles.menuTitle}>{title}</Text>
          {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent || (showArrow && (
        <Text style={styles.menuArrow}>›</Text>
      ))}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* User Info */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name || 'Agente'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {user?.role === 'admin' ? '👑 Admin' : '🏠 Agente'}
          </Text>
        </View>
      </View>

      {/* Conta */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Conta</Text>
        <View style={styles.menuGroup}>
          <MenuItem
            icon="👤"
            title="Editar Perfil"
            subtitle="Nome, email, telefone"
            onPress={() => {}}
          />
          <MenuItem
            icon="🔒"
            title="Alterar Senha"
            onPress={() => {}}
          />
        </View>
      </View>

      {/* Preferências */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferências</Text>
        <View style={styles.menuGroup}>
          <MenuItem
            icon="🌙"
            title="Modo Escuro"
            subtitle="Tema escuro para economizar bateria"
            showArrow={false}
            rightComponent={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
              />
            }
          />
          <MenuItem
            icon="🔔"
            title="Notificações"
            subtitle="Receber alertas de visitas e leads"
            showArrow={false}
            rightComponent={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
              />
            }
          />
          <MenuItem
            icon="🌍"
            title="Idioma"
            subtitle="Português"
            onPress={() => {}}
          />
        </View>
      </View>

      {/* Sobre */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sobre</Text>
        <View style={styles.menuGroup}>
          <MenuItem
            icon="ℹ️"
            title="Sobre o App"
            subtitle="Versão 0.1.0"
            onPress={() => {}}
          />
          <MenuItem
            icon="📄"
            title="Termos de Uso"
            onPress={() => {}}
          />
          <MenuItem
            icon="🔒"
            title="Política de Privacidade"
            onPress={() => {}}
          />
          <MenuItem
            icon="❓"
            title="Ajuda e Suporte"
            onPress={() => {}}
          />
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sair</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>CRM PLUS Mobile</Text>
        <Text style={styles.footerText}>v0.1.0 • Build 1</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    alignItems: 'center',
    padding: Spacing.xxl,
    backgroundColor: Colors.light.surface,
    ...Shadows.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: Typography.weights.bold,
    color: '#fff',
  },
  userName: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    fontSize: Typography.sizes.md,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
  },
  roleBadge: {
    backgroundColor: Colors.light.primary + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  roleText: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.primary,
    fontWeight: Typography.weights.semibold,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  menuGroup: {
    backgroundColor: Colors.light.surface,
    ...Shadows.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  menuItemText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    color: Colors.light.text,
  },
  menuSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  menuArrow: {
    fontSize: 24,
    color: Colors.light.textSecondary,
  },
  logoutButton: {
    backgroundColor: Colors.light.error,
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.md,
  },
  logoutText: {
    color: '#fff',
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  footer: {
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  footerText: {
    fontSize: Typography.sizes.xs,
    color: Colors.light.textSecondary,
  },
});
