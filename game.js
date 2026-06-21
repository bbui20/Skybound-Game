const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const bestEl = document.querySelector("#best");
const panel = document.querySelector("#panel");
const startButton = document.querySelector("#start");
const pauseButton = document.querySelector("#pause");
const muteButton = document.querySelector("#mute");
const characterSelect = document.querySelector("#characterSelect");
const charDoveBtn = document.querySelector("#char-dove");
const charFlyBtn = document.querySelector("#char-fly");
const charBatBtn = document.querySelector("#char-bat");
const charDragonBtn = document.querySelector("#char-dragon");
const startGameBtn = document.querySelector("#startGame");
const coinsEl = document.querySelector("#coins");
const coinTargetEl = document.querySelector("#coin-target");
const flyStatusEl = document.querySelector("#fly-status");
const batStatusEl = document.querySelector("#bat-status");
const dragonStatusEl = document.querySelector("#dragon-status");
const coinCounter = document.querySelector(".coin-counter");

const WIDTH = 432;
const HEIGHT = 768;
const FLOOR_Y = 674;
const STORAGE_KEY = "codex-flappy-best";
const DRAGON_UNLOCK_KEY = "codex-flappy-dragon-unlocked";
const COINS_KEY = "codex-flappy-coins";
let lastFrame = 0;

// Images
const birdUpImg = new Image();
birdUpImg.src = 'img/pigeonoben.png';

const birdDownImg = new Image();
birdDownImg.src = 'img/pigeonunten.png';

const dragonUpImg = new Image();
dragonUpImg.src = 'img/dragonoben.png';

const dragonDownImg = new Image();
dragonDownImg.src = 'img/dragonunten.png';

const flyUpImg = new Image();
flyUpImg.src = 'img/flyoben.png';

const flyDownImg = new Image();
flyDownImg.src = 'img/flyunten.png';

const batUpImg = new Image();
batUpImg.src = 'img/batoben.png';

const batDownImg = new Image();
batDownImg.src = 'img/batunten.png';

const pigeonBgImg = new Image();
pigeonBgImg.src = 'img/pigeonbackground.png';

const dragonBgImg = new Image();
dragonBgImg.src = 'img/dragonbackground.png';

const flyBgImg = new Image();
flyBgImg.src = 'img/flybackground.png';

const batBgImg = new Image();
batBgImg.src = 'img/batbackground.png';

function getBgImg() {
  if (state.selectedCharacter === "dragon") return dragonBgImg;
  if (state.selectedCharacter === "fly") return flyBgImg;
  if (state.selectedCharacter === "bat") return batBgImg;
  return pigeonBgImg;
}

const pizzaCoinImg = new Image();
pizzaCoinImg.src = 'img/pizzacoin.png';

const pigeonObstacleImg = new Image();
pigeonObstacleImg.src = 'img/pigeonobstacle.png';

const dragonObstacleImg = new Image();
dragonObstacleImg.src = 'img/dragonobstacle.png';

const flyObstacleImg = new Image();
flyObstacleImg.src = 'img/flyobstacle.png';

const batObstacleImg = new Image();
batObstacleImg.src = 'img/batobstacle.png';

function getPipeImg() {
  if (state.selectedCharacter === "dragon") return dragonObstacleImg;
  if (state.selectedCharacter === "fly") return flyObstacleImg;
  if (state.selectedCharacter === "bat") return batObstacleImg;
  // Default für Taube
  return pigeonObstacleImg; 
}

const state = {
  mode: "ready",
  score: 0,
  best: Number(localStorage.getItem(STORAGE_KEY) || 0),
  muted: false,
  time: 0,
  spawnTimer: 0,
  coinSpawnTimer: 0,
  shake: 0,
  pipes: [],
  particles: [],
  coins: [],
  selectedCharacter: "dove",
  coinsThisRound: 0,
  unlockedThisRound: false,
  flyUnlocked: false,
  batUnlocked: false,
  dragonUnlocked: false,
  bird: {
    x: 116,
    y: 318,
    radius: 21,
    velocity: 0,
    angle: 0,
    flapFrame: 0
  }
};

