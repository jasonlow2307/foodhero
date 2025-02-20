// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC3jyYM3o7MJ8N0-sfvY3vcJz9wrLDj9eU",
  authDomain: "foodhero-47be8.firebaseapp.com",
  projectId: "foodhero-47be8",
  storageBucket: "foodhero-47be8.firebasestorage.app",
  messagingSenderId: "291964340197",
  appId: "1:291964340197:web:193903b4db48e07077510c",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export { db };
