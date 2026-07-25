// Minimon - Renderer (Canvas 2D)
class Renderer {
  constructor(ctx, w, h) {
    this.ctx = ctx; this.w = w; this.h = h;
  }
  clear() { this.ctx.fillStyle = rgb(COL_BG); this.ctx.fillRect(0, 0, this.w, this.h); }

  text(x, y, txt, color, size, center) {
    const ctx = this.ctx; ctx.fillStyle = rgb(color || COL_WHITE);
    ctx.font = (size || 14) + "px monospace"; ctx.textAlign = center ? "center" : "left";
    ctx.fillText(txt, x, y); ctx.textAlign = "left";
  }

  rect(x, y, w, h, color, alpha) {
    const ctx = this.ctx;
    if (alpha !== undefined) { ctx.globalAlpha = alpha; ctx.fillStyle = rgb(color); ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1; }
    else { ctx.fillStyle = rgb(color); ctx.fillRect(x, y, w, h); }
  }

  box(x, y, w, h, color, bg) {
    this.rect(x, y, w, h, bg || COL_MENUBG);
    this.ctx.strokeStyle = rgb(color || COL_WHITE); this.ctx.lineWidth = 2; this.ctx.strokeRect(x, y, w, h);
  }

  hpBar(x, y, w, h, ratio) {
    this.rect(x, y, w, h, COL_GRAY);
    const fw = Math.floor(w * Math.max(0, Math.min(1, ratio)));
    const col = ratio > 0.5 ? COL_HPG : ratio > 0.2 ? COL_HPY : COL_HPR;
    if (fw > 0) this.rect(x, y, fw, h, col);
  }

  menuCursor(x, y, t) {
    const off = Math.floor(Math.sin(t * 4) * 2);
    this.ctx.fillStyle = rgb(COL_YELLOW);
    this.ctx.beginPath(); this.ctx.moveTo(x + off, y); this.ctx.lineTo(x + 8 + off, y + 4); this.ctx.lineTo(x + off, y + 8); this.ctx.fill();
  }

  creatureSprite(x, y, size, dex, level, isEnemy) {
    drawCreature(this.ctx, x, y, size, dex, isEnemy);
    if (level !== undefined) this.text(x + size / 2, y + size + 12, "Lv." + level, COL_WHITE, 11, true);
  }

  npcSprite(x, y, size, npcType) { drawNPC(this.ctx, x, y, size, npcType); }
  playerSprite(x, y, size) { drawPlayer(this.ctx, x, y, size); }

