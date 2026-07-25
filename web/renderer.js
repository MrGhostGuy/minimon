// Minimon - Renderer (Canvas 2D) - Gen 3-5 Pokemon Style
class Renderer {
  constructor(ctx, w, h) {
    this.ctx = ctx; this.w = w; this.h = h;
    this.shakeX = 0; this.shakeY = 0; this.shakeDur = 0;
    this.particles = []; this.damageNums = [];
    this.flashAlpha = 0; this.flashColor = [255,255,255];
    this.statusGlow = {}; this.legendaryIntro = 0;
    this.battleAnim = null;
    this.mapTransition = 0;
    this.mapTransitionDir = 0;
    this.hpDisplayLerp = {};
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
    const badgeStr = "Badges: " + player.badges.length + "/8";
    this.text(370, 16, badgeStr, player.badges.length >= 8 ? COL_YELLOW : COL_LGRAY, 11);
  }

  dialogBox(text, speaker) {
    this.box(10, 350, 460, 120);
    if (speaker) this.text(20, 368, speaker, COL_YELLOW, 14);
    const lines = this.wrapText(text, 440);
    for (let i = 0; i < Math.min(lines.length, 4); i++) this.text(20, 386 + i * 18, lines[i], COL_WHITE, 14);
    this.text(420, 462, "Click/Scroll", COL_GRAY, 11);
  }

