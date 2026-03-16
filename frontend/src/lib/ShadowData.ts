// ── Shadow Index ──────────────────────────────────────────────────────────────
// Master list of all extractable shadows in The System.

export type ShadowRank = "E" | "D" | "C" | "B" | "A" | "S" | "UNIQUE";
export type ShadowType = "Soldier" | "Knight" | "Mage" | "Assassin" | "Beast" | "Boss";

export interface ShadowEntry {
    id:          string;
    name:        string;
    rank:        ShadowRank;
    type:        ShadowType;
    origin:      string;   // Arc or dungeon where this shadow is obtainable
    description: string;
    /** If true, this is a Boss-class extraction — displays UNIQUE badge */
    isBoss:      boolean;
}

export const SHADOW_INDEX: ShadowEntry[] = [
    {
        id:          "fangs",
        name:        "FANGS",
        rank:        "E",
        type:        "Beast",
        origin:      "The Double Dungeon",
        description: "Shadow wolf pack unit. Expendable but fast.",
        isBoss:      false,
    },
    {
        id:          "shadow-soldier",
        name:        "SHADOW SOLDIER",
        rank:        "D",
        type:        "Soldier",
        origin:      "C-Rank Strike Squad",
        description: "Standard infantry of the Shadow Army.",
        isBoss:      false,
    },
    {
        id:          "greed",
        name:        "GREED",
        rank:        "B",
        type:        "Mage",
        origin:      "The Red Gate",
        description: "Frost mage absorption. Channels ice magic with precision.",
        isBoss:      false,
    },
    {
        id:          "tank",
        name:        "TANK",
        rank:        "B",
        type:        "Knight",
        origin:      "Job Change Quest",
        description: "Heavy vanguard. Absorbs punishment without flinching.",
        isBoss:      false,
    },
    {
        id:          "igris",
        name:        "IGRIS",
        rank:        "A",
        type:        "Knight",
        origin:      "Job Change Quest",
        description: "Blood Red Commander. Sworn knight of the Shadow Monarch.",
        isBoss:      true,
    },
    {
        id:          "tusk",
        name:        "TUSK",
        rank:        "A",
        type:        "Knight",
        origin:      "Demon Castle",
        description: "Orc Knight King. Unmatched in raw physical combat.",
        isBoss:      false,
    },
    {
        id:          "iron",
        name:        "IRON",
        rank:        "A",
        type:        "Soldier",
        origin:      "Demon Castle",
        description: "Iron-class general. Tactical commander of ground forces.",
        isBoss:      false,
    },
    {
        id:          "beru",
        name:        "BERU",
        rank:        "S",
        type:        "Boss",
        origin:      "Jeju Island Raid",
        description: "Ant King Beru. Most powerful shadow. Fiercely loyal.",
        isBoss:      true,
    },
    {
        id:          "kaisel",
        name:        "KAISEL",
        rank:        "S",
        type:        "Beast",
        origin:      "The Monarch War",
        description: "Dragon Monarch's former companion. The sky belongs to him.",
        isBoss:      true,
    },
    {
        id:          "bellion",
        name:        "BELLION",
        rank:        "UNIQUE",
        type:        "Boss",
        origin:      "The Final Battle",
        description: "Grand Marshal of the Shadow Army. Second only to the Monarch.",
        isBoss:      true,
    },
];

/** Default set of owned shadow IDs for dummy/dev state */
export const DEFAULT_OWNED_SHADOW_IDS: string[] = ["igris", "iron"];

export interface OwnedShadow {
    id:     string;
    level:  number;
    exp:    number;
    expMax: number;
}

/** Default owned shadow progression data */
export const DEFAULT_OWNED_SHADOWS: OwnedShadow[] = [
    { id: "igris", level: 24, exp: 3200, expMax: 5000 },
    { id: "iron",  level: 11, exp:  800, expMax: 2000 },
];
