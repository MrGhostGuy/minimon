from .config import *

class Creature:
    def __init__(self, dex, name, types, base_stats, moves, evolution=None, catch_rate=45, growth=GROWTH_MEDIUM, gender_ratio=50, desc="", color=(200,200,200)):
        self.dex = dex
        self.name = name
        self.types = types
        self.base_stats = base_stats
        self.moves = moves
        self.evolution = evolution
        self.catch_rate = catch_rate
        self.growth_rate = growth
        self.gender_ratio = gender_ratio
        self.desc = desc
        self.color = color

CREATURE_DB = {}

def _add(dex, name, types, hp, atk, defn, spd, satk, sdef, moves, evo=None, catch_rate=45, growth=GROWTH_MEDIUM, desc="", color=(200,200,200)):
    CREATURE_DB[dex] = Creature(dex, name, types, [hp, atk, defn, spd, satk, sdef], moves, evo, catch_rate, growth, 50, desc, color)

# Format: (learn_level, move_id) — moves defined in moves.py
# Evolution: (evolve_level, evolve_to_dex)

# ===== STARTERS =====
_add(1, "Emberpup", [TYPE_FIRE], 45, 52, 40, 60, 48, 42,
     [(1, "scratch"), (1, "growl"), (6, "ember"), (10, "bite"), (15, "flame_fang"), (20, "crunch"),
      (25, "flamethrower"), (30, "fire_fang"), (35, "blaze_fury")],
     evo=(16, 4), color=(240, 120, 40))
_add(4, "Infernash", [TYPE_FIRE, TYPE_DARK], 70, 78, 55, 85, 72, 58,
     [(1, "ember"), (1, "crunch"), (1, "flame_fang"), (30, "dark_pulse"), (35, "blaze_fury"),
      (40, "flamethrower"), (45, "shadow_claw"), (50, "inferno")],
     catch_rate=45, color=(200, 60, 30))

_add(2, "Aquapup", [TYPE_WATER], 50, 45, 55, 48, 52, 48,
     [(1, "tackle"), (1, "tail_whip"), (6, "water_gun"), (10, "bite"), (15, "aqua_jet"),
      (20, "bubble_beam"), (25, "crunch"), (30, "hydro_pump")],
     evo=(16, 5), color=(60, 140, 240))
_add(5, "Tidaloom", [TYPE_WATER, TYPE_DRAGON], 85, 68, 72, 65, 80, 68,
     [(1, "water_gun"), (1, "crunch"), (1, "aqua_jet"), (30, "dragon_pulse"), (35, "bubble_beam"),
      (40, "hydro_pump"), (45, "dragon_dance"), (50, "tidal_wave")],
     color=(40, 100, 200))

_add(3, "Sproutling", [TYPE_GRASS], 48, 42, 55, 45, 50, 52,
     [(1, "tackle"), (1, "growl"), (6, "vine_whip"), (10, "leech_seed"), (15, "razor_leaf"),
      (20, "seed_bomb"), (25, "giga_drain"), (30, "solar_beam")],
     evo=(16, 6), color=(80, 200, 80))
_add(6, "Terralith", [TYPE_GRASS, TYPE_EARTH], 90, 70, 85, 50, 65, 78,
     [(1, "vine_whip"), (1, "leech_seed"), (1, "earthquake"), (30, "seed_bomb"),
      (35, "giga_drain"), (40, "stone_edge"), (45, "earthquake"), (50, "forest_wrath")],
     color=(60, 160, 60))

# ===== EARLY ROUTE CREATURES =====
_add(7, "Flutterwisp", [TYPE_WIND], 35, 30, 25, 55, 35, 30,
     [(1, "gust"), (5, "quick_attack"), (10, "tailwind"), (15, "air_slash")],
     evo=(20, 8), growth=GROWTH_FAST, color=(180, 220, 255))
_add(8, "Galewing", [TYPE_WIND, TYPE_LIGHT], 65, 55, 50, 85, 60, 55,
     [(1, "air_slash"), (1, "quick_attack"), (25, "dazzling_gleam"), (30, "hurricane"),
      (35, "brave_bird")],
     color=(200, 230, 255))

