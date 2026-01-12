/**
 * CRM PLUS Mobile App
 * Aplicação mobile para gestão de leads, propriedades e visitas
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { AgentProvider } from './src/contexts/AgentContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { TerminologyProvider } from './src/contexts/TerminologyContext';
import Navigation from './src/navigation';

export default function App() {
  return (
    <ThemeProvider>
      <TerminologyProvider>
        <AuthProvider>
          <AgentProvider>
            <Navigation />
            <StatusBar style="light" />
          </AgentProvider>
        </AuthProvider>
      </TerminologyProvider>
    </ThemeProvider>
  );
}
