import { jest } from '@jest/globals';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// config/api.ts falha ao carregar sem as URLs, de propósito (ver o arquivo).
process.env.EXPO_PUBLIC_API_URL = 'http://api.teste/api';
process.env.EXPO_PUBLIC_MONITORING_API_URL =
  'http://monitoring.teste/monitoring-better-meet';
process.env.EXPO_PUBLIC_MONITORING_API_KEY = 'chave-teste';
