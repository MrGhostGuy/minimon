import random
import numpy as np
from .config import *


TOWN_NAMES = ["Starter Village", "Ember Town", "Frost Harbor", "Shadow Haven", "Summit City"]
GYM_NAMES = ["Nature Lodge", "Inferno Dojo", "Tidal Temple", "Storm Spire", "Crystal Cavern", "Shadow Gate", "Solar Sanctum", "Grand Colosseum"]
GYM_TYPES = [TYPE_GRASS, TYPE_FIRE, TYPE_WATER, TYPE_ELECTRIC, TYPE_ICE, TYPE_DARK, TYPE_LIGHT, TYPE_DRAGON]


class GameMap:
    def __init__(self, width, height, name="", encounter_rate=0.15):
        self.width = width
        self.height = height
        self.name = name
        self.tiles = np.zeros((width, height), dtype=np.int32)
        self.npcs = []
        self.signs = []
        self.doors = []
        self.encounter_rate = encounter_rate
        self.encounter_table = []

    def set_tile(self, x, y, tile):
        if 0 <= x < self.width and 0 <= y < self.height:
            self.tiles[x][y] = tile

    def get_tile(self, x, y):
        if 0 <= x < self.width and 0 <= y < self.height:
            return int(self.tiles[x][y])
        return TILE_WALL

    def is_walkable(self, x, y):
        return self.get_tile(x, y) in WALKABLE_TILES

    def is_encounter_tile(self, x, y):
        return self.get_tile(x, y) in ENCOUNTER_TILES

    def get_encounter(self):
        if not self.encounter_table:
            return None
        if random.random() < self.encounter_rate:
            return random.choice(self.encounter_table)
        return None


def create_starting_town():
    m = GameMap(20, 20, "Starter Village", encounter_rate=0.0)
    for x in range(20):
        for y in range(20):
            m.set_tile(x, y, TILE_GRASS)
    for x in range(20):
        m.set_tile(x, 0, TILE_TREE)
        m.set_tile(x, 19, TILE_TREE)
    for y in range(20):
        m.set_tile(0, y, TILE_TREE)
        m.set_tile(19, y, TILE_TREE)
    for x in range(5, 15):
        for y in range(5, 15):
            m.set_tile(x, y, TILE_PATH)
    m.set_tile(10, 10, TILE_HEAL)
    m.set_tile(11, 10, TILE_SHOP)
    m.set_tile(12, 10, TILE_SIGN)
    for x in range(7, 13):
        m.set_tile(x, 12, TILE_PATH)
    m.set_tile(10, 12, TILE_GROUND)
    m.npcs.append({"x": 10, "y": 8, "type": "professor", "name": "Prof. Sage",
                    "dialog": ["I'm Prof. Sage!", "Welcome to the world of Minimon!", "Choose your partner wisely!"],
                    "facing": "down"})
    m.npcs.append({"x": 10, "y": 11, "type": "healer", "name": "Nurse Joy",
                    "dialog": ["Welcome to the Minimon Healing Center!", "Let me heal your Minis!"],
                    "facing": "up"})
    m.npcs.append({"x": 6, "y": 8, "type": "rival_home", "name": "Rival's Mom",
                    "dialog": ["My daughter is out training.", "She'll be your rival!"],
                    "facing": "right"})
    m.npcs.append({"x": 8, "y": 8, "type": "item_giver", "name": "Kind Old Man",
                    "dialog": ["I don't battle anymore, but I have this for you!"],
                    "facing": "right", "give_item": ITEM_POTION, "give_count": 5,
                    "gave_item": False})
    m.npcs.append({"x": 13, "y": 8, "type": "giver", "name": "Wandering Sage",
                    "dialog": ["I've traveled far and wide.", "Here, take this TM!"],
                    "facing": "left", "give_item": ITEM_TM_BITE, "give_count": 1,
                    "gave_item": False})
    m.npcs.append({"x": 7, "y": 13, "type": "talker", "name": "Villager",
                    "dialog": ["This town is peaceful.", "But the routes can be dangerous!"],
                    "facing": "right"})
    m.npcs.append({"x": 13, "y": 13, "type": "talker", "name": "Fisherman",
                    "dialog": ["I love fishing!", "Have you seen the Water Minis?"]})
    m.npcs.append({"x": 12, "y": 10, "type": "talker", "name": "Sign Reader",
                    "dialog": ["Welcome to Starter Village!", "Speak to Prof. Sage to get your first Mini!"]})
    m.signs.append({"x": 12, "y": 10, "text": "Starter Village - Where dreams begin!"})
    m.doors.append({"x": 10, "y": 12, "dest_map": 1, "dest_x": 10, "dest_y": 18})
    return m


