// ── Sprite Index ──────────────────────────────────────────────────────────────
// Drop real GIF paths into `src` once assets are ready.
// Every entry also carries a CSS fallback config used when src is absent/404.

export interface SpriteConfig {
    /** Path to actual sprite GIF – omit to use CSS fallback */
    src?:   string;
    /** Fallback accent / glow color */
    color:  string;
    /** Display label */
    label:  string;
    /** Visual tier controls sprite size */
    tier:   'player' | 'high' | 'sub' | 'mob' | 'boss';
}

// ── Asset definitions ─────────────────────────────────────────────────────────

export const SPRITES = {
    PLAYER: {
        jinwoo_commanding: { src: '/sprites/jinwoo_commanding.gif', color: '#818cf8', label: 'SOVEREIGN', tier: 'player' },
        jinwoo_attacking:  { src: '/sprites/jinwoo_attacking.gif',  color: '#d946ef', label: 'SOVEREIGN', tier: 'player' },
    },
    HIGH_TIER: {
        igris: { src: '/sprites/igris.gif', color: '#60a5fa', label: 'IGRIS', tier: 'high' },
        beru:  { src: '/sprites/beru.gif',  color: '#4ade80', label: 'BERU',  tier: 'high' },
    },
    SUB_AGENTS: {
        knight: { src: '/sprites/knight.gif', color: '#94a3b8', label: 'KNIGHT', tier: 'sub' },
        goblin: { src: '/sprites/goblin.gif', color: '#86efac', label: 'GOBLIN', tier: 'sub' },
    },
    ENEMIES: {
        // ── Phase 1 mobs ──────────────────────────────────────────────────────
        stone_statue:    { src: '/sprites/mob_stone_statue.gif',   color: '#94a3b8', label: 'Stone Statue',       tier: 'mob'  },
        centipede:       { src: '/sprites/mob_centipede.gif',      color: '#84cc16', label: 'Centipede',          tier: 'mob'  },
        poison_raikan:   { src: '/sprites/mob_poison_raikan.gif',  color: '#a3e635', label: 'Poison Raikan',      tier: 'mob'  },
        giant_spider:    { src: '/sprites/mob_giant_spider.gif',   color: '#78716c', label: 'Giant Spider',       tier: 'mob'  },
        ice_elf:         { src: '/sprites/mob_ice_elf.gif',        color: '#7dd3fc', label: 'Ice Elf',            tier: 'mob'  },
        white_yeti:      { src: '/sprites/mob_white_yeti.gif',     color: '#e2e8f0', label: 'White Yeti',         tier: 'mob'  },
        knight_mob:      { src: '/sprites/mob_knight.gif',         color: '#cbd5e1', label: 'Knight',             tier: 'mob'  },
        mage_mob:        { src: '/sprites/mob_mage.gif',           color: '#c084fc', label: 'Mage',               tier: 'mob'  },
        low_demon:       { src: '/sprites/mob_low_demon.gif',      color: '#f87171', label: 'Low-tier Demon',     tier: 'mob'  },
        cerberus:        { src: '/sprites/mob_cerberus.gif',       color: '#fb923c', label: 'Cerberus',           tier: 'mob'  },
        worker_ant:      { src: '/sprites/mob_worker_ant.gif',     color: '#a16207', label: 'Worker Ant',         tier: 'mob'  },
        soldier_ant:     { src: '/sprites/mob_soldier_ant.gif',    color: '#854d0e', label: 'Soldier Ant',        tier: 'mob'  },
        giant:           { src: '/sprites/mob_giant.gif',          color: '#78716c', label: 'Giant',              tier: 'mob'  },
        shadow_beast:    { src: '/sprites/mob_shadow_beast.gif',   color: '#7c3aed', label: 'Shadow Beast',       tier: 'mob'  },
        dragon:          { src: '/sprites/mob_dragon.gif',         color: '#dc2626', label: 'Dragon',             tier: 'mob'  },
        // ── Bosses ────────────────────────────────────────────────────────────
        statue_of_god:   { src: '/sprites/boss_statue_of_god.gif', color: '#f1f5f9', label: 'Statue of God',      tier: 'boss' },
        kasaka:          { src: '/sprites/boss_kasaka.gif',        color: '#84cc16', label: 'Kasaka',             tier: 'boss' },
        baruka:          { src: '/sprites/boss_baruka.gif',        color: '#7dd3fc', label: 'Baruka',             tier: 'boss' },
        igris_boss:      { src: '/sprites/boss_igris.gif',         color: '#dc2626', label: 'Igris (Boss)',       tier: 'boss' },
        vulcan:          { src: '/sprites/boss_vulcan.gif',        color: '#fb923c', label: 'Vulcan',             tier: 'boss' },
        ant_king_beru:   { src: '/sprites/boss_ant_king.gif',      color: '#4ade80', label: 'Ant King Beru',      tier: 'boss' },
        beast_monarch:   { src: '/sprites/boss_beast_monarch.gif', color: '#a855f7', label: 'Beast Monarch',      tier: 'boss' },
        antares:         { src: '/sprites/boss_antares.gif',       color: '#ef4444', label: 'Antares',            tier: 'boss' },
    },
} as const satisfies Record<string, Record<string, SpriteConfig>>;

export type EnemySpriteKey = keyof typeof SPRITES.ENEMIES;

// ── Name → key map (matches StorylineEngine mob/boss strings exactly) ─────────

export const MOB_NAME_MAP: Record<string, EnemySpriteKey> = {
    'Stone Statue':              'stone_statue',
    'Centipede':                 'centipede',
    'Poison-Fanged Raikan':      'poison_raikan',
    'Giant Spider':              'giant_spider',
    'Ice Elf':                   'ice_elf',
    'White Yeti':                'white_yeti',
    'Knight':                    'knight_mob',
    'Mage':                      'mage_mob',
    'Low-tier Demon':            'low_demon',
    'Cerberus':                  'cerberus',
    'Worker Ant':                'worker_ant',
    'Soldier Ant':               'soldier_ant',
    'Giant':                     'giant',
    'Shadow Beast':              'shadow_beast',
    'Dragon':                    'dragon',
    'Statue of God':             'statue_of_god',
    'Kasaka':                    'kasaka',
    'Baruka':                    'baruka',
    'Blood Red Commander Igris': 'igris_boss',
    'Vulcan':                    'vulcan',
    'Ant King Beru':             'ant_king_beru',
    'Beast Monarch':             'beast_monarch',
    'Antares (Dragon Emperor)':  'antares',
};
