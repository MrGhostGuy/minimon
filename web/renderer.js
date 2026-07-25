// Minimon - Renderer (Canvas 2D) - Enhanced with Battle Effects
class Renderer {
  constructor(ctx, w, h) {
    this.ctx = ctx; this.w = w; this.h = h;
    this.shakeX = 0; this.shakeY = 0; this.shakeDur = 0;
    this.particles = []; this.damageNums = [];
    this.flashAlpha = 0; this.flashColor = [255,255,255];
    this.statusGlow = {}; this.legendaryIntro = 0;
    this.battleAnim = null; // {type, timer, target}
    this.mapTransition = 0; // map transition fade
    this.mapTransitionDir = 0; // 1=fade out, -1=fade in
    this.hpDisplayLerp = {}; // smooth HP bar transitions
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
    for (const npc of m.npcs) this.npcSprite(npc.x * TILE, npc.y * TILE, TILE, npc.type);
    this.playerSprite(px * TILE, py * TILE, TILE);
  }

  hud(player, mapName) {
    this.box(0, 0, SCREEN_W, 22, COL_WHITE, [20, 20, 30]);
    this.text(8, 16, "Map: " + mapName, COL_WHITE, 11);
    this.text(160, 16, "Steps: " + player.stepCounter, COL_GRAY, 11);
    this.text(270, 16, "$: " + player.money, COL_YELLOW, 11);
    // Badge display
    const badgeStr = "Badges: " + player.badges.length + "/8";
    this.text(370, 16, badgeStr, player.badges.length >= 8 ? COL_YELLOW : COL_LGRAY, 11);
    // Mini party HP indicators at top-right
    if (player.party.length) {
      const startX = SCREEN_W - player.party.length * 16;
      for (let i = 0; i < player.party.length; i++) {
        const c = player.party[i];
        const x = startX + i * 16;
        const ratio = c.hp / Math.max(1, c.maxHP);
        const col = !c.isAlive() ? COL_GRAY : ratio > 0.5 ? COL_HPG : ratio > 0.2 ? COL_HPY : COL_HPR;
        this.rect(x, 4, 14, 4, col);
        if (c.status) {
          const sCol = {burn:[255,120,20],poison:[180,60,200],paralyze:[255,240,60],freeze:[150,220,255],sleep:[160,160,200]}[c.status]||COL_RED;
          this.rect(x, 9, 14, 2, sCol);
        }
      }
    }
  }

  dialogBox(text, speaker) {
    this.box(10, 350, 460, 120);
    if (speaker) this.text(20, 368, speaker, COL_YELLOW, 14);
    const lines = this.wrapText(text, 440);
    for (let i = 0; i < Math.min(lines.length, 4); i++) this.text(20, 386 + i * 18, lines[i], COL_WHITE, 14);
    this.text(420, 462, "Click/Scroll", COL_GRAY, 11);
  }

