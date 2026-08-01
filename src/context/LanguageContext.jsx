import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import fr from "../locales/fr";
import en from "../locales/en";
import englishPhrases from "../locales/phrases.en";

const STORAGE_KEY = "kinkolab-language";
const catalogs = { fr, en };
const LanguageContext = createContext(null);
const domOriginals = new WeakMap();

function getInitialLanguage() {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "fr" || saved === "en") return saved;
  return window.navigator.languages?.some((item) => item.toLowerCase().startsWith("fr")) ? "fr" : "en";
}

function readPath(source, path) {
  return path.split(".").reduce((value, key) => value?.[key], source);
}

function translateExact(value) {
  const leading = value.match(/^\s*/)?.[0] || "";
  const trailing = value.match(/\s*$/)?.[0] || "";
  const normalized = value.trim().replace(/\s+/g, " ");
  return englishPhrases[normalized] ? `${leading}${englishPhrases[normalized]}${trailing}` : value;
}

function localizeDom(language) {
  const root = document.getElementById("root");
  if (!root) return () => {};
  const translateNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE && node.parentElement && !node.parentElement.closest("[data-i18n-preserve], [data-i18n-managed]")) {
      if (!domOriginals.has(node)) domOriginals.set(node, node.nodeValue);
      const nextValue = language === "en" ? translateExact(domOriginals.get(node)) : domOriginals.get(node);
      if (node.nodeValue !== nextValue) node.nodeValue = nextValue;
    }
    if (node.nodeType === Node.ELEMENT_NODE && !node.closest?.("[data-i18n-managed]")) {
      ["placeholder", "aria-label", "title"].forEach((attribute) => {
        if (!node.hasAttribute(attribute)) return;
        const originalAttribute = `data-i18n-original-${attribute}`;
        if (!node.hasAttribute(originalAttribute)) node.setAttribute(originalAttribute, node.getAttribute(attribute));
        const original = node.getAttribute(originalAttribute);
        node.setAttribute(attribute, language === "en" ? translateExact(original) : original);
      });
    }
  };

  const walk = (target) => {
    translateNode(target);
    const walker = document.createTreeWalker(target, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) translateNode(walker.currentNode);
  };
  walk(root);
  const observer = new MutationObserver((records) => records.forEach((record) => {
    if (record.type === "characterData") walk(record.target);
    record.addedNodes.forEach(walk);
  }));
  observer.observe(root, { childList: true, characterData: true, subtree: true });
  return () => observer.disconnect();
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage);
  const setLanguage = useCallback((next) => setLanguageState(next === "en" ? "en" : "fr"), []);
  const t = useCallback((path) => readPath(catalogs[language], path) ?? readPath(fr, path) ?? path, [language]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
    document.title = language === "en" ? "KinkoLab Athlete Program" : "KinkoLab — Programme Athlètes";
    return localizeDom(language);
  }, [language]);

  useEffect(() => {
    const nativeAlert = window.alert.bind(window);
    window.alert = (message) => nativeAlert(language === "en" && typeof message === "string" ? translateExact(message) : message);
    return () => { window.alert = nativeAlert; };
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}
