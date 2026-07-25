// Minimon - Main Game Loop (HTML5/Canvas, R1-optimized)
(function() {
"use strict";

// Canvas setup
const canvas = document.getElementById("gc");
const ctx = canvas.getContext("2d");
canvas.width = SCREEN_W; canvas.height = SCREEN_H;

function resize() {
  const s = Math.min(window.innerWidth / SCREEN_W, window.innerHeight / SCREEN_H);
  canvas.style.width = (SCREEN_W * s) + "px"; canvas.style.height = (SCREEN_H * s) + "px";
}
window.addEventListener("resize", resize); resize();

const R = new Renderer(ctx, SCREEN_W, SCREEN_H);

// Game state
const S_TITLE="title", S_INTRO="intro", S_OW="overworld", S_BATTLE="battle", S_MENU="menu",
S_PARTY="party", S_BAG="bag", S_MOVES="moves", S_DIALOG="dialog", S_EVOLUTION="evolution",
S_SHOP="shop", S_GAMEOVER="gameover", S_VICTORY="victory", S_STARTER="choose_starter",
S_TM="tm_select";

const FACING = ["down","left","up","right"];
const FACING_CYCLE = {down:"left",left:"up",up:"right",right:"down"};
const DPAD_CX=65, DPAD_CY=400, DPAD_R=32, DPAD_BS=26;

let state = S_TITLE, time = 0, cursor = 0, running = true;
let currentMap = null, dialogQueue = [], dialogCurrent = "", dialogSpeaker = "";
let pendingEvolution = null, pendingStarter = null, pendingTrainer = null, pendingGym = null;
let pendingHealer = false, pendingTrade = null, pendingMoveLearn = null, pendingTM = null;
let battleState = null, battlePhase = "select";
let shopCursor = 0;
const SHOP_ITEMS = [
  I_POTION,I_SPOTION,I_HPOTION,
  I_FHEAL,
  I_SPHERE,I_GSPHERE,I_USPHERE,
  I_REVIVE,
  I_XATK,I_XDEF,
  I_TM_EMBER,I_TM_WGUN,I_TM_VWHIP,I_TM_TSHOCK,I_TM_ISHARD,I_TM_BITE,I_TM_SBALL,I_TM_DCLAW,I_TMSEDGE,
  I_TM_ASLASH,I_TM_DGLEAM,I_TM_FLAMET,I_TM_HYDROP,I_TM_SOLBEAM,I_TM_THUND,I_TM_BLIZZ,I_TM_EQUAKE,
  I_TM_CRUNCH,I_TM_RECOVER,I_TM_SDANCE
];

// Player state
const player = {
  x:10, y:10, facing:"down", name:"Hero", party:[], money:3000, badges:[], storyFlags:{},
  rivalName:"Luna", rivalStarter:null, starterChoice:null, stepCounter:0, playTime:0,
  inventory:{[I_POTION]:5,[I_SPHERE]:10,[I_GSPHERE]:0,[I_USPHERE]:0,[I_MSPHERE]:0,
    [I_FHEAL]:1,[I_REVIVE]:0,[I_XATK]:0,[I_XDEF]:0}
};
function hasItem(it){return(player.inventory[it]||0)>0;}
function addItem(it,n){player.inventory[it]=(player.inventory[it]||0)+(n||1);}
function removeItem(it,n){if((player.inventory[it]||0)>=(n||1)){player.inventory[it]-=(n||1);return true;}return false;}
function addCreature(c){if(player.party.length<6){player.party.push(c);return true;}return false;}
function aliveParty(){return player.party.filter(c=>c.isAlive());}
function bestSphere(){if(hasItem(I_MSPHERE))return[I_MSPHERE,SPHERE_MASTER];if(hasItem(I_USPHERE))return[I_USPHERE,SPHERE_ULTRA];if(hasItem(I_GSPHERE))return[I_GSPHERE,SPHERE_GREAT];if(hasItem(I_SPHERE))return[I_SPHERE,SPHERE_NORMAL];return[null,0];}

// === STATE HANDLERS ===
function setDialog(msgs, speaker) { dialogQueue = msgs.slice(); dialogSpeaker = speaker || ""; nextDialog(); }
function nextDialog() {
  if (dialogQueue.length) { dialogCurrent = dialogQueue.shift(); return; }
  // Queue empty - process pending actions
  if (pendingStarter) { state = S_STARTER; cursor = 0; return; }
  if (pendingTrainer) { const npc = pendingTrainer; pendingTrainer = null; if (npc.type === "rival") startRivalBattle(npc); else startTrainerBattle(npc); return; }
  if (pendingGym) { const npc = pendingGym; pendingGym = null; startGymBattle(npc); return; }
  if (pendingHealer) { pendingHealer = false; healParty(); return; }
  if (pendingTrade) { const npc = pendingTrade; pendingTrade = null; executeTrade(npc); return; }
  if (pendingMoveLearn) { handleMoveLearn(); return; }
  pendingEvolution = null;
  state = S_OW;
}
function advanceDialog() {
  if (dialogQueue.length) { dialogCurrent = dialogQueue.shift(); return; }
  if (pendingStarter) { state = S_STARTER; cursor = 0; return; }
  if (pendingTrainer) { const npc = pendingTrainer; pendingTrainer = null; if (npc.type === "rival") startRivalBattle(npc); else startTrainerBattle(npc); return; }
  if (pendingGym) { const npc = pendingGym; pendingGym = null; startGymBattle(npc); return; }
  if (pendingHealer) { pendingHealer = false; healParty(); return; }
  if (pendingTrade) { const npc = pendingTrade; pendingTrade = null; executeTrade(npc); return; }
  if (pendingMoveLearn) { handleMoveLearn(); return; }
  state = S_OW;
}

function healParty() {
  for (const c of player.party) { c.hp = c.maxHP; c.status = null; c.confusionTurns = 0; }
  setDialog(["Your team has been fully healed!"]);
}

function movePlayer(dx, dy, facing) {
  player.facing = facing;
  const nx = player.x + dx, ny = player.y + dy;
  if (currentMap && walkable(currentMap, nx, ny)) {
    player.x = nx; player.y = ny; player.stepCounter++;
    const tile = getT(currentMap, nx, ny);
    if (tile === TILE_DOOR) {
      for (const d of currentMap.doors) { if (d.x === nx && d.y === ny) { changeMap(d.dest, d.destX, d.destY); return; } }
    }
    if (tile === TILE_HEAL) healParty();
    if (encTile(currentMap, nx, ny)) {
      const enc = getEnc(currentMap);
      if (enc) startWildBattle(enc[0], enc[1]);
    }
  }
}

function changeMap(idx, x, y) {
  if (idx >= 0 && idx < MAP_COUNT) { currentMap = MAP_CREATORS[idx](); player.x = x; player.y = y; }
}

function getInteractableInfo() {
  if (!currentMap) return null;
  let fx = player.x, fy = player.y;
  if (player.facing === "up") fy--; else if (player.facing === "down") fy++;
  else if (player.facing === "left") fx--; else if (player.facing === "right") fx++;
  for (const npc of currentMap.npcs) if (npc.x === fx && npc.y === fy) return { type: "npc", x: fx, y: fy };
  for (const s of currentMap.signs) if (s.x === fx && s.y === fy) return { type: "sign", x: fx, y: fy };
  if (INTERACTABLE.has(getT(currentMap, fx, fy))) return { type: "tile", x: fx, y: fy };
  return null;
}

function interact() {
  if (!currentMap) return;
  let fx = player.x, fy = player.y;
  if (player.facing === "up") fy--; else if (player.facing === "down") fy++;
  else if (player.facing === "left") fx--; else if (player.facing === "right") fx++;
  for (const npc of currentMap.npcs) { if (npc.x === fx && npc.y === fy) { interactNPC(npc); return; } }
  for (const s of currentMap.signs) { if (s.x === fx && s.y === fy) { setDialog([s.text]); return; } }
  const tile = getT(currentMap, fx, fy);
  if (tile === TILE_GYM) { for (const npc of currentMap.npcs) if (npc.type === "gym_leader" && !npc.defeated) { startGymBattle(npc); return; } }
  if (tile === TILE_SHOP) { state = S_SHOP; shopCursor = 0; return; }
  if (tile === TILE_HEAL) { for (const npc of currentMap.npcs) if (npc.type === "healer") { interactNPC(npc); return; } }
}

function interactNPC(npc) {
  if (["trainer","rival","gym_leader"].includes(npc.type) && !npc.defeated) {
    setDialog(npc.dialog, npc.name);
    if (npc.type === "gym_leader") pendingGym = npc; else pendingTrainer = npc;
    return;
  }
  if (npc.type === "healer") { setDialog(npc.dialog || ["Let me heal your Minis!"], npc.name); pendingHealer = true; return; }
  if (npc.type === "item_giver") {
    if (npc.gave_item) { setDialog(["Thanks for taking the " + npc.give_item + "!"], npc.name); return; }
    const msgs = [...(npc.dialog || ["I have something for you!"])];
    if (npc.give_item) { addItem(npc.give_item, npc.give_count || 1); npc.gave_item = true; msgs.push("Received " + npc.give_item + " x" + (npc.give_count || 1) + "!"); }
    setDialog(msgs, npc.name); return;
  }
  if (npc.type === "trade_npc") {
    if (npc.traded) { setDialog(["Thanks for the trade!"], npc.name); return; }
    const want = npc.trade_want_type;
    const has = player.party.some(c => c.types.includes(want));
    if (has) { setDialog(npc.dialog || ["Want to trade?"], npc.name); pendingTrade = npc; }
    else { setDialog(["I'm looking for a " + want + " type Mini to trade!"], npc.name); }
    return;
  }
  setDialog(npc.dialog || ["..."], npc.name);
}

function executeTrade(npc) {
  const want = npc.trade_want_type;
  for (let i = 0; i < player.party.length; i++) {
    if (player.party[i].types.includes(want)) {
      const old = player.party[i].name;
      player.party[i] = new BattleCreature(npc.give_dex, player.party[i].level);
      npc.traded = true;
      setDialog(["Traded " + old + " for " + npc.give_name + "!"]); return;
    }
  }
  setDialog(["You don't have a " + want + " type Mini to trade!"]);
}

// Battle start functions
function startWildBattle(dex, lv) {
  const wild = new BattleCreature(dex, lv, null, true);
  if (!aliveParty().length) { state = S_GAMEOVER; return; }
  battleState = new BattleState(aliveParty(), [wild], false, "", true, true);
  state = S_BATTLE; battlePhase = "menu"; cursor = 0;
  battleState.message = "A wild " + wild.name + " appeared!";
}
function startTrainerBattle(npc) {
  const party = npc.party.map(([d, l]) => new BattleCreature(d, l));
  if (!aliveParty().length) { state = S_GAMEOVER; return; }
  battleState = new BattleState(aliveParty(), party, true, npc.name, false, false);
  state = S_BATTLE; battlePhase = "menu"; cursor = 0;
  battleState.message = npc.name + " wants to battle!";
}
function startRivalBattle(npc) {
  const lv = npc.rival_enc === 1 ? 14 : 20;
  const party = [new BattleCreature(player.rivalStarter, lv)];
  if (!aliveParty().length) { state = S_GAMEOVER; return; }
  battleState = new BattleState(aliveParty(), party, true, npc.name, false, false);
  state = S_BATTLE; battlePhase = "menu"; cursor = 0;
  battleState.message = "Rival " + npc.name + " wants to battle!";
}
function startGymBattle(npc) {
  const party = npc.party.map(([d, l]) => new BattleCreature(d, l));
  if (!aliveParty().length) { state = S_GAMEOVER; return; }
  battleState = new BattleState(aliveParty(), party, true, npc.name, false, false);
  state = S_BATTLE; battlePhase = "menu"; cursor = 0;
  battleState.message = "Gym Leader " + npc.name + " wants to battle!";
}

// Battle action handlers
function selectBattleAction() {
  const actions = ["Fight","Bag","Party","Run"];
  const action = actions[cursor];
  if (action === "Fight") { battlePhase = "moves"; cursor = 0; }
  else if (action === "Bag") { battlePhase = "bag"; cursor = 0; }
  else if (action === "Party") { battlePhase = "party"; cursor = 0; }
  else if (action === "Run") {
    if (battleState.canEscape) { battleState.fled = true; battleState.battleOver = true; battleState.message = "Got away safely!"; battlePhase = "message"; }
    else { battleState.addMsg("Can't escape!"); battlePhase = "message"; }
  }
}

function useBattleMove() {
  const p = battleState.player; const mv = p.moves[cursor];
  if (mv.pp <= 0) { battleState.addMsg("No PP left!"); battlePhase = "message"; return; }
  battleState.executeTurn(cursor);
  if (!battleState.enemy.isAlive()) {
    if (!battleState.nextEnemy()) {
      battleState.playerWon = true; battleState.battleOver = true;
      battleState.addMsg("You defeated " + battleState.trainerName + "!");
      if (battleState.isTrainer) {
        for (const npc of currentMap.npcs) {
          if (npc.name === battleState.trainerName) {
            npc.defeated = true;
            if (npc.reward) { player.money += npc.reward; battleState.addMsg("Got $" + npc.reward + "!"); }
            if (npc.badge) { player.badges.push(npc.badge); battleState.addMsg("Got " + npc.badge + "!"); }
          }
        }
      }
    }
  } else if (!battleState.player.isAlive()) {
    if (!battleState.nextPlayer()) { battleState.playerWon = false; battleState.battleOver = true; battleState.addMsg("No more Minis!"); }
    else battleState.addMsg("Go, " + battleState.player.name + "!");
  }
  battlePhase = "message";
}

function switchBattleCreature() {
  const target = player.party[cursor];
  if (!target.isAlive()) { battleState.addMsg(target.name + " can't fight!"); battlePhase = "message"; return; }
  if (target === battleState.player) { battleState.addMsg(target.name + " is already out!"); battlePhase = "message"; return; }
  const old = battleState.player.name;
  battleState.playerIdx = cursor;
  battleState.addMsg(old + ", come back! Go, " + target.name + "!");
  // Enemy attacks after switch
  const e = battleState.enemy;
  if (e && e.isAlive() && battleState.player && battleState.player.isAlive()) {
    const eMV = getAIMove(e, battleState.player, battleState.isTrainer ? AI_TRAINER : AI_WILD);
    const eMD = MOVES[eMV.id];
    if (eMD && eMD.category !== STATUS) {
      const [damage, effect] = calcDamage(e, battleState.player, eMD);
      battleState.player.takeDamage(damage);
      if (eMV.pp > 0) eMV.pp--;
      let effText = "";
      if (effect === "super_effective") effText = " It's super effective!";
      else if (effect === "not_effective") effText = " It's not very effective...";
      else if (effect === "no_effect") effText = " It had no effect!";
      else if (effect && effect.includes("critical")) effText = " A critical hit!";
      battleState.addMsg(e.name + " used " + eMD.name + "!" + effText);
      if (!battleState.player.isAlive()) battleState.addMsg(battleState.player.name + " fainted!");
    } else if (eMD) {
      applyStatus(e, battleState.player, eMD);
      if (eMV.pp > 0) eMV.pp--;
      battleState.addMsg(e.name + " used " + eMD.name + "!");
    }
  }
  battlePhase = "message";
}

function useBattleItem() {
  const items = Object.entries(player.inventory).filter(([k, v]) => v > 0 && [I_POTION,I_SPOTION,I_HPOTION,I_FHEAL,I_SPHERE,I_GSPHERE,I_USPHERE,I_MSPHERE,I_REVIVE,I_FREVIVE].includes(k));
  if (cursor >= items.length) return;
  const [name] = items[cursor];
  if ([I_POTION,I_SPOTION,I_HPOTION].includes(name)) {
    const amt = { [I_POTION]:20, [I_SPOTION]:60, [I_HPOTION]:200 }[name];
    if (removeItem(name)) { battleState.player.heal(amt); battleState.addMsg("Used " + name + "! Healed " + amt + " HP!"); }
  } else if (name === I_FHEAL) {
    if (removeItem(name)) { battleState.player.status = null; battleState.player.confusionTurns = 0; battleState.addMsg("Status healed!"); }
  } else if ([I_SPHERE,I_GSPHERE,I_USPHERE,I_MSPHERE].includes(name)) {
    const mult = { [I_SPHERE]:1, [I_GSPHERE]:1.5, [I_USPHERE]:2, [I_MSPHERE]:255 }[name];
    if (removeItem(name)) {
      const [caught, shakes] = attemptCatch(battleState.enemy, mult);
      if (caught) {
        if (player.party.length >= 6) {
          battleState.addMsg("Gotcha! But your team is full! " + battleState.enemy.name + " got away!");
          if (!battleState.nextEnemy()) { battleState.playerWon = true; battleState.battleOver = true; }
        } else {
          battleState.addMsg("Gotcha! " + battleState.enemy.name + " was caught!");
          const c = new BattleCreature(battleState.enemy.dex, battleState.enemy.level);
          addCreature(c);
          if (!battleState.nextEnemy()) { battleState.playerWon = true; battleState.battleOver = true; }
        }
      } else battleState.addMsg("Broke free! (" + shakes + "/4)");
    }
  } else if ([I_REVIVE,I_FREVIVE].includes(name)) {
    const fainted = player.party.filter(c => !c.isAlive() && c !== battleState.player);
    if (fainted.length) { const hp = name === I_REVIVE ? 1 : fainted[0].maxHP; if (removeItem(name)) { fainted[0].hp = hp; battleState.addMsg(fainted[0].name + " revived!"); } }
    else battleState.addMsg("No fainted Minis!");
  }
  battlePhase = "message";
}

function nextBattleMsg() {
  const msg = battleState.getNextMsg();
  if (msg) { battleState.message = msg; return; }
  if (battleState.battleOver) {
    if (battleState.fled) state = S_OW;
    else if (battleState.playerWon) { checkEvolution(); if (state !== S_EVOLUTION && state !== S_MOVES) state = S_OW; }
    else state = S_GAMEOVER;
  } else { battlePhase = "menu"; cursor = 0; }
}

function checkEvolution() {
  for (const c of player.party) {
    if (c.pendingMoves && c.pendingMoves.length) {
      const nm = c.pendingMoves.shift(); const m = MOVES[nm.id]; if (!m) continue;
      if (c.moves.length >= 4) { pendingMoveLearn = { creature: c, newMove: nm }; state = S_MOVES; cursor = 0; }
      else { c.moves.push(nm); setDialog([c.name + " learned " + m.name + "!"]); }
      return;
    }
  }
  for (const c of player.party) {
    if (c.canEvolve()) {
      const [od, nd] = c.evolve();
      pendingEvolution = [od, nd];
      setDialog([CREATURES[od].name + " is evolving!", CREATURES[od].name + " evolved into " + CREATURES[nd].name + "!"]);
      state = S_EVOLUTION; return;
    }
  }
}

function handleMoveLearn() {
  if (!pendingMoveLearn) return;
  const { creature, newMove } = pendingMoveLearn;
  const md = MOVES[newMove.id];
  // Auto-learn if space
  if (creature.moves.length < 4) { creature.moves.push(newMove); pendingMoveLearn = null; setDialog([creature.name + " learned " + md.name + "!"]); return; }
  // Otherwise show forget menu
  state = S_MOVES; cursor = 0;
}

function chooseStarter() {
  const dex = pendingStarter[cursor];
  const starter = new BattleCreature(dex, 5);
  addCreature(starter);
  player.starterChoice = dex; player.storyFlags[FLAG_STARTER] = true;
  // Rival picks the type that has advantage over yours
  const starterAdvantage = { 1: 3, 2: 1, 3: 2 };
  player.rivalStarter = starterAdvantage[dex] || pendingStarter[(cursor + 1) % 3];
  pendingStarter = null;
  addItem(I_SPHERE, 10);
  addItem(I_POTION, 5);
  addItem(I_FHEAL, 1);
  setDialog([
    "You chose " + starter.name + "!",
    "Professor Sage gave you 10 Mini Balls and 5 Potions!",
    "You also got 1 Full Heal for emergencies!",
    "Now go out there and catch some Minis!",
    "Remember - weaken them first, then throw a Mini Ball!",
    "Luna is waiting for you on Route 1..."
  ]);
}

function useTM(itemName) {
  const tmMove = TM_MOVES[itemName]; const compat = TM_COMPAT[itemName] || [];
  if (!tmMove) { setDialog(["This TM is invalid!"]); return; }
  const compatible = player.party.filter(c => c.types.some(t => compat.includes(t)));
  if (!compatible.length) { setDialog(["No Minis can learn this move!"]); return; }
  pendingTM = { itemName, compatible };
  state = S_TM; cursor = 0;
}

function selectTMCreature() {
  if (!pendingTM) return;
  const { itemName, compatible } = pendingTM;
  const tmMove = TM_MOVES[itemName];
  if (cursor >= compatible.length) return;
  const creature = compatible[cursor];
  const nm = { id: tmMove, pp: MOVES[tmMove].maxPP, maxPP: MOVES[tmMove].maxPP };
  if (creature.moves.length >= 4) {
    pendingMoveLearn = { creature, newMove: nm };
    pendingTM = null;
    state = S_MOVES; cursor = 0;
  } else {
    creature.moves.push(nm);
    pendingTM = null;
    removeItem(itemName);
    setDialog([creature.name + " learned " + MOVES[tmMove].name + "!"]);
    state = S_DIALOG;
  }
}

// Menu handlers
function selectMenu() {
  const opts = ["Party","Bag","Save","Pokedex","Quit"];
  const choice = opts[cursor];
  if (choice === "Party") { state = S_PARTY; cursor = 0; }
  else if (choice === "Bag") { state = S_BAG; cursor = 0; }
  else if (choice === "Save") { setDialog(["Game saved! (Not really, but imagine it!)"]); }
  else if (choice === "Pokedex") { setDialog(["Seen " + Object.keys(CREATURES).length + " Minis in Minimon!"]); }
  else if (choice === "Quit") running = false;
}

function selectParty() {
  if (cursor < player.party.length) {
    const c = player.party[cursor];
    setDialog([c.name + " Lv." + c.level, "HP: " + c.hp + "/" + c.maxHP, "ATK: " + c.stats[1] + " DEF: " + c.stats[2], "SPD: " + c.stats[3] + " SPC: " + c.stats[4]]);
  }
}

function useItem() {
  const items = Object.entries(player.inventory).filter(([, v]) => v > 0);
  if (cursor >= items.length) return;
  const [name] = items[cursor];
  if ([I_POTION,I_SPOTION,I_HPOTION].includes(name)) {
    if (player.party.length) {
      const amt = { [I_POTION]:20, [I_SPOTION]:60, [I_HPOTION]:200 }[name];
      for (const c of player.party) {
        if (c.hp < c.maxHP) {
          if (removeItem(name)) { c.heal(amt); setDialog(["Used " + name + " on " + c.name + "! Healed " + amt + " HP!"]); }
          else setDialog(["No " + name + " left!"]);
          return;
        }
      }
      setDialog(["All Minis are at full health!"]);
    } else setDialog(["No Minis to heal!"]);
  } else if (name === I_FHEAL) {
    for (const c of player.party) { c.status = null; c.confusionTurns = 0; }
    removeItem(name); setDialog(["All status conditions cured!"]);
  } else if (ALL_TM.includes(name)) { useTM(name); return; }
  else if ([I_REVIVE,I_FREVIVE].includes(name)) {
    const fainted = player.party.filter(c => !c.isAlive());
    if (fainted.length) { const hp = name === I_REVIVE ? 1 : fainted[0].maxHP; if (removeItem(name)) setDialog([fainted[0].name + " revived!"]); }
    else setDialog(["No fainted Minis!"]);
  } else setDialog([name + " can only be used in battle!"]);
  state = S_DIALOG; nextDialog();
}

function buyItem() {
  const item = SHOP_ITEMS[shopCursor]; const price = PRICES[item] || 100;
  if (player.money >= price) { player.money -= price; addItem(item); setDialog(["Bought " + item + " for $" + price + "!"]); }
  else setDialog(["Not enough money!"]);
  state = S_DIALOG; nextDialog();
}

// === INPUT HANDLING ===
let scrollCD = 0;
function handleScroll(dir) {
  if (state === S_TITLE) { state = S_INTRO; advanceIntro(); }
  else if (state === S_INTRO) advanceIntro();
  else if (state === S_BATTLE) {
    if (battlePhase === "message") nextBattleMsg();
    else if (battlePhase === "select") cursor = Math.max(0, Math.min(3, cursor + dir));
    else if (battlePhase === "moves") { const m = battleState.player.moves; cursor = Math.max(0, Math.min(m.length - 1, cursor + dir)); }
    else if (battlePhase === "party") cursor = Math.max(0, Math.min(player.party.length - 1, cursor + dir));
    else if (battlePhase === "bag") { const items = Object.entries(player.inventory).filter(([k, v]) => v > 0 && [I_POTION,I_SPOTION,I_HPOTION,I_FHEAL,I_SPHERE,I_GSPHERE,I_USPHERE,I_MSPHERE,I_REVIVE,I_FREVIVE].includes(k)); cursor = Math.max(0, Math.min(items.length - 1, cursor + dir)); }
  }
  else if (state === S_MENU) cursor = Math.max(0, Math.min(4, cursor + dir));
  else if (state === S_PARTY) cursor = Math.max(0, Math.min(player.party.length - 1, cursor + dir));
  else if (state === S_BAG) { const items = Object.entries(player.inventory).filter(([, v]) => v > 0); cursor = Math.max(0, Math.min(items.length - 1, cursor + dir)); }
  else if (state === S_MOVES && pendingMoveLearn) { cursor = Math.max(0, Math.min(pendingMoveLearn.creature.moves.length - 1, cursor + dir)); }
  else if (state === S_DIALOG) advanceDialog();
  else if (state === S_SHOP) shopCursor = Math.max(0, Math.min(SHOP_ITEMS.length - 1, shopCursor + dir));
  else if (state === S_EVOLUTION) advanceDialog();
  else if (state === S_STARTER) cursor = Math.max(0, Math.min(2, cursor + dir));
  else if (state === S_TM && pendingTM) cursor = Math.max(0, Math.min(pendingTM.compatible.length - 1, cursor + dir));
  else if (state === S_GAMEOVER) { initGame(); state = S_TITLE; }
}

function handleClick(button, mx, my) {
  if (state === S_TITLE || state === S_INTRO) advanceIntro();
  else if (state === S_OW) {
    if (button === 1) {
      // Check D-pad
      const dx = mx - DPAD_CX, dy = my - DPAD_CY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= DPAD_R && dist > 8) {
        let dir;
        if (Math.abs(dx) > Math.abs(dy)) dir = dx > 0 ? "right" : "left";
        else dir = dy > 0 ? "down" : "up";
        const ddx = dir === "right" ? 1 : dir === "left" ? -1 : 0;
        const ddy = dir === "down" ? 1 : dir === "up" ? -1 : 0;
        movePlayer(ddx, ddy, dir);
      } else if (getInteractableInfo()) interact();
      else {
        const ddx = player.facing === "right" ? 1 : player.facing === "left" ? -1 : 0;
        const ddy = player.facing === "down" ? 1 : player.facing === "up" ? -1 : 0;
        movePlayer(ddx, ddy, player.facing);
      }
    } else if (button === 3) { state = S_MENU; cursor = 0; }
  }
  else if (state === S_BATTLE) {
    if (button === 1) {
      if (battlePhase === "message") nextBattleMsg();
      else if (battlePhase === "select") selectBattleAction();
      else if (battlePhase === "moves") useBattleMove();
      else if (battlePhase === "party") switchBattleCreature();
      else if (battlePhase === "bag") useBattleItem();
    } else if (button === 3) {
      if (["moves","party","bag"].includes(battlePhase)) { battlePhase = "menu"; cursor = 0; }
    }
  }
  else if (state === S_MENU && button === 1) selectMenu();
  else if (state === S_MENU && button === 3) { state = S_OW; }
  else if (state === S_PARTY && button === 1) selectParty();
  else if (state === S_PARTY && button === 3) { state = S_MENU; cursor = 0; }
  else if (state === S_BAG && button === 1) useItem();
  else if (state === S_BAG && button === 3) { state = S_MENU; cursor = 0; }
  else if (state === S_MOVES && button === 1) {
    if (pendingMoveLearn) {
      const c = pendingMoveLearn.creature, nm = pendingMoveLearn.newMove;
      if (cursor < c.moves.length) {
        const oldName = MOVES[c.moves[cursor].id]?.name;
        c.moves[cursor] = nm;
        const tmItem = pendingTM ? pendingTM.itemName : null;
        pendingMoveLearn = null;
        if (tmItem) { pendingTM = null; removeItem(tmItem); }
        setDialog([c.name + " forgot " + oldName + " and learned " + MOVES[nm.id].name + "!"]);
      }
    }
  }
  else if (state === S_DIALOG) advanceDialog();
  else if (state === S_SHOP) {
    if (button === 1) buyItem(); else if (button === 3) state = S_OW;
  }
  else if (state === S_EVOLUTION) advanceDialog();
  else if (state === S_STARTER && button === 1) chooseStarter();
  else if (state === S_TM && button === 1) selectTMCreature();
  else if (state === S_TM && button === 3) { pendingTM = null; state = S_BAG; cursor = 0; }
  else if (state === S_GAMEOVER) { initGame(); state = S_TITLE; }
}

function handleKeyDown(key) {
  if (state === S_OW) {
    if (key === "m" || key === "M") { state = S_MENU; cursor = 0; }
    else if (key === "ArrowUp" || key === "w") movePlayer(0, -1, "up");
    else if (key === "ArrowDown" || key === "s") movePlayer(0, 1, "down");
    else if (key === "ArrowLeft" || key === "a") movePlayer(-1, 0, "left");
    else if (key === "ArrowRight" || key === "d") movePlayer(1, 0, "right");
    else if (key === "Enter" || key === " ") interact();
  } else if (state === S_BATTLE) {
    if (key === "Escape") { if (["moves","party","bag"].includes(battlePhase)) { battlePhase = "menu"; cursor = 0; } }
    else if (key === "Enter" || key === " ") {
      if (battlePhase === "message") nextBattleMsg();
      else if (battlePhase === "select") selectBattleAction();
      else if (battlePhase === "moves") useBattleMove();
      else if (battlePhase === "party") switchBattleCreature();
      else if (battlePhase === "bag") useBattleItem();
    }
  } else if (state === S_MENU) {
    if (key === "Escape") state = S_OW;
    else if (key === "Enter" || key === " ") selectMenu();
  } else if (state === S_PARTY && key === "Escape") { state = S_MENU; cursor = 0; }
  else if (state === S_BAG && key === "Escape") { state = S_MENU; cursor = 0; }
  else if (state === S_MOVES && key === "Escape") {
    if (pendingMoveLearn) { const { creature, newMove } = pendingMoveLearn; pendingMoveLearn = null; pendingTM = null; setDialog([creature.name + " did not learn " + MOVES[newMove.id].name + "."]); }
    else { state = S_MENU; cursor = 0; }
  }
  else if (state === S_STARTER && key === "Escape") state = S_TITLE;
  else if (state === S_TM && key === "Escape") { pendingTM = null; state = S_BAG; cursor = 0; }
  else if (state === S_GAMEOVER && key === "Enter") { initGame(); state = S_TITLE; }
}

function advanceIntro() {
  setDialog([
    "Welcome to the world of Minimon!",
    "I'm Professor Sage. I study the mysterious creatures called Minis.",
    "But first... what is your name?",
    "Well then, " + player.name + "! Your adventure begins now!",
    "Your neighbor Luna has also just received a partner Mini.",
    "Now, choose your very first Mini wisely!",
    "It will be your trusted partner on this journey!"
  ]);
  pendingStarter = [1, 2, 3]; // Fire, Water, Grass
}

// === GAME INIT ===
function initGame() {
  player.x = 10; player.y = 10; player.facing = "down"; player.party = [];
  player.money = 3000; player.badges = []; player.storyFlags = {}; player.stepCounter = 0;
  player.inventory = {[I_POTION]:5,[I_SPHERE]:10,[I_GSPHERE]:0,[I_USPHERE]:0,[I_MSPHERE]:0,[I_FHEAL]:1,[I_REVIVE]:0,[I_XATK]:0,[I_XDEF]:0};
  currentMap = MAP_CREATORS[0]();
}

// === EVENT LISTENERS ===
canvas.addEventListener("wheel", e => { e.preventDefault(); if (scrollCD <= 0) { handleScroll(e.deltaY > 0 ? 1 : -1); scrollCD = 0.15; } }, { passive: false });
canvas.addEventListener("mousedown", e => { e.preventDefault(); const r = canvas.getBoundingClientRect(); const x = (e.clientX - r.left) / (r.width / SCREEN_W); const y = (e.clientY - r.top) / (r.height / SCREEN_H); handleClick(e.button, x, y); }, { passive: false });
canvas.addEventListener("contextmenu", e => e.preventDefault());

// Touch support
let touchStart = null;
canvas.addEventListener("touchstart", e => { e.preventDefault(); const t = e.touches[0]; const r = canvas.getBoundingClientRect(); touchStart = { x: (t.clientX - r.left) / (r.width / SCREEN_W), y: (t.clientY - r.top) / (r.height / SCREEN_H), time: Date.now() }; }, { passive: false });
canvas.addEventListener("touchend", e => { e.preventDefault(); if (!touchStart) return; const t = e.changedTouches[0]; const r = canvas.getBoundingClientRect(); const x = (t.clientX - r.left) / (r.width / SCREEN_W); const y = (t.clientY - r.top) / (r.height / SCREEN_H); const dx = x - touchStart.x, dy = y - touchStart.y; const dt = Date.now() - touchStart.time; if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 300) handleClick(1, x, y); else if (dt < 300) { const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"); handleScroll(dir === "up" || dir === "left" ? -1 : 1); } touchStart = null; }, { passive: false });

// Keyboard
document.addEventListener("keydown", e => { handleKeyDown(e.key); });

// R1 side button simulation (right-click = back)
document.addEventListener("mousedown", e => { if (e.button === 2) handleClick(3, 0, 0); });

// === GAME LOOP ===
let lastTime = 0;
initGame();

function gameLoop(timestamp) {
  if (!running) return;
  const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
  lastTime = timestamp; time += dt; scrollCD = Math.max(0, scrollCD - dt);
  player.playTime += dt;

  // Render
  R.clear();
  if (state === S_TITLE || state === S_INTRO) R.startScreen(time);
  else if (state === S_STARTER) renderStarter();
  else if (state === S_OW || state === S_DIALOG) renderOverworld();
  else if (state === S_BATTLE) renderBattle();
  else if (state === S_MENU) renderMenu();
  else if (state === S_PARTY) R.partyMenu(player.party, cursor);
  else if (state === S_BAG) R.inventoryMenu(player.inventory, cursor);
  else if (state === S_MOVES && pendingMoveLearn) R.moveMenu(pendingMoveLearn.creature.moves, cursor, pendingMoveLearn.creature, MOVES[pendingMoveLearn.newMove.id]?.name);
  else if (state === S_SHOP) R.shopMenu(SHOP_ITEMS, shopCursor, player.money);
  else if (state === S_EVOLUTION && pendingEvolution) R.evolveScreen(pendingEvolution[0], pendingEvolution[1], time);
  else if (state === S_TM && pendingTM) R.tmSelectMenu(pendingTM.compatible, cursor, MOVES[TM_MOVES[pendingTM.itemName]]?.name, pendingTM.itemName);
  else if (state === S_GAMEOVER) {
    R.rect(0, 0, SCREEN_W, SCREEN_H, COL_BG);
    R.text(240, 200, "GAME OVER", COL_RED, 28, true);
    R.text(240, 250, "Your Minis have fainted...", COL_GRAY, 14, true);
    R.text(240, 300, "Click to try again", COL_WHITE, 14, true);
  }

  requestAnimationFrame(gameLoop);
}

function renderStarter() {
  ctx.fillStyle = rgb(COL_BG); ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  R.text(240, 30, "Professor Sage", COL_YELLOW, 16, true);
  R.text(240, 50, "Choose your first Mini partner!", COL_WHITE, 14, true);
  const choices = pendingStarter;
  for (let i = 0; i < choices.length; i++) {
    const dex = choices[i], x = 40 + i * 160;
    if (i === cursor) R.rect(x - 5, 70, 150, 330, COL_SELECT, 0.2);
    const t = CREATURES[dex];
    R.creatureSprite(x + 40, 80, 80, dex, 5);
    R.text(x + 75, 180, t.name, i === cursor ? COL_YELLOW : COL_WHITE, 14, true);
    R.text(x + 75, 198, t.types.join("/"), TYPE_COLORS[t.types[0]] || COL_GRAY, 11, true);
    R.text(x + 75, 216, "HP:" + t.baseStats[0] + " ATK:" + t.baseStats[1], COL_GRAY, 10, true);
    R.text(x + 75, 230, "DEF:" + t.baseStats[2] + " SPD:" + t.baseStats[3], COL_GRAY, 10, true);
    // Show starting moves
    const startMoves = t.moves.filter(([lv]) => lv <= 5);
    R.text(x + 75, 252, "Moves:", COL_LGRAY, 10, true);
    for (let j = 0; j < startMoves.length && j < 3; j++) {
      const mv = MOVES[startMoves[j][1]];
      if (mv) {
        const tc = TYPE_COLORS[mv.type] || COL_GRAY;
        R.text(x + 75, 268 + j * 14, "  " + mv.name, tc, 10, true);
      }
    }
  }
  R.text(240, 410, "Scroll = Choose | Click = Confirm", COL_GRAY, 11, true);
  R.text(240, 430, "Pick carefully - this is your partner!", COL_YELLOW, 11, true);
}

function renderOverworld() {
  if (currentMap) {
    R.townMap(currentMap, player.x, player.y, time);
    R.hud(player, currentMap.name);
    const info = getInteractableInfo();
    if (info) R.interactBubble(info.x * TILE + TILE / 2, info.y * TILE - 12, time);
    R.dpad(DPAD_CX, DPAD_CY, DPAD_R, DPAD_BS);
    if (state === S_DIALOG) R.dialogBox(dialogCurrent, dialogSpeaker);
  }
}

function renderBattle() {
  if (!battleState) return;
  R.battleScene(battleState.player, battleState.enemy, time);
  if (battleState.message) {
    R.box(10, 310, 460, 80);
    const lines = R.wrapText(battleState.message, 440);
    for (let i = 0; i < Math.min(lines.length, 3); i++) R.text(20, 328 + i * 18, lines[i], COL_WHITE, 14);
  }
  if (battlePhase === "menu") {
    R.box(10, 400, 460, 70);
    const actions = ["Fight","Bag","Party","Run"];
    for (let i = 0; i < 4; i++) {
      const x = 30 + (i % 2) * 230, y = 415 + Math.floor(i / 2) * 28;
      if (i === cursor) R.rect(x - 5, y - 2, 100, 22, COL_SELECT, 0.5);
      R.text(x, y + 12, actions[i], i === cursor ? COL_YELLOW : COL_WHITE, 14);
    }
    const cx = 20 + (cursor % 2) * 230, cy = 413 + Math.floor(cursor / 2) * 28;
    R.menuCursor(cx, cy, time);
  } else if (battlePhase === "moves") R.moveMenu(battleState.player.moves, cursor, battleState.player);
  else if (battlePhase === "party") R.partyMenu(player.party, cursor);
  else if (battlePhase === "bag") {
    const items = Object.entries(player.inventory).filter(([k, v]) => v > 0 && [I_POTION,I_SPOTION,I_HPOTION,I_FHEAL,I_SPHERE,I_GSPHERE,I_USPHERE,I_MSPHERE,I_REVIVE,I_FREVIVE].includes(k));
    R.box(10, 30, 460, 350); R.text(240, 48, "BAG", COL_YELLOW, 14, true);
    for (let i = 0; i < items.length; i++) {
      const [item, count] = items[i]; const y = 65 + i * 32;
      if (i === cursor) R.rect(16, y, 448, 28, COL_SELECT, 0.3);
      R.text(24, y + 18, item + " x" + count, i === cursor ? COL_WHITE : COL_LGRAY, 14);
    }
  }
}

function renderMenu() {
  R.box(100, 50, 280, 380); R.text(240, 68, "MENU", COL_YELLOW, 14, true);
  const opts = ["Party","Bag","Save","Pokedex","Quit"];
  for (let i = 0; i < opts.length; i++) {
    const y = 100 + i * 50;
    if (i === cursor) { R.rect(110, y - 5, 260, 40, COL_SELECT, 0.3); R.menuCursor(115, y + 3, time); }
    R.text(130, y + 15, opts[i], i === cursor ? COL_YELLOW : COL_WHITE, 14);
  }
  if (player.party.length) {
    const c = player.party[0];
    R.text(240, 370, c.name + " Lv." + c.level + " HP:" + c.hp + "/" + c.maxHP, COL_GRAY, 11, true);
  }
}

requestAnimationFrame(gameLoop);
})();
