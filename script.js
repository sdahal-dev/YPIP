const canvas = document.getElementById("main-canvas");
const ctx = canvas.getContext("2d");
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
const particlesArray = [];
const knifeImg = new Image();
knifeImg.src = "katana.png";
let isSlicing = false;

const colors = [
  "hsl(50, 100%, 90%)",  // white-yellow
  "hsl(40, 100%, 60%)",  // gold
  "hsla(29, 100%, 50%, 1.00)",  // orange-red
];

window.addEventListener("resize", () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
})

const mouse = {
    x: canvas.width/2,
    y: canvas.height/2
}

canvas.addEventListener("pointerdown", (e) => {
    isSlicing = true;
    for(let i = 0; i < 15; i++){
        particlesArray.push(new Particle());
    }
})

canvas.addEventListener("pointermove", (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
    if(isSlicing){
        for(let i = 0; i < 10; i++){
            particlesArray.push(new Particle());
        }
    }
})

canvas.addEventListener("pointerup", () => {
    isSlicing = false;
})



function drawKnife(){
    if(knifeImg.complete){
        const width = 400;
        const height = 400;
        ctx.drawImage(knifeImg, mouse.x, mouse.y, width, height);
    }
}

class Particle {
    constructor(){
        this.x = mouse.x;
        this.y = mouse.y;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 6 - 3;
        this.speedY = Math.random() * 6 - 3;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.alpha = 1;
    }
    update(){
        this.x += this.speedX;
        this.y += this.speedY;
        this.alpha -= 0.02;
        if(this.size > 0.2) this.size -= 0.1;
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function handleParticles(){
    for(let i = 0; i < particlesArray.length; i++){
        particlesArray[i].update();
        particlesArray[i].draw();
        if(particlesArray[i].size <= 0.3){
            particlesArray.splice(i, 1);
            i--;
        }
    }
}
console.log(particlesArray);
function animate(){
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    handleParticles();
    if(knifeImg.complete) drawKnife();
    requestAnimationFrame(animate);
}

animate();





