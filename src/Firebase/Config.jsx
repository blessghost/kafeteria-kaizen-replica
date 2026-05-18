import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCx7-Ye7_nb4xy0cAHt9j90MGybVI0q2tY",
  authDomain: "kaizenkafe-replica.firebaseapp.com",
  projectId: "kaizenkafe-replica",
  storageBucket: "kaizenkafe-replica.firebasestorage.app",
  messagingSenderId: "510168857124",
  appId: "1:510168857124:web:dff4e06be71880867536b1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };