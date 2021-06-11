import firebase from 'firebase/app';
import 'firebase/firestore';

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

export default firebase;
