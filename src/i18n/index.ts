import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { workspaceApi } from "@/services/workspaceApi";
import en from "./locales/en.json";
import zh from "./locales/zh.json";

const browserLang = navigator.language.startsWith("zh") ? "zh" : "en";

i18n.use(initReactI18next).init({
    resources: {
        en: { translation: en },
        zh: { translation: zh },
    },
    lng: browserLang,
    fallbackLng: "en",
    interpolation: {
        escapeValue: false,
    },
});

export default i18n;

export function setLanguage(lang: string) {
    void (async () => {
        try {
            const settings = await workspaceApi.getAppSettings();
            await workspaceApi.updateAppSettings({ ...settings, language: lang });
        } catch (error) {
            console.error("Failed to persist language:", error);
        }
    })();
    void i18n.changeLanguage(lang);
}

export function hydrateLanguage(lang: string | null | undefined) {
    if (lang) {
        void i18n.changeLanguage(lang);
    }
}

export function getCurrentLanguage(): string {
    return i18n.language;
}
