// Minimon - Renderer (Canvas 2D) - Gen 3-5 Minimon Style
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
    const seededRand = (x, y) => {
      let h = x * 374761393 + y * 668265263;
      h = (h ^ (h >> 13)) * 1274126177;
      h = h ^ (h >> 16);
      return (h & 0x7fffffff) / 0x7fffffff;
    };
    for (let y = 0; y < Math.min(m.height, MAP_Y); y++) {
      for (let x = 0; x < Math.min(m.width, MAP_X); x++) {
        const tile = getT(m, x, y);
        const sx = x * TILE, sy = y * TILE;
        if (tile === TILE_GRASS) {
          ctx.fillStyle = rgb([74, 140, 63]);
          ctx.fillRect(sx, sy, TILE - 1, TILE - 1);
          ctx.fillStyle = rgb([60, 120, 50]);
          for (let i = 0; i < 5; i++) {
            const dx = Math.floor(seededRand(x * 10 + i, y * 10) * (TILE - 4));
            const dy = Math.floor(seededRand(x * 10, y * 10 + i) * (TILE - 4));
            ctx.fillRect(sx + dx + 1, sy + dy + 1, 2, 2);
          }
        } else if (tile === TILE_TGRASS) {
          ctx.fillStyle = rgb([45, 107, 48]);
          ctx.fillRect(sx, sy, TILE - 1, TILE - 1);
          ctx.strokeStyle = rgb([35, 90, 38]);
          ctx.lineWidth = 1;
          for (let i = 0; i < 4; i++) {
            const sway = Math.sin(t * 3 + i * 1.5 + x * 0.5) * 2;
            const bx = sx + 3 + i * 5;
            ctx.beginPath();
            ctx.moveTo(bx, sy + TILE - 2);
            ctx.lineTo(bx + sway, sy + 4);
            ctx.stroke();
          }
          ctx.strokeStyle = rgb([65, 130, 55]);
          for (let i = 0; i < 3; i++) {
            const sway = Math.sin(t * 3 + i * 1.5 + x * 0.5) * 2;
            const bx = sx + 5 + i * 6;
            ctx.beginPath();
            ctx.moveTo(bx + sway, sy + 6);
            ctx.lineTo(bx + sway, sy + 2);
            ctx.stroke();
          }
        } else if (tile === TILE_WATER) {
          ctx.fillStyle = rgb([48, 104, 176]);
          ctx.fillRect(sx, sy, TILE - 1, TILE - 1);
          ctx.strokeStyle = rgb([60, 120, 190]);
          ctx.lineWidth = 1;
          const waveShift = Math.sin(t * 1.5 + y * 0.8) * 3;
          ctx.beginPath();
          ctx.moveTo(sx + 2, sy + 8 + waveShift);
          ctx.lineTo(sx + TILE - 3, sy + 8 + waveShift);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(sx + 4, sy + 16 - waveShift);
          ctx.lineTo(sx + TILE - 5, sy + 16 - waveShift);
          ctx.stroke();
          for (let i = 0; i < 3; i++) {
            const sparkleTime = t * 4 + i * 2.1 + x * 0.7;
            const sparkle = Math.sin(sparkleTime);
            if (sparkle > 0.6) {
              const sparkleX = sx + 4 + Math.floor(seededRand(x + i, y) * (TILE - 8));
              const sparkleY = sy + 4 + Math.floor(seededRand(x, y + i) * (TILE - 8));
              ctx.fillStyle = rgb([255, 255, 255]);
              ctx.globalAlpha = (sparkle - 0.6) * 2.5;
              ctx.fillRect(sparkleX, sparkleY, 2, 2);
              ctx.globalAlpha = 1;
            }
          }
        } else if (tile === TILE_PATH) {
          ctx.fillStyle = rgb([196, 168, 122]);
          ctx.fillRect(sx, sy, TILE - 1, TILE - 1);
          ctx.fillStyle = rgb([180, 152, 108]);
          for (let i = 0; i < 3; i++) {
            const dx = Math.floor(seededRand(x * 7 + i, y * 7) * (TILE - 4));
            const dy = Math.floor(seededRand(x * 7, y * 7 + i) * (TILE - 4));
            ctx.fillRect(sx + dx + 1, sy + dy + 1, 2, 1);
          }
        } else if (tile === TILE_TREE) {
          ctx.fillStyle = rgb([45, 107, 48]);
          ctx.fillRect(sx, sy, TILE - 1, TILE - 1);
          ctx.fillStyle = rgb([55, 125, 58]);
          for (let i = 0; i < 3; i++) {
            const dx = Math.floor(seededRand(x * 11 + i, y * 11) * (TILE - 6)) + 1;
            const dy = Math.floor(seededRand(x * 11, y * 11 + i) * (TILE - 10)) + 1;
            ctx.fillRect(sx + dx, sy + dy, 4, 3);
          }
          ctx.fillStyle = rgb([107, 66, 38]);
          ctx.fillRect(sx + 8, sy + TILE - 6, 8, 5);
          ctx.fillStyle = rgb([90, 55, 32]);
          ctx.fillRect(sx + 10, sy + TILE - 5, 4, 4);
        } else if (tile === TILE_WALL) {
          ctx.fillStyle = rgb([136, 136, 136]);
          ctx.fillRect(sx, sy, TILE - 1, TILE - 1);
          ctx.strokeStyle = rgb([115, 115, 115]);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(sx, sy + 7); ctx.lineTo(sx + TILE - 1, sy + 7);
          ctx.moveTo(sx, sy + 15); ctx.lineTo(sx + TILE - 1, sy + 15);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(sx + 8, sy); ctx.lineTo(sx + 8, sy + 7);
          ctx.moveTo(sx + 16, sy + 7); ctx.lineTo(sx + 16, sy + 15);
          ctx.moveTo(sx + 8, sy + 15); ctx.lineTo(sx + 8, sy + TILE - 1);
          ctx.stroke();
        } else if (tile === TILE_HEAL) {
          ctx.fillStyle = rgb([220, 50, 50]);
          ctx.fillRect(sx, sy, TILE - 1, TILE - 1);
          ctx.fillStyle = rgb([255, 255, 255]);
          ctx.fillRect(sx + 9, sy + 3, 6, TILE - 4);
          ctx.fillRect(sx + 3, sy + 9, TILE - 4, 6);
        } else if (tile === TILE_SHOP) {
          ctx.fillStyle = rgb([50, 100, 220]);
          ctx.fillRect(sx, sy, TILE - 1, TILE - 1);
          ctx.fillStyle = rgb([255, 255, 255]);
          ctx.fillRect(sx + 6, sy + 8, 12, 12);
          ctx.fillStyle = rgb([50, 100, 220]);
          ctx.fillRect(sx + 8, sy + 10, 8, 8);
          ctx.strokeStyle = rgb([255, 255, 255]);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(sx + 12, sy + 8, 4, Math.PI, 0);
          ctx.stroke();
        } else if (tile === TILE_GYM) {
          ctx.fillStyle = rgb([220, 180, 50]);
          ctx.fillRect(sx, sy, TILE - 1, TILE - 1);
          ctx.fillStyle = rgb([255, 220, 80]);
          const cx2 = sx + TILE / 2, cy2 = sy + TILE / 2;
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI / 5) - Math.PI / 2;
            const method = i === 0 ? 'moveTo' : 'lineTo';
            ctx[method](cx2 + Math.cos(angle) * 7, cy2 + Math.sin(angle) * 7);
          }
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = rgb([200, 160, 40]);
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI / 5) - Math.PI / 2;
            const method = i === 0 ? 'moveTo' : 'lineTo';
            ctx[method](cx2 + Math.cos(angle) * 3, cy2 + Math.sin(angle) * 3);
          }
          ctx.closePath();
          ctx.fill();
        } else if (tile === TILE_SIGN) {
          ctx.fillStyle = rgb([139, 119, 73]);
          ctx.fillRect(sx + 6, sy + 8, TILE - 12, TILE - 10);
          ctx.fillStyle = rgb([100, 80, 50]);
          ctx.fillRect(sx + 10, sy + TILE - 4, 4, 6);
        } else {
          const col = TILE_COLORS[tile] || COL_GRAY;
          ctx.fillStyle = rgb(col);
          ctx.fillRect(sx, sy, TILE - 1, TILE - 1);
        }
      }
    }
    for (const npc of m.npcs) this.npcSprite(npc.x * TILE, npc.y * TILE, TILE, npc.type);
    this.playerSprite(px * TILE, py * TILE, TILE);
  }

  hud(player, mapName) {
    const ctx = this.ctx;
    ctx.fillStyle = rgb([15, 15, 25]);
    ctx.globalAlpha = 0.85;
    ctx.fillRect(0, 0, SCREEN_W, 24);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = rgb([60, 80, 140]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 24);
    ctx.lineTo(SCREEN_W, 24);
    ctx.stroke();
    this.text(8, 16, mapName, COL_WHITE, 12);
    ctx.fillStyle = rgb(COL_YELLOW);
    ctx.fillRect(SCREEN_W - 100, 6, 8, 8);
    ctx.fillStyle = rgb([255, 200, 50]);
    ctx.fillRect(SCREEN_W - 99, 7, 6, 6);
    this.text(SCREEN_W - 88, 15, "$" + player.money, COL_YELLOW, 11);
    const party = player.party || [];
    for (let i = 0; i < Math.min(party.length, 6); i++) {
      const dotX = 8 + i * 14;
      const dotY = 20;
      const hpRatio = party[i].hp / Math.max(1, party[i].maxHP);
      const dotCol = hpRatio > 0.5 ? COL_HPG : hpRatio > 0.2 ? COL_HPY : COL_HPR;
      ctx.fillStyle = rgb([40, 40, 50]);
      ctx.fillRect(dotX, dotY, 10, 3);
      ctx.fillStyle = rgb(dotCol);
      ctx.fillRect(dotX, dotY, Math.floor(10 * Math.max(0, Math.min(1, hpRatio))), 3);
    }
  }

  dialogBox(text, speaker) {
    const ctx = this.ctx;
    const bx = 10, by = 340, bw = 460, bh = 130;
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = rgb(COL_BLACK);
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    ctx.globalAlpha = 1;
    const grad = ctx.createLinearGradient(bx, by, bx, by + bh);
    grad.addColorStop(0, '#1a2a5c');
    grad.addColorStop(1, '#2a3a7c');
    ctx.fillStyle = grad;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = rgb(COL_WHITE);
    ctx.lineWidth = 2;
    ctx.strokeRect(bx + 1, by + 1, bw - 2, bh - 2);
    ctx.strokeStyle = rgb([100, 120, 180]);
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 4, by + 4, bw - 8, bh - 8);
    if (speaker) this.text(bx + 14, by + 20, speaker, COL_YELLOW, 14);
    const lines = this.wrapText(text, bw - 28);
    const textY = speaker ? by + 38 : by + 18;
    for (let i = 0; i < Math.min(lines.length, 4); i++) this.text(bx + 14, textY + i * 20, lines[i], COL_WHITE, 14);
    const arrowBob = Math.sin(Date.now() / 200) > 0;
    if (arrowBob) {
      ctx.fillStyle = rgb(COL_WHITE);
      ctx.beginPath();
      ctx.moveTo(bx + bw - 24, by + bh - 18);
      ctx.lineTo(bx + bw - 16, by + bh - 10);
      ctx.lineTo(bx + bw - 8, by + bh - 18);
      ctx.fill();
    }
  }

  // ===== TITLE SCREEN - Minimon Gen 3-5 Style =====
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

    // Footer with decorative separator
    ctx.strokeStyle = rgb([100, 120, 180]);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(80, 340); ctx.lineTo(400, 340); ctx.stroke();
    this.text(240, 354, "Rabbit R1 Edition", COL_LGRAY, 10, true);
    // Stylized creator credit - golden with subtle glow
    ctx.save();
    ctx.shadowColor = 'rgba(255, 200, 50, 0.4)';
    ctx.shadowBlur = 6;
    this.text(240, 370, "~ MrGhostGuy ~", COL_YELLOW, 13, true);
    ctx.restore();
    this.text(240, 384, "Jeff Hollaway", COL_GRAY, 10, true);
    // Decorative line below credit
    ctx.strokeStyle = rgb([100, 120, 180]);
    ctx.beginPath(); ctx.moveTo(170, 396); ctx.lineTo(310, 396); ctx.stroke();
    this.text(240, 410, "Scroll = Navigate  |  Click = Select", COL_GRAY, 10, true);

    // Bottom creature showcase - 8 diverse creatures in a row
    const showcase = [1, 4, 11, 13, 39, 57, 71, 86];
    // Showcase background
    this.rect(0, 422, SCREEN_W, 48, [15, 18, 35], 0.8);
    ctx.strokeStyle = rgb([50, 70, 120]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 422); ctx.lineTo(SCREEN_W, 422); ctx.stroke();
    for (let i = 0; i < showcase.length; i++) {
      const dex = showcase[i];
      const cr = CREATURES[dex];
      if (!cr) continue;
      const sx = 28 + i * 56;
      const sy = 426;
      this.creatureSprite(sx, sy, 22, dex);
      this.text(sx + 11, sy + 26, cr.name, COL_GRAY, 6, true);
    }
  }

  // ===== BATTLE SCENE - Minimon RSE/FRLG Style =====
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

    // Battle platforms (Minimon-style ovals with shading)
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

    // Enemy Mini (top-right area)
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

    // Player Mini (bottom-left area)
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
    if (this.mapTransition <= 0) return;
    const ctx = this.ctx;
    const mt = this.mapTransition;
    if (mt < 0.2) {
      const shakeIntensity = (1 - mt / 0.2) * 4;
      ctx.save();
      ctx.translate(
        (Math.random() - 0.5) * shakeIntensity,
        (Math.random() - 0.5) * shakeIntensity
      );
    }
    if (mt > 0 && mt < 0.15) {
      const flashAlpha = 1.0 - (mt / 0.15);
      ctx.globalAlpha = flashAlpha * 0.8;
      ctx.fillStyle = rgb(COL_WHITE);
      ctx.fillRect(0, 0, this.w, this.h);
      ctx.globalAlpha = 1;
    }
    if (mt >= 0.1) {
      const barProgress = Math.min(1, (mt - 0.1) / 0.6);
      const barH = Math.floor((this.h / 2 + 10) * barProgress);
      ctx.fillStyle = rgb(COL_BLACK);
      ctx.fillRect(0, 0, this.w, barH);
      ctx.fillRect(0, this.h - barH, this.w, barH);
    }
    if (mt > 0.7) {
      ctx.fillStyle = rgb(COL_BLACK);
      ctx.fillRect(0, 0, this.w, this.h);
    }
    if (mt < 0.2) {
      ctx.restore();
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

  // ===== PARTY MENU - Minimon Party Screen Style =====
  partyMenu(party, sel) {
    const ctx = this.ctx;
    const bx = 10, by = 30, bw = 460, bh = 420;

    const partyGrad = ctx.createLinearGradient(bx, by, bx, by + bh);
    partyGrad.addColorStop(0, rgb([20, 45, 95]));
    partyGrad.addColorStop(0.5, rgb([15, 35, 75]));
    partyGrad.addColorStop(1, rgb([10, 25, 55]));
    ctx.fillStyle = partyGrad;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = rgb(COL_WHITE); ctx.lineWidth = 3;
    ctx.strokeRect(bx - 2, by - 2, bw + 4, bh + 4);
    ctx.strokeStyle = rgb([120, 150, 200]); ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);

    this.text(bx + bw / 2, by + 20, "YOUR TEAM", COL_YELLOW, 14, true);

    for (let i = 0; i < party.length; i++) {
      const c = party[i];
      const y = by + 36 + i * 64;
      const cardH = 58;
      const sel2 = i === sel;

      if (sel2) {
        ctx.strokeStyle = rgb(COL_YELLOW); ctx.lineWidth = 2;
        ctx.strokeRect(bx + 8, y - 2, bw - 16, cardH + 4);
      } else {
        ctx.strokeStyle = rgb([80, 110, 160]); ctx.lineWidth = 1;
        ctx.strokeRect(bx + 8, y - 2, bw - 16, cardH + 4);
      }

      const fainted = c.hp <= 0;
      if (fainted) {
        ctx.globalAlpha = 0.5;
      }

      this.creatureSprite(bx + 14, y + 4, 46, c.dex);

      this.text(bx + 70, y + 16, c.name, sel2 ? COL_WHITE : COL_LGRAY, 13);
      this.text(bx + 70, y + 32, "Lv." + c.level, COL_LGRAY, 11);

      const tc = TYPE_COLORS[c.types[0]] || COL_GRAY;
      this.rect(bx + 70, y + 38, 40, 12, tc);
      this.text(bx + 90, y + 47, c.types[0], COL_WHITE, 8, true);
      if (c.types.length > 1) {
        const tc2 = TYPE_COLORS[c.types[1]] || COL_GRAY;
        this.rect(bx + 114, y + 38, 40, 12, tc2);
        this.text(bx + 134, y + 47, c.types[1], COL_WHITE, 8, true);
      }

      const hpX = bx + 170, hpW = 140;
      this.rect(hpX, y + 14, hpW, 10, [40, 40, 55]);
      const hpRatio = c.hp / Math.max(1, c.maxHP);
      const hpCol = hpRatio > 0.5 ? COL_HPG : hpRatio > 0.2 ? COL_HPY : COL_HPR;
      const fw = Math.floor(hpW * Math.max(0, Math.min(1, hpRatio)));
      if (fw > 0) this.rect(hpX, y + 14, fw, 10, hpCol);
      this.text(hpX, y + 10, "HP", COL_LGRAY, 8);
      this.text(hpX + hpW + 6, y + 22, c.hp + "/" + c.maxHP, COL_WHITE, 10);

      if (c.status) {
        const sCol = {burn:[255,120,20],poison:[180,60,200],paralyze:[255,240,60],freeze:[150,220,255],sleep:[160,160,200]}[c.status]||COL_RED;
        const sTxt = {burn:"BRN",poison:"PSN",paralyze:"PAR",freeze:"FRZ",sleep:"SLP"}[c.status]||"";
        if (sTxt) {
          this.rect(hpX, y + 30, 34, 14, [30, 30, 50]);
          this.text(hpX + 17, y + 40, sTxt, sCol, 9, true);
        }
      }

      if (fainted) {
        this.text(hpX + 50, y + 40, "FAINTED", COL_RED, 10);
      }

      if (sel2) {
        this.menuCursor(bx + 10, y + 16, 0);
      }

      if (fainted) ctx.globalAlpha = 1;
    }
  }

  // ===== MOVE MENU - Minimon Style 2x2 Grid =====
  moveMenu(moves, sel, creature, newMoveName) {
    const ctx = this.ctx;
    const bx = 10, by = 30, bw = 460, bh = 280;

    const mvGrad = ctx.createLinearGradient(bx, by, bx, by + bh);
    mvGrad.addColorStop(0, rgb([20, 45, 95]));
    mvGrad.addColorStop(0.5, rgb([15, 35, 75]));
    mvGrad.addColorStop(1, rgb([10, 25, 55]));
    ctx.fillStyle = mvGrad;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = rgb(COL_WHITE); ctx.lineWidth = 3;
    ctx.strokeRect(bx - 2, by - 2, bw + 4, bh + 4);
    ctx.strokeStyle = rgb([120, 150, 200]); ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);

    this.text(bx + bw / 2, by + 18, newMoveName ? "Learn " + newMoveName + " - Forget which?" : "CHOOSE MOVE", COL_YELLOW, 13, true);

    if (creature && !newMoveName) {
      this.text(bx + bw - 20, by + 18, "PP: " + creature.moves.reduce((a, m) => a + m.pp, 0) + "/" + creature.moves.reduce((a, m) => a + m.maxPP, 0), COL_LGRAY, 9, true);
    }

    const gridX = bx + 18, gridY = by + 32, cellW = 208, cellH = 108;
    for (let i = 0; i < moves.length; i++) {
      const mv = moves[i]; const md = MOVES[mv.id]; if (!md) continue;
      const col = i % 2, row = Math.floor(i / 2);
      const cx = gridX + col * (cellW + 12), cy = gridY + row * (cellH + 8);
      const isSel = i === sel;
      const tc = TYPE_COLORS[md.type] || COL_GRAY;

      if (isSel) {
        const cellGrad = ctx.createLinearGradient(cx, cy, cx, cy + cellH);
        cellGrad.addColorStop(0, rgb([45, 60, 95]));
        cellGrad.addColorStop(1, rgb([30, 45, 75]));
        ctx.fillStyle = cellGrad;
      } else {
        ctx.fillStyle = rgb([22, 32, 55]);
      }
      ctx.fillRect(cx, cy, cellW, cellH);

      ctx.fillStyle = rgb(tc);
      ctx.fillRect(cx, cy, 6, cellH);

      if (isSel) {
        ctx.strokeStyle = rgb(COL_YELLOW); ctx.lineWidth = 2;
        ctx.strokeRect(cx - 1, cy - 1, cellW + 2, cellH + 2);
      } else {
        ctx.strokeStyle = rgb([50, 65, 95]); ctx.lineWidth = 1;
        ctx.strokeRect(cx, cy, cellW, cellH);
      }

      this.text(cx + 14, cy + 20, md.name, isSel ? COL_WHITE : COL_LGRAY, 14);

      this.rect(cx + 14, cy + 30, 48, 13, tc);
      this.text(cx + 38, cy + 40, md.type, COL_WHITE, 8, true);

      const catName = md.category === 0 ? "Phys" : md.category === 1 ? "Spec" : "Status";
      const catCol = md.category === 0 ? COL_RED : md.category === 1 ? COL_BLUE : COL_LGRAY;
      this.rect(cx + 66, cy + 30, 38, 13, [35, 45, 65]);
      this.text(cx + 85, cy + 40, catName, catCol, 8, true);

      this.text(cx + 14, cy + 58, "PP: " + mv.pp + "/" + mv.maxPP, mv.pp > 0 ? COL_LGRAY : COL_RED, 10);

      if (md.power > 0) this.text(cx + 14, cy + 74, "Pow: " + md.power, COL_LGRAY, 10);
      this.text(cx + 110, cy + 74, "Acc: " + md.accuracy + "%", COL_LGRAY, 10);

      if (md.effect) {
        const effDesc = {burn:"BRN",freeze:"FRZ",paralyze:"PAR",poison:"PSN",sleep:"SLP",
          flinch:"Flinch",crit_boost:"High Crit",recoil:"Recoil",recover:"Heal",
          multi_hit:"Multi",confuse:"Confuse",leech:"Leech",
          atk_up:"ATK+",def_up:"DEF+",spd_up:"SPD+",satk_up:"SP.ATK+",sdef_up:"SP.DEF+",
          atk_down:"ATK-",def_down:"DEF-",spd_down:"SPD-",satk_down:"SP.ATK-",sdef_down:"SP.DEF-",
          atk_spd_up:"ATK+SPD",protect:"Prot.",sandstorm:"Sand",spite:"Spite"}[md.effect]||md.effect;
        this.text(cx + 14, cy + 90, effDesc, COL_YELLOW, 9);
      }

      if (isSel) this.menuCursor(cx - 10, cy + 8, 0);
    }

    this.text(bx + bw / 2, by + bh - 10, "Click = Use  |  Right-click = Back", COL_GRAY, 9, true);
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
    const ctx = this.ctx;
    const bx = 10, by = 30, bw = 460, bh = 420;

    const shopGrad = ctx.createLinearGradient(bx, by, bx, by + bh);
    shopGrad.addColorStop(0, rgb([20, 45, 95]));
    shopGrad.addColorStop(0.5, rgb([15, 35, 75]));
    shopGrad.addColorStop(1, rgb([10, 25, 55]));
    ctx.fillStyle = shopGrad;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = rgb(COL_WHITE); ctx.lineWidth = 3;
    ctx.strokeRect(bx - 2, by - 2, bw + 4, bh + 4);
    ctx.strokeStyle = rgb([120, 150, 200]); ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);

    const headerGrad = ctx.createLinearGradient(bx, by, bx, by + 30);
    headerGrad.addColorStop(0, rgb([200, 180, 40]));
    headerGrad.addColorStop(1, rgb([180, 150, 20]));
    ctx.fillStyle = headerGrad;
    ctx.fillRect(bx + 8, by + 4, bw - 16, 28);
    ctx.strokeStyle = rgb([240, 220, 80]); ctx.lineWidth = 1;
    ctx.strokeRect(bx + 8, by + 4, bw - 16, 28);
    this.text(bx + bw / 2, by + 22, "MINIMON MART", COL_BLACK, 14, true);

    this.text(bx + bw - 20, by + 52, "$" + money, COL_YELLOW, 12, true);

    const maxV = 10;
    const off = Math.max(0, sel - maxV + 1);
    const listY = by + 64;

    for (let i = off; i < Math.min(items.length, off + maxV); i++) {
      const item = items[i];
      const y = listY + (i - off) * 34;
      const isSel = i === sel;
      const price = PRICES[item] || 100;
      const canBuy = money >= price;

      if (isSel) {
        ctx.fillStyle = rgb([40, 60, 100]);
        ctx.fillRect(bx + 12, y, bw - 24, 30);
        ctx.strokeStyle = rgb(COL_YELLOW); ctx.lineWidth = 2;
        ctx.strokeRect(bx + 12, y, bw - 24, 30);
      }

      this.text(bx + 20, y + 18, item, isSel ? COL_WHITE : (canBuy ? COL_LGRAY : COL_GRAY), 13);

      this.text(bx + bw - 80, y + 18, "$" + price, isSel ? COL_YELLOW : (canBuy ? [200, 200, 100] : COL_RED), 11);

      const owned = player.inventory[item] || 0;
      this.text(bx + bw - 20, y + 18, "x" + owned, COL_GRAY, 10, true);

      if (isSel) this.menuCursor(bx + 12, y + 8, 0);
    }

    if (items.length > maxV) {
      this.text(bx + bw / 2, listY + maxV * 34 + 8, "(" + (sel + 1) + "/" + items.length + ")", COL_GRAY, 10, true);
    }

    this.text(bx + bw / 2, by + bh - 10, "Scroll=Select  Click=Buy  Right-click=Exit", COL_GRAY, 9, true);
  }

  dpad(cx, cy, r, bs) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = rgb([20, 20, 30]);
    ctx.beginPath();
    ctx.arc(cx, cy, r + bs / 2 + 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.35;
    const dirs = [
      { dx: 0, dy: -1, arrow: [[-5, 2], [0, -4], [5, 2]] },
      { dx: 0, dy: 1, arrow: [[-5, -2], [0, 4], [5, -2]] },
      { dx: -1, dy: 0, arrow: [[2, -5], [-4, 0], [2, 5]] },
      { dx: 1, dy: 0, arrow: [[-2, -5], [4, 0], [-2, 5]] }
    ];
    for (const dir of dirs) {
      const bx = cx + dir.dx * r - bs / 2;
      const by = cy + dir.dy * r - bs / 2;
      ctx.fillStyle = rgb(COL_WHITE);
      ctx.fillRect(bx, by, bs, bs);
      ctx.strokeStyle = rgb([80, 80, 100]);
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, bs, bs);
      ctx.fillStyle = rgb([180, 180, 200]);
      ctx.beginPath();
      const acx = bx + bs / 2, acy = by + bs / 2;
      ctx.moveTo(acx + dir.arrow[0][0], acy + dir.arrow[0][1]);
      ctx.lineTo(acx + dir.arrow[1][0], acy + dir.arrow[1][1]);
      ctx.lineTo(acx + dir.arrow[2][0], acy + dir.arrow[2][1]);
      ctx.fill();
    }
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = rgb(COL_WHITE);
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = rgb([80, 80, 100]);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
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

  // ===== PAUSE MENU - Minimon Style Blue Box =====
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

  // ===== PAUSE MENU - Minimon RSE Start Menu Style =====
  pauseMenu(player, cursor, t) {
    const ctx = this.ctx;

    ctx.globalAlpha = 0.7;
    ctx.fillStyle = rgb(COL_BLACK);
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    ctx.globalAlpha = 1;

    const bx = 30, by = 10, bw = 420, bh = 460;

    ctx.strokeStyle = rgb(COL_WHITE); ctx.lineWidth = 3;
    ctx.strokeRect(bx - 2, by - 2, bw + 4, bh + 4);
    const menuGrad = ctx.createLinearGradient(bx, by, bx, by + bh);
    menuGrad.addColorStop(0, rgb([25, 55, 110]));
    menuGrad.addColorStop(0.4, rgb([18, 40, 85]));
    menuGrad.addColorStop(1, rgb([12, 25, 55]));
    ctx.fillStyle = menuGrad;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = rgb([140, 170, 220]); ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);

    ctx.strokeStyle = rgb([80, 110, 170]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(bx + 12, by + 120); ctx.lineTo(bx + bw - 12, by + 120); ctx.stroke();

    const cardX = bx + 15, cardY = by + 12, cardW = bw - 30, cardH = 104;
    ctx.strokeStyle = rgb([100, 140, 200]); ctx.lineWidth = 1;
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    this.text(bx + bw / 2, cardY + 16, "TRAINER CARD", COL_YELLOW, 15, true);

    if (player.party.length) {
      this.npcSprite(cardX + 6, cardY + 22, 36, "professor");
    }

    const infoX = cardX + 50;
    ctx.fillStyle = rgb(COL_YELLOW);
    ctx.font = "bold 14px monospace";
    ctx.fillText(player.name, infoX, cardY + 36);
    ctx.font = "14px monospace";

    const mins = Math.floor(player.playTime / 60);
    const hrs = Math.floor(mins / 60);
    this.text(infoX, cardY + 54, "Badges: " + player.badges.length + "/8", player.badges.length >= 8 ? COL_YELLOW : COL_LGRAY, 11);
    this.text(infoX + 130, cardY + 54, "$" + player.money, COL_YELLOW, 11);
    this.text(infoX, cardY + 68, "Time: " + hrs + "h " + (mins % 60) + "m", COL_LGRAY, 10);

    const total = typeof CREATURES !== "undefined" ? Object.keys(CREATURES).length : 100;
    const caught = typeof pokedex !== "undefined" ? Object.values(pokedex).filter(v => v.caught).length : 0;
    const seen = typeof pokedex !== "undefined" ? Object.values(pokedex).filter(v => v.seen).length : 0;
    this.text(infoX, cardY + 82, "Minidex: " + seen + "/" + caught + "/" + total, COL_LGRAY, 10);

    const badgeNames = ["Gra","Stl","Msh","Fst","Elc","Lav","Inf","Wnd"];
    for (let i = 0; i < 8; i++) {
      const bxx = infoX + 130 + (i % 4) * 42, byy = cardY + 66 + Math.floor(i / 4) * 16;
      const has = i < player.badges.length;
      this.rect(bxx, byy, 36, 13, has ? [200, 170, 50] : [35, 45, 65]);
      this.text(bxx + 18, byy + 10, badgeNames[i], has ? COL_BLACK : [80, 90, 110], 7, true);
    }

    const opts = ["Party","Bag","Minidex","Save","Load","Map","Close"];
    const menuStartY = by + 132;
    const optH = 44;

    for (let i = 0; i < opts.length; i++) {
      const oy = menuStartY + i * optH;
      const sel = i === cursor;

      if (sel) {
        const selGrad = ctx.createLinearGradient(bx + 10, oy, bx + bw - 10, oy);
        selGrad.addColorStop(0, rgba([200, 180, 40], 0.15));
        selGrad.addColorStop(0.5, rgba([200, 180, 40], 0.3));
        selGrad.addColorStop(1, rgba([200, 180, 40], 0.15));
        ctx.fillStyle = selGrad;
        ctx.fillRect(bx + 10, oy + 2, bw - 20, optH - 6);
        ctx.strokeStyle = rgb(COL_YELLOW); ctx.lineWidth = 2;
        ctx.strokeRect(bx + 10, oy + 2, bw - 20, optH - 6);
      }

      const pokeX = bx + 30, pokeY = oy + 18;
      ctx.fillStyle = rgb(sel ? COL_YELLOW : COL_LGRAY);
      ctx.beginPath(); ctx.arc(pokeX, pokeY, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = rgb(sel ? COL_WHITE : COL_GRAY); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(pokeX, pokeY, 5, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pokeX - 5, pokeY); ctx.lineTo(pokeX + 5, pokeY); ctx.stroke();
      ctx.fillStyle = rgb(sel ? COL_WHITE : COL_GRAY);
      ctx.beginPath(); ctx.arc(pokeX, pokeY, 2, 0, Math.PI * 2); ctx.fill();

      this.text(bx + 46, oy + 22, opts[i], sel ? COL_YELLOW : COL_WHITE, 14);

      if (sel) this.menuCursor(bx + 14, oy + 12, t);
    }

    this.text(bx + bw / 2, by + bh - 10, "Scroll=Navigate  Click=Select  Right-click=Back", COL_GRAY, 9, true);
    ctx.globalAlpha = 1;
  }

  // ===== BAG CATEGORY MENU - Minimon Bag Style =====
  bagCatMenu(inventory, bagTab, cursor, t) {
    const ctx = this.ctx;

    ctx.globalAlpha = 0.7;
    ctx.fillStyle = rgb(COL_BLACK);
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    ctx.globalAlpha = 1;

    const bx = 15, by = 10, bw = 450, bh = 460;
    const bagGrad = ctx.createLinearGradient(bx, by, bx, by + bh);
    bagGrad.addColorStop(0, rgb([20, 45, 95]));
    bagGrad.addColorStop(0.5, rgb([15, 35, 75]));
    bagGrad.addColorStop(1, rgb([10, 25, 55]));
    ctx.fillStyle = bagGrad;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = rgb(COL_WHITE); ctx.lineWidth = 3;
    ctx.strokeRect(bx - 2, by - 2, bw + 4, bh + 4);
    ctx.strokeStyle = rgb([120, 150, 200]); ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);

    this.text(bx + bw / 2, by + 20, "BAG", COL_YELLOW, 16, true);

    const BAG_TABS = [
      { name: "Medicine", icon: "+", items: ["Potion","Super Potion","Hyper Potion","Full Heal","Revive","Full Revive"] },
      { name: "Spheres", icon: "O", items: ["Soul Sphere","Great Sphere","Ultra Sphere","Master Sphere"] },
      { name: "TMs", icon: "T", items: Object.keys(TM_MOVES || {}) },
      { name: "Battle", icon: "!", items: ["X Attack","X Defense"] }
    ];
    const isOnTab = cursor < BAG_TABS.length;
    const itemCursor = Math.max(0, cursor - BAG_TABS.length);
    const tabW = 100;
    const tabStartX = bx + 10;

    for (let i = 0; i < BAG_TABS.length; i++) {
      const tx = tabStartX + i * (tabW + 5);
      const isActive = i === bagTab;
      const isSel = i === cursor && isOnTab;

      if (isActive && !isSel) {
        ctx.fillStyle = rgb([35, 60, 110]);
        ctx.fillRect(tx, by + 34, tabW, 28);
        ctx.strokeStyle = rgb([100, 140, 200]); ctx.lineWidth = 2;
        ctx.strokeRect(tx, by + 34, tabW, 28);
      } else if (isSel) {
        ctx.fillStyle = rgb([50, 80, 140]);
        ctx.fillRect(tx, by + 32, tabW, 30);
        ctx.strokeStyle = rgb(COL_YELLOW); ctx.lineWidth = 2;
        ctx.strokeRect(tx, by + 32, tabW, 30);
      } else {
        ctx.fillStyle = rgb([20, 30, 55]);
        ctx.fillRect(tx, by + 36, tabW, 24);
        ctx.strokeStyle = rgb([60, 80, 120]); ctx.lineWidth = 1;
        ctx.strokeRect(tx, by + 36, tabW, 24);
      }

      this.text(tx + tabW / 2, by + (isSel ? 52 : 53), BAG_TABS[i].name,
        isSel ? COL_YELLOW : (isActive ? COL_WHITE : COL_LGRAY), 10, true);

      if (isSel) this.menuCursor(tx + 2, by + 40, t);
    }

    const activeTabX = tabStartX + bagTab * (tabW + 5);
    ctx.fillStyle = rgb(COL_YELLOW);
    ctx.fillRect(activeTabX, by + 64, tabW, 3);

    const items = BAG_TABS[bagTab].items.filter(name => (inventory[name] || 0) > 0);
    const listY = by + 74;
    const listH = 330;

    ctx.strokeStyle = rgb([80, 110, 160]); ctx.lineWidth = 1;
    ctx.strokeRect(bx + 8, listY, bw - 16, listH);

    if (!items.length) {
      this.text(bx + bw / 2, listY + listH / 2, "- No items in this category -", COL_GRAY, 12, true);
    } else {
      const maxShow = 9;
      const offset = Math.max(0, itemCursor - maxShow + 1);
      for (let i = offset; i < Math.min(items.length, offset + maxShow); i++) {
        const name = items[i];
        const count = inventory[name] || 0;
        const y = listY + 8 + (i - offset) * 34;
        const sel = i === itemCursor && !isOnTab;

        if (sel) {
          ctx.strokeStyle = rgb(COL_YELLOW); ctx.lineWidth = 2;
          ctx.strokeRect(bx + 14, y, bw - 28, 30);
        }

        const tabIcons = ["+", "O", "T", "!"];
        const tabCols = [[80,200,80], [100,180,255], COL_YELLOW, COL_RED];
        const iconCol = tabCols[bagTab] || COL_LGRAY;

        ctx.fillStyle = rgb(sel ? [60,80,120] : [25,40,70]);
        ctx.fillRect(bx + 16, y + 2, bw - 32, 26);

        this.rect(bx + 18, y + 4, 22, 22, iconCol);
        this.text(bx + 29, y + 19, tabIcons[bagTab] || "?", COL_WHITE, 10, true);

        this.text(bx + 48, y + 18, name, sel ? COL_WHITE : COL_LGRAY, 13);

        this.text(bx + bw - 30, y + 18, "x" + count, sel ? COL_YELLOW : COL_GRAY, 12, true);

        if (sel) this.menuCursor(bx + 14, y + 8, t);
      }
      if (items.length > maxShow) {
        this.text(bx + bw / 2, listY + listH - 8, "(" + (itemCursor + 1) + "/" + items.length + ")", COL_GRAY, 10, true);
      }
    }

    if (isOnTab && cursor < BAG_TABS.length) {
      const descY = by + bh - 50;
      this.text(bx + bw / 2, descY, BAG_TABS[cursor].name + " Items", COL_LGRAY, 11, true);
    } else if (!isOnTab && itemCursor >= 0 && itemCursor < items.length) {
      const selItemName = items[itemCursor];
      const descY = by + bh - 50;
      const desc = this.getItemDesc(selItemName);
      if (desc) this.text(bx + bw / 2, descY, desc, COL_LGRAY, 10, true);
    }

    this.text(bx + bw / 2, by + bh - 12, "Scroll=Navigate  Click=Select  Right-click=Back", COL_GRAY, 9, true);
    ctx.globalAlpha = 1;
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

  // ===== PARTY DETAIL - Minimon Full Summary Screen =====
  partyDetailMenu(party, cursor, t, mode) {
    const ctx = this.ctx;
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = rgb(COL_BLACK);
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    ctx.globalAlpha = 1;

    const bx = 8, by = 8, bw = 464, bh = 464;
    const detGrad = ctx.createLinearGradient(bx, by, bx, by + bh);
    detGrad.addColorStop(0, rgb([20, 45, 95]));
    detGrad.addColorStop(0.5, rgb([15, 35, 75]));
    detGrad.addColorStop(1, rgb([10, 25, 55]));
    ctx.fillStyle = detGrad;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = rgb(COL_WHITE); ctx.lineWidth = 3;
    ctx.strokeRect(bx - 2, by - 2, bw + 4, bh + 4);
    ctx.strokeStyle = rgb([120, 150, 200]); ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);

    const listX = bx + 4, listY = by + 4, listW = 124, listH = bh - 8;
    ctx.fillStyle = rgb([18, 28, 50]);
    ctx.fillRect(listX, listY, listW, listH);
    ctx.strokeStyle = rgb([80, 110, 160]); ctx.lineWidth = 1;
    ctx.strokeRect(listX, listY, listW, listH);

    this.text(listX + listW / 2, listY + 14, "PARTY", COL_YELLOW, 10, true);

    for (let i = 0; i < party.length; i++) {
      const c = party[i];
      const cy = listY + 22 + i * 72;
      const sel = i === cursor;

      if (sel) {
        ctx.fillStyle = rgb([40, 60, 100]);
        ctx.fillRect(listX + 2, cy, listW - 4, 66);
        ctx.strokeStyle = rgb(COL_YELLOW); ctx.lineWidth = 2;
        ctx.strokeRect(listX + 2, cy, listW - 4, 66);
      } else {
        ctx.strokeStyle = rgb([60, 80, 120]); ctx.lineWidth = 1;
        ctx.strokeRect(listX + 2, cy, listW - 4, 66);
      }

      this.creatureSprite(listX + 6, cy + 4, 34, c.dex);
      this.text(listX + 44, cy + 14, c.name, sel ? COL_WHITE : COL_LGRAY, 9);
      this.text(listX + 44, cy + 26, "Lv." + c.level, COL_GRAY, 8);
      this.hpBar(listX + 6, cy + 44, listW - 12, 5, c.hp / Math.max(1, c.maxHP));
      if (c.status) {
        const sCol = {burn:[255,120,20],poison:[180,60,200],paralyze:[255,240,60],freeze:[150,220,255],sleep:[160,160,200]}[c.status]||COL_RED;
        ctx.fillStyle = rgb(sCol);
        ctx.fillRect(listX + 6, cy + 52, 10, 5);
      }
      if (c.hp <= 0) {
        this.text(listX + 20, cy + 58, "FNT", COL_RED, 7, true);
      }
    }

    if (cursor < party.length) {
      const c = party[cursor];
      const rx = bx + 134, ry = by + 4, rw = bw - 138, rh = bh - 8;
      ctx.fillStyle = rgb([16, 32, 65]);
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = rgb([100, 130, 180]); ctx.lineWidth = 1;
      ctx.strokeRect(rx, ry, rw, rh);

      this.creatureSprite(rx + 8, ry + 8, 56, c.dex);
      this.text(rx + 72, ry + 18, c.name, COL_WHITE, 15);
      this.text(rx + 72, ry + 36, "#" + String(c.dex).padStart(3,"0"), COL_LGRAY, 10);

      const tc = TYPE_COLORS[c.types[0]] || COL_GRAY;
      this.rect(rx + 72, ry + 42, 42, 13, tc);
      this.text(rx + 93, ry + 52, c.types[0], COL_WHITE, 8, true);
      if (c.types.length > 1) {
        const tc2 = TYPE_COLORS[c.types[1]] || COL_GRAY;
        this.rect(rx + 118, ry + 42, 42, 13, tc2);
        this.text(rx + 139, ry + 52, c.types[1], COL_WHITE, 8, true);
      }

      this.text(rx + 72, ry + 64, "Lv." + c.level, COL_LGRAY, 10);

      this.text(rx + 8, ry + 78, "HP", COL_LGRAY, 9);
      const hpBarX = rx + 30, hpBarW = 170;
      this.rect(hpBarX, ry + 72, hpBarW, 10, [40, 40, 55]);
      const hpRatio = c.hp / Math.max(1, c.maxHP);
      const hpCol = hpRatio > 0.5 ? COL_HPG : hpRatio > 0.2 ? COL_HPY : COL_HPR;
      const hpFill = Math.floor(hpBarW * Math.max(0, Math.min(1, hpRatio)));
      if (hpFill > 0) this.rect(hpBarX, ry + 72, hpFill, 10, hpCol);
      this.text(hpBarX + hpBarW + 6, ry + 80, c.hp + "/" + c.maxHP, COL_WHITE, 10);

      if (c.status) {
        const sTxt = {burn:"Burn",poison:"Poison",paralyze:"Paralyze",freeze:"Freeze",sleep:"Sleep"}[c.status]||c.status;
        const sCol = {burn:[255,120,20],poison:[180,60,200],paralyze:[255,240,60],freeze:[150,220,255],sleep:[160,160,200]}[c.status]||COL_RED;
        this.text(hpBarX, ry + 90, sTxt, sCol, 10);
      }

      const statNames = ["ATK","DEF","SPD","SATK","SDEF"];
      const statCols = [COL_RED, COL_BLUE, COL_GREEN, [255,160,60], [180,100,220]];
      for (let i = 0; i < 5; i++) {
        const sy = ry + 100 + i * 18;
        this.text(rx + 8, sy + 12, statNames[i], statCols[i], 10);
        this.text(rx + 42, sy + 12, "" + c.stats[i + 1], COL_WHITE, 10);
        const statRatio = Math.min(1, c.stats[i + 1] / 200);
        const barW = 100;
        this.rect(rx + 72, sy + 4, barW, 10, [35, 40, 55]);
        this.rect(rx + 72, sy + 4, Math.floor(barW * statRatio), 10, statCols[i]);
        this.ctx.strokeStyle = rgb([60, 70, 90]); this.ctx.lineWidth = 1;
        this.ctx.strokeRect(rx + 72, sy + 4, barW, 10);
      }

      this.text(rx + 8, ry + 196, "MOVES", COL_YELLOW, 11);
      for (let i = 0; i < c.moves.length; i++) {
        const mv = c.moves[i]; const md = MOVES[mv.id];
        if (!md) continue;
        const my = ry + 210 + i * 36;
        const tc = TYPE_COLORS[md.type] || COL_GRAY;
        ctx.fillStyle = rgb([25, 35, 60]);
        ctx.fillRect(rx + 6, my, rw - 12, 32);
        ctx.fillStyle = rgb(tc);
        ctx.fillRect(rx + 6, my, 6, 32);
        this.text(rx + 18, my + 14, md.name, COL_WHITE, 11);
        this.text(rx + 18, my + 26, md.type, tc, 8);
        this.text(rx + 100, my + 14, "PP:" + mv.pp + "/" + mv.maxPP, COL_LGRAY, 9);
        if (md.power > 0) this.text(rx + 180, my + 14, "Pow:" + md.power, COL_LGRAY, 9);
        this.text(rx + 100, my + 26, "Acc:" + md.accuracy + "%", COL_LGRAY, 9);
        const catName = md.category === 0 ? "Phys" : md.category === 1 ? "Spec" : "Status";
        const catCol = md.category === 0 ? COL_RED : md.category === 1 ? COL_BLUE : COL_LGRAY;
        this.text(rx + 180, my + 26, catName, catCol, 9);
      }

      const btns = mode === "swap" ? ["Swap Here","Cancel"] : ["Swap","Summary","Back"];
      for (let i = 0; i < btns.length; i++) {
        const btnX = rx + 8 + i * 100, btnY = ry + rh - 30;
        const isBtnSel = cursor >= 0 && i === (mode === "swap" ? 0 : 2);
        ctx.fillStyle = rgb(isBtnSel ? [60, 80, 120] : [35, 45, 70]);
        ctx.fillRect(btnX, btnY, 92, 24);
        ctx.strokeStyle = rgb(isBtnSel ? COL_YELLOW : COL_LGRAY); ctx.lineWidth = isBtnSel ? 2 : 1;
        ctx.strokeRect(btnX, btnY, 92, 24);
        this.text(btnX + 46, btnY + 15, btns[i], isBtnSel ? COL_YELLOW : COL_WHITE, 10, true);
      }
    }
  }

  // World Map Screen - Minimon Town Map Style
  worldMapScreen(player, currentMapName, cursor, t) {
    const ctx = this.ctx;
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = rgb(COL_BLACK);
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    ctx.globalAlpha = 1;

    const bx = 15, by = 15, bw = 450, bh = 450;

    for (let y = by; y < by + bh; y++) {
      const ratio = (y - by) / bh;
      const r = Math.floor(195 + 30 * ratio);
      const g = Math.floor(175 + 20 * ratio);
      const b = Math.floor(130 - 10 * ratio);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(bx, y, bw, 1);
    }

    ctx.strokeStyle = rgb([120, 90, 50]); ctx.lineWidth = 3;
    ctx.strokeRect(bx - 2, by - 2, bw + 4, bh + 4);
    ctx.strokeStyle = rgb([160, 130, 80]); ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);

    for (let i = 0; i < 20; i++) {
      const sx = bx + (i * 137 + 50) % bw;
      const sy = by + (i * 97 + 30) % bh;
      ctx.fillStyle = rgba([100, 80, 50], 0.1 + Math.sin(t + i) * 0.05);
      ctx.fillRect(sx, sy, 2, 2);
    }

    const titleGrad = ctx.createLinearGradient(bx, by, bx, by + 30);
    titleGrad.addColorStop(0, rgb([200, 180, 40]));
    titleGrad.addColorStop(1, rgb([180, 150, 20]));
    ctx.fillStyle = titleGrad;
    ctx.fillRect(bx + 8, by + 4, bw - 16, 28);
    ctx.strokeStyle = rgb([240, 220, 80]); ctx.lineWidth = 1;
    ctx.strokeRect(bx + 8, by + 4, bw - 16, 28);
    this.text(bx + bw / 2, by + 22, "WORLD MAP", COL_BLACK, 14, true);

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

    ctx.strokeStyle = rgb([100, 80, 50]); ctx.lineWidth = 3;
    for (const [a, b] of connections) {
      ctx.beginPath();
      ctx.moveTo(locations[a].x, locations[a].y);
      ctx.lineTo(locations[b].x, locations[b].y);
      ctx.stroke();
    }
    ctx.strokeStyle = rgb([180, 160, 110]); ctx.lineWidth = 1;
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

      if (isCurrent) {
        const pulse = 0.4 + Math.sin(t * 4) * 0.2;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = rgb(COL_GREEN);
        ctx.beginPath(); ctx.arc(loc.x, loc.y, 14, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }

      const nodeR = isCurrent ? 8 : 6;
      const nodeCol = isCurrent ? COL_GREEN : (isCursor ? COL_YELLOW : [180, 160, 120]);
      ctx.fillStyle = rgb(nodeCol);
      ctx.beginPath(); ctx.arc(loc.x, loc.y, nodeR, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = rgb(isCurrent ? [100, 255, 100] : (isCursor ? COL_YELLOW : [120, 100, 70]));
      ctx.lineWidth = isCurrent ? 2 : 1;
      ctx.beginPath(); ctx.arc(loc.x, loc.y, nodeR, 0, Math.PI * 2); ctx.stroke();

      if (isCursor && !isCurrent) {
        ctx.strokeStyle = rgb(COL_YELLOW); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(loc.x, loc.y, nodeR + 4, 0, Math.PI * 2); ctx.stroke();
      }

      const labelCol = isCurrent ? [40, 80, 40] : (isCursor ? [160, 120, 20] : [80, 60, 40]);
      this.text(loc.x, loc.y + nodeR + 12, loc.name, labelCol, 8, true);

      if (isCursor) {
        this.text(loc.x, loc.y + nodeR + 22, loc.desc, [100, 80, 50], 8, true);
      }
    }

    if (curIdx >= 0) {
      const px = locations[curIdx].x, py = locations[curIdx].y;
      const bob = Math.sin(t * 4) * 2;
      ctx.fillStyle = rgb(COL_YELLOW);
      ctx.beginPath();
      ctx.moveTo(px, py - 16 + bob);
      ctx.lineTo(px - 5, py - 22 + bob);
      ctx.lineTo(px + 5, py - 22 + bob);
      ctx.fill();
    }

    this.text(bx + bw / 2, by + bh - 10, "Scroll=Navigate  Click/Right-click=Back", COL_GRAY, 9, true);
  }
}
