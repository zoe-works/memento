// App Configuration & State
const state = {
    settings: {
        birthdate: null,
        gender: 'male',
        customTarget: 100,
        displayUnit: 'days' // seconds, minutes, hours, days
    },
    currentMode: 0, // 0 = lifespan, 1 = custom
    isSetupComplete: false,
    
    // Lifespan averages (in years)
    avgLifespan: {
        male: 81.47,
        female: 87.57
    },
    
    animationFrameId: null
};

// DOM Elements
const elements = {
    setupOverlay: document.getElementById('setup-overlay'),
    setupForm: document.getElementById('setup-form'),
    swipeContainer: document.getElementById('swipe-container'),
    settingsBtn: document.getElementById('settings-btn'),
    
    // Lifespan Mode Elements
    lifespan: {
        number: document.getElementById('lifespan-number'),
        unit: document.getElementById('lifespan-unit-label'),
        ring: document.getElementById('lifespan-ring')
    },
    
    // Custom Mode Elements
    custom: {
        number: document.getElementById('custom-number'),
        unit: document.getElementById('custom-unit-label'),
        ring: document.getElementById('custom-ring')
    },
    
    // Controls
    unitBtns: document.querySelectorAll('.unit-btn'),
    dots: document.querySelectorAll('.dot')
};

// Initialize App
function init() {
    loadSettings();
    
    if (!state.isSetupComplete) {
        showSetup();
    } else {
        startApp();
    }
    
    setupEventListeners();
}

function loadSettings() {
    const savedSettings = localStorage.getItem('mementoSettings');
    if (savedSettings) {
        state.settings = JSON.parse(savedSettings);
        state.isSetupComplete = true;
        
        // Restore unit button state
        elements.unitBtns.forEach(btn => {
            if (btn.dataset.unit === state.settings.displayUnit) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
}

function saveSettings() {
    localStorage.setItem('mementoSettings', JSON.stringify(state.settings));
}

function showSetup() {
    elements.setupOverlay.classList.remove('hidden');
    
    // Populate form if data exists
    if (state.settings.birthdate) {
        document.getElementById('birthdate').value = state.settings.birthdate;
        document.getElementById('gender').value = state.settings.gender;
        document.getElementById('custom-target').value = state.settings.customTarget;
    }
}

function hideSetup() {
    elements.setupOverlay.classList.add('hidden');
}

function startApp() {
    hideSetup();
    updateUI(); // Set correct units immediately
    if (state.animationFrameId) {
        cancelAnimationFrame(state.animationFrameId);
    }
    tick();
}

// Event Listeners
function setupEventListeners() {
    // Setup Form
    elements.setupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        state.settings.birthdate = document.getElementById('birthdate').value;
        state.settings.gender = document.getElementById('gender').value;
        state.settings.customTarget = parseInt(document.getElementById('custom-target').value) || 100;
        state.isSetupComplete = true;
        
        saveSettings();
        startApp();
    });
    
    // Settings Button
    elements.settingsBtn.addEventListener('click', () => {
        showSetup();
    });
    
    // Unit Switcher
    elements.unitBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            elements.unitBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            state.settings.displayUnit = e.target.dataset.unit;
            saveSettings();
            updateUI(); // Update labels immediately
        });
    });
    
    setupSwipe();
}

