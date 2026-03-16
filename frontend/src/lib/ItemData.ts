// ── Item Database ─────────────────────────────────────────────────────────────

export type ItemCategory = "Consumable" | "Gear" | "Artifact";
export type EquipSlot    = "Weapon" | "Helmet" | "Chest" | "Gloves" | "Boots" | "Ring";
export type ItemRarity   = "Common" | "Rare" | "Epic" | "Legendary";

export interface Item {
    id:          string;
    name:        string;
    category:    ItemCategory;
    cost:        number;
    rarity:      ItemRarity;
    description: string;
    /** Shown for consumables */
    effect?:     string;
    /** Which paper-doll slot this occupies */
    slot?:       EquipSlot;
    /** Human-readable buff label for gear/artifacts */
    buff?:       string;
    /** Numeric stat deltas applied on equip */
    statBuff?:   Partial<Record<"strength" | "agility" | "vitality" | "intelligence" | "sense", number>>;
}

export const ITEM_DATABASE: Item[] = [
    // ── Consumables ───────────────────────────────────────────────────────────
    {
        id:          "healing-potion",
        name:        "Healing Potion",
        category:    "Consumable",
        cost:        500,
        rarity:      "Common",
        description: "A vial of crimson liquid brewed by gate alchemists. Instantly restores 200 HP.",
        effect:      "+200 HP",
    },
    {
        id:          "scroll-of-focus",
        name:        "Scroll of Focus",
        category:    "Consumable",
        cost:        1000,
        rarity:      "Rare",
        description: "Ancient runes that dissolve mental fog. Reduces Fatigue by 20.",
        effect:      "-20 Fatigue",
    },
    {
        id:          "mana-elixir",
        name:        "Mana Elixir",
        category:    "Consumable",
        cost:        750,
        rarity:      "Common",
        description: "Refined mana crystal dissolved in spring water. Restores 150 MP.",
        effect:      "+150 MP",
    },

    // ── Gear ──────────────────────────────────────────────────────────────────
    {
        id:          "kasakas-venom-fang",
        name:        "Kasaka's Venom Fang",
        category:    "Gear",
        cost:        5000,
        rarity:      "Epic",
        slot:        "Weapon",
        buff:        "+15% Business Gold",
        description: "A blade forged from the primary fang of the Poison Viper Kasaka. Drips with paralytic venom.",
        statBuff:    { agility: 8 },
    },
    {
        id:          "knights-chestplate",
        name:        "Knight's Chestplate",
        category:    "Gear",
        cost:        4000,
        rarity:      "Rare",
        slot:        "Chest",
        buff:        "+10 VIT",
        description: "Standard-issue armor worn by Elite Gate Hunters. Heavy but virtually impenetrable.",
        statBuff:    { vitality: 10 },
    },
    {
        id:          "shadow-gauntlets",
        name:        "Shadow Gauntlets",
        category:    "Gear",
        cost:        3500,
        rarity:      "Rare",
        slot:        "Gloves",
        buff:        "+8 STR",
        description: "Gauntlets woven from solidified shadow essence. Amplify physical output.",
        statBuff:    { strength: 8 },
    },
    {
        id:          "iron-greaves",
        name:        "Iron Greaves",
        category:    "Gear",
        cost:        2500,
        rarity:      "Common",
        slot:        "Boots",
        buff:        "+6 AGI",
        description: "Reinforced footwear issued to Gate Corps soldiers. Light and durable.",
        statBuff:    { agility: 6 },
    },
    {
        id:          "void-helm",
        name:        "Void Helm",
        category:    "Gear",
        cost:        4500,
        rarity:      "Epic",
        slot:        "Helmet",
        buff:        "+12 INT",
        description: "A helmet that resonates with dimensional frequency. Sharpens the mind to a razored edge.",
        statBuff:    { intelligence: 12 },
    },

    // ── Artifacts ─────────────────────────────────────────────────────────────
    {
        id:          "sovereigns-ring",
        name:        "Sovereign's Ring",
        category:    "Artifact",
        cost:        10000,
        rarity:      "Legendary",
        slot:        "Ring",
        buff:        "+5% Agent Success Rate",
        description: "A ring worn by the Shadow Monarch himself. Radiates absolute authority.",
        statBuff:    { sense: 10, intelligence: 5 },
    },
];

// ── Rarity colours ────────────────────────────────────────────────────────────

export const RARITY_COLOR: Record<ItemRarity, string> = {
    Common:    "#64748b",
    Rare:      "#3b82f6",
    Epic:      "#a855f7",
    Legendary: "#eab308",
};

export const SLOT_ICON: Record<EquipSlot, string> = {
    Weapon:  "⚔",
    Helmet:  "🪖",
    Chest:   "🛡",
    Gloves:  "🧤",
    Boots:   "👢",
    Ring:    "💍",
};
