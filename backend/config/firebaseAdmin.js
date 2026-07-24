const adminModule = require("firebase-admin");

// Handle both CommonJS and ESM module exports across different Node versions
const admin = adminModule.default || adminModule;

try {
  const apps = admin.apps || (admin.default && admin.default.apps) || [];
  if (!apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      let serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string'
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : process.env.FIREBASE_SERVICE_ACCOUNT;

      // Fix unescaped newlines in private key if passed as string environment variable
      if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("✓ Firebase Admin initialized with Service Account Credentials");
    } else {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || "internshala-clone-b55c5"
      });
      console.log("✓ Firebase Admin initialized with Project ID");
    }
  }
} catch (err) {
  console.error("Firebase Admin initialization error:", err.message);
}

module.exports = admin;
