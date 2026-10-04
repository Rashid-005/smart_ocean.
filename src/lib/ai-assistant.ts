// Natural conversational Smart Ocean assistant.
//
// Flow: User Message → Intent Understanding → Conversation Type →
// Retrieve Relevant Smart Ocean Data (via context) → Generate Answer →
// Apply Safety/Grounding Rules → Return Answer.
//
// Grounding rules (never violated):
// - Safety status comes ONLY from context.safetyStatus (app safety rules).
// - Fishing potential / species / times come ONLY from context predictions.
// - Distance/ETA are computed ONLY from real coordinates in context.
// - Missing data → say it is unavailable, never invent.

export type AssistantZone = {
  id: string;
  name: string;
  island: string;
  latitude: number;
  longitude: number;
  potential: number;
  confidence: string;
  species: string[];
  recommendedTime: string;
  safety: string;
  distanceKm: number | null;
};

export type AssistantReport = {
  date: string;
  zoneName: string;
  species: string;
  quantityKg: number | null;
};

export type AssistantContext = {
  language: "en" | "sw";
  hasLocation: boolean;
  outsideArea: boolean;
  zones: AssistantZone[];
  safetyStatus: "SAFE" | "MODERATE" | "DANGEROUS";
  weather: {
    windSpeedKmh: number;
    waveHeightM: number;
    visibilityKm: number;
    temperatureC: number;
    description: string;
  };
  reportCount: number;
  recentReports: AssistantReport[];
  boatSpeedKmh: number;
  fuelConsumptionLpk: number;
};

export type HistoryMessage = { sender: "user" | "assistant"; content: string };

type Lang = "en" | "sw";

type Intent =
  | "greeting"
  | "farewell"
  | "thanks"
  | "identity"
  | "capabilities"
  | "aboutSmartOcean"
  | "bestZone"
  | "nearestZone"
  | "zoneDistance"
  | "zoneDetail"
  | "safety"
  | "species"
  | "time"
  | "fuel"
  | "whyRecommended"
  | "myReports"
  | "generalKnowledge"
  | "unclear";

const SW_MARKERS = [
  "habari", "mambo", "shikamoo", "poa", "safi", "asante", "karibu", "tafadhali",
  "ndiyo", "hapana", "leo", "kesho", "jana", "wapi", "gani", "zipi", "vipi",
  "iko", "ziko", "yuko", "upo", "nipo", "huko", "huku", "hii", "hiyo", "hizi",
  "naomba", "niambie", "nionyeshe", "nataka", "nahitaji", "nisaidie", "niko",
  "kwenda", "kuvua", "samaki", "bahari", "saa", "ngapi", "umbali", "mbali",
  "karibu", "nzuri", "ghali", "salama", "hatari", "upepo", "mawimbi", "jua",
  "mvua", "maji", "mvuvi", "wavuvi", "boti", "jahazi", "bandari", "pwani",
  "tamani", "pole", "hongera", "samahani",
  "kwa", "nini", "inapendekezwa", "wanatarajiwa", "unapendekezwa",
  "ripoti", "historia", "safari", "zangu", "yangu", "zako", "yako", "yetu",
  "zikoje", "vikoje", "ikoje", "maana", "eleza", "nani", "lini", "kwanini",
  "mbona", "aibu", "mafuta", "matumizi", "lita",
];

function detectLanguage(message: string, fallback: Lang): Lang {
  const words = message.toLowerCase().split(/[^a-zà-ÿ]+/).filter(Boolean);
  if (words.length === 0) return fallback;
  let sw = 0;
  for (const w of words) {
    if (SW_MARKERS.includes(w)) sw += 1;
  }
  if (sw >= 2) return "sw";
  if (sw === 1 && words.length <= 4) return "sw";
  return fallback;
}

