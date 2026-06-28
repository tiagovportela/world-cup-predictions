import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Validate Firebase config
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId']
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key])

if (missingKeys.length > 0) {
  console.error(
    'Firebase configuration is incomplete. Missing keys:',
    missingKeys.join(', '),
    '\n\nPlease check your .env.local file and ensure all VITE_FIREBASE_* variables are set.'
  )
}

let app
let db

try {
  app = initializeApp(firebaseConfig)
  db = getFirestore(app)
} catch (error) {
  console.error('Failed to initialize Firebase:', error.message)
  throw new Error(
    'Firebase initialization failed. Check your environment variables in .env.local. ' +
    'See README.md for setup instructions.'
  )
}

export { db }
export const isFirebaseConfigured = missingKeys.length === 0
