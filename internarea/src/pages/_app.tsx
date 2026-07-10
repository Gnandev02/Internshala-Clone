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
            
            // Sync with backend to get MongoDB _id and updated data
            const res = await api.post("/api/user/sync", {
              firebaseUid: authuser.uid,
              name: name,
              email: authuser.email,
              photo: photo,
            });
            
            console.log("User synced successfully:", res.data);
            dispatch(login(res.data));
          } catch (error) {
            console.error("Error syncing user:", error);
            // Fallback to Firebase data if API fails
            dispatch(
              login({
                uid: authuser.uid,
                photo: authuser.photoURL,
                name: authuser.displayName || authuser.email?.split('@')[0] || "User",
                email: authuser.email,
                phoneNumber: authuser.phoneNumber,
              })
            );
          }
        } else {
          dispatch(logout());
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
