import { initializeApp } from "firebase/app";
import { getFirestore, collectionGroup, query, where, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app);

async function run() {
  try {
    const q = query(collectionGroup(db, 'agmp_siswa'), where('nisn', '==', '3134537508'));
    await getDocs(q);
    console.log("Success");
  } catch (e) {
    console.error("Error:", e.message);
  }
}
run();
