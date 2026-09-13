const timeDisplay = document.getElementById('timeDisplay');
const statusIndicator = document.getElementById('statusIndicator');
const ringProgress = document.getElementById('ringProgress');
const lapDelta = document.getElementById('lapDelta');

const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const lapBtn = document.getElementById('lapBtn');
const resetBtn = document.getElementById('resetBtn');
const exportBtn = document.getElementById('exportBtn');
const lapsList = document.getElementById('lapsList');

const totalLapsVal = document.getElementById('totalLapsVal');
const bestLapVal = document.getElementById('bestLapVal');
const worstLapVal = document.getElementById('worstLapVal');
const avgLapVal = document.getElementById('avgLapVal');

let startTime = 0;
let elapsedTime = 0;
let timerInterval = null;
let lapStartTime = 0;
let laps = [];

const ringCircumference = 2 * Math.PI * 155;

function formatTimeComponents(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);

    return {
        h: String(hours).padStart(2, '0'),
        m: String(minutes).padStart(2, '0'),
        s: String(seconds).padStart(2, '0'),
        ms: String(milliseconds).padStart(2, '0'),
        totalMs: ms
    };
}

function formatTimeString(ms) {
    const t = formatTimeComponents(ms);
    return `${t.m}:${t.s}.${t.ms}`;
}

function updateDisplay() {
    elapsedTime = Date.now() - startTime;
    const t = formatTimeComponents(elapsedTime);
    
    timeDisplay.innerHTML = `${t.m}<span class="colon">:</span>${t.s}<small class="ms">.${t.ms}</small>`;
    
    const lapElapsed = elapsedTime - lapStartTime;
    lapDelta.textContent = `Lap ${laps.length + 1} • ${formatTimeString(lapElapsed)}`;

    const currentSecs = (lapElapsed % 60000) / 1000;
    const offset = ringCircumference - (currentSecs / 60) * ringCircumference;
    ringProgress.style.strokeDashoffset = offset;
}

function calculateMetrics() {
    totalLapsVal.textContent = laps.length;
    
    if (laps.length === 0) {
        bestLapVal.textContent = '--:--.--';
        worstLapVal.textContent = '--:--.--';
        avgLapVal.textContent = '--:--.--';
        return;
    }

    const durations = laps.map(l => l.duration);
    const minTime = Math.min(...durations);
    const maxTime = Math.max(...durations);
    const avgTime = durations.reduce((a, b) => a + b, 0) / durations.length;

    bestLapVal.textContent = formatTimeString(minTime);
    worstLapVal.textContent = formatTimeString(maxTime);
    avgLapVal.textContent = formatTimeString(avgTime);

    renderLaps(minTime, maxTime);
}

function renderLaps(minTime, maxTime) {
    lapsList.innerHTML = '';
    
    laps.slice().reverse().forEach(lap => {
        const li = document.createElement('li');
        
        if (laps.length > 1) {
            if (lap.duration === minTime) li.classList.add('fastest');
            if (lap.duration === maxTime) li.classList.add('slowest');
        }

        li.innerHTML = `
            <span>Split ${lap.id}</span>
            <span>+${formatTimeString(lap.duration)}</span>
            <span>${formatTimeString(lap.totalTime)}</span>
        `;
        lapsList.appendChild(li);
    });
}

startBtn.addEventListener('click', () => {
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(updateDisplay, 10);
    
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    lapBtn.disabled = false;
    resetBtn.disabled = false;

    statusIndicator.textContent = 'RUNNING';
    statusIndicator.style.color = 'var(--green)';
    statusIndicator.style.background = 'rgba(16, 185, 129, 0.1)';
});

pauseBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    lapBtn.disabled = true;

    statusIndicator.textContent = 'PAUSED';
    statusIndicator.style.color = 'var(--warning)';
    statusIndicator.style.background = 'rgba(245, 158, 11, 0.1)';
});

resetBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    elapsedTime = 0;
    lapStartTime = 0;
    laps = [];
    
    timeDisplay.innerHTML = `00<span class="colon">:</span>00<small class="ms">.00</small>`;
    lapDelta.textContent = `Lap 1 • --:--.--`;
    ringProgress.style.strokeDashoffset = 0;
    
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    lapBtn.disabled = true;
    resetBtn.disabled = true;

    statusIndicator.textContent = 'READY';
    statusIndicator.style.color = 'var(--accent)';
    statusIndicator.style.background = 'rgba(6, 182, 212, 0.1)';

    calculateMetrics();
});

lapBtn.addEventListener('click', () => {
    const currentLapDuration = elapsedTime - lapStartTime;
    
    laps.push({
        id: laps.length + 1,
        duration: currentLapDuration,
        totalTime: elapsedTime
    });

    lapStartTime = elapsedTime;
    calculateMetrics();
});

exportBtn.addEventListener('click', () => {
    if (laps.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,Lap,Duration,Total Time\n";
    laps.forEach(l => {
        csvContent += `${l.id},${formatTimeString(l.duration)},${formatTimeString(l.totalTime)}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'WatchMe_Lap_Export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});