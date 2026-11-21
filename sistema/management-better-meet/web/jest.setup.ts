import { jest } from '@jest/globals';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import 'react-native-gesture-handler/jestSetup';
import { setUpTests } from 'react-native-reanimated';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Reanimated 4 roda sobre react-native-worklets, que não tem módulo nativo no Jest.
jest.mock('react-native-worklets', () =>
  jest.requireActual('react-native-worklets/src/mock'),
);
setUpTests();

// config/api.ts falha ao carregar sem as URLs, de propósito (ver o arquivo).
process.env.EXPO_PUBLIC_API_URL = 'http://api.teste';
process.env.EXPO_PUBLIC_MONITORING_API_URL = 'http://monitoring.teste';
process.env.EXPO_PUBLIC_MANAGEMENT_API_URL = 'http://management.teste';