def create_route_1():
    m = GameMap(20, 20, "Route 1", encounter_rate=0.12)
    for x in range(20):
        for y in range(20):
            m.set_tile(x, y, TILE_TALL_GRASS if random.random() < 0.4 else TILE_GRASS)
    for x in range(20):
        m.set_tile(x, 0, TILE_TREE)
        m.set_tile(x, 19, TILE_TREE)
    for y in range(20):
        m.set_tile(0, y, TILE_TREE)
        m.set_tile(19, y, TILE_TREE)
    for y in range(8, 13):
        m.set_tile(10, y, TILE_PATH)
        m.set_tile(11, y, TILE_PATH)
    m.set_tile(10, 0, TILE_DOOR)
    m.doors.append({"x": 10, "y": 0, "dest_map": 0, "dest_x": 10, "dest_y": 18})
    m.set_tile(10, 19, TILE_DOOR)
    m.doors.append({"x": 10, "y": 19, "dest_map": 2, "dest_x": 10, "dest_y": 1})
    m.npcs.append({"x": 7, "y": 10, "type": "trainer", "name": "Bug Catcher Tim",
                    "dialog": ["My bugs are strong!", "Let's battle!"],
                    "facing": "right", "defeated": False,
                    "party": [(7, 3), (7, 3)]})
    m.npcs.append({"x": 14, "y": 10, "type": "trainer", "name": "Youngster Joey",
                    "dialog": ["I like shorts!", "They're comfy and easy to wear!"],
                    "facing": "left", "defeated": False,
                    "party": [(9, 4), (11, 4)]})
    m.npcs.append({"x": 10, "y": 5, "type": "rival", "name": "Rival",
                    "dialog": ["So we meet again!", "Let me see how much you've grown!"],
                    "facing": "down", "defeated": False,
                    "rival_encounter": 1, "rival_party": True})
    m.encounter_table = [(7, 3), (9, 3), (13, 3), (15, 3), (17, 3), (23, 3)]
    return m


