import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const maskApiKey = (key: string): string => {
  if (!key || key.length < 8) return '********';
  return key.slice(0, 4) + '****' + key.slice(-4);
};

export type ApiStatus = 'untested' | 'ok' | 'error' | 'testing';

export interface ApiConfig {
  key: string;
  status: ApiStatus;
  lastTestedAt?: string;
  errorMessage?: string;
}

export interface AppSettings {
  neis:      ApiConfig;
  gemini:    ApiConfig;
  kakao:     ApiConfig;
  weather:   ApiConfig;
  dataGovKr: ApiConfig;
  schoolYear:          string;
  outputFormat:        'pdf' | 'docx';
  sessionTimeoutMin:   number;
  autoSaveIntervalSec: number;
  appAOrigin:          string;
}

export type ApiProvider = 'neis' | 'gemini' | 'kakao' | 'weather' | 'dataGovKr';

interface SettingsState {
  settings: AppSettings;
  updateApiKey:       (provider: ApiProvider, key: string) => void;
  updateApiStatus:    (provider: ApiProvider, status: ApiStatus, errorMessage?: string) => void;
  updateAppConfig:    (config: Partial<Pick<AppSettings,
    'schoolYear' | 'outputFormat' | 'sessionTimeoutMin' | 'autoSaveIntervalSec' | 'appAOrigin'
  >>) => void;
  resetApiStatus:     (provider: ApiProvider) => void;
  isAllRequiredApiReady: () => boolean;
  getMaskedKey:       (provider: ApiProvider) => string;
  getRawKey:          (provider: ApiProvider) => string;
}

export const getEnvKey = (provider: ApiProvider): string => {
  switch (provider) {
    case 'neis':      return process.env.NEIS_API_KEY || '';
    case 'gemini':    return process.env.GEMINI_API_KEY || '';
    case 'kakao':     return process.env.KAKAO_MAP_API_KEY || '';
    case 'weather':   return process.env.DATA_GO_KR_API_KEY || '';
    case 'dataGovKr': return process.env.DATA_GO_KR_API_KEY || '';
    default:          return '';
  }
};

const defaultApiConfig = (provider: ApiProvider): ApiConfig => {
  const envKey = getEnvKey(provider);
  return {
    key: envKey,
    status: envKey ? 'ok' : 'untested'
  };
};

const defaultSettings: AppSettings = {
  neis:      defaultApiConfig('neis'),
  gemini:    defaultApiConfig('gemini'),
  kakao:     defaultApiConfig('kakao'),
  weather:   defaultApiConfig('weather'),
  dataGovKr: defaultApiConfig('dataGovKr'),
  schoolYear:          new Date().getFullYear().toString(),
  outputFormat:        'pdf',
  sessionTimeoutMin:   60,
  autoSaveIntervalSec: 30,
  appAOrigin:          '',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,

      updateApiKey: (provider, key) =>
         set((state) => ({
           settings: {
             ...state.settings,
             [provider]: { ...state.settings[provider], key, status: 'untested',
               lastTestedAt: undefined, errorMessage: undefined },
           },
         })),

      updateApiStatus: (provider, status, errorMessage) =>
        set((state) => ({
          settings: {
            ...state.settings,
            [provider]: { ...state.settings[provider], status,
              lastTestedAt: new Date().toISOString(), errorMessage },
          },
        })),

      updateAppConfig: (config) =>
        set((state) => ({ settings: { ...state.settings, ...config } })),

      resetApiStatus: (provider) =>
        set((state) => ({
          settings: {
            ...state.settings,
            [provider]: { ...state.settings[provider], status: 'untested',
              lastTestedAt: undefined, errorMessage: undefined },
          },
        })),

      isAllRequiredApiReady: () => {
        const neisKey = get().getRawKey('neis');
        const geminiKey = get().getRawKey('gemini');
        return !!neisKey && !!geminiKey;
      },

      getMaskedKey: (provider) => {
        const key = get().getRawKey(provider);
        return maskApiKey(key);
      },
      getRawKey:    (provider) => {
        return get().settings[provider].key || getEnvKey(provider);
      },
    }),
    {
      name:    'trip-doc-settings',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);
