// Maps archetype slug patterns → Pokémon TCG energy type + colour
// Used for coloured borders, backgrounds, and energy icons across the UI

export type EnergyType =
  | "fire" | "water" | "grass" | "lightning" | "psychic"
  | "fighting" | "darkness" | "metal" | "dragon" | "colorless";

export const ENERGY_META: Record<EnergyType, {
  label: string; emoji: string;
  border: string; bg: string; glow: string; text: string;
}> = {
  fire:      { label: "Fire",      emoji: "🔥", border: "border-red-500/50",     bg: "bg-red-500/5",     glow: "shadow-red-500/20",    text: "text-red-400"    },
  water:     { label: "Water",     emoji: "💧", border: "border-blue-400/50",    bg: "bg-blue-400/5",    glow: "shadow-blue-400/20",   text: "text-blue-400"   },
  grass:     { label: "Grass",     emoji: "🍃", border: "border-green-500/50",   bg: "bg-green-500/5",   glow: "shadow-green-500/20",  text: "text-green-400"  },
  lightning: { label: "Lightning", emoji: "⚡", border: "border-yellow-400/50",  bg: "bg-yellow-400/5",  glow: "shadow-yellow-400/20", text: "text-yellow-400" },
  psychic:   { label: "Psychic",   emoji: "🔮", border: "border-purple-500/50",  bg: "bg-purple-500/5",  glow: "shadow-purple-500/20", text: "text-purple-400" },
  fighting:  { label: "Fighting",  emoji: "👊", border: "border-orange-600/50",  bg: "bg-orange-600/5",  glow: "shadow-orange-600/20", text: "text-orange-500" },
  darkness:  { label: "Darkness",  emoji: "🌑", border: "border-gray-600/70",    bg: "bg-gray-800/30",   glow: "shadow-gray-600/20",   text: "text-gray-400"   },
  metal:     { label: "Metal",     emoji: "⚙️", border: "border-slate-400/50",   bg: "bg-slate-400/5",   glow: "shadow-slate-400/20",  text: "text-slate-400"  },
  dragon:    { label: "Dragon",    emoji: "🐉", border: "border-indigo-500/50",  bg: "bg-indigo-500/5",  glow: "shadow-indigo-500/20", text: "text-indigo-400" },
  colorless: { label: "Colorless", emoji: "🌀", border: "border-white/20",       bg: "bg-white/3",       glow: "shadow-white/10",      text: "text-gray-300"   },
};

// Slug-prefix → energy type map (ordered longest-first to avoid false prefix matches)
const SLUG_RULES: [string, EnergyType][] = [
  // Fire
  ["charizard",       "fire"],
  ["ceruledge",       "fire"],
  ["entei",           "fire"],
  ["arcanine",        "fire"],
  ["typhlosion",      "fire"],
  ["infernape",       "fire"],
  ["blaziken",        "fire"],
  // Water
  ["greninja",        "water"],
  ["milotic",         "water"],
  ["gyarados",        "water"],
  ["blastoise",       "water"],
  ["palafin",         "water"],
  ["iron-bundle",     "water"],
  // Grass
  ["teal-mask",       "grass"],
  ["ogerpon-noctowl", "grass"],
  ["ogerpon",         "grass"],
  ["serperior",       "grass"],
  ["meganium",        "grass"],
  ["hydrapple",       "grass"],
  ["dipplin",         "grass"],
  ["roserade",        "grass"],
  ["toedscruel",      "grass"],
  ["rillaboom",       "grass"],
  ["thwackey",        "grass"],
  // Lightning
  ["raging-bolt",     "lightning"],
  ["iron-hands",      "lightning"],
  ["miraidon",        "lightning"],
  ["joltik",          "lightning"],
  ["eelektrik",       "lightning"],
  ["dragonite-eelektrik", "lightning"],
  // Psychic
  ["gardevoir",       "psychic"],
  ["dragapult",       "psychic"],
  ["dreepy",          "psychic"],
  ["flutter-mane",    "psychic"],
  ["farigiraf",       "psychic"],
  ["mew",             "psychic"],
  ["mewtwo",          "psychic"],
  ["lunala",          "psychic"],
  ["slowking",        "psychic"],
  ["alakazam",        "psychic"],
  ["mimikyu",         "psychic"],
  // Fighting
  ["conkeldurr",      "fighting"],
  ["lucario",         "fighting"],
  ["terrakion",       "fighting"],
  ["crustle",         "fighting"],
  ["regirock",        "fighting"],
  // Darkness
  ["roaring-moon",    "darkness"],
  ["zoroark",         "darkness"],
  ["dark-horse",      "darkness"],
  ["grimmsnarl",      "darkness"],
  ["fezandipiti",     "darkness"],
  ["pecharunt",       "darkness"],
  ["weavile",         "darkness"],
  ["hydreigon",       "darkness"],
  ["darkrai",         "darkness"],
  ["lopunny",         "darkness"],
  // Metal
  ["gholdengo",       "metal"],
  ["genesect",        "metal"],
  ["scizor",          "metal"],
  ["aegislash",       "metal"],
  ["melmetal",        "metal"],
  ["jirachi",         "metal"],
  // Dragon
  ["regidrago",       "dragon"],
  ["dragonite",       "dragon"],
  ["garchomp",        "dragon"],
  ["baxcalibur",      "dragon"],
  ["mega-dragonite",  "dragon"],
  ["zygarde",         "dragon"],
  ["reshiram",        "dragon"],
  // Colorless
  ["pidgeot",         "colorless"],
  ["squawkabilly",    "colorless"],
  ["noctowl",         "colorless"],
  ["cramorant",       "colorless"],
  ["cinccino",        "colorless"],
  ["dusknoir",        "colorless"],
];

export function getEnergyType(slug: string): EnergyType {
  const lower = slug.toLowerCase();
  for (const [prefix, type] of SLUG_RULES) {
    if (lower.startsWith(prefix) || lower.includes(prefix)) return type;
  }
  return "colorless";
}

export function getEnergyMeta(slug: string) {
  return ENERGY_META[getEnergyType(slug)];
}
