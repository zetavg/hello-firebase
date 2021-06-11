import { useCallback, useState } from 'react';
import { firestore } from './firebase';
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

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <section className="firestore">
          Firestore
          <div className="input-group">
            Data ID:{' '}
            <input value={dataId} onChange={(e) => setDataId(e.target.value)} />
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
        </section>
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
