import React, { useState } from "react";
import { Languages, Loader2, Volume2, Copy, Check } from "lucide-react";
import { useApp } from "../context/AppContext";
import { translateText } from "../services/ai";
import { cn } from "../lib/utils";

interface LanguageOption {
  code: string;
  label: string;
  bcp47: string;
}

const TARGET_LANGS: LanguageOption[] = [
  { code: "French", label: "French", bcp47: "fr-FR" },
  { code: "Spanish", label: "Spanish", bcp47: "es-ES" },
  { code: "Japanese", label: "Japanese", bcp47: "ja-JP" },
  { code: "Italian", label: "Italian", bcp47: "it-IT" },
];

interface PhraseItem {
  category: string;
  english: string;
  translations: Record<string, { text: string; phonetic: string }>;
}

const QUICK_PHRASES: PhraseItem[] = [
  {
    category: "Police",
    english: "Please help me, I need the police.",
    translations: {
      French: {
        text: "Aidez-moi s'il vous plaît, j'ai besoin de la police.",
        phonetic: "Eh-day mwah seel voo pleh, zhay buh-zwan duh lah poh-lees.",
      },
      Spanish: {
        text: "Por favor ayúdeme, necesito a la policía.",
        phonetic: "Por fah-vor ah-yoo-deh-meh, neh-seh-see-toh ah lah poh-lee-see-ah.",
      },
      Japanese: {
        text: "助けてください、警察が必要です。",
        phonetic: "Tasukete kudasai, keisatsu ga hitsuyō desu.",
      },
      Italian: {
        text: "Per favore aiutatemi, ho bisogno della polizia.",
        phonetic: "Pehr fah-voh-reh ah-yoo-tah-teh-mee, oh bee-zoh-nyoh del-lah poh-lee-tsee-ah.",
      },
    },
  },
  {
    category: "Medical",
    english: "I need an English-speaking doctor.",
    translations: {
      French: {
        text: "J'ai besoin d'un médecin qui parle anglais.",
        phonetic: "Zhay buh-zwan duhn may-dsan kee parl ahn-gleh.",
      },
      Spanish: {
        text: "Necesito un médico que hable inglés.",
        phonetic: "Neh-seh-see-toh oon meh-dee-koh keh ah-bleh een-glehs.",
      },
      Japanese: {
        text: "英語を話せる医師が必要です。",
        phonetic: "Eigo o hanaseru ishi ga hitsuyō desu.",
      },
      Italian: {
        text: "Ho bisogno di un medico che parli inglese.",
        phonetic: "Oh bee-zoh-nyoh dee oon meh-dee-koh keh par-lee een-gleh-zeh.",
      },
    },
  },
  {
    category: "Embassy",
    english: "My passport was stolen. Where is the embassy?",
    translations: {
      French: {
        text: "Mon passeport a été volé. Où est l'ambassade ?",
        phonetic: "Mohn pahs-por ah eh-tay voh-lay. Oo eh lahm-bah-sahd?",
      },
      Spanish: {
        text: "Me robaron el pasaporte. ¿Dónde está la embajada?",
        phonetic: "Meh roh-bah-rohn ehl pah-sah-por-teh. Dohn-deh ehs-tah lah ehm-bah-hah-dah?",
      },
      Japanese: {
        text: "パスポートが盗まれました。大使館はどこですか？",
        phonetic: "Pasupōto ga nusumaremashita. Taishikan wa doko desu ka?",
      },
      Italian: {
        text: "Mi hanno rubato il passaporto. Dov'è l'ambasciata?",
        phonetic: "Mee ahn-noh roo-bah-toh eel pahs-sah-por-toh. Doh-veh lahm-bah-shah-tah?",
      },
    },
  },
];

