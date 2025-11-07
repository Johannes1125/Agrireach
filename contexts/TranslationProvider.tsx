"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

interface TranslationContextType {
  language: string;
  setLanguage: (lang: string) => void;
  translate: (text: string) => Promise<string>;
  isTranslating: boolean;
  translateNow: () => Promise<void>;
}

const TranslationContext = createContext<TranslationContextType | undefined>(
  undefined
);

// Cache to store translations
const translationCache = new Map<string, string>();

// Batch translation queue
let batchQueue: Array<{
  text: string;
  resolve: (value: string) => void;
}> = [];
let batchTimeout: NodeJS.Timeout | null = null;

export function TranslationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguageState] = useState<string>("en");
  const [isTranslating, setIsTranslating] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState<boolean>(false);

  // Load language from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Prefer 'preferred-language' for cross-context compatibility
    const storedPreferred = localStorage.getItem("preferred-language");
    const storedLegacy = localStorage.getItem("language");
    const initial = storedPreferred ?? storedLegacy ?? "en";
    // Resolve 'auto' selection to a concrete language based on browser
    const resolveAuto = (val: string) => {
      if (val !== "auto") return val;
      const browserLang = navigator.language?.toLowerCase() || "en";
      if (browserLang.startsWith("zh")) return "zh";
      if (browserLang.startsWith("hi")) return "hi";
      if (browserLang.startsWith("es")) return "es";
      if (browserLang.startsWith("fr")) return "fr";
      return "en";
    };
    setLanguageState(resolveAuto(initial));

    // read auto-translate preference
    const auto = localStorage.getItem("auto-translate");
    setAutoTranslate(auto === "true");

    // Keep in sync with other tabs/providers via storage events
    const onStorage = (e: StorageEvent) => {
      if (e.key === "preferred-language") {
        const newVal = e.newValue || "en";
        setLanguageState(resolveAuto(newVal));
      }
      if (e.key === "auto-translate") {
        setAutoTranslate(e.newValue === "true");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      // Write to both keys for backward compatibility
      localStorage.setItem("preferred-language", lang);
      localStorage.setItem("language", lang);
    }
  };

  const processBatch = useCallback(async () => {
    if (batchQueue.length === 0) return;

    const currentBatch = [...batchQueue];
    batchQueue = [];

    // Get unique texts that aren't cached
    const uniqueTexts = Array.from(
      new Set(currentBatch.map((item) => item.text))
    );
    const textsToTranslate = uniqueTexts.filter(
      (text) => !translationCache.has(`${language}:${text}`)
    );

    if (textsToTranslate.length === 0) {
      // All cached, resolve immediately
      currentBatch.forEach(({ text, resolve }) => {
        const cached = translationCache.get(`${language}:${text}`);
        resolve(cached || text);
      });
      return;
    }

    try {
      // Send all texts in ONE API call
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          texts: textsToTranslate, // Array of texts
          targetLanguage: language,
        }),
      });

      if (!response.ok) {
        throw new Error("Translation failed");
      }

      const data = await response.json();
      const translations = data.translations || []; // Array of translations

      textsToTranslate.forEach((text, index) => {
        const translatedText = translations[index] || text;
        translationCache.set(`${language}:${text}`, translatedText);
      });

      currentBatch.forEach(({ text, resolve }) => {
        const cached = translationCache.get(`${language}:${text}`);
        resolve(cached || text);
      });
    } catch (error) {
      currentBatch.forEach(({ text, resolve }) => resolve(text));
    }
  }, [language]);

  const translate = async (text: string): Promise<string> => {
    if (language === "en" || !text || text.trim() === "") {
      return text;
    }

    const cacheKey = `${language}:${text}`;
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey)!;
    }

    // Add to batch queue
    return new Promise<string>((resolve) => {
      batchQueue.push({ text, resolve });

      // Clear existing timeout
      if (batchTimeout) {
        clearTimeout(batchTimeout);
      }

      // Process batch after 100ms of no new requests
      batchTimeout = setTimeout(() => {
        processBatch();
      }, 1000);
    });
  };

  // Auto-translate all text nodes on language change
  const translatePage = useCallback(async () => {
    if (language === "en") {
      // Restore original text but KEEP the data-translated attribute
      document.querySelectorAll("[data-translated]").forEach((element) => {
        const originalText = element.getAttribute("data-original-text");
        if (originalText && element.textContent !== originalText) {
          // Only update if text is actually different
          const textNode = Array.from(element.childNodes).find(
            (node) => node.nodeType === Node.TEXT_NODE
          );
          if (textNode && textNode.parentElement) {
            textNode.textContent = originalText;
          }
        }
        // Mark as English to prevent re-translation
        element.setAttribute("data-translated", "en");
      });
      return;
    }

    setIsTranslating(true);

    try {
      // Find all text nodes that haven't been translated yet
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            // Skip script, style, and empty nodes
            if (
              node.parentElement?.tagName === "SCRIPT" ||
              node.parentElement?.tagName === "STYLE" ||
              !node.textContent?.trim()
            ) {
              return NodeFilter.FILTER_REJECT;
            }
            // Skip already translated nodes for current language
            const translatedLang =
              node.parentElement?.getAttribute("data-translated");
            if (translatedLang === language) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          },
        }
      );

      const textNodes: Node[] = [];
      let node: Node | null;
      while ((node = walker.nextNode())) {
        textNodes.push(node);
      }

      // Collect ALL text to translate (cache-first approach)
      const textsToTranslate: string[] = [];
      const nodeMap: Map<string, Node[]> = new Map();
      const cachedNodeMap: Map<string, Node[]> = new Map();

      textNodes.forEach((textNode) => {
        const originalText = textNode.textContent?.trim();
        if (!originalText || originalText.length === 0) return;

        const parentElement = textNode.parentElement;
        if (!parentElement) return;

        // Store original text
        if (!parentElement.hasAttribute("data-original-text")) {
          parentElement.setAttribute("data-original-text", originalText);
        }

        // Check if translation is already cached
        const cacheKey = `${language}:${originalText}`;
        if (translationCache.has(cacheKey)) {
          // Apply cached translation immediately
          if (!cachedNodeMap.has(originalText)) {
            cachedNodeMap.set(originalText, []);
          }
          cachedNodeMap.get(originalText)!.push(textNode);
        } else {
          // Group nodes that need translation
          if (!nodeMap.has(originalText)) {
            nodeMap.set(originalText, []);
            textsToTranslate.push(originalText);
          }
          nodeMap.get(originalText)!.push(textNode);
        }
      });

      // Apply cached translations immediately
      cachedNodeMap.forEach((nodes, originalText) => {
        const cachedTranslation = translationCache.get(
          `${language}:${originalText}`
        )!;
        nodes.forEach((textNode) => {
          if (
            textNode.textContent &&
            cachedTranslation !== originalText &&
            textNode.parentElement
          ) {
            textNode.textContent = cachedTranslation;
          }
          // Mark with language code
          textNode.parentElement?.setAttribute("data-translated", language);
        });
      });

      if (textsToTranslate.length === 0) {
        setIsTranslating(false);
        return;
      }

      // Translate ONLY uncached texts in ONE API call
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          texts: textsToTranslate,
          targetLanguage: language,
        }),
      });

      if (!response.ok) {
        throw new Error("Translation failed");
      }

      const data = await response.json();
      const translations = data.translations || [];

      // Apply new translations and mark as translated
      textsToTranslate.forEach((originalText, index) => {
        const translatedText = translations[index] || originalText;
        const nodes = nodeMap.get(originalText) || [];

        nodes.forEach((textNode) => {
          if (
            textNode.textContent &&
            translatedText !== originalText &&
            textNode.parentElement
          ) {
            textNode.textContent = translatedText;
          }
          // Mark with language code
          textNode.parentElement?.setAttribute("data-translated", language);
        });

        // Cache the translation
        translationCache.set(`${language}:${originalText}`, translatedText);
      });
    } catch (error) {
    } finally {
      setIsTranslating(false);
    }
  }, [language]);

  // Public trigger to translate on demand
  const translateNow = async () => {
    if (typeof window === "undefined") return;
    await translatePage();
  };

  useEffect(() => {
    if (!autoTranslate) return;
    const timer = setTimeout(() => {
      if ("requestIdleCallback" in window) {
        requestIdleCallback(() => translatePage(), { timeout: 2000 });
      } else {
        translatePage();
      }
    }, 500); // Longer delay to ensure everything is rendered

    return () => clearTimeout(timer);
  }, [language, translatePage, autoTranslate]);

  // Set up MutationObserver to translate dynamically added content
  useEffect(() => {
    // Don't set up observer if English or auto-translate disabled
    if (language === "en" || !autoTranslate) {
      return;
    }

    let mutationTimeout: NodeJS.Timeout | null = null;
    let pendingNodes: Node[] = [];

    const batchTranslateNodes = async () => {
      if (pendingNodes.length === 0) return;

      const nodesToTranslate = [...pendingNodes];
      pendingNodes = [];

      // Collect all text nodes from pending nodes
      const textNodes: Node[] = [];

      nodesToTranslate.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
          const parentElement = node.parentElement;
          if (parentElement && !parentElement.hasAttribute("data-translated")) {
            textNodes.push(node);
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          // Collect text nodes from element
          const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, {
            acceptNode: (textNode) => {
              if (
                textNode.parentElement?.tagName === "SCRIPT" ||
                textNode.parentElement?.tagName === "STYLE" ||
                !textNode.textContent?.trim()
              ) {
                return NodeFilter.FILTER_REJECT;
              }
              // Skip if already translated for current language
              const translatedLang =
                textNode.parentElement?.getAttribute("data-translated");
              if (translatedLang === language) {
                return NodeFilter.FILTER_REJECT;
              }
              return NodeFilter.FILTER_ACCEPT;
            },
          });

          let textNode: Node | null;
          while ((textNode = walker.nextNode())) {
            textNodes.push(textNode);
          }
        }
      });

      if (textNodes.length === 0) return;

      // Collect ALL text to translate (cache-first approach)
      const textsToTranslate: string[] = [];
      const nodeMap: Map<string, Node[]> = new Map();
      const cachedNodeMap: Map<string, Node[]> = new Map();

      textNodes.forEach((textNode) => {
        const originalText = textNode.textContent?.trim();
        if (!originalText) return;

        const parentElement = textNode.parentElement;
        if (!parentElement) return;

        // Store original text
        if (!parentElement.hasAttribute("data-original-text")) {
          parentElement.setAttribute("data-original-text", originalText);
        }

        // Check if translation is already cached
        const cacheKey = `${language}:${originalText}`;
        if (translationCache.has(cacheKey)) {
          // Apply cached translation immediately
          if (!cachedNodeMap.has(originalText)) {
            cachedNodeMap.set(originalText, []);
          }
          cachedNodeMap.get(originalText)!.push(textNode);
        } else {
          // Group nodes that need translation
          if (!nodeMap.has(originalText)) {
            nodeMap.set(originalText, []);
            textsToTranslate.push(originalText);
          }
          nodeMap.get(originalText)!.push(textNode);
        }
      });

      // Apply cached translations immediately
      cachedNodeMap.forEach((nodes, originalText) => {
        const cachedTranslation = translationCache.get(
          `${language}:${originalText}`
        )!;
        nodes.forEach((textNode) => {
          if (
            textNode.textContent &&
            cachedTranslation !== originalText &&
            textNode.parentElement
          ) {
            textNode.textContent = cachedTranslation;
          }
          // Mark with language code
          textNode.parentElement?.setAttribute("data-translated", language);
        });
      });

      if (textsToTranslate.length === 0) return;

      try {
        // Translate ONLY uncached texts in ONE API call
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            texts: textsToTranslate,
            targetLanguage: language,
          }),
        });

        if (!response.ok) {
          throw new Error("Translation failed");
        }

        const data = await response.json();
        const translations = data.translations || [];

        // Apply new translations and mark as translated
        textsToTranslate.forEach((originalText, index) => {
          const translatedText = translations[index] || originalText;
          const nodes = nodeMap.get(originalText) || [];

          nodes.forEach((textNode) => {
            if (
              textNode.textContent &&
              translatedText !== originalText &&
              textNode.parentElement
            ) {
              textNode.textContent = translatedText;
            }
            textNode.parentElement?.setAttribute("data-translated", language);
          });

          translationCache.set(`${language}:${originalText}`, translatedText);
        });
      } catch (error) {}
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          pendingNodes.push(node);
        });
      });

      if (mutationTimeout) {
        clearTimeout(mutationTimeout);
      }

      mutationTimeout = setTimeout(() => {
        batchTranslateNodes();
      }, 200);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      if (mutationTimeout) {
        clearTimeout(mutationTimeout);
      }
    };
  }, [language, autoTranslate]);

  return (
    <TranslationContext.Provider
      value={{ language, setLanguage, translate, isTranslating, translateNow }}
    >
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
}
