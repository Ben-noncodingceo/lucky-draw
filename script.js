// 常量定义
const COLORS = [
    '#FECACA', // Red 200
    '#FDE68A', // Amber 200
    '#A7F3D0', // Emerald 200
    '#BFDBFE', // Blue 200
    '#DDD6FE', // Violet 200
    '#FBCFE8', // Pink 200
    '#C7D2FE', // Indigo 200
    '#99F6E4', // Teal 200
    '#FED7AA', // Orange 200
    '#E9D5FF'  // Purple 200
];
const MIN_SPINS = 5; // 最小旋转圈数
const SPIN_DURATION = 4000; // 旋转时间 (ms) matches CSS

// 状态管理
let state = {
    prizes: ['奖品1', '奖品2', '奖品3', '奖品4', '奖品5'],
    winRate: 50,
    isSpinning: false,
    currentRotation: 0
};

// DOM 元素
const els = {
    prizeInput: document.getElementById('prizeInput'),
    rateInput: document.getElementById('rateInput'),
    rateError: document.getElementById('rateError'),
    turntable: document.getElementById('turntable'),
    startBtn: document.getElementById('startBtn'),
    resetBtn: document.getElementById('resetBtn'),
    resultText: document.getElementById('resultText')
};

// 初始化
function init() {
    // 绑定事件
    els.prizeInput.addEventListener('input', handlePrizeInput);
    els.rateInput.addEventListener('input', handleRateInput);
    els.startBtn.addEventListener('click', startLottery);
    els.resetBtn.addEventListener('click', resetConfig);

    // 初始渲染
    renderInputs();
    renderTurntable();
}

// 渲染输入框内容
function renderInputs() {
    els.prizeInput.value = state.prizes.join('\n');
    els.rateInput.value = state.winRate;
}

// 渲染转盘
function renderTurntable() {
    const count = state.prizes.length;
    if (count === 0) return;

    const anglePerSector = 360 / count;
    
    // 1. 生成 Conic Gradient 背景
    let gradientParts = [];
    for (let i = 0; i < count; i++) {
        const color = COLORS[i % COLORS.length];
        const start = i * anglePerSector;
        const end = (i + 1) * anglePerSector;
        gradientParts.push(`${color} ${start}deg ${end}deg`);
    }
    els.turntable.style.background = `conic-gradient(${gradientParts.join(', ')})`;

    // 2. 生成文字标签
    els.turntable.innerHTML = ''; // 清空旧标签
    state.prizes.forEach((prize, i) => {
        const label = document.createElement('div');
        label.className = 'turntable-label';
        
        // 计算旋转角度：扇区中心线
        // 扇区起始角度: i * anglePerSector
        // 扇区中心: (i + 0.5) * anglePerSector
        // 加上 -90度 修正，因为 CSS 0度在3点钟方向，而我们的conic-gradient 0度在12点钟
        // 等等，CSS rotate 0deg 默认也是从元素正上方开始吗？
        // 标准 CSS 坐标系：0deg 是正上方 (12点) 如果用 transform-origin: center.
        // 但是对于 absolute positioning + rotation，通常 0deg 是指原本的方向。
        // 我们在 CSS 中定义了 turntable-label: top: 50%, left: 50%, transform-origin: 0 0 (左上角? No, we need center).
        // 在 CSS 中: transform-origin: 0 0 (Left Top of the label div).
        // label div width is 50% (radius).
        // If we rotate it, it pivots around the center of the wheel.
        // We want the label to point outwards from the center.
        // Conic gradient 0deg is at 12 o'clock.
        // Sector 0 center is at `anglePerSector / 2`.
        // So we need to rotate the label by `anglePerSector / 2 - 90`?
        // Let's assume label is a horizontal line starting from center to right. (Standard 0deg).
        // We want it to point to 12 o'clock + offset.
        // So rotate -90 (to 12 o'clock) + offset.
        
        const rotation = (i + 0.5) * anglePerSector - 90;
        
        label.style.transform = `rotate(${rotation}deg)`;
        
        const text = document.createElement('span');
        text.className = 'turntable-text';
        text.textContent = prize;
        
        label.appendChild(text);
        els.turntable.appendChild(label);
    });
}

// 处理奖品输入
function handlePrizeInput(e) {
    const text = e.target.value;
    // Split by newline and filter empty strings
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Update state even if empty (to show validation error on button click or render empty)
    // But PRD says: "If prize count is 0, restore default 5 partitions" in 2.1.1?
    // "When user inputs... if count is 0, restore default".
    // Wait, "If input is empty, prompt 'Please input at least one prize'".
    // Let's implement: If lines.length > 0, use lines. If 0, keep empty in state but maybe render defaults visually?
    // PRD 2.1.1: "If prize quantity is 0, restore default 5 partitions".
    // PRD 2.2.1: "Input empty -> prompt".
    
    if (lines.length > 0) {
        state.prizes = lines;
        // Check max 10
        if (state.prizes.length > 10) {
             // Optional: warn or truncate. PRD says "Suggest max 10". 
             // We'll just render all but it might look crowded.
        }
        els.startBtn.disabled = false;
        renderTurntable();
    } else {
        // If empty, show defaults in turntable? Or clear?
        // PRD 2.1.1: "restore default 5 partitions".
        // But input box is empty.
        state.prizes = []; // Empty
        // Render defaults for visual
        const defaultPrizes = ['奖品1', '奖品2', '奖品3', '奖品4', '奖品5'];
        // Temporarily render defaults but keep state empty for validation
        // Wait, renderTurntable reads from state.prizes.
        // I will make a temporary render logic.
        renderTurntableWithData(defaultPrizes);
        // Disable button
        els.startBtn.disabled = true;
    }
}

function renderTurntableWithData(prizes) {
    const original = state.prizes;
    state.prizes = prizes;
    renderTurntable();
    state.prizes = original;
}

// 处理概率输入
function handleRateInput(e) {
    const val = parseFloat(e.target.value);
    
    if (isNaN(val) || val < 0 || val > 100) {
        els.rateError.classList.add('show');
        els.startBtn.disabled = true;
    } else {
        els.rateError.classList.remove('show');
        state.winRate = val;
        // Check if prizes are valid too
        if (state.prizes.length > 0) {
            els.startBtn.disabled = false;
        }
    }
}

// 开始抽奖
function startLottery() {
    if (state.isSpinning) return;
    
    // Final Validation
    if (state.prizes.length === 0) {
        alert('请至少输入一个奖品名称');
        return;
    }
    
    // 1. Logic
    // 使用 Math.random() * 100 获取 0-100 之间的浮点数，与 winRate 比较
    const r = Math.random() * 100;
    const isWin = r <= state.winRate;
    
    // Determine Target Sector Index
    // If win: random index from prizes
    // If lose: random index from prizes (as per PRD 2.1.5: points to arbitrary partition)
    const targetIndex = Math.floor(Math.random() * state.prizes.length);
    const prizeName = state.prizes[targetIndex];
    
    // 2. Animation Math
    // Sector i center is at: (i + 0.5) * anglePerSector
    // We need to rotate the wheel so that this center aligns with Top (0deg or 360deg).
    // TargetRotation = 360 - CenterAngle.
    // We add extra spins for effect.
    
    const count = state.prizes.length;
    const anglePerSector = 360 / count;
    const centerAngle = (targetIndex + 0.5) * anglePerSector;
    
    // Calculate rotation to land on top
    // Current rotation state
    const currentMod = state.currentRotation % 360;
    
    // We want final position `F` such that `(F + centerAngle) % 360 === 0`.
    // So `F % 360 = 360 - centerAngle`.
    let targetMod = 360 - centerAngle;
    
    // Calculate distance to travel
    // We want to go forward.
    let distance = targetMod - currentMod;
    if (distance <= 0) {
        distance += 360;
    }
    
    // Add min spins
    distance += MIN_SPINS * 360;
    
    // Update state
    state.isSpinning = true;
    state.currentRotation += distance;
    
    // Apply style
    els.turntable.style.transform = `rotate(${state.currentRotation}deg)`;
    els.startBtn.disabled = true;
    els.resultText.textContent = '抽奖中...';
    els.resultText.className = '';
    
    // 3. Wait for animation
    setTimeout(() => {
        state.isSpinning = false;
        els.startBtn.disabled = false;
        
        if (isWin) {
            els.resultText.textContent = `恭喜您获得：${prizeName}`;
            els.resultText.className = 'result-win';
        } else {
            els.resultText.textContent = '很遗憾，未中奖';
            els.resultText.className = 'result-lose';
        }
    }, SPIN_DURATION);
}

// 重置配置
function resetConfig() {
    if (state.isSpinning) return;
    
    state.prizes = ['奖品1', '奖品2', '奖品3', '奖品4', '奖品5'];
    state.winRate = 50;
    
    renderInputs();
    renderTurntable();
    
    els.resultText.textContent = '';
    els.resultText.className = '';
    els.rateError.classList.remove('show');
    els.startBtn.disabled = false;
    
    // Optional: Reset rotation? 
    // Usually better not to reset rotation abruptly to 0 to avoid "rewind".
    // Just keep currentRotation as is.
}

// Run
init();
