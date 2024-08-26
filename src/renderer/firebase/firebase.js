import { initializeApp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js"
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-firestore.js"

const firebaseConfig = {
  apiKey: "AIzaSyDf_0M9KgJttAJogVDqHdv7E7y8psKgZyE",
  authDomain: "tiktokliveapp-bced3.firebaseapp.com",
  projectId: "tiktokliveapp-bced3",
  storageBucket: "tiktokliveapp-bced3",
  messagingSenderId: "860491897747",
  appId: "1:860491897747:web:928b1824fb8f936dade666",
  measurementId: "G-VE9VWQWWX1"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app)
export const db = getFirestore(app)