def create_ember_town():
    m = GameMap(20, 20, "Ember Town", encounter_rate=0.0)
    for x in range(20):
        for y in range(20):
            m.set_tile(x, y, TILE_GRASS)
    for x in range(20):
        m.set_tile(x, 0, TILE_TREE)
        m.set_tile(x, 19, TILE_TREE)
    for y in range(20):
        m.set_tile(0, y, TILE_TREE)
        m.set_tile(19, y, TILE_TREE)
    for x in range(3, 17):
        for y in range(3, 17):
            m.set_tile(x, y, TILE_PATH)
    m.set_tile(10, 10, TILE_HEAL)
    m.set_tile(11, 10, TILE_SHOP)
    m.set_tile(10, 5, TILE_GYM)
    m.set_tile(10, 0, TILE_DOOR)
    m.doors.append({"x": 10, "y": 0, "dest_map": 1, "dest_x": 10, "dest_y": 18})
    m.set_tile(10, 19, TILE_DOOR)
    m.doors.append({"x": 10, "y": 19, "dest_map": 3, "dest_x": 10, "dest_y": 1})
    m.npcs.append({"x": 10, "y": 7, "type": "gym_leader", "name": "Flora",
                    "dialog": ["I am Flora, the Nature Lodge Leader!", "My plants will entangle you!"],
                    "facing": "down", "defeated": False,
                    "party": [(3, 12), (25, 11), (15, 13)],
                    "badge": "Nature Badge", "reward": 3000})
    m.npcs.append({"x": 10, "y": 11, "type": "healer", "name": "Nurse Joy",
                    "dialog": ["Welcome to the Minimon Healing Center!", "Let me heal your Minis!"],
                    "facing": "up"})
    m.npcs.append({"x": 14, "y": 7, "type": "trainer", "name": "Blaze",
                    "dialog": ["I am Blaze, the Inferno Dojo Leader!", "Feel the heat of my flames!"],
                    "facing": "down", "defeated": False,
                    "party": [(1, 14), (21, 13), (11, 15)],
                    "badge": "Inferno Badge", "reward": 4000})
    m.npcs.append({"x": 6, "y": 12, "type": "trainer", "name": "Camper Iris",
                    "dialog": ["Nature is my ally!"],
                    "facing": "right", "defeated": False,
                    "party": [(3, 10)]})
    m.npcs.append({"x": 15, "y": 5, "type": "rival", "name": "Rival",
                    "dialog": ["You got the Nature Badge?", "I'm impressed! Let's battle!"],
                    "facing": "down", "defeated": False,
                    "rival_encounter": 2, "rival_party": True})
    m.npcs.append({"x": 5, "y": 15, "type": "trainer", "name": "Team Shadow Grunt",
                    "dialog": ["Team Shadow will take over the world!"],
                    "facing": "right", "defeated": False,
                    "party": [(25, 12), (35, 11)],
                    "evil_team": True, "evil_encounter": 1})
    m.npcs.append({"x": 8, "y": 11, "type": "item_giver", "name": "TM Collector",
                    "dialog": ["I collect TMs!", "Here, have this one!"],
                    "facing": "down", "give_item": ITEM_TM_VINE_WHIP, "give_count": 1,
                    "gave_item": False})
    m.npcs.append({"x": 13, "y": 11, "type": "trade_npc", "name": "Trader Sam",
                    "dialog": ["I'll trade you a Fire Mini for your Water Mini!", "Deal?"],
                    "facing": "left",
                    "trade_want_type": TYPE_WATER, "trade_give_dex": 11, "trade_give_name": "Sparkitten",
                    "traded": False})
    m.npcs.append({"x": 7, "y": 7, "type": "talker", "name": "Old Man",
                    "dialog": ["I remember when this town was just fields.", "Now we have two gyms!"]})
    m.npcs.append({"x": 13, "y": 14, "type": "talker", "name": "Backpacker",
                    "dialog": ["I just arrived from Frost Harbor.", "The ice Minis there are beautiful!"]})
    m.signs.append({"x": 12, "y": 10, "text": "Ember Town - Gateway to adventure!"})
    return m


def create_route_2():
    m = GameMap(20, 20, "Route 2", encounter_rate=0.15)
    for x in range(20):
        for y in range(20):
            m.set_tile(x, y, TILE_TALL_GRASS if random.random() < 0.45 else TILE_GRASS)
    for x in range(20):
        m.set_tile(x, 0, TILE_TREE)
        m.set_tile(x, 19, TILE_TREE)
    for y in range(20):
        m.set_tile(0, y, TILE_TREE)
        m.set_tile(19, y, TILE_TREE)
    for y in range(8, 13):
        m.set_tile(10, y, TILE_PATH)
        m.set_tile(11, y, TILE_PATH)
    m.set_tile(10, 0, TILE_DOOR)
    m.doors.append({"x": 10, "y": 0, "dest_map": 2, "dest_x": 10, "dest_y": 18})
    m.set_tile(10, 19, TILE_DOOR)
    m.doors.append({"x": 10, "y": 19, "dest_map": 4, "dest_x": 10, "dest_y": 1})
    m.npcs.append({"x": 8, "y": 10, "type": "trainer", "name": "Ranger Hank",
                    "dialog": ["I protect the wild Minis!"],
                    "facing": "right", "defeated": False,
                    "party": [(21, 14), (22, 14)]})
    m.npcs.append({"x": 13, "y": 10, "type": "trainer", "name": "LassMaya",
                    "dialog": ["My team is ready!"],
                    "facing": "left", "defeated": False,
                    "party": [(49, 15), (13, 15)]})
    m.encounter_table = [(21, 5), (23, 5), (27, 5), (29, 5), (17, 5), (9, 5)]
    return m


