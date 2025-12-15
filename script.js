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
fruits.forEach(f => sliceCount[f.name] = 0);

// Track first 10 non-bomb items
let initialItems = [];
const INITIAL_POOL_SIZE = 10;

// -------------------- Mouse --------------------
const mouse = { x: canvas.width / 2, y: canvas.height / 2 };
function updateMouse(e) {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
}

canvas.addEventListener("pointerdown", e => {
  updateMouse(e);
  isSlicing = true;
  for (let i = 0; i < 5; i++) particlesArray.push(new Particle());
});

canvas.addEventListener("pointermove", e => {
  updateMouse(e);
  if (!isSlicing) return;
  trail.push({ x: mouse.x, y: mouse.y });
  if (trail.length > 12) trail.shift();
  if (particlesArray.length < 300) for (let i = 0; i < 2; i++) particlesArray.push(new Particle());
});

canvas.addEventListener("pointerup", () => { 
  isSlicing = false; 
  trail.length = 0; 
});

// -------------------- Trail --------------------
function drawTrail() {
  if(trail.length < 2) return;
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.shadowColor = "rgba(255,255,255,0.8)";
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.moveTo(trail[0].x, trail[0].y);
  for(let i=1; i<trail.length; i++) ctx.lineTo(trail[i].x, trail[i].y);
  ctx.stroke();
  ctx.restore();
}

// -------------------- Particles --------------------
class Particle {
  constructor(x = mouse.x, y = mouse.y, explosive = false) {
    this.x = x; this.y = y;
    this.size = explosive ? Math.random()*4+3 : Math.random()*2+1;
    const angle = Math.random()*Math.PI*2;
    const speed = explosive ? Math.random()*6+4 : Math.random()*2;
    this.speedX = Math.cos(angle)*speed;
    this.speedY = Math.sin(angle)*speed;
    this.color = explosive ? `hsl(${Math.random()*40},100%,${50+Math.random()*20}%)`
                           : ["hsl(50,100%,90%)","hsl(40,100%,60%)","hsla(29,100%,50%,1.00)"][Math.floor(Math.random()*3)];
    this.alpha = 1;
    this.explosive = explosive;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    if(this.explosive) { this.speedX *= 0.92; this.speedY *= 0.92; this.alpha -= 0.04; }
    else this.alpha -= 0.03;
    this.size *= 0.96;
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x,this.y,this.size,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
}

function createExplosion(x,y){
  for(let i=0;i<30;i++){
    const p = new Particle(x,y,true);
    const angle = Math.random()*Math.PI*2;
    const speed = Math.random()*8+4;
    p.speedX = Math.cos(angle)*speed;
    p.speedY = Math.sin(angle)*speed;
    p.color = `hsl(${Math.random()*40},100%,${50+Math.random()*20}%)`;
    particlesArray.push(p);
  }
}

// -------------------- Items --------------------
class Item {
  constructor(name, src) {
    this.name = name;
    this.img = new Image();
    this.img.src = src;
    this.size = 150;

    // Spawn near center of screen
    this.x = canvas.width/2 + (Math.random()*160-80);
    this.y = canvas.height/2 + (Math.random()*50-25);

    this.gravity = 0.18;
    const minApex = canvas.height*0.15;
    const maxApex = canvas.height*0.3;
    const targetApex = minApex + Math.random()*(maxApex-minApex);
    this.speedY = -Math.sqrt(2*this.gravity*(this.y-targetApex));
    this.speedX = Math.random()*1.6-0.8;
    this.dead = false;
  }
  update() {
    this.x += this.speedX; 
    this.y += this.speedY; 
    this.speedY += this.gravity;
    if(this.y < 20){ this.y = 20; this.speedY = 0; }
    if(this.y > canvas.height + this.size) this.dead = true;
  }
  draw() { ctx.drawImage(this.img,this.x,this.y,this.size,this.size); }
}

// -------------------- Spawn --------------------
function spawnItem() {
  if(gameOver || items.length >= 8) return;

  let data;
  if(initialItems.length < INITIAL_POOL_SIZE) {
    // First 10 random, each fruit at least twice
    const pool = [];
    fruits.forEach(f=>{ pool.push(f); pool.push(f); });
    initialItems.forEach(f=>{
      const idx = pool.findIndex(p=>p.name===f.name);
      if(idx>-1) pool.splice(idx,1);
    });
    data = pool[Math.floor(Math.random()*pool.length)];
    initialItems.push(data);
  } else {
    // TikTok-style weighting
    const totalSlices = Object.values(sliceCount).reduce((a,b)=>a+b,0);
    if(totalSlices===0) data = fruits[Math.floor(Math.random()*fruits.length)];
    else {
      let rand = Math.random()*totalSlices;
      for(const f of fruits){
        rand -= sliceCount[f.name];
        if(rand <= 0){ data = f; break; }
      }
      if(!data) data = fruits[Math.floor(Math.random()*fruits.length)];
    }
  }

  // 15% bomb chance
  if(Math.random() < 0.15) data = bomb;
  items.push(new Item(data.name, data.src));
}
setInterval(spawnItem, 1500);

// -------------------- Collision --------------------
function checkSlice() {
  if(!isSlicing || gameOver) return;
  for(let i=items.length-1;i>=0;i--){
    let hit = false;
    for(let t=0;t<trail.length;t++){
      const dx = trail[t].x - (items[i].x+items[i].size/2);
      const dy = trail[t].y - (items[i].y+items[i].size/2);
      if(Math.hypot(dx,dy) < items[i].size/2) { hit = true; break; }
    }
    if(hit){
      if(items[i].name === "bomb"){
        lives--; 
        createExplosion(items[i].x+items[i].size/2, items[i].y+items[i].size/2);
      } else {
        score++; 
        sliceCount[items[i].name]++;
        for(let j=0;j<6;j++) particlesArray.push(new Particle(items[i].x+items[i].size/2, items[i].y+items[i].size/2));
      }
      items.splice(i,1);
    }
  }

  // Check end conditions
  if(lives <= 0) endGame("Game Over!");
  if(score >= 25) endGame("You Win!");
}

// -------------------- End / Reset --------------------
let finishScreen;
function endGame(text = "Game Finished!") {
  gameOver = true;
  isSlicing = false;  // prevent accidental slicing after restart

  if(finishScreen) document.body.removeChild(finishScreen);
  finishScreen = document.createElement("div");
  finishScreen.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.95);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    z-index: 9999; color: white; text-align: center; font-family: 'DotGothic16', sans-serif;
  `;

  const mostSliced = Object.entries(sliceCount).sort((a,b)=>b[1]-a[1])[0][0];

  finishScreen.innerHTML = `
    <h1 style="margin-bottom:20px;">${text}</h1>
    <img src="${fruits.find(f=>f.name===mostSliced)?.src || ''}" 
         style="max-width:200px; margin-bottom:30px; border-radius:15px; box-shadow:0 0 20px white;">
  `;

  const btn = document.createElement("button");
  btn.innerText = "Restart";
  btn.style.cssText = `
    font-size: 1.2rem;
    padding: 10px 40px;
    cursor: pointer; border: none; border-radius: 25px;
    background: linear-gradient(90deg, #ff4b2b, #ff416c);
    color: white; font-weight: bold; box-shadow: 0 4px 12px rgba(255,75,43,0.4);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  `;
  btn.onmouseenter = () => { btn.style.transform="scale(1.05)"; btn.style.boxShadow="0 6px 18px rgba(255,75,43,0.5)"; };
  btn.onmouseleave = () => { btn.style.transform="scale(1)"; btn.style.boxShadow="0 4px 12px rgba(255,75,43,0.4)"; };
  btn.onclick = () => { document.body.removeChild(finishScreen); resetGame(); };

  finishScreen.appendChild(btn);
  document.body.appendChild(finishScreen);
}

function resetGame() {
  items.length = 0; particlesArray.length = 0; trail.length = 0;
  score = 0; lives = 3; gameOver = false; initialItems = [];
  isSlicing = false;
  for(let k in sliceCount) sliceCount[k]=0;
}

// -------------------- Game Loop --------------------
function animate(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for(let i=particlesArray.length-1;i>=0;i--){
    particlesArray[i].update();
    particlesArray[i].draw();
    if(particlesArray[i].alpha<=0||particlesArray[i].size<=0.2) particlesArray.splice(i,1);
  }
  drawTrail();
  for(let i=items.length-1;i>=0;i--){
    items[i].update();
    items[i].draw();
    if(items[i].dead) items.splice(i,1);
  }
  checkSlice();
  ctx.fillStyle="white"; ctx.font="24px DotGothic16";
  ctx.fillText(`Score: ${score}`,20,40);
  ctx.fillText(`Lives: ${lives}`,20,70);
  requestAnimationFrame(animate);
}
animate();
