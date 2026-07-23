from .config import *

# Move power types
PHYSICAL = "physical"
SPECIAL = "special"
STATUS = "status"

# Move effects
EFFECT_NONE = None
EFFECT_BURN = "burn"
EFFECT_FREEZE = "freeze"
EFFECT_PARALYZE = "paralyze"
EFFECT_POISON = "poison"
EFFECT_SLEEP = "sleep"
EFFECT_CONFUSE = "confuse"
EFFECT_ATK_UP = "atk_up"
EFFECT_DEF_UP = "def_up"
EFFECT_SPD_UP = "spd_up"
EFFECT_SATK_UP = "satk_up"
EFFECT_SDEF_UP = "sdef_up"
EFFECT_ATK_DOWN = "atk_down"
EFFECT_DEF_DOWN = "def_down"
EFFECT_SPD_DOWN = "spd_down"
EFFECT_SATK_DOWN = "satk_down"
EFFECT_SDEF_DOWN = "sdef_down"
EFFECT_RECOVER = "recover"
EFFECT_RECOIL = "recoil"
EFFECT_STAT_RESET = "stat_reset"
EFFECT_CRIT_BOOST = "crit_boost"
EFFECT_FLINCH = "flinch"
EFFECT_MULTI_HIT = "multi_hit"
EFFECT_LEECH = "leech"
EFFECT_WEATHER_SUN = "weather_sun"
EFFECT_WEATHER_RAIN = "weather_rain"


class Move:
    def __init__(self, mid, name, mtype, category, power, accuracy, pp, priority=0,
                 effect=None, effect_chance=100, target="single", desc=""):
        self.id = mid
        self.name = name
        self.type = mtype
        self.category = category
        self.power = power
        self.accuracy = accuracy
        self.max_pp = pp
        self.priority = priority
        self.effect = effect
        self.effect_chance = effect_chance
        self.target = target
        self.desc = desc

MOVES_DB = {}

def _m(mid, name, mtype, cat, power, acc, pp, priority=0, effect=None, eff_chance=100, desc=""):
    MOVES_DB[mid] = Move(mid, name, mtype, cat, power, acc, pp, priority, effect, eff_chance, desc)

# ===== NORMAL MOVES =====
_m("tackle", "Tackle", TYPE_NORMAL, PHYSICAL, 40, 100, 35)
_m("scratch", "Scratch", TYPE_NORMAL, PHYSICAL, 40, 100, 35)
_m("quick_attack", "Quick Attack", TYPE_NORMAL, PHYSICAL, 40, 100, 30, priority=1, desc="Always strikes first")
_m("bite", "Bite", TYPE_DARK, PHYSICAL, 60, 100, 25, effect=EFFECT_FLINCH, eff_chance=30)
_m("tackle", "Tackle", TYPE_NORMAL, PHYSICAL, 40, 100, 35)
_m("headbutt", "Headbutt", TYPE_NORMAL, PHYSICAL, 70, 100, 15, effect=EFFECT_FLINCH, eff_chance=30)
_m("body_slam", "Body Slam", TYPE_NORMAL, PHYSICAL, 85, 100, 15, effect=EFFECT_PARALYZE, eff_chance=30)
_m("hyper_beam", "Hyper Beam", TYPE_NORMAL, SPECIAL, 150, 90, 5)
_m("swift", "Swift", TYPE_NORMAL, SPECIAL, 60, 0, 20, desc="Never misses")
_m("wrap", "Wrap", TYPE_NORMAL, PHYSICAL, 15, 90, 20)
_m("pursuit", "Pursuit", TYPE_DARK, PHYSICAL, 40, 100, 20)
_m("crunch", "Crunch", TYPE_DARK, PHYSICAL, 80, 100, 15, effect=EFFECT_DEF_DOWN, eff_chance=20)
_m("extreme_speed", "Extreme Speed", TYPE_NORMAL, PHYSICAL, 80, 100, 5, priority=2, desc="Always strikes first")
_m("megahorn", "Megahorn", TYPE_NORMAL, PHYSICAL, 120, 85, 10)
_m("hammer_arm", "Hammer Arm", TYPE_NORMAL, PHYSICAL, 100, 90, 10, effect=EFFECT_SPD_DOWN, eff_chance=100)
_m("double_edge", "Double Edge", TYPE_NORMAL, PHYSICAL, 120, 100, 15, effect=EFFECT_RECOIL, eff_chance=100)
_m("horn_attack", "Horn Attack", TYPE_NORMAL, PHYSICAL, 65, 100, 25)
_m("slam", "Slam", TYPE_NORMAL, PHYSICAL, 80, 75, 20)
_m("fury_swipes", "Fury Swipes", TYPE_NORMAL, PHYSICAL, 18, 80, 15, effect=EFFECT_MULTI_HIT, eff_chance=100)
_m("rage", "Rage", TYPE_NORMAL, PHYSICAL, 55, 100, 20)
_m("growl", "Growl", TYPE_NORMAL, STATUS, 0, 100, 40, effect=EFFECT_ATK_DOWN, eff_chance=100, desc="Lowers opponent's Attack")
_m("leer", "Leer", TYPE_NORMAL, STATUS, 0, 100, 30, effect=EFFECT_DEF_DOWN, eff_chance=100, desc="Lowers opponent's Defense")
_m("tail_whip", "Tail Whip", TYPE_NORMAL, STATUS, 0, 100, 30, effect=EFFECT_DEF_DOWN, eff_chance=100)
_m("harden", "Harden", TYPE_NORMAL, STATUS, 0, 0, 30, effect=EFFECT_DEF_UP, eff_chance=100)
_m("agility", "Agility", TYPE_NORMAL, STATUS, 0, 0, 30, effect=EFFECT_SPD_UP, eff_chance=100)
_m("swords_dance", "Swords Dance", TYPE_NORMAL, STATUS, 0, 0, 20, effect=EFFECT_ATK_UP, eff_chance=100)
_m("iron_head", "Iron Head", TYPE_NORMAL, PHYSICAL, 80, 100, 15, effect=EFFECT_FLINCH, eff_chance=30)
_m("iron_tail", "Iron Tail", TYPE_NORMAL, PHYSICAL, 100, 75, 15, effect=EFFECT_DEF_DOWN, eff_chance=30)
_m("metal_claw", "Metal Claw", TYPE_NORMAL, PHYSICAL, 50, 95, 35, effect=EFFECT_ATK_UP, eff_chance=10)
_m("pin_missile", "Pin Missile", TYPE_NORMAL, PHYSICAL, 25, 95, 20, effect=EFFECT_MULTI_HIT, eff_chance=100)
_m("poison_sting", "Poison Sting", TYPE_NORMAL, PHYSICAL, 15, 100, 35, effect=EFFECT_POISON, eff_chance=30)

