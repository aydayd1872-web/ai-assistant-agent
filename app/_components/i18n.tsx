"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Language = "en" | "ar";

const STORAGE_KEY = "aegis:lang";

type Dictionary = {
  readonly tagline: string;
  readonly secureSession: string;
  readonly newChat: string;
  readonly settings: string;
  readonly settingsDescription: string;
  readonly language: string;
  readonly languageEnglish: string;
  readonly languageArabic: string;
  readonly model: string;
  readonly modelDescription: string;
  readonly sendPlaceholder: string;
  readonly attachImage: string;
  readonly stop: string;
  readonly requestFailed: string;
  readonly modelUnavailable: string;
  readonly thinking: string;
  readonly close: string;
  readonly aboutTitle: string;
  readonly aboutBody: string;
  readonly suggestions: ReadonlyArray<{ readonly label: string; readonly prompt: string }>;
};

const EN: Dictionary = {
  tagline: "Your premium cybersecurity copilot",
  secureSession: "Secure session",
  newChat: "New chat",
  settings: "Settings",
  settingsDescription: "Personalize language, model, and session preferences.",
  language: "Language",
  languageEnglish: "English",
  languageArabic: "العربية",
  model: "AI model",
  modelDescription: "Choose the reasoning engine that powers Aegis.",
  sendPlaceholder: "Send a message…",
  attachImage: "Attach image",
  stop: "Stop",
  requestFailed: "Request failed",
  modelUnavailable: "The model is temporarily unavailable. Please try again.",
  thinking: "Thinking",
  close: "Close",
  aboutTitle: "About Aegis",
  aboutBody:
    "Aegis is a defensive-security copilot for secure coding, threat modeling, hardening, and incident response.",
  suggestions: [
    {
      label: "OWASP Top 10",
      prompt: "Walk me through the OWASP Top 10 with a real-world example and fix for each.",
    },
    {
      label: "Review code for vulnerabilities",
      prompt:
        "Review this code for security vulnerabilities and suggest hardened fixes:\n\n```\n// paste your code here\n```",
    },
    {
      label: "Harden authentication",
      prompt: "How do I implement secure sessions, password hashing, and MFA best practices?",
    },
    {
      label: "Incident response plan",
      prompt: "Create a step-by-step incident response checklist for a suspected data breach.",
    },
  ],
};

const AR: Dictionary = {
  tagline: "مساعدك المتقدم في الأمن السيبراني",
  secureSession: "جلسة آمنة",
  newChat: "محادثة جديدة",
  settings: "الإعدادات",
  settingsDescription: "خصّص اللغة والنموذج وتفضيلات الجلسة.",
  language: "اللغة",
  languageEnglish: "English",
  languageArabic: "العربية",
  model: "نموذج الذكاء الاصطناعي",
  modelDescription: "اختر محرّك الاستدلال الذي يشغّل Aegis.",
  sendPlaceholder: "اكتب رسالة…",
  attachImage: "إرفاق صورة",
  stop: "إيقاف",
  requestFailed: "فشل الطلب",
  modelUnavailable: "النموذج غير متاح مؤقتًا. حاول مرة أخرى.",
  thinking: "جارٍ التفكير",
  close: "إغلاق",
  aboutTitle: "عن Aegis",
  aboutBody:
    "Aegis مساعد للأمن الدفاعي للبرمجة الآمنة ونمذجة التهديدات والتحصين والاستجابة للحوادث.",
  suggestions: [
    {
      label: "أهم 10 ثغرات OWASP",
      prompt: "اشرح لي قائمة OWASP Top 10 مع مثال واقعي وحل لكل ثغرة.",
    },
    {
      label: "مراجعة الكود بحثًا عن ثغرات",
      prompt:
        "راجع هذا الكود بحثًا عن الثغرات الأمنية واقترح إصلاحات محصّنة:\n\n```\n// الصق الكود هنا\n```",
    },
    {
      label: "تحصين المصادقة",
      prompt: "كيف أطبّق جلسات آمنة وتجزئة كلمات المرور وأفضل ممارسات المصادقة متعددة العوامل؟",
    },
    {
      label: "خطة الاستجابة للحوادث",
      prompt: "أنشئ قائمة تحقق خطوة بخطوة للاستجابة لاختراق بيانات مشتبه به.",
    },
  ],
};

const DICTIONARIES: Record<Language, Dictionary> = { en: EN, ar: AR };

type LanguageContextValue = {
  readonly lang: Language;
  readonly dir: "ltr" | "rtl";
  readonly t: Dictionary;
  readonly setLang: (lang: Language) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { readonly children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "ar") {
      setLangState(stored);
    }
  }, []);

  useEffect(() => {
    const dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang]);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      dir: lang === "ar" ? "rtl" : "ltr",
      lang,
      setLang,
      t: DICTIONARIES[lang],
    }),
    [lang, setLang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
