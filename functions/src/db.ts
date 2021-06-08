import admin from 'firebase-admin';

export const getDb = (): admin.database.Database => {
  if (!admin.apps.length) admin.initializeApp();
  return admin.database();
};