  townMap(m, px, py, t) {
    const ctx = this.ctx;
    for (let y = 0; y < Math.min(m.height, MAP_Y); y++) {
      for (let x = 0; x < Math.min(m.width, MAP_X); x++) {
        const tile = getT(m, x, y);
        const col = TILE_COLORS[tile] || COL_GRAY;
        const sx = x * TILE, sy = y * TILE;
        ctx.fillStyle = rgb(col); ctx.fillRect(sx, sy, TILE - 1, TILE - 1);
        if (tile === TILE_TGRASS) {
          ctx.strokeStyle = rgb([50, 130, 40]); ctx.lineWidth = 1;
          for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(sx + 4 + i * 7, sy + TILE - 6); ctx.lineTo(sx + 6 + i * 7, sy + TILE - 14); ctx.stroke(); }
        } else if (tile === TILE_WATER) {
          const wave = Math.sin(t * 2 + x * 0.5) * 2;
          ctx.strokeStyle = rgb([80, 160, 255]); ctx.lineWidth = 1; ctx.beginPath();
          ctx.moveTo(sx + 2, sy + 8 + wave); ctx.lineTo(sx + TILE - 4, sy + 8 + wave); ctx.stroke();
        } else if (tile === TILE_HEAL) {
          ctx.fillStyle = rgb(COL_RED); ctx.fillRect(sx + 4, sy + 4, TILE - 8, TILE - 8);
          ctx.strokeStyle = rgb(COL_WHITE); ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(sx + 8, sy + 6); ctx.lineTo(sx + 8, sy + TILE - 6); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(sx + 4, sy + 10); ctx.lineTo(sx + 12, sy + 10); ctx.stroke();
        } else if (tile === TILE_SHOP) {
          ctx.fillStyle = rgb(COL_BLUE); ctx.fillRect(sx + 4, sy + 4, TILE - 8, TILE - 8);
          this.text(sx + 7, sy + 16, "S", COL_WHITE, 12);
        } else if (tile === TILE_GYM) {
          ctx.fillStyle = rgb(COL_YELLOW); ctx.fillRect(sx + 2, sy + 2, TILE - 4, TILE - 4);
          ctx.fillStyle = rgb(COL_BLACK); ctx.fillRect(sx + 4, sy + 4, TILE - 8, TILE - 8);
          this.text(sx + 7, sy + 16, "G", COL_YELLOW, 12);
        } else if (tile === TILE_SIGN) {
          ctx.fillStyle = rgb([139, 119, 73]); ctx.fillRect(sx + 6, sy + 8, TILE - 12, TILE - 10);
          ctx.fillStyle = rgb([100, 80, 50]); ctx.fillRect(sx + 10, sy + TILE - 4, 4, 6);
        }
      }
    }
    // NPCs
    for (const npc of m.npcs) this.npcSprite(npc.x * TILE, npc.y * TILE, TILE, npc.type);
    // Player
    this.playerSprite(px * TILE, py * TILE, TILE);
  }

  hud(player, mapName) {
    this.box(0, 0, SCREEN_W, 22, COL_WHITE, [20, 20, 30]);
    this.text(8, 16, "Map: " + mapName, COL_WHITE, 11);
    this.text(200, 16, "Steps: " + player.stepCounter, COL_GRAY, 11);
    this.text(320, 16, "$: " + player.money, COL_YELLOW, 11);
    this.text(420, 16, "Badges: " + player.badges.length + "/8", COL_LGRAY, 11);
  }

  dialogBox(text, speaker) {
    this.box(10, 350, 460, 120);
    if (speaker) this.text(20, 368, speaker, COL_YELLOW, 14);
    const lines = this.wrapText(text, 440);
    for (let i = 0; i < Math.min(lines.length, 4); i++) this.text(20, 386 + i * 18, lines[i], COL_WHITE, 14);
    this.text(420, 462, "Click/Scroll", COL_GRAY, 11);
  }

  battleScene(p, e, t) {
    const ctx = this.ctx;
    // Background gradient
    for (let y = 0; y < 240; y++) {
      const r = y / 240;
      ctx.fillStyle = `rgb(${Math.floor(60 - 20 * r)},${Math.floor(80 - 20 * r)},${Math.floor(120 - 30 * r)})`;
      ctx.fillRect(0, y, SCREEN_W, 1);
    }
    // Platforms
    ctx.fillStyle = rgb([80, 120, 60]); ctx.beginPath(); ctx.ellipse(110, 170, 90, 20, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = rgb([60, 100, 50]); ctx.beginPath(); ctx.ellipse(370, 175, 90, 22, 0, 0, Math.PI * 2); ctx.fill();
    // Enemy
    if (e) {
      const bob = Math.sin(t * 2) * 3;
      this.creatureSprite(330, 90 + Math.floor(bob), 80, e.dex);
      this.box(300, 175, 170, 55);
      this.text(308, 190, e.name, COL_WHITE, 12);
      this.text(308, 205, "Lv." + e.level, COL_GRAY, 11);
      this.text(380, 205, e.types.join("/"), TYPE_COLORS[e.types[0]] || COL_GRAY, 11);
      this.hpBar(308, 218, 155, 6, e.hp / Math.max(1, e.maxHP));
    }
    // Player
    if (p) {
      const bob = Math.sin(t * 2 + 1) * 3;
      this.creatureSprite(40, 170 + Math.floor(bob), 100, p.dex);
      this.box(10, 240, 210, 65);
      this.text(18, 255, p.name, COL_WHITE, 14);
      this.text(18, 270, "Lv." + p.level, COL_GRAY, 11);
      this.text(90, 270, p.types.join("/"), TYPE_COLORS[p.types[0]] || COL_GRAY, 11);
      this.hpBar(18, 288, 195, 8, p.hp / Math.max(1, p.maxHP));
      this.text(140, 286, p.hp + "/" + p.maxHP, COL_WHITE, 11);
    }
  }

  startScreen(t) {
    const ctx = this.ctx;
    for (let y = 0; y < SCREEN_H; y++) {
      const r = y / SCREEN_H;
      ctx.fillStyle = `rgb(${Math.floor(20 + 30 * r)},${Math.floor(20 + 40 * r)},${Math.floor(40 + 60 * r)})`;
      ctx.fillRect(0, y, SCREEN_W, 1);
    }
    const bob = Math.sin(t * 2) * 5;
    this.text(240, 100 + Math.floor(bob), "MINIMON", COL_YELLOW, 28, true);
    this.text(240, 140, "A Mini-Collecting Adventure", COL_LGRAY, 14, true);
    const show = [1, 4, 2, 5, 3, 6];
    for (let i = 0; i < show.length; i++) {
      this.creatureSprite(80 + (i % 3) * 140, 200 + Math.floor(i / 3) * 100, 60, show[i], 5);
    }
    this.text(240, 380, "Scroll/Click to Start", COL_WHITE, 14, true);
    this.text(240, 400, "Rabbit R1 Edition", COL_GRAY, 11, true);
    this.text(240, 420, "Scroll = Navigate | Click = Select", COL_GRAY, 11, true);
  }

  evolveScreen(oldDex, newDex, t) {
    this.box(20, 40, 440, 400);
    this.text(240, 60, "EVOLUTION!", COL_YELLOW, 24, true);
    const ot = CREATURES[oldDex], nt = CREATURES[newDex];
    if (ot) { this.text(140, 150, ot.name, COL_WHITE, 14, true); this.creatureSprite(110, 180, 80, oldDex, 1); }
    this.text(240, 220, ">>>", COL_YELLOW, 18, true);
    if (nt) { this.text(340, 150, nt.name, COL_YELLOW, 14, true); const sc = Math.min(1, 0.5 + (Math.sin(t * 3) + 1) * 0.3); this.creatureSprite(310, 180, Math.floor(80 * sc), newDex, 1); }
    this.text(240, 350, "Congratulations!", COL_WHITE, 14, true);
  }

  partyMenu(party, sel) {
    this.box(10, 30, 460, 420); this.text(240, 48, "YOUR TEAM", COL_YELLOW, 14, true);
    for (let i = 0; i < party.length; i++) {
      const c = party[i]; const y = 65 + i * 65;
      if (i === sel) this.rect(16, y, 448, 60, COL_SELECT, 0.3);
      this.box(16, y, 448, 60, i === sel ? COL_SELECT : COL_WHITE);
      this.creatureSprite(24, y + 5, 50, c.dex, c.level);
      this.text(85, y + 20, c.name, COL_WHITE, 14);
      this.text(85, y + 36, "Lv." + c.level, COL_GRAY, 11);
      this.text(85, y + 50, c.types.join("/"), TYPE_COLORS[c.types[0]] || COL_GRAY, 11);
      this.hpBar(280, y + 20, 180, 8, c.hp / Math.max(1, c.maxHP));
      this.text(280, y + 38, "HP: " + c.hp + "/" + c.maxHP, COL_WHITE, 11);
      this.text(280, y + 52, "ATK:" + c.stats[1] + " DEF:" + c.stats[2], COL_GRAY, 11);
    }
  }

  inventoryMenu(inv, sel) {
    this.box(10, 30, 460, 420); this.text(240, 48, "INVENTORY", COL_YELLOW, 14, true);
    const items = Object.entries(inv).filter(([, v]) => v > 0);
    for (let i = 0; i < items.length; i++) {
      const [item, count] = items[i]; const y = 65 + i * 35;
      if (i === sel) this.rect(16, y, 448, 30, COL_SELECT, 0.3);
      this.text(24, y + 18, item + " x" + count, i === sel ? COL_WHITE : COL_LGRAY, 14);
    }
    if (!items.length) this.text(240, 200, "No items!", COL_GRAY, 14, true);
  }

  moveMenu(moves, sel, creature, newMoveName) {
    this.box(10, 30, 460, 200);
    this.text(240, 48, newMoveName ? "Learn " + newMoveName + " - Forget which?" : "CHOOSE MOVE", COL_YELLOW, 14, true);
    for (let i = 0; i < moves.length; i++) {
      const mv = moves[i]; const y = 60 + i * 38; const md = MOVES[mv.id]; if (!md) continue;
      if (i === sel) this.rect(16, y, 448, 34, COL_SELECT, 0.3);
      const tc = TYPE_COLORS[md.type] || COL_GRAY; this.rect(20, y + 4, 6, 26, tc);
      this.text(32, y + 16, md.name, i === sel ? COL_WHITE : COL_LGRAY, 14);
      this.text(32, y + 30, "PP: " + mv.pp + "/" + mv.maxPP, COL_GRAY, 11);
      if (md.power > 0) this.text(200, y + 16, "Power: " + md.power, COL_LGRAY, 11);
      this.text(200, y + 30, "Acc: " + md.accuracy + "%", COL_LGRAY, 11);
    }
  }

  tmSelectMenu(compatible, sel, moveName, tmItemId) {
    this.box(10, 30, 460, 420); this.text(240, 48, "Teach " + moveName + " to?", COL_YELLOW, 14, true);
    for (let i = 0; i < compatible.length; i++) {
      const c = compatible[i]; const y = 65 + i * 65;
      if (i === sel) this.rect(16, y, 448, 60, COL_SELECT, 0.3);
      this.box(16, y, 448, 60, i === sel ? COL_SELECT : COL_WHITE);
      this.creatureSprite(24, y + 5, 50, c.dex, c.level);
      this.text(85, y + 20, c.name, COL_WHITE, 14);
      this.text(85, y + 36, "Lv." + c.level, COL_GRAY, 11);
      this.text(85, y + 50, c.types.join("/"), TYPE_COLORS[c.types[0]] || COL_GRAY, 11);
      const tmMoveId = tmItemId ? TM_MOVES[tmItemId] : null;
      const hasMove = tmMoveId ? c.moves.find(m => m.id === tmMoveId) : false;
      this.text(280, y + 20, hasMove ? "Already knows" : (c.moves.length >= 4 ? "4 moves - must forget" : "OK to learn"), hasMove ? COL_RED : COL_LGRAY, 11);
    }
    this.text(240, 460, "Scroll = Select | Right-click = Cancel", COL_GRAY, 11, true);
  }

  shopMenu(items, sel, money) {
    this.box(10, 30, 460, 420); this.text(240, 48, "SHOP", COL_YELLOW, 14, true);
    this.text(400, 48, "$" + money, COL_YELLOW, 11);
    const maxV = 10; const off = Math.max(0, sel - maxV + 1);
    for (let i = off; i < Math.min(items.length, off + maxV); i++) {
      const item = items[i]; const y = 65 + (i - off) * 35;
      if (i === sel) this.rect(16, y, 448, 30, COL_SELECT, 0.3);
      const price = PRICES[item] || 100; const canBuy = money >= price;
      this.text(24, y + 18, item + " - $" + price, i === sel ? COL_WHITE : (canBuy ? COL_LGRAY : COL_GRAY), 14);
    }
  }

  dpad(cx, cy, r, bs) {
    const ctx = this.ctx; ctx.globalAlpha = 0.25;
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (const [dx, dy] of dirs) {
      const bx = cx + dx * r - bs / 2, by = cy + dy * r - bs / 2;
      ctx.fillStyle = rgb(COL_WHITE); ctx.fillRect(bx, by, bs, bs);
      ctx.strokeStyle = rgb(COL_LGRAY); ctx.lineWidth = 1; ctx.strokeRect(bx, by, bs, bs);
    }
    ctx.globalAlpha = 1;
  }

  interactBubble(x, y, t) {
    const ctx = this.ctx; const bob = Math.sin(t * 4) * 2;
    const by = y + bob;
    ctx.fillStyle = rgb(COL_WHITE); ctx.beginPath(); ctx.ellipse(x, by, 10, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = rgb(COL_BLACK); ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, by, 10, 9, 0, 0, Math.PI * 2); ctx.stroke();
    this.text(x, by + 4, "?", COL_BLACK, 14, true);
    ctx.fillStyle = rgb(COL_WHITE); ctx.beginPath(); ctx.moveTo(x - 3, by + 7); ctx.lineTo(x + 3, by + 7); ctx.lineTo(x, by + 12); ctx.fill();
  }

  wrapText(text, maxW) {
    const ctx = this.ctx; const words = text.split(" "); const lines = []; let cur = "";
    for (const word of words) {
      const test = cur ? cur + " " + word : word;
      if (ctx.measureText(test).width < maxW) cur = test; else { if (cur) lines.push(cur); cur = word; }
    }
    if (cur) lines.push(cur); return lines;
  }
}
