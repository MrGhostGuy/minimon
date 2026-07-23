import pygame
import math
from .config import *
from .pixel_art import draw_creature_pixel_art


# NPC pixel art patterns (12x12 grids, 0=empty 1=highlight 2=mid 3=shadow)
NPC_PATTERNS = {
    # Professor: tall, thin, glasses, lab coat
    "professor": [
        "..333333...",
        ".32222223..",
        ".32122123..",
        ".32222223..",
        "..332233...",
        "..322223...",
        "..322223...",
        "..322223...",
        "..322223...",
        "..32..23...",
        "..32..23...",
        "..3.....3..",
    ],
    # Healer: shorter, wider, red cross on chest
    "healer": [
        "..333333...",
        ".32222223..",
        ".32111123..",
        ".32222223..",
        "..332233...",
        ".32233223..",
        "3222222223.",
        "3222222223.",
        ".32222223..",
        "..32..23...",
        "..32..23...",
        "..3.....3..",
    ],
    # Gym Leader: tall, broad shoulders, cape
    "gym_leader": [
        "...3333....",
        "..322223...",
        "..321123...",
        "..322223...",
        ".33332333..",
        "3222222223.",
        "3222222223.",
        "3222222223.",
        ".32222223..",
        "..32..23...",
        "..32..23...",
        "..3.....3..",
    ],
    # Trainer: average build, cap
    "trainer": [
        ".3333333...",
        "322222223..",
        ".32111223..",
        ".32222223..",
        "..332233...",
        ".32222223..",
        "3222222223.",
        ".32222223..",
        "..322223...",
        "..32..23...",
        "..32..23...",
        "..3.....3..",
    ],
    # Rival: cool pose, jacket
    "rival": [
        "..333333...",
        ".32222223..",
        ".32111123..",
        ".32222223..",
        "..332233...",
        ".32222223..",
        "3222222223.",
        ".32222223..",
        "..322223...",
        "..32..23...",
        "..32..23...",
        "..........3",
    ],
    # Item Giver: round, merchant-like, apron
    "item_giver": [
        "..333333...",
        ".32222223..",
        ".32111123..",
        ".32222223..",
        "..332233...",
        ".32222223..",
        "3222222223.",
        "3222222223.",
        ".32222223..",
        "..32..23...",
        "..32..23...",
        "..3.....3..",
    ],
    # Trade NPC: holding something, slightly different pose
    "trade_npc": [
        "..333333...",
        ".32222223..",
        ".32111123..",
        ".32222223..",
        "..332233...",
        ".32222223..",
        "3222222223.",
        "322222223..",
        ".322223....",
        "..32..23...",
        "..32..23...",
        "..3.....3..",
    ],
    # Talker: mouth open (talking), casual
    "talker": [
        "..333333...",
        ".32222223..",
        ".32111123..",
        ".32222223..",
        "..332233...",
        ".32222223..",
        "3222222223.",
        ".32222223..",
        "..322223...",
        "..32..23...",
        "..32..23...",
        "..3.....3..",
    ],
    # Giver: holding out item, arm extended
    "giver": [
        "..333333...",
        ".32222223..",
        ".32111123..",
        ".32222223..",
        "..332233...",
        ".32222223..",
        "3222222223.",
        ".32222233..",
        "..322223.3.",
        "..32..23.3.",
        "..32..23...",
        "..3.....3..",
    ],
    # Evil Grunt: hunched, menacing, dark hood
    "evil_grunt": [
        "..333333...",
        ".32333323..",
        ".32333323..",
        ".32222223..",
        "..332233...",
        ".32222223..",
        "3222222223.",
        ".32222223..",
        "..322223...",
        "..32..23...",
        "..32..23...",
        "..3.....3..",
    ],
    # Evil Boss: tall, imposing, cape and crown
    "evil_boss": [
        ".3.3333.3..",
        "323222323..",
        "322222223..",
        "323333323..",
        ".333223333.",
        "32222222223",
        "32222222223",
        "32222222223",
        ".322222223.",
        "..32..323..",
        "..32..323..",
        "..3.....3..",
    ],
    # Rival Home: casual, home clothes
    "rival_home": [
        "..333333...",
        ".32222223..",
        ".32111123..",
        ".32222223..",
        "..332233...",
        ".32222223..",
        "3222222223.",
        ".32222223..",
        "..322223...",
        "..32..23...",
        "..32..23...",
        "..3.....3..",
    ],
}

