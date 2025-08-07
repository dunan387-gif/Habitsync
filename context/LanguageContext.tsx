import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';

// Import all translation files statically
import enTranslations from '../translations/en.json';
import esTranslations from '../translations/es.json';
import frTranslations from '../translations/fr.json';
import zhTranslations from '../translations/zh.json';

type Language = {
  code: string;
  name: string;
  nativeName: string;
};

type LanguageContextType = {
  currentLanguage: Language;
  setLanguage: (languageCode: string) => Promise<void>;
  availableLanguages: Language[];
  t: (key: string, params?: Record<string, any>) => string;
  isLoading: boolean;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);



// Translation map for static imports
const TRANSLATION_MAP: Record<string, any> = {
  en: enTranslations,
  es: esTranslations,
  fr: frTranslations,
  zh: zhTranslations,
};

const AVAILABLE_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
];

const DEFAULT_LANGUAGE = AVAILABLE_LANGUAGES[0]; // English

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentLanguage, setCurrentLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [isLoading, setIsLoading] = useState(true);
  const [translations, setTranslations] = useState<any>({});

  // Get user-specific storage key
  const getStorageKey = () => {
    const userId = user?.id || 'anonymous';
    return `@productivity_app_language_${userId}`;
  };

  useEffect(() => {
    // Only load data if auth is not loading
    if (!user || user.id) {
      loadLanguagePreference();
    }
  }, [user?.id]);

  useEffect(() => {
    loadTranslations(currentLanguage.code);
  }, [currentLanguage]);

  const loadLanguagePreference = async () => {
    try {
      const storageKey = getStorageKey();
      const storedLanguage = await AsyncStorage.getItem(storageKey);
      if (storedLanguage) {
        const language = AVAILABLE_LANGUAGES.find(l => l.code === storedLanguage);
        if (language) {
          setCurrentLanguage(language);
        }
      }
    } catch (error) {
      console.error('Failed to load language preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTranslations = (languageCode: string) => {
    try {
      // Use static imports instead of dynamic imports
      const translationData = TRANSLATION_MAP[languageCode];
      if (translationData) {
        setTranslations(translationData);
      } else {
        // Fallback to English if translation doesn't exist
        console.warn(`Translations for ${languageCode} not found, falling back to English`);
        setTranslations(TRANSLATION_MAP.en);
      }
    } catch (error) {
      console.error(`Failed to load translations for ${languageCode}:`, error);
      // Fallback to English
      setTranslations(TRANSLATION_MAP.en);
    }
  };

  const setLanguage = async (languageCode: string) => {
    try {
      const language = AVAILABLE_LANGUAGES.find(l => l.code === languageCode);
      if (!language) {
        throw new Error(`Language with code ${languageCode} not found`);
      }

      setCurrentLanguage(language);
      const storageKey = getStorageKey();
      await AsyncStorage.setItem(storageKey, languageCode);
    } catch (error) {
      console.error('Failed to set language:', error);
      throw error;
    }
  };

  const t = (key: string, params?: Record<string, any>): string => {
    // Handle nested keys like 'stats.title'
    const keys = key.split('.');
    let translation: any = translations;
    
    for (const k of keys) {
      if (translation && typeof translation === 'object' && k in translation) {
        translation = translation[k];
      } else {
        // If key not found, return the original key
        translation = key;
        break;
      }
    }
    
    // Ensure we have a string
    if (typeof translation !== 'string') {
      translation = key;
    }
    
    // Replace parameters in the translation string
    if (params && typeof translation === 'string') {
      Object.keys(params).forEach(paramKey => {
        const placeholder = `{${paramKey}}`;
        translation = translation.replace(new RegExp(placeholder, 'g'), String(params[paramKey]));
      });
    }
    
    return translation;
  };

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    availableLanguages: AVAILABLE_LANGUAGES,
    t,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}