import random
import math
from .config import *
from .moves import *


class BattleCreature:
    def __init__(self, dex_num, level, moves=None, is_wild=False):
        from .creatures import CREATURE_DB
        template = CREATURE_DB[dex_num]
        self.dex = dex_num
        self.name = template.name
        self.types = template.types
        self.level = level
        self.xp = 0
        self.xp_next = xp_for_level(level + 1, template.growth_rate)
        self.base_stats = template.base_stats
        self.catch_rate = template.catch_rate
        self.growth_rate = template.growth_rate
        self.color = template.color

        self.stats = [
            calc_hp(template.base_stats[0], level),
            calc_stat(template.base_stats[1], level),
            calc_stat(template.base_stats[2], level),
            calc_stat(template.base_stats[3], level),
            calc_stat(template.base_stats[4], level),
            calc_stat(template.base_stats[5], level),
        ]
        self.max_hp = self.stats[STAT_HP]
        self.hp = self.max_hp

        self.stat_stages = [0, 0, 0, 0, 0, 0]
        self.status = None
        self.confusion_turns = 0

        if moves:
            self.moves = []
            for mid in moves:
                m = get_move(mid)
                if m:
                    self.moves.append({"id": mid, "pp": m.max_pp, "max_pp": m.max_pp})
        else:
            self.moves = []
            for lvl, mid in template.moves:
                if lvl <= level and len(self.moves) < 4:
                    m = get_move(mid)
                    if m:
                        self.moves.append({"id": mid, "pp": m.max_pp, "max_pp": m.max_pp})
            if not self.moves:
                m = get_move("tackle")
                self.moves.append({"id": "tackle", "pp": 35, "max_pp": 35})

    def get_stat(self, stat_idx):
        base = self.stats[stat_idx]
        stage = self.stat_stages[stat_idx]
        if stage >= 0:
            multiplier = (2 + stage) / 2
        else:
            multiplier = 2 / (2 - stage)
        return max(1, int(base * multiplier))

    def is_alive(self):
        return self.hp > 0

    def take_damage(self, dmg):
        self.hp = max(0, self.hp - dmg)

    def heal(self, amount):
        self.hp = min(self.max_hp, self.hp + amount)

    def gain_xp(self, amount):
        self.xp += amount
        leveled = False
        while self.xp >= self.xp_next and self.level < 100:
            self.level_up()
            leveled = True
        return leveled

    def level_up(self):
        from .creatures import CREATURE_DB
        self.level += 1
        template = CREATURE_DB[self.dex]
        self.stats = [
            calc_hp(template.base_stats[0], self.level),
            calc_stat(template.base_stats[1], self.level),
            calc_stat(template.base_stats[2], self.level),
            calc_stat(template.base_stats[3], self.level),
            calc_stat(template.base_stats[4], self.level),
            calc_stat(template.base_stats[5], self.level),
        ]
        old_max_hp = self.max_hp
        self.max_hp = self.stats[STAT_HP]
        self.hp += (self.max_hp - old_max_hp)
        self.xp_next = xp_for_level(self.level + 1, self.growth_rate)

        new_moves = []
        for lvl, mid in template.moves:
            if lvl == self.level:
                m = get_move(mid)
                if m and not any(mv["id"] == mid for mv in self.moves):
                    new_moves.append({"id": mid, "pp": m.max_pp, "max_pp": m.max_pp})
        if not hasattr(self, 'pending_moves') or self.pending_moves is None:
            self.pending_moves = []
        for nm in new_moves:
            if len(self.moves) < 4:
                self.moves.append(nm)
            else:
                self.pending_moves.append(nm)

    def can_evolve(self):
        from .creatures import CREATURE_DB
        template = CREATURE_DB[self.dex]
        if template.evolution:
            evo_level, evo_dex = template.evolution
            return self.level >= evo_level
        return False

    def evolve(self):
        from .creatures import CREATURE_DB
        template = CREATURE_DB[self.dex]
        if template.evolution:
            _, evo_dex = template.evolution
            new_template = CREATURE_DB[evo_dex]
            old_dex = self.dex
            self.dex = evo_dex
            self.name = new_template.name
            self.types = new_template.types
            self.base_stats = new_template.base_stats
            self.color = new_template.color
            self.stats = [
                calc_hp(new_template.base_stats[0], self.level),
                calc_stat(new_template.base_stats[1], self.level),
                calc_stat(new_template.base_stats[2], self.level),
                calc_stat(new_template.base_stats[3], self.level),
                calc_stat(new_template.base_stats[4], self.level),
                calc_stat(new_template.base_stats[5], self.level),
            ]
            self.max_hp = self.stats[STAT_HP]
            self.hp = self.max_hp
            for lvl, mid in new_template.moves:
                if lvl <= self.level and len(self.moves) < 4:
                    m = get_move(mid)
                    if m and not any(mv["id"] == mid for mv in self.moves):
                        self.moves.append({"id": mid, "pp": m.max_pp, "max_pp": m.max_pp})
            return old_dex, evo_dex
        return None


