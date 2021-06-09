import * as functions from 'firebase-functions';
import fetch from 'node-fetch';

import required from '../utils/required';
import underscore from '../utils/underscore';

import getBot from './bot';

const BOT_TOKEN = required(
  functions.config().telegram_bot?.bot_token,
  'functions config "telegram_bot.bot_token"',
);
const SERVER_TOKEN = functions.config().telegram_bot?.server_token;

export const requestHandler = async (
  req: functions.https.Request,
  resp: functions.Response,
): Promise<void> => {
  const { token } = req.query;
  if (SERVER_TOKEN && token !== SERVER_TOKEN) {
    console.warn(
      `Invalid access with fallacious server token "?token=${token}" from ${
        req.ip
      } (${req.ips.join(', ')}).`,
    );
    resp.status(401).send();
    return;
  }

  try {
    await getBot(BOT_TOKEN).handleUpdate(req.body, resp);
  } catch (e) {
    console.error(e);
    resp.status(500).send();
    return;
  }

  resp.status(200).send();
};

// Set Telegram bot webhook
export const initWebhook = async (functionName: string): Promise<void> => {
  const triggerUrl = (() => {
    const firebaseProjectId = functions.config().x_firebase_project?.id;
    const functionRegion = (functions.config().function_region || {})[
      underscore(functionName)
    ];

    if (!firebaseProjectId || !functionRegion) return;

    if (process.env.FUNCTIONS_EMULATOR === 'true') {
      const localHost = functions.config().telegram_bot?.local_host;
      if (localHost) {
        return `https://${localHost}/${firebaseProjectId}/${functionRegion}/${functionName}`;
      }

      return;
    }

    return `https://${functionRegion}-${firebaseProjectId}.cloudfunctions.net/${functionName}`;
  })();

  function getWebhookUrl(includeRealTokens = true) {
    const baseUrl = triggerUrl || '<your-function-url>';

    if (SERVER_TOKEN) {
      const serverToken = includeRealTokens
        ? SERVER_TOKEN
        : '<your-server-token>';
      return `${baseUrl}?token=${serverToken}`;
    }

    return baseUrl;
  }

  function getTelegramSetWebhookUrl(includeRealTokens = true) {
    const telegramBotToken = includeRealTokens
      ? BOT_TOKEN
      : '<your-telegram-bot-token>';
    const url = `https://api.telegram.org/bot${telegramBotToken}/setWebhook?url=${encodeURIComponent(
      getWebhookUrl(includeRealTokens),
    )}`;

    if (!includeRealTokens) {
      return url
        .replace('%3Cyour-function-url%3E', '<your-function-url>')
        .replace('%3Cyour-server-token%3E', '<your-server-token>');
    }

    return url;
  }

  if (triggerUrl) {
    try {
      const setWebhookResponse = await fetch(getTelegramSetWebhookUrl(true));
      const setWebhookResponseJson = await setWebhookResponse.json();
      if (setWebhookResponseJson.ok) {
        console.warn(
          `Telegram bot webhook has been automatically set to "${getWebhookUrl(
            false,
          )} by calling ${getTelegramSetWebhookUrl(false)}".`,
        );

        return;
      } else {
        throw new Error(setWebhookResponseJson.description);
      }
    } catch (e) {
      console.error(
        `Telegram webhook setting error: ${e.message || 'unknown error'}.`,
      );
    }
  }

  console.warn(
    `Cannot automatically set Telegram bot webhook, please run \`curl '${getTelegramSetWebhookUrl(
      false,
    )}'\` manually to set the webhook for your bot.`,
  );
};