def create_frost_harbor():
    m = GameMap(20, 20, "Frost Harbor", encounter_rate=0.0)
    for x in range(20):
        for y in range(20):
            m.set_tile(x, y, TILE_GRASS)
    for x in range(20):
        m.set_tile(x, 0, TILE_TREE)
        m.set_tile(x, 19, TILE_TREE)
    for y in range(20):
        m.set_tile(0, y, TILE_TREE)
        m.set_tile(19, y, TILE_TREE)
    for x in range(3, 17):
        for y in range(3, 17):
            m.set_tile(x, y, TILE_PATH)
    m.set_tile(10, 10, TILE_HEAL)
    m.set_tile(11, 10, TILE_SHOP)
    m.set_tile(10, 5, TILE_GYM)
    m.set_tile(10, 0, TILE_DOOR)
    m.doors.append({"x": 10, "y": 0, "dest_map": 3, "dest_x": 10, "dest_y": 18})
    m.npcs.append({"x": 10, "y": 7, "type": "gym_leader", "name": "Glacia",
                    "dialog": ["I am Glacia, the Tidal Temple Leader!", "Feel the power of the ocean!"],
                    "facing": "down", "defeated": False,
                    "party": [(22, 18), (32, 17), (42, 19)],
                    "badge": "Tidal Badge", "reward": 5000})
    m.npcs.append({"x": 10, "y": 11, "type": "healer", "name": "Nurse Joy",
                    "dialog": ["Welcome to the Minimon Healing Center!", "Let me heal your Minis!"],
                    "facing": "up"})
    m.npcs.append({"x": 6, "y": 12, "type": "trainer", "name": "Sailor Drake",
                    "dialog": ["The sea is my home!"],
                    "facing": "right", "defeated": False,
                    "party": [(31, 16), (5, 16)]})
    m.npcs.append({"x": 15, "y": 15, "type": "trainer", "name": "Team Shadow Elite",
                    "dialog": ["Team Shadow's power grows!"],
                    "facing": "up", "defeated": False,
                    "party": [(25, 20), (35, 19), (45, 18)],
                    "evil_team": True, "evil_encounter": 2})
    m.npcs.append({"x": 8, "y": 10, "type": "item_giver", "name": "Fisher",
                    "dialog": ["Caught something special today!", "You can have it!"],
                    "facing": "down", "give_item": ITEM_TM_WATER_GUN, "give_count": 1,
                    "gave_item": False})
    m.npcs.append({"x": 14, "y": 8, "type": "trade_npc", "name": "Trader Marina",
                    "dialog": ["I'll trade you an Ice Mini for your Fire Mini!", "Deal?"],
                    "facing": "left",
                    "trade_want_type": TYPE_FIRE, "trade_give_dex": 32, "trade_give_name": "Glacialynx",
                    "traded": False})
    m.npcs.append({"x": 7, "y": 7, "type": "talker", "name": "Sailor",
                    "dialog": ["The harbor is beautiful at sunset.", "Watch out for storms on Route 2!"]})
    m.npcs.append({"x": 13, "y": 14, "type": "talker", "name": "Ice Fisher",
                    "dialog": ["I fish through the ice!", "Sometimes I catch Glowfin evolve forms!"]})
    m.signs.append({"x": 12, "y": 10, "text": "Frost Harbor - Where ice meets sea!"})
    m.doors.append({"x": 10, "y": 19, "dest_map": 5, "dest_x": 10, "dest_y": 1})
    return m