  // ===== TITLE SCREEN - Pokemon Gen 3-5 Style =====
  startScreen(t) {
    const ctx = this.ctx;

    // Rich gradient background (deep blue to purple, like RSE)
    for (let y = 0; y < SCREEN_H; y++) {
      const r = y / SCREEN_H;
      const red = Math.floor(8 + 22 * r);
      const green = Math.floor(12 + 18 * r);
      const blue = Math.floor(50 + 50 * r + 20 * Math.sin(r * 3.14));
      ctx.fillStyle = `rgb(${red},${green},${blue})`;
      ctx.fillRect(0, y, SCREEN_W, 1);
    }

    // Subtle starfield
    for (let i = 0; i < 40; i++) {
      const sx = (i * 137 + 50) % SCREEN_W;
      const sy = (i * 97 + 30) % 200;
      const blink = 0.3 + Math.sin(t * 2 + i * 0.7) * 0.3;
      ctx.globalAlpha = blink;
      ctx.fillStyle = rgb(COL_WHITE);
      ctx.fillRect(sx, sy, 1, 1);
    }
    ctx.globalAlpha = 1;

    // Decorative horizontal lines
    ctx.strokeStyle = rgb([60, 80, 140]);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(20, 65); ctx.lineTo(460, 65); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(20, 315); ctx.lineTo(460, 315); ctx.stroke();

    // MINIMON title with golden metallic gradient
    const bob = Math.sin(t * 2) * 3;
    const titleGrad = ctx.createLinearGradient(100, 68, 100, 108);
    titleGrad.addColorStop(0, '#FFD700');
    titleGrad.addColorStop(0.25, '#FFA500');
    titleGrad.addColorStop(0.5, '#FFD700');
    titleGrad.addColorStop(0.75, '#CD7F32');
    titleGrad.addColorStop(1, '#FFD700');
    ctx.save();
    ctx.shadowColor = 'rgba(255, 200, 0, 0.5)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = titleGrad;
    ctx.font = "bold 36px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("MINIMON", 240, 88 + Math.floor(bob));
    ctx.restore();
    ctx.textBaseline = "alphabetic";

    // Title outline
    ctx.save();
    ctx.strokeStyle = rgb([180, 140, 40]);
    ctx.lineWidth = 1;
    ctx.font = "bold 36px monospace";
    ctx.textAlign = "center";
    ctx.strokeText("MINIMON", 240, 88 + Math.floor(bob));
    ctx.restore();

    // Subtitle
    this.text(240, 118, "A Mini-Collecting RPG Adventure", COL_LGRAY, 13, true);

    // 5 Ultra-Legendary creatures with glow effects
    const show = [86, 87, 88, 89, 90];
    for (let i = 0; i < show.length; i++) {
      const dex = show[i];
      const sc = 44 + Math.sin(t * 2.5 + i * 1.2) * 3;
      const sx = 48 + i * 96;
      const sy = 175 + Math.floor(Math.sin(t * 2 + i * 0.9) * 4);

      // Legendary glow
      const glowPulse = 0.2 + Math.sin(t * 3 + i) * 0.1;
      const cr = CREATURES[dex];
      const glowCol = cr ? cr.color : [255, 200, 50];
      ctx.save();
      ctx.globalAlpha = glowPulse;
      const glowGrad = ctx.createRadialGradient(sx + sc / 2, sy + sc / 2, 5, sx + sc / 2, sy + sc / 2, sc * 0.7);
      glowGrad.addColorStop(0, rgba(glowCol, 0.6));
      glowGrad.addColorStop(1, rgba(glowCol, 0));
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(sx + sc / 2, sy + sc / 2, sc * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();

      drawLegendaryCreature(ctx, sx, sy, sc, dex, t);
      if (cr) this.text(sx + sc / 2, sy + sc + 14, cr.name, COL_YELLOW, 8, true);
    }

    // "Scroll/Click to Start" pulsing text
    const pulse = 0.5 + Math.sin(t * 3) * 0.4;
    ctx.globalAlpha = pulse;
    this.text(240, 260, "Scroll / Click to Start", COL_WHITE, 15, true);
    ctx.globalAlpha = 1;

    // Save indicator
    const hasSave = tryHasSave();
    if (hasSave) {
      const greenPulse = 0.6 + Math.sin(t * 4) * 0.3;
      ctx.globalAlpha = greenPulse;
      this.text(240, 282, "Right-click = Continue", COL_GREEN, 12, true);
      ctx.globalAlpha = 1;
    }

    // Footer
    this.text(240, 380, "Rabbit R1 Edition", COL_GRAY, 11, true);
    this.text(240, 396, "Created by MrGhostGuy (Jeff Hollaway)", COL_GRAY, 10, true);
    this.text(240, 412, "Scroll = Navigate  |  Click = Select", COL_GRAY, 11, true);

    // Bottom creature showcase - 8 diverse creatures in a row
    const showcase = [1, 4, 11, 13, 39, 57, 71, 86];
    // Showcase background
    this.rect(0, 430, SCREEN_W, 50, [15, 18, 35], 0.8);
    ctx.strokeStyle = rgb([50, 70, 120]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 430); ctx.lineTo(SCREEN_W, 430); ctx.stroke();
    for (let i = 0; i < showcase.length; i++) {
      const dex = showcase[i];
      const cr = CREATURES[dex];
      if (!cr) continue;
      const sx = 28 + i * 56;
      const sy = 434;
      this.creatureSprite(sx, sy, 22, dex);
      this.text(sx + 11, sy + 26, cr.name, COL_GRAY, 6, true);
    }
  }

  // ===== BATTLE SCENE - Pokemon RSE/FRLG Style =====
  battleScene(p, e, t) {
    const ctx = this.ctx;
    ctx.save();
    if (this.shakeDur > 0) {
      ctx.translate(this.shakeX, this.shakeY);
    }

    // Sky gradient background (light blue top to green bottom, like RSE)
    for (let y = 0; y < 280; y++) {
      const r = y / 280;
      const red = Math.floor(120 + 40 * r);
      const green = Math.floor(180 - 20 * r + 40 * r * r);
      const blue = Math.floor(220 - 100 * r);
      ctx.fillStyle = `rgb(${red},${green},${blue})`;
      ctx.fillRect(0, y, SCREEN_W, 1);
    }
    // Ground area
    for (let y = 280; y < SCREEN_H; y++) {
      const r = (y - 280) / (SCREEN_H - 280);
      ctx.fillStyle = `rgb(${Math.floor(80 + 40 * r)},${Math.floor(140 + 20 * r)},${Math.floor(60 + 20 * r)})`;
      ctx.fillRect(0, y, SCREEN_W, 1);
    }

    // Distant hills
    ctx.fillStyle = rgb([90, 150, 70]);
    ctx.beginPath();
    ctx.moveTo(0, 260);
    ctx.quadraticCurveTo(120, 230, 240, 255);
    ctx.quadraticCurveTo(360, 235, 480, 258);
    ctx.lineTo(480, 280); ctx.lineTo(0, 280);
    ctx.fill();

    // Battle platforms (Pokemon-style ovals with shading)
    // Player platform (bottom-left)
    ctx.fillStyle = rgb([100, 160, 70]);
    ctx.beginPath(); ctx.ellipse(120, 320, 95, 22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = rgb([80, 130, 55]);
    ctx.beginPath(); ctx.ellipse(120, 322, 90, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = rgb([120, 180, 80]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(120, 320, 95, 22, 0, 0, Math.PI * 2); ctx.stroke();

    // Enemy platform (top-right)
    ctx.fillStyle = rgb([100, 160, 70]);
    ctx.beginPath(); ctx.ellipse(360, 155, 85, 20, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = rgb([80, 130, 55]);
    ctx.beginPath(); ctx.ellipse(360, 157, 80, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = rgb([120, 180, 80]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(360, 155, 85, 20, 0, 0, Math.PI * 2); ctx.stroke();

    // Enemy Pokemon (top-right area)
    if (e) {
      const bob = Math.sin(t * 2) * 3;
      const ex = 325, ey = 80 + Math.floor(bob);
      // Shadow
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = rgb(COL_BLACK);
      ctx.beginPath(); ctx.ellipse(ex + 35, 168, 30, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
      // Sprite
      if (CREATURES[e.dex] && e.dex >= 75) {
        drawLegendaryCreature(ctx, ex - 5, ey - 5, 80, e.dex, t);
      } else {
        this.creatureSprite(ex, ey, 70, e.dex);
      }
      this.drawStatusGlow(ctx, ex + 35, ey + 35, e.status, t);
    }

    // Player Pokemon (bottom-left area)
    if (p) {
      const bob = Math.sin(t * 2 + 1) * 3;
      const px2 = 55, py2 = 215 + Math.floor(bob);
      // Shadow
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = rgb(COL_BLACK);
      ctx.beginPath(); ctx.ellipse(px2 + 45, 325, 40, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
      // Sprite
      if (p.dex >= 75) {
        drawLegendaryCreature(ctx, px2 - 5, py2 - 5, 105, p.dex, t);
      } else {
        this.creatureSprite(px2, py2, 90, p.dex);
      }
      this.drawStatusGlow(ctx, px2 + 45, py2 + 45, p.status, t);
    }

    // Enemy info box (top-left, semi-transparent dark box)
    if (e) {
      const boxX = 10, boxY = 8, boxW = 200, boxH = 62;
      this.rect(boxX, boxY, boxW, boxH, [20, 20, 40], 0.85);
      this.ctx.strokeStyle = rgb(COL_WHITE); this.ctx.lineWidth = 2;
      this.ctx.strokeRect(boxX, boxY, boxW, boxH);
      this.text(boxX + 10, boxY + 18, e.name, COL_WHITE, 13);
      this.text(boxX + 10, boxY + 34, "Lv." + e.level, COL_LGRAY, 11);
      // Status badge
      if (e.status) {
        const sCol = {burn:[255,120,20],poison:[180,60,200],paralyze:[255,240,60],freeze:[150,220,255],sleep:[160,160,200]}[e.status]||COL_RED;
        const sTxt = {burn:"BRN",poison:"PSN",paralyze:"PAR",freeze:"FRZ",sleep:"SLP"}[e.status]||"";
        if (sTxt) {
          this.rect(boxX + 100, boxY + 24, 38, 14, [30, 30, 50]);
          this.text(boxX + 119, boxY + 35, sTxt, sCol, 9, true);
        }
      }
      // HP bar
      const hpRatio = e.hp / Math.max(1, e.maxHP);
      const hpCol = hpRatio > 0.5 ? COL_HPG : hpRatio > 0.2 ? COL_HPY : COL_HPR;
      this.rect(boxX + 10, boxY + 44, 180, 10, [40, 40, 50]);
      this.rect(boxX + 10, boxY + 44, Math.floor(180 * Math.max(0, Math.min(1, hpRatio))), 10, hpCol);
      this.ctx.strokeStyle = rgb(COL_LGRAY); this.ctx.lineWidth = 1;
      this.ctx.strokeRect(boxX + 10, boxY + 44, 180, 10);
      this.text(boxX + 10, boxY + 42, "HP", COL_LGRAY, 8);
    }

    // Player info box (bottom-right, semi-transparent dark box)
    if (p) {
      const boxX = 260, boxY = 340, boxW = 210, boxH = 78;
      this.rect(boxX, boxY, boxW, boxH, [20, 20, 40], 0.85);
      this.ctx.strokeStyle = rgb(COL_WHITE); this.ctx.lineWidth = 2;
      this.ctx.strokeRect(boxX, boxY, boxW, boxH);
      this.text(boxX + 10, boxY + 18, p.name, COL_WHITE, 14);
      this.text(boxX + 10, boxY + 34, "Lv." + p.level, COL_LGRAY, 11);
      // Type badge
      this.text(boxX + 70, boxY + 34, p.types[0], TYPE_COLORS[p.types[0]] || COL_GRAY, 10);
      // Status badge
      if (p.status) {
        const sCol2 = {burn:[255,120,20],poison:[180,60,200],paralyze:[255,240,60],freeze:[150,220,255],sleep:[160,160,200]}[p.status]||COL_RED;
        const sTxt2 = {burn:"BRN",poison:"PSN",paralyze:"PAR",freeze:"FRZ",sleep:"SLP"}[p.status]||"";
        if (sTxt2) {
          this.rect(boxX + 130, boxY + 24, 38, 14, [30, 30, 50]);
          this.text(boxX + 149, boxY + 35, sTxt2, sCol2, 9, true);
        }
      }
      // HP bar
      const hpRatio2 = p.hp / Math.max(1, p.maxHP);
      const hpCol2 = hpRatio2 > 0.5 ? COL_HPG : hpRatio2 > 0.2 ? COL_HPY : COL_HPR;
      this.rect(boxX + 10, boxY + 46, 190, 10, [40, 40, 50]);
      this.rect(boxX + 10, boxY + 46, Math.floor(190 * Math.max(0, Math.min(1, hpRatio2))), 10, hpCol2);
      this.ctx.strokeStyle = rgb(COL_LGRAY); this.ctx.lineWidth = 1;
      this.ctx.strokeRect(boxX + 10, boxY + 46, 190, 10);
      this.text(boxX + 10, boxY + 44, "HP", COL_LGRAY, 8);
      this.text(boxX + 210, boxY + 55, p.hp + "/" + p.maxHP, COL_WHITE, 10, true);
      // Stat stages indicator
      this.drawStatStages(ctx, boxX + 10, boxY + 68, p.statStages);
    }

    // Particles
    this.updateParticles(ctx, t);
    // Damage numbers
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
      p.x += p.vx; p.y += p.vy; p.vy += 0.5;
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
    const particleType = moveType.toLowerCase();
    this.addParticles(targetX, targetY, particleType, isCrit ? 20 : 12);
    this.addParticles(targetX, targetY, "hit", 6);
    if (isCrit) this.addParticles(targetX, targetY, "crit", 10);
    this.triggerShake(isCrit ? 10 : 5, 0.2);
    if (eff > 1) this.triggerFlash([100, 255, 100], 0.3);
    else if (eff > 0 && eff < 1) this.triggerFlash([255, 100, 100], 0.2);
    else if (eff === 0) this.triggerFlash([128, 128, 128], 0.2);
    else this.triggerFlash([255, 255, 255], 0.2);
    this.addDamageNum(targetX, targetY, "", eff > 1 ? "super_effective" : (isCrit ? "critical" : "normal"));
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

  // ===== PARTY MENU - Pokemon Style =====
  partyMenu(party, sel) {
    const ctx = this.ctx;
    this.box(10, 30, 460, 420);
    this.text(240, 48, "YOUR TEAM", COL_YELLOW, 14, true);
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
      if (c.status) {
        const sCol = {burn:[255,120,20],poison:[180,60,200],paralyze:[255,240,60],freeze:[150,220,255],sleep:[160,160,200]}[c.status]||COL_RED;
        const sTxt = {burn:"BRN",poison:"PSN",paralyze:"PAR",freeze:"FRZ",sleep:"SLP"}[c.status]||c.status;
        this.text(440, y + 52, sTxt, sCol, 10, true);
      }
    }
  }

  // ===== MOVE MENU - Pokemon Style 2x2 Grid =====
  moveMenu(moves, sel, creature, newMoveName) {
    const ctx = this.ctx;
    this.box(10, 30, 460, 280);
    this.text(240, 48, newMoveName ? "Learn " + newMoveName + " - Forget which?" : "CHOOSE MOVE", COL_YELLOW, 14, true);

    // PP display
    if (creature && !newMoveName) {
      this.text(400, 48, "PP: " + creature.moves.reduce((a, m) => a + m.pp, 0) + "/" + creature.moves.reduce((a, m) => a + m.maxPP, 0), COL_LGRAY, 10);
    }

    // 2x2 grid for 4 moves
    const gridX = 30, gridY = 64, cellW = 210, cellH = 105;
    for (let i = 0; i < moves.length; i++) {
      const mv = moves[i]; const md = MOVES[mv.id]; if (!md) continue;
      const col = i % 2, row = Math.floor(i / 2);
      const cx = gridX + col * (cellW + 10), cy = gridY + row * (cellH + 6);
      const isSel = i === sel;

      // Type-colored background
      const tc = TYPE_COLORS[md.type] || COL_GRAY;
      this.rect(cx, cy, cellW, cellH, isSel ? [50, 50, 70] : [25, 25, 40]);

      // Type color bar on left
      this.rect(cx, cy, 6, cellH, tc);

      // Selection highlight
      if (isSel) {
        this.ctx.strokeStyle = rgb(COL_YELLOW);
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(cx, cy, cellW, cellH);
      } else {
        this.ctx.strokeStyle = rgb([60, 60, 80]);
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(cx, cy, cellW, cellH);
      }

      // Move name
      this.text(cx + 14, cy + 20, md.name, isSel ? COL_WHITE : COL_LGRAY, 14);

      // Type badge
      this.rect(cx + 14, cy + 32, 50, 14, tc);
      this.text(cx + 39, cy + 43, md.type, COL_WHITE, 8, true);

      // Category badge
      const catName = md.category === PHYSICAL ? "Phys" : md.category === SPECIAL ? "Spec" : "Status";
      const catCol = md.category === PHYSICAL ? COL_RED : md.category === SPECIAL ? COL_BLUE : COL_LGRAY;
      this.rect(cx + 70, cy + 32, 40, 14, [40, 40, 55]);
      this.text(cx + 90, cy + 43, catName, catCol, 8, true);

      // PP
      this.text(cx + 14, cy + 60, "PP: " + mv.pp + "/" + mv.maxPP, mv.pp > 0 ? COL_LGRAY : COL_RED, 10);

      // Power & Accuracy
      if (md.power > 0) this.text(cx + 14, cy + 74, "Pow: " + md.power, COL_LGRAY, 10);
      this.text(cx + 14, cy + 88, "Acc: " + md.accuracy + "%", COL_LGRAY, 10);

      // Effect
      if (md.effect) {
        const effDesc = {burn:"BRN",freeze:"FRZ",paralyze:"PAR",poison:"PSN",sleep:"SLP",
          flinch:"Flinch",crit_boost:"High Crit",recoil:"Recoil",recover:"Heal",
          multi_hit:"Multi",confuse:"Confuse",leech:"Leech",
          atk_up:"ATK+",def_up:"DEF+",spd_up:"SPD+",satk_up:"SP.ATK+",sdef_up:"SP.DEF+",
          atk_down:"ATK-",def_down:"DEF-",spd_down:"SPD-",satk_down:"SP.ATK-",sdef_down:"SP.DEF-",
          atk_spd_up:"ATK+SPD",protect:"Prot.",sandstorm:"Sand",spite:"Spite"}[md.effect]||md.effect;
        this.text(cx + 80, cy + 60, effDesc, COL_YELLOW, 9);
      }

      // Cursor arrow
      if (isSel) {
        this.menuCursor(cx - 10, cy + 10, t);
      }
    }

    this.text(240, 296, "Click = Use  |  Right-click = Back", COL_GRAY, 10, true);
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

  // ===== PAUSE MENU - Pokemon Style Blue Box =====
  pauseButton(t) {
    const ctx = this.ctx;
    const bx = 456, by = 2, bw = 20, bh = 18;
    ctx.fillStyle = rgb([50, 50, 70]);
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = rgb(COL_LGRAY); ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, bh);
    const pulse = 0.5 + Math.sin(t * 3) * 0.15;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = rgb(COL_WHITE);
    ctx.fillRect(bx + 5, by + 4, 3, 10);
    ctx.fillRect(bx + 12, by + 4, 3, 10);
    ctx.globalAlpha = 1;
  }

  hitPauseButton(mx, my) {
    return mx >= 456 && mx <= 476 && my >= 2 && my <= 20;
  }

  // ===== PAUSE MENU - Pokemon Style =====
  pauseMenu(player, cursor, t) {
    const ctx = this.ctx;
    // Darken background
    ctx.globalAlpha = 0.6; ctx.fillStyle = rgb(COL_BLACK); ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    ctx.globalAlpha = 1;
    // Main box with blue Pokemon-style background
    this.box(30, 20, 420, 440, COL_WHITE, [20, 30, 60]);
    // Trainer card section
    this.box(40, 30, 400, 80, COL_LGRAY, [30, 30, 50]);
    this.text(50, 48, player.name + "'s Trainer Card", COL_YELLOW, 14);
    const mins = Math.floor(player.playTime / 60);
    const hrs = Math.floor(mins / 60);
    this.text(50, 68, "Badges: " + player.badges.length + "/8", player.badges.length >= 8 ? COL_YELLOW : COL_LGRAY, 12);
    this.text(200, 68, "$" + player.money, COL_YELLOW, 12);
    this.text(320, 68, "Time: " + hrs + "h " + (mins % 60) + "m", COL_GRAY, 11);
    if (player.party.length) {
      const c = player.party[0];
      this.text(50, 88, "Lead: " + c.name + " Lv." + c.level, COL_LGRAY, 11);
      this.hpBar(220, 82, 100, 6, c.hp / Math.max(1, c.maxHP));
      this.text(330, 88, "HP:" + c.hp + "/" + c.maxHP, COL_GRAY, 11);
    }
    // Badge icons
    const badgeNames = ["Granite","Steel","Marsh","Frost","Electric","Lava","Inferno","Wind"];
    for (let i = 0; i < 8; i++) {
      const bx = 50 + i * 46, by = 100;
      const has = i < player.badges.length;
      this.rect(bx, by, 38, 14, has ? [180, 150, 60] : [40, 40, 50]);
      this.text(bx + 19, by + 11, badgeNames[i], has ? COL_BLACK : COL_GRAY, 7, true);
    }
    // Options grid
    const opts = ["Party","Bag","Pokedex","Save","Load","Map","Close"];
    const cols = 3, cellW = 130, cellH = 55;
    const gridX = 55, gridY = 130;
    for (let i = 0; i < opts.length; i++) {
      const col = i % cols, row = Math.floor(i / cols);
      const ox = gridX + col * cellW, oy = gridY + row * cellH;
      const sel = i === cursor;
      this.rect(ox, oy, 120, 45, sel ? [60, 60, 90] : [30, 30, 50]);
      this.ctx.strokeStyle = rgb(sel ? COL_YELLOW : COL_LGRAY);
      this.ctx.lineWidth = sel ? 2 : 1;
      this.ctx.strokeRect(ox, oy, 120, 45);
      if (sel) this.menuCursor(ox + 4, oy + 14, t);
      const icons = {Party:"P",Bag:"B",Pokedex:"D",Save:"Sv",Load:"Lo",Map:"M",Close:"X"};
      this.text(ox + 60, oy + 18, icons[opts[i]] || "?", sel ? COL_YELLOW : COL_LGRAY, 18, true);
      this.text(ox + 60, oy + 36, opts[i], sel ? COL_YELLOW : COL_WHITE, 12, true);
    }
    // Pokedex progress
    const total = typeof CREATURES !== "undefined" ? Object.keys(CREATURES).length : 100;
    const caught = typeof pokedex !== "undefined" ? Object.values(pokedex).filter(v => v.caught).length : 0;
    const seen = typeof pokedex !== "undefined" ? Object.values(pokedex).filter(v => v.seen).length : 0;
    this.text(240, 320, "Pokedex: " + seen + " seen / " + caught + " caught / " + total + " total", COL_GRAY, 11, true);
    this.text(240, 440, "Scroll=Navigate  Click=Select  Right-click=Back", COL_GRAY, 10, true);
  }

  // ===== BAG CATEGORY MENU - Tab-Based =====
  bagCatMenu(inventory, bagTab, cursor, t) {
    const ctx = this.ctx;
    ctx.globalAlpha = 0.6; ctx.fillStyle = rgb(COL_BLACK); ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    ctx.globalAlpha = 1;
    this.box(20, 20, 440, 440);
    this.text(240, 38, "BAG", COL_YELLOW, 16, true);
    const BAG_TABS = [
      { name: "Medicine", items: ["Potion","Super Potion","Hyper Potion","Full Heal","Revive","Full Revive"] },
      { name: "Spheres", items: ["Soul Sphere","Great Sphere","Ultra Sphere","Master Sphere"] },
      { name: "TMs", items: Object.keys(TM_MOVES || {}) },
      { name: "Battle", items: ["X Attack","X Defense"] }
    ];
    const isOnTab = cursor < BAG_TABS.length;
    const itemCursor = Math.max(0, cursor - BAG_TABS.length);
    const tabW = 100;
    const tabStartX = 30;
    for (let i = 0; i < BAG_TABS.length; i++) {
      const tx = tabStartX + i * (tabW + 5);
      const isActive = i === bagTab;
      const isSel = i === cursor;
      this.rect(tx, 50, tabW, 22, isSel ? [80, 80, 110] : (isActive ? [60, 60, 90] : [30, 30, 50]));
      this.ctx.strokeStyle = rgb(isSel ? COL_YELLOW : (isActive ? COL_LGRAY : [80, 80, 100]));
      this.ctx.lineWidth = (isSel || isActive) ? 2 : 1;
      this.ctx.strokeRect(tx, 50, tabW, 22);
      this.text(tx + tabW / 2, 65, BAG_TABS[i].name, isSel ? COL_YELLOW : (isActive ? COL_WHITE : COL_LGRAY), 10, true);
      if (isSel && isOnTab) this.menuCursor(tx + 2, 55, t);
    }
    const activeTabX = tabStartX + bagTab * (tabW + 5);
    this.rect(activeTabX, 72, tabW, 2, COL_YELLOW);
    const items = BAG_TABS[bagTab].items.filter(name => (inventory[name] || 0) > 0);
    const listY = 80;
    this.box(30, listY, 420, 340, COL_WHITE, [20, 20, 35]);
    if (!items.length) {
      this.text(240, 240, "No items in this category", COL_GRAY, 12, true);
    } else {
      const maxShow = 9;
      const offset = Math.max(0, itemCursor - maxShow + 1);
      for (let i = offset; i < Math.min(items.length, offset + maxShow); i++) {
        const name = items[i];
        const count = inventory[name] || 0;
        const y = listY + 10 + (i - offset) * 34;
        const sel = i === itemCursor && !isOnTab;
        if (sel) this.rect(36, y, 408, 30, COL_SELECT, 0.3);
        let itemCol = COL_LGRAY;
        if (bagTab === 0) itemCol = COL_GREEN;
        else if (bagTab === 1) itemCol = [100, 180, 255];
        else if (bagTab === 2) itemCol = COL_YELLOW;
        else if (bagTab === 3) itemCol = COL_RED;
        this.rect(36, y + 2, 4, 26, itemCol);
        this.text(48, y + 14, name, sel ? COL_WHITE : COL_LGRAY, 13);
        this.text(400, y + 14, "x" + count, sel ? COL_YELLOW : COL_GRAY, 12, true);
        if (sel) this.menuCursor(38, y + 8, t);
        if (sel) {
          const desc = this.getItemDesc(name);
          this.text(48, y + 28, desc, COL_GRAY, 9);
        }
      }
      if (items.length > maxShow) {
        this.text(240, listY + 330, "(" + (itemCursor + 1) + "/" + items.length + ")", COL_GRAY, 10, true);
      }
    }
    this.text(240, 450, "Scroll=Navigate  Click=Select  Right-click=Back", COL_GRAY, 10, true);
  }

  getItemDesc(name) {
    const descs = {
      "Potion": "Heals 20 HP",
      "Super Potion": "Heals 60 HP",
      "Hyper Potion": "Heals 200 HP",
      "Full Heal": "Cures all status",
      "Revive": "Revives fainted Mini (half HP)",
      "Full Revive": "Revives fainted Mini (full HP)",
      "Soul Sphere": "Basic catching sphere",
      "Great Sphere": "Good catching sphere",
      "Ultra Sphere": "Great catching sphere",
      "Master Sphere": "Never misses!",
      "X Attack": "Raises ATK in battle",
      "X Defense": "Raises DEF in battle"
    };
    if (descs[name]) return descs[name];
    if (name && name.startsWith("TM ")) return "Teaches: " + (MOVES[TM_MOVES[name]] ? MOVES[TM_MOVES[name]].name : name.slice(3));
    return "";
  }

  // Use Item Target Selection
  useItemTargetMenu(party, itemName, cursor, t) {
    const ctx = this.ctx;
    ctx.globalAlpha = 0.6; ctx.fillStyle = rgb(COL_BLACK); ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    ctx.globalAlpha = 1;
    this.box(40, 60, 400, 380);
    this.text(240, 78, "Use " + itemName + " on:", COL_YELLOW, 14, true);
    const isRevive = [I_REVIVE, I_FREVIVE].includes(itemName);
    const isPotion = [I_POTION, I_SPOTION, I_HPOTION].includes(itemName);
    let validCursor = cursor;
    for (let tries = 0; tries < party.length; tries++) {
      const c = party[validCursor % party.length];
      if (isRevive && !c.isAlive()) break;
      if (isPotion && c.isAlive() && c.hp < c.maxHP) break;
      if (!isRevive && !isPotion) break;
      validCursor++;
    }
    let drawn = 0;
    for (let i = 0; i < party.length; i++) {
      const c = party[i]; const y = 100 + drawn * 55;
      let valid = true;
      if (isRevive) valid = !c.isAlive();
      else if (isPotion) valid = c.isAlive() && c.hp < c.maxHP;
      const sel = i === validCursor % party.length;
      if (sel) this.rect(46, y, 388, 50, COL_SELECT, 0.3);
      this.box(46, y, 388, 50, sel ? COL_SELECT : COL_LGRAY);
      this.creatureSprite(54, y + 2, 44, c.dex);
      this.text(106, y + 16, c.name, valid ? COL_WHITE : COL_GRAY, 13);
      this.text(106, y + 32, "Lv." + c.level + " " + c.types.join("/"), valid ? COL_GRAY : [80,80,80], 10);
      this.hpBar(260, y + 12, 150, 8, c.hp / Math.max(1, c.maxHP));
      this.text(260, y + 30, c.hp + "/" + c.maxHP, valid ? COL_WHITE : COL_GRAY, 10);
      if (c.status) {
        const sCol = {burn:[255,120,20],poison:[180,60,200],paralyze:[255,240,60],freeze:[150,220,255],sleep:[160,160,200]}[c.status]||COL_RED;
        const sTxt = {burn:"BRN",poison:"PSN",paralyze:"PAR",freeze:"FRZ",sleep:"SLP"}[c.status]||c.status;
        this.text(420, y + 30, sTxt, sCol, 10, true);
      }
      if (!c.isAlive()) this.text(260, y + 44, "FAINTED", COL_RED, 9);
      if (!valid) this.text(380, y + 44, "N/A", COL_GRAY, 9, true);
      drawn++;
    }
    this.text(240, 430, "Scroll=Select  Click=Use  Right-click=Cancel", COL_GRAY, 10, true);
  }

  // ===== PARTY DETAIL - Full Summary =====
  partyDetailMenu(party, cursor, t, mode) {
    const ctx = this.ctx;
    ctx.globalAlpha = 0.6; ctx.fillStyle = rgb(COL_BLACK); ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    ctx.globalAlpha = 1;
    this.box(10, 10, 460, 460);
    // Left side: party list
    this.box(16, 16, 120, 448, COL_WHITE, [25, 25, 40]);
    this.text(76, 32, "PARTY", COL_YELLOW, 10, true);
    for (let i = 0; i < party.length; i++) {
      const c = party[i];
      const y = 40 + i * 70;
      const sel = i === cursor;
      if (sel) this.rect(18, y, 116, 64, COL_SELECT, 0.3);
      this.box(18, y, 116, 64, sel ? COL_YELLOW : COL_LGRAY, sel ? [40, 40, 60] : [30, 30, 45]);
      this.creatureSprite(28, y + 6, 36, c.dex);
      this.text(70, y + 18, c.name, sel ? COL_WHITE : COL_LGRAY, 9);
      this.text(70, y + 30, "Lv." + c.level, COL_GRAY, 9);
      this.hpBar(28, y + 46, 98, 5, c.hp / Math.max(1, c.maxHP));
      if (c.status) {
        const sCol = {burn:[255,120,20],poison:[180,60,200],paralyze:[255,240,60],freeze:[150,220,255],sleep:[160,160,200]}[c.status]||COL_RED;
        this.rect(28, y + 54, 12, 6, sCol);
      }
    }
    // Right side: detail
    if (cursor < party.length) {
      const c = party[cursor];
      const rx = 145, ry = 16, rw = 318, rh = 448;
      this.box(rx, ry, rw, rh, COL_WHITE, [20, 20, 35]);
      // Header
      this.creatureSprite(rx + 10, ry + 8, 60, c.dex);
      this.text(rx + 80, ry + 20, c.name, COL_WHITE, 15);
      this.text(rx + 80, ry + 38, "#" + String(c.dex).padStart(3,"0") + "  " + c.types.join("/"), TYPE_COLORS[c.types[0]] || COL_GRAY, 11);
      this.text(rx + 80, ry + 52, "Lv." + c.level + "  BST:" + c.stats.reduce((a,b)=>a+b,0), COL_LGRAY, 10);
      // HP bar
      this.text(rx + 10, ry + 80, "HP", COL_LGRAY, 10);
      this.hpBar(rx + 35, ry + 74, 180, 10, c.hp / Math.max(1, c.maxHP));
      this.text(rx + 220, ry + 82, c.hp + "/" + c.maxHP, COL_WHITE, 11);
      // Stats
      const statNames = ["ATK","DEF","SPD","SATK","SDEF"];
      const statCols = [COL_RED, COL_BLUE, COL_GREEN, [255,160,60], [180,100,220]];
      for (let i = 0; i < 5; i++) {
        const sy = ry + 100 + i * 16;
        this.text(rx + 10, sy + 10, statNames[i], statCols[i], 10);
        this.text(rx + 50, sy + 10, "" + c.stats[i + 1], COL_WHITE, 10);
        const statRatio = Math.min(1, c.stats[i + 1] / 200);
        this.rect(rx + 85, sy + 4, 80, 8, [40, 40, 50]);
        this.rect(rx + 85, sy + 4, Math.floor(80 * statRatio), 8, statCols[i]);
      }
      // Status
      if (c.status) {
        const sTxt = {burn:"Burn",poison:"Poison",paralyze:"Paralyze",freeze:"Freeze",sleep:"Sleep"}[c.status]||c.status;
        const sCol = {burn:[255,120,20],poison:[180,60,200],paralyze:[255,240,60],freeze:[150,220,255],sleep:[160,160,200]}[c.status]||COL_RED;
        this.text(rx + 175, ry + 82, sTxt, sCol, 10);
      }
      // Moves section
      this.text(rx + 10, ry + 192, "MOVES", COL_YELLOW, 11);
      for (let i = 0; i < c.moves.length; i++) {
        const mv = c.moves[i]; const md = MOVES[mv.id];
        if (!md) continue;
        const my = ry + 206 + i * 34;
        this.rect(rx + 8, my, 302, 30, [35, 35, 50]);
        const tc = TYPE_COLORS[md.type] || COL_GRAY;
        this.rect(rx + 10, my + 2, 4, 26, tc);
        this.text(rx + 20, my + 13, md.name, COL_WHITE, 11);
        this.text(rx + 20, my + 26, md.type + " " + (md.category === 0 ? "Phys" : md.category === 1 ? "Spec" : "Status"), COL_GRAY, 9);
        this.text(rx + 170, my + 13, "PP:" + mv.pp + "/" + mv.maxPP, COL_LGRAY, 9);
        if (md.power > 0) this.text(rx + 240, my + 13, "Pow:" + md.power, COL_LGRAY, 9);
        this.text(rx + 170, my + 26, "Acc:" + md.accuracy + "%", COL_LGRAY, 9);
      }
      // Action buttons
      const btns = mode === "swap" ? ["Swap Here","Cancel"] : ["Swap","Summary","Back"];
      for (let i = 0; i < btns.length; i++) {
        const bx = rx + 10 + i * 100, by = ry + 355;
        this.rect(bx, by, 92, 22, [40, 40, 60]);
        this.ctx.strokeStyle = rgb(COL_LGRAY); this.ctx.lineWidth = 1;
        this.ctx.strokeRect(bx, by, 92, 22);
        this.text(bx + 46, by + 14, btns[i], COL_WHITE, 10, true);
      }
    }
  }

  // World Map Screen
  worldMapScreen(player, currentMapName, cursor, t) {
    const ctx = this.ctx;
    ctx.globalAlpha = 0.6; ctx.fillStyle = rgb(COL_BLACK); ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    ctx.globalAlpha = 1;
    this.box(20, 20, 440, 440);
    this.text(240, 38, "WORLD MAP", COL_YELLOW, 16, true);
    const locations = [
      { name: "Starter Town", x: 240, y: 400, desc: "Your hometown" },
      { name: "Route 1", x: 240, y: 350, desc: "A peaceful path" },
      { name: "Verdant Town", x: 240, y: 290, desc: "A verdant town" },
      { name: "Route 2", x: 240, y: 235, desc: "Rocky terrain" },
      { name: "Frostbite Cavern", x: 110, y: 180, desc: "Icy caves" },
      { name: "Route 3", x: 240, y: 180, desc: "Mountain pass" },
      { name: "Gale Island", x: 380, y: 180, desc: "Windy island" },
      { name: "Route 4", x: 240, y: 130, desc: "Desolate road" },
      { name: "Grand Colosseum", x: 240, y: 75, desc: "Battle arena" },
      { name: "Victory Road", x: 100, y: 75, desc: "Final challenge" },
      { name: "Elite Hall", x: 380, y: 75, desc: "Elite Four" },
      { name: "Deep Pit", x: 100, y: 130, desc: "Dark abyss" }
    ];
    const connections = [
      [0,1],[1,2],[2,3],[3,4],[3,5],[3,6],[5,7],[7,8],[8,9],[8,10],[4,11]
    ];
    ctx.strokeStyle = rgb([80, 80, 100]); ctx.lineWidth = 2;
    for (const [a, b] of connections) {
      ctx.beginPath();
      ctx.moveTo(locations[a].x, locations[a].y);
      ctx.lineTo(locations[b].x, locations[b].y);
      ctx.stroke();
    }
    let curIdx = locations.findIndex(l => l.name === currentMapName);
    for (let i = 0; i < locations.length; i++) {
      const loc = locations[i];
      const isCurrent = i === curIdx;
      const isCursor = i === cursor;
      const nodeR = isCurrent ? 10 : 7;
      if (isCurrent) {
        const pulse = 0.3 + Math.sin(t * 4) * 0.15;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = rgb(COL_GREEN);
        ctx.beginPath(); ctx.arc(loc.x, loc.y, nodeR + 6, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = rgb(isCurrent ? COL_GREEN : (isCursor ? COL_YELLOW : COL_LGRAY));
      ctx.beginPath(); ctx.arc(loc.x, loc.y, nodeR, 0, Math.PI * 2); ctx.fill();
      if (isCursor) {
        ctx.strokeStyle = rgb(COL_YELLOW); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(loc.x, loc.y, nodeR + 3, 0, Math.PI * 2); ctx.stroke();
      }
      const labelCol = isCurrent ? COL_GREEN : (isCursor ? COL_YELLOW : COL_WHITE);
      this.text(loc.x, loc.y + nodeR + 14, loc.name, labelCol, 9, true);
      if (isCursor) {
        this.text(loc.x, loc.y + nodeR + 26, loc.desc, COL_GRAY, 8, true);
      }
    }
    if (curIdx >= 0) {
      const px = locations[curIdx].x, py = locations[curIdx].y;
      const bob = Math.sin(t * 4) * 2;
      ctx.fillStyle = rgb(COL_YELLOW);
      ctx.beginPath(); ctx.moveTo(px, py - 14 + bob); ctx.lineTo(px - 4, py - 20 + bob); ctx.lineTo(px + 4, py - 20 + bob); ctx.fill();
    }
    this.text(240, 450, "Scroll=Navigate  Click/Right-click=Back", COL_GRAY, 10, true);
  }
}
