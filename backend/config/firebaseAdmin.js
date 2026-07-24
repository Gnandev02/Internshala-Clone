const adminModule = require("firebase-admin");

// Handle both CommonJS and ESM module exports across different Node versions
const admin = adminModule.default || adminModule;

try {
  const apps = admin.apps || (admin.default && admin.default.apps) || [];
  if (!apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string'
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : process.env.FIREBASE_SERVICE_ACCOUNT;
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || "internshala-clone-b55c5"
      });
    }
  }
} catch (err) {
  console.error("Firebase Admin initialization note:", err.message);
}

module.exports = admin;
