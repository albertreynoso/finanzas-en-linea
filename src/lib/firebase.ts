// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCAC8TPhzIwWGWkm0hEvJ3u7EImb0yVT9U",
  authDomain: "finanzas-app-f9ba1.firebaseapp.com",
  databaseURL: "https://finanzas-app-f9ba1-default-rtdb.firebaseio.com",
  projectId: "finanzas-app-f9ba1",
  storageBucket: "finanzas-app-f9ba1.firebasestorage.app",
  messagingSenderId: "507362408289",
  appId: "1:507362408289:web:c007fc40d70e974916b720"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;