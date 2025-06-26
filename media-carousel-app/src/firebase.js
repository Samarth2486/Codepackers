// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyArMB-sdtZbcCIR5Zr__ekpKJ2I7V0D0Zg",
  authDomain: "visform-3.firebaseapp.com",
  projectId: "visform-3",
  storageBucket: "visform-3.appspot.com",
  messagingSenderId: "980009573561",
  appId: "1:980009573561:web:e98fbcd9077a8018eacf68"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