  // ===== BATTLE SCENE WITH EFFECTS =====
  battleScene(p, e, t) {
    const ctx = this.ctx;
    // Apply screen shake
    ctx.save();
    if (this.shakeDur > 0) {
      ctx.translate(this.shakeX, this.shakeY);
    }
    // Background gradient - Pokemon-style split
    for (let y = 0; y < 240; y++) {
      const r = y / 240;
      const isUpper = y < 120;
      if (isUpper) {
        // Enemy side - darker, cooler tones
        ctx.fillStyle = `rgb(${Math.floor(50 - 15 * r)},${Math.floor(70 - 15 * r)},${Math.floor(110 - 20 * r)})`;
      } else {
        // Player side - warmer tones
        ctx.fillStyle = `rgb(${Math.floor(60 + 10 * r)},${Math.floor(85 + 5 * r)},${Math.floor(70 - 10 * r)})`;
      }
      ctx.fillRect(0, y, SCREEN_W, 1);
    }
    // Battle platforms (Pokemon-style)
    ctx.fillStyle = rgb([80, 120, 60]); ctx.beginPath(); ctx.ellipse(110, 170, 90, 20, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = rgb([60, 100, 50]); ctx.beginPath(); ctx.ellipse(370, 175, 90, 22, 0, 0, Math.PI * 2); ctx.fill();
    // Platform outlines
    ctx.strokeStyle = rgb([100, 140, 70]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(110, 170, 90, 20, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = rgb([80, 120, 60]);
    ctx.beginPath(); ctx.ellipse(370, 175, 90, 22, 0, 0, Math.PI * 2); ctx.stroke();

    // Enemy
    if (e) {
      const bob = Math.sin(t * 2) * 3;
      const ex = 330, ey = 90 + Math.floor(bob);
      // Check if legendary - draw glow
      if (CREATURES[e.dex] && e.dex >= 75) {
        drawLegendaryCreature(ctx, ex - 10, ey - 10, 100, e.dex, t);
      } else {
        this.creatureSprite(ex, ey, 80, e.dex);
      }
      // Status glow for enemy
      this.drawStatusGlow(ctx, ex + 40, ey + 40, e.status, t);
      this.box(300, 175, 170, 55);
      this.text(308, 190, e.name, COL_WHITE, 12);
      this.text(308, 205, "Lv." + e.level, COL_GRAY, 11);
      this.text(380, 205, e.types.join("/"), TYPE_COLORS[e.types[0]] || COL_GRAY, 11);
      this.hpBar(308, 218, 155, 6, e.hp / Math.max(1, e.maxHP));
    }
    // Player
    if (p) {
      const bob = Math.sin(t * 2 + 1) * 3;
      const px2 = 40, py2 = 170 + Math.floor(bob);
      if (p.dex >= 75) {
        drawLegendaryCreature(ctx, px2 - 10, py2 - 10, 120, p.dex, t);
      } else {
        this.creatureSprite(px2, py2, 100, p.dex);
      }
      // Status glow for player
      this.drawStatusGlow(ctx, px2 + 50, py2 + 50, p.status, t);
      this.box(10, 240, 210, 65);
      this.text(18, 255, p.name, COL_WHITE, 14);
      this.text(18, 270, "Lv." + p.level, COL_GRAY, 11);
      this.text(90, 270, p.types.join("/"), TYPE_COLORS[p.types[0]] || COL_GRAY, 11);
      this.hpBar(18, 288, 195, 8, p.hp / Math.max(1, p.maxHP));
      this.text(140, 286, p.hp + "/" + p.maxHP, COL_WHITE, 11);
      // Stat stages indicator
      this.drawStatStages(ctx, 18, 298, p.statStages);
    }
    // Draw particles
    this.updateParticles(ctx, t);
    // Draw damage numbers
    this.updateDamageNums(ctx, t);
    // Flash overlay
    if (this.flashAlpha > 0) {
      ctx.globalAlpha = this.flashAlpha;
      ctx.fillStyle = rgb(this.flashColor);
      ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  // ===== BATTLE EFFECTS =====
  drawStatusGlow(ctx, x, y, status, t) {
    if (!status) return;
    const pulse = 0.3 + Math.sin(t * 4) * 0.2;
    let col;
    if (status === "burn") col = [255, 120, 20];
    else if (status === "poison") col = [180, 60, 200];
    else if (status === "paralyze") col = [255, 240, 60];
    else if (status === "freeze") col = [150, 220, 255];
    else if (status === "sleep") col = [160, 160, 200];
    else if (status === "leech_seed") col = [80, 200, 80];
    else return;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = rgb(col);
    ctx.beginPath();
    ctx.ellipse(x, y, 15, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  drawStatStages(ctx, x, y, stages) {
    const labels = ["A","D","S","a","d"];
    const vals = [stages[1], stages[2], stages[3], stages[4], stages[5]];
    for (let i = 0; i < 5; i++) {
      if (vals[i] === 0) continue;
      const col = vals[i] > 0 ? COL_GREEN : COL_RED;
      const txt = labels[i] + (vals[i] > 0 ? "+" : "") + vals[i];
      this.text(x + i * 28, y, txt, col, 9);
    }
  }

  // Particle system
  addParticles(x, y, type, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      const life = 0.3 + Math.random() * 0.5;
      let col, size;
      if (type === "fire") { col = [255, 120 + Math.random()*80, 20]; size = 2 + Math.random()*3; }
      else if (type === "water") { col = [60, 140, 255]; size = 2 + Math.random()*2; }
      else if (type === "electric") { col = [255, 255, 60]; size = 1 + Math.random()*2; }
      else if (type === "grass") { col = [60, 200, 60]; size = 2 + Math.random()*3; }
      else if (type === "ice") { col = [180, 230, 255]; size = 2 + Math.random()*3; }
      else if (type === "dark") { col = [100, 60, 140]; size = 3 + Math.random()*3; }
      else if (type === "spirit") { col = [160, 120, 220]; size = 2 + Math.random()*4; }
      else if (type === "dragon") { col = [140, 60, 255]; size = 3 + Math.random()*3; }
      else if (type === "earth") { col = [180, 160, 80]; size = 2 + Math.random()*3; }
      else if (type === "wind") { col = [180, 220, 255]; size = 1 + Math.random()*2; }
      else if (type === "light") { col = [255, 255, 180]; size = 2 + Math.random()*3; }
      else if (type === "hit") { col = [255, 255, 255]; size = 2 + Math.random()*2; }
      else if (type === "crit") { col = [255, 60, 60]; size = 3 + Math.random()*3; }
      else { col = [255, 255, 255]; size = 2; }
      this.particles.push({
        x, y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed - 1,
        life, maxLife: life, col, size
      });
    }
  }

  updateParticles(ctx, t) {
    const dt = 1/30;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.5; // gravity
      p.life -= dt;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = rgb(p.col);
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), Math.ceil(p.size), Math.ceil(p.size));
    }
    ctx.globalAlpha = 1;
  }

  // Floating damage numbers
  addDamageNum(x, y, amount, type) {
    let col = COL_WHITE;
    if (type === "super_effective") col = COL_GREEN;
    else if (type === "not_effective") col = COL_RED;
    else if (type === "critical") col = COL_YELLOW;
    else if (type === "heal") col = COL_HPG;
    this.damageNums.push({ x, y, text: "" + amount, col, life: 1.0, vy: -2 });
  }

  updateDamageNums(ctx, t) {
    const dt = 1/30;
    for (let i = this.damageNums.length - 1; i >= 0; i--) {
      const d = this.damageNums[i];
      d.y += d.vy; d.vy *= 0.95;
      d.life -= dt;
      if (d.life <= 0) { this.damageNums.splice(i, 1); continue; }
      ctx.globalAlpha = Math.max(0, d.life);
      ctx.fillStyle = rgb(d.col);
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "center";
      ctx.fillText(d.text, d.x, d.y);
      ctx.textAlign = "left";
    }
    ctx.globalAlpha = 1;
  }

  // Screen shake
  triggerShake(intensity, duration) {
    this.shakeDur = duration || 0.3;
    this.shakeX = (Math.random() - 0.5) * (intensity || 6);
    this.shakeY = (Math.random() - 0.5) * (intensity || 6);
  }

  // Flash overlay
  triggerFlash(col, alpha) {
    this.flashColor = col || [255,255,255];
    this.flashAlpha = alpha || 0.5;
  }

  // Update effects each frame
  updateEffects(dt) {
    if (this.shakeDur > 0) {
      this.shakeDur -= dt;
      this.shakeX = (Math.random() - 0.5) * 6;
      this.shakeY = (Math.random() - 0.5) * 6;
      if (this.shakeDur <= 0) { this.shakeX = 0; this.shakeY = 0; }
    }
    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - dt * 3);
    }
    // Map transition fade
    if (this.mapTransitionDir !== 0) {
      this.mapTransition += this.mapTransitionDir * dt * 4;
      if (this.mapTransitionDir > 0 && this.mapTransition >= 1) {
        this.mapTransition = 1; this.mapTransitionDir = -1;
      } else if (this.mapTransitionDir < 0 && this.mapTransition <= 0) {
        this.mapTransition = 0; this.mapTransitionDir = 0;
      }
    }
  }

  triggerMapTransition() {
    this.mapTransition = 0; this.mapTransitionDir = 1;
  }

  drawMapTransition() {
    if (this.mapTransition > 0) {
      this.ctx.globalAlpha = this.mapTransition;
      this.ctx.fillStyle = rgb(COL_BLACK);
      this.ctx.fillRect(0, 0, this.w, this.h);
      this.ctx.globalAlpha = 1;
    }
  }

  // Trigger attack animation effects
  triggerAttackFX(moveType, targetX, targetY, isCrit, eff) {
    // Particles based on move type
    const particleType = moveType.toLowerCase();
    this.addParticles(targetX, targetY, particleType, isCrit ? 20 : 12);
    // Hit particles
    this.addParticles(targetX, targetY, "hit", 6);
    if (isCrit) this.addParticles(targetX, targetY, "crit", 10);
    // Screen shake
    this.triggerShake(isCrit ? 10 : 5, 0.2);
    // Flash
    if (eff > 1) this.triggerFlash([100, 255, 100], 0.3);
    else if (eff > 0 && eff < 1) this.triggerFlash([255, 100, 100], 0.2);
    else if (eff === 0) this.triggerFlash([128, 128, 128], 0.2);
    else this.triggerFlash([255, 255, 255], 0.2);
    // Damage number
    this.addDamageNum(targetX, targetY, "", eff > 1 ? "super_effective" : (isCrit ? "critical" : "normal"));
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
    const show = [86, 87, 88, 89, 90];
    for (let i = 0; i < show.length; i++) {
      const dex = show[i];
      const sc = 50 + Math.sin(t * 2 + i) * 5;
      drawLegendaryCreature(ctx, 48 + i * 90, 190 + Math.floor(Math.sin(t*2+i)*3), sc, dex, t);
      const cr = CREATURES[dex];
      if (cr) this.text(48 + i*90 + sc/2, 250, cr.name, COL_YELLOW, 10, true);
    }
    this.text(240, 330, "Scroll/Click to Start", COL_WHITE, 14, true);
    const hasSave = tryHasSave();
    if (hasSave) this.text(240, 350, "Right-click = Continue", COL_GREEN, 12, true);
    this.text(240, 370, "Rabbit R1 Edition", COL_GRAY, 11, true);
    this.text(240, 390, "Created by MrGhostGuy (Jeff Hollaway)", COL_GRAY, 10, true);
    this.text(240, 410, "Scroll = Navigate | Click = Select", COL_GRAY, 11, true);
    // Creature showcase - more variety
    const showcase = [1, 4, 11, 13, 39, 57, 71, 86];
    for (let i = 0; i < showcase.length; i++) {
      const dex = showcase[i];
      const cr = CREATURES[dex];
      if (!cr) continue;
      const sx = 30 + (i % 4) * 115;
      const sy = 425 + Math.floor(i / 4) * 25;
      this.creatureSprite(sx, sy - 10, 20, dex);
    }
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
      // Status indicator
      if (c.status) {
        const sCol = {burn:[255,120,20],poison:[180,60,200],paralyze:[255,240,60],freeze:[150,220,255],sleep:[160,160,200]}[c.status]||COL_RED;
        const sTxt = {burn:"BRN",poison:"PSN",paralyze:"PAR",freeze:"FRZ",sleep:"SLP"}[c.status]||c.status;
        this.text(440, y + 52, sTxt, sCol, 10, true);
      }
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
      if (md.power > 0) this.text(180, y + 16, "Pow:" + md.power, COL_LGRAY, 11);
      this.text(180, y + 30, "Acc:" + md.accuracy + "%", COL_LGRAY, 11);
      // Show category
      this.text(280, y + 16, md.category === PHYSICAL ? "Phys" : md.category === SPECIAL ? "Spec" : "Status", COL_GRAY, 10);
      // Show effect summary
      if (md.effect) {
        const effDesc = {burn:"BRN",freeze:"FRZ",paralyze:"PAR",poison:"PSN",sleep:"SLP",
          flinch:"Flinch",crit_boost:"High Crit",recoil:"Recoil",recover:"Heal",
          multi_hit:"Multi",confuse:"Confuse",leech:"Leech",
          atk_up:"ATK+",def_up:"DEF+",spd_up:"SPD+",satk_up:"SP.ATK+",sdef_up:"SP.DEF+",
          atk_down:"ATK-",def_down:"DEF-",spd_down:"SPD-",satk_down:"SP.ATK-",sdef_down:"SP.DEF-",
          atk_spd_up:"ATK+SPD",protect:"Prot.",sandstorm:"Sand",spite:"Spite"}[md.effect]||md.effect;
        this.text(360, y + 16, effDesc, COL_YELLOW, 9);
      }
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
