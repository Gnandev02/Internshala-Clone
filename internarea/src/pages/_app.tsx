import Footer from "@/Components/Fotter";
import Navbar from "@/Components/Navbar";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { store } from "../store/store";
import { Provider, useDispatch } from "react-redux";
import { useEffect } from "react";
import { auth } from "@/firebase/firebase";
import { login, logout } from "@/Feature/Userslice";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from "../utils/api";

export default function App({ Component, pageProps }: AppProps) {
  function AuthListener() {
    const dispatch = useDispatch();
    useEffect(() => {
      // 1. Restore local MongoDB user session if stored in localStorage
      const localUserStr = localStorage.getItem("user");
      if (localUserStr) {
        try {
          const localUser = JSON.parse(localUserStr);
          dispatch(login(localUser));
        } catch (e) {
          console.error("Failed to parse local user session:", e);
        }
      }

      // 2. Listen to Firebase auth, but do not logout MongoDB user if authenticated locally
      const unsubscribe = auth.onAuthStateChanged(async (authuser) => {
        if (authuser) {
          try {
            if (sessionStorage.getItem("isRegistering")) {
              console.log("Skipping sync during registration...");
              return;
            }

            console.log("Firebase auth state changed, syncing user...");
            const name = authuser.displayName || authuser.email?.split('@')[0] || "User";
            const photo = authuser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${name}`;
            
            const res = await api.post("/api/user/sync", {
              firebaseUid: authuser.uid,
              name: name,
              email: authuser.email,
              photo: photo,
            });
            
            localStorage.setItem("user", JSON.stringify(res.data));
            dispatch(login(res.data));
          } catch (error) {
            console.error("Error syncing user:", error);
          }
        } else {
          // Only dispatch logout if localStorage has no active user session
          if (!localStorage.getItem("user")) {
            dispatch(logout());
          }
        }
      });
      return () => unsubscribe();
    }, [dispatch]);
    return null;
  }

  return (
    <Provider store={store}>
      <AuthListener />
      <div className="bg-white">
        <ToastContainer/>
        <Navbar />
        <Component {...pageProps} />
        <Footer />
      </div>
    </Provider>
  );
}
