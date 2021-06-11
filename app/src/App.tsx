import { useCallback, useEffect, useState } from 'react';
import firebase, { auth, firestore, googleAuthProvider } from './firebase';
import logo from './logo.svg';
import './App.css';

function App(): JSX.Element {
  const [dataId, setDataId] = useState('');
  const [dataJson, setDataJson] = useState('');

  const getData = useCallback(async () => {
    try {
      const doc = await firestore.collection('data').doc(dataId).get();
      setDataJson(JSON.stringify(doc.exists ? doc.data() : null, null, 2));
    } catch (e) {
      alert(e.message);
    }
  }, [dataId]);

  const setData = useCallback(async () => {
    try {
      const data = JSON.parse(dataJson);
      await firestore.collection('data').doc(dataId).set(data);
    } catch (e) {
      alert(e.message);
    }
  }, [dataId, dataJson]);

  const [user, setUser] = useState<firebase.User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const signInAnonymously = useCallback(() => {
    setAuthError(null);
    setAuthLoading(true);
    auth
      .signInAnonymously()
      .catch((error) => {
        console.error(error);
        setAuthError(`[${error.code}] ${error.message}`);
      })
      .finally(() => {
        setAuthLoading(false);
      });
  }, []);
  const signInWithGoogle = useCallback(() => {
    setAuthError(null);
    setAuthLoading(true);
    auth
      .signInWithPopup(googleAuthProvider)
      .catch((error) => {
        console.error(error);
        setAuthError(`[${error.code}] ${error.message}`);
      })
      .finally(() => {
        setAuthLoading(false);
      });
  }, []);
  const signOut = useCallback(() => {
    setAuthError(null);
    setAuthLoading(true);
    auth
      .signOut()
      .catch((error) => {
        setAuthError(`[${error.errorCode}] ${error.errorMessage}`);
      })
      .finally(() => {
        setAuthLoading(false);
      });
  }, []);

  const [userDataJson, setUserDataJson] = useState('');
  const saveUserData = useCallback(async () => {
    try {
      const data = JSON.parse(userDataJson);
      await firestore.collection('user_data').doc(user?.uid).set(data);
    } catch (e) {
      alert(e.message);
    }
  }, [userDataJson, user?.uid]);

  useEffect(() => {
    return auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        const doc = await firestore.collection('user_data').doc(user.uid).get();
        setUserDataJson(
          JSON.stringify(doc.exists ? doc.data() : null, null, 2),
        );
      } else {
        setUser(null);
        setUserDataJson('');
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        {(() => {
          if (authLoading) {
            return <p>Loading...</p>;
          }
          if (!user) {
            return <p>Not authenticated.</p>;
          }

          return (
            <section className="firestore">
              Firestore
              <div className="input-group">
                Data ID:{' '}
                <input
                  value={dataId}
                  onChange={(e) => setDataId(e.target.value)}
                />
              </div>
              <div className="input-group">
                Data JSON:{' '}
                <textarea
                  value={dataJson}
                  onChange={(e) => setDataJson(e.target.value)}
                />
              </div>
              <div className="actions">
                <button onClick={getData}>Get data</button>{' '}
                <button onClick={setData}>Set data</button>
              </div>
              <hr className="hr" />
              <div className="input-group">
                User data JSON:{' '}
                <textarea
                  value={userDataJson}
                  onChange={(e) => setUserDataJson(e.target.value)}
                />
              </div>
              <div className="actions">
                <button onClick={saveUserData}>Save</button>
              </div>
            </section>
          );
        })()}
        <hr className="hr" />
        {authError && <p>Authentication error: {authError}</p>}
        {(() => {
          if (user) {
            return (
              <div className="actions">
                <button onClick={signOut}>Sign out {user.displayName}</button>{' '}
              </div>
            );
          }

          return (
            <div className="actions">
              <button onClick={signInAnonymously}>Sign in anonymously</button>{' '}
              <button onClick={signInWithGoogle}>Sign in with Google</button>{' '}
            </div>
          );
        })()}
        <section className="App-info">
          <p>
            My External Service's public key is{' '}
            <code>{app.config().my_external_service.public_key}</code>.
          </p>
        </section>
      </header>
    </div>
  );
}

export default App;
