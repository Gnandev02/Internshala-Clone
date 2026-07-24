// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBO-Ugc8KOXN3fjwy3aqwQtOgSqxRARlys",
  authDomain: "internshala-clone-b55c5.firebaseapp.com",
  projectId: "internshala-clone-b55c5",
  storageBucket: "internshala-clone-b55c5.firebasestorage.app",
  messagingSenderId: "585926719131",
  appId: "1:585926719131:web:52f5f4e973d7a81d38383e",
  measurementId: "G-QNHF2FHK48"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };

