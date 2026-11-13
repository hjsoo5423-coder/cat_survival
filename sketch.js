let player;
let cats = [];
let bullets = [];
let gems = [];
let joystick;

let survivalTime = 0;
let spawnInterval = 60; 
let gameOver = false;
let isPaused = false;

let playerExp = 0;
let expToNextLevel = 5;

let stats = {
  bulletCount: 1, 
  moveSpeed: 1,   
  fireRate: 1     
};
let playerLevel = 1;

let shakeIntensity = 0; 
let audioCtx;
let lastShotTime = 0;

let btnBullet = { x: 0, y: 0, w: 250, h: 80, text: "총알 갯수 증가 (+1발)" };
let btnSpeed = { x: 0, y: 0, w: 250, h: 80, text: "이동 속도 증가 (신속)" };
let btnFireRate = { x: 0, y: 0, w: 250, h: 80, text: "발사 속도 증가 (연사)" };

function setup() {
  createCanvas(windowWidth, windowHeight);
  player = new Player(width / 2, height / 2);
  joystick = new Joystick(100, height - 100, 50);
  updateButtonPositions();
}

function draw() {
  background(80, 180, 80);

  if (gameOver) {
    drawGameOver();
    return;
  }

  if (isPaused) {
    drawGameObjects();
    drawUI();
    drawUpgradeMenu();
    return;
  }

  survivalTime++;
  spawnInterval = max(15, 60 - floor(survivalTime / 600) * 5);

  if (frameCount % spawnInterval == 0) spawnCat();

  push();
  if (shakeIntensity > 0) {
    let shakeX = random(-shakeIntensity, shakeIntensity);
    let shakeY = random(-shakeIntensity, shakeIntensity);
    translate(shakeX, shakeY);
    shakeIntensity *= 0.85; 
    if (shakeIntensity < 0.5) shakeIntensity = 0;
  }

  for (let i = gems.length - 1; i >= 0; i--) {
    let g = gems[i];
    g.update(player.x, player.y);
    g.display();

    if (dist(player.x, player.y, g.x, g.y) < player.r + g.r) {
      gems.splice(i, 1);
      gainExp(1);
    }
  }

  player.move(joystick.dx, joystick.dy);
  player.display();

  let currentFireRate = max(10, 30 - (stats.fireRate * 2)); 
  if (frameCount - lastShotTime > currentFireRate && cats.length > 0) {
    player.shootNearest(cats);
    lastShotTime = frameCount;
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i];
    b.update();
    b.display();
    if (b.isOffScreen()) bullets.splice(i, 1);
  }

  for (let i = cats.length - 1; i >= 0; i--) {
    let c = cats[i];
    let currentSpeed = c.baseSpeed + (survivalTime / 3600); 
    c.update(player.x, player.y, currentSpeed);
    c.display();

    if (dist(player.x, player.y, c.x, c.y) < player.r + c.r) gameOver = true;

    for (let j = bullets.length - 1; j >= 0; j--) {
      let b = bullets[j];
      if (dist(c.x, c.y, b.x, b.y) < c.r + b.r) {
        c.hp--;
        bullets.splice(j, 1);
        
        if (c.hp <= 0) {
          gems.push(new Gem(c.x, c.y)); 
          cats.splice(i, 1);
          shakeIntensity = 8;
          playSound('death');
        } else {
          playSound('hit');
        }
        break;
      }
    }
  }
  pop(); 

  drawUI();
  joystick.display();
}

function drawGameObjects() {
  for (let g of gems) g.display();
  player.display();
  for (let b of bullets) b.display();
  for (let c of cats) c.display();
}

function gainExp(amount) {
  playerExp += amount;
  if (playerExp >= expToNextLevel) {
    playerLevel++;
    playerExp -= expToNextLevel;
    expToNextLevel = floor(expToNextLevel * 1.5); 
    
    isPaused = true;
    playSound('levelup');
    joystick.released();
  }
}

function drawUpgradeMenu() {
  fill(0, 150);
  rect(0, 0, width, height); 
  
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(36);
  text("LEVEL UP!", width / 2, height / 2 - 150);
  textSize(16);
  text("능력치를 선택하세요", width / 2, height / 2 - 110);

  drawButton(btnBullet, "총알 레벨: " + stats.bulletCount);
  drawButton(btnSpeed, "이동 레벨: " + stats.moveSpeed);
  drawButton(btnFireRate, "연사 레벨: " + stats.fireRate);
}

function drawButton(btn, subtext) {
  fill(255, 200, 50);
  stroke(255);
  strokeWeight(2);
  rect(btn.x, btn.y, btn.w, btn.h, 10);
  
  fill(0);
  noStroke();
  textSize(18);
  text(btn.text, btn.x + btn.w / 2, btn.y + btn.h / 2 - 10);
  textSize(12);
  text(subtext, btn.x + btn.w / 2, btn.y + btn.h / 2 + 15);
}

function updateButtonPositions() {
  btnBullet.x = width / 2 - btnBullet.w / 2;
  btnBullet.y = height / 2 - 60;
  btnSpeed.x = width / 2 - btnSpeed.w / 2;
  btnSpeed.y = height / 2 + 40;
  btnFireRate.x = width / 2 - btnFireRate.w / 2;
  btnFireRate.y = height / 2 + 140;
}

function drawGameOver() {
  fill(0, 150);
  rect(0, 0, width, height);
  fill(255, 0, 0);
  textAlign(CENTER, CENTER);
  textSize(40);
  text("GAME OVER", width / 2, height / 2 - 120);
  
  fill(255);
  textSize(20);
  text("생존 시간: " + floor(survivalTime / 60) + "초", width / 2, height / 2 - 70);
  text("최종 달성 레벨: LV." + playerLevel, width / 2, height / 2 - 40);
  
  fill(200, 200, 255);
  textSize(16);
  text("[ 최종 스탯 리포트 ]", width / 2, height / 2 + 10);
  text("총알 갯수(샷건): LV " + stats.bulletCount, width / 2, height / 2 + 40);
  text("이동 속도(신속): LV " + stats.moveSpeed, width / 2, height / 2 + 70);
  text("발사 속도(연사): LV " + stats.fireRate, width / 2, height / 2 + 100);

  fill(255);
  textSize(18);
  text("화면을 터치하여 재시작", width / 2, height / 2 + 160);
}

function drawUI() {
  fill(50); noStroke(); rect(0, 0, width, 20);
  fill(0, 150, 255);
  let expWidth = map(playerExp, 0, expToNextLevel, 0, width);
  rect(0, 0, expWidth, 20);
  fill(255); textAlign(LEFT, CENTER); textSize(16);
  text("LV." + playerLevel, 10, 40);
  textAlign(CENTER, CENTER);
  text(floor(survivalTime / 60) + "초", width / 2, 40);
}

function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playSound(type) {
  if (!audioCtx) return;
  let t = audioCtx.currentTime;
  let osc = audioCtx.createOscillator();
  let gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);

  if (type === 'shoot') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
    gain.gain.setValueAtTime(0.05, t); gain.gain.linearRampToValueAtTime(0, t + 0.1);
    osc.start(t); osc.stop(t + 0.1);
  } else if (type === 'hit') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.05);
    gain.gain.setValueAtTime(0.05, t); gain.gain.linearRampToValueAtTime(0, t + 0.05);
    osc.start(t); osc.stop(t + 0.05);
  } else if (type === 'death') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(10, t + 0.2);
    gain.gain.setValueAtTime(0.08, t); gain.gain.linearRampToValueAtTime(0, t + 0.2);
    osc.start(t); osc.stop(t + 0.2);
  } else if (type === 'levelup') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523, t); osc.frequency.setValueAtTime(659, t + 0.1); osc.frequency.setValueAtTime(783, t + 0.2);
    gain.gain.setValueAtTime(0.1, t); gain.gain.linearRampToValueAtTime(0, t + 0.4);
    osc.start(t); osc.stop(t + 0.4);
  }
}

function mousePressed() {
  initAudio();
  
  if (gameOver) { 
    resetGame(); 
    return; 
  }
  
  if (isPaused) {
    if (checkButtonClick(btnBullet)) {
      stats.bulletCount++;
      isPaused = false;
    } else if (checkButtonClick(btnSpeed)) {
      stats.moveSpeed++;
      isPaused = false;
    } else if (checkButtonClick(btnFireRate)) {
      stats.fireRate++;
      isPaused = false;
    }
    return; 
  }

  joystick.pressed(mouseX, mouseY);
}

function checkButtonClick(btn) {
  return mouseX >= btn.x && mouseX <= btn.x + btn.w &&
         mouseY >= btn.y && mouseY <= btn.y + btn.h;
}

function mouseDragged() {
  if (!isPaused) joystick.dragged(mouseX, mouseY);
  return false;
}
function mouseReleased() { joystick.released(); }

function resetGame() {
  player = new Player(width / 2, height / 2);
  cats = []; bullets = []; gems = [];
  survivalTime = 0; playerLevel = 1; playerExp = 0; expToNextLevel = 5;
  stats = { bulletCount: 1, moveSpeed: 1, fireRate: 1 };
  shakeIntensity = 0; gameOver = false; isPaused = false; joystick.released();
}

function spawnCat() {
  let r = random(4); let x, y;
  if (r < 1) { x = random(width); y = -50; }
  else if (r < 2) { x = random(width); y = height + 50; }
  else if (r < 3) { x = -50; y = random(height); }
  else { x = width + 50; y = random(height); }
  cats.push(new Cat(x, y));
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  joystick.baseX = 100; joystick.baseY = height - 100;
  updateButtonPositions();
  joystick.released();
}

