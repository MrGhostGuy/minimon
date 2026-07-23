import pygame
import math
from .config import *


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
        from .creatures import CREATURE_DB
        template = CREATURE_DB.get(dex_num, None)
        if not template:
            color = (200, 200, 200)
        else:
            color = template.color

        cx = x + size // 2
        cy = y + size // 2

        if template:
            body_w = int(size * 0.7)
            body_h = int(size * 0.6)
            body_x = cx - body_w // 2
            body_y = cy - body_h // 4
            pygame.draw.ellipse(self.screen, color, (body_x, body_y, body_w, body_h))

            eye_size = max(2, size // 12)
            eye_y = cy - body_h // 6
            if is_enemy:
                pygame.draw.circle(self.screen, COLOR_WHITE, (cx - body_w // 4, eye_y), eye_size)
                pygame.draw.circle(self.screen, COLOR_BLACK, (cx - body_w // 4, eye_y), eye_size // 2)
            else:
                pygame.draw.circle(self.screen, COLOR_WHITE, (cx + body_w // 4, eye_y), eye_size)
                pygame.draw.circle(self.screen, COLOR_BLACK, (cx + body_w // 4, eye_y), eye_size // 2)

            t_colors = [TYPE_COLORS.get(t, (128, 128, 128)) for t in template.types]
            for i, tc in enumerate(t_colors[:2]):
                pygame.draw.circle(self.screen, tc, (cx - 8 + i * 16, y + 4), 4)

        self.draw_text(cx, y + size + 2, f"Lv.{level}", COLOR_WHITE, self.font_small, center=True)

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
            self.draw_creature_sprite(330, 90 + int(bob), 80, enemy_creature.dex, enemy_creature.level, is_enemy=True)
            hp_ratio = enemy_creature.hp / max(1, enemy_creature.max_hp)
            self.draw_box(300, 175, 170, 48)
            self.draw_text(308, 178, enemy_creature.name, COLOR_WHITE, self.font_small)
            self.draw_text(308, 192, f"Lv.{enemy_creature.level}", COLOR_GRAY, self.font_small)
            self.draw_hp_bar(308, 208, 155, 6, hp_ratio)

        if player_creature:
            bob = math.sin(time_offset * 2 + 1) * 3
            self.draw_creature_sprite(40, 170 + int(bob), 100, player_creature.dex, player_creature.level, is_enemy=False)
            hp_ratio = player_creature.hp / max(1, player_creature.max_hp)
            self.draw_box(10, 240, 200, 60)
            self.draw_text(18, 243, player_creature.name, COLOR_WHITE, self.font)
            self.draw_text(18, 258, f"Lv.{player_creature.level}", COLOR_GRAY, self.font_small)
            self.draw_text(100, 258, f"HP: {player_creature.hp}/{player_creature.max_hp}", COLOR_WHITE, self.font_small)
            self.draw_hp_bar(18, 278, 185, 8, hp_ratio)
            self.draw_text(145, 275, f"{player_creature.hp}/{player_creature.max_hp}", COLOR_WHITE, self.font_small)

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

        for npc in game_map.npcs:
            nx = npc["x"] * TILE_SIZE
            ny = npc["y"] * TILE_SIZE
            if npc["type"] == "gym_leader":
                color = COLOR_YELLOW
            elif npc["type"] == "trainer":
                color = COLOR_RED
            elif npc["type"] == "professor":
                color = COLOR_GREEN
            else:
                color = (200, 160, 120)
            pygame.draw.ellipse(self.screen, color, (nx + 2, ny + 2, TILE_SIZE - 4, TILE_SIZE - 4))
            pygame.draw.circle(self.screen, COLOR_WHITE, (nx + 8, ny + 6), 2)
            pygame.draw.circle(self.screen, COLOR_WHITE, (nx + 14, ny + 6), 2)

        px = player_x * TILE_SIZE
        py = player_y * TILE_SIZE
        pygame.draw.ellipse(self.screen, (50, 200, 250), (px + 3, py + 3, TILE_SIZE - 6, TILE_SIZE - 6))
        pygame.draw.circle(self.screen, COLOR_WHITE, (px + 8, py + 7), 2)
        pygame.draw.circle(self.screen, COLOR_WHITE, (px + 14, py + 7), 2)

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
        self.draw_text(420, 455, "v Scroll", COLOR_GRAY, self.font_small)

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

    def draw_ow_character(self, x, y, facing, time_offset=0):
        px = x * TILE_SIZE
        py = y * TILE_SIZE
        bob = math.sin(time_offset * 6) * 1

        pygame.draw.ellipse(self.screen, (50, 180, 240), (px + 4, py + 6 + int(bob), TILE_SIZE - 8, TILE_SIZE - 10))
        pygame.draw.circle(self.screen, (255, 220, 180), (px + TILE_SIZE // 2, py + 4), 6)
        pygame.draw.circle(self.screen, COLOR_BLACK, (px + TILE_SIZE // 2, py + 4), 6, 1)

        if facing == "down":
            pygame.draw.circle(self.screen, COLOR_BLACK, (px + 9, py + 4), 1)
            pygame.draw.circle(self.screen, COLOR_BLACK, (px + 14, py + 4), 1)
        elif facing == "up":
            pygame.draw.ellipse(self.screen, (80, 50, 30), (px + 7, py + 1, 9, 4))
        elif facing == "left":
            pygame.draw.circle(self.screen, COLOR_BLACK, (px + 8, py + 3), 1)
        elif facing == "right":
            pygame.draw.circle(self.screen, COLOR_BLACK, (px + 15, py + 3), 1)

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
