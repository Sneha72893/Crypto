// storage.js
// Handles local storage persistence

const STORAGE_KEY = 'secure_notes';

export function saveNotes(notes) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function loadNotes() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

export function generateNoteId() {
    return '0x' + Math.random().toString(16).substring(2, 8).toUpperCase();
}