NPC_COLORS = {
    "professor": ((255, 255, 255), (200, 230, 200), (80, 140, 80), (30, 50, 30)),
    "healer": ((255, 255, 255), (255, 220, 230), (220, 120, 150), (60, 30, 40)),
    "gym_leader": ((255, 255, 255), (255, 230, 100), (200, 160, 30), (50, 40, 10)),
    "trainer": ((255, 255, 255), (220, 200, 180), (160, 80, 80), (40, 20, 20)),
    "rival": ((255, 255, 255), (180, 200, 240), (80, 120, 180), (20, 30, 50)),
    "item_giver": ((255, 255, 255), (220, 200, 180), (160, 140, 100), (40, 35, 25)),
    "trade_npc": ((255, 255, 255), (220, 200, 180), (160, 140, 100), (40, 35, 25)),
    "talker": ((255, 255, 255), (200, 180, 160), (140, 120, 100), (35, 30, 25)),
    "giver": ((255, 255, 255), (200, 220, 180), (100, 140, 80), (30, 40, 25)),
    "evil_grunt": ((200, 200, 210), (100, 80, 120), (50, 30, 70), (10, 5, 15)),
    "evil_boss": ((220, 220, 230), (80, 60, 100), (40, 20, 60), (10, 5, 15)),
    "rival_home": ((255, 255, 255), (220, 200, 180), (160, 140, 100), (40, 35, 25)),
}

# Player overworld sprite (12x12) — adventure kid with hat
PLAYER_SPRITE = [
    ".3333333...",
    "322222223..",
    ".32211223..",
    ".32222223..",
    "..332233...",
    ".32222223..",
    "3222222223.",
    ".32222223..",
    "..322223...",
    "..32..23...",
    "..32..23...",
    "..3.....3..",
]
PLAYER_PALETTE = ((255, 255, 255), (100, 180, 240), (50, 100, 180), (20, 40, 80))


