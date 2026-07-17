const admin = require('firebase-admin');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

let serviceAccount = null;

// 1. 환경 변수에서 서비스 계정 JSON 문자열 로드 시도
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    console.log("ℹ️ Loaded Firebase credentials from environment variable.");
  } catch (err) {
    console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON env variable:", err);
  }
}

// 2. 환경 변수가 없거나 로드 실패 시, 로컬 JSON 파일에서 로드 시도
if (!serviceAccount) {
  const localKeyPath = path.join(__dirname, 'firebase-service-account.json');
  if (fs.existsSync(localKeyPath)) {
    try {
      serviceAccount = require(localKeyPath);
      console.log("ℹ️ Loaded Firebase credentials from local firebase-service-account.json.");
    } catch (err) {
      console.error("❌ Failed to load local firebase-service-account.json:", err);
    }
  }
}

let isInitialized = false;

// 3. Firebase Admin SDK 초기화
if (serviceAccount) {
  try {
    initializeApp({
      credential: cert(serviceAccount)
    });
    console.log("🔥 Firebase Admin SDK initialized successfully.");
    isInitialized = true;
  } catch (err) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", err);
  }
} else {
  console.warn("⚠️ [WARNING] No Firebase credentials found. Please set 'FIREBASE_SERVICE_ACCOUNT_JSON' env variable or place 'firebase-service-account.json' in your backend directory.");
  console.warn("⚠️ [WARNING] Firestore queries will fail until credentials are provided.");
}

const databaseId = process.env.FIRESTORE_DATABASE_ID || 'bloggame';
const firestore = isInitialized ? getFirestore(databaseId) : null;

if (firestore) {
  // undefined 프로퍼티 무시 설정 적용 (NoSQL 저장 시 편리함)
  firestore.settings({ ignoreUndefinedProperties: true });
}

module.exports = {
  admin,
  db: firestore
};