def create_storm_spire():
    m = GameMap(20, 20, "Storm Spire", encounter_rate=0.0)
    for x in range(20):
        for y in range(20):
            m.set_tile(x, y, TILE_ROCK)
    for x in range(5, 15):
        for y in range(5, 15):
            m.set_tile(x, y, TILE_PATH)
    m.set_tile(10, 10, TILE_HEAL)
    m.set_tile(10, 5, TILE_GYM)
    m.set_tile(10, 0, TILE_DOOR)
    m.doors.append({"x": 10, "y": 0, "dest_map": 5, "dest_x": 10, "dest_y": 18})
    m.npcs.append({"x": 10, "y": 7, "type": "gym_leader", "name": "Volt",
                    "dialog": ["I am Volt, Storm Spire Leader!", "Feel the power of lightning!"],
                    "facing": "down", "defeated": False,
                    "party": [(23, 24), (33, 22)],
                    "badge": "Storm Badge", "reward": 6000})
    m.npcs.append({"x": 10, "y": 11, "type": "healer", "name": "Nurse Joy",
                    "dialog": ["Welcome to the Minimon Healing Center!", "Let me heal your Minis!"],
                    "facing": "up"})
    m.npcs.append({"x": 6, "y": 10, "type": "trainer", "name": "Sparky",
                    "dialog": ["My Electric moves are shocking!"],
                    "facing": "right", "defeated": False,
                    "party": [(23, 20), (33, 19)]})
    m.npcs.append({"x": 14, "y": 10, "type": "item_giver", "name": "Electric Engineer",
                    "dialog": ["I study lightning!", "Here, take this TM!"],
                    "facing": "left", "give_item": ITEM_TM_THUNDERSHOCK, "give_count": 1,
                    "gave_item": False})
    m.npcs.append({"x": 8, "y": 8, "type": "talker", "name": "Climber",
                    "dialog": ["The view from the top is incredible!", "But be careful of falling rocks!"]})
    m.npcs.append({"x": 13, "y": 13, "type": "talker", "name": "Storm Chaser",
                    "dialog": ["I study storms!", "The Electric Minis here love the thunder!"]})
    m.signs.append({"x": 12, "y": 10, "text": "Storm Spire - Where thunder rules!"})
    m.doors.append({"x": 10, "y": 19, "dest_map": 6, "dest_x": 10, "dest_y": 1})
    return m


def create_crystal_cavern():
    m = GameMap(20, 20, "Crystal Cavern", encounter_rate=0.0)
    for x in range(20):
        for y in range(20):
            m.set_tile(x, y, TILE_ROCK)
    for x in range(4, 16):
        for y in range(4, 16):
            m.set_tile(x, y, TILE_PATH)
    m.set_tile(10, 10, TILE_HEAL)
    m.set_tile(10, 5, TILE_GYM)
    m.set_tile(10, 0, TILE_DOOR)
    m.doors.append({"x": 10, "y": 0, "dest_map": 6, "dest_x": 10, "dest_y": 18})
    m.npcs.append({"x": 10, "y": 7, "type": "gym_leader", "name": "Glacius",
                    "dialog": ["I am Glacius, Crystal Cavern Leader!", "Feel the chill of eternity!"],
                    "facing": "down", "defeated": False,
                    "party": [(24, 28), (34, 26)],
                    "badge": "Crystal Badge", "reward": 7000})
    m.npcs.append({"x": 10, "y": 11, "type": "healer", "name": "Nurse Joy",
                    "dialog": ["Welcome to the Minimon Healing Center!", "Let me heal your Minis!"],
                    "facing": "up"})
    m.npcs.append({"x": 6, "y": 10, "type": "trainer", "name": "Frosty",
                    "dialog": ["My Ice moves are freezing!"],
                    "facing": "right", "defeated": False,
                    "party": [(24, 24), (34, 23)]})
    m.npcs.append({"x": 14, "y": 8, "type": "item_giver", "name": "Gem Collector",
                    "dialog": ["These crystals are mesmerizing!", "Take this TM as a souvenir!"],
                    "facing": "down", "give_item": ITEM_TM_ICE_SHARD, "give_count": 1,
                    "gave_item": False})
    m.npcs.append({"x": 14, "y": 12, "type": "trade_npc", "name": "Trader Frost",
                    "dialog": ["I'll trade you a Dragon Mini for your Earth Mini!", "Deal?"],
                    "facing": "left",
                    "trade_want_type": TYPE_EARTH, "trade_give_dex": 63, "trade_give_name": "Crysdrake",
                    "traded": False})
    m.npcs.append({"x": 8, "y": 8, "type": "talker", "name": "Geologist",
                    "dialog": ["The crystals here are millions of years old!", "Each one holds ancient power!"]})
    m.signs.append({"x": 12, "y": 10, "text": "Crystal Cavern - Where ice crystal forms!"})
    m.doors.append({"x": 10, "y": 19, "dest_map": 7, "dest_x": 10, "dest_y": 1})
    return m


def create_shadow_gate():
    m = GameMap(20, 20, "Shadow Gate", encounter_rate=0.0)
    for x in range(20):
        for y in range(20):
            m.set_tile(x, y, TILE_ROCK)
    for x in range(4, 16):
        for y in range(4, 16):
            m.set_tile(x, y, TILE_PATH)
    m.set_tile(10, 10, TILE_HEAL)
    m.set_tile(10, 5, TILE_GYM)
    m.set_tile(10, 0, TILE_DOOR)
    m.doors.append({"x": 10, "y": 0, "dest_map": 7, "dest_x": 10, "dest_y": 18})
    m.npcs.append({"x": 10, "y": 7, "type": "gym_leader", "name": "Nyx",
                    "dialog": ["I am Nyx, Shadow Gate Leader!", "Embrace the darkness!"],
                    "facing": "down", "defeated": False,
                    "party": [(25, 32), (35, 30)],
                    "badge": "Shadow Badge", "reward": 8000})
    m.npcs.append({"x": 10, "y": 11, "type": "healer", "name": "Nurse Joy",
                    "dialog": ["Welcome to the Minimon Healing Center!", "Let me heal your Minis!"],
                    "facing": "up"})
    m.npcs.append({"x": 15, "y": 15, "type": "trainer", "name": "Team Shadow Boss",
                    "dialog": ["I am the Boss of Team Shadow!", "You dare challenge me?"],
                    "facing": "up", "defeated": False,
                    "party": [(25, 35), (35, 34), (45, 33), (55, 32)],
                    "evil_team": True, "evil_encounter": 3})
    m.npcs.append({"x": 8, "y": 8, "type": "item_giver", "name": "Shadow Researcher",
                    "dialog": ["I study the dark energy here.", "Take this TM for protection!"],
                    "facing": "down", "give_item": ITEM_TM_SHADOW_BALL, "give_count": 1,
                    "gave_item": False})
    m.npcs.append({"x": 14, "y": 10, "type": "talker", "name": "Dark Walker",
                    "dialog": ["The shadows here are alive.", "Be careful where you step!"]})
    m.npcs.append({"x": 8, "y": 14, "type": "talker", "name": "Former Grunt",
                    "dialog": ["I left Team Shadow.", "They're more dangerous than you think!"]})
    m.signs.append({"x": 12, "y": 10, "text": "Shadow Gate - Where darkness dwells!"})
    m.doors.append({"x": 10, "y": 19, "dest_map": 8, "dest_x": 10, "dest_y": 1})
    return m


