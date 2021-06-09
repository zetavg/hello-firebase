import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';
import { getFirestore, getRealtimeDb } from './db';
import init from './init';

import {
  requestHandler as telegramBotRequestHandler,
  initWebhook as initTelegramBotWebhook,
} from './telegram-bot';

export const helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info('Hello logs!', { structuredData: true });
  response.send('Hello from Firebase!');
});

export const helloWorldEu = functions
  .region('europe-central2')
  .https.onRequest((request, response) => {
    functions.logger.info('Hello logs!', { structuredData: true });
    response.send('Hello from Firebase!');
  });

export const telegramBot = functions.https.onRequest(telegramBotRequestHandler);
init(() => initTelegramBotWebhook('telegramBot'), 'telegramBot');

export const getData = functions.https.onRequest(async (request, response) => {
  const { path } = request.query;

  if (!path) {
    response.send({ error: `Please specify the query parameter "path".` });
    return;
  }

  const db = getRealtimeDb();
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

  const db = getRealtimeDb();
  await db.ref(`data/${path}`).set(data);
  response.send({ success: true });
});

export const logDataChanges = functions.database
  .ref('/data')
  .onWrite(async (change, context) => {
    return await change.after.ref.root.child('data_changelog').push({
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

export const getFirestoreData = functions.https.onRequest(
  async (request, response) => {
    const { id } = request.query;

    if (typeof id !== 'string') {
      response.send({ error: `Please specify the query parameter "id".` });
      return;
    }

    const db = getFirestore();
    const doc = await db.collection('data').doc(id).get();

    if (!doc.exists) {
      response.send('null');
    } else {
      response.send(doc.data());
    }
  },
);

export const setFirestoreData = functions.https.onRequest(
  async (request, response) => {
    const { id } = request.query;

    if (typeof id !== 'string') {
      response.send({ error: `Please specify the query parameter "id".` });
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

    const db = getFirestore();
    try {
      await db.collection('data').doc(id).set(data);
      response.send({ success: true });
    } catch (e) {
      response.send({ error: e.message });
    }
  },
);

export const logFirestoreDataChanges = functions.firestore
  .document('data/{documentId}')
  .onWrite(async (change, context) => {
    const oldData = change.before.exists ? change.before.data() : null;
    const data = change.after.exists ? change.after.data() : null;

    return await change.after.ref.firestore.collection('data_changelog').add({
      docId: context.params.documentId,
      doc: change.after.ref,
      before: oldData,
      after: data,
      timestamp: firestore.Timestamp.fromDate(new Date(context.timestamp)),
      event_id: context.eventId,
      auth_type: context.authType || null,
      auth_uid: context.auth?.uid || null,
    });
  });
