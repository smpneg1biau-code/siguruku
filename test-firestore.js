const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('./serviceAccountKey.json'); // Wait, we don't have serviceAccountKey.
// We can use the firestore rules to read as a client via a simple test page? No, we can use the cloudsql-execute-sql if we were using postgres. But we're using Firebase!
