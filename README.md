# Hello Firebase

Hello Firebase project with Node.js, TypeScript, Babel, ESLint, and Prettier.


## Requirements

- [Node.js](https://nodejs.org/) 14+
- [Firebase CLI](https://firebase.google.com/docs/cli)


## Setup

Install the dependencies via:

```sh
npm install
```

Then, copy the sample config file and edit it to your needs:

```sh
cp .config.js.sample .config.js
```

At last, add and set the active Firebase project by running:

```sh
firebase use --add
```

> If you want to create a new Firebase project, run `firebase projects:create`.


## Develop

### Run Locally

Run `npm start` to start the Firebase emulators. This will prepare the runtime environment, and run the Babel compiler with Firebase emulators in parallel.

After the emulators have been started, you can access all resources shown on the console output, and also invoke HTTP functions via endpoints like `http://localhost:5001/<project-id>/<function-region>/functionName`.

> Note that the default region for functions is `us-central1`. Run `firebase use` to see the current project ID.

### Using the Functions Shell

Start the interactive shell by running: `npm run shell`.

For more information about the interactive shell, see https://firebase.google.com/docs/functions/local-shell.


## Deploy

Use `firebase use` to switch to the Firebase project you want to deploy, then run:

```sh
firebase deploy
```