def get_type_effectiveness(attack_type, defender_types):
    mult = 1.0
    chart = TYPE_CHART.get(attack_type, {})
    for dt in defender_types:
        mult *= chart.get(dt, 1.0)
    return mult


def calculate_damage(attacker, defender, move_data):
    if move_data.category == STATUS:
        return 0, "status"

    move = get_move(move_data.id) if hasattr(move_data, 'id') else move_data
    if not move:
        return 0, "miss"

    if move.category == PHYSICAL:
        atk = attacker.get_stat(STAT_ATK)
        dfn = defender.get_stat(STAT_DEF)
    else:
        atk = attacker.get_stat(STAT_SATK)
        dfn = defender.get_stat(STAT_SDEF)

    if move.power == 0:
        if move.id == "dragon_rage":
            return 40, "dragon_rage"
        if move.id == "night_shade":
            return attacker.level, "night_shade"
        return 0, "status"

    if move.id == "swift":
        effectiveness = 1.0
    else:
        effectiveness = get_type_effectiveness(move.type, defender.types)

    base_damage = ((2 * attacker.level / 5 + 2) * move.power * atk / dfn) / 50 + 2

    stab = 1.5 if move.type in attacker.types else 1.0
    critical = 1.0
    if random.random() < 0.0625:
        critical = 1.5

    random_factor = random.uniform(0.85, 1.0)
    stage_mod = 1.0

    total = int(base_damage * stab * effectiveness * critical * random_factor * stage_mod)
    total = max(1, total)

    desc = ""
    if effectiveness > 1:
        desc = "super_effective"
    elif effectiveness < 1 and effectiveness > 0:
        desc = "not_effective"
    elif effectiveness == 0:
        desc = "no_effect"
    if critical > 1:
        desc = "critical" if not desc else desc + "_critical"

    return total, desc


def apply_status_effect(attacker, defender, move):
    if move.effect is None:
        return None

    if move.effect == EFFECT_RECOVER:
        heal_amount = attacker.max_hp // 2
        attacker.heal(heal_amount)
        return f"recovered {heal_amount} HP"

    if move.effect == EFFECT_LEECH:
        return "leech_active"

    if move.effect == EFFECT_ATK_UP:
        attacker.stat_stages[STAT_ATK] = min(6, attacker.stat_stages[STAT_ATK] + 1)
        return "atk_up"
    if move.effect == EFFECT_DEF_UP:
        attacker.stat_stages[STAT_DEF] = min(6, attacker.stat_stages[STAT_DEF] + 1)
        return "def_up"
    if move.effect == EFFECT_SPD_UP:
        attacker.stat_stages[STAT_SPD] = min(6, attacker.stat_stages[STAT_SPD] + 1)
        return "spd_up"
    if move.effect == EFFECT_SATK_UP:
        attacker.stat_stages[STAT_SATK] = min(6, attacker.stat_stages[STAT_SATK] + 1)
        return "satk_up"
    if move.effect == EFFECT_SDEF_UP:
        attacker.stat_stages[STAT_SDEF] = min(6, attacker.stat_stages[STAT_SDEF] + 1)
        return "sdef_up"

    if move.effect == EFFECT_ATK_DOWN:
        defender.stat_stages[STAT_ATK] = max(-6, defender.stat_stages[STAT_ATK] - 1)
        return "atk_down"
    if move.effect == EFFECT_DEF_DOWN:
        defender.stat_stages[STAT_DEF] = max(-6, defender.stat_stages[STAT_DEF] - 1)
        return "def_down"
    if move.effect == EFFECT_SPD_DOWN:
        defender.stat_stages[STAT_SPD] = max(-6, defender.stat_stages[STAT_SPD] - 1)
        return "spd_down"
    if move.effect == EFFECT_SATK_DOWN:
        defender.stat_stages[STAT_SATK] = max(-6, defender.stat_stages[STAT_SATK] - 1)
        return "satk_down"

    if move.effect in (EFFECT_BURN, EFFECT_FREEZE, EFFECT_PARALYZE, EFFECT_POISON, EFFECT_SLEEP):
        if defender.status is None and random.randint(1, 100) <= move.effect_chance:
            defender.status = move.effect
            return f"status_{move.effect}"
        return None

    if move.effect == EFFECT_CONFUSE:
        if random.randint(1, 100) <= move.effect_chance:
            defender.confusion_turns = random.randint(2, 5)
            return "confuse"
        return None

    if move.effect == EFFECT_FLINCH:
        if random.randint(1, 100) <= move.effect_chance:
            return "flinch"
        return None

    return None


