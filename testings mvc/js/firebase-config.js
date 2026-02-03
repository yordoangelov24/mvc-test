import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAlegu3OzRrtBgugj0pk0K2GLYkRLIKogc",
  authDomain: "recepti-5caeb.firebaseapp.com",
  databaseURL: "https://recepti-5caeb-default-rtdb.firebaseio.com",
  projectId: "recepti-5caeb",
  storageBucket: "recepti-5caeb.firebasestorage.app",
  messagingSenderId: "1003802666782",
  appId: "1:1003802666782:web:357ecaaf3f280f6f130b0f",
  measurementId: "G-S2XPTGRDM4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Експортваме ги, за да може app.js да го ползва
export { app, db, auth };