def create_solar_sanctum():
    m = GameMap(20, 20, "Solar Sanctum", encounter_rate=0.0)
    for x in range(20):
        for y in range(20):
            m.set_tile(x, y, TILE_GRASS)
    for x in range(3, 17):
        for y in range(3, 17):
            m.set_tile(x, y, TILE_PATH)
    m.set_tile(10, 10, TILE_HEAL)
    m.set_tile(10, 5, TILE_GYM)
    m.set_tile(10, 0, TILE_DOOR)
    m.doors.append({"x": 10, "y": 0, "dest_map": 8, "dest_x": 10, "dest_y": 18})
    m.npcs.append({"x": 10, "y": 7, "type": "gym_leader", "name": "Lux",
                    "dialog": ["I am Lux, Solar Sanctum Leader!", "Behold the light of dawn!"],
                    "facing": "down", "defeated": False,
                    "party": [(26, 36), (36, 34)],
                    "badge": "Solar Badge", "reward": 9000})
    m.npcs.append({"x": 10, "y": 11, "type": "healer", "name": "Nurse Joy",
                    "dialog": ["Welcome to the Minimon Healing Center!", "Let me heal your Minis!"],
                    "facing": "up"})
    m.npcs.append({"x": 6, "y": 10, "type": "trainer", "name": "Dawn",
                    "dialog": ["My Light moves shine bright!"],
                    "facing": "right", "defeated": False,
                    "party": [(26, 32), (36, 31)]})
    m.npcs.append({"x": 14, "y": 8, "type": "item_giver", "name": "Light Keeper",
                    "dialog": ["The light guides us all!", "Take this TM!"],
                    "facing": "down", "give_item": ITEM_TM_DAZZLING_GLEAM, "give_count": 1,
                    "gave_item": False})
    m.npcs.append({"x": 14, "y": 13, "type": "trade_npc", "name": "Trader Lux",
                    "dialog": ["I'll trade you a Spirit Mini for your Wind Mini!", "Deal?"],
                    "facing": "left",
                    "trade_want_type": TYPE_WIND, "trade_give_dex": 46, "trade_give_name": "Lumisoul",
                    "traded": False})
    m.npcs.append({"x": 8, "y": 8, "type": "talker", "name": "Sun Priest",
                    "dialog": ["The sun charges our Minis.", "Light Minis thrive here!"]})
    m.signs.append({"x": 12, "y": 10, "text": "Solar Sanctum - Where light is born!"})
    m.doors.append({"x": 10, "y": 19, "dest_map": 9, "dest_x": 10, "dest_y": 1})
    return m


def create_grand_colosseum():
    m = GameMap(20, 20, "Grand Colosseum", encounter_rate=0.0)
    for x in range(20):
        for y in range(20):
            m.set_tile(x, y, TILE_ROCK)
    for x in range(3, 17):
        for y in range(3, 17):
            m.set_tile(x, y, TILE_PATH)
    m.set_tile(10, 10, TILE_HEAL)
    m.set_tile(10, 5, TILE_GYM)
    m.set_tile(10, 0, TILE_DOOR)
    m.doors.append({"x": 10, "y": 0, "dest_map": 9, "dest_x": 10, "dest_y": 18})
    m.npcs.append({"x": 10, "y": 7, "type": "gym_leader", "name": "Drakon",
                    "dialog": ["I am Drakon, Grand Colosseum Leader!", "Witness the might of dragons!"],
                    "facing": "down", "defeated": False,
                    "party": [(27, 40), (37, 38)],
                    "badge": "Dragon Badge", "reward": 10000})
    m.npcs.append({"x": 10, "y": 11, "type": "healer", "name": "Nurse Joy",
                    "dialog": ["Welcome to the Minimon Healing Center!", "Let me heal your Minis!"],
                    "facing": "up"})
    m.npcs.append({"x": 6, "y": 10, "type": "trainer", "name": "Wyvern",
                    "dialog": ["My Dragon moves are fierce!"],
                    "facing": "right", "defeated": False,
                    "party": [(27, 36), (37, 35)]})
    m.npcs.append({"x": 14, "y": 8, "type": "item_giver", "name": "Dragon Master",
                    "dialog": ["Only the worthy carry this TM!"],
                    "facing": "down", "give_item": ITEM_TM_DRAGON_CLAW, "give_count": 1,
                    "gave_item": False})
    m.npcs.append({"x": 8, "y": 8, "type": "talker", "name": "Arena Spectator",
                    "dialog": ["This colosseum has hosted battles for centuries!", "May the best trainer win!"]})
    m.npcs.append({"x": 13, "y": 14, "type": "talker", "name": "Dragon Breeder",
                    "dialog": ["I raise dragons here.", "They respond to a strong bond!"]})
    m.signs.append({"x": 12, "y": 10, "text": "Grand Colosseum - Where legends clash!"})
    m.doors.append({"x": 10, "y": 19, "dest_map": 10, "dest_x": 10, "dest_y": 1})
    return m


