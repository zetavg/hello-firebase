import admin from 'firebase-admin';
import { Firestore } from '@google-cloud/firestore';

export const getRealtimeDb = (): admin.database.Database => {
  if (!admin.apps.length) admin.initializeApp();
  return admin.database();
};

export const getFirestore = (): Firestore => {
  if (!admin.apps.length) admin.initializeApp();
  return admin.firestore();
};