bestEl.textContent = state.best;

// Initialize character select UI
function updateCoinsUI() {
  if (state.selectedCharacter === "bat") {
    coinsEl.textContent = "";
    coinTargetEl.textContent = " (Max Level)";
  } else {
    coinsEl.textContent = state.coinsThisRound;
    let target = 3; // Taube -> Drache (3 Pizzen)
    if (state.selectedCharacter === "dragon") target = 4; // Drache -> Fliege (4 Pizzen)
    if (state.selectedCharacter === "fly") target = 5; // Fliege -> Fledermaus (5 Pizzen)
    coinTargetEl.textContent = "/" + target;
  }
}

function initCharacterSelect() {
  flyStatusEl.textContent = state.flyUnlocked ? "Available" : "(4 🍕)";
  batStatusEl.textContent = state.batUnlocked ? "Available" : "(5 🍕)";
  dragonStatusEl.textContent = state.dragonUnlocked ? "Available" : "(3 🍕)";

  charFlyBtn.disabled = !state.flyUnlocked;
  charBatBtn.disabled = !state.batUnlocked;
  charDragonBtn.disabled = !state.dragonUnlocked;

  if (state.selectedCharacter === "fly" && !state.flyUnlocked) state.selectedCharacter = "dove";
  if (state.selectedCharacter === "bat" && !state.batUnlocked) state.selectedCharacter = "dove";
  if (state.selectedCharacter === "dragon" && !state.dragonUnlocked) state.selectedCharacter = "dove";

  charDoveBtn.classList.toggle("selected", state.selectedCharacter === "dove");
  charFlyBtn.classList.toggle("selected", state.selectedCharacter === "fly");
  charBatBtn.classList.toggle("selected", state.selectedCharacter === "bat");
  charDragonBtn.classList.toggle("selected", state.selectedCharacter === "dragon");

  updateCoinsUI();
}

initCharacterSelect();

const sounds = {
  flap: new Audio('audio/flap.mp3'),
  score: new Audio('audio/collect.mp3'),
  hit: new Audio('audio/bonk.mp3')
};

const audio = {
  play(type) {
    if (state.muted) return;
    const sound = sounds[type];
    if (sound) {
      // Durch cloneNode können Sounds (wie "Flap") auch bei schnellem Tippen überlappen
      const clone = sound.cloneNode(true);
      clone.play().catch(e => console.log("Audio play prevented:", e));
    }
  }
};

function reset() {
  state.mode = "ready";
  state.score = 0;
  state.time = 0;
  state.spawnTimer = 66;
  state.coinSpawnTimer = 0;
  state.shake = 0;
  state.pipes = [];
  state.coins = [];
  state.particles = [];
  state.coinsThisRound = 0;
  state.unlockedThisRound = false;
  state.bird.x = 116;
  state.bird.y = 318;
  state.bird.velocity = 0;
  state.bird.angle = 0;
  state.bird.flapFrame = 0;
  scoreEl.textContent = "0";
  updateCoinsUI();
  characterSelect.classList.remove("is-hidden");
  panel.classList.add("is-hidden");
  pauseButton.setAttribute("aria-label", "Pause");
  pauseButton.querySelector("span").textContent = "II";
  initCharacterSelect();
}

function init() {
  state.mode = "ready";
  state.score = 0;
  state.time = 0;
  state.spawnTimer = 66;
  state.coinSpawnTimer = 0;
  state.shake = 0;
  state.pipes = [];
  state.coins = [];
  state.particles = [];
  state.coinsThisRound = 0;
  state.unlockedThisRound = false;
  state.bird.x = 116;
  state.bird.y = 318;
  state.bird.velocity = 0;
  state.bird.angle = 0;
  state.bird.flapFrame = 0;
  scoreEl.textContent = "0";
  updateCoinsUI();
  startButton.querySelector("span:last-child").textContent = "Start";
  panel.classList.remove("is-hidden");
  characterSelect.classList.add("is-hidden");
  pauseButton.setAttribute("aria-label", "Pause");
  pauseButton.querySelector("span").textContent = "II";
}