# ===== FIRE MOVES =====
_m("ember", "Ember", TYPE_FIRE, SPECIAL, 40, 100, 25, effect=EFFECT_BURN, eff_chance=10)
_m("fire_spin", "Fire Spin", TYPE_FIRE, SPECIAL, 35, 85, 15)
_m("flame_wheel", "Flame Wheel", TYPE_FIRE, PHYSICAL, 60, 100, 25, effect=EFFECT_BURN, eff_chance=10)
_m("flamethrower", "Flamethrower", TYPE_FIRE, SPECIAL, 90, 100, 15, effect=EFFECT_BURN, eff_chance=10)
_m("fire_blast", "Fire Blast", TYPE_FIRE, SPECIAL, 110, 85, 5, effect=EFFECT_BURN, eff_chance=30)
_m("fire_fang", "Fire Fang", TYPE_FIRE, PHYSICAL, 65, 95, 15, effect=EFFECT_BURN, eff_chance=10)
_m("flame_fang", "Flame Fang", TYPE_FIRE, PHYSICAL, 65, 95, 15, effect=EFFECT_BURN, eff_chance=10)
_m("blaze_fury", "Blaze Fury", TYPE_FIRE, SPECIAL, 80, 100, 10, desc="Burns targets under half HP")
_m("inferno", "Inferno", TYPE_FIRE, SPECIAL, 130, 80, 5, effect=EFFECT_BURN, eff_chance=100)

# ===== WATER MOVES =====
_m("water_gun", "Water Gun", TYPE_WATER, SPECIAL, 40, 100, 25)
_m("bubble", "Bubble", TYPE_WATER, SPECIAL, 40, 100, 30, effect=EFFECT_SPD_DOWN, eff_chance=10)
_m("water_pulse", "Water Pulse", TYPE_WATER, SPECIAL, 60, 100, 20)
_m("bubble_beam", "Bubble Beam", TYPE_WATER, SPECIAL, 65, 100, 20, effect=EFFECT_SPD_DOWN, eff_chance=10)
_m("aqua_jet", "Aqua Jet", TYPE_WATER, PHYSICAL, 40, 100, 20, priority=1)
_m("hydro_pump", "Hydro Pump", TYPE_WATER, SPECIAL, 110, 80, 5)
_m("tidal_wave", "Tidal Wave", TYPE_WATER, SPECIAL, 100, 90, 10)
_m("ice_fang", "Ice Fang", TYPE_ICE, PHYSICAL, 65, 95, 15, effect=EFFECT_FREEZE, eff_chance=10)