_add(9, "Burrowmole", [TYPE_EARTH], 40, 45, 50, 30, 25, 35,
     [(1, "scratch"), (5, "dig"), (10, "mud_slap"), (15, "rock_throw")],
     evo=(22, 10), growth=GROWTH_FAST, color=(160, 120, 70))
_add(10, "Diggernaut", [TYPE_EARTH, TYPE_NORMAL], 75, 80, 70, 45, 40, 55,
     [(1, "dig"), (1, "rock_throw"), (25, "earthquake"), (30, "stone_edge"),
      (35, "iron_tail"), (40, "earthquake")],
     color=(140, 100, 60))

_add(11, "Sparkitten", [TYPE_ELECTRIC], 38, 42, 30, 58, 40, 32,
     [(1, "scratch"), (1, "growl"), (5, "thundershock"), (10, "quick_attack"),
      (15, "spark"), (20, "thunder_fang")],
     evo=(22, 12), growth=GROWTH_FAST, color=(250, 230, 60))
_add(12, "Voltraith", [TYPE_ELECTRIC, TYPE_DARK], 70, 72, 50, 90, 65, 52,
     [(1, "spark"), (1, "thunder_fang"), (25, "dark_pulse"), (30, "thunderbolt"),
      (35, "shadow_claw"), (40, "thunder")],
     color=(220, 200, 40))

_add(13, "Frostkit", [TYPE_ICE], 40, 38, 35, 48, 42, 40,
     [(1, "scratch"), (1, "tail_whip"), (5, "ice_shard"), (10, "icy_wind"),
      (15, "frost_bite")],
     evo=(22, 14), growth=GROWTH_FAST, color=(160, 220, 240))
_add(14, "Glacius", [TYPE_ICE, TYPE_WIND], 72, 58, 55, 78, 70, 65,
     [(1, "ice_shard"), (1, "icy_wind"), (25, "blizzard"), (30, "air_slash"),
      (35, "ice_beam"), (40, "blizzard")],
     color=(140, 200, 230))

_add(15, "Shadeling", [TYPE_DARK], 38, 45, 30, 50, 35, 28,
     [(1, "scratch"), (1, "leer"), (5, "bite"), (10, "pursuit"),
      (15, "shadow_sneak")],
     evo=(24, 16), growth=GROWTH_FAST, color=(80, 60, 100))
_add(16, "Duskfang", [TYPE_DARK, TYPE_SPIRIT], 68, 78, 50, 80, 55, 48,
     [(1, "bite"), (1, "shadow_sneak"), (25, "shadow_claw"), (30, "dark_pulse"),
      (35, "crunch"), (40, "nasty_plot"), (45, "shadow_blast")],
     color=(60, 40, 80))

_add(17, "Lumibug", [TYPE_LIGHT], 32, 25, 28, 40, 45, 40,
     [(1, "tackle"), (5, "flash"), (10, "confuse_ray"), (15, "dazzling_gleam")],
     evo=(18, 18), growth=GROWTH_FAST, color=(255, 255, 150))
_add(18, "Radiantis", [TYPE_LIGHT, TYPE_WIND], 62, 48, 50, 75, 78, 70,
     [(1, "dazzling_gleam"), (1, "flash"), (20, "air_slash"), (25, "solar_beam"),
      (30, "moonlight"), (35, "bug_buzz")],
     color=(255, 255, 180))

_add(19, "Pebblit", [TYPE_EARTH, TYPE_NORMAL], 42, 48, 55, 25, 22, 30,
     [(1, "tackle"), (5, "rock_throw"), (10, "harden"), (15, "rock_slide")],
     evo=(25, 20), growth=GROWTH_FAST, color=(180, 160, 140))
_add(20, "Boulderon", [TYPE_EARTH], 85, 90, 100, 30, 35, 50,
     [(1, "rock_throw"), (1, "harden"), (25, "rock_slide"), (30, "earthquake"),
      (35, "stone_edge"), (40, "hyper_beam")],
     color=(150, 130, 110))

