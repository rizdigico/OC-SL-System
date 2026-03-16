// ── Storyline Engine ─────────────────────────────────────────────────────────
// Maps player levels to Solo Leveling manhwa arcs, enemies, and milestones.

export interface StoryArc {
    /** Inclusive level range start */
    minLevel: number;
    /** Inclusive level range end (use Infinity for open-ended) */
    maxLevel: number;
    arc:       string;
    mobs:      string[];
    boss:      string;
    /** Optional milestone unlocked upon entering / completing this arc */
    unlocks?:  string;
}

export const STORY_ARCS: StoryArc[] = [
    {
        minLevel: 1,
        maxLevel: 10,
        arc:      "The Double Dungeon",
        mobs:     ["Stone Statue", "Centipede"],
        boss:     "Statue of God",
    },
    {
        minLevel: 11,
        maxLevel: 30,
        arc:      "C-Rank Strike Squad",
        mobs:     ["Poison-Fanged Raikan", "Giant Spider"],
        boss:     "Kasaka",
    },
    {
        minLevel: 31,
        maxLevel: 39,
        arc:      "The Red Gate",
        mobs:     ["Ice Elf", "White Yeti"],
        boss:     "Baruka",
    },
    {
        minLevel: 40,
        maxLevel: 40,
        arc:      "Job Change Quest",
        mobs:     ["Knight", "Mage"],
        boss:     "Blood Red Commander Igris",
        unlocks:  "Shadow Extraction",
    },
    {
        minLevel: 41,
        maxLevel: 60,
        arc:      "Demon Castle",
        mobs:     ["Low-tier Demon", "Cerberus"],
        boss:     "Vulcan",
    },
    {
        minLevel: 61,
        maxLevel: 80,
        arc:      "Jeju Island Raid",
        mobs:     ["Worker Ant", "Soldier Ant"],
        boss:     "Ant King Beru",
    },
    {
        minLevel: 81,
        maxLevel: 99,
        arc:      "The Monarch War",
        mobs:     ["Giant", "Shadow Beast"],
        boss:     "Beast Monarch",
    },
    {
        minLevel: 100,
        maxLevel: Infinity,
        arc:      "The Final Battle",
        mobs:     ["Dragon"],
        boss:     "Antares (Dragon Emperor)",
        unlocks:  "Cup of Reincarnation",
    },
];

/** Returns the arc entry that contains the given level. */
export function getCurrentArc(level: number): StoryArc {
    return (
        STORY_ARCS.find(a => level >= a.minLevel && level <= a.maxLevel)
        ?? STORY_ARCS[0]
    );
}

/** Returns the next arc after the one that contains the given level, or null if at the end. */
export function getNextArc(level: number): StoryArc | null {
    const idx = STORY_ARCS.findIndex(a => level >= a.minLevel && level <= a.maxLevel);
    return idx >= 0 && idx < STORY_ARCS.length - 1 ? STORY_ARCS[idx + 1] : null;
}
