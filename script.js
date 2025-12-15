// Music
const bgMusic = document.getElementById("bg-music");

document.addEventListener("pointerdown", () => {
  bgMusic.volume = 0.1;
  bgMusic.play();
});

const canvas = document.getElementById("main-canvas");
const ctx = canvas.getContext("2d");

// -------------------- Canvas Setup --------------------
function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// -------------------- Variables --------------------
const particlesArray = [];
const trail = [];
const items = [];

let isSlicing = false;
let score = 0;
let lives = 3;
let gameOver = false;

// -------------------- Fruits and Bomb --------------------
const fruits = [
  { name: "67", src: "Images/67.png" },
  { name: "gloving", src: "Images/gloving.png" },
  { name: "groupLeader", src: "Images/groupLeader.png" },
  { name: "butWhenI", src: "Images/butWhenI.png" },
  { name: "lowTaper", src: "Images/lowTaper.png" }
];
const bomb = { name: "bomb", src: "Images/platoRepublic.jpg" };

// Track slices
const sliceCount = {};
fruits.forEach(f => (sliceCount[f.name] = 0));

// -------------------- Mouse --------------------
const mouse = { x: canvas.width / 2, y: canvas.height / 2 };
function updateMouse(e) {
  const rect = canvas.getBoundingClientRect();
  mouse.x = Math.min(Math.max(e.clientX - rect.left, 0), canvas.width);
  mouse.y = Math.min(Math.max(e.clientY - rect.top, 0), canvas.height);
}

canvas.addEventListener("pointerdown", e => {
  if (gameOver) return;
  updateMouse(e);
  isSlicing = true;
});

canvas.addEventListener("pointermove", e => {
  if (!isSlicing || gameOver) return;
  updateMouse(e);
  trail.push({ x: mouse.x, y: mouse.y });
  if (trail.length > 12) trail.shift();
});

canvas.addEventListener("pointerup", () => {
  isSlicing = false;
  trail.length = 0;
});

// -------------------- Sounds --------------------
const sliceSound = new Audio('Sounds/67.mp3');
const sliceSound2 = new Audio('Sounds/butWhenI.mp3');
const sliceSound3 = new Audio('Sounds/lowTaper.mp3');
const sliceSound4 = new Audio('Sounds/gloving.mp3');
const sliceSound5 = new Audio('Sounds/groupLeader.mp3');
const explosionSoundSrc = 'Sounds/explosion.mp3';

// -------------------- Trail --------------------
function drawTrail() {
  if (trail.length < 2) return;
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 3;
  ctx.shadowBlur = 12;
  ctx.shadowColor = "white";
  ctx.beginPath();
  ctx.moveTo(trail[0].x, trail[0].y);
  for (let i = 1; i < trail.length; i++) ctx.lineTo(trail[i].x, trail[i].y);
  ctx.stroke();
  ctx.restore();
}

