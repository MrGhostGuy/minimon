import pygame
import sys
import math
import random
from .config import *
from .creatures import CREATURE_DB
from .moves import get_move
from .battle import *
from .world import ALL_MAPS, MAP_COUNT, TOWN_NAMES, GYM_NAMES
from .player import PlayerState
from .renderer import Renderer


STATE_TITLE = "title"
STATE_INTRO = "intro"
STATE_OW = "overworld"
STATE_BATTLE = "battle"
STATE_MENU = "menu"
STATE_PARTY = "party"
STATE_BAG = "bag"
STATE_MOVES = "moves"
STATE_DIALOG = "dialog"
STATE_EVOLUTION = "evolution"
STATE_SHOP = "shop"
STATE_GAME_OVER = "gameover"
STATE_VICTORY = "victory"


class Game:
    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("Minimon - R1 Edition")
        self.clock = pygame.time.Clock()
        self.renderer = Renderer(self.screen)
        self.player = PlayerState()
        self.current_map = None
        self.state = STATE_TITLE
        self.time_offset = 0
        self.running = True
        self.cursor = 0
        self.submenu = None
        self.dialog_queue = []
        self.dialog_current = ""
        self.dialog_speaker = ""
        self.pending_evolution = None
        self.battle_state = None
        self.battle_anim_timer = 0
        self.battle_phase = "select"
        self.shop_items = [ITEM_POTION, ITEM_SUPER_POTION, ITEM_HYPER_POTION,
                          ITEM_FULL_HEAL, ITEM_SPHERE, ITEM_GREAT_SPHERE,
                          ITEM_ULTRA_SPHERE, ITEM_REVIVE, ITEM_X_ATTACK, ITEM_X_DEFENSE,
                          ITEM_TM_EMBER, ITEM_TM_WATER_GUN, ITEM_TM_VINE_WHIP,
                          ITEM_TM_THUNDERSHOCK, ITEM_TM_ICE_SHARD, ITEM_TM_BITE,
                          ITEM_TM_SHADOW_BALL, ITEM_TM_DRAGON_CLAW, ITEM_TM_STONE_EDGE,
                          ITEM_TM_AIR_SLASH, ITEM_TM_DAZZLING_GLEAM, ITEM_TM_FLAMETHROWER,
                          ITEM_TM_HYDRO_PUMP, ITEM_TM_SOLAR_BEAM, ITEM_TM_THUNDERBOLT,
                          ITEM_TM_BLIZZARD, ITEM_TM_EARTHQUAKE, ITEM_TM_CRUNCH,
                          ITEM_TM_RECOVER, ITEM_TM_SWORDS_DANCE]
        self.shop_cursor = 0
        self.rival_defeated_count = 0
        self.step_delay = 0
        self.scroll_cooldown = 0

    def run(self):
        while self.running:
            dt = min(self.clock.tick(FPS) / 1000.0, 0.1)
            self.time_offset += dt
            self.scroll_cooldown = max(0, self.scroll_cooldown - dt)
            self._handle_events()
            self._update(dt)
            self._render()
            pygame.display.flip()
        pygame.quit()
        sys.exit()

    def _handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            elif event.type == pygame.KEYDOWN:
                self._on_key(event.key)
            elif event.type == pygame.MOUSEWHEEL:
                if self.scroll_cooldown <= 0:
                    self._on_scroll(event.y)
                    self.scroll_cooldown = 0.15
            elif event.type == pygame.MOUSEBUTTONDOWN:
                self._on_click(event.button)

    def _on_key(self, key):
        if self.state == STATE_TITLE:
            if key in (pygame.K_RETURN, pygame.K_SPACE):
                self.state = STATE_INTRO
                self.intro_step = 0
        elif self.state == STATE_INTRO:
            self._advance_intro()
        elif self.state == STATE_OW:
            self._handle_ow_key(key)
        elif self.state == STATE_BATTLE:
            self._handle_battle_key(key)
        elif self.state == STATE_MENU:
            self._handle_menu_key(key)
        elif self.state == STATE_PARTY:
            self._handle_party_key(key)
        elif self.state == STATE_BAG:
            self._handle_bag_key(key)
        elif self.state == STATE_MOVES:
            self._handle_moves_key(key)
        elif self.state == STATE_DIALOG:
            self._advance_dialog()
        elif self.state == STATE_SHOP:
            self._handle_shop_key(key)
        elif self.state == STATE_EVOLUTION:
            pass
        elif self.state == STATE_GAME_OVER:
            if key == pygame.K_RETURN:
                self.__init__()
                self.state = STATE_TITLE

    def _on_scroll(self, direction):
        if self.state == STATE_TITLE:
            self.state = STATE_INTRO
            self.intro_step = 0
        elif self.state == STATE_INTRO:
            self._advance_intro()
        elif self.state == STATE_OW:
            pass
        elif self.state == STATE_BATTLE:
            self._handle_battle_scroll(direction)
        elif self.state == STATE_MENU:
            self.cursor = max(0, min(4, self.cursor + direction))
        elif self.state == STATE_PARTY:
            self._handle_party_scroll(direction)
        elif self.state == STATE_BAG:
            self._handle_bag_scroll(direction)
        elif self.state == STATE_MOVES:
            self._handle_moves_scroll(direction)
        elif self.state == STATE_DIALOG:
            self._advance_dialog()
        elif self.state == STATE_SHOP:
            self.shop_cursor = max(0, min(len(self.shop_items) - 1, self.shop_cursor + direction))

    def _on_click(self, button):
        if self.state == STATE_TITLE:
            self.state = STATE_INTRO
            self.intro_step = 0
        elif self.state == STATE_INTRO:
            self._advance_intro()
        elif self.state == STATE_OW:
            self._interact()
        elif self.state == STATE_BATTLE:
            if button == 1:
                self._handle_battle_confirm()
            elif button == 3:
                self._handle_battle_back()
        elif self.state == STATE_MENU:
            self._select_menu()
        elif self.state == STATE_PARTY:
            if button == 1:
                self._select_party()
        elif self.state == STATE_BAG:
            if button == 1:
                self._use_item()
        elif self.state == STATE_MOVES:
            if button == 1:
                self._select_move()
        elif self.state == STATE_DIALOG:
            self._advance_dialog()
        elif self.state == STATE_SHOP:
            if button == 1:
                self._buy_item()
            elif button == 3:
                self.state = STATE_OW

    def _advance_intro(self):
        self.intro_step += 1
        if self.intro_step == 1:
            self.dialog_queue = ["Welcome to the world of Minimon!",
                                "You are about to embark on an adventure!",
                                "Your neighbor Luna has also just received a partner.",
                                "Choose wisely - your partner will grow with you!"]
            self.state = STATE_DIALOG
            self._next_dialog()
            self._give_starter()
        elif self.intro_step >= 2:
            self.state = STATE_OW

    def _give_starter(self):
        starter_choices = [1, 3, 2]
        names = [CREATURE_DB[d].name for d in starter_choices]
        self.dialog_queue = [f"Choose your partner: {names[0]}, {names[1]}, or {names[2]}"]
        self.pending_starter = starter_choices
        self.state = "choose_starter"
        self.cursor = 0

    def _handle_ow_key(self, key):
        if key == pygame.K_m:
            self.state = STATE_MENU
            self.cursor = 0
        elif key in (pygame.K_UP, pygame.K_w):
            self._move_player(0, -1, "up")
        elif key in (pygame.K_DOWN, pygame.K_s):
            self._move_player(0, 1, "down")
        elif key in (pygame.K_LEFT, pygame.K_a):
            self._move_player(-1, 0, "left")
        elif key in (pygame.K_RIGHT, pygame.K_d):
            self._move_player(1, 0, "right")
        elif key in (pygame.K_RETURN, pygame.K_SPACE):
            self._interact()

    def _move_player(self, dx, dy, facing):
        self.player.facing = facing
        nx = self.player.x + dx
        ny = self.player.y + dy
        if self.current_map and self.current_map.is_walkable(nx, ny):
            self.player.x = nx
            self.player.y = ny
            self.player.step_counter += 1
            tile = self.current_map.get_tile(nx, ny)
            if tile == TILE_DOOR:
                for door in self.current_map.doors:
                    if door["x"] == nx and door["y"] == ny:
                        self._change_map(door["dest_map"], door["dest_x"], door["dest_y"])
                        return
            if tile == TILE_HEAL:
                self._heal_party()
            if self.current_map.is_encounter_tile(nx, ny):
                encounter = self.current_map.get_encounter()
                if encounter:
                    self._start_wild_battle(encounter[0], encounter[1])

    def _change_map(self, map_idx, x, y):
        if 0 <= map_idx < MAP_COUNT:
            self.current_map = ALL_MAPS[map_idx]()
            self.player.current_map = map_idx
            self.player.x = x
            self.player.y = y

    def _heal_party(self):
        for c in self.player.party:
            c.hp = c.max_hp
            c.status = None
            c.confusion_turns = 0
        self.dialog_queue = ["Your team has been fully healed!"]
        self.state = STATE_DIALOG
        self._next_dialog()

    def _execute_trade(self, npc):
        want_type = npc.get("trade_want_type")
        give_dex = npc.get("trade_give_dex")
        give_name = npc.get("trade_give_name")
        for i, c in enumerate(self.player.party):
            if want_type in c.types:
                old_name = c.name
                from .creatures import BattleCreature as BC
                new_mini = BC(give_dex, c.level)
                self.player.party[i] = new_mini
                npc["traded"] = True
                self.dialog_queue = [f"Traded {old_name} for {give_name}!"]
                self.state = STATE_DIALOG
                self._next_dialog()
                return
        self.dialog_queue = [f"You don't have a {want_type} type Mini to trade!"]
        self.state = STATE_DIALOG
        self._next_dialog()

    def _use_tm(self, item_name):
        tm_move = TM_MOVES.get(item_name)
        compat_types = TM_COMPAT.get(item_name, [])
        if not tm_move or not compat_types:
            self.dialog_queue = ["This TM is invalid!"]
            self.state = STATE_DIALOG
            self._next_dialog()
            return
        compatible = [c for c in self.player.party if any(t in compat_types for t in c.types)]
        if not compatible:
            self.dialog_queue = ["No Minis in your party can learn this move!"]
            self.state = STATE_DIALOG
            self._next_dialog()
            return
        self.pending_tm = item_name
        self.pending_tm_compatible = compatible
        self.dialog_queue = [f"Which Mini should learn {tm_move}?"]
        for c in compatible:
            self.dialog_queue.append(f"- {c.name} (Lv.{c.level})")
        self.state = STATE_DIALOG
        self._next_dialog()

    def _interact(self):
        if not self.current_map:
            return
        fx, fy = self.player.x, self.player.y
        if self.player.facing == "up": fy -= 1
        elif self.player.facing == "down": fy += 1
        elif self.player.facing == "left": fx -= 1
        elif self.player.facing == "right": fx += 1

        for npc in self.current_map.npcs:
            if npc["x"] == fx and npc["y"] == fy:
                self._interact_npc(npc)
                return
        for sign in self.current_map.signs:
            if sign["x"] == fx and sign["y"] == fy:
                self.dialog_queue = [sign["text"]]
                self.state = STATE_DIALOG
                self._next_dialog()
                return
        tile = self.current_map.get_tile(fx, fy)
        if tile == TILE_GYM:
            for npc in self.current_map.npcs:
                if npc["type"] == "gym_leader" and not npc.get("defeated", False):
                    self._start_gym_battle(npc)
                    return
        if tile == TILE_SHOP:
            self.state = STATE_SHOP
            self.shop_cursor = 0
            return
        if tile == TILE_HEAL:
            for npc in self.current_map.npcs:
                if npc["type"] == "healer":
                    self._interact_npc(npc)
                    return

    def _interact_npc(self, npc):
        if npc["type"] == "trainer" and not npc.get("defeated", False):
            self.dialog_queue = list(npc["dialog"])
            self.state = STATE_DIALOG
            self._next_dialog()
            self.pending_trainer_battle = npc
            return
        if npc["type"] == "rival" and not npc.get("defeated", False):
            self.dialog_queue = list(npc["dialog"])
            self.state = STATE_DIALOG
            self._next_dialog()
            self.pending_trainer_battle = npc
            return
        if npc["type"] == "gym_leader" and not npc.get("defeated", False):
            self.dialog_queue = list(npc["dialog"])
            self.state = STATE_DIALOG
            self._next_dialog()
            self.pending_gym_battle = npc
            return
        if npc["type"] == "professor":
            self.dialog_queue = list(npc["dialog"])
            self.state = STATE_DIALOG
            self._next_dialog()
            return
        if npc["type"] == "healer":
            self.dialog_queue = list(npc.get("dialog", ["Let me heal your Minis!"]))
            self.pending_healer = True
            self.state = STATE_DIALOG
            self._next_dialog()
            return
        if npc["type"] == "item_giver":
            if npc.get("gave_item", False):
                self.dialog_queue = [f"Thanks for taking the {npc['give_item']}!"]
                self.state = STATE_DIALOG
                self._next_dialog()
                return
            self.dialog_queue = list(npc.get("dialog", ["I have something for you!"]))
            give_item = npc.get("give_item")
            give_count = npc.get("give_count", 1)
            if give_item:
                self.player.add_item(give_item, give_count)
                npc["gave_item"] = True
                self.dialog_queue.append(f"Received {give_item} x{give_count}!")
            self.state = STATE_DIALOG
            self._next_dialog()
            return
        if npc["type"] == "trade_npc":
            if npc.get("traded", False):
                self.dialog_queue = ["Thanks for the trade!"]
                self.state = STATE_DIALOG
                self._next_dialog()
                return
            want_type = npc.get("trade_want_type")
            have_trade = False
            for c in self.player.party:
                if want_type in c.types:
                    have_trade = True
                    break
            if have_trade:
                self.dialog_queue = list(npc.get("dialog", ["Want to trade?"]))
                self.pending_trade = npc
            else:
                self.dialog_queue = [f"I'm looking for a {want_type} type Mini to trade!"]
            self.state = STATE_DIALOG
            self._next_dialog()
            return
        self.dialog_queue = list(npc.get("dialog", ["..."]))
        self.state = STATE_DIALOG
        self._next_dialog()

    def _start_wild_battle(self, dex, level):
        wild = BattleCreature(dex, level, is_wild=True)
        if not self.player.get_alive_party():
            self.state = STATE_GAME_OVER
            return
        self.battle_state = BattleState(self.player.get_alive_party(), [wild],
                                       is_trainer=False, can_escape=True, can_catch=True)
        self.state = STATE_BATTLE
        self.battle_phase = "menu"
        self.cursor = 0
        self.battle_state.message = f"A wild {wild.name} appeared!"

    def _start_trainer_battle(self, npc):
        party = [BattleCreature(d, l) for d, l in npc["party"]]
        if not self.player.get_alive_party():
            self.state = STATE_GAME_OVER
            return
        self.battle_state = BattleState(self.player.get_alive_party(), party,
                                       is_trainer=True, trainer_name=npc["name"],
                                       can_escape=False, can_catch=False)
        self.state = STATE_BATTLE
        self.battle_phase = "menu"
        self.cursor = 0
        self.battle_state.message = f"{npc['name']} wants to battle!"

    def _start_rival_battle(self, npc):
        starter_choice = self.player.starter_choice
        rival_choice = self.player.rival_starter
        level = 14 if npc.get("rival_encounter") == 1 else 20
        party = [BattleCreature(rival_choice, level)]
        if not self.player.get_alive_party():
            self.state = STATE_GAME_OVER
            return
        self.battle_state = BattleState(self.player.get_alive_party(), party,
                                       is_trainer=True, trainer_name=npc["name"],
                                       can_escape=False, can_catch=False)
        self.state = STATE_BATTLE
        self.battle_phase = "menu"
        self.cursor = 0
        self.battle_state.message = f"Rival {npc['name']} wants to battle!"

    def _start_gym_battle(self, npc):
        party = [BattleCreature(d, l) for d, l in npc["party"]]
        if not self.player.get_alive_party():
            self.state = STATE_GAME_OVER
            return
        self.battle_state = BattleState(self.player.get_alive_party(), party,
                                       is_trainer=True, trainer_name=npc["name"],
                                       can_escape=False, can_catch=False)
        self.state = STATE_BATTLE
        self.battle_phase = "menu"
        self.cursor = 0
        self.battle_state.message = f"Gym Leader {npc['name']} wants to battle!"

    def _handle_battle_key(self, key):
        if self.battle_phase == "message":
            self._next_battle_message()
        elif self.battle_phase == "select":
            if key in (pygame.K_RETURN, pygame.K_SPACE):
                self._select_battle_action()
        elif self.battle_phase == "moves":
            if key == pygame.K_ESCAPE:
                self.battle_phase = "menu"
                self.cursor = 0
        elif self.battle_phase == "party":
            if key == pygame.K_ESCAPE:
                self.battle_phase = "menu"
                self.cursor = 0
        elif self.battle_phase == "bag":
            if key == pygame.K_ESCAPE:
                self.battle_phase = "menu"
                self.cursor = 0

    def _handle_battle_scroll(self, direction):
        if self.battle_phase == "message":
            self._next_battle_message()
        elif self.battle_phase == "select":
            self.cursor = max(0, min(3, self.cursor + direction))
        elif self.battle_phase == "moves":
            moves = self.battle_state.player.moves
            self.cursor = max(0, min(len(moves) - 1, self.cursor + direction))
        elif self.battle_phase == "party":
            self.cursor = max(0, min(len(self.player.party) - 1, self.cursor + direction))
        elif self.battle_phase == "bag":
            items = [(k, v) for k, v in self.player.inventory.items() if v > 0 and k in [ITEM_POTION, ITEM_SUPER_POTION, ITEM_HYPER_POTION, ITEM_FULL_HEAL, ITEM_SPHERE, ITEM_GREAT_SPHERE, ITEM_ULTRA_SPHERE, ITEM_MASTER_SPHERE, ITEM_REVIVE, ITEM_FULL_REVIVE]]
            self.cursor = max(0, min(len(items) - 1, self.cursor + direction))

    def _handle_battle_confirm(self):
        if self.battle_phase == "message":
            self._next_battle_message()
        elif self.battle_phase == "select":
            self._select_battle_action()
        elif self.battle_phase == "moves":
            self._use_battle_move()
        elif self.battle_phase == "party":
            self._switch_battle_creature()
        elif self.battle_phase == "bag":
            self._use_battle_item()

    def _handle_battle_back(self):
        if self.battle_phase in ("moves", "party", "bag"):
            self.battle_phase = "menu"
            self.cursor = 0

    def _select_battle_action(self):
        actions = ["Fight", "Bag", "Party", "Run"]
        action = actions[self.cursor]
        if action == "Fight":
            self.battle_phase = "moves"
            self.cursor = 0
        elif action == "Bag":
            self.battle_phase = "bag"
            self.cursor = 0
        elif action == "Party":
            self.battle_phase = "party"
            self.cursor = 0
        elif action == "Run":
            if self.battle_state.can_escape:
                self.battle_state.player_fled()
                self.battle_state.message = "Got away safely!"
                self.battle_phase = "message"
            else:
                self.battle_state.add_message("Can't escape from a trainer battle!")
                self.battle_phase = "message"

    def _use_battle_move(self):
        bs = self.battle_state
        p = bs.player
        mv = p.moves[self.cursor]
        if mv["pp"] <= 0:
            bs.add_message("No PP left for this move!")
            bs.battle_phase = "message"
            return

        bs.execute_turn(self.cursor)

        if not bs.enemy.is_alive():
            if not bs.next_enemy():
                bs.player_wins()
                bs.add_message(f"You defeated {bs.trainer_name}!")
                if bs.is_trainer:
                    for npc in self.current_map.npcs:
                        if npc.get("name") == bs.trainer_name:
                            npc["defeated"] = True
                            if "reward" in npc:
                                self.player.money += npc["reward"]
                                bs.add_message(f"Got ${npc['reward']}!")
                            if "badge" in npc:
                                self.player.badges.append(npc["badge"])
                                bs.add_message(f"Got {npc['badge']}!")
                                gym_flags = [FLAG_GYM_1, FLAG_GYM_2, FLAG_GYM_3, FLAG_GYM_4,
                                           FLAG_GYM_5, FLAG_GYM_6, FLAG_GYM_7, FLAG_GYM_8]
                                if len(self.player.badges) <= 8:
                                    self.player.story_flags[gym_flags[len(self.player.badges)-1]] = True
                            if npc.get("evil_team"):
                                evil_enc = npc.get("evil_encounter", 1)
                                evil_flags = [FLAG_EVIL_1, FLAG_EVIL_2, FLAG_EVIL_3]
                                if evil_enc <= 3:
                                    self.player.story_flags[evil_flags[evil_enc-1]] = True
                                    bs.add_message("Team Shadow's plan is foiled!")
        elif not bs.player.is_alive():
            if not bs.next_player():
                bs.player_loses()
                bs.add_message("You have no more Minis!")
            else:
                bs.add_message(f"Go, {bs.player.name}!")

        self.battle_phase = "message"

    def _switch_battle_creature(self):
        target = self.player.party[self.cursor]
        if not target.is_alive():
            self.battle_state.add_message(f"{target.name} can't fight!")
            self.battle_phase = "message"
            return
        if target == self.battle_state.player:
            self.battle_state.add_message(f"{target.name} is already out!")
            self.battle_phase = "message"
            return
        old_name = self.battle_state.player.name
        self.battle_state.player_idx = self.cursor
        self.battle_state.add_message(f"{old_name}, come back! Go, {target.name}!")
        self.battle_phase = "message"

    def _use_battle_item(self):
        bs = self.battle_state
        items = [(k, v) for k, v in self.player.inventory.items() if v > 0 and k in [ITEM_POTION, ITEM_SUPER_POTION, ITEM_HYPER_POTION, ITEM_FULL_HEAL, ITEM_SPHERE, ITEM_GREAT_SPHERE, ITEM_ULTRA_SPHERE, ITEM_MASTER_SPHERE, ITEM_REVIVE, ITEM_FULL_REVIVE]]
        if self.cursor >= len(items):
            return
        item_name, count = items[self.cursor]
        sphere_mult = 0

        if item_name in [ITEM_POTION, ITEM_SUPER_POTION, ITEM_HYPER_POTION]:
            amounts = {ITEM_POTION: 20, ITEM_SUPER_POTION: 60, ITEM_HYPER_POTION: 200}
            if self.player.remove_item(item_name):
                bs.player.heal(amounts[item_name])
                bs.add_message(f"Used {item_name}! Healed {amounts[item_name]} HP!")
        elif item_name == ITEM_FULL_HEAL:
            if self.player.remove_item(item_name):
                bs.player.status = None
                bs.player.confusion_turns = 0
                bs.add_message(f"Used {item_name}! Status healed!")
        elif item_name in [ITEM_SPHERE, ITEM_GREAT_SPHERE, ITEM_ULTRA_SPHERE, ITEM_MASTER_SPHERE]:
            sphere_vals = {ITEM_SPHERE: 1.0, ITEM_GREAT_SPHERE: 1.5, ITEM_ULTRA_SPHERE: 2.0, ITEM_MASTER_SPHERE: 255.0}
            if self.player.remove_item(item_name):
                caught, shakes = attempt_capture(bs.enemy, sphere_vals[item_name])
                if caught:
                    bs.add_message(f"Gotcha! {bs.enemy.name} was caught!")
                    from .creatures import BattleCreature as BC
                    caught_creature = BC(bs.enemy.dex, bs.enemy.level)
                    self.player.add_creature(caught_creature)
                    if not bs.next_enemy():
                        bs.player_won = True
                        bs.battle_over = True
                    else:
                        bs.enemy_idx = bs.enemy_idx
                else:
                    bs.add_message(f"Oh no! {bs.enemy.name} broke free! ({shakes}/4 shakes)")
        elif item_name in [ITEM_REVIVE, ITEM_FULL_REVIVE]:
            self.player.remove_item(item_name)
            bs.add_message(f"Used {item_name}! But it can't be used in battle...")
            self.battle_phase = "message"
            return
        self.battle_phase = "message"

    def _next_battle_message(self):
        msg = self.battle_state.get_next_message()
        if msg:
            self.battle_state.message = msg
        else:
            if self.battle_state.battle_over:
                if self.battle_state.player_won:
                    self._check_evolution()
                    self.state = STATE_OW
                elif not self.battle_state.player_won:
                    self.state = STATE_GAME_OVER
                else:
                    self.state = STATE_OW
            else:
                self.battle_phase = "menu"
                self.cursor = 0

    def _handle_menu_key(self, key):
        if key == pygame.K_ESCAPE:
            self.state = STATE_OW
        elif key in (pygame.K_RETURN, pygame.K_SPACE):
            self._select_menu()

    def _check_evolution(self):
        for c in self.player.party:
            pending = getattr(c, 'pending_moves', None)
            if pending and len(pending) > 0:
                new_move = c.pending_moves.pop(0)
                m = get_move(new_move["id"])
                if m:
                    self.dialog_queue = [f"{c.name} wants to learn {m.name}!"]
                    if len(c.moves) >= 4:
                        self.dialog_queue.append(f"{c.name} already knows 4 moves!")
                        self.dialog_queue.append("Which move should be forgotten?")
                        for i, mv in enumerate(c.moves):
                            mv_data = get_move(mv["id"])
                            if mv_data:
                                self.dialog_queue.append(f"{i+1}: {mv_data.name}")
                        self.pending_move_learn = (c, new_move)
                        self.state = STATE_MOVES
                        self.cursor = 0
                    else:
                        c.moves.append(new_move)
                        self.dialog_queue.append(f"{c.name} learned {m.name}!")
                        self.state = STATE_DIALOG
                        self._next_dialog()
                    return
        for c in self.player.party:
            if c.can_evolve():
                old_name = c.name
                c.evolve()
                new_name = c.name
                self.pending_evolution = (old_name, new_name)
                self.dialog_queue = [f"{old_name} is evolving!", f"{old_name} evolved into {new_name}!"]
                self.state = STATE_EVOLUTION
                self._next_dialog()
                return

    def _select_menu(self):
        options = ["Party", "Bag", "Save", "Pokédex", "Quit"]
        choice = options[self.cursor]
        if choice == "Party":
            self.state = STATE_PARTY
            self.cursor = 0
        elif choice == "Bag":
            self.state = STATE_BAG
            self.cursor = 0
        elif choice == "Save":
            self.dialog_queue = ["Game saved! (Not really, but imagine it!)"]
            self.state = STATE_DIALOG
            self._next_dialog()
        elif choice == "Pokédex":
            self.dialog_queue = [f"Seen {len(CREATURE_DB)} Minis in Minimon!"]
            self.state = STATE_DIALOG
            self._next_dialog()
        elif choice == "Quit":
            self.running = False

    def _handle_party_key(self, key):
        if key == pygame.K_ESCAPE:
            self.state = STATE_MENU
            self.cursor = 0

    def _handle_party_scroll(self, direction):
        self.cursor = max(0, min(len(self.player.party) - 1, self.cursor + direction))

    def _select_party(self):
        if self.cursor < len(self.player.party):
            c = self.player.party[self.cursor]
            self.dialog_queue = [f"{c.name} Lv.{c.level}", f"HP: {c.hp}/{c.max_hp}",
                                f"ATK: {c.stats[1]} DEF: {c.stats[2]}",
                                f"SPD: {c.stats[3]} SPC: {c.stats[4]}"]
            self.state = STATE_DIALOG
            self._next_dialog()

    def _handle_bag_key(self, key):
        if key == pygame.K_ESCAPE:
            self.state = STATE_MENU
            self.cursor = 0

    def _handle_bag_scroll(self, direction):
        items = [(k, v) for k, v in self.player.inventory.items() if v > 0]
        self.cursor = max(0, min(len(items) - 1, self.cursor + direction))

    def _use_item(self):
        items = [(k, v) for k, v in self.player.inventory.items() if v > 0]
        if self.cursor >= len(items):
            return
        item_name, count = items[self.cursor]
        if item_name in [ITEM_POTION, ITEM_SUPER_POTION, ITEM_HYPER_POTION]:
            if self.player.party:
                amounts = {ITEM_POTION: 20, ITEM_SUPER_POTION: 60, ITEM_HYPER_POTION: 200}
                healed = amounts.get(item_name, 20)
                for c in self.player.party:
                    if c.hp < c.max_hp:
                        if self.player.remove_item(item_name):
                            c.heal(healed)
                            actual = min(healed, c.max_hp - (c.hp - healed) if c.hp - healed < 0 else healed)
                            self.dialog_queue = [f"Used {item_name} on {c.name}! Healed {healed} HP!"]
                        else:
                            self.dialog_queue = [f"No {item_name} left!"]
                        self.state = STATE_DIALOG
                        self._next_dialog()
                        return
                self.dialog_queue = ["All Minis are at full health!"]
            else:
                self.dialog_queue = ["No Minis to heal!"]
        elif item_name == ITEM_FULL_HEAL:
            for c in self.player.party:
                c.status = None
                c.confusion_turns = 0
            self.player.remove_item(item_name)
            self.dialog_queue = ["All status conditions cured!"]
        elif item_name in ALL_TM_ITEMS:
            self.player.remove_item(item_name)
            self._use_tm(item_name)
            return
        elif item_name in [ITEM_REVIVE, ITEM_FULL_REVIVE]:
            fainted = [c for c in self.player.party if not c.is_alive()]
            if fainted:
                revive_hp = 1 if item_name == ITEM_REVIVE else fainted[0].max_hp
                if self.player.remove_item(item_name):
                    fainted[0].hp = revive_hp
                    self.dialog_queue = [f"Used {item_name}! {fainted[0].name} was revived!"]
                else:
                    self.dialog_queue = [f"No {item_name} left!"]
            else:
                self.dialog_queue = ["No fainted Minis!"]
        else:
            self.dialog_queue = [f"{item_name} can only be used in battle!"]
        self.state = STATE_DIALOG
        self._next_dialog()

    def _handle_moves_key(self, key):
        if key == pygame.K_ESCAPE:
            if hasattr(self, 'pending_move_learn') and self.pending_move_learn:
                creature, new_move = self.pending_move_learn
                creature.moves[-1] = new_move
                m = get_move(new_move["id"])
                self.dialog_queue = [f"{creature.name} forgot a move and learned {m.name}!"]
                self.pending_move_learn = None
                self.state = STATE_DIALOG
                self._next_dialog()
            else:
                self.state = STATE_MENU
                self.cursor = 0
        elif key in (pygame.K_RETURN, pygame.K_SPACE):
            if hasattr(self, 'pending_move_learn') and self.pending_move_learn:
                self._handle_move_learn_choice()

    def _handle_moves_scroll(self, direction):
        if hasattr(self, 'pending_move_learn') and self.pending_move_learn:
            creature, new_move = self.pending_move_learn
            self.cursor = max(0, min(len(creature.moves) - 1, self.cursor + direction))
        elif self.player.party:
            c = self.player.party[0]
            self.cursor = max(0, min(len(c.moves) - 1, self.cursor + direction))

    def _select_move(self):
        pass

    def _handle_move_learn_choice(self):
        if not hasattr(self, 'pending_move_learn') or not self.pending_move_learn:
            return
        creature, new_move = self.pending_move_learn
        old_move = creature.moves[self.cursor]
        creature.moves[self.cursor] = new_move
        old_mv = get_move(old_move["id"])
        new_mv = get_move(new_move["id"])
        self.pending_move_learn = None
        self.dialog_queue = [f"{creature.name} forgot {old_mv.name} and learned {new_mv.name}!"]
        self.state = STATE_DIALOG
        self._next_dialog()

    def _handle_shop_key(self, key):
        if key == pygame.K_ESCAPE:
            self.state = STATE_OW
        elif key in (pygame.K_RETURN, pygame.K_SPACE):
            self._buy_item()

    def _buy_item(self):
        item = self.shop_items[self.shop_cursor]
        price = ITEM_PRICES.get(item, 100)
        if self.player.money >= price:
            self.player.money -= price
            self.player.add_item(item)
            self.dialog_queue = [f"Bought {item} for ${price}!"]
        else:
            self.dialog_queue = ["Not enough money!"]
        self.state = STATE_DIALOG
        self._next_dialog()

    def _next_dialog(self):
        if self.dialog_queue:
            self.dialog_current = self.dialog_queue.pop(0)
        else:
            if hasattr(self, 'pending_starter') and self.pending_starter:
                self._choose_starter()
                return
            if hasattr(self, 'pending_trainer_battle') and self.pending_trainer_battle:
                npc = self.pending_trainer_battle
                self.pending_trainer_battle = None
                if npc["type"] == "rival":
                    self._start_rival_battle(npc)
                else:
                    self._start_trainer_battle(npc)
                return
            if hasattr(self, 'pending_gym_battle') and self.pending_gym_battle:
                npc = self.pending_gym_battle
                self.pending_gym_battle = None
                self._start_gym_battle(npc)
                return
            if hasattr(self, 'pending_healer') and self.pending_healer:
                self.pending_healer = None
                self._heal_party()
                return
            if hasattr(self, 'pending_trade') and self.pending_trade:
                npc = self.pending_trade
                self.pending_trade = None
                self._execute_trade(npc)
                return
            if hasattr(self, 'pending_move_learn') and self.pending_move_learn:
                self._handle_move_learn_choice()
                return
            self.state = STATE_OW

    def _advance_dialog(self):
        if self.dialog_queue:
            self._next_dialog()
        else:
            if hasattr(self, 'pending_starter') and self.pending_starter:
                self.state = "choose_starter"
            if hasattr(self, 'pending_trainer_battle') and self.pending_trainer_battle:
                npc = self.pending_trainer_battle
                self.pending_trainer_battle = None
                if npc["type"] == "rival":
                    self._start_rival_battle(npc)
                else:
                    self._start_trainer_battle(npc)
            elif hasattr(self, 'pending_gym_battle') and self.pending_gym_battle:
                npc = self.pending_gym_battle
                self.pending_gym_battle = None
                self._start_gym_battle(npc)
            else:
                self.state = STATE_OW

    def _choose_starter(self):
        choices = self.pending_starter
        dex = choices[self.cursor]
        starter = BattleCreature(dex, 5)
        self.player.add_creature(starter)
        self.player.starter_choice = dex
        self.player.story_flags[FLAG_STARTER_CHOSEN] = True
        starter_names = [CREATURE_DB[d].name for d in choices]
        rival_choices = [choices[1], choices[2], choices[0]]
        self.player.rival_starter = rival_choices[self.cursor]
        self.dialog_queue = [f"You chose {starter.name}!"],
        self.state = STATE_DIALOG
        self._next_dialog()
        self.pending_starter = None

    def _update(self, dt):
        self.player.play_time += dt

    def _render(self):
        self.screen.fill(COLOR_BG)

        if self.state == STATE_TITLE:
            self.renderer.draw_start_screen(self.time_offset)
        elif self.state == STATE_INTRO:
            self.renderer.draw_start_screen(self.time_offset)
        elif self.state == "choose_starter":
            self._render_starter_choice()
        elif self.state == STATE_OW:
            self._render_overworld()
        elif self.state == STATE_BATTLE:
            self._render_battle()
        elif self.state == STATE_MENU:
            self._render_menu()
        elif self.state == STATE_PARTY:
            self.renderer.draw_party_menu(self.player.party, self.cursor)
        elif self.state == STATE_BAG:
            self.renderer.draw_inventory(self.player.inventory, self.cursor)
        elif self.state == STATE_MOVES:
            if hasattr(self, 'pending_move_learn') and self.pending_move_learn:
                creature, new_move = self.pending_move_learn
                m = get_move(new_move["id"])
                self.renderer.draw_move_menu(creature.moves, self.cursor, creature, new_move_name=m.name if m else "")
            elif self.player.party:
                self.renderer.draw_move_menu(self.player.party[0].moves, self.cursor)
        elif self.state == STATE_DIALOG:
            self._render_overworld()
            self.renderer.draw_dialog_box(self.dialog_current, self.dialog_speaker)
        elif self.state == STATE_SHOP:
            self._render_shop()
        elif self.state == STATE_EVOLUTION:
            if self.pending_evolution:
                old, new = self.pending_evolution
                self.renderer.draw_evolution_screen(old, new, self.time_offset)
        elif self.state == STATE_GAME_OVER:
            self.screen.fill(COLOR_BG)
            self.renderer.draw_text(240, 200, "GAME OVER", COLOR_RED, self.renderer.font_title, center=True)
            self.renderer.draw_text(240, 250, "Your Minis have fainted...", COLOR_GRAY, self.renderer.font, center=True)
            self.renderer.draw_text(240, 300, "Press ENTER to try again", COLOR_WHITE, self.renderer.font, center=True)

    def _render_overworld(self):
        if self.current_map:
            self.renderer.draw_town_map(self.current_map, self.player.x, self.player.y, self.time_offset)
            self.renderer.draw_ow_character(self.player.x, self.player.y, self.player.facing, self.time_offset)
            self.renderer.draw_hud(self.player, self.current_map.name, self.time_offset)

    def _render_battle(self):
        bs = self.battle_state
        if not bs:
            return
        self.renderer.draw_battle_scene(bs.player, bs.enemy, self.time_offset)

        if bs.message:
            self.renderer.draw_box(10, 310, 460, 80)
            lines = self.renderer._wrap_text(bs.message, 440)
            for i, line in enumerate(lines[:3]):
                self.renderer.draw_text(20, 320 + i * 18, line, COLOR_WHITE)

        if self.battle_phase == "menu":
            self.renderer.draw_box(10, 400, 460, 70)
            actions = ["Fight", "Bag", "Party", "Run"]
            for i, action in enumerate(actions):
                x = 30 + (i % 2) * 230
                y = 415 + (i // 2) * 28
                is_sel = (i == self.cursor)
                if is_sel:
                    self.renderer.draw_rect(x - 5, y - 2, 100, 22, COLOR_SELECT, alpha=80)
                self.renderer.draw_text(x, y, action, COLOR_YELLOW if is_sel else COLOR_WHITE)
            if self.cursor < len(actions):
                cx = 20 + (self.cursor % 2) * 230
                cy = 413 + (self.cursor // 2) * 28
                self.renderer.draw_menu_cursor(cx, cy, self.time_offset)

        elif self.battle_phase == "moves":
            self.renderer.draw_move_menu(bs.player.moves, self.cursor, bs.player)

        elif self.battle_phase == "party":
            self.renderer.draw_party_menu(self.player.party, self.cursor)

        elif self.battle_phase == "bag":
            items = [(k, v) for k, v in self.player.inventory.items() if v > 0 and k in [ITEM_POTION, ITEM_SUPER_POTION, ITEM_HYPER_POTION, ITEM_FULL_HEAL, ITEM_SPHERE, ITEM_GREAT_SPHERE, ITEM_ULTRA_SPHERE, ITEM_MASTER_SPHERE, ITEM_REVIVE, ITEM_FULL_REVIVE]]
            self.renderer.draw_box(10, 30, 460, 350)
            self.renderer.draw_text(240, 38, "BAG", COLOR_YELLOW, self.renderer.font, center=True)
            for i, (item, count) in enumerate(items):
                y = 65 + i * 32
                is_sel = (i == self.cursor)
                if is_sel:
                    self.renderer.draw_rect(16, y, 448, 28, COLOR_SELECT, alpha=80)
                self.renderer.draw_text(24, y + 6, f"{item} x{count}", COLOR_WHITE if is_sel else COLOR_LIGHT_GRAY)

    def _render_menu(self):
        self.renderer.draw_box(100, 50, 280, 380)
        self.renderer.draw_text(240, 60, "MENU", COLOR_YELLOW, self.renderer.font, center=True)
        options = ["Party", "Bag", "Save", "Pokédex", "Quit"]
        for i, opt in enumerate(options):
            y = 100 + i * 50
            is_sel = (i == self.cursor)
            if is_sel:
                self.renderer.draw_rect(110, y - 5, 260, 40, COLOR_SELECT, alpha=80)
            self.renderer.draw_text(130, y, opt, COLOR_YELLOW if is_sel else COLOR_WHITE)
            if is_sel:
                self.renderer.draw_menu_cursor(115, y + 3, self.time_offset)

        if self.player.party:
            c = self.player.party[0]
            self.renderer.draw_text(240, 370, f"{c.name} Lv.{c.level} HP:{c.hp}/{c.max_hp}", COLOR_GRAY, self.renderer.font_small, center=True)

    def _render_starter_choice(self):
        self.screen.fill(COLOR_BG)
        self.renderer.draw_text(240, 40, "Choose Your Partner!", COLOR_YELLOW, self.renderer.font_large, center=True)
        choices = self.pending_starter
        for i, dex in enumerate(choices):
            x = 40 + i * 160
            is_sel = (i == self.cursor)
            if is_sel:
                self.renderer.draw_rect(x - 5, 80, 150, 300, COLOR_SELECT, alpha=60)
            template = CREATURE_DB[dex]
            self.renderer.draw_creature_sprite(x + 40, 120, 80, dex, 5)
            self.renderer.draw_text(x + 75, 220, template.name, COLOR_YELLOW if is_sel else COLOR_WHITE, self.renderer.font, center=True)
            type_str = "/".join(template.types)
            self.renderer.draw_text(x + 75, 240, type_str, TYPE_COLORS.get(template.types[0], COLOR_GRAY), self.renderer.font_small, center=True)
            self.renderer.draw_text(x + 75, 260, f"HP:{template.base_stats[0]} ATK:{template.base_stats[1]}", COLOR_GRAY, self.renderer.font_small, center=True)
            self.renderer.draw_text(x + 75, 275, f"DEF:{template.base_stats[2]} SPD:{template.base_stats[3]}", COLOR_GRAY, self.renderer.font_small, center=True)

        self.renderer.draw_text(240, 400, "Scroll to select, Click to confirm", COLOR_GRAY, self.renderer.font_small, center=True)

    def _render_shop(self):
        self.renderer.draw_box(10, 30, 460, 420)
        self.renderer.draw_text(240, 38, "SHOP", COLOR_YELLOW, self.renderer.font, center=True)
        self.renderer.draw_text(400, 38, f"${self.player.money}", COLOR_YELLOW, self.renderer.font_small)
        max_visible = 10
        scroll_offset = max(0, self.shop_cursor - max_visible + 1)
        for i in range(scroll_offset, min(len(self.shop_items), scroll_offset + max_visible)):
            item = self.shop_items[i]
            y = 65 + (i - scroll_offset) * 35
            is_sel = (i == self.shop_cursor)
            if is_sel:
                self.renderer.draw_rect(16, y, 448, 30, COLOR_SELECT, alpha=80)
            price = ITEM_PRICES.get(item, 100)
            can_buy = self.player.money >= price
            color = COLOR_WHITE if is_sel else (COLOR_GRAY if not can_buy else COLOR_LIGHT_GRAY)
            self.renderer.draw_text(24, y + 8, f"{item} - ${price}", color)


def main():
    game = Game()
    game.run()


if __name__ == "__main__":
    main()