def attempt_capture(defender, sphere_type=SPHERE_NORMAL):
    rate = defender.catch_rate
    hp_factor = (3 * defender.max_hp - 2 * defender.hp) / (3 * defender.max_hp)
    shake_chance = rate * hp_factor / 255.0 * sphere_type
    shake_chance = min(0.95, max(0.05, shake_chance))

    shakes = 0
    for _ in range(4):
        if random.random() < shake_chance:
            shakes += 1
        else:
            break

    return shakes >= 4, shakes


def calculate_xp_gain(defeated, party_size=1):
    from .creatures import CREATURE_DB
    template = CREATURE_DB[defeated.dex]
    base_xp = sum(template.base_stats) // 6
    return max(1, int(base_xp * defeated.level / (7 * max(1, party_size))))


def get_ai_move(creature, opponent, difficulty=AI_TRAINER):
    usable = [m for m in creature.moves if m["pp"] > 0]
    if not usable:
        return creature.moves[0]

    if difficulty <= AI_WILD:
        return random.choice(usable)

    if difficulty >= AI_GYM:
        best = None
        best_score = -999
        for mv in usable:
            move_data = get_move(mv["id"])
            if not move_data:
                continue
            score = move_data.power
            if move_data.category == STATUS:
                score = 20
            eff = get_type_effectiveness(move_data.type, opponent.types)
            score *= eff
            if move_data.effect == EFFECT_RECOVER and creature.hp < creature.max_hp * 0.5:
                score += 50
            if move_data.effect in (EFFECT_ATK_UP, EFFECT_DEF_UP, EFFECT_SPD_UP):
                score += 10
            if score > best_score:
                best_score = score
                best = mv
        return best if best else random.choice(usable)

    return random.choice(usable)


