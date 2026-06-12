import { Platform } from 'react-native';

const PRODUCTION_API_URL = 'https://kitchenfillbackend.vercel.app/api';
const LOCAL_API_URL = 'http://192.168.1.11:3000/api';

// Set to true to use the production Vercel backend, or false to use the local dev backend
const FORCE_PRODUCTION_API = false; 

export const API_BASE_URL = 
  process.env.EXPO_PUBLIC_API_URL || 
  (FORCE_PRODUCTION_API || !__DEV__ ? PRODUCTION_API_URL : LOCAL_API_URL);

export default API_BASE_URL;

// Centralized color palette configurations (in sync with global.css variables)
export const COLORS = {
  primary: '#FF6B00',
  accent: '#FF8A3D',
  danger: '#EF4444',
  success: '#10B981',
  dark: {
    background: '#09090A',
    card: '#161618',
    text: '#F4F4F5',
    muted: '#A1A1AA',
    border: '#27272A',
    blobPurple: '#C084FC',
    blobYellow: '#FACC15',
  },
  light: {
    background: '#FFFFFF',
    card: '#F4F4F5',
    text: '#18181B',
    muted: '#71717A',
    border: '#E4E4E7',
    blobPurple: '#D946EF',
    blobYellow: '#EAB308',
  },
};

/**
 * Development Theme Override Constant.
 * Set this to 'dark' or 'light' to force the theme during development/testing.
 * Set to null to follow the user preference / system settings.
 */
export const DEV_THEME_OVERRIDE: 'dark' | 'light' | null = 'dark';