_add(21, "Pondling", [TYPE_WATER], 40, 35, 40, 38, 42, 45,
     [(1, "water_gun"), (5, "tackle"), (10, "bubble"), (15, "water_pulse")],
     evo=(20, 22), growth=GROWTH_FAST, color=(80, 160, 200))
_add(22, "Nessiel", [TYPE_WATER, TYPE_SPIRIT], 78, 55, 60, 60, 72, 75,
     [(1, "water_pulse"), (1, "bubble"), (25, "shadow_ball"), (30, "hydro_pump"),
      (35, "ice_beam"), (40, "spirit_break")],
     color=(60, 120, 180))

_add(23, "Wispflame", [TYPE_FIRE, TYPE_SPIRIT], 35, 40, 30, 50, 48, 35,
     [(1, "ember"), (1, "spite"), (5, "fire_spin"), (10, "will_o_wisp"),
      (15, "flame_wheel")],
     evo=(25, 24), growth=GROWTH_FAST, color=(240, 140, 60))
_add(24, "Infernospirit", [TYPE_FIRE, TYPE_SPIRIT], 70, 65, 50, 80, 78, 55,
     [(1, "flame_wheel"), (1, "shadow_ball"), (25, "flamethrower"), (30, "shadow_claw"),
      (35, "blaze_fury"), (40, "shadow_blast")],
     color=(220, 100, 40))

_add(25, "Thornling", [TYPE_GRASS, TYPE_DARK], 42, 50, 55, 35, 38, 40,
     [(1, "vine_whip"), (1, "leer"), (5, "poison_sting"), (10, "razor_leaf"),
      (15, "pin_missile")],
     evo=(28, 26), growth=GROWTH_FAST, color=(80, 140, 60))
_add(26, "Briarvain", [TYPE_GRASS, TYPE_DARK], 78, 80, 75, 55, 60, 62,
     [(1, "razor_leaf"), (1, "crunch"), (25, "seed_bomb"), (30, "dark_pulse"),
      (35, "giga_drain"), (40, "wood_hammer")],
     color=(50, 120, 40))

_add(27, "Zappling", [TYPE_ELECTRIC, TYPE_GRASS], 38, 40, 32, 52, 45, 35,
     [(1, "thundershock"), (1, "vine_whip"), (5, "spark"), (10, "leech_seed"),
      (15, "thunder_wave")],
     evo=(25, 28), growth=GROWTH_FAST, color=(200, 220, 60))
_add(28, "Voltvine", [TYPE_ELECTRIC, TYPE_GRASS], 72, 68, 55, 82, 75, 58,
     [(1, "spark"), (1, "giga_drain"), (25, "thunderbolt"), (30, "seed_bomb"),
      (35, "thunder"), (40, "solar_beam")],
     color=(180, 200, 40))

_add(29, "Sandswirl", [TYPE_EARTH, TYPE_WIND], 38, 42, 38, 48, 35, 32,
     [(1, "mud_slap"), (1, "gust"), (5, "sand_attack"), (10, "dig"),
      (15, "air_slash")],
     evo=(25, 30), growth=GROWTH_FAST, color=(210, 190, 130))
_add(30, "Dustvortex", [TYPE_EARTH, TYPE_WIND], 72, 65, 60, 85, 55, 52,
     [(1, "dig"), (1, "air_slash"), (25, "earthquake"), (30, "hurricane"),
      (35, "sandstorm"), (40, "fissure")],
     color=(190, 170, 110))

_add(31, "Coralbit", [TYPE_WATER, TYPE_LIGHT], 42, 35, 48, 38, 45, 50,
     [(1, "water_gun"), (1, "flash"), (5, "bubble"), (10, "confuse_ray"),
      (15, "dazzling_gleam")],
     evo=(25, 32), growth=GROWTH_FAST, color=(100, 200, 220))
_add(32, "Reefguard", [TYPE_WATER, TYPE_LIGHT], 80, 55, 80, 55, 72, 78,
     [(1, "bubble_beam"), (1, "dazzling_gleam"), (25, "hydro_pump"), (30, "moonlight"),
      (35, "ice_beam"), (40, "aurora_beam")],
     color=(80, 180, 200))

# ===== MID-GAME CREATURES =====
_add(33, "Gloomoth", [TYPE_DARK, TYPE_NORMAL], 50, 55, 40, 45, 42, 38,
     [(1, "bite"), (1, "poison_sting"), (5, "confuse_ray"), (10, "pursuit"),
      (15, "sludge_bomb"), (20, "dark_pulse")],
     evo=(30, 34), color=(120, 80, 140))
_add(34, "Dreadmoth", [TYPE_DARK, TYPE_WIND], 80, 78, 58, 72, 65, 55,
     [(1, "dark_pulse"), (1, "air_slash"), (30, "shadow_claw"), (35, "hurricane"),
      (40, "bug_buzz"), (45, "shadow_blast")],
     color=(100, 60, 120))

_add(35, "Ironclad", [TYPE_NORMAL, TYPE_EARTH], 65, 80, 90, 35, 30, 55,
     [(1, "tackle"), (1, "harden"), (5, "iron_head"), (10, "rock_throw"),
      (15, "metal_claw"), (20, "iron_tail"), (25, "rock_slide"), (30, "earthquake")],
     evo=(35, 36), color=(140, 140, 160))
_add(36, "Titanforge", [TYPE_NORMAL, TYPE_EARTH], 95, 100, 110, 40, 45, 70,
     [(1, "iron_tail"), (1, "earthquake"), (35, "stone_edge"), (40, "hyper_beam"),
      (45, "iron_head"), (50, "megahorn")],
     color=(120, 120, 140))

_add(37, "Frosthorn", [TYPE_ICE, TYPE_NORMAL], 60, 65, 55, 55, 50, 50,
     [(1, "ice_shard"), (1, "tackle"), (5, "frost_bite"), (10, "horn_attack"),
      (15, "ice_fang"), (20, "megahorn")],
     evo=(32, 38), color=(140, 200, 220))
_add(38, "Glacitaur", [TYPE_ICE, TYPE_DARK], 88, 85, 70, 70, 60, 65,
     [(1, "ice_fang"), (1, "crunch"), (30, "ice_beam"), (35, "dark_pulse"),
      (40, "blizzard"), (45, "shadow_claw")],
     color=(100, 160, 190))

_add(39, "Emberscale", [TYPE_FIRE, TYPE_DRAGON], 55, 60, 48, 52, 55, 45,
     [(1, "ember"), (1, "bite"), (5, "dragon_rage"), (10, "flame_wheel"),
      (15, "dragon_claw"), (20, "flamethrower")],
     evo=(35, 40), color=(220, 80, 40))
_add(40, "Drakonfire", [TYPE_FIRE, TYPE_DRAGON], 88, 85, 68, 78, 80, 65,
     [(1, "flamethrower"), (1, "dragon_claw"), (35, "dragon_pulse"), (40, "fire_blast"),
      (45, "outrage"), (50, "blaze_fury")],
     color=(200, 60, 30))

_add(41, "Tidecrest", [TYPE_WATER, TYPE_DRAGON], 58, 55, 55, 50, 60, 55,
     [(1, "water_gun"), (1, "dragon_rage"), (5, "water_pulse"), (10, "dragon_claw"),
      (15, "aqua_jet"), (20, "crunch")],
     evo=(35, 42), color=(50, 120, 200))
_add(42, "Leviathorn", [TYPE_WATER, TYPE_DRAGON], 92, 72, 75, 70, 82, 72,
     [(1, "hydro_pump"), (1, "dragon_pulse"), (35, "ice_beam"), (40, "dragon_dance"),
      (45, "tidal_wave"), (50, "outrage")],
     color=(30, 90, 170))

_add(43, "Leafshade", [TYPE_GRASS, TYPE_SPIRIT], 52, 48, 50, 48, 58, 55,
     [(1, "vine_whip"), (1, "spite"), (5, "leech_seed"), (10, "shadow_ball"),
      (15, "giga_drain"), (20, "will_o_wisp")],
     evo=(32, 44), color=(60, 180, 100))
_add(44, "Spirifleur", [TYPE_GRASS, TYPE_SPIRIT], 82, 60, 68, 65, 80, 78,
     [(1, "giga_drain"), (1, "shadow_ball"), (30, "solar_beam"), (35, "shadow_claw"),
      (40, "moonlight"), (45, "forest_wrath")],
     color=(40, 160, 80))

_add(45, "Sparkviper", [TYPE_ELECTRIC, TYPE_DARK], 50, 62, 40, 65, 55, 38,
     [(1, "thundershock"), (1, "bite"), (5, "spark"), (10, "pursuit"),
      (15, "thunder_fang"), (20, "crunch")],
     evo=(30, 46), color=(200, 180, 40))
_add(46, "Voltsnake", [TYPE_ELECTRIC, TYPE_DARK], 78, 85, 55, 90, 72, 52,
     [(1, "thunder_fang"), (1, "crunch"), (30, "thunderbolt"), (35, "dark_pulse"),
      (40, "thunder"), (45, "shadow_claw")],
     color=(180, 160, 20))

_add(47, "Crystalwing", [TYPE_ICE, TYPE_WIND], 55, 50, 48, 62, 60, 55,
     [(1, "ice_shard"), (1, "gust"), (5, "icy_wind"), (10, "air_slash"),
      (15, "frost_bite"), (20, "blizzard")],
     evo=(32, 48), color=(160, 220, 240))
_add(48, "Auroragon", [TYPE_ICE, TYPE_LIGHT], 85, 65, 68, 82, 82, 75,
     [(1, "ice_beam"), (1, "dazzling_gleam"), (30, "blizzard"), (35, "air_slash"),
      (40, "aurora_beam"), (45, "moonlight")],
     color=(140, 200, 230))

_add(49, "Flametail", [TYPE_FIRE, TYPE_NORMAL], 48, 55, 42, 65, 45, 38,
     [(1, "ember"), (1, "quick_attack"), (5, "fire_spin"), (10, "flame_wheel"),
      (15, "agility"), (20, "flamethrower")],
     evo=(28, 50), color=(250, 160, 60))
_add(50, "Solarfox", [TYPE_FIRE, TYPE_LIGHT], 78, 75, 58, 92, 70, 55,
     [(1, "flamethrower"), (1, "dazzling_gleam"), (28, "fire_blast"), (35, "quick_attack"),
      (40, "solar_beam"), (45, "extreme_speed")],
     color=(240, 140, 40))

_add(51, "Bulktank", [TYPE_EARTH, TYPE_NORMAL], 70, 75, 80, 35, 32, 55,
     [(1, "tackle"), (1, "harden"), (5, "mud_slap"), (10, "rock_throw"),
      (15, "iron_head"), (20, "earthquake")],
     evo=(30, 52), color=(170, 140, 100))
_add(52, "Megadrill", [TYPE_EARTH, TYPE_ELECTRIC], 95, 105, 95, 45, 40, 65,
     [(1, "earthquake"), (1, "iron_head"), (30, "stone_edge"), (35, "thunder"),
      (40, "megahorn"), (45, "fissure")],
     color=(150, 120, 80))

_add(53, "Mistral", [TYPE_WIND, TYPE_SPIRIT], 55, 45, 42, 70, 62, 55,
     [(1, "gust"), (1, "spite"), (5, "confuse_ray"), (10, "air_slash"),
      (15, "shadow_ball"), (20, "will_o_wisp")],
     evo=(32, 54), color=(170, 190, 220))
_add(54, "Phantastorm", [TYPE_WIND, TYPE_SPIRIT], 82, 58, 55, 95, 85, 72,
     [(1, "hurricane"), (1, "shadow_blast"), (30, "shadow_ball"), (35, "air_slash"),
      (40, "shadow_claw"), (45, "moonlight")],
     color=(140, 160, 200))

_add(55, "Magmaclaw", [TYPE_FIRE, TYPE_EARTH], 55, 65, 50, 48, 52, 42,
     [(1, "ember"), (1, "scratch"), (5, "mud_slap"), (10, "fire_fang"),
      (15, "rock_throw"), (20, "earthquake")],
     evo=(30, 56), color=(200, 100, 40))
