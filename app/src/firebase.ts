import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

firebase.initializeApp(app.firebaseConfig());

export const firestore = firebase.firestore();
if (app.config().app_use_emulator.firestore === 'true') {
  firestore.useEmulator(
    app.config().app_use_emulator.firestore_host || 'localhost',
    (app.config().app_use_emulator.firestore_port &&
      parseInt(app.config().app_use_emulator.firestore_port || '', 10)) ||
      8080,
  );
}

export const auth = firebase.auth();
if (app.config().app_use_emulator.auth === 'true') {
  auth.useEmulator(
    app.config().app_use_emulator.auth_url || 'http://localhost:9099',
  );
}
export const googleAuthProvider = new firebase.auth.GoogleAuthProvider();

export default firebase;