class BattleState:
    def __init__(self, player_creatures, enemy_creatures, is_trainer=True, trainer_name="",
                 can_escape=True, can_catch=True, on_battle_end=None):
        self.player_party = player_creatures
        self.enemy_party = enemy_creatures
        self.player_idx = 0
        self.enemy_idx = 0
        self.is_trainer = is_trainer
        self.trainer_name = trainer_name
        self.can_escape = can_escape
        self.can_catch = can_catch
        self.turn = 0
        self.phase = "menu"
        self.selected_move = 0
        self.selected_item = 0
        self.selected_creature = 0
        self.menu_cursor = 0
        self.submenu = None
        self.message = ""
        self.message_queue = []
        self.battle_over = False
        self.player_won = False
        self.fled = False
        self.player_action = None
        self.enemy_action = None
        self.animating = False
        self.anim_timer = 0
        self.on_battle_end = on_battle_end

    @property
    def player(self):
        return self.player_party[self.player_idx] if self.player_idx < len(self.player_party) else None

    @property
    def enemy(self):
        return self.enemy_party[self.enemy_idx] if self.enemy_idx < len(self.enemy_party) else None

    def next_enemy(self):
        for i, c in enumerate(self.enemy_party):
            if c.is_alive():
                self.enemy_idx = i
                return True
        return False

    def next_player(self):
        for i, c in enumerate(self.player_party):
            if c.is_alive():
                self.player_idx = i
                return True
        return False

    def player_wins(self):
        self.battle_over = True
        self.player_won = True

    def player_loses(self):
        self.battle_over = True
        self.player_won = False

    def player_fled(self):
        self.battle_over = True
        self.fled = True

    def add_message(self, msg):
        self.message_queue.append(msg)

    def get_next_message(self):
        if self.message_queue:
            return self.message_queue.pop(0)
        return None

    def execute_turn(self, player_mv_idx, enemy_mv_idx=None):
        p = self.player
        e = self.enemy
        if not p or not e:
            return

        p_move = p.moves[player_mv_idx] if player_mv_idx < len(p.moves) else p.moves[0]
        p_move_data = get_move(p_move["id"])

        e_mv = get_ai_move(e, p, AI_TRAINER if self.is_trainer else AI_WILD)
        e_move_data = get_move(e_mv["id"])

        p_spd = p.get_stat(STAT_SPD)
        e_spd = e.get_stat(STAT_SPD)

        p_priority = p_move_data.priority if p_move_data else 0
        e_priority = e_move_data.priority if e_move_data else 0

        if p_priority > e_priority:
            first, second = "player", "enemy"
        elif e_priority > p_priority:
            first, second = "enemy", "player"
        elif p_spd >= e_spd:
            first, second = "player", "enemy"
        else:
            first, second = "enemy", "player"

        log = []

        for who in (first, second):
            attacker = p if who == "player" else e
            defender = e if who == "player" else p
            move_data = p_move_data if who == "player" else e_move_data
            move = p_move if who == "player" else e_mv

            if not attacker.is_alive() or not defender.is_alive():
                continue

            if attacker.status == EFFECT_PARALYZED:
                if random.random() < 0.25:
                    log.append(f"{attacker.name} is fully paralyzed!")
                    continue

            if attacker.confusion_turns > 0:
                attacker.confusion_turns -= 1
                if random.random() < 0.33:
                    dmg = max(1, attacker.level * 2)
                    attacker.take_damage(dmg)
                    log.append(f"{attacker.name} hurt itself in confusion!")
                    continue
                else:
                    log.append(f"{attacker.name} snapped out of confusion!")

            if attacker.status == EFFECT_SLEEP:
                if random.random() < 0.5:
                    log.append(f"{attacker.name} is fast asleep!")
                    continue
                else:
                    attacker.status = None
                    log.append(f"{attacker.name} woke up!")

            if move_data is None:
                continue

            if move["pp"] > 0:
                move["pp"] -= 1

            hit_chance = move_data.accuracy
            if hit_chance == 0 or move_data.id == "swift":
                hit = True
            else:
                hit = random.randint(1, 100) <= hit_chance

            if not hit:
                log.append(f"{attacker.name}'s {move_data.name} missed!")
                continue

            damage, effect = calculate_damage(attacker, defender, move_data)

            if move_data.category != STATUS:
                defender.take_damage(damage)
                eff_text = ""
                if effect == "super_effective":
                    eff_text = " It's super effective!"
                elif effect == "not_effective":
                    eff_text = " It's not very effective..."
                elif effect == "no_effect":
                    eff_text = " It had no effect!"
                elif effect and "critical" in effect:
                    eff_text = " A critical hit!"
                log.append(f"{attacker.name} used {move_data.name}! {eff_text}")

                if move_data.effect == EFFECT_RECOIL:
                    recoil = damage // 3
                    attacker.take_damage(recoil)
                    log.append(f"{attacker.name} took recoil damage!")

                status = apply_status_effect(attacker, defender, move_data)
                if status and status.startswith("status_"):
                    status_name = status.replace("status_", "")
                    log.append(f"{defender.name} was {status_name}ed!")
                elif status and "down" in status:
                    stat_name = status.replace("_down", "").upper()
                    log.append(f"{defender.name}'s {stat_name} fell!")
                elif status and "up" in status:
                    stat_name = status.replace("_up", "").upper()
                    log.append(f"{attacker.name}'s {stat_name} rose!")
            else:
                status = apply_status_effect(attacker, defender, move_data)
                if status:
                    if "recovered" in str(status):
                        log.append(f"{attacker.name} {status}!")
                    elif "up" in str(status):
                        stat_name = status.replace("_up", "").upper()
                        log.append(f"{attacker.name}'s {stat_name} rose!")
                    elif status == "leech_active":
                        log.append(f"{defander.name} was seeded!")
                    elif status.startswith("status_"):
                        sname = status.replace("status_", "")
                        log.append(f"{defender.name} was {sname}ed!")
                    elif status == "confuse":
                        log.append(f"{defender.name} became confused!")

            if not defender.is_alive():
                log.append(f"{defender.name} fainted!")
                if who == "player":
                    base_xp = calculate_xp_gain(defender, len(self.player_party))
                    for member in self.player_party:
                        if not member.is_alive():
                            continue
                        if member == attacker:
                            xp = int(base_xp * 1.5)
                        else:
                            xp = base_xp
                        if xp > 0:
                            leveled = member.gain_xp(xp)
                            log.append(f"{member.name} gained {xp} XP!")
                            if leveled:
                                log.append(f"{member.name} grew to level {member.level}!")
                break

        self.message_queue.extend(log)
        self.turn += 1
