import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Logo from '~/assets/logo';
import type { ActiveRole } from '~/context/auth';
import { useSession } from '~/context/auth';
import { api } from '~/utils/api';

const COLORS = {
  background: '#002447',
  surface: '#0a3060',
  accent: '#ffa300',
  accentText: '#002447',
  primary: '#13a8fe',
  magenta: '#ff00ff',
  white: '#ffffff',
  whiteSubtle: 'rgba(255,255,255,0.6)',
} as const;

export default function RoleSelection() {
  const insets = useSafeAreaInsets();
  const { user, setActiveRole } = useSession();
  const employeeStatus = api.mobile.auth.checkEmployeeStatus.useQuery(
    { userId: user?.id ?? "" },
    { enabled: !!user?.id, retry: 1 },
  );

  const handleSelectRole = (role: ActiveRole) => {
    setActiveRole(role);
    if (role === 'EMPLOYEE') {
      const firstAssignment = employeeStatus.data?.assignments[0];
      if (firstAssignment) {
        router.replace({
          pathname: '/(app)/guild/[userOnGuildId]',
          params: { userOnGuildId: firstAssignment.id },
        });
      } else {
        router.replace('/(app)/home/(tabs)');
      }
    } else {
      router.replace('/(app)/home/(tabs)');
    }
  };

  if (employeeStatus.isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={{ height: 45, width: 45 }}>
            <Logo fill={COLORS.white} />
          </View>
          <Text style={styles.logoText}>orevent</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.greeting}>
          Hola, {user?.name?.split(' ')[0] ?? 'usuario'}
        </Text>
        <Text style={styles.title}>
          {'\u00BF'}C{'\u00F3'}mo deseas{'\n'}ingresar hoy?
        </Text>
        <Text style={styles.subtitle}>
          Detectamos que tienes asignaciones como empleado en eventos activos.
        </Text>

        {/* Guild/Event info */}
        {employeeStatus.data?.assignments.map((assignment) => (
          <View key={assignment.id} style={styles.assignmentCard}>
            <MaterialCommunityIcons name="domain" size={18} color={COLORS.magenta} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.assignmentGuild}>{assignment.guild.name}</Text>
              {assignment.employeeOnEvent.map((eoe) => (
                <Text key={eoe.id} style={styles.assignmentEvent}>
                  {eoe.event.name}
                  {eoe.gate ? ` — Puerta: ${eoe.gate.name}` : ''}
                  {eoe.counter ? ` — Barra: ${eoe.counter.name}` : ''}
                </Text>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* Buttons */}
      <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + 30 }]}>
        <Pressable
          style={styles.employeeButton}
          onPress={() => handleSelectRole('EMPLOYEE')}
        >
          <MaterialCommunityIcons
            name="qrcode-scan"
            size={22}
            color={COLORS.accentText}
            style={{ marginRight: 10 }}
          />
          <Text style={styles.employeeButtonText}>Modo Empleado</Text>
        </Pressable>

        <Pressable
          style={styles.userButton}
          onPress={() => handleSelectRole('USER')}
        >
          <MaterialCommunityIcons
            name="account"
            size={22}
            color={COLORS.white}
            style={{ marginRight: 10 }}
          />
          <Text style={styles.userButtonText}>Modo Usuario</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  logoText: {
    color: COLORS.white,
    fontSize: 22,
    fontFamily: 'Montserrat_800ExtraBold',
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  greeting: {
    color: COLORS.magenta,
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    color: COLORS.white,
    fontSize: 32,
    fontFamily: 'Montserrat_800ExtraBold',
    lineHeight: 40,
    letterSpacing: -1,
    marginBottom: 12,
  },
  subtitle: {
    color: COLORS.whiteSubtle,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  assignmentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.magenta,
  },
  assignmentGuild: {
    color: COLORS.white,
    fontSize: 15,
    fontFamily: 'Montserrat_700Bold',
  },
  assignmentEvent: {
    color: COLORS.whiteSubtle,
    fontSize: 13,
    marginTop: 3,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    gap: 14,
  },
  employeeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: 50,
    height: 56,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  employeeButtonText: {
    color: COLORS.accentText,
    fontSize: 17,
    fontFamily: 'Montserrat_800ExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    height: 56,
  },
  userButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontFamily: 'Montserrat_800ExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