_add(56, "Infernolith", [TYPE_FIRE, TYPE_EARTH], 88, 90, 75, 62, 68, 60,
     [(1, "earthquake"), (1, "flamethrower"), (30, "stone_edge"), (35, "fire_blast"),
      (40, "iron_tail"), (45, "inferno")],
     color=(180, 80, 30))

# ===== LATE GAME CREATURES =====
_add(57, "Voidmaw", [TYPE_DARK, TYPE_DRAGON], 70, 82, 58, 68, 72, 50,
     [(1, "bite"), (1, "dragon_rage"), (5, "dark_pulse"), (10, "dragon_claw"),
      (15, "crunch"), (20, "dragon_pulse"), (25, "shadow_claw"), (30, "outrage")],
     evo=(40, 58), growth=GROWTH_SLOW, color=(80, 40, 100))
_add(58, "Abyssaldrake", [TYPE_DARK, TYPE_DRAGON], 100, 105, 75, 85, 92, 68,
     [(1, "dragon_pulse"), (1, "shadow_claw"), (40, "outrage"), (45, "shadow_blast"),
      (50, "dark_pulse"), (55, "dragon_dance"), (60, "inferno")],
     color=(60, 20, 80))

_add(59, "Celestine", [TYPE_LIGHT, TYPE_DRAGON], 75, 60, 65, 70, 85, 80,
     [(1, "dazzling_gleam"), (1, "dragon_rage"), (5, "flash"), (10, "dragon_claw"),
      (15, "solar_beam"), (20, "moonlight"), (25, "dragon_pulse")],
     evo=(40, 60), growth=GROWTH_SLOW, color=(255, 240, 200))
_add(60, "Astraldrake", [TYPE_LIGHT, TYPE_DRAGON], 105, 78, 82, 88, 110, 95,
     [(1, "dragon_pulse"), (1, "solar_beam"), (40, "moonlight"), (45, "outrage"),
      (50, "aurora_beam"), (55, "dazzling_gleam"), (60, "hyper_beam")],
     color=(255, 220, 160))

_add(61, "Stoneheart", [TYPE_EARTH, TYPE_LIGHT], 68, 72, 85, 42, 55, 72,
     [(1, "rock_throw"), (1, "flash"), (5, "harden"), (10, "rock_slide"),
      (15, "iron_head"), (20, "dazzling_gleam"), (25, "stone_edge")],
     evo=(38, 62), color=(200, 180, 140))
_add(62, "Golemsolar", [TYPE_EARTH, TYPE_LIGHT], 100, 92, 108, 50, 72, 88,
     [(1, "stone_edge"), (1, "solar_beam"), (38, "earthquake"), (45, "iron_head"),
      (50, "moonlight"), (55, "hyper_beam"), (60, "fissure")],
     color=(180, 160, 120))

_add(63, "Tempestrix", [TYPE_WIND, TYPE_ELECTRIC], 65, 55, 50, 90, 78, 62,
     [(1, "gust"), (1, "thundershock"), (5, "tailwind"), (10, "spark"),
      (15, "air_slash"), (20, "thunderbolt"), (25, "hurricane"), (30, "thunder")],
     evo=(38, 64), color=(180, 210, 250))
_add(64, "Stormwing", [TYPE_WIND, TYPE_ELECTRIC], 95, 72, 68, 108, 98, 78,
     [(1, "hurricane"), (1, "thunder"), (38, "air_slash"), (45, "thunderbolt"),
      (50, "dazzling_gleam"), (55, "brave_bird"), (60, "extreme_speed")],
     color=(160, 190, 240))

_add(65, "Frostwyrm", [TYPE_ICE, TYPE_DRAGON], 82, 72, 65, 70, 78, 68,
     [(1, "ice_shard"), (1, "dragon_rage"), (5, "frost_bite"), (10, "dragon_claw"),
      (15, "ice_beam"), (20, "dragon_pulse"), (25, "blizzard"), (30, "dragon_dance")],
     evo=(42, 66), growth=GROWTH_SLOW, color=(120, 180, 220))