// -------------------- Particles --------------------
class Particle {
  constructor(x, y, explosive = false) {
    this.x = x;
    this.y = y;
    this.size = explosive ? Math.random() * 4 + 3 : Math.random() * 2 + 1;
    const angle = Math.random() * Math.PI * 2;
    const speed = explosive ? Math.random() * 8 + 4 : Math.random() * 2;
    this.speedX = Math.cos(angle) * speed;
    this.speedY = Math.sin(angle) * speed;
    this.alpha = 1;
    this.explosive = explosive;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.alpha -= this.explosive ? 0.04 : 0.03;
    this.size *= 0.96;
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function createExplosion(x, y) {
  for (let i = 0; i < 30; i++) {
    particlesArray.push(new Particle(x, y, true));
  }
}

// -------------------- Items --------------------
class Item {
  constructor(name, src) {
    this.name = name;
    this.img = new Image();
    this.img.src = src;
    this.size = 120;

    this.x = Math.random() * (canvas.width - this.size);
    this.y = canvas.height + this.size;

    this.gravity = 0.18;
    const minApex = canvas.height * 0.15;
    const maxApex = canvas.height * 0.35;
    const targetApex = minApex + Math.random() * (maxApex - minApex);

    this.speedY = -Math.sqrt(2 * this.gravity * (this.y - targetApex));
    this.speedX = Math.random() * 1.6 - 0.8;
    this.dead = false;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.speedY += this.gravity;

    // Keep within canvas
    if (this.x < 0) { this.x = 0; this.speedX *= -1; }
    if (this.x + this.size > canvas.width) { this.x = canvas.width - this.size; this.speedX *= -1; }
    if (this.y < 0) this.y = 0;
    if (this.y > canvas.height + this.size) this.dead = true;
  }

  draw() {
    ctx.drawImage(this.img, this.x, this.y, this.size, this.size);
  }
}

// -------------------- TikTok-style Algorithm --------------------
const TOTAL_INITIAL = 12;
let initialPool = []; 

// Create first 12 with at least one of each fruit
function setupInitialPool() {
  initialPool = [];
  fruits.forEach(fruit => {
    initialPool.push(fruit);
    initialPool.push(fruit); // two copies of each for variability
  });
  // shuffle
  for (let i = initialPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [initialPool[i], initialPool[j]] = [initialPool[j], initialPool[i]];
  }
}
setupInitialPool();

// Track recent slices
const recentSlices = [];
const RECENT_LENGTH = 10;
function updateRecent(fruitName) {
  recentSlices.push(fruitName);
  if (recentSlices.length > RECENT_LENGTH) recentSlices.shift();
}

// Pick fruit weighted by slices and recent activity
function pickFruitWeighted() {
  const totalSlices = Object.values(sliceCount).reduce((a, b) => a + b, 0) + fruits.length;
  let rand = Math.random() * totalSlices;
  let cumulative = 0;
  for (let fruit of fruits) {
    cumulative += (sliceCount[fruit.name] + 1);
    if (recentSlices.includes(fruit.name)) cumulative += 1;
    if (rand <= cumulative) return fruit;
  }
  return fruits[Math.floor(Math.random() * fruits.length)];
}

// -------------------- Spawn Item --------------------
function spawnItem() {
  if (gameOver || items.length >= 8) return;

  let data;
  if (initialPool.length > 0) {
    data = initialPool.shift();
    if (Math.random() < 0.1) data = bomb;
  } else {
    const CHANCE_RANDOM = 0.15;
    if (Math.random() < CHANCE_RANDOM) {
      const pool = [...fruits, bomb];
      data = pool[Math.floor(Math.random() * pool.length)];
    } else {
      data = pickFruitWeighted();
    }
  }

  items.push(new Item(data.name, data.src));
}
setInterval(spawnItem, 2000);

// -------------------- Life Handling --------------------
function loseLife() {
  lives--;
  if (lives <= 0 && !gameOver) {
    endGame("You Lost!");
    return true;
  }
  return false;
}

// -------------------- Collision --------------------
function checkSlice() {
  if (!isSlicing || gameOver) return;

  for (let i = items.length - 1; i >= 0; i--) {
    let hit = false;
    for (let t = 0; t < trail.length; t++) {
      const dx = trail[t].x - (items[i].x + items[i].size / 2);
      const dy = trail[t].y - (items[i].y + items[i].size / 2);
      if (Math.hypot(dx, dy) < items[i].size / 2) {
        hit = true;
        break;
      }
    }

    if (hit) {
      if (items[i].name === "bomb") {
        const explosionSound = new Audio(explosionSoundSrc);
        explosionSound.volume = 0.1;
        explosionSound.playbackRate = 2;
        explosionSound.play();

        createExplosion(items[i].x + items[i].size / 2, items[i].y + items[i].size / 2);
        const ended = loseLife();
        items.splice(i, 1);
        if (ended) { items.length = 0; trail.length = 0; return; }
      } else {
        score++;
        sliceCount[items[i].name]++;
        updateRecent(items[i].name);

        let sound;
        switch(items[i].name){
          case "67": sound=sliceSound; sound.currentTime=1; sound.volume=0.67; sound.playbackRate=3; break;
          case "butWhenI": sound=sliceSound2; sound.currentTime=0; sound.volume=0.99; sound.playbackRate=3; break;
          case "lowTaper": sound=sliceSound3; sound.currentTime=0; sound.volume=0.9; sound.playbackRate=2.3; break;
          case "gloving": sound=sliceSound4; sound.currentTime=0; sound.volume=0.99; sound.playbackRate=1.5; break;
          case "groupLeader": sound=sliceSound5; sound.currentTime=0; sound.volume=0.5; sound.playbackRate=3; break;
        }
        if(sound) sound.play();
        items.splice(i,1);
      }
    }
  }

  if(score>=18 && !gameOver) endGame("You Win!");
}

// -------------------- End / Reset --------------------
let finishScreen;
function endGame(text){
  gameOver=true; isSlicing=false;
  if(finishScreen) finishScreen.remove();

  finishScreen=document.createElement("div");
  finishScreen.style.cssText=`
    position: fixed; inset:0;
    background: rgba(0,0,0,0.95);
    display:flex; flex-direction:column; justify-content:center; align-items:center;
    color:white; z-index:9999; text-align:center;
    font-family: 'DotGothic16', sans-serif;
  `;

  const mostSliced = Object.entries(sliceCount).sort((a,b)=>b[1]-a[1])[0]?.[0];
  const imgSrc = fruits.find(f=>f.name===mostSliced)?.src || "";

  const title = document.createElement("h1");
  title.textContent=text;
  title.style.marginBottom="20px";
  finishScreen.appendChild(title);

  if(imgSrc){
    const img=document.createElement("img");
    img.src=imgSrc;
    img.style.cssText="max-width:200px;margin-bottom:30px;border-radius:15px;box-shadow:0 0 20px white;";
    finishScreen.appendChild(img);
  }

  const btn=document.createElement("button");
  btn.innerText="Restart";
  btn.style.cssText=`
    font-size:1.2rem; padding:10px 40px; cursor:pointer; border:none; border-radius:25px;
    background: linear-gradient(90deg,#ff4b2b,#ff416c);
    color:white; font-weight:bold; box-shadow:0 4px 12px rgba(255,75,43,0.4);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  `;
  btn.onmouseenter=()=>{btn.style.transform="scale(1.05)"; btn.style.boxShadow="0 6px 18px rgba(255,75,43,0.5)";}
  btn.onmouseleave=()=>{btn.style.transform="scale(1)"; btn.style.boxShadow="0 4px 12px rgba(255,75,43,0.4)";}
  btn.onclick=()=>{finishScreen.remove(); resetGame();}
  finishScreen.appendChild(btn);

  document.body.appendChild(finishScreen);
}

function resetGame(){
  items.length=0; particlesArray.length=0; trail.length=0;
  score=0; lives=3; gameOver=false; isSlicing=false;
  initialPool=[];
  recentSlices.length = 0;
  setupInitialPool();
  for(let k in sliceCount) sliceCount[k]=0;
}

// -------------------- Game Loop --------------------
function animate(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  for(let i=particlesArray.length-1;i>=0;i--){
    particlesArray[i].update();
    particlesArray[i].draw();
    if(particlesArray[i].alpha<=0) particlesArray.splice(i,1);
  }

  drawTrail();

  for(let i=items.length-1;i>=0;i--){
    items[i].update();
    items[i].draw();
    if(items[i].dead) items.splice(i,1);
  }

  checkSlice();

  ctx.fillStyle="white";
  ctx.font="24px DotGothic16";
  ctx.fillText(`Score: ${score}`,20,40);
  ctx.fillText(`Lives: ${lives}`,20,70);

  requestAnimationFrame(animate);
}

animate();
