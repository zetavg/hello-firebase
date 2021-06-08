import * as functions from 'firebase-functions';
import { getDb } from './db';

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

export const helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info('Hello logs!', { structuredData: true });
  response.send('Hello from Firebase!');
});

export const getData = functions.https.onRequest(async (request, response) => {
  const { path } = request.query;

  if (!path) {
    response.send({ error: `Please specify the query parameter "path".` });
    return;
  }

  const db = getDb();
  const data = await db.ref(`data/${path}`).get();
  response.send(data);
});

export const setData = functions.https.onRequest(async (request, response) => {
  const { path } = request.query;

  if (!path) {
    response.send({ error: `Please specify the query parameter "path".` });
    return;
  }

  const [data, error] = (() => {
    const requestQueryData = request.query.data;
    if (typeof requestQueryData === 'string') {
      try {
        return [JSON.parse(requestQueryData), null];
      } catch (e) {
        return [
          undefined,
          `The query parameter "data" is not a vaild JSON string.`,
        ];
      }
    } else if (request.headers['content-type'] === 'application/json') {
      return [request.body];
    }

    return [
      undefined,
      `Please pass the data via the query parameter "data" or POST body with "Content-Type: application/json".`,
    ];
  })();

  if (error) {
    response.send({ error });
    return;
  }

  const db = getDb();
  await db.ref(`data/${path}`).set(data);
  response.send({ success: true });
});

export const logDataChanges = functions.database
  .ref('/data')
  .onWrite(async (change, context) => {
    const db = getDb();
    return await db.ref('data_changelog').push({
      before: change.before.toJSON(),
      after: change.after.toJSON(),
      timestamp: context.timestamp,
      context: {
        event_id: context.eventId,
        auth_type: context.authType,
        auth_uid: context.auth?.uid || null,
      },
    });
  });
