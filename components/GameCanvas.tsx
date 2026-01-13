import React, { useRef, useEffect, useState, useCallback } from 'react';
import { COLORS, PHYSICS, CANVAS_WIDTH, CANVAS_HEIGHT, ENTITY_SIZE, PRICES, SKIN_COLORS, BIOME_COLORS } from '../constants';
import { GameState, Player, Platform, Coin, Door, InputState, Enemy, EnemyType, Upgrades, YellowCoin, CosmeticsState, SkinId, HatId, Particle } from '../types';
import { GameHUD } from './GameHUD';
import { SoundManager } from '../utils/audio';
import { saveGame, loadGame } from '../utils/storage';

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Game Refs - Persistent Data
  const levelRef = useRef<number>(1);
  const livesRef = useRef<number>(3);
  const goldRef = useRef<number>(0);
  const upgradesRef = useRef<Upgrades>({
    maxHp: false,
    sharpSword: false,
    tripleJump: false,
    downStrike: false
  });
  const cosmeticsRef = useRef<CosmeticsState>({
    ownedSkins: ['default'],
    ownedHats: ['none'],
    currentSkin: 'default',
    currentHat: 'none'
  });

  // Visual Effects Refs
  const particlesRef = useRef<Particle[]>([]);
  const shakeRef = useRef<{ intensity: number; duration: number }>({ intensity: 0, duration: 0 });
  const backgroundColorRef = useRef<string>(COLORS.BACKGROUND);
  const victoryTextRef = useRef<string | null>(null);

  // Cheat System Refs
  const cheatBufferRef = useRef<string>("");
  const cheatFeedbackRef = useRef<{ active: boolean; startTime: number; text: string }>({ active: false, startTime: 0, text: "" });

  const playerRef = useRef<Player>({
    id: 'player',
    pos: { x: 50, y: 300 },
    size: { width: ENTITY_SIZE.PLAYER, height: ENTITY_SIZE.PLAYER },
    vel: { x: 0, y: 0 },
    isGrounded: false,
    jumpCount: 0,
    color: COLORS.PLAYER,
    facing: 1,
    attackTimer: 0,
    hp: PHYSICS.PLAYER_MAX_HP,
    maxHp: PHYSICS.PLAYER_MAX_HP,
    invulnerableUntil: 0,
    landAnimTimer: 0
  });
  
  const platformsRef = useRef<Platform[]>([]);
  const coinsRef = useRef<Coin[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const yellowCoinsRef = useRef<YellowCoin[]>([]);
  const doorRef = useRef<Door>({ 
    id: 'door', 
    pos: { x: 0, y: 0 }, 
    size: { width: ENTITY_SIZE.DOOR_W, height: ENTITY_SIZE.DOOR_H }, 
    locked: true 
  });
  
  const inputRef = useRef<InputState>({ left: false, right: false, up: false, down: false, attack: false });
  const prevInputUpRef = useRef<boolean>(false);
  const prevInputAttackRef = useRef<boolean>(false);

  // React State for UI
  const [gameState, setGameState] = useState<GameState>({
    level: 1,
    coinsCollected: 0,
    totalCoins: 0,
    status: 'menu', // Start in MENU
    lives: 3,
    gold: 0,
    upgrades: upgradesRef.current,
    cosmetics: cosmeticsRef.current,
    muted: false,
    secretUnlocked: false
  });

  // --- Initialization ---
  useEffect(() => {
    // Load Saved Data
    const saved = loadGame();
    goldRef.current = saved.gold;
    livesRef.current = saved.lives; // Load Lives
    upgradesRef.current = saved.upgrades;
    cosmeticsRef.current = saved.cosmetics;
    
    // Check Secret
    const unlocked = localStorage.getItem('unlockedCR7') === 'true';

    setGameState(prev => ({
        ...prev,
        gold: saved.gold,
        lives: saved.lives, // Set Lives
        upgrades: saved.upgrades,
        cosmetics: saved.cosmetics,
        secretUnlocked: unlocked
    }));
  }, []);

  // --- Secret Boss Generator ---
  const startSecretBossFight = useCallback(() => {
    // Reset Entity Collections
    platformsRef.current = [];
    coinsRef.current = [];
    enemiesRef.current = [];
    yellowCoinsRef.current = [];
    particlesRef.current = [];
    victoryTextRef.current = null;

    // Arena Floor (Grey)
    platformsRef.current.push({ 
        id: 'arena-floor', 
        pos: { x: 0, y: CANVAS_HEIGHT - 40 }, 
        size: { width: CANVAS_WIDTH, height: 40 }, 
        type: 'floor' 
    });
    // Walls
    platformsRef.current.push({ id: 'wall-l', pos: { x: -50, y: 0 }, size: { width: 50, height: CANVAS_HEIGHT }, type: 'floor' });
    platformsRef.current.push({ id: 'wall-r', pos: { x: CANVAS_WIDTH, y: 0 }, size: { width: 50, height: CANVAS_HEIGHT }, type: 'floor' });

    // Spawn Player
    playerRef.current = {
        ...playerRef.current,
        pos: { x: 100, y: CANVAS_HEIGHT - 150 },
        vel: { x: 0, y: 0 },
        isGrounded: false,
        jumpCount: 0,
        hp: playerRef.current.maxHp, // Heal for the fight
    };

    // Spawn Giant Rat
    enemiesRef.current.push({
        id: 'giant-rat',
        type: 'chaser', // Chaser AI Logic
        pos: { x: CANVAS_WIDTH - 200, y: CANVAS_HEIGHT - 100 },
        size: { width: 80, height: 40 }, // Wide body
        vel: { x: 0, y: 0 },
        isGrounded: false,
        color: '#9ca3af', // Grey
        dead: false,
        hp: PHYSICS.RAT_BOSS_HP,
        maxHp: PHYSICS.RAT_BOSS_HP,
        speed: PHYSICS.SPEED_RAT,
        minX: 0, maxX: CANVAS_WIDTH
    });

    setGameState(prev => ({
        ...prev,
        status: 'secret_boss',
        level: 666, // Aesthetic
        coinsCollected: 0,
        totalCoins: 0
    }));
  }, []);

  // --- Procedural Generation ---
  const generateLevel = useCallback((levelNum: number, restoreHp: boolean = false) => {
    levelRef.current = levelNum;
    victoryTextRef.current = null;

    // Biome Logic: Randomize background every 10 levels (After boss defeat, i.e., Level 11, 21...)
    if (levelNum > 1 && levelNum % 10 === 1) {
        backgroundColorRef.current = BIOME_COLORS[Math.floor(Math.random() * BIOME_COLORS.length)];
    }

    const platforms: Platform[] = [];
    const coins: Coin[] = [];
    const enemies: Enemy[] = [];
    yellowCoinsRef.current = []; // Clear loose loot on level change
    particlesRef.current = []; // Clear particles
    
    const isBossLevel = levelNum % 10 === 0;

    if (isBossLevel) {
        // --- BOSS ARENA ---
        platforms.push({ id: 'arena-floor', pos: { x: 0, y: CANVAS_HEIGHT - 40 }, size: { width: CANVAS_WIDTH, height: 40 }, type: 'floor' });
        platforms.push({ id: 'arena-wall-left', pos: { x: -50, y: 0 }, size: { width: 50, height: CANVAS_HEIGHT }, type: 'floor' });
        platforms.push({ id: 'arena-wall-right', pos: { x: CANVAS_WIDTH, y: 0 }, size: { width: 50, height: CANVAS_HEIGHT }, type: 'floor' });
        
        const centerPlatWidth = 360;
        const centerPlatX = (CANVAS_WIDTH - centerPlatWidth) / 2;
        const centerPlatY = CANVAS_HEIGHT - 220;
        platforms.push({
            id: 'boss-center-plat',
            pos: { x: centerPlatX, y: centerPlatY },
            size: { width: centerPlatWidth, height: 30 },
            type: 'floating'
        });

        enemies.push({
            id: 'boss', type: 'boss', pos: { x: CANVAS_WIDTH - 200, y: CANVAS_HEIGHT - 150 }, size: { width: ENTITY_SIZE.BOSS, height: ENTITY_SIZE.BOSS },
            vel: { x: 0, y: 0 }, isGrounded: false, color: COLORS.BOSS, dead: false, hp: PHYSICS.BOSS_HP, maxHp: PHYSICS.BOSS_HP, speed: PHYSICS.SPEED_BOSS, landAnimTimer: 0
        });

        const coinPositions = [
            { x: centerPlatX + 20, y: centerPlatY - 60 }, // On Left Edge of Plat
            { x: centerPlatX + centerPlatWidth - 40, y: centerPlatY - 60 }, // On Right Edge of Plat
            { x: centerPlatX + centerPlatWidth / 2 - 10, y: centerPlatY - 140 }, // High above Plat
            { x: 100, y: CANVAS_HEIGHT - 100 } // Near start (Left corner)
        ];
        coinPositions.forEach((pos, idx) => coins.push({ id: `boss-coin-${idx}`, pos: pos, size: { width: ENTITY_SIZE.COIN, height: ENTITY_SIZE.COIN }, collected: false }));
        
        doorRef.current = { id: 'door', pos: { x: CANVAS_WIDTH - 100, y: CANVAS_HEIGHT - 100 }, size: { width: ENTITY_SIZE.DOOR_W, height: ENTITY_SIZE.DOOR_H }, locked: true };
    } else {
        // --- NORMAL LEVEL ---
        const levelLength = 2500 + (levelNum * 800);
        platforms.push({ id: 'floor-start', pos: { x: 0, y: CANVAS_HEIGHT - 40 }, size: { width: 300, height: 40 }, type: 'floor' });

        let currentX = 300;
        let currentY = CANVAS_HEIGHT - 40;

        while (currentX < levelLength) {
          const gap = 80 + Math.random() * 100; 
          const heightChange = (Math.random() * 500) - 250;
          let nextY = currentY + heightChange;
          if (nextY > CANVAS_HEIGHT - 80) nextY = CANVAS_HEIGHT - 80;
          if (nextY < 150) nextY = 150;

          const platWidth = 80 + Math.random() * 120;
          const isMoving = Math.random() < 0.3;
          const moveType = Math.random() < 0.5 ? 'horizontal' : 'vertical';
          platforms.push({
            id: `plat-${currentX}`, pos: { x: currentX + gap, y: nextY }, size: { width: platWidth, height: 20 },
            type: 'floating', moving: isMoving, moveType: isMoving ? moveType : undefined, startPos: { x: currentX + gap, y: nextY },
            moveOffset: Math.random() * Math.PI * 2, moveSpeed: PHYSICS.MOVING_PLATFORM_SPEED + (Math.random() * 1)
          });

          if (Math.random() < 0.6) {
              if (Math.random() < 0.4) coins.push({ id: `coin-air-${currentX}`, pos: { x: currentX + gap + platWidth / 2, y: nextY - 120 }, size: { width: ENTITY_SIZE.COIN, height: ENTITY_SIZE.COIN }, collected: false });
              else if (Math.random() < 0.7) coins.push({ id: `coin-gap-${currentX}`, pos: { x: currentX + gap / 2, y: Math.min(currentY, nextY) - 50 }, size: { width: ENTITY_SIZE.COIN, height: ENTITY_SIZE.COIN }, collected: false });
          }
          currentX += gap + platWidth;
          currentY = nextY;
        }

        const finalGap = 100;
        const finalY = Math.min(Math.max(currentY, 200), CANVAS_HEIGHT - 100);
        const endPlatform = { id: 'plat-end', pos: { x: currentX + finalGap, y: finalY }, size: { width: 250, height: 40 }, type: 'floating' as const };
        platforms.push(endPlatform);
        doorRef.current = { id: 'door', pos: { x: endPlatform.pos.x + endPlatform.size.width / 2 - ENTITY_SIZE.DOOR_W / 2, y: endPlatform.pos.y - ENTITY_SIZE.DOOR_H }, size: { width: ENTITY_SIZE.DOOR_W, height: ENTITY_SIZE.DOOR_H }, locked: true };

        const numEnemies = Math.floor(Math.random() * 3) + 3; 
        const coinsToGuard = [...coins].sort(() => 0.5 - Math.random()).slice(0, numEnemies);
        coinsToGuard.forEach((coin, idx) => {
            let closestPlat: Platform | null = null;
            let minDist = 99999;
            platforms.forEach(p => {
                if (p.moving) return; // Never on moving platforms
                const dist = Math.abs(p.pos.x - coin.pos.x);
                if (dist < minDist) { minDist = dist; closestPlat = p; }
            });
            if (!closestPlat) return;
            const p = closestPlat as Platform;

            const rand = Math.random();
            let type: EnemyType = 'vertical';
            let color = COLORS.ENEMY_VERTICAL;
            if (rand < 0.33) type = 'vertical';
            else if (rand < 0.66) { type = 'patroller'; color = COLORS.ENEMY_PATROLLER; }
            else { type = 'chaser'; color = COLORS.ENEMY_CHASER; }
            
            enemies.push({
                id: `enemy-${idx}`, type: type, pos: { x: p.pos.x + p.size.width / 2 - ENTITY_SIZE.ENEMY / 2, y: p.pos.y - ENTITY_SIZE.ENEMY },
                size: { width: ENTITY_SIZE.ENEMY, height: ENTITY_SIZE.ENEMY }, vel: { x: 0, y: 0 }, isGrounded: false, color: color, dead: false,
                hp: PHYSICS.ENEMY_HP, maxHp: PHYSICS.ENEMY_HP, startY: p.pos.y - ENTITY_SIZE.ENEMY, offset: Math.random() * Math.PI * 2,
                minX: p.pos.x, maxX: p.pos.x + p.size.width, patrolDir: Math.random() > 0.5 ? 1 : -1,
                speed: type === 'patroller' ? PHYSICS.SPEED_PATROLLER : PHYSICS.SPEED_CHASER
            });
        });
    }

    // Reset Player & Update Stats based on upgrades
    const maxHp = upgradesRef.current.maxHp ? PHYSICS.PLAYER_MAX_HP + 1 : PHYSICS.PLAYER_MAX_HP;
    playerRef.current = {
      ...playerRef.current,
      pos: { x: 50, y: CANVAS_HEIGHT - 150 },
      vel: { x: 0, y: 0 },
      isGrounded: false,
      jumpCount: 0,
      facing: 1,
      attackTimer: 0,
      platformId: undefined,
      maxHp: maxHp,
      hp: restoreHp ? maxHp : playerRef.current.hp,
      invulnerableUntil: 0,
      landAnimTimer: 0
    };
    platformsRef.current = platforms;
    coinsRef.current = coins;
    enemiesRef.current = enemies;

    setGameState(prev => ({
      ...prev, level: levelNum, coinsCollected: 0, totalCoins: coins.length, status: 'playing', lives: livesRef.current
    }));
  }, []);

  // --- Input ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Audio Context Init on first interaction
      SoundManager.init();

      if (e.code === 'ArrowLeft') inputRef.current.left = true;
      if (e.code === 'ArrowRight') inputRef.current.right = true;
      if (e.code === 'ArrowDown') inputRef.current.down = true;
      if (e.code === 'Space' || e.code === 'ArrowUp') inputRef.current.up = true;
      if (e.code === 'KeyZ' || e.code === 'KeyP') inputRef.current.attack = true;
      
      // Toggle Pause
      if (e.code === 'Escape') {
          setGameState(prev => {
              if (prev.status === 'playing' || prev.status === 'secret_boss') return { ...prev, status: 'paused' };
              if (prev.status === 'paused') {
                  // Resume to previous state? Usually just playing, but could be secret boss.
                  // For simplicity we check enemies. If Rat exists, it's secret boss.
                  const isSecret = enemiesRef.current.some(e => e.id === 'giant-rat');
                  return { ...prev, status: isSecret ? 'secret_boss' : 'playing' };
              }
              return prev;
          });
      }

      // Cheat Code System: "NEYMAR" / "MESSI" / "THETRUECR7"
      const char = e.key.toUpperCase();
      if (char.length === 1 && /[A-Z0-9]/.test(char)) {
          cheatBufferRef.current = (cheatBufferRef.current + char).slice(-12);
          
          if (cheatBufferRef.current.endsWith('NEYMAR')) {
              goldRef.current += 100;
              saveGameData(); 
              setGameState(prev => ({ ...prev, gold: goldRef.current }));
              SoundManager.playCoin();
              cheatFeedbackRef.current = { active: true, startTime: performance.now(), text: "CHEAT ACTIVATED: +100 GOLD!" };
              cheatBufferRef.current = ""; 
          }
          if (cheatBufferRef.current.endsWith('MESSI')) {
              SoundManager.playCoin();
              cheatFeedbackRef.current = { active: true, startTime: performance.now(), text: "CHEAT: LEVEL SKIP!" };
              cheatBufferRef.current = "";
              // Skip Level logic (Trigger transition immediately)
              generateLevel(levelRef.current + 1);
          }
          if (cheatBufferRef.current.endsWith('THETRUECR7')) {
              SoundManager.playCoin();
              cheatFeedbackRef.current = { active: true, startTime: performance.now(), text: "CHEAT: SECRET BOSS!" };
              cheatBufferRef.current = "";
              startSecretBossFight();
          }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft') inputRef.current.left = false;
      if (e.code === 'ArrowRight') inputRef.current.right = false;
      if (e.code === 'ArrowDown') inputRef.current.down = false;
      if (e.code === 'Space' || e.code === 'ArrowUp') inputRef.current.up = false;
      if (e.code === 'KeyZ' || e.code === 'KeyP') inputRef.current.attack = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [generateLevel, startSecretBossFight]);

  // --- Helper: Save Game Wrapper ---
  const saveGameData = () => {
    saveGame({
      gold: goldRef.current,
      lives: livesRef.current, // Persist lives
      upgrades: upgradesRef.current,
      cosmetics: cosmeticsRef.current
    });
  };

  // --- Helper: Particles ---
  const createExplosion = (x: number, y: number, color: string) => {
    for (let i = 0; i < 15; i++) {
        particlesRef.current.push({
            id: `p-exp-${Date.now()}-${i}`,
            pos: { x, y },
            vel: { x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 8 },
            color: color,
            size: 3 + Math.random() * 4,
            life: 30,
            maxLife: 30
        });
    }
  };

  const createSparkles = (x: number, y: number) => {
    for (let i = 0; i < 5; i++) {
        particlesRef.current.push({
            id: `p-spk-${Date.now()}-${i}`,
            pos: { x: x + (Math.random() - 0.5) * 20, y: y + (Math.random() - 0.5) * 20 },
            vel: { x: 0, y: -1 - Math.random() },
            color: '#facc15', // Yellow
            size: 2,
            life: 40,
            maxLife: 40
        });
    }
  };

  const createDust = (x: number, y: number) => {
      for (let i = 0; i < 3; i++) {
        particlesRef.current.push({
            id: `p-dst-${Date.now()}-${i}`,
            pos: { x: x + (Math.random() - 0.5) * 20, y: y },
            vel: { x: (Math.random() - 0.5) * 1, y: -0.5 },
            color: '#ffffff',
            size: 2,
            life: 20,
            maxLife: 20
        });
    }
  };

  const triggerShake = (intensity: number, duration: number) => {
      shakeRef.current = { intensity, duration };
  };

  // --- Helper: AABB Physics ---
  const applyGravityAndCollision = useCallback((entity: any, platforms: Platform[]) => {
      const wasFalling = entity.vel.y > 0;
      
      entity.vel.y += PHYSICS.GRAVITY;
      entity.pos.x += entity.vel.x;
      entity.pos.y += entity.vel.y;
      entity.isGrounded = false;
      if (entity.id === 'player') entity.platformId = undefined;

      const entityRect = { l: entity.pos.x, r: entity.pos.x + entity.size.width, t: entity.pos.y, b: entity.pos.y + entity.size.height };
      for (const plat of platforms) {
        const platRect = { l: plat.pos.x, r: plat.pos.x + plat.size.width, t: plat.pos.y, b: plat.pos.y + plat.size.height };
        if (entityRect.r > platRect.l && entityRect.l < platRect.r && entityRect.b > platRect.t && entityRect.t < platRect.b) {
          const prevY = entity.pos.y - entity.vel.y;
          if (prevY + entity.size.height <= plat.pos.y + 10) {
            entity.pos.y = plat.pos.y - entity.size.height;
            entity.vel.y = 0;
            entity.isGrounded = true;
            if (entity.id === 'player') { 
                entity.jumpCount = 0; 
                entity.platformId = plat.id; 
                if (wasFalling) entity.landAnimTimer = 10; // Trigger Land Squash
            }
            if (entity.type === 'boss' && wasFalling) entity.landAnimTimer = 10;

          } else if (prevY >= plat.pos.y + plat.size.height - 10) {
            entity.pos.y = plat.pos.y + plat.size.height;
            entity.vel.y = 0;
          } else {
             if (entity.vel.x > 0) entity.pos.x = plat.pos.x - entity.size.width;
             else if (entity.vel.x < 0) entity.pos.x = plat.pos.x + plat.size.width;
             entity.vel.x = 0;
          }
        }
      }
  }, []);

  // --- Main Update ---
  const update = useCallback(() => {
    // Only update physics if 'playing' or 'secret_boss'
    if (gameState.status !== 'playing' && gameState.status !== 'secret_boss') return;

    const player = playerRef.current;
    
    // Death Check
    if (player.hp <= 0 || player.pos.y > CANVAS_HEIGHT) {
        livesRef.current -= 1;
        SoundManager.playDamage();
        if (livesRef.current > 0) {
            if (gameState.status === 'secret_boss') {
                // If you die in secret boss, restart the fight? Or go back to menu?
                // Standard game behavior: restart level.
                startSecretBossFight();
            } else {
                generateLevel(levelRef.current, true);
            }
        } else {
            setGameState(prev => ({ ...prev, lives: 0, status: 'gameover' }));
            // Game Over -> Shop transition
            setTimeout(() => {
                setGameState(prev => ({ ...prev, status: 'shop' }));
                livesRef.current = 3; // Reset lives for next run
                saveGameData(); // Save reset lives
            }, 3000); 
        }
        return; 
    }
    
    const time = performance.now();
    const isInvulnerable = time < player.invulnerableUntil;
    
    // --- Update Particles ---
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.pos.x += p.vel.x;
        p.pos.y += p.vel.y;
        p.vel.y += 0.2; // Gravity for particles
        p.life--;
        if (p.life <= 0) particlesRef.current.splice(i, 1);
    }

    // --- Update Shake ---
    if (shakeRef.current.duration > 0) {
        shakeRef.current.duration--;
        shakeRef.current.intensity *= 0.9;
    } else {
        shakeRef.current.intensity = 0;
    }

    // --- Platform Movement ---
    const platformDeltas: {[key: string]: {x: number, y: number}} = {};
    platformsRef.current.forEach(plat => {
      if (plat.moving && plat.startPos) {
        const prevX = plat.pos.x; const prevY = plat.pos.y;
        const sine = Math.sin((time / 1000) * (plat.moveSpeed || 1) + (plat.moveOffset || 0));
        const offset = sine * PHYSICS.MOVING_PLATFORM_RANGE;
        if (plat.moveType === 'horizontal') plat.pos.x = plat.startPos.x + offset;
        else plat.pos.y = plat.startPos.y + offset;
        platformDeltas[plat.id] = { x: plat.pos.x - prevX, y: plat.pos.y - prevY };
      }
    });

    // --- Player Logic ---
    const controlFactor = isInvulnerable ? 0.3 : 1.0;
    if (inputRef.current.left) { player.vel.x -= PHYSICS.MOVE_SPEED * controlFactor; player.facing = -1; }
    if (inputRef.current.right) { player.vel.x += PHYSICS.MOVE_SPEED * controlFactor; player.facing = 1; }
    player.vel.x *= PHYSICS.FRICTION;
    if (player.vel.x > PHYSICS.MAX_SPEED) player.vel.x = PHYSICS.MAX_SPEED;
    if (player.vel.x < -PHYSICS.MAX_SPEED) player.vel.x = -PHYSICS.MAX_SPEED;
    
    if (player.landAnimTimer > 0) player.landAnimTimer--;

    // Jumping (Triple Jump Support)
    const maxJumps = upgradesRef.current.tripleJump ? 3 : 2;
    if (inputRef.current.up && !prevInputUpRef.current) {
      if (player.isGrounded) {
        player.vel.y = PHYSICS.JUMP_FORCE;
        player.isGrounded = false;
        player.jumpCount = 1;
        player.platformId = undefined;
        SoundManager.playJump();
        createDust(player.pos.x + player.size.width/2, player.pos.y + player.size.height);
      } else if (player.jumpCount < maxJumps) {
        player.vel.y = PHYSICS.DOUBLE_JUMP_FORCE;
        player.jumpCount++;
        player.platformId = undefined;
        SoundManager.playJump();
        createDust(player.pos.x + player.size.width/2, player.pos.y + player.size.height);
      }
    }
    prevInputUpRef.current = inputRef.current.up;

    if (player.isGrounded && player.platformId && platformDeltas[player.platformId]) {
        const delta = platformDeltas[player.platformId];
        player.pos.x += delta.x; player.pos.y += delta.y;
    }

    if (inputRef.current.attack && !prevInputAttackRef.current) {
        player.attackTimer = PHYSICS.ATTACK_DURATION;
        SoundManager.playAttack();
    }
    prevInputAttackRef.current = inputRef.current.attack;
    if (player.attackTimer > 0) player.attackTimer--;

    applyGravityAndCollision(player, platformsRef.current);
    
    // Left Wall (Global Start)
    if (player.pos.x < 0) { player.pos.x = 0; player.vel.x = 0; }

    // Right Wall (Only Enforce in Arenas)
    const isBossLevel = levelRef.current % 10 === 0;
    const isArena = gameState.status === 'secret_boss' || (gameState.status === 'playing' && isBossLevel);

    if (isArena) {
        if (player.pos.x > CANVAS_WIDTH - player.size.width) { 
            player.pos.x = CANVAS_WIDTH - player.size.width; 
            player.vel.x = 0; 
        }
    }

    // --- Yellow Coin Logic ---
    for (let i = yellowCoinsRef.current.length - 1; i >= 0; i--) {
        const yc = yellowCoinsRef.current[i];
        if (yc.collected) continue;
        
        yc.vel.y += PHYSICS.YELLOW_COIN_GRAVITY;
        yc.pos.x += yc.vel.x;
        yc.pos.y += yc.vel.y;

        for (const p of platformsRef.current) {
            if (yc.pos.x + yc.size.width > p.pos.x && yc.pos.x < p.pos.x + p.size.width &&
                yc.pos.y + yc.size.height > p.pos.y && yc.pos.y < p.pos.y + p.size.height) {
                if (yc.vel.y > 0 && yc.pos.y + yc.size.height - yc.vel.y <= p.pos.y + 10) {
                     yc.pos.y = p.pos.y - yc.size.height;
                     yc.vel.y *= -PHYSICS.YELLOW_COIN_BOUNCE;
                     yc.vel.x *= 0.8; 
                }
            }
        }
        
        const dx = (player.pos.x + player.size.width/2) - (yc.pos.x + yc.size.width/2);
        const dy = (player.pos.y + player.size.height/2) - (yc.pos.y + yc.size.height/2);
        if (Math.sqrt(dx*dx + dy*dy) < 30) {
            yc.collected = true;
            goldRef.current += 1;
            setGameState(prev => ({ ...prev, gold: goldRef.current }));
            saveGameData(); // Save on gold pickup
            yellowCoinsRef.current.splice(i, 1);
            SoundManager.playCoin();
            createSparkles(yc.pos.x, yc.pos.y);
        } else {
            yc.lifetime--;
            if (yc.lifetime <= 0) yellowCoinsRef.current.splice(i, 1);
        }
    }

    // --- Enemy AI & Combat ---
    const damage = upgradesRef.current.sharpSword ? 2 : 1;
    
    // Check Down Strike (Pogo)
    const isDownStrike = upgradesRef.current.downStrike && !player.isGrounded && inputRef.current.down && inputRef.current.attack;
    let pogoRect = null;
    if (isDownStrike) {
        pogoRect = {
            l: player.pos.x, r: player.pos.x + player.size.width,
            t: player.pos.y + player.size.height, b: player.pos.y + player.size.height + 40
        };
    }
    
    // Regular Attack Rect (For Collision)
    let swordRect = null;
    if (player.attackTimer > 0) {
        swordRect = {
            l: player.facing === 1 ? player.pos.x + player.size.width : player.pos.x - ENTITY_SIZE.SWORD_REACH,
            r: player.facing === 1 ? player.pos.x + player.size.width + ENTITY_SIZE.SWORD_REACH : player.pos.x,
            t: player.pos.y + (player.size.height - ENTITY_SIZE.SWORD_HEIGHT) / 2,
            b: player.pos.y + (player.size.height + ENTITY_SIZE.SWORD_HEIGHT) / 2
        };
    }

    const playerRect = { l: player.pos.x, r: player.pos.x + player.size.width, t: player.pos.y, b: player.pos.y + player.size.height };

    enemiesRef.current.forEach(enemy => {
        if (enemy.dead) return;
        
        if (enemy.landAnimTimer !== undefined && enemy.landAnimTimer > 0) enemy.landAnimTimer--;

        // AI Logic
        if (enemy.type === 'vertical') {
            enemy.pos.y = (enemy.startY || 0) - Math.abs(Math.sin((time / 1000) * 3 + (enemy.offset || 0))) * 120;
        } else if (enemy.type === 'patroller') {
            enemy.vel.x = (enemy.speed || 1) * (enemy.patrolDir || 1);
            enemy.pos.x += enemy.vel.x;
            if (enemy.maxX && enemy.pos.x + enemy.size.width > enemy.maxX) { enemy.pos.x = enemy.maxX - enemy.size.width; enemy.patrolDir = -1; }
            else if (enemy.minX && enemy.pos.x < enemy.minX) { enemy.pos.x = enemy.minX; enemy.patrolDir = 1; }
        } else if (enemy.type === 'chaser') {
            const dir = player.pos.x > enemy.pos.x ? 1 : -1;
            enemy.vel.x = dir * (enemy.speed || 1);
            enemy.pos.x += enemy.vel.x;
            if (enemy.maxX && enemy.pos.x + enemy.size.width > enemy.maxX) enemy.pos.x = enemy.maxX - enemy.size.width;
            else if (enemy.minX && enemy.pos.x < enemy.minX) enemy.pos.x = enemy.minX;
        } else if (enemy.type === 'boss') {
             const speed = enemy.speed || 1;
             if (player.pos.x > enemy.pos.x + 10) enemy.vel.x += 0.2; else if (player.pos.x < enemy.pos.x - 10) enemy.vel.x -= 0.2;
             enemy.vel.x = Math.max(Math.min(enemy.vel.x, speed), -speed);
             if (enemy.isGrounded && (player.pos.y < enemy.pos.y - 100 || Math.random() < 0.01)) { enemy.vel.y = PHYSICS.JUMP_FORCE; enemy.isGrounded = false; }
             applyGravityAndCollision(enemy, platformsRef.current);
        }

        const enemyRect = { l: enemy.pos.x, r: enemy.pos.x + enemy.size.width, t: enemy.pos.y, b: enemy.pos.y + enemy.size.height };

        // Hit Detection
        let hit = false;
        
        // 1. Pogo Hit
        if (pogoRect && pogoRect.r > enemyRect.l && pogoRect.l < enemyRect.r && pogoRect.b > enemyRect.t && pogoRect.t < enemyRect.b) {
            hit = true;
            player.vel.y = PHYSICS.POGO_BOUNCE_FORCE; // Bounce Player
            player.jumpCount = 1; // Allow follow up jumps
        }
        // 2. Sword Hit
        else if (swordRect && swordRect.r > enemyRect.l && swordRect.l < enemyRect.r && swordRect.b > enemyRect.t && swordRect.t < enemyRect.b) {
            hit = true;
            enemy.pos.x += player.facing * 20; // Knockback
        }

        if (hit) {
            enemy.hp -= damage;
            SoundManager.playAttack(); // Hit sound
            if (enemy.hp <= 0) {
                enemy.dead = true;
                SoundManager.playEnemyDeath();
                createExplosion(enemy.pos.x + enemy.size.width/2, enemy.pos.y + enemy.size.height/2, enemy.color);
                
                if (enemy.id === 'giant-rat') {
                    // SECRET BOSS VICTORY
                    triggerShake(10, 20);
                    victoryTextRef.current = "CAÇA RATO!";
                    
                    // UNLOCK THE LEGEND SKIN
                    localStorage.setItem('unlockedCR7', 'true');
                    cheatFeedbackRef.current = { active: true, startTime: performance.now(), text: "NEW SKIN UNLOCKED IN SHOP!" };
                    setGameState(prev => ({ ...prev, secretUnlocked: true }));

                    // Loot Shower
                    for (let k = 0; k < 50; k++) {
                        yellowCoinsRef.current.push({
                            id: `yc-rat-${k}-${Math.random()}`,
                            pos: { x: enemy.pos.x + enemy.size.width/2, y: enemy.pos.y },
                            size: { width: ENTITY_SIZE.YELLOW_COIN, height: ENTITY_SIZE.YELLOW_COIN },
                            vel: { x: (Math.random() * 14) - 7, y: -8 - Math.random() * 8 },
                            collected: false,
                            lifetime: 1000
                        });
                    }
                    // Return to Menu after delay
                    setTimeout(() => {
                        setGameState(prev => ({ ...prev, status: 'menu' }));
                        saveGameData();
                    }, 5000);
                }
                else if (enemy.type === 'boss') {
                    triggerShake(5, 10);
                    // BOSS LOOT SHOWER
                    for (let k = 0; k < 5; k++) {
                        yellowCoinsRef.current.push({
                            id: `yc-boss-${k}-${Math.random()}`,
                            pos: { x: enemy.pos.x + enemy.size.width/2, y: enemy.pos.y },
                            size: { width: ENTITY_SIZE.YELLOW_COIN, height: ENTITY_SIZE.YELLOW_COIN },
                            vel: { x: (Math.random() * 10) - 5, y: -8 - Math.random() * 4 }, // Explode out
                            collected: false,
                            lifetime: PHYSICS.YELLOW_COIN_LIFETIME
                        });
                    }
                } else {
                    yellowCoinsRef.current.push({
                        id: `yc-${Math.random()}`,
                        pos: { x: enemy.pos.x, y: enemy.pos.y },
                        size: { width: ENTITY_SIZE.YELLOW_COIN, height: ENTITY_SIZE.YELLOW_COIN },
                        vel: { x: (Math.random() - 0.5) * 4, y: -4 },
                        collected: false,
                        lifetime: PHYSICS.YELLOW_COIN_LIFETIME
                    });
                }
            }
        }
        
        // Player Damaged
        if (!enemy.dead && !isInvulnerable && playerRect.r > enemyRect.l && playerRect.l < enemyRect.r && playerRect.b > enemyRect.t && playerRect.t < enemyRect.b) {
             player.hp -= 1;
             player.invulnerableUntil = time + PHYSICS.INVULNERABILITY_MS;
             player.vel.x = (player.pos.x < enemy.pos.x ? -1 : 1) * PHYSICS.KNOCKBACK_FORCE_X;
             player.vel.y = PHYSICS.KNOCKBACK_FORCE_Y;
             player.isGrounded = false;
             SoundManager.playDamage();
             triggerShake(3, 10); // Shake on damage
        }
    });

    // --- Coin Collection ---
    let collectedCount = 0;
    coinsRef.current.forEach(coin => {
      if (coin.collected) { collectedCount++; return; }
      const dx = (player.pos.x + player.size.width/2) - coin.pos.x;
      const dy = (player.pos.y + player.size.height/2) - coin.pos.y;
      if (Math.sqrt(dx*dx + dy*dy) < 30) {
        coin.collected = true; collectedCount++;
        setGameState(prev => ({ ...prev, coinsCollected: prev.coinsCollected + 1 }));
        SoundManager.playCoin();
        createSparkles(coin.pos.x, coin.pos.y);
      }
    });

    // --- Door ---
    const allCollected = collectedCount === coinsRef.current.length;
    doorRef.current.locked = !allCollected;
    if (allCollected && enemiesRef.current.some(e => e.type === 'boss' && !e.dead)) {
         enemiesRef.current.forEach(e => { if (e.type === 'boss') e.dead = true; });
    }
    if (!doorRef.current.locked) {
      const door = doorRef.current;
      if (playerRect.r > door.pos.x && playerRect.l < door.pos.x + door.size.width && playerRect.b > door.pos.y && playerRect.t < door.pos.y + door.size.height) {
        setGameState(prev => {
           if (prev.status === 'transition') return prev;
           setTimeout(() => { generateLevel(prev.level + 1); }, 500);
           return { ...prev, status: 'transition' };
        });
      }
    }
  }, [generateLevel, applyGravityAndCollision, gameState.status, startSecretBossFight]);

  // --- Render ---
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear Screen
    ctx.setTransform(1, 0, 0, 1, 0, 0); 

    if (gameState.status === 'secret_boss') {
        // --- SANTA CRUZ PATTERN ---
        // Black -> White -> Red -> White
        const stripeWidth = 40;
        const colors = ['#000000', '#FFFFFF', '#FF0000', '#FFFFFF'];
        for (let x = 0; x < CANVAS_WIDTH; x += stripeWidth) {
            const index = Math.floor(x / stripeWidth) % 4;
            ctx.fillStyle = colors[index];
            ctx.fillRect(x, 0, stripeWidth, CANVAS_HEIGHT);
        }
    } else {
        // Normal Background
        ctx.fillStyle = backgroundColorRef.current;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Draw Cheat Feedback (Always visible if active, drawn relative to screen)
    if (cheatFeedbackRef.current.active) {
        const elapsed = performance.now() - cheatFeedbackRef.current.startTime;
        if (elapsed < 2000) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, 1 - (elapsed / 2000));
            // Float up effect
            const floatY = (elapsed / 2000) * 50;
            
            ctx.font = '900 32px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Text Shadow/Stroke
            ctx.shadowColor = 'rgba(0,0,0,0.7)';
            ctx.shadowBlur = 8;
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#000000';
            ctx.fillStyle = '#fbbf24'; // amber-400
            
            const text = cheatFeedbackRef.current.text || "CHEAT ACTIVATED!";
            const cx = CANVAS_WIDTH / 2;
            const cy = CANVAS_HEIGHT / 2 - floatY;
            
            ctx.strokeText(text, cx, cy);
            ctx.fillText(text, cx, cy);
            ctx.restore();
        } else {
            cheatFeedbackRef.current.active = false;
        }
    }

    if (victoryTextRef.current) {
        ctx.save();
        ctx.font = '900 64px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.fillStyle = '#fbbf24'; // Gold
        const cx = CANVAS_WIDTH / 2;
        const cy = CANVAS_HEIGHT / 3;
        ctx.strokeText(victoryTextRef.current, cx, cy);
        ctx.fillText(victoryTextRef.current, cx, cy);
        ctx.restore();
    }

    // Skip detailed game rendering if in Menu/Shop
    if (gameState.status === 'menu' || gameState.status === 'shop') return;

    const player = playerRef.current;
    const cosmetics = cosmeticsRef.current;
    const isInvulnerable = performance.now() < player.invulnerableUntil;
    
    // Camera Shake Offset
    let shakeX = 0;
    let shakeY = 0;
    if (shakeRef.current.intensity > 0) {
        shakeX = (Math.random() - 0.5) * shakeRef.current.intensity;
        shakeY = (Math.random() - 0.5) * shakeRef.current.intensity;
    }

    let cameraX = 0;
    if (gameState.status === 'secret_boss') {
        cameraX = 0; // Fixed arena
    } else if (gameState.level % 10 !== 0) {
        cameraX = Math.max(0, player.pos.x - CANVAS_WIDTH / 2);
    }
    ctx.translate(-cameraX + shakeX, shakeY);

    // Platforms
    platformsRef.current.forEach(plat => {
      if (plat.pos.x + plat.size.width < cameraX || plat.pos.x > cameraX + CANVAS_WIDTH) return;
      if (gameState.status === 'secret_boss') {
          // Grey Floor for Secret Boss
          ctx.fillStyle = '#6b7280'; // gray-500
          ctx.fillRect(plat.pos.x, plat.pos.y, plat.size.width, plat.size.height);
      } else {
          ctx.fillStyle = COLORS.PLATFORM_TOP; ctx.fillRect(plat.pos.x, plat.pos.y, plat.size.width, 4);
          ctx.fillStyle = plat.moving ? COLORS.PLATFORM_MOVING : COLORS.PLATFORM; ctx.fillRect(plat.pos.x, plat.pos.y + 4, plat.size.width, plat.size.height - 4);
      }
    });

    // Door
    const door = doorRef.current;
    // Don't draw door in secret boss fight
    if (gameState.status !== 'secret_boss') {
        ctx.fillStyle = door.locked ? COLORS.DOOR_LOCKED : COLORS.DOOR_UNLOCKED; ctx.fillRect(door.pos.x, door.pos.y, door.size.width, door.size.height);
        ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.strokeRect(door.pos.x, door.pos.y, door.size.width, door.size.height);
    }

    // Particles (Behind enemies/player usually looks better, but let's put them here)
    particlesRef.current.forEach(p => {
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.pos.x, p.pos.y, p.size, p.size);
        ctx.globalAlpha = 1.0;
    });

    // Red Coins
    coinsRef.current.forEach(coin => {
      if (coin.collected) return;
      if (coin.pos.x + coin.size.width < cameraX || coin.pos.x > cameraX + CANVAS_WIDTH) return;
      ctx.fillStyle = COLORS.COIN; ctx.beginPath(); ctx.arc(coin.pos.x, coin.pos.y, coin.size.width / 2, 0, Math.PI * 2); ctx.fill();
    });
    
    // Yellow Coins
    yellowCoinsRef.current.forEach(yc => {
       if (yc.collected) return;
       ctx.fillStyle = COLORS.YELLOW_COIN; ctx.beginPath(); ctx.arc(yc.pos.x, yc.pos.y, yc.size.width / 2, 0, Math.PI * 2); ctx.fill();
       ctx.strokeStyle = '#d97706'; ctx.lineWidth = 1; ctx.stroke();
    });

    // Enemies
    enemiesRef.current.forEach(enemy => {
        if (enemy.dead) return;
        if (enemy.pos.x + enemy.size.width < cameraX || enemy.pos.x > cameraX + CANVAS_WIDTH) return;
        
        ctx.save();
        
        const cx = enemy.pos.x + enemy.size.width / 2;
        const cy = enemy.pos.y + enemy.size.height;
        ctx.translate(cx, cy);

        if (enemy.id === 'giant-rat') {
            // --- GIANT RAT RENDER ---
            // Body: Grey Rectangle, Tail: Pink, Ears: Grey Circles
            const w = enemy.size.width;
            const h = enemy.size.height;

            // Tail
            ctx.strokeStyle = '#f472b6'; // Pink-400
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(w/2, -h/2);
            ctx.lineTo(w + 20, -h/2 + 10); // Simple tail
            ctx.stroke();

            // Body
            ctx.fillStyle = enemy.color;
            ctx.fillRect(-w/2, -h, w, h);

            // Ears
            ctx.beginPath(); ctx.arc(-w/4, -h, 8, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(w/4, -h, 8, 0, Math.PI*2); ctx.fill();

            // Eyes
            const lookDir = player.pos.x > enemy.pos.x ? 1 : -1;
            ctx.fillStyle = 'black';
            ctx.beginPath(); ctx.arc((lookDir === 1 ? 10 : -10), -h + 10, 4, 0, Math.PI*2); ctx.fill();

        } else {
            // --- NORMAL ENEMY RENDER ---
            let scaleX = 1;
            let scaleY = 1;
            
            if (enemy.type === 'boss') {
                if (!enemy.isGrounded && enemy.vel.y < 0) { scaleX = 0.95; scaleY = 1.05; }
                else if (enemy.landAnimTimer && enemy.landAnimTimer > 0) {
                     const t = enemy.landAnimTimer / 10;
                     scaleX = 1 + 0.1 * t; scaleY = 1 - 0.1 * t; 
                }
            } else {
                const pulse = Math.sin(Date.now() / 200) * 0.05;
                scaleX = 1 + pulse;
                scaleY = 1 + pulse;
            }
            
            ctx.scale(scaleX, scaleY);
            
            const dw = enemy.size.width;
            const dh = enemy.size.height;

            ctx.fillStyle = enemy.color; 
            ctx.fillRect(-dw/2, -dh, dw, dh);
            
            ctx.fillStyle = 'black'; 
            let lookDir = 1;
            if (enemy.type === 'patroller') lookDir = enemy.patrolDir || 1;
            else lookDir = player.pos.x > enemy.pos.x ? 1 : -1;

            const eyeOffset = enemy.type === 'boss' ? 8 : 0;
            const eyeSize = enemy.type === 'boss' ? 16 : 0;
            
            ctx.beginPath(); ctx.arc((-dw/2) + (lookDir === 1 ? 20+eyeOffset : 12+eyeOffset), -dh + 12+eyeOffset, 2 + eyeSize/4, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc((-dw/2) + (lookDir === 1 ? 28+eyeOffset : 4+eyeOffset), -dh + 12+eyeOffset, 2 + eyeSize/4, 0, Math.PI*2); ctx.fill();
        }
        
        ctx.restore();

        const hpPct = enemy.hp / enemy.maxHp;
        ctx.fillStyle = COLORS.HP_BAR_BG; ctx.fillRect(enemy.pos.x, enemy.pos.y - 10, enemy.size.width, 6);
        ctx.fillStyle = COLORS.HP_BAR_FILL_ENEMY; ctx.fillRect(enemy.pos.x, enemy.pos.y - 10, enemy.size.width * hpPct, 6);
    });

    // Player
    if (!isInvulnerable || Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.save();
        
        // Pivot at Bottom Center
        const cx = player.pos.x + player.size.width / 2;
        const cy = player.pos.y + player.size.height;
        ctx.translate(cx, cy);

        // --- Procedural Animation Calculations ---
        let scaleX = 1;
        let scaleY = 1;
        let rotation = 0;

        if (player.isGrounded) {
             if (Math.abs(player.vel.x) > 0.1) {
                 // RUN: Tilt forward
                 rotation = (player.vel.x / PHYSICS.MAX_SPEED) * 0.15; // Lean
             } else {
                 // IDLE: Breathe
                 const breathe = Math.sin(Date.now() / 200) * 0.03;
                 scaleY = 1 + breathe;
                 scaleX = 1 - breathe;
             }
             
             // LAND: Squash
             if (player.landAnimTimer > 0) {
                 const t = player.landAnimTimer / 10; // 1.0 to 0.0
                 scaleX = 1 + 0.25 * t;
                 scaleY = 1 - 0.25 * t;
             }
        } else {
            // AIR
            if (player.vel.y < 0) {
                // JUMP: Stretch Up
                scaleX = 0.85; scaleY = 1.15;
            } else {
                // FALL: Slight Stretch Down
                 scaleX = 0.95; scaleY = 1.05;
            }
        }

        ctx.rotate(rotation);
        ctx.scale(scaleX, scaleY);

        // Draw Player Body (Relative to Pivot 0,0 which is bottom center)
        // Rect is -width/2, -height
        const w = player.size.width;
        const h = player.size.height;
        
        if (cosmetics.currentSkin === 'legend') {
             // --- THE LEGEND SKIN (Santa Cruz Pattern) ---
             // Black -> White -> Red -> White (HORIZONTAL stripes on body)
             const stripeH = h / 4;
             const colors = ['#000000', '#FFFFFF', '#FF0000', '#FFFFFF'];
             for(let i=0; i<4; i++) {
                 ctx.fillStyle = colors[i];
                 // Draw from top (-h) downwards
                 ctx.fillRect(-w/2, -h + (i * stripeH), w, stripeH);
             }

             // Rat Ears
             ctx.fillStyle = '#9ca3af'; // gray-400
             // Pivot relative coords: -w/2, -h is top-left
             // Left ear
             ctx.beginPath(); ctx.arc(-w/4, -h, 6, 0, Math.PI*2); ctx.fill();
             // Right ear
             ctx.beginPath(); ctx.arc(w/4, -h, 6, 0, Math.PI*2); ctx.fill();

        } else {
             // Standard Skin
             ctx.fillStyle = SKIN_COLORS[cosmetics.currentSkin] || '#000000';
             ctx.fillRect(-w/2, -h, w, h);
        }
        
        // Draw Face
        ctx.fillStyle = 'white'; const lookDir = player.facing;
        ctx.fillRect((-w/2) + (lookDir === 1 ? 20 : 4), -h + 8, 8, 8);
        ctx.fillRect((-w/2) + (lookDir === 1 ? 8 : 16), -h + 8, 8, 8);
        
        // Draw Hat (Relative to Body)
        // Original Hat logic used Player Top Left (hatX, hatY). 
        // Here 0,0 is Bottom Center. Top Left is -w/2, -h.
        
        if (cosmetics.currentHat === 'tophat') {
             ctx.fillStyle = '#111827'; // gray-900
             ctx.fillRect(-w/2 + 6, -h - 14, 20, 14); // Top
             ctx.fillRect(-w/2 + 2, -h, 28, 4); // Brim
        } else if (cosmetics.currentHat === 'crown') {
             ctx.fillStyle = '#facc15'; // yellow-400
             ctx.beginPath();
             ctx.moveTo(-w/2, -h);
             ctx.lineTo(-w/2, -h - 12);
             ctx.lineTo(-w/2 + 8, -h - 4);
             ctx.lineTo(-w/2 + 16, -h - 16);
             ctx.lineTo(-w/2 + 24, -h - 4);
             ctx.lineTo(-w/2 + 32, -h - 12);
             ctx.lineTo(-w/2 + 32, -h);
             ctx.closePath();
             ctx.fill();
        } else if (cosmetics.currentHat === 'halo') {
             ctx.strokeStyle = '#facc15'; // yellow-400
             ctx.lineWidth = 3;
             ctx.beginPath();
             ctx.ellipse(-w/2 + 16, -h - 14, 12, 4, 0, 0, Math.PI * 2);
             ctx.stroke();
        }

        // Sword Animation (Attached to body)
        if (player.attackTimer > 0) {
            const progress = 1 - (player.attackTimer / PHYSICS.ATTACK_DURATION); 
            const startAngle = -45 * (Math.PI / 180);
            const endAngle = 45 * (Math.PI / 180);
            const currentAngle = startAngle + (endAngle - startAngle) * progress;
            
            ctx.save();
            ctx.translate(0, -h/2); // Pivot at center of body vertically
            ctx.scale(player.facing, 1); 
            ctx.rotate(currentAngle);
            
            // Draw Sword relative to center body pivot
            ctx.fillStyle = '#8B4513'; ctx.fillRect(10, -4, 12, 8); // Handle
            ctx.fillStyle = '#C0C0C0'; ctx.fillRect(20, -10, 6, 20); // Guard
            ctx.fillStyle = '#E0E0E0'; 
            ctx.beginPath(); ctx.moveTo(26, -6); ctx.lineTo(60, -6); ctx.lineTo(65, 0); ctx.lineTo(60, 6); ctx.lineTo(26, 6); ctx.fill(); // Blade
            ctx.restore();
        }

        // Down Strike Visual (Spike Triangle)
        const isDownStrike = upgradesRef.current.downStrike && !player.isGrounded && inputRef.current.down && inputRef.current.attack;
        if (isDownStrike) {
            ctx.fillStyle = '#cbd5e1'; 
            ctx.strokeStyle = '#475569'; 
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-10, 0); // At feet level (0 y)
            ctx.lineTo(10, 0);
            ctx.lineTo(0, 30); // Down 30px
            ctx.closePath();
            ctx.fill(); ctx.stroke();
        }

        ctx.restore(); // Undo Player Transforms

        // Draw HP Bar (Outside transform to stay flat)
        const hpPct = Math.max(0, player.hp) / player.maxHp;
        ctx.fillStyle = COLORS.HP_BAR_BG; ctx.fillRect(player.pos.x, player.pos.y - 12, player.size.width, 6);
        ctx.fillStyle = COLORS.HP_BAR_FILL_PLAYER; ctx.fillRect(player.pos.x, player.pos.y - 12, player.size.width * hpPct, 6);
    }
  }, [gameState.level, gameState.status]);

  const loop = useCallback(() => {
    update();
    draw();
    requestRef.current = requestAnimationFrame(loop);
  }, [update, draw]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [loop]);

  // --- Handlers ---
  const handleStartGame = () => {
      // Don't reset lives if player has purchased some (unless dead)
      if (livesRef.current <= 0) livesRef.current = 3;
      generateLevel(1, true); 
  };
  
  const handleOpenShop = () => {
      setGameState(prev => ({ ...prev, status: 'shop' }));
  };

  const handleTogglePause = () => {
      setGameState(prev => {
          if (prev.status === 'playing') return { ...prev, status: 'paused' };
          if (prev.status === 'paused') return { ...prev, status: 'playing' };
          return prev;
      });
  };

  const handleRetreat = () => {
      // Return to menu, keep gold
      setGameState(prev => ({ ...prev, status: 'menu' }));
      saveGameData(); // Save on retreat
  };

  const handleToggleMute = () => {
      setGameState(prev => {
          const newMuted = !prev.muted;
          SoundManager.muted = newMuted;
          return { ...prev, muted: newMuted };
      });
  };

  const handleBuyUpgrade = (type: keyof Upgrades) => {
      const priceMap: {[key: string]: number} = {
          maxHp: PRICES.MAX_HP,
          sharpSword: PRICES.SHARP_SWORD,
          tripleJump: PRICES.TRIPLE_JUMP,
          downStrike: PRICES.DOWN_STRIKE
      };
      const cost = priceMap[type];
      
      if (goldRef.current >= cost && !upgradesRef.current[type]) {
          goldRef.current -= cost;
          upgradesRef.current[type] = true;
          
          if (type === 'maxHp') {
              playerRef.current.maxHp += 1;
              playerRef.current.hp += 1;
          }

          setGameState(prev => ({ 
              ...prev, 
              gold: goldRef.current, 
              upgrades: { ...upgradesRef.current } 
          }));
          
          SoundManager.playCoin(); // Positive feedback
          saveGameData(); // Save on purchase
      }
  };

  const handleBuyLife = () => {
      if (goldRef.current >= PRICES.EXTRA_LIFE) {
          goldRef.current -= PRICES.EXTRA_LIFE;
          livesRef.current += 1;
          // IMPORTANT: Update state immediately so UI reflects change
          setGameState(prev => ({ ...prev, gold: goldRef.current, lives: livesRef.current }));
          SoundManager.playCoin();
          saveGameData();
      }
  };

  const handleCosmeticAction = (type: 'skin' | 'hat', id: string) => {
      const price = id === 'legend' ? PRICES.LEGEND_SKIN : PRICES.COSMETIC;
      const cosmetics = cosmeticsRef.current;
      const isSkin = type === 'skin';
      const isOwned = isSkin ? cosmetics.ownedSkins.includes(id as SkinId) : cosmetics.ownedHats.includes(id as HatId);
      
      if (isOwned) {
          // EQUIP
          if (isSkin) cosmetics.currentSkin = id as SkinId;
          else cosmetics.currentHat = id as HatId;
          SoundManager.playCoin(); // Positive feedback
      } else {
          // BUY & EQUIP
          if (goldRef.current >= price) {
              goldRef.current -= price;
              if (isSkin) {
                  cosmetics.ownedSkins.push(id as SkinId);
                  cosmetics.currentSkin = id as SkinId;
              } else {
                  cosmetics.ownedHats.push(id as HatId);
                  cosmetics.currentHat = id as HatId;
              }
              SoundManager.playCoin(); // Positive feedback
          } else {
              return; // Not enough gold
          }
      }

      setGameState(prev => ({ 
          ...prev, 
          gold: goldRef.current, 
          cosmetics: { ...cosmeticsRef.current }
      }));
      saveGameData(); // Save on cosmetic change/buy
  };

  return (
    <div className="relative w-full h-screen flex items-center justify-center bg-black">
      <div className="relative shadow-2xl rounded-lg overflow-hidden border border-slate-700">
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="block bg-slate-900" />
        <GameHUD 
            gameState={gameState} 
            onStartGame={handleStartGame} 
            onOpenShop={handleOpenShop}
            onBuyUpgrade={handleBuyUpgrade}
            onBuyLife={handleBuyLife}
            onCosmeticAction={handleCosmeticAction}
            onTogglePause={handleTogglePause}
            onRetreat={handleRetreat}
            onToggleMute={handleToggleMute}
        />
      </div>
    </div>
  );
};