export function TranslatorScreen() {
  const { offlineMode } = useApp();
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [pronunciation, setPronunciation] = useState("");
  const [targetLang, setTargetLang] = useState(TARGET_LANGS[0].code);
  const [isTranslating, setIsTranslating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const currentLangObj = TARGET_LANGS.find((l) => l.code === targetLang) || TARGET_LANGS[0];

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = currentLangObj.bcp47;
      utterance.rate = 0.92;
      window.speechSynthesis.speak(utterance);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) return;

    if (offlineMode) {
      const fallback = QUICK_PHRASES[0].translations[targetLang];
      setTranslatedText(
        fallback ? `[Offline Cache] ${fallback.text}` : "[Offline] Use quick phrases below."
      );
      setPronunciation(fallback?.phonetic || "");
      return;
    }

    setIsTranslating(true);
    setTranslatedText("");
    setPronunciation("");
    try {
      const result = await translateText(inputText, targetLang);
      setTranslatedText(result.translated);
      setPronunciation(result.pronunciation);
    } catch {
      setTranslatedText("Translation unavailable. Use offline emergency cards below.");
      setPronunciation("");
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 px-5 pt-4 pb-5 gap-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Crisis Translator</h2>
        <p className="text-[11px] text-slate-500">
          {offlineMode ? "Offline Phrasebook Mode" : "AI Translation & Spoken Phonetics"}
        </p>
      </div>

      {/* Language Selector */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5 shrink-0">
        {TARGET_LANGS.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setTargetLang(lang.code)}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer",
              targetLang === lang.code
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            )}
          >
            {lang.label}
          </button>
        ))}
      </div>

      {/* Custom Input Box */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs space-y-2.5">
        <textarea
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium focus:bg-white focus:outline-none focus:border-indigo-500 h-20 resize-none placeholder:text-slate-400 text-slate-800"
          placeholder={`Type what you need to say in ${targetLang}...`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />

        <button
          onClick={handleTranslate}
          disabled={!inputText.trim() || isTranslating}
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs tracking-wide disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-2"
        >
          {isTranslating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Translating...</span>
            </>
          ) : (
            <span>Translate to {targetLang}</span>
          )}
        </button>

        {translatedText && (
          <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-[10px] font-bold text-indigo-600 uppercase">
                  {targetLang}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => speakText(translatedText)}
                  className="p-1.5 rounded-lg bg-white text-indigo-600 border border-indigo-100 cursor-pointer"
                  title="Speak aloud"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => copyToClipboard(translatedText, "custom")}
                  className="p-1.5 rounded-lg bg-white text-indigo-600 border border-indigo-100 cursor-pointer"
                  title="Copy text"
                >
                  {copiedId === "custom" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
            <p className="text-sm font-bold text-slate-900 leading-snug select-all">
              {translatedText}
            </p>
            {pronunciation && (
              <p className="text-[11px] text-indigo-700 italic select-all">
                &ldquo;{pronunciation}&rdquo;
              </p>
            )}
          </div>
        )}
      </div>

      {/* Offline Emergency Phrasebook */}
      <div className="flex-1 flex flex-col min-h-0">
        <span className="text-[11px] font-bold text-slate-500 mb-2 block">
          Instant Emergency Phrases ({targetLang})
        </span>
        <div className="space-y-2 overflow-y-auto pr-0.5">
          {QUICK_PHRASES.map((item, idx) => {
            const loc = item.translations[targetLang] || item.translations.French;
            const id = `phrase-${idx}`;
            return (
              <div
                key={idx}
                className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-start justify-between gap-2.5"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="text-[10px] font-semibold text-indigo-600">
                    {item.category} · <span className="text-slate-500 font-normal">{item.english}</span>
                  </p>
                  <p className="text-xs font-bold text-slate-900 leading-snug">{loc.text}</p>
                  <p className="text-[10px] text-slate-500 italic">&ldquo;{loc.phonetic}&rdquo;</p>
                </div>

                <button
                  onClick={() => speakText(loc.text)}
                  className="w-8 h-8 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 cursor-pointer"
                  title="Speak aloud"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
