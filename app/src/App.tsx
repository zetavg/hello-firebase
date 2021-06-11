import React from 'react';
import logo from './logo.svg';
import './App.css';

function App(): JSX.Element {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
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
