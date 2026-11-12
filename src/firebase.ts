import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyAldb19fU_3fUYKrI4Aetti-YXs2zHXrqA",
  authDomain: "qlhocphan-8ddd4.firebaseapp.com",
  projectId: "qlhocphan-8ddd4",
  storageBucket: "qlhocphan-8ddd4.firebasestorage.app",
  messagingSenderId: "577198092785",
  appId: "1:577198092785:web:8b1de25219790f13221450",
  measurementId: "G-D5QMZHNNXT",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);