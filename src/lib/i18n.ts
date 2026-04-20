import { supabase } from "@/integrations/supabase/client";

type TranslationKey = string;
type Translations = Record<TranslationKey, string>;

const defaultTranslations: Translations = {
  "nav.home": "Home",
  "nav.courses": "Courses",
  "nav.about": "About",
  "nav.contact": "Contact",
  "nav.portal": "Student Portal",
  "nav.dashboard": "Dashboard",
  "nav.logout": "Logout",
  "nav.login": "Login",
  "common.loading": "Loading...",
  "common.error": "Error",
  "common.success": "Success",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.delete": "Delete",
  "common.edit": "Edit",
  "common.search": "Search",
  "common.filter": "Filter",
  "common.export": "Export",
  "course.enroll": "Enroll Now",
  "course.duration": "Duration",
  "course.price": "Price",
  "course.description": "Description",
  "course.modules": "Modules",
  "course.lessons": "Lessons",
  "portal.welcome": "Welcome back!",
  "portal.progress": "Progress",
  "portal.certificates": "Certificates",
  "portal.courses": "My Courses",
  "portal.achievements": "Achievements",
};

class I18nService {
  private currentLanguage: string = "en";
  private translations: Map<string, Translations> = new Map();
  private loadedLanguages: Set<string> = new Set();

  constructor() {
    this.translations.set("en", defaultTranslations);
    this.loadedLanguages.add("en");
    
    if (typeof window !== "undefined") {
      const savedLanguage = localStorage.getItem("language");
      if (savedLanguage) {
        this.currentLanguage = savedLanguage;
      }
    }
  }

  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  async setLanguage(languageCode: string): Promise<void> {
    this.currentLanguage = languageCode;
    if (typeof window !== "undefined") {
      localStorage.setItem("language", languageCode);
    }
    if (!this.loadedLanguages.has(languageCode)) {
      await this.loadTranslations(languageCode);
    }
  }

  async loadTranslations(languageCode: string): Promise<void> {
    try {
      const { data, error } = await (supabase as any)
        .from("i18n_translations")
        .select("translation_key, translation_value")
        .eq("language_code", languageCode);

      if (error) throw error;

      if (data && data.length > 0) {
        const translations: Translations = {};
        data.forEach((item) => {
          translations[item.translation_key] = item.translation_value;
        });
        this.translations.set(languageCode, translations);
        this.loadedLanguages.add(languageCode);
      }
    } catch (error) {
      console.error(`Failed to load translations for ${languageCode}:`, error);
    }
  }

  t(key: TranslationKey, fallback?: string): string {
    const languageTranslations = this.translations.get(this.currentLanguage);
    if (languageTranslations && languageTranslations[key]) return languageTranslations[key];
    const englishTranslations = this.translations.get("en");
    if (englishTranslations && englishTranslations[key]) return englishTranslations[key];
    return fallback || key;
  }

  async getAvailableLanguages(): Promise<string[]> {
    try {
      const { data, error } = await (supabase as any).from("i18n_translations").select("language_code").limit(100);
      if (error) throw error;
      const languages = new Set<string>(["en"]);
      data?.forEach((item) => languages.add(item.language_code));
      return Array.from(languages);
    } catch (error) {
      console.error("Failed to get available languages:", error);
      return ["en"];
    }
  }

  async setTranslation(languageCode: string, key: TranslationKey, value: string): Promise<void> {
    try {
      const { error } = await (supabase as any).from("i18n_translations").upsert({
        language_code: languageCode,
        translation_key: key,
        translation_value: value,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      const languageTranslations = this.translations.get(languageCode) || {};
      languageTranslations[key] = value;
      this.translations.set(languageCode, languageTranslations);
    } catch (error) {
      console.error("Failed to set translation:", error);
      throw error;
    }
  }
}

export const i18n = new I18nService();

export function useTranslation() {
  return {
    t: (key: TranslationKey, fallback?: string) => i18n.t(key, fallback),
    setLanguage: (lang: string) => i18n.setLanguage(lang),
    currentLanguage: i18n.getCurrentLanguage(),
  };
}