class Renderer:
    def __init__(self, screen):
        self.screen = screen
        self.font = pygame.font.SysFont("arial", 14)
        self.font_small = pygame.font.SysFont("arial", 11)
        self.font_large = pygame.font.SysFont("arial", 18)
        self.font_title = pygame.font.SysFont("arial", 24, bold=True)

    def draw_text(self, x, y, text, color=COLOR_WHITE, font=None, center=False):
        if font is None:
            font = self.font
        surf = font.render(text, True, color)
        rect = surf.get_rect()
        if center:
            rect.centerx = x
            rect.y = y
        else:
            rect.x = x
            rect.y = y
        self.screen.blit(surf, rect)

    def draw_rect(self, x, y, w, h, color, alpha=255):
        if alpha < 255:
            surf = pygame.Surface((w, h), pygame.SRCALPHA)
            surf.fill((*color, alpha))
            self.screen.blit(surf, (x, y))
        else:
            pygame.draw.rect(self.screen, color, (x, y, w, h))

    def draw_box(self, x, y, w, h, color=COLOR_WHITE, bg=COLOR_MENUBG, border=2):
        self.draw_rect(x, y, w, h, bg)
        pygame.draw.rect(self.screen, color, (x, y, w, h), border)

    def draw_hp_bar(self, x, y, w, h, ratio):
        self.draw_rect(x, y, w, h, COLOR_GRAY)
        fill_w = int(w * max(0, min(1, ratio)))
        if ratio > 0.5:
            color = COLOR_HP_GREEN
        elif ratio > 0.2:
            color = COLOR_HP_YELLOW
        else:
            color = COLOR_HP_RED
        if fill_w > 0:
            self.draw_rect(x, y, fill_w, h, color)

    def draw_creature_sprite(self, x, y, size, dex_num, level, is_enemy=False):
        draw_creature_pixel_art(self.screen, x, y, size, dex_num, is_enemy)
        self.draw_text(x + size // 2, y + size + 2, f"Lv.{level}", COLOR_WHITE, self.font_small, center=True)

    def draw_creature_sprite_no_label(self, x, y, size, dex_num, is_enemy=False):
        draw_creature_pixel_art(self.screen, x, y, size, dex_num, is_enemy)

    def _draw_npc_sprite(self, x, y, size, npc_type):
        pattern = NPC_PATTERNS.get(npc_type, NPC_PATTERNS["talker"])
        palette = NPC_COLORS.get(npc_type, NPC_COLORS["talker"])
        grid = [list(row) for row in pattern]
        rows = len(grid)
        cols = len(grid[0]) if rows > 0 else 0
        if rows == 0 or cols == 0:
            return
        px_size = size / max(rows, cols)
        for r in range(rows):
            for c in range(cols):
                val = grid[r][c]
                if val == 0:
                    continue
                color = palette[val]
                rx = int(x + c * px_size)
                ry = int(y + r * px_size)
                rw = int((c + 1) * px_size) - int(c * px_size)
                rh = int((r + 1) * px_size) - int(r * px_size)
                if rw < 1:
                    rw = 1
                if rh < 1:
                    rh = 1
                pygame.draw.rect(self.screen, color, (rx, ry, rw, rh))

    def _draw_player_ow_sprite(self, x, y, size):
        grid = [list(row) for row in PLAYER_SPRITE]
        palette = PLAYER_PALETTE
        rows = len(grid)
        cols = len(grid[0]) if rows > 0 else 0
        px_size = size / max(rows, cols)
        for r in range(rows):
            for c in range(cols):
                val = grid[r][c]
                if val == 0:
                    continue
                color = palette[val]
                rx = int(x + c * px_size)
                ry = int(y + r * px_size)
                rw = int((c + 1) * px_size) - int(c * px_size)
                rh = int((r + 1) * px_size) - int(r * px_size)
                if rw < 1:
                    rw = 1
                if rh < 1:
                    rh = 1
                pygame.draw.rect(self.screen, color, (rx, ry, rw, rh))

    def draw_battle_scene(self, player_creature, enemy_creature, time_offset=0):
        bg_top = (60, 80, 120)
        bg_bot = (40, 60, 90)
        for y in range(240):
            ratio = y / 240
            r = int(bg_top[0] * (1 - ratio) + bg_bot[0] * ratio)
            g = int(bg_top[1] * (1 - ratio) + bg_bot[1] * ratio)
            b = int(bg_top[2] * (1 - ratio) + bg_bot[2] * ratio)
            pygame.draw.line(self.screen, (r, g, b), (0, y), (480, y))

        pygame.draw.ellipse(self.screen, (80, 120, 60), (20, 150, 180, 40))
        pygame.draw.ellipse(self.screen, (70, 110, 55), (30, 145, 160, 35))

        pygame.draw.ellipse(self.screen, (60, 100, 50), (280, 155, 180, 45))
        pygame.draw.ellipse(self.screen, (50, 90, 45), (290, 150, 160, 38))

        if enemy_creature:
            bob = math.sin(time_offset * 2) * 3
            self.draw_creature_sprite_no_label(330, 90 + int(bob), 80, enemy_creature.dex, is_enemy=True)
            hp_ratio = enemy_creature.hp / max(1, enemy_creature.max_hp)
            self.draw_box(300, 175, 170, 55)
            self.draw_text(308, 178, enemy_creature.name, COLOR_WHITE, self.font_small)
            self.draw_text(308, 192, f"Lv.{enemy_creature.level}", COLOR_GRAY, self.font_small)
            type_str = "/".join(enemy_creature.types)
            self.draw_text(380, 192, type_str, TYPE_COLORS.get(enemy_creature.types[0], COLOR_GRAY), self.font_small)
            self.draw_hp_bar(308, 210, 155, 6, hp_ratio)

        if player_creature:
            bob = math.sin(time_offset * 2 + 1) * 3
            self.draw_creature_sprite_no_label(40, 170 + int(bob), 100, player_creature.dex, is_enemy=False)
            hp_ratio = player_creature.hp / max(1, player_creature.max_hp)
            self.draw_box(10, 240, 210, 65)
            self.draw_text(18, 243, player_creature.name, COLOR_WHITE, self.font)
            self.draw_text(18, 258, f"Lv.{player_creature.level}", COLOR_GRAY, self.font_small)
            type_str = "/".join(player_creature.types)
            self.draw_text(90, 258, type_str, TYPE_COLORS.get(player_creature.types[0], COLOR_GRAY), self.font_small)
            self.draw_hp_bar(18, 278, 195, 8, hp_ratio)
            self.draw_text(140, 275, f"{player_creature.hp}/{player_creature.max_hp}", COLOR_WHITE, self.font_small)

    def draw_menu_cursor(self, x, y, time_offset=0):
        offset = int(math.sin(time_offset * 4) * 2)
        points = [(x + offset, y), (x + 8 + offset, y + 4), (x + offset, y + 8)]
        pygame.draw.polygon(self.screen, COLOR_YELLOW, points)

    def draw_town_map(self, game_map, player_x, player_y, time_offset=0):
        for x in range(min(game_map.width, MAP_TILES_X)):
            for y in range(min(game_map.height, MAP_TILES_Y)):
                tile = game_map.get_tile(x, y)
                color = TILE_COLORS.get(tile, COLOR_GRAY)
                px = x * TILE_SIZE
                py = y * TILE_SIZE
                pygame.draw.rect(self.screen, color, (px, py, TILE_SIZE - 1, TILE_SIZE - 1))

                if tile == TILE_TALL_GRASS:
                    for i in range(3):
                        gx = px + 4 + i * 7
                        gy = py + TILE_SIZE - 6
                        pygame.draw.line(self.screen, (50, 130, 40), (gx, gy), (gx + 2, gy - 8), 1)
                elif tile == TILE_WATER:
                    wave = math.sin(time_offset * 2 + x * 0.5) * 2
                    pygame.draw.line(self.screen, (80, 160, 255), (px + 2, py + 8 + wave), (px + TILE_SIZE - 4, py + 8 + wave), 1)
                elif tile == TILE_HEAL:
                    pygame.draw.rect(self.screen, COLOR_RED, (px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8))
                    pygame.draw.line(self.screen, COLOR_WHITE, (px + 8, py + 6), (px + 8, py + TILE_SIZE - 6), 2)
                    pygame.draw.line(self.screen, COLOR_WHITE, (px + 4, py + 10), (px + 12, py + 10), 2)
                elif tile == TILE_SHOP:
                    pygame.draw.rect(self.screen, COLOR_BLUE, (px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8))
                    self.draw_text(px + 6, py + 6, "S", COLOR_WHITE, self.font_small)
                elif tile == TILE_GYM:
                    pygame.draw.rect(self.screen, COLOR_YELLOW, (px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4))
                    pygame.draw.rect(self.screen, COLOR_BLACK, (px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8))
                    self.draw_text(px + 6, py + 6, "G", COLOR_YELLOW, self.font_small)
                elif tile == TILE_SIGN:
                    pygame.draw.rect(self.screen, (139, 119, 73), (px + 6, py + 8, TILE_SIZE - 12, TILE_SIZE - 10))
                    pygame.draw.rect(self.screen, (100, 80, 50), (px + 10, py + TILE_SIZE - 4, 4, 6))

        for npc in game_map.npcs:
            nx = npc["x"] * TILE_SIZE
            ny = npc["y"] * TILE_SIZE
            npc_type = npc.get("type", "talker")
            self._draw_npc_sprite(nx, ny, TILE_SIZE, npc_type)

        px = player_x * TILE_SIZE
        py = player_y * TILE_SIZE
        self._draw_player_ow_sprite(px, py, TILE_SIZE)

    def draw_hud(self, player_state, map_name, time_offset=0):
        self.draw_box(0, 0, 480, 22, bg=(20, 20, 30))
        self.draw_text(8, 4, f"Map: {map_name}", COLOR_WHITE, self.font_small)
        self.draw_text(200, 4, f"Steps: {player_state.step_counter}", COLOR_GRAY, self.font_small)
        self.draw_text(320, 4, f"$: {player_state.money}", COLOR_YELLOW, self.font_small)
        badges = len(player_state.badges)
        self.draw_text(420, 4, f"Badges: {badges}/8", COLOR_LIGHT_GRAY, self.font_small)

    def draw_dialog_box(self, text, speaker=""):
        self.draw_box(10, 350, 460, 120)
        if speaker:
            self.draw_text(20, 355, speaker, COLOR_YELLOW, self.font)
        lines = self._wrap_text(text, 440)
        for i, line in enumerate(lines[:4]):
            self.draw_text(20, 375 + i * 18, line, COLOR_WHITE)
        self.draw_text(420, 455, "Scroll/Click", COLOR_GRAY, self.font_small)

    def draw_text_box(self, lines, title=""):
        self.draw_box(10, 50, 460, 380)
        if title:
            self.draw_text(240, 58, title, COLOR_YELLOW, self.font, center=True)
        y = 80
        for line in lines:
            self.draw_text(20, y, line, COLOR_WHITE, self.font_small)
            y += 16

    def draw_party_menu(self, party, selected=0):
        self.draw_box(10, 30, 460, 420, bg=COLOR_MENUBG)
        self.draw_text(240, 38, "YOUR TEAM", COLOR_YELLOW, self.font, center=True)
        for i, c in enumerate(party):
            y = 65 + i * 65
            is_sel = (i == selected)
            if is_sel:
                self.draw_rect(16, y, 448, 60, COLOR_SELECT, alpha=80)
            self.draw_box(16, y, 448, 60, color=COLOR_SELECT if is_sel else COLOR_WHITE)
            self.draw_creature_sprite(24, y + 5, 50, c.dex, c.level)
            self.draw_text(85, y + 8, c.name, COLOR_WHITE, self.font)
            self.draw_text(85, y + 24, f"Lv.{c.level}", COLOR_GRAY, self.font_small)
            type_str = "/".join(c.types)
            self.draw_text(85, y + 38, type_str, TYPE_COLORS.get(c.types[0], COLOR_GRAY), self.font_small)
            hp_ratio = c.hp / max(1, c.max_hp)
            self.draw_hp_bar(280, y + 20, 180, 8, hp_ratio)
            self.draw_text(280, y + 32, f"HP: {c.hp}/{c.max_hp}", COLOR_WHITE, self.font_small)
            self.draw_text(280, y + 46, f"ATK:{c.stats[1]} DEF:{c.stats[2]}", COLOR_GRAY, self.font_small)

    def draw_inventory(self, inventory, selected=0):
        self.draw_box(10, 30, 460, 420, bg=COLOR_MENUBG)
        self.draw_text(240, 38, "INVENTORY", COLOR_YELLOW, self.font, center=True)
        items = [(k, v) for k, v in inventory.items() if v > 0]
        for i, (item, count) in enumerate(items):
            y = 65 + i * 35
            is_sel = (i == selected)
            if is_sel:
                self.draw_rect(16, y, 448, 30, COLOR_SELECT, alpha=80)
            self.draw_text(24, y + 8, f"{item} x{count}", COLOR_WHITE if is_sel else COLOR_LIGHT_GRAY, self.font)
        if not items:
            self.draw_text(240, 200, "No items!", COLOR_GRAY, self.font, center=True)

    def draw_move_menu(self, moves, selected=0, creature=None, new_move_name=""):
        self.draw_box(10, 30, 460, 200, bg=COLOR_MENUBG)
        title = "FORGET A MOVE" if new_move_name else "CHOOSE MOVE"
        if new_move_name:
            self.draw_text(240, 38, f"Learn {new_move_name} - Forget which?", COLOR_YELLOW, self.font, center=True)
        else:
            self.draw_text(240, 38, title, COLOR_YELLOW, self.font, center=True)
        for i, mv in enumerate(moves):
            y = 60 + i * 38
            is_sel = (i == selected)
            if is_sel:
                self.draw_rect(16, y, 448, 34, COLOR_SELECT, alpha=80)
            from .moves import get_move
            md = get_move(mv["id"])
            if md:
                tc = TYPE_COLORS.get(md.type, COLOR_GRAY)
                self.draw_rect(20, y + 4, 6, 26, tc)
                self.draw_text(32, y + 4, md.name, COLOR_WHITE if is_sel else COLOR_LIGHT_GRAY, self.font)
                self.draw_text(32, y + 18, f"PP: {mv['pp']}/{mv['max_pp']}", COLOR_GRAY, self.font_small)
                if md.power > 0:
                    self.draw_text(200, y + 4, f"Power: {md.power}", COLOR_LIGHT_GRAY, self.font_small)
                self.draw_text(200, y + 18, f"Acc: {md.accuracy}%", COLOR_LIGHT_GRAY, self.font_small)

    def draw_evolution_screen(self, old_dex, new_dex, time_offset=0):
        self.draw_box(20, 40, 440, 400)
        self.draw_text(240, 60, "EVOLUTION!", COLOR_YELLOW, self.font_title, center=True)
        from .creatures import CREATURE_DB
        old_t = CREATURE_DB.get(old_dex)
        new_t = CREATURE_DB.get(new_dex)
        if old_t:
            self.draw_text(140, 150, old_t.name, COLOR_WHITE, self.font, center=True)
            self.draw_creature_sprite(110, 180, 80, old_dex, 1)
        self.draw_text(240, 220, ">>>", COLOR_YELLOW, self.font_large, center=True)
        if new_t:
            self.draw_text(340, 150, new_t.name, COLOR_YELLOW, self.font, center=True)
            scale = min(1.0, 0.5 + (math.sin(time_offset * 3) + 1) * 0.3)
            self.draw_creature_sprite(310, 180, int(80 * scale), new_dex, 1)
        self.draw_text(240, 350, "Congratulations!", COLOR_WHITE, self.font, center=True)

    def draw_start_screen(self, time_offset=0):
        for y in range(480):
            ratio = y / 480
            r = int(20 + 30 * ratio)
            g = int(20 + 40 * ratio)
            b = int(40 + 60 * ratio)
            pygame.draw.line(self.screen, (r, g, b), (0, y), (480, y))

        bob = math.sin(time_offset * 2) * 5
        self.draw_text(240, 100 + int(bob), "MINIMON", COLOR_YELLOW, self.font_title, center=True)
        self.draw_text(240, 140, "A Mini-Collecting Adventure", COLOR_LIGHT_GRAY, self.font, center=True)

        creatures_to_show = [1, 4, 2, 5, 3, 6]
        for i, dex in enumerate(creatures_to_show):
            cx = 80 + (i % 3) * 140
            cy = 200 + (i // 3) * 100
            self.draw_creature_sprite(cx, cy, 60, dex, 5)

        self.draw_text(240, 380, "Scroll to Start", COLOR_WHITE, self.font, center=True)
        self.draw_text(240, 400, "Rabbit R1 Edition", COLOR_GRAY, self.font_small, center=True)
        self.draw_text(240, 420, "Scroll = Navigate  |  Click = Select", COLOR_GRAY, self.font_small, center=True)

    def draw_ow_character(self, x, y, facing, time_offset=0):
        pass

    def draw_interact_bubble(self, x, y, time_offset=0):
        bob = math.sin(time_offset * 4) * 2
        bx = x
        by = int(y + bob)
        bubble_w, bubble_h = 20, 18
        pygame.draw.ellipse(self.screen, COLOR_WHITE, (bx - bubble_w // 2, by - bubble_h // 2, bubble_w, bubble_h))
        pygame.draw.ellipse(self.screen, COLOR_BLACK, (bx - bubble_w // 2, by - bubble_h // 2, bubble_w, bubble_h), 1)
        self.draw_text(bx, by - 6, "?", COLOR_BLACK, self.font, center=True)
        pygame.draw.polygon(self.screen, COLOR_WHITE, [(bx - 3, by + bubble_h // 2 - 2),
                                                       (bx + 3, by + bubble_h // 2 - 2),
                                                       (bx, by + bubble_h // 2 + 4)])
        pygame.draw.polygon(self.screen, COLOR_BLACK, [(bx - 3, by + bubble_h // 2 - 2),
                                                       (bx + 3, by + bubble_h // 2 - 2),
                                                       (bx, by + bubble_h // 2 + 4)], 1)

    def _wrap_text(self, text, max_width):
        words = text.split(" ")
        lines = []
        current = ""
        for word in words:
            test = current + " " + word if current else word
            if self.font_small.size(test)[0] < max_width:
                current = test
            else:
                lines.append(current)
                current = word
        if current:
            lines.append(current)
        return lines