# ===== GRASS MOVES =====
_m("vine_whip", "Vine Whip", TYPE_GRASS, PHYSICAL, 45, 100, 25)
_m("leech_seed", "Leech Seed", TYPE_GRASS, STATUS, 0, 90, 10, effect=EFFECT_LEECH, eff_chance=100)
_m("razor_leaf", "Razor Leaf", TYPE_GRASS, PHYSICAL, 55, 95, 25, effect=EFFECT_CRIT_BOOST, eff_chance=100)
_m("seed_bomb", "Seed Bomb", TYPE_GRASS, PHYSICAL, 80, 100, 15)
_m("giga_drain", "Giga Drain", TYPE_GRASS, SPECIAL, 75, 100, 10, effect=EFFECT_RECOVER, eff_chance=100)
_m("solar_beam", "Solar Beam", TYPE_GRASS, SPECIAL, 120, 100, 10)
_m("wood_hammer", "Wood Hammer", TYPE_GRASS, PHYSICAL, 120, 100, 15, effect=EFFECT_RECOIL, eff_chance=100)
_m("leaf_blade", "Leaf Blade", TYPE_GRASS, PHYSICAL, 90, 100, 15, effect=EFFECT_CRIT_BOOST, eff_chance=100)
_m("forest_wrath", "Forest Wrath", TYPE_GRASS, SPECIAL, 110, 85, 5)

# ===== ELECTRIC MOVES =====
_m("thundershock", "Thundershock", TYPE_ELECTRIC, SPECIAL, 40, 100, 30, effect=EFFECT_PARALYZE, eff_chance=10)
_m("spark", "Spark", TYPE_ELECTRIC, PHYSICAL, 65, 100, 20, effect=EFFECT_PARALYZE, eff_chance=30)
_m("thunder_wave", "Thunder Wave", TYPE_ELECTRIC, STATUS, 0, 100, 20, effect=EFFECT_PARALYZE, eff_chance=100)
_m("thunder_fang", "Thunder Fang", TYPE_ELECTRIC, PHYSICAL, 65, 95, 15, effect=EFFECT_PARALYZE, eff_chance=10)
_m("thunderbolt", "Thunderbolt", TYPE_ELECTRIC, SPECIAL, 90, 100, 15, effect=EFFECT_PARALYZE, eff_chance=10)
_m("thunder", "Thunder", TYPE_ELECTRIC, SPECIAL, 110, 70, 10, effect=EFFECT_PARALYZE, eff_chance=30)

# ===== ICE MOVES =====
_m("ice_shard", "Ice Shard", TYPE_ICE, PHYSICAL, 40, 100, 30, priority=1)
_m("icy_wind", "Icy Wind", TYPE_ICE, SPECIAL, 55, 95, 15, effect=EFFECT_SPD_DOWN, eff_chance=100)
_m("frost_bite", "Frost Bite", TYPE_ICE, PHYSICAL, 65, 95, 15, effect=EFFECT_FREEZE, eff_chance=10)
_m("ice_beam", "Ice Beam", TYPE_ICE, SPECIAL, 90, 100, 10, effect=EFFECT_FREEZE, eff_chance=10)
_m("blizzard", "Ice Beam", TYPE_ICE, SPECIAL, 110, 70, 5, effect=EFFECT_FREEZE, eff_chance=20)
_m("aurora_beam", "Aurora Beam", TYPE_ICE, SPECIAL, 65, 100, 20, effect=EFFECT_ATK_DOWN, eff_chance=10)

# ===== DARK MOVES =====
_m("dark_pulse", "Dark Pulse", TYPE_DARK, SPECIAL, 80, 100, 15, effect=EFFECT_FLINCH, eff_chance=20)
_m("shadow_sneak", "Shadow Sneak", TYPE_SPIRIT, PHYSICAL, 40, 100, 30, priority=1)
_m("shadow_claw", "Shadow Claw", TYPE_SPIRIT, PHYSICAL, 70, 100, 15, effect=EFFECT_CRIT_BOOST, eff_chance=100)
_m("shadow_ball", "Shadow Ball", TYPE_SPIRIT, SPECIAL, 80, 100, 15, effect=EFFECT_SDEF_DOWN, eff_chance=20)
_m("shadow_blast", "Shadow Blast", TYPE_SPIRIT, SPECIAL, 120, 85, 5)
_m("spite", "Spite", TYPE_SPIRIT, STATUS, 0, 100, 10, desc="Reduces target's PP")
_m("night_shade", "Night Shade", TYPE_SPIRIT, SPECIAL, 0, 100, 15, desc="Deals damage equal to level")
_m("will_o_wisp", "Will-O-Wisp", TYPE_SPIRIT, STATUS, 0, 85, 15, effect=EFFECT_BURN, eff_chance=100)
_m("spirit_break", "Spirit Break", TYPE_SPIRIT, PHYSICAL, 75, 100, 15, effect=EFFECT_SATK_DOWN, eff_chance=100)

