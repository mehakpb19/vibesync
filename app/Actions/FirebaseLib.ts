// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCpNFINs9TPi8qltyHvsFf83Kxv0CTxA0s",
  authDomain: "vibesync-61bae.firebaseapp.com",
  databaseURL:
    "https://vibesync-61bae-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "vibesync-61bae",
  storageBucket: "vibesync-61bae.firebasestorage.app",
  messagingSenderId: "649122653081",
  appId: "1:649122653081:web:5587dab1eaa537236c6908",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default db;
