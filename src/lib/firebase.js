import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAwVsZ10ZCofVxPPl1M04tEGVlvryXsCSk",
  authDomain: "esp32saeed-3e1fa.firebaseapp.com",
  projectId: "esp32saeed-3e1fa",
  storageBucket: "esp32saeed-3e1fa.appspot.com",
  messagingSenderId: "557873247282",
  appId: "1:557873247282:web:fbbebeb3e221f8dfbf782b",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