// Swipe Logic
function setupSwipe() {
    let startX = 0;
    let currentTranslate = 0;
    let isDragging = false;
    
    const container = elements.swipeContainer;
    
    function startDrag(e) {
        if (e.target.closest('.unit-switcher') || e.target.closest('.icon-btn')) return;
        
        isDragging = true;
        startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        container.style.transition = 'none'; // Remove transition during drag
    }
    
    function doDrag(e) {
        if (!isDragging) return;
        
        const currentPosition = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        const diff = currentPosition - startX;
        
        // Add resistance at edges
        if ((state.currentMode === 0 && diff > 0) || (state.currentMode === 1 && diff < 0)) {
            currentTranslate = (state.currentMode * -100) + (diff / window.innerWidth) * 20; // 20% resistance
        } else {
            currentTranslate = (state.currentMode * -100) + (diff / window.innerWidth) * 100;
        }
        
        container.style.transform = `translateX(${currentTranslate}vw)`;
    }
    
    function endDrag(e) {
        if (!isDragging) return;
        isDragging = false;
        
        const movedBy = currentTranslate - (state.currentMode * -100);
        
        container.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
        
        if (movedBy < -20 && state.currentMode === 0) {
            state.currentMode = 1;
        } else if (movedBy > 20 && state.currentMode === 1) {
            state.currentMode = 0;
        }
        
        updatePagePosition();
    }
    
    // Touch Events
    container.addEventListener('touchstart', startDrag, {passive: true});
    container.addEventListener('touchmove', doDrag, {passive: true});
    window.addEventListener('touchend', endDrag);
    
    // Mouse Events (for desktop testing)
    container.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', doDrag);
    window.addEventListener('mouseup', endDrag);
}

function updatePagePosition() {
    elements.swipeContainer.style.transform = `translateX(${state.currentMode * -100}vw)`;
    
    // Update dots
    elements.dots.forEach((dot, index) => {
        if (index === state.currentMode) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

// Countdown Logic
function updateUI() {
    elements.lifespan.unit.textContent = state.settings.displayUnit;
    elements.custom.unit.textContent = state.settings.displayUnit;
}

function formatNumber(num) {
    return num.toLocaleString('en-US');
}

function calculateRemaining(birthDateMs, targetYears) {
    const now = Date.now();
    const targetDate = new Date(birthDateMs);
    targetDate.setFullYear(targetDate.getFullYear() + targetYears);
    const targetMs = targetDate.getTime();
    
    const remainingMs = Math.max(0, targetMs - now);
    const totalMs = targetMs - birthDateMs;
    const progress = Math.min(1, Math.max(0, 1 - (remainingMs / totalMs)));
    
    return { remainingMs, progress };
}

function convertMsToUnit(ms, unit) {
    switch (unit) {
        case 'seconds':
            return Math.floor(ms / 1000);
        case 'minutes':
            return (ms / (1000 * 60)).toFixed(2);
        case 'hours':
            return (ms / (1000 * 60 * 60)).toFixed(4);
        case 'days':
            return (ms / (1000 * 60 * 60 * 24)).toFixed(2);
        default:
            return 0;
    }
}

function setRingProgress(ringEl, progress) {
    const circumference = 283; // 2 * PI * 45
    const offset = circumference - (progress * circumference);
    ringEl.style.strokeDashoffset = offset;
}

function tick() {
    if (!state.isSetupComplete || !state.settings.birthdate) return;
    
    const birthDateMs = new Date(state.settings.birthdate).getTime();
    
    // 1. Lifespan Mode
    const avgYears = state.avgLifespan[state.settings.gender] || 80;
    const lifespanData = calculateRemaining(birthDateMs, avgYears);
    
    // Update baseline age label
    const baseAgeEl = document.getElementById('lifespan-base-age');
    if (baseAgeEl) {
        baseAgeEl.textContent = `(${avgYears} years)`;
    }

    elements.lifespan.number.textContent = formatNumber(convertMsToUnit(lifespanData.remainingMs, state.settings.displayUnit));
    setRingProgress(elements.lifespan.ring, lifespanData.progress);
    
    // 2. Custom Mode
    const customData = calculateRemaining(birthDateMs, state.settings.customTarget);
    
    // Update custom age label
    const customBaseAgeEl = document.getElementById('custom-base-age');
    if (customBaseAgeEl) {
        customBaseAgeEl.textContent = `(${state.settings.customTarget} years)`;
    }

    elements.custom.number.textContent = formatNumber(convertMsToUnit(customData.remainingMs, state.settings.displayUnit));
    setRingProgress(elements.custom.ring, customData.progress);
    
    // Schedule next frame
    state.animationFrameId = requestAnimationFrame(tick);
}

// Start app
document.addEventListener('DOMContentLoaded', init);
