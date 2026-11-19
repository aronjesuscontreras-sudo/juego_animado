const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMsg = document.getElementById('overlay-msg');
const startBtn = document.getElementById('start-btn');

let gameRunning = false;
let score = 0;
let lives = 3;
let frameCount = 0;

// Estrellas de fondo animadas (efecto parallax)
const stars = Array.from({ length: 60 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 0.5,
    speed: Math.random() * 2 + 0.5
}));

// Jugador
const player = {
    x: 90,
    y: canvas.height / 2,
    radius: 18,
    targetY: canvas.height / 2,
    trail: []
};

let orbs = [];
let enemies = [];
let particles = [];

// Controles con teclado y mouse
window.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    if (e.key === 'ArrowUp' || e.key === 'w') player.targetY -= 45;
    if (e.key === 'ArrowDown' || e.key === 's') player.targetY += 45;
    clampPlayer();
});

canvas.addEventListener('mousemove', (e) => {
    if (!gameRunning) return;
    const rect = canvas.getBoundingClientRect();
    const scaleY = canvas.height / rect.height;
    player.targetY = (e.clientY - rect.top) * scaleY;
    clampPlayer();
});

function clampPlayer() {
    if (player.targetY < 30) player.targetY = 30;
    if (player.targetY > canvas.height - 30) player.targetY = canvas.height - 30;
}

// Crear partículas de explosión/recolección
function createParticles(x, y, color, count = 15) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 7,
            vy: (Math.random() - 0.5) * 7,
            radius: Math.random() * 4 + 1.5,
            alpha: 1,
            color
        });
    }
}

function resetGame() {
    score = 0;
    lives = 3;
    frameCount = 0;
    orbs = [];
    enemies = [];
    particles = [];
    player.y = canvas.height / 2;
    player.targetY = canvas.height / 2;
    player.trail = [];
    scoreEl.textContent = score;
    livesEl.textContent = lives;
    gameRunning = true;
    overlay.classList.add('hidden');
    animate();
}

function gameOver() {
    gameRunning = false;
    overlayTitle.textContent = '¡FIN DEL JUEGO!';
    overlayMsg.innerHTML = `Puntuación final: <strong>${score} puntos</strong><br>¿Quieres intentarlo de nuevo?`;
    startBtn.textContent = 'VOLVER A JUGAR';
    overlay.classList.remove('hidden');
}

function update() {
    frameCount++;

    // Movimiento suave del jugador (interpolación)
    player.y += (player.targetY - player.y) * 0.15;

    // Estela de energía del jugador
    player.trail.push({ x: player.x, y: player.y, alpha: 0.7 });
    if (player.trail.length > 14) player.trail.shift();

    // Mover estrellas de fondo
    stars.forEach(s => {
        s.x -= s.speed;
        if (s.x < 0) {
            s.x = canvas.width;
            s.y = Math.random() * canvas.height;
        }
    });

    // Generar esferas doradas
    if (frameCount % 55 === 0) {
        orbs.push({
            x: canvas.width + 20,
            y: Math.random() * (canvas.height - 80) + 40,
            radius: 13,
            speed: 4.5 + score * 0.03,
            pulse: 0
        });
    }

    // Generar meteoritos enemigos
    if (frameCount % 45 === 0) {
        enemies.push({
            x: canvas.width + 25,
            y: Math.random() * (canvas.height - 80) + 40,
            radius: Math.random() * 8 + 16,
            speed: 5.5 + score * 0.04,
            angle: 0
        });
    }

    // Actualizar esferas
    for (let i = orbs.length - 1; i >= 0; i--) {
        const o = orbs[i];
        o.x -= o.speed;
        o.pulse += 0.1;

        const dist = Math.hypot(player.x - o.x, player.y - o.y);
        if (dist < player.radius + o.radius) {
            score += 10;
            scoreEl.textContent = score;
            createParticles(o.x, o.y, '#fbbf24', 18);
            orbs.splice(i, 1);
            continue;
        }
        if (o.x < -30) orbs.splice(i, 1);
    }

    // Actualizar enemigos
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.x -= e.speed;
        e.angle += 0.06;

        const dist = Math.hypot(player.x - e.x, player.y - e.y);
        if (dist < player.radius + e.radius - 4) {
            lives--;
            livesEl.textContent = lives;
            createParticles(player.x, player.y, '#ef4444', 25);
            enemies.splice(i, 1);
            if (lives <= 0) {
                gameOver();
                return;
            }
            continue;
        }
        if (e.x < -40) enemies.splice(i, 1);
    }

    // Actualizar partículas
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.03;
        if (p.alpha <= 0) particles.splice(i, 1);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Dibujar estrellas
    ctx.fillStyle = '#ffffff';
    stars.forEach(s => {
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    // 2. Dibujar estela del jugador
    player.trail.forEach((t, idx) => {
        const ratio = idx / player.trail.length;
        ctx.fillStyle = `rgba(56, 189, 248, ${ratio * 0.45})`;
        ctx.beginPath();
        ctx.arc(t.x - (14 - idx) * 2.5, t.y, player.radius * ratio, 0, Math.PI * 2);
        ctx.fill();
    });

    // 3. Dibujar jugador (nave/núcleo brillante)
    ctx.save();
    ctx.shadowBlur = 18;
    ctx.shadowColor = '#38bdf8';
    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.arc(player.x + 4, player.y, player.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4. Dibujar esferas doradas pulsantes
    orbs.forEach(o => {
        const glowRadius = o.radius + Math.sin(o.pulse) * 3;
        ctx.save();
        ctx.shadowBlur = 16;
        ctx.shadowColor = '#f59e0b';
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(o.x, o.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Estrella interior decorativa
        ctx.fillStyle = '#fef3c7';
        ctx.beginPath();
        ctx.arc(o.x - 3, o.y - 3, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    // 5. Dibujar meteoritos enemigos rotando
    enemies.forEach(e => {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.angle);
        ctx.shadowBlur = 14;
        ctx.shadowColor = '#ef4444';
        ctx.fillStyle = '#dc2626';

        ctx.beginPath();
        const sides = 7;
        for (let i = 0; i < sides; i++) {
            const theta = (i / sides) * Math.PI * 2;
            const r = i % 2 === 0 ? e.radius : e.radius * 0.78;
            const px = Math.cos(theta) * r;
            const py = Math.sin(theta) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    });

    // 6. Dibujar partículas
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

function animate() {
    if (!gameRunning) return;
    update();
    draw();
    requestAnimationFrame(animate);
}

startBtn.addEventListener('click', resetGame);