function norm(s: string) {
  return s.toLowerCase().replace(/[?!.,;:()"]/g, " ").replace(/\s+/g, " ").trim();
}

function includesAny(hay: string, needles: string[]) {
  return needles.some((n) => hay.includes(n));
}

// ---- entity resolution -----------------------------------------------------

const ZONE_ALIASES: Record<string, string[]> = {
  A: ["zone a", "zonea", "a"],
  B: ["zone b", "zoneb", "b"],
  C: ["zone c", "zonec", "c"],
  D: ["zone d", "zoned", "d"],
};

function explicitZoneRef(text: string, zones: AssistantZone[]): AssistantZone | null {
  const t = ` ${text.toLowerCase()} `;
  for (const z of zones) {
    const letter = z.name.replace(/^zone\s*/i, "").trim().toUpperCase();
    const aliases = ZONE_ALIASES[letter] ?? [z.name.toLowerCase()];
    for (const a of aliases) {
      if (a.length === 1) {
        if (new RegExp(`\\bzone\\s+${a}\\b`, "i").test(t)) return z;
      } else if (t.includes(a)) {
        return z;
      }
    }
    if (t.includes(z.name.toLowerCase())) return z;
  }
  return null;
}

const ANAPHORA = ["huko", "huku", "hiyo", "hii", "hicho", "that", "there", "it", "hiko"];

function lastZoneFromHistory(history: HistoryMessage[], zones: AssistantZone[]): AssistantZone | null {
  for (let i = history.length - 1; i >= 0; i--) {
    const z = explicitZoneRef(history[i].content, zones);
    if (z) return z;
  }
  return null;
}

function resolveZone(
  text: string,
  history: HistoryMessage[],
  zones: AssistantZone[],
): AssistantZone | null {
  return (
    explicitZoneRef(text, zones) ??
    (includesAny(` ${text} `, ANAPHORA.map((a) => ` ${a} `)) ? lastZoneFromHistory(history, zones) : null)
  );
}

// ---- intent detection ------------------------------------------------------

function detectIntents(text: string): Intent[] {
  const t = ` ${norm(text)} `;
  const intents: Intent[] = [];
  const add = (i: Intent) => {
    if (!intents.includes(i)) intents.push(i);
  };

  if (
    (includesAny(t, ["hello", "habari", "mambo", "shikamoo", "good morning", "good afternoon", "good evening", "hey", "hujambo", "habari yako", "niaje", "how are you", "how are u"]) ||
      /\bhi\b/.test(t)) &&
    t.trim().split(" ").length <= 6
  ) {
    add("greeting");
  }
  if (includesAny(t, ["bye", "goodbye", "good night", "kwaheri", "tutaonana", "see you"])) add("farewell");
  if (includesAny(t, ["thank", "asante", "shukran", "thanks"])) add("thanks");
  if (includesAny(t, ["who are you", "your name", "wewe ni nani", "unaitwa nani", "jina lako"])) add("identity");
  if (
    includesAny(t, ["what can you do", "help me", "nisaidie", "unaweza nini", "how can you help", "msaada", "help", "features", "huduma"])
  ) {
    add("capabilities");
  }
  if (includesAny(t, ["smart ocean", "about smart", "kuhusu smart", "what is smart ocean", "this app", "hii app"])) add("aboutSmartOcean");

  const zoneWord = includesAny(t, ["zone", "sehemu", "eneo", "mahali", "wapi", "karibu", "mbali", "umbali", "distance", "far", "closest", "nearest", "karibu na mimi", "niko wapi"]);
  const fishWord = includesAny(t, ["fish", "samaki", "kuvua", "vua", "catch", "potential", "niende", "niende wapi", "nivue", "nile", "go to", "where should", "which zone", "gani nzuri", "gani bora", "bora", "nzuri", "suitable", "recommend", "pendekeza", "pendekezwa", "shauri"]);
  const safetyWord = includesAny(t, ["salama", "safe", "safety", "hatari", "dangerous", "bahari", "hali ya", "conditions", "can i go", "naweza kwenda", "weather", "hali ya hewa", "upepo", "mawimbi"]);
  const speciesWord = includesAny(t, ["samaki gani", "what fish", "species", "aina gani", "wanatarajiwa", "expected", "tuna", "dagaa"]);
  const timeWord = includesAny(t, ["saa ngapi", "what time", "wakati", "muda", "niondoke", "ondoka", "leave", "when should", "lini", "saa"]) && !includesAny(t, ["sasa"]);
  const whyWord = includesAny(t, ["kwa nini", "kwanini", "mbona", "why", "kwa nini inapendekezwa", "reason"]);
  const reportWord = includesAny(t, ["report", "ripoti", "historia", "history", "trip", "safari", "catch yangu", "my catch", "zangu"]);
  const fuelWord = includesAny(t, ["fuel", "mafuta", "liters", "lita", "matumizi ya", "petroli", "diesel"]);

  if (whyWord && zoneWord) add("whyRecommended");
  else if (whyWord) add("whyRecommended");
  if (safetyWord) add("safety");
  if (speciesWord) add("species");
  if (timeWord) add("time");
  if (reportWord) add("myReports");
  if (fuelWord) add("fuel");

  if (zoneWord || fishWord) {
    const hasSpecific = ["whyRecommended", "species", "time", "safety", "myReports"].some((i) =>
      intents.includes(i as Intent),
    );
    const asksRecommend = includesAny(t, [
      "niende wapi", "nivue wapi", "where should", "which zone", "recommend",
      "pendekez", "shauri", "gani nzuri", "gani bora", "potential kubwa", "highest",
      "best", "bora", "nzuri", "suitable",
    ]);
    if (asksRecommend && !intents.includes("whyRecommended")) add("bestZone");
    else if (includesAny(t, ["karibu", "closest", "nearest", "near me", "karibu na mimi", "iko karibu"])) add("nearestZone");
    else if (includesAny(t, ["mbali", "umbali", "distance", "how far", "kiasi gani", "how long", "eta", "muda gani", "wapi", "where", "location", "iko", "mahali"])) add("zoneDistance");
    else if (!hasSpecific) add("zoneDetail");
  }

  if (
    intents.length === 0 &&
    includesAny(t, ["what is", "what are", "how does", "explain", "eleza", "maana ya", "nini maana", "gps", " artificial", " ai ", "tide", "current", "net", "boat", "engine"])
  ) {
    add("generalKnowledge");
  }

  if (intents.length === 0) {
    // Greeting embedded in a longer message?
    if (includesAny(t, ["hello", "habari", "mambo", "hey"]) || /\bhi\b/.test(t)) add("greeting");
    else add("unclear");
  }
  return intents;
}

// ---- small general knowledge (harmless, non-fishing questions) --------------

const KNOWLEDGE: { match: string[]; en: string; sw: string }[] = [
  {
    match: ["gps", "location", "satellite", "mahali"],
    en: "GPS is a satellite navigation system. Your phone listens to signals from GPS satellites to work out your exact position on the sea or land, which is how Smart Ocean finds your location for distances and routes.",
    sw: "GPS ni mfumo wa satelaiti unaotumiwa kujua eneo lako. Simu yako husikiliza mawimbi kutoka satelaiti ili kubaini ulipo, na ndiyo Smart Ocean inavyotumia kupata umbali na njia.",
  },
  {
    match: ["artificial intelligence", "what is ai", " ai ", "akili"],
    en: "AI (artificial intelligence) means computer programs that can understand language and help answer questions. In Smart Ocean, the assistant reads the available fishing information and explains it to you in simple words.",
    sw: "AI (akili bandia) ni programu za kompyuta zinazoweza kuelewa lugha na kukusaidia kujibu maswali. Katika Smart Ocean, msaidizi husoma taarifa zilizopo za uvuvi na kukueleza kwa maneno rahisi.",
  },
  {
    match: ["tide", "mawimbi ya bahari", "kupwa", "kujaa"],
    en: "Tides are the regular rise and fall of the sea caused mainly by the moon's gravity. Many fishermen prefer going out when the tide suits their fishing grounds and returning before conditions change.",
    sw: "Mawimbi ya kupwa na kujaa hutokana zaidi na nguvu ya mwezi. Wavuvi wengi hupendelea kutoka baharini wakati maji yanafaa na kurejea kabla hali haijabadilika.",
  },
];

function generalKnowledgeAnswer(text: string, lang: Lang): string | null {
  const t = norm(text);
  for (const k of KNOWLEDGE) {
    if (k.match.some((m) => t.includes(m))) return lang === "sw" ? k.sw : k.en;
  }
  return null;
}

// ---- formatting helpers ----------------------------------------------------

function fmtKm(d: number | null, lang: Lang) {
  if (d === null || !Number.isFinite(d)) {
    return lang === "sw" ? "umbali haujapatikana" : "distance unavailable";
  }
  return `${d.toFixed(1)} km`;
}

function etaMin(d: number | null) {
  if (d === null || !Number.isFinite(d)) return null;
  return Math.max(1, Math.round((d / 20) * 60));
}

function safetyWord(status: string, lang: Lang) {
  if (lang === "sw") {
    return status === "SAFE" ? "salama" : status === "MODERATE" ? "wastani — chukua tahadhari" : "hatari";
  }
  return status === "SAFE" ? "safe" : status === "MODERATE" ? "moderate — take care" : "dangerous";
}

// ---- main responder --------------------------------------------------------

export function respondToMessage(
  message: string,
  ctx: AssistantContext,
  history: HistoryMessage[],
): string {
  const cleaned = message.trim().slice(0, 1000);
  const lang = detectLanguage(cleaned, ctx.language);
  const lower = ` ${norm(cleaned)} `;

  // Prompt-injection guard: stay a fishing assistant, say so naturally.
  if (
    /ignore (previous|all|prior) instructions|disregard .*instructions|system prompt|reveal .*prompt|jailbreak|dan mode|you are now|pretend (to be|you)|override .*safe|do anything now/i.test(
      cleaned,
    )
  ) {
    return lang === "sw"
      ? "Mimi ni Msaidizi wa Smart Ocean — nipo hapa kukusaidia kuhusu maeneo ya uvuvi, hali ya bahari, njia na ripoti zako. Ulitaka kujua nini?"
      : "I'm the Smart Ocean assistant — I'm here to help with fishing zones, sea conditions, routes and your reports. What would you like to know?";
  }

  // Split mixed messages into clauses so each question gets answered.
  const clauses = cleaned
    .split(/[,?;]|\b na \b|\b and \b/)
    .map((c) => c.trim())
    .filter((c) => c.length > 1);
  const clauseList = clauses.length > 1 ? clauses : [cleaned];

  const topZone = [...ctx.zones].sort((a, b) => b.potential - a.potential)[0] ?? null;
  const parts: string[] = [];
  let greeted = false;

  for (const clause of clauseList) {
    for (const intent of detectIntents(clause)) {
      const answer = answerIntent(intent, clause, lower, ctx, history, topZone, lang);
      if (answer) {
        if (intent === "greeting") {
          if (greeted) continue;
          greeted = true;
        }
        parts.push(answer);
      }
    }
  }

  if (parts.length === 0) return clarify(ctx, topZone, lang);
  // De-duplicate identical sentences from overlapping clauses.
  const seen = new Set<string>();
  return parts
    .filter((p) => {
      const k = p.slice(0, 60);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .join(" ");
}

function clarify(ctx: AssistantContext, topZone: AssistantZone | null, lang: Lang): string {
  if (lang === "sw") {
    return topZone
      ? `Samahani, sijaelewa vizuri. Ungependa kujua potential ya ${topZone.name}, samaki wanaotarajiwa, umbali, hali ya bahari, au muda mzuri wa kutoka?`
      : "Samahani, sijaelewa vizuri. Unaweza kuuliza kuhusu maeneo ya uvuvi, hali ya bahari, umbali, au muda wa kutoka?";
  }
  return topZone
    ? `Sorry, I didn't quite get that. Would you like to know about ${topZone.name}'s fishing potential, expected fish, distance, sea conditions, or the best time to go?`
    : "Sorry, I didn't quite get that. You can ask me about fishing zones, sea conditions, distances, or the best time to go.";
}

function answerIntent(
  intent: Intent,
  clause: string,
  fullLower: string,
  ctx: AssistantContext,
  history: HistoryMessage[],
  topZone: AssistantZone | null,
  lang: Lang,
): string | null {
  const sw = lang === "sw";

  switch (intent) {
    case "greeting": {
      if (sw) {
        if (fullLower.includes("shikamoo")) return "Marahaba! Karibu Smart Ocean. Nikusaidie nini leo?";
        if (fullLower.includes("good morning")) return "Habari za asubuhi! Karibu Smart Ocean. Nikusaidie nini leo?";
        if (fullLower.includes("good afternoon") || fullLower.includes("good evening")) return "Habari! Karibu Smart Ocean. Nikusaidie nini leo?";
        return "Habari! Karibu Smart Ocean. Ungependa nikusaidie nini leo?";
      }
      if (fullLower.includes("good morning")) return "Good morning! Welcome to Smart Ocean. How can I help you today?";
      if (fullLower.includes("good afternoon") || fullLower.includes("good evening")) return "Good afternoon! Welcome to Smart Ocean. How can I help you today?";
      if (fullLower.includes("how are you")) return sw ? "" : "I'm doing well, thank you! How can I help you with your fishing today?";
      return "Hello! Welcome to Smart Ocean. How can I help you today?";
    }
    case "farewell":
      return sw ? "Kwaheri! Bahari iwe salama na uvuvi mwema!" : "Goodbye! Stay safe out there and good fishing!";
    case "thanks":
      return sw ? "Karibu sana! Nipo tayari kukusaidia wakati wowote." : "You're very welcome! I'm here whenever you need help.";
    case "identity":
      return sw
        ? "Mimi ni Msaidizi wa Smart Ocean. Ninaweza kukusaidia kuelewa maeneo ya uvuvi, hali ya bahari, njia na umbali, muda mzuri wa kutoka, na ripoti zako za uvuvi."
        : "I'm the Smart Ocean assistant. I can help you understand fishing zones, sea conditions, routes and distances, the best time to go, and your fishing reports.";
    case "capabilities":
      return sw
        ? "Ninaweza kukusaidia na haya: kuchagua eneo bora la kuvua, kuangalia kama bahari iko salama, kujua samaki wanaotarajiwa na muda mzuri, kupima umbali na muda wa kufika, na kuangalia ripoti zako. Uliza kwa Kiswahili au Kiingereza."
        : "I can help with: picking a good fishing zone, checking whether the sea is safe, expected fish and best times, distances and travel times, and your reports. Ask me in English or Kiswahili.";
    case "aboutSmartOcean":
      return sw
        ? "Smart Ocean huwasaidia wavuvi kupata maeneo yanayofaa kuvua, kuelewa hali ya bahari, kupanga muda wa kutoka, kufika kwenye eneo lililochaguliwa, na kutunza kumbukumbu za kila safari ya uvuvi."
        : "Smart Ocean helps fishermen discover suitable fishing zones, understand ocean conditions, plan when to go, navigate to a selected zone, and keep track of every fishing trip.";
    case "safety": {
      const w = ctx.weather;
      if (sw) {
        return `Kwa taarifa zilizopo, bahari iko ${safetyWord(ctx.safetyStatus, "sw")} (upepo ${w.windSpeedKmh} km/h, mawimbi ${w.waveHeightM} m, ${w.description}).`;
      }
      return `Based on the available information, the sea is ${safetyWord(ctx.safetyStatus, "en")} (wind ${w.windSpeedKmh} km/h, waves ${w.waveHeightM} m, ${w.description}).`;
    }
    case "bestZone": {
      if (!topZone) return sw ? "Kwa sasa hakuna taarifa za maeneo." : "There is currently no zone information available.";
      const d = topZone.distanceKm;
      const eta = etaMin(d);
      const distBit =
        d !== null
          ? sw
            ? ` Iko umbali wa ${fmtKm(d, "sw")}${eta !== null ? `, kama dakika ${eta} kufika` : ""}.`
            : ` It is ${fmtKm(d, "en")} away${eta !== null ? `, about ${eta} minutes to reach` : ""}.`
          : "";
      if (sw) {
        return `${topZone.name} ndilo eneo lililo na potential kubwa zaidi kwa sasa (${topZone.potential}%). Samaki wanaotarajiwa: ${topZone.species.join(", ") || "hakuna taarifa"}. Muda unaopendekezwa: ${topZone.recommendedTime}.${distBit}`;
      }
      return `${topZone.name} has the highest available fishing potential right now (${topZone.potential}%). Expected fish: ${topZone.species.join(", ") || "no information"}. Recommended time: ${topZone.recommendedTime}.${distBit}`;
    }
    case "nearestZone": {
      if (!ctx.hasLocation) {
        return sw
          ? "Sina eneo lako la sasa, kwa hiyo siwezi kubaini lililo karibu. Ruhusu eneo kwenye ramani kisha niulize tena."
          : "I don't have your current location, so I can't tell which zone is closest. Allow location access on the map and ask me again.";
      }
      const withDist = ctx.zones.filter((z) => z.distanceKm !== null).sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
      const near = withDist[0] ?? null;
      if (!near) return sw ? "Hakuna taarifa za umbali kwa sasa." : "Distance information is currently unavailable.";
      if (sw) return `${near.name} ndilo eneo lililo karibu nawe — umbali wa ${fmtKm(near.distanceKm, "sw")}, potential ${near.potential}%.`;
      return `${near.name} is the closest zone to you — ${fmtKm(near.distanceKm, "en")} away, with ${near.potential}% fishing potential.`;
    }
    case "zoneDistance":
    case "zoneDetail": {
      const explicit = explicitZoneRef(clause, ctx.zones);
      const z = explicit ?? resolveZone(clause, history, ctx.zones) ?? topZone;
      if (!z) return sw ? "Sijapata eneo hilo. Jaribu kuuliza kuhusu Zone A, B, C au D." : "I couldn't find that zone. Try asking about Zone A, B, C or D.";
      const wantsDistance = intent === "zoneDistance" || includesAny(` ${norm(clause)} `, ["wapi", "mbali", "umbali", "distance", "far", "karibu", "where", "location", "iko", "mahali"]);
      if (intent === "zoneDetail" && !wantsDistance) {
        if (explicit) {
          // Bare zone reference ("Na Zone B?") → give a short natural summary.
          const d = z.distanceKm;
          const distBit =
            d !== null && ctx.hasLocation
              ? sw
                ? ` Iko umbali wa ${fmtKm(d, "sw")} kutoka ulipo.`
                : ` It is ${fmtKm(d, "en")} from your location.`
              : "";
          if (sw) {
            return `${z.name} (${z.island}) — potential ${z.potential}%, samaki wanaotarajiwa: ${z.species.join(", ") || "hakuna taarifa"}, muda mzuri ${z.recommendedTime}.${distBit}`;
          }
          return `${z.name} (${z.island}) — ${z.potential}% potential, expected fish: ${z.species.join(", ") || "no information"}, best time ${z.recommendedTime}.${distBit}`;
        }
        return null; // handled as clarification below
      }
      if (!ctx.hasLocation) {
        return sw
          ? `${z.name} iko ${z.island} (potential ${z.potential}%). Sina eneo lako la sasa, kwa hiyo siwezi kupima umbali — ruhusu eneo kwenye ramani.`
          : `${z.name} is in ${z.island} (potential ${z.potential}%). I don't have your current location, so I can't measure the distance — please allow location access on the map.`;
      }
      const eta = etaMin(z.distanceKm);
      if (sw) {
        return `${z.name} iko umbali wa ${fmtKm(z.distanceKm, "sw")} kutoka ulipo${eta !== null ? `, kama dakika ${eta} kufika` : ""}. Potential yake ni ${z.potential}%.`;
      }
      return `${z.name} is ${fmtKm(z.distanceKm, "en")} from your location${eta !== null ? `, about ${eta} minutes to reach` : ""}. Its fishing potential is ${z.potential}%.`;
    }
    case "species": {
      const z = resolveZone(clause, history, ctx.zones) ?? topZone;
      if (!z) return sw ? "Hakuna taarifa za samaki kwa sasa." : "Fish information is currently unavailable.";
      const explicit = explicitZoneRef(clause, ctx.zones) !== null || z !== topZone;
      if (sw) {
        return explicit || clause.trim().split(" ").length > 3
          ? `Kwa ${z.name}, samaki wanaotarajiwa ni: ${z.species.join(", ") || "hakuna taarifa"}.`
          : `Samaki wanaotarajiwa leo: ${topZone ? `${topZone.name} — ${topZone.species.join(", ") || "hakuna taarifa"}` : "hakuna taarifa"}.`;
      }
      return explicit || clause.trim().split(" ").length > 3
        ? `For ${z.name}, the expected fish are: ${z.species.join(", ") || "no information"}.`
        : `Today's expected fish: ${topZone ? `${topZone.name} — ${topZone.species.join(", ") || "no information"}` : "no information"}.`;
    }
    case "time": {
      const z = resolveZone(clause, history, ctx.zones) ?? topZone;
      if (!z) return sw ? "Hakuna taarifa za muda kwa sasa." : "Time information is currently unavailable.";
      if (sw) return `Muda unaopendekezwa kwa ${z.name} ni ${z.recommendedTime}.`;
      return `The recommended time for ${z.name} is ${z.recommendedTime}.`;
    }
    case "fuel": {
      const z = resolveZone(clause, history, ctx.zones) ?? topZone;
      if (!z) return sw ? "Sijui ni eneo gani unaloulizia mafuta." : "I don't know which zone you are asking about for fuel.";
      if (z.distanceKm === null) return sw ? `Sina eneo lako la sasa, hivyo siwezi kukadiria mafuta ya kwenda ${z.name}.` : `I don't have your current location to estimate fuel to ${z.name}.`;
      
      const tripDist = z.distanceKm * 2;
      const fuelLiters = tripDist * ctx.fuelConsumptionLpk;
      
      if (sw) return `Kwa kwenda ${z.name} na kurudi (kilomita ${tripDist.toFixed(1)}), unakadiriwa kutumia takriban lita ${Math.ceil(fuelLiters)} za mafuta (kulingana na matumizi ya lita ${ctx.fuelConsumptionLpk} kwa kilomita).`;
      return `For a round trip to ${z.name} (${tripDist.toFixed(1)} km), you are estimated to use about ${Math.ceil(fuelLiters)} liters of fuel (based on ${ctx.fuelConsumptionLpk} L/km consumption).`;
    }
    case "whyRecommended": {
      const z = resolveZone(clause, history, ctx.zones) ?? topZone;
      if (!z) return sw ? "Sijaelewa ni eneo gani — ulimaanisha Zone A, B, C au D?" : "I'm not sure which zone you mean — did you mean Zone A, B, C or D?";
      const zoneSafety = z.safety === "Safe" ? (sw ? "salama" : "safe") : z.safety === "Caution" ? (sw ? "wastani" : "moderate") : sw ? "hatari" : "dangerous";
      if (sw) {
        return `${z.name} inapendekezwa kwa sababu potential yake ni ${z.potential}% (${z.confidence}), samaki wanaotarajiwa ni ${z.species.join(", ") || "hakuna taarifa"}, muda mzuri ni ${z.recommendedTime}, na hali yake ni ${zoneSafety}. Hii ni kulingana na taarifa zilizopo, si uhakika wa kisayansi.`;
      }
      return `${z.name} is recommended because its available fishing potential is ${z.potential}% (${z.confidence} confidence), expected fish are ${z.species.join(", ") || "no information"}, the suggested time is ${z.recommendedTime}, and its condition is ${zoneSafety}. This reflects the available system information, not a scientific guarantee.`;
    }
    case "myReports": {
      if (ctx.reportCount === 0) {
        return sw ? "Huna ripoti za safari zilizohifadhiwa bado. Unaweza kurekodi safari yako kwenye ukurasa wa Ripoti ya Uvuvi." : "You don't have any saved trip reports yet. You can record a trip on the Fishing Report page.";
      }
      const latest = ctx.recentReports[0];
      if (sw) {
        return `Una ripoti ${ctx.reportCount} zilizohifadhiwa. Ya mwisho: ${latest.zoneName}, ${latest.species}${latest.quantityKg !== null ? `, kilo ${latest.quantityKg}` : ""}. Unaweza kuona zote kwenye historia yako.`;
      }
      return `You have ${ctx.reportCount} saved trip report${ctx.reportCount === 1 ? "" : "s"}. The latest: ${latest.zoneName}, ${latest.species}${latest.quantityKg !== null ? `, ${latest.quantityKg} kg` : ""}. You can review them all in your history.`;
    }
    case "generalKnowledge": {
      const known = generalKnowledgeAnswer(clause, lang);
      if (known) return known;
      return sw
        ? "Hilo si eneo ninalolifahamu vizuri. Lakini ninaweza kukusaidia na maeneo ya uvuvi, hali ya bahari, umbali, muda wa kutoka, au ripoti zako."
        : "That's outside what I know well. But I can help with fishing zones, sea conditions, distances, best times, or your reports.";
    }
    case "unclear": {
      // Zone mentioned but no clear aspect → ask what they want to know.
      const z = explicitZoneRef(clause, ctx.zones);
      if (z) {
        return sw
          ? `Kuhusu ${z.name} — ungependa kujua potential yake, samaki wanaotarajiwa, umbali, hali ya bahari, au muda mzuri wa kutoka?`
          : `About ${z.name} — would you like to know its potential, expected fish, distance, sea conditions, or the best time to go?`;
      }
      return null;
    }
    default:
      return null;
  }
}
