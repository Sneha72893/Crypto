import { encryptNote, decryptNote } from './crypto.js';
import { saveNotes, loadNotes, generateNoteId } from './storage.js';

// --- State and Config ---
let notesData = loadNotes();
let notesElements = [];
const config = {
    numInitialNotes: 10,
    orbitRadiusMultipler: 1,
    orbitSpeedMultiplier: 1
};
let centerX = window.innerWidth / 2;
let centerY = window.innerHeight / 2;
let selectedNoteObj = null;

// Audio context for sound effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    if (type === 'hover') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initStars();
    initNotes();
    initUI();
    animate();
});

function initStars() {
    const bg = document.getElementById('space-background');
    for (let i = 0; i < 150; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        const size = Math.random() * 2 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 4}s`;
        star.style.animationDuration = `${Math.random() * 3 + 2}s`;
        bg.appendChild(star);
    }
}

function createNoteElement(noteData) {
    const container = document.getElementById('orbit-container');
    const note = document.createElement('div');
    note.classList.add('note', noteData.type);
    
    note.innerHTML = `
        <div class="note-icon">🔒</div>
        <div class="note-type">AES-256</div>
        <div class="note-id">${noteData.id}</div>
    `;
    
    container.appendChild(note);

    const noteObj = {
        el: note,
        data: noteData,
        angle: Math.random() * Math.PI * 2,
        baseRadiusX: 180 + Math.random() * 600,
        baseRadiusY: 100 + Math.random() * 300,
        speed: (Math.random() * 0.003 + 0.001) * (Math.random() > 0.5 ? 1 : -1),
        hovered: false,
        wobbleSpeed: Math.random() * 0.02 + 0.01,
        wobblePhase: Math.random() * Math.PI * 2,
        isPaused: false
    };

    note.addEventListener('mouseenter', () => {
        if (noteObj.isPaused) return;
        noteObj.hovered = true;
        note.style.transform = `translate(-50%, -50%) scale(1.4)`;
        note.style.zIndex = "1000";
        note.style.filter = "brightness(1.5)";
        playSound('hover');
    });
    
    note.addEventListener('mouseleave', () => {
        if (noteObj.isPaused) return;
        noteObj.hovered = false;
        note.style.filter = "";
        note.style.boxShadow = "";
    });

    note.addEventListener('click', () => {
        openDecryptModal(noteObj);
    });

    return noteObj;
}

function initNotes() {
    // If no notes exist, let's create a few dummy ones visually (they won't be decryptable without the password)
    if (notesData.length === 0) {
        // Just for visual effect until user creates real ones
        for (let i = 0; i < config.numInitialNotes; i++) {
            notesData.push({
                id: generateNoteId(),
                type: Math.random() > 0.4 ? 'aes' : 'rsa',
                dummy: true
            });
        }
        // Don't save dummy notes to localStorage
    }

    notesData.forEach(data => {
        notesElements.push(createNoteElement(data));
    });
}

function initUI() {
    const slider = document.getElementById('gravity-slider');
    const gravityValueText = document.getElementById('gravity-value');
    
    slider.addEventListener('input', (e) => {
        const val = e.target.value;
        gravityValueText.textContent = `${val}%`;
        config.orbitRadiusMultipler = 1.8 - (val / 100) * 1.5;
        config.orbitSpeedMultiplier = 1 + (val / 100) * 1.5;
    });
    
    // Trigger initial calculation
    slider.dispatchEvent(new Event('input'));

    window.addEventListener('resize', () => {
        centerX = window.innerWidth / 2;
        centerY = window.innerHeight / 2;
    });

    // Modals
    document.getElementById('btn-create-note').addEventListener('click', () => {
        document.getElementById('modal-overlay').classList.remove('hidden');
        document.getElementById('create-modal').classList.remove('hidden');
        document.getElementById('decrypt-modal').classList.add('hidden');
    });

    document.getElementById('btn-submit-create').addEventListener('click', handleCreateNote);
    document.getElementById('btn-submit-decrypt').addEventListener('click', handleDecryptNote);
    
    // Expose closeModals to window for onclick handlers
    window.closeModals = closeModals;
}

function closeModals() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById('create-modal').classList.add('hidden');
    document.getElementById('decrypt-modal').classList.add('hidden');
    document.getElementById('note-text').value = '';
    document.getElementById('note-password').value = '';
    document.getElementById('decrypt-password').value = '';
    
    if (selectedNoteObj) {
        selectedNoteObj.isPaused = false;
        selectedNoteObj.hovered = false;
        selectedNoteObj.el.style.filter = "";
        selectedNoteObj = null;
    }
}

async function handleCreateNote() {
    const text = document.getElementById('note-text').value;
    const pwd = document.getElementById('note-password').value;
    
    if (!text || !pwd) {
        showToast("Please enter both message and password.", "error");
        return;
    }

    try {
        const encryptedData = await encryptNote(text, pwd);
        const newNoteData = {
            id: generateNoteId(),
            type: 'aes', // We default to AES for actual encrypted notes
            encrypted: encryptedData,
            dummy: false
        };
        
        // Remove dummy notes if they exist, so we only persist real ones
        notesData = notesData.filter(n => !n.dummy);
        notesData.push(newNoteData);
        saveNotes(notesData);
        
        // Add visual element
        notesElements.push(createNoteElement(newNoteData));
        
        showToast("Secure Note Encrypted & Injected into Orbit!", "success");
        playSound('success');
        closeModals();
    } catch (e) {
        showToast("Encryption failed.", "error");
    }
}

function openDecryptModal(noteObj) {
    if (noteObj.data.dummy) {
        showToast("This is a dummy trace note. Create a real note to decrypt.", "error");
        playSound('error');
        return;
    }

    selectedNoteObj = noteObj;
    selectedNoteObj.isPaused = true;
    
    document.getElementById('decrypt-note-id').textContent = noteObj.data.id;
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('decrypt-modal').classList.remove('hidden');
    document.getElementById('create-modal').classList.add('hidden');
    
    document.getElementById('decrypt-input-section').classList.remove('hidden');
    document.getElementById('decrypt-result-section').classList.add('hidden');
    
    // Focus input
    setTimeout(() => document.getElementById('decrypt-password').focus(), 100);
}

async function handleDecryptNote() {
    const pwd = document.getElementById('decrypt-password').value;
    if (!pwd) return;

    try {
        const decryptedText = await decryptNote(selectedNoteObj.data.encrypted, pwd);
        playSound('success');
        showToast("Decryption Successful", "success");
        
        document.getElementById('decrypt-input-section').classList.add('hidden');
        document.getElementById('decrypt-result-section').classList.remove('hidden');
        
        startMatrixAnimation(document.getElementById('matrix-text'), decryptedText);
    } catch (e) {
        playSound('error');
        showToast("Decryption Failed: Invalid Password", "error");
    }
}

function startMatrixAnimation(element, finalString) {
    element.textContent = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()';
    let iterations = 0;
    
    const interval = setInterval(() => {
        element.textContent = finalString.split('')
            .map((letter, index) => {
                if (index < iterations) {
                    return finalString[index];
                }
                return chars[Math.floor(Math.random() * chars.length)];
            })
            .join('');
        
        if (iterations >= finalString.length) {
            clearInterval(interval);
        }
        
        iterations += 1/3;
    }, 30);
}

function showToast(msg, type) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    
    setTimeout(() => {
        if(toast.parentNode) container.removeChild(toast);
    }, 3500);
}

// Animation loop
function animate() {
    notesElements.forEach(noteObj => {
        if (!noteObj.hovered && !noteObj.isPaused) {
            noteObj.angle += noteObj.speed * config.orbitSpeedMultiplier;
            noteObj.wobblePhase += noteObj.wobbleSpeed;
            
            const targetRadiusX = noteObj.baseRadiusX * config.orbitRadiusMultipler;
            const targetRadiusY = noteObj.baseRadiusY * config.orbitRadiusMultipler;
            
            const wobble = Math.sin(noteObj.wobblePhase) * 20;

            const x = centerX + Math.cos(noteObj.angle) * targetRadiusX;
            const y = centerY + Math.sin(noteObj.angle) * targetRadiusY + wobble;
            
            const depth = Math.sin(noteObj.angle); 
            const depthScale = 0.5 + ((depth + 1) / 2) * 0.7; 
            const opacity = 0.3 + ((depth + 1) / 2) * 0.7; 
            
            noteObj.el.style.left = `${x}px`;
            noteObj.el.style.top = `${y}px`;
            noteObj.el.style.transform = `translate(-50%, -50%) scale(${depthScale})`;
            noteObj.el.style.opacity = opacity;
            noteObj.el.style.zIndex = Math.floor(100 + depth * 50);
        }
    });

    requestAnimationFrame(animate);
}
