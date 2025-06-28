import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const LANGUAGE_STORAGE_KEY = '@productivity_app_language';

// Translation map for static imports
const TRANSLATION_MAP: Record<string, Record<string, string>> = {
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
  const [currentLanguage, setCurrentLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [isLoading, setIsLoading] = useState(true);
  const [translations, setTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    loadLanguagePreference();
  }, []);

  useEffect(() => {
    loadTranslations(currentLanguage.code);
  }, [currentLanguage]);

  const loadLanguagePreference = async () => {
    try {
      const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
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
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
    } catch (error) {
      console.error('Failed to set language:', error);
      throw error;
    }
  };

  const t = (key: string, params?: Record<string, any>): string => {
    let translation = translations[key] || key;
    
    // Replace parameters in the translation string
    if (params) {
      Object.keys(params).forEach(paramKey => {
        const placeholder = `{{${paramKey}}}`;
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