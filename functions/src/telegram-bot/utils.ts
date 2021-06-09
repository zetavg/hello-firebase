import { Telegraf } from 'telegraf';
import { Context } from 'telegraf/typings/context';
import { Update, Message } from 'telegraf/typings/core/types/typegram';
import { NarrowedContext } from 'telegraf/typings/composer';
import { Update as TGUpdateNamespace } from 'typegram/update';

const ZERO_WIDTH_SPACE = '​';

type PayloadObject = {
  [key: string]: number | string | boolean | PayloadObject;
};

/**
 * Join lines. Example:
 *
 * ```js
 * lines('Hi there!', 'Nice to meet you.'); // => 'Hi there!\nNice to meet you.'
 * ```
 */
export function lines(...linesOfString: string[]): string {
  return linesOfString.join('\n');
}

/**
 * Returns a Promise that resolves in about `ms` time.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Gets the data of the callback query from context.
 */
export function getCbQueryData(
  ctx: NarrowedContext<Context<Update>, TGUpdateNamespace.CallbackQueryUpdate>,
): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (ctx.callbackQuery as any)['data'] as string | undefined;
}

/**
 * Decodes the JSON object from the callback query data from context.
 * Returns undefined if the data can't be decoded as JSON.
 */
export function getCbQueryJsonData(
  ctx: NarrowedContext<Context<Update>, TGUpdateNamespace.CallbackQueryUpdate>,
): PayloadObject | undefined {
  try {
    return JSON.parse(getCbQueryData(ctx) || '');
  } catch (e) {
    return undefined;
  }
}

export class CbQueryMessageInvalidError extends Error {}

/**
 * Asserts that we can get the associated message and it's text, otherwise throw an error.
 */
export function assertCbQueryMessageValidity(
  ctx: NarrowedContext<Context<Update>, TGUpdateNamespace.CallbackQueryUpdate>,
  errorMessage = 'Actions to this message is no longer valid',
): asserts ctx is {
  callbackQuery: {
    message: {
      text: string;
    };
  };
} & NarrowedContext<Context<Update>, TGUpdateNamespace.CallbackQueryUpdate> {
  try {
    const { message } = ctx.callbackQuery;
    if (!message) {
      throw new Error();
    }

    const messageText = getMessageText(message);
    if (!messageText) {
      throw new Error();
    }
  } catch (e) {
    ctx.answerCbQuery(errorMessage).catch((e) => console.error(e));

    const { message } = ctx.callbackQuery;
    if (message) {
      // Clear the inline keyboard
      ctx.telegram
        .editMessageReplyMarkup(
          message.chat.id,
          message.message_id,
          undefined,
          undefined,
        )
        .catch((e) => console.error(e));
    }

    throw new CbQueryMessageInvalidError();
  }
}

/**
 * Gets the `text` from a message.
 */
export function getMessageText(message: Message): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (message as any)['text'] as string | undefined;
}

/**
 * Gets `reply_to_message` from a message.
 */
export function getReplyToMessage(message: Message): Message | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (message as any)['reply_to_message'] as Message | undefined;
}

/**
 * Inserts an zero width space to the front of message text so it can carry hidden payload.
 */
export function withHiddenPayload(text: string): string {
  return ZERO_WIDTH_SPACE + text;
}

/**
 * Inserts a hidden payload object into the message.
 * It's recommended to be use with `withHiddenPayload`, example:
 *
 * ```js
 * ctx.reply(withHiddenPayload('What name do you want to give to the thing?'), {
 *   ...hiddenPayload({
 *     type: 'thing',
 *     action: 'rename',
 *     thing_id: 1234,
 *   }),
 *   ...Markup.forceReply(),
 * });
 * ```
 */
export function hiddenPayload(payload: PayloadObject): {
  entities: [{ type: 'text_link'; offset: 0; length: 1; url: string }];
} {
  return {
    entities: [
      {
        type: 'text_link',
        offset: 0,
        length: 1,
        url: `http://x-bot-payload.invalid/${encodeURIComponent(
          JSON.stringify(payload),
        )}`,
      },
    ],
  };
}

/**
 * Extracts the hidden payload (inserted by `hiddenPayload`) from a message.
 * Example:
 *
 * ```js
 * bot.on('message', async (ctx) => {
 *   try {
 *     const replayToMessage = getReplyToMessage(ctx.message);
 *     if (!replayToMessage) return;
 *
 *     const hiddenPayload = getHiddenPayload(replayToMessage);
 *     // hiddenPayload = { type: 'thing', action: 'rename', thing_id: 1234 }
 *
 * //...
 * ```
 */
export function getHiddenPayload(message: Message): PayloadObject | null {
  const msg: {
    entities?: ReadonlyArray<{ url?: string }>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = message as any;

  if (!msg.entities) return null;

  const payloadEntity = msg.entities.find((p) =>
    p.url?.startsWith('http://x-bot-payload.invalid/'),
  );

  if (!payloadEntity) return null;

  try {
    const { url } = payloadEntity;
    if (!url) throw new Error('The "url" disappears');

    const [, payloadString] = url.split('http://x-bot-payload.invalid/');
    if (!payloadString)
      throw new Error(`Cannot get payload string from: "${url}"`);

    return JSON.parse(decodeURIComponent(payloadString));
  } catch (e) {
    console.error(
      `Error occured while decoding hidden payload in message: ${e.message}`,
    );
    return null;
  }
}

export function patchBotToSupportMutipleEventHandlers(
  bot: Telegraf<Context<Update>>,
): Telegraf<Context<Update>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (bot as any)['originalOn'] = bot.on;

  type Fn = typeof bot.on extends (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateType: any,
    ...fns: Array<infer T>
  ) => // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
    ? T
    : never;

  const eventHandlers: { [updateType: string]: Array<Fn> } = {};

  const on: typeof bot.on = (updateType, ...fns) => {
    const updateTypeArray = Array.isArray(updateType)
      ? updateType
      : [updateType];

    updateTypeArray.forEach((type) => {
      if (!eventHandlers[type]) {
        eventHandlers[type] = [];

        const reg = () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (bot as any)['originalOn'](type, (...args: any) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            eventHandlers[type].forEach((fn: any) => fn(...args));
          });
        };

        if (type !== 'message') {
          reg();
        } else {
          // Make the message callback stay as the last one
          setTimeout(reg, 0);
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      eventHandlers[type] = [...eventHandlers[type], ...(fns as any)];
      return;
    });

    return bot;
  };

  bot.on = on;

  return bot;
}
