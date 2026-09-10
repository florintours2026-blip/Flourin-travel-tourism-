import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig = {

    apiKey: "AIzaSyDN8E8R9GdvQCFxkvYJRNCAwZlDGKd5icg",

    authDomain: "florin-travel.firebaseapp.com",

    projectId: "florin-travel",

    storageBucket: "florin-travel.firebasestorage.app",

    messagingSenderId: "105528948337",

    appId: "1:105528948337:web:563b8e7bea6468af6e0dd0",

    measurementId: "G-6DVY7BXYDW"

};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

export { app, auth, db };