def create_elite4_hall():
    m = GameMap(20, 20, "Elite Four Hall", encounter_rate=0.0)
    for x in range(20):
        for y in range(20):
            m.set_tile(x, y, TILE_ROCK)
    for x in range(3, 17):
        for y in range(3, 17):
            m.set_tile(x, y, TILE_PATH)
    m.set_tile(10, 10, TILE_HEAL)
    m.npcs.append({"x": 10, "y": 11, "type": "healer", "name": "Nurse Joy",
                    "dialog": ["Welcome to the Elite Four Healing Center!", "Let me heal your Minis for the challenges ahead!"],
                    "facing": "up"})
    m.npcs.append({"x": 10, "y": 5, "type": "trainer", "name": "Elite Aria",
                    "dialog": ["I am Aria of the Elite Four!", "My melodies shall console you!"],
                    "facing": "down", "defeated": False,
                    "party": [(44, 44), (54, 43), (64, 42)],
                    "reward": 12000})
    m.npcs.append({"x": 5, "y": 10, "type": "trainer", "name": "Elite Terra",
                    "dialog": ["I am Terra of the Elite Four!", "The earth trembles before me!"],
                    "facing": "right", "defeated": False,
                    "party": [(45, 46), (55, 45), (65, 44)],
                    "reward": 12000})
    m.npcs.append({"x": 15, "y": 10, "type": "trainer", "name": "Elite Umbra",
                    "dialog": ["I am Umbra of the Elite Four!", "Shadow and nightmare!"],
                    "facing": "left", "defeated": False,
                    "party": [(46, 48), (56, 47), (66, 46)],
                    "reward": 12000})
    m.npcs.append({"x": 10, "y": 15, "type": "trainer", "name": "Elite Sol",
                    "dialog": ["I am Sol of the Elite Four!", "Radiance purifies all!"],
                    "facing": "up", "defeated": False,
                    "party": [(47, 50), (57, 49), (67, 48)],
                    "reward": 12000})
    m.signs.append({"x": 12, "y": 10, "text": "Elite Four Hall - Only the worthy may pass!"})
    m.doors.append({"x": 10, "y": 19, "dest_map": 10, "dest_x": 10, "dest_y": 1})
    return m


def create_champion_arena():
    m = GameMap(20, 20, "Champion Arena", encounter_rate=0.0)
    for x in range(20):
        for y in range(20):
            m.set_tile(x, y, TILE_ROCK)
    for x in range(4, 16):
        for y in range(4, 16):
            m.set_tile(x, y, TILE_PATH)
    m.set_tile(10, 12, TILE_HEAL)
    m.npcs.append({"x": 10, "y": 13, "type": "healer", "name": "Nurse Joy",
                    "dialog": ["Welcome to the Champion Arena Healing Center!", "Heal up before the final battle!"],
                    "facing": "up"})
    m.npcs.append({"x": 10, "y": 8, "type": "trainer", "name": "Champion Zenith",
                    "dialog": ["I am Zenith, the Champion!", "You have journeyed far. Let us see if you are truly worthy!"],
                    "facing": "down", "defeated": False,
                    "party": [(48, 55), (58, 54), (68, 53), (78, 52), (1, 50), (21, 50)],
                    "reward": 50000})
    m.signs.append({"x": 12, "y": 10, "text": "Champion Arena - The Final Battle!"})
    return m


ALL_MAPS = [
    create_starting_town, create_route_1, create_ember_town, create_route_2,
    create_frost_harbor, create_storm_spire, create_crystal_cavern,
    create_shadow_gate, create_solar_sanctum, create_grand_colosseum,
    create_elite4_hall, create_champion_arena
]
MAP_COUNT = len(ALL_MAPS)