class Joystick {
  constructor(x, y, radius) {
    this.baseX = x; this.baseY = y; this.radius = radius;
    this.knobX = x; this.knobY = y; this.knobRadius = radius * 0.5;
    this.active = false; this.dx = 0; this.dy = 0;
  }
  pressed(px, py) {
    if (dist(this.baseX, this.baseY, px, py) < this.radius * 2) { 
      this.active = true; this.dragged(px, py);
    }
  }
  dragged(px, py) {
    if (!this.active) return;
    let angle = atan2(py - this.baseY, px - this.baseX);
    let d = dist(this.baseX, this.baseY, px, py);
    if (d > this.radius) {
      this.knobX = this.baseX + cos(angle) * this.radius;
      this.knobY = this.baseY + sin(angle) * this.radius;
      this.dx = cos(angle); this.dy = sin(angle);
    } else {
      this.knobX = px; this.knobY = py;
      this.dx = (px - this.baseX) / this.radius; this.dy = (py - this.baseY) / this.radius;
    }
  }
  released() {
    this.active = false;
    this.knobX = this.baseX; this.knobY = this.baseY;
    this.dx = 0; this.dy = 0;
  }
  display() {
    push();
    fill(255, 255, 255, 100); noStroke();
    ellipse(this.baseX, this.baseY, this.radius * 2);
    fill(255, 255, 255, 200);
    ellipse(this.knobX, this.knobY, this.knobRadius * 2);
    pop();
  }
}

class Gem {
  constructor(x, y) { this.x = x; this.y = y; this.r = 6; }
  update(px, py) {
    if (dist(this.x, this.y, px, py) < 80) {
      let angle = atan2(py - this.y, px - this.x);
      this.x += cos(angle) * 6; this.y += sin(angle) * 6;
    }
  }
  display() {
    push(); translate(this.x, this.y);
    fill(0, 150, 255); noStroke();
    beginShape();
    vertex(0, -this.r); vertex(this.r, 0); vertex(0, this.r); vertex(-this.r, 0);
    endShape(CLOSE); pop();
  }
}

class Player {
  constructor(x, y) { this.x = x; this.y = y; this.r = 20; }
  
  move(dx, dy) {
    let currentSpeed = 4 + (stats.moveSpeed * 0.5); 
    this.x += dx * currentSpeed; 
    this.y += dy * currentSpeed;
    this.x = constrain(this.x, this.r, width - this.r);
    this.y = constrain(this.y, this.r, height - this.r);
  }
  
  shootNearest(catList) {
    let nearestDist = Infinity; let nearestCat = null;
    for (let c of catList) {
      let d = dist(this.x, this.y, c.x, c.y);
      if (d < nearestDist) { nearestDist = d; nearestCat = c; }
    }
    
    if (nearestCat) {
      let baseAngle = atan2(nearestCat.y - this.y, nearestCat.x - this.x);
      let bulletCount = stats.bulletCount; 
      let spreadAngle = radians(15); 

      for (let i = 0; i < bulletCount; i++) {
        let offset = (i - (bulletCount - 1) / 2) * spreadAngle; 
        bullets.push(new Bullet(this.x, this.y, baseAngle + offset));
      }
      
      shakeIntensity = Math.max(shakeIntensity, 3); 
      playSound('shoot'); 
    }
  }
  
  display() {
    push(); translate(this.x, this.y);
    fill(150); stroke(0); strokeWeight(2); ellipse(0, 0, this.r * 2);
    fill(150); ellipse(-15, -15, 15); ellipse(15, -15, 15);
    pop();
  }
}

class Cat {
  constructor(x, y) {
    this.x = x; this.y = y; this.r = 25; this.hp = 2; this.baseSpeed = random(1.5, 2.5);
  }
  update(px, py, currentSpeed) {
    let angle = atan2(py - this.y, px - this.x);
    this.x += cos(angle) * currentSpeed; this.y += sin(angle) * currentSpeed;
  }
  display() {
    push(); translate(this.x, this.y);
    fill(255, 150, 50); stroke(0); strokeWeight(2); ellipse(0, 0, this.r * 2);
    triangle(-20, -10, -10, -25, 0, -20); triangle(20, -10, 10, -25, 0, -20);
    pop();
  }
}

class Bullet {
  constructor(x, y, angle) {
    this.x = x; this.y = y; this.speed = 10;
    this.vx = cos(angle) * this.speed; this.vy = sin(angle) * this.speed; this.r = 5;
  }
  update() { this.x += this.vx; this.y += this.vy; }
  display() {
    push(); fill(255, 255, 0); noStroke(); ellipse(this.x, this.y, this.r * 2); pop();
  }
  isOffScreen() { return (this.x < 0 || this.x > width || this.y < 0 || this.y > height); }
}