from .config import *


class PlayerState:
    def __init__(self):
        self.x = 10
        self.y = 10
        self.facing = "down"
        self.name = "Hero"
        self.party = []
        self.inventory = {
            ITEM_POTION: 3,
            ITEM_SPHERE: 10,
            ITEM_GREAT_SPHERE: 0,
            ITEM_ULTRA_SPHERE: 0,
            ITEM_MASTER_SPHERE: 0,
            ITEM_FULL_HEAL: 0,
            ITEM_REVIVE: 0,
            ITEM_X_ATTACK: 0,
            ITEM_X_DEFENSE: 0,
        }
        self.money = 3000
        self.badges = []
        self.current_map = 0
        self.story_flags = {}
        self.rival_name = "Luna"
        self.rival_starter = None
        self.starter_choice = None
        self.step_counter = 0
        self.play_time = 0

    def has_item(self, item_name):
        return self.inventory.get(item_name, 0) > 0

    def add_item(self, item_name, count=1):
        self.inventory[item_name] = self.inventory.get(item_name, 0) + count

    def remove_item(self, item_name, count=1):
        if self.inventory.get(item_name, 0) >= count:
            self.inventory[item_name] -= count
            return True
        return False

    def add_creature(self, creature):
        if len(self.party) < 6:
            self.party.append(creature)
            return True
        return False

    def get_alive_party(self):
        return [c for c in self.party if c.is_alive()]

    def has_potion(self):
        return self.has_item(ITEM_POTION) or self.has_item(ITEM_SUPER_POTION) or self.has_item(ITEM_HYPER_POTION)

    def use_potion(self, creature):
        if self.has_item(ITEM_HYPER_POTION):
            self.remove_item(ITEM_HYPER_POTION)
            creature.heal(200)
            return "Hyper Potion", 200
        elif self.has_item(ITEM_SUPER_POTION):
            self.remove_item(ITEM_SUPER_POTION)
            creature.heal(60)
            return "Super Potion", 60
        elif self.has_item(ITEM_POTION):
            self.remove_item(ITEM_POTION)
            creature.heal(20)
            return "Potion", 20
        return None, 0

    def use_revive(self):
        for item in [ITEM_FULL_REVIVE, ITEM_REVIVE]:
            if self.has_item(item):
                self.remove_item(item)
                return item
        return None

    def has_sphere(self):
        return (self.has_item(ITEM_SPHERE) or self.has_item(ITEM_GREAT_SPHERE) or
                self.has_item(ITEM_ULTRA_SPHERE) or self.has_item(ITEM_MASTER_SPHERE))

    def get_best_sphere(self):
        if self.has_item(ITEM_MASTER_SPHERE):
            return ITEM_MASTER_SPHERE, SPHERE_MASTER
        elif self.has_item(ITEM_ULTRA_SPHERE):
            return ITEM_ULTRA_SPHERE, SPHERE_ULTRA
        elif self.has_item(ITEM_GREAT_SPHERE):
            return ITEM_GREAT_SPHERE, SPHERE_GREAT
        elif self.has_item(ITEM_SPHERE):
            return ITEM_SPHERE, SPHERE_NORMAL
        return None, 0