function start() {
  if (state.mode === "ended") reset();
  state.mode = "character-select";
  showCharacterSelect();
}

function showCharacterSelect() {
  characterSelect.classList.remove("is-hidden");
  panel.classList.add("is-hidden");
}

function startGame() {
  characterSelect.classList.add("is-hidden");
  state.mode = "playing";
  flap();
}

function flap() {
  if (state.mode === "ready") {
    start();
    return;
  }
  if (state.mode !== "playing") return;
  state.bird.velocity = -8.9;
  state.bird.flapFrame = 7;
  audio.play("flap");
  burst(state.bird.x - 18, state.bird.y + 8, "#a8b1b3", 5, -2.4);
}

function togglePause() {
  if (state.mode === "ended" || state.mode === "ready") return;
  state.mode = state.mode === "paused" ? "playing" : "paused";
  pauseButton.setAttribute("aria-label", state.mode === "paused" ? "Resume" : "Pause");
  pauseButton.querySelector("span").textContent = state.mode === "paused" ? "▶" : "II";
}

function toggleMute() {
  state.muted = !state.muted;
  muteButton.setAttribute("aria-label", state.muted ? "Unmute" : "Mute");
  muteButton.querySelector("span").textContent = state.muted ? "X" : "♪";
}

function spawnPipe() {
  const gap = Math.max(150, 204 - Math.min(state.score, 20) * 3);
  const top = 96 + Math.random() * (FLOOR_Y - gap - 220);
  state.pipes.push({
    x: WIDTH + 36,
    w: 72,
    top,
    bottom: top + gap,
    passed: false
  });
}

function spawnCoin() {
  const x = WIDTH + 30;
  let y;
  let isValid = false;
  let attempts = 0;
  
  // Try to find a position that doesn't collide with pipes
  while (!isValid && attempts < 5) {
    y = 96 + Math.random() * (FLOOR_Y - 192);
    
    // Check if this position avoids all current pipes
    isValid = true;
    for (const pipe of state.pipes) {
      const distance = Math.abs(pipe.x - x);
      if (distance < 120) { // Only check nearby pipes
        if (y >= pipe.top - 50 && y <= pipe.bottom + 50) {
          isValid = false;
          break;
        }
      }
    }
    attempts++;
  }
  
  state.coins.push({
    x,
    y,
    radius: 28,
    collected: false
  });
}

function burst(x, y, color, count, velocityX = -1.2) {
  for (let i = 0; i < count; i += 1) {
    state.particles.push({
      x,
      y,
      r: 2 + Math.random() * 3,
      vx: velocityX + Math.random() * 2.6,
      vy: -1.6 + Math.random() * 3.2,
      life: 22 + Math.random() * 16,
      color
    });
  }
}

function endGame() {
  if (state.mode === "ended") return;
  state.mode = "ended";
  state.shake = 14;
  audio.play("hit");
  burst(state.bird.x, state.bird.y, "#383c3d", 20, -1.8);
  if (state.score > state.best) {
    state.best = state.score;
    localStorage.setItem(STORAGE_KEY, String(state.best));
    bestEl.textContent = state.best;
  }
  startButton.querySelector("span:last-child").textContent = "Restart";
  panel.classList.remove("is-hidden");
}