_add(66, "Cryodrake", [TYPE_ICE, TYPE_DRAGON], 108, 88, 82, 85, 95, 82,
     [(1, "blizzard"), (1, "dragon_pulse"), (42, "ice_beam"), (48, "outrage"),
      (52, "dragon_dance"), (55, "hydro_pump"), (60, "hyper_beam")],
     color=(100, 160, 200))

_add(67, "Nightmare", [TYPE_DARK, TYPE_SPIRIT], 72, 68, 55, 78, 80, 62,
     [(1, "shadow_ball"), (1, "dark_pulse"), (5, "confuse_ray"), (10, "shadow_claw"),
      (15, "night_shade"), (20, "pursuit"), (25, "shadow_blast"), (30, "nasty_plot")],
     evo=(38, 68), color=(70, 40, 90))
_add(68, "Phantasmal", [TYPE_DARK, TYPE_SPIRIT], 102, 82, 70, 98, 102, 78,
     [(1, "shadow_blast"), (1, "nasty_plot"), (38, "dark_pulse"), (45, "shadow_claw"),
      (50, "shadow_ball"), (55, "crunch"), (60, "night_shade")],
     color=(50, 20, 70))

_add(69, "Blazewolf", [TYPE_FIRE, TYPE_DARK], 68, 78, 55, 72, 62, 48,
     [(1, "ember"), (1, "bite"), (5, "fire_fang"), (10, "pursuit"),
      (15, "flame_wheel"), (20, "crunch"), (25, "flamethrower"), (30, "dark_pulse")],
     evo=(36, 70), color=(220, 100, 40))
_add(70, "Infernolf", [TYPE_FIRE, TYPE_DARK], 95, 102, 68, 88, 78, 62,
     [(1, "flamethrower"), (1, "dark_pulse"), (36, "fire_blast"), (42, "crunch"),
      (45, "shadow_claw"), (50, "blaze_fury"), (55, "inferno")],
     color=(200, 80, 20))

_add(71, "Seraphwing", [TYPE_LIGHT, TYPE_WIND], 72, 55, 60, 82, 85, 78,
     [(1, "dazzling_gleam"), (1, "gust"), (5, "flash"), (10, "air_slash"),
      (15, "moonlight"), (20, "solar_beam"), (25, "hurricane"), (30, "aurora_beam")],
     evo=(38, 72), color=(255, 250, 220))
_add(72, "Seraphdrake", [TYPE_LIGHT, TYPE_DRAGON], 102, 72, 78, 95, 105, 92,
     [(1, "dragon_pulse"), (1, "solar_beam"), (38, "moonlight"), (45, "outrage"),
      (50, "hurricane"), (55, "dazzling_gleam"), (60, "hyper_beam")],
     color=(255, 240, 200))

_add(73, "Warhammer", [TYPE_NORMAL, TYPE_EARTH], 90, 100, 95, 45, 42, 65,
     [(1, "hammer_arm"), (1, "harden"), (5, "mud_slap"), (10, "iron_head"),
      (15, "rock_slide"), (20, "earthquake"), (25, "megahorn"), (30, "stone_edge")],
     evo=(42, 74), growth=GROWTH_SLOW, color=(160, 140, 120))
_add(74, "Titanclash", [TYPE_NORMAL, TYPE_EARTH], 120, 118, 110, 50, 50, 80,
     [(1, "earthquake"), (1, "stone_edge"), (42, "hyper_beam"), (48, "iron_head"),
      (52, "megahorn"), (55, "fissure"), (60, "hammer_arm")],
     color=(140, 120, 100))

# ===== LEGENDARY / MYTHICAL =====
_add(75, "Solarius", [TYPE_LIGHT, TYPE_FIRE], 90, 85, 80, 95, 100, 85,
     [(1, "dazzling_gleam"), (1, "ember"), (10, "solar_beam"), (20, "flamethrower"),
      (30, "moonlight"), (40, "fire_blast"), (50, "aurora_beam"), (60, "hyper_beam")],
     catch_rate=3, growth=GROWTH_SLOW, color=(255, 220, 80))
_add(76, "Lunara", [TYPE_ICE, TYPE_SPIRIT], 90, 80, 85, 90, 95, 90,
     [(1, "ice_shard"), (1, "shadow_ball"), (10, "ice_beam"), (20, "shadow_claw"),
      (30, "moonlight"), (40, "blizzard"), (50, "shadow_blast"), (60, "aurora_beam")],
     catch_rate=3, growth=GROWTH_SLOW, color=(160, 180, 240))
_add(77, "Terrageist", [TYPE_EARTH, TYPE_SPIRIT], 95, 90, 95, 75, 80, 90,
     [(1, "earthquake"), (1, "shadow_ball"), (10, "stone_edge"), (20, "shadow_claw"),
      (30, "fissure"), (40, "shadow_blast"), (50, "iron_head"), (60, "earthquake")],
     catch_rate=3, growth=GROWTH_SLOW, color=(120, 100, 80))
_add(78, "Typhollow", [TYPE_WATER, TYPE_DARK], 92, 82, 78, 98, 88, 85,
     [(1, "water_gun"), (1, "bite"), (10, "hydro_pump"), (20, "dark_pulse"),
      (30, "crunch"), (40, "tidal_wave"), (50, "shadow_blast"), (60, "hyper_beam")],
     catch_rate=3, growth=GROWTH_SLOW, color=(30, 80, 160))
_add(79, "Stormheart", [TYPE_WIND, TYPE_ELECTRIC], 88, 88, 75, 105, 92, 82,
     [(1, "gust"), (1, "thundershock"), (10, "hurricane"), (20, "thunder"),
      (30, "air_slash"), (40, "thunderbolt"), (50, "dazzling_gleam"), (60, "brave_bird")],
     catch_rate=3, growth=GROWTH_SLOW, color=(200, 220, 255))
_add(80, "Ignisoul", [TYPE_FIRE, TYPE_SPIRIT], 90, 95, 78, 92, 98, 78,
     [(1, "ember"), (1, "shadow_ball"), (10, "flamethrower"), (20, "shadow_claw"),
      (30, "blaze_fury"), (40, "fire_blast"), (50, "shadow_blast"), (60, "inferno")],
     catch_rate=3, growth=GROWTH_SLOW, color=(255, 120, 60))

# ===== RIVAL'S CHOICES =====
_add(81, "Aquafang", [TYPE_WATER], 48, 50, 45, 55, 45, 42,
     [(1, "tackle"), (1, "growl"), (6, "water_gun"), (10, "bite"), (15, "aqua_jet"),
      (20, "crunch"), (25, "hydro_pump"), (30, "ice_fang")],
     evo=(16, 83), color=(50, 130, 230))
_add(82, "Leafclaw", [TYPE_GRASS], 48, 48, 48, 52, 48, 48,
     [(1, "tackle"), (1, "growl"), (6, "vine_whip"), (10, "leech_seed"), (15, "razor_leaf"),
      (20, "seed_bomb"), (25, "giga_drain"), (30, "leaf_blade")],
     evo=(16, 84), color=(80, 190, 70))
_add(83, "Hydralisk", [TYPE_WATER, TYPE_DRAGON], 72, 70, 62, 80, 68, 58,
     [(1, "water_gun"), (1, "dragon_rage"), (16, "aqua_jet"), (25, "dragon_claw"),
      (30, "hydro_pump"), (35, "crunch"), (40, "ice_fang")],
     color=(30, 100, 200))
_add(84, "Verdantmaw", [TYPE_GRASS, TYPE_DARK], 72, 68, 65, 75, 65, 62,
     [(1, "vine_whip"), (1, "bite"), (16, "seed_bomb"), (25, "dark_pulse"),
      (30, "giga_drain"), (35, "crunch"), (40, "wood_hammer")],
     color=(50, 150, 50))

# Dummy entry for slot 85
_add(85, "???", [TYPE_NORMAL], 99, 99, 99, 99, 99, 99,
     [(1, "hyper_beam")],
     catch_rate=0, color=(255, 255, 255))
