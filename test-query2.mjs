import { initializeApp } from "firebase/app";
import { getFirestore, collectionGroup, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app);

async function run() {
  try {
    const q = collectionGroup(db, 'agmp_siswa');
    const snap = await getDocs(q);
    console.log("Success, count:", snap.size);
    process.exit(0);
  } catch (e) {
    console.error("Error:", e.message);
    process.exit(1);
  }
}
run();