function update(dt = 1) {
  state.time += dt;

  if (state.mode === "ready" || state.mode === "character-select") {
    state.bird.y = 318 + Math.sin(state.time * 0.06) * 11;
    state.bird.angle = Math.sin(state.time * 0.05) * 0.08;
  }

  if (state.mode === "playing") {
    state.bird.velocity += 0.52 * dt;
    state.bird.y += state.bird.velocity * dt;
    state.bird.angle = Math.max(-0.42, Math.min(1.05, state.bird.velocity * 0.08));
    state.bird.flapFrame = Math.max(0, state.bird.flapFrame - dt);

    state.spawnTimer += dt;
    const spawnEvery = Math.max(58, 90 - Math.min(state.score, 20) * 2);
    if (state.spawnTimer >= spawnEvery) {
      spawnPipe();
      state.spawnTimer = 0;
    }

    // Spawn coins
    state.coinSpawnTimer += dt;
    const coinSpawnEvery = Math.max(100, 140 - Math.min(state.score, 15) * 4);
    
    let currentTarget = 3;
    if (state.selectedCharacter === "dragon") currentTarget = 4;
    if (state.selectedCharacter === "fly") currentTarget = 5;
    if (state.selectedCharacter === "bat") currentTarget = 0;

    if (state.coinSpawnTimer >= coinSpawnEvery && state.coinsThisRound < currentTarget) {
      spawnCoin();
      state.coinSpawnTimer = 0;
    }

    const speed = 4.25 + Math.min(state.score, 25) * 0.08;
    state.pipes.forEach((pipe) => {
      pipe.x -= speed * dt;
      if (!pipe.passed && pipe.x + pipe.w < state.bird.x - state.bird.radius) {
        pipe.passed = true;
        state.score += 1;
        scoreEl.textContent = state.score;
        burst(WIDTH - 30, 74, "#f39c12", 8, -1.8);
      }
    });
    state.pipes = state.pipes.filter((pipe) => pipe.x + pipe.w > -20);

    // Update coins
    state.coins.forEach((coin) => {
      coin.x -= speed * dt;
      
      // Check collision with bird
      if (!coin.collected) {
        const dx = state.bird.x - coin.x;
        const dy = state.bird.y - coin.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < state.bird.radius + coin.radius) {
          coin.collected = true;
          state.coinsThisRound += 1;
          updateCoinsUI();
          audio.play("score");
          burst(coin.x, coin.y, "#FFD700", 12, -1.2);
          
          // Increase total coins and unlock character when reaching the round's target
          let target = 3; // Taube -> Drache
          if (state.selectedCharacter === "dragon") target = 4; // Drache -> Fliege
          if (state.selectedCharacter === "fly") target = 5; // Fliege -> Fledermaus
          if (state.selectedCharacter === "bat") target = Infinity; // Fledermaus -> Max

          if (state.coinsThisRound === target) {
            if (state.selectedCharacter === "dove" && !state.dragonUnlocked) {
              state.dragonUnlocked = true;
            } else if (state.selectedCharacter === "dragon" && !state.flyUnlocked) {
              state.flyUnlocked = true;
            } else if (state.selectedCharacter === "fly" && !state.batUnlocked) {
              state.batUnlocked = true;
            }
            initCharacterSelect();
          }
        }
      }
    });
    state.coins = state.coins.filter((coin) => coin.x > -50 || coin.collected);

    if (state.bird.y + state.bird.radius > FLOOR_Y || state.bird.y - state.bird.radius < 0) {
      endGame();
    }

    for (const pipe of state.pipes) {
      const closestX = Math.max(pipe.x, Math.min(state.bird.x, pipe.x + pipe.w));
      const inPipeX = state.bird.x + state.bird.radius > pipe.x && state.bird.x - state.bird.radius < pipe.x + pipe.w;
      const hitsTop = circleRectHit(state.bird.x, state.bird.y, state.bird.radius, closestX, 0, pipe.x, pipe.top);
      const hitsBottom = circleRectHit(state.bird.x, state.bird.y, state.bird.radius, closestX, pipe.bottom, pipe.x, FLOOR_Y - pipe.bottom);
      if (inPipeX && (hitsTop || hitsBottom)) endGame();
    }
  }

  state.particles.forEach((particle) => {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 0.07 * dt;
    particle.life -= dt;
  });
  state.particles = state.particles.filter((particle) => particle.life > 0);
  state.shake = Math.max(0, state.shake - dt);
}

function circleRectHit(cx, cy, radius, nearestX, rectY, rectX, rectH) {
  const nearestY = Math.max(rectY, Math.min(cy, rectY + rectH));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < radius * radius;
}

function draw() {
  ctx.save();
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  if (state.shake > 0) {
    ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
  }

  drawSky();
  drawPipes();
  drawCoins();
  drawFloor();
  drawParticles();
  drawBird();
  if (state.mode === "paused") drawPaused();
  ctx.restore();
}

function drawSky() {
  const bgImg = getBgImg();
  if (bgImg.complete && bgImg.naturalHeight !== 0) {
    const bgOffset = (state.time * 0.8) % WIDTH;
    // Math.floor und +1 Pixel in der Breite, um kleine Subpixel-Lücken zu schließen
    ctx.drawImage(bgImg, Math.floor(-bgOffset), 0, WIDTH + 1, HEIGHT);
    ctx.drawImage(bgImg, Math.floor(WIDTH - bgOffset), 0, WIDTH + 1, HEIGHT);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
    gradient.addColorStop(0, "#8baabf");
    gradient.addColorStop(0.55, "#bacdd8");
    gradient.addColorStop(1, "#d4cdb3");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, FLOOR_Y);

    // Background buildings
    ctx.fillStyle = "rgba(130, 140, 150, 0.5)";
    for (let i = 0; i < 8; i += 1) {
      const w = 40 + (i * 27) % 60;
      const h = 80 + (i * 43) % 200;
      const x = ((i * 120 - state.time * 0.1) % 640) - 120;
      ctx.fillRect(x, FLOOR_Y - h, w, h);
    }

    // Foreground buildings
    ctx.fillStyle = "rgba(90, 100, 110, 0.7)";
    for (let i = 0; i < 6; i += 1) {
      const w = 60 + (i * 31) % 80;
      const h = 40 + (i * 57) % 150;
      const x = ((i * 160 - state.time * 0.25) % 640) - 120;
      ctx.fillRect(x, FLOOR_Y - h, w, h);
    }
  }
}

function drawPipes() {
  for (const pipe of state.pipes) {
    drawPipe(pipe.x, 0, pipe.w, pipe.top, true);
    drawPipe(pipe.x, pipe.bottom, pipe.w, FLOOR_Y - pipe.bottom, false);
  }
}

function drawPipe(x, y, w, h, flip) {
  ctx.save();
  const drawAt = (dx, dy) => {
    const pipeImg = getPipeImg();
    if (!pipeImg.complete || pipeImg.naturalHeight === 0) return;
    
    // Originales Seitenverhältnis beibehalten (kein Verziehen/Stauchen!)
    let drawH = Math.round(w * (pipeImg.naturalHeight / pipeImg.naturalWidth));
    
    // Zeichne das komplette Bild einmal direkt an der Lücke (damit der Kopf/Deckel sichtbar ist)
    ctx.drawImage(pipeImg, dx, dy, w, drawH);
    
    // Um das Rohr länglich zu machen, ohne es zu verziehen oder den Kopf zu kacheln,
    // nehmen wir nur die untere Hälfte des Bildes (den "Hals") und kacheln diesen nahtlos.
    let currentY = dy + drawH - 1; // 1 Pixel Überlappung
    let drawn = drawH;
    
    const srcHalfY = Math.floor(pipeImg.naturalHeight / 2);
    const srcHalfH = pipeImg.naturalHeight - srcHalfY;
    const destHalfH = Math.round(w * (srcHalfH / pipeImg.naturalWidth));
    
    while (drawn < 800) {
      ctx.drawImage(pipeImg, 0, srcHalfY, pipeImg.naturalWidth, srcHalfH, dx, currentY, w, destHalfH);
      currentY += destHalfH - 1;
      drawn += destHalfH;
    }
  };

  if (flip) {
    // Für obere Rohre: Spiegeln, damit das Ende des Bildes exakt an der Lücke beginnt
    ctx.translate(x + w / 2, y + h / 2);
    ctx.scale(1, -1);
    drawAt(-w / 2, -h / 2);
  } else {
    // Für untere Rohre: Normal zeichnen, von der Lücke abwärts
    drawAt(x, y);
  }
  ctx.restore();
}

function drawFloor() {
  const bgImg = getBgImg();
  if (bgImg.complete && bgImg.naturalHeight !== 0) {
    return; // Hide the floor to let the custom background cover the entire game area
  }

  ctx.fillStyle = "#555b60";
  ctx.fillRect(0, FLOOR_Y, WIDTH, HEIGHT - FLOOR_Y);
  ctx.fillStyle = "#3b4044";
  ctx.fillRect(0, FLOOR_Y + 12, WIDTH, HEIGHT - FLOOR_Y - 12);
  
  ctx.fillStyle = "#7b8388";
  ctx.fillRect(0, FLOOR_Y, WIDTH, 12);
  
  ctx.fillStyle = "#2d3134";
  const offset = (state.time * 2.2) % 42;
  for (let x = -42; x < WIDTH + 42; x += 42) {
    ctx.fillRect(x - offset, FLOOR_Y + 12, 4, HEIGHT - FLOOR_Y);
  }
}

function drawBird() {
  const bird = state.bird;
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.angle);

  // Select bird image based on character and flight direction
  let birdImage;
  if (state.selectedCharacter === "dragon") {
    birdImage = bird.velocity < 0 ? dragonUpImg : dragonDownImg;
  } else if (state.selectedCharacter === "fly") {
    birdImage = bird.velocity < 0 ? flyUpImg : flyDownImg;
  } else if (state.selectedCharacter === "bat") {
    birdImage = bird.velocity < 0 ? batUpImg : batDownImg;
  } else {
    birdImage = bird.velocity < 0 ? birdUpImg : birdDownImg;
  }

  const targetSize = 80;
  const scale = Math.min(targetSize / birdImage.naturalWidth, targetSize / birdImage.naturalHeight);
  const drawWidth = birdImage.naturalWidth * scale;
  const drawHeight = birdImage.naturalHeight * scale;
  ctx.drawImage(birdImage, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

  ctx.restore();
}

function drawParticles() {
  for (const particle of state.particles) {
    ctx.globalAlpha = Math.max(0, particle.life / 34);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawCoins() {
  for (const coin of state.coins) {
    if (!coin.collected) {
      ctx.save();
      ctx.translate(coin.x, coin.y);
      
      // Try to draw image, fallback to circle if not loaded
      if (pizzaCoinImg.complete && pizzaCoinImg.naturalHeight !== 0) {
        ctx.drawImage(pizzaCoinImg, -coin.radius, -coin.radius, coin.radius * 2, coin.radius * 2);
      } else {
        // Fallback: draw a golden circle
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#FFA500";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      ctx.restore();
    }
  }
}

function drawPaused() {
  ctx.fillStyle = "rgba(16, 36, 47, 0.25)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#fff6cb";
  ctx.font = "900 54px ui-rounded, Avenir Next, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeStyle = "#793b26";
  ctx.lineWidth = 7;
  ctx.strokeText("Paused", WIDTH / 2, HEIGHT / 2);
  ctx.fillText("Paused", WIDTH / 2, HEIGHT / 2);
}

function loop(timestamp = 0) {
  const dt = lastFrame ? Math.min(6, (timestamp - lastFrame) / 16.667) : 1;
  lastFrame = timestamp;
  if (state.mode !== "paused") update(dt);
  draw();
  requestAnimationFrame(loop);
}

startButton.addEventListener("click", start);
pauseButton.addEventListener("click", togglePause);
muteButton.addEventListener("click", toggleMute);

// Character selection
charDoveBtn.addEventListener("click", () => {
  state.selectedCharacter = "dove";
  initCharacterSelect();
});

charFlyBtn.addEventListener("click", () => {
  state.selectedCharacter = "fly";
  initCharacterSelect();
});

charBatBtn.addEventListener("click", () => {
  state.selectedCharacter = "bat";
  initCharacterSelect();
});

charDragonBtn.addEventListener("click", () => {
  if (state.dragonUnlocked) {
    state.selectedCharacter = "dragon";
    initCharacterSelect();
  }
});

startGameBtn.addEventListener("click", startGame);

window.addEventListener("keydown", (event) => {
  if (event.code === "Space" || event.code === "ArrowUp") {
    event.preventDefault();
    flap();
  }
  if (event.code === "KeyP") togglePause();
  if (event.code === "Enter" && state.mode !== "playing") start();
});

canvas.addEventListener("pointerdown", flap);
panel.addEventListener("pointerdown", (event) => {
  if (event.target !== startButton && !startButton.contains(event.target)) start();
});

init();
loop();