# ===== EARTH MOVES =====
_m("mud_slap", "Mud Slap", TYPE_EARTH, SPECIAL, 20, 100, 10, effect=EFFECT_ATK_DOWN, eff_chance=100)
_m("sand_attack", "Sand Attack", TYPE_EARTH, STATUS, 0, 100, 15, effect=EFFECT_ATK_DOWN, eff_chance=100)
_m("dig", "Dig", TYPE_EARTH, PHYSICAL, 80, 100, 10)
_m("rock_throw", "Rock Throw", TYPE_EARTH, PHYSICAL, 50, 90, 15)
_m("rock_slide", "Rock Slide", TYPE_EARTH, PHYSICAL, 75, 90, 10, effect=EFFECT_FLINCH, eff_chance=30)
_m("stone_edge", "Stone Edge", TYPE_EARTH, PHYSICAL, 100, 80, 5, effect=EFFECT_CRIT_BOOST, eff_chance=100)
_m("earthquake", "Earthquake", TYPE_EARTH, PHYSICAL, 100, 100, 10)
_m("fissure", "Fissure", TYPE_EARTH, PHYSICAL, 0, 30, 5, desc="One-hit KO move")
_m("sandstorm", "Sandstorm", TYPE_EARTH, STATUS, 0, 0, 10, effect=EFFECT_STAT_RESET, eff_chance=100)

# ===== WIND MOVES =====
_m("gust", "Gust", TYPE_WIND, SPECIAL, 40, 100, 35)
_m("air_slash", "Air Slash", TYPE_WIND, SPECIAL, 75, 95, 15, effect=EFFECT_FLINCH, eff_chance=30)
_m("tailwind", "Tailwind", TYPE_WIND, STATUS, 0, 0, 15, effect=EFFECT_SPD_UP, eff_chance=100)
_m("hurricane", "Hurricane", TYPE_WIND, SPECIAL, 110, 70, 10)
_m("brave_bird", "Brave Bird", TYPE_WIND, PHYSICAL, 120, 100, 15, effect=EFFECT_RECOIL, eff_chance=100)
_m("confuse_ray", "Confuse Ray", TYPE_WIND, STATUS, 0, 100, 10, effect=EFFECT_CONFUSE, eff_chance=100)

# ===== LIGHT MOVES =====
_m("flash", "Flash", TYPE_LIGHT, STATUS, 0, 100, 20, effect=EFFECT_SATK_DOWN, eff_chance=100)
_m("dazzling_gleam", "Dazzling Gleam", TYPE_LIGHT, SPECIAL, 80, 100, 10)
_m("moonlight", "Moonlight", TYPE_LIGHT, STATUS, 0, 0, 5, effect=EFFECT_RECOVER, eff_chance=100)
_m("solar_beam", "Solar Beam", TYPE_LIGHT, SPECIAL, 120, 100, 10)
_m("bug_buzz", "Bug Buzz", TYPE_NORMAL, SPECIAL, 80, 100, 10)

# ===== DRAGON MOVES =====
_m("dragon_rage", "Dragon Rage", TYPE_DRAGON, SPECIAL, 0, 100, 10, desc="Deals 40 fixed damage")
_m("dragon_claw", "Dragon Claw", TYPE_DRAGON, PHYSICAL, 80, 100, 15)
_m("dragon_pulse", "Dragon Pulse", TYPE_DRAGON, SPECIAL, 85, 100, 10)
_m("dragon_dance", "Dragon Dance", TYPE_DRAGON, STATUS, 0, 0, 20, effect=EFFECT_ATK_UP, eff_chance=100)
_m("outrage", "Outrage", TYPE_DRAGON, PHYSICAL, 120, 100, 10, desc="Confuses user after use")

# ===== STATUS MOVES =====
_m("nasty_plot", "Nasty Plot", TYPE_DARK, STATUS, 0, 0, 20, effect=EFFECT_SATK_UP, eff_chance=100)
_m("recover", "Recover", TYPE_NORMAL, STATUS, 0, 0, 10, effect=EFFECT_RECOVER, eff_chance=100)
_m("sludge_bomb", "Sludge Bomb", TYPE_DARK, SPECIAL, 90, 100, 10, effect=EFFECT_POISON, eff_chance=30)

def get_move(move_id):
    return MOVES_DB.get(move_id)
