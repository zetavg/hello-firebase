import { Telegraf, Markup } from 'telegraf';
import { BotCommand } from 'telegraf/typings/core/types/typegram';

import { lines } from './utils';

import { COMMANDS as FS_COMMANDS, mount as mountFs } from './modules/firestore';
import {
  COMMANDS as RDB_COMMANDS,
  mount as mountRdb,
} from './modules/realtime-database';

const COMMANDS: BotCommand[] = [
  {
    command: 'start',
    description: 'Init the bot',
  },
  ...FS_COMMANDS,
  ...RDB_COMMANDS,
  {
    command: 'help',
    description: 'Show help message',
  },
];

const COMMANDS_DESCRIPTION = COMMANDS.map(
  ({ command, description }) => `/${command} - ${description}`,
).join('\n');

const MAIN_KEYBOARD = Markup.keyboard([
  ['/start'],
  ['/fs_set_data', '/fs_get_data'],
  [
    '/rdb_set_data',
    '/rdb_get_data',
    '/rdb_set_data_json',
    '/rdb_get_data_json',
  ],
  ['/help'],
]);

let cachedBot: Telegraf | void;
export function getBot(token: string): Telegraf {
  if (cachedBot) return cachedBot;

  const bot = new Telegraf(token);

  bot.telegram.setMyCommands(COMMANDS);

  bot.start((ctx) =>
    ctx.reply('Welcome. Send /help for avaliable commands.', MAIN_KEYBOARD),
  );

  bot.help(async (ctx) => {
    await ctx.reply(
      `<strong>Avaliable commands</strong>:\n${COMMANDS_DESCRIPTION}`,
      {
        parse_mode: 'HTML', // See: https://core.telegram.org/bots/api#formatting-options
      },
    );
    await ctx.reply(
      lines(
        'Or, you can also do the following:',
        ' - Send me a sticker',
        ' - Say "hi"',
      ),
      { disable_notification: true },
    );
  });

  bot.on('sticker', (ctx) => ctx.reply('👍'));

  bot.hears(/[Hh]i/, (ctx, next) => {
    ctx.reply('Hey there');
    next();
  });

  mountFs(bot);
  mountRdb(bot);

  cachedBot = bot;
  return bot;
}

export default getBot;
