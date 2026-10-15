import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";


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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default db;
