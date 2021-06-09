import { Telegraf } from 'telegraf';
import { Context } from 'telegraf/typings/context';
import { Update, BotCommand } from 'telegraf/typings/core/types/typegram';
import { getRealtimeDb } from '../../db';
import { lines } from '../utils';

export const COMMANDS: BotCommand[] = [
  {
    command: 'rdb_set_data',
    description: 'Set data in Realtime Database (as string)',
  },
  {
    command: 'rdb_get_data',
    description: 'Get data in Realtime Database',
  },
  {
    command: 'rdb_set_data_json',
    description: 'Set data in Realtime Database with JSON format',
  },
  {
    command: 'rdb_get_data_json',
    description: 'Get data in Realtime Database with JSON format',
  },
];

export function mount(bot: Telegraf<Context<Update>>): void {
  bot.command('rdb_set_data', async (ctx) => {
    try {
      const [, path, value] =
        ctx.message.text.match(
          /^\/rdb_set_data ([^ \r\n]+)[ \r\n]([\s\S]*)$/,
        ) || [];

      if (!path || value === undefined) {
        return await ctx.reply('*Usage:* `/rdb_set_data <path> <value>`', {
          parse_mode: 'MarkdownV2',
        });
      }

      const db = getRealtimeDb();

      await db.ref(`data/${path}`).set(value);

      await ctx.reply(
        `Data has been set, you can now use \`/rdb_get_data ${path}\` to retrieve it`,
        {
          parse_mode: 'MarkdownV2',
        },
      );
    } catch (e) {
      console.error(e);
    }
  });

  bot.command('rdb_get_data', async (ctx) => {
    try {
      const [, path] = ctx.message.text.match(/^\/rdb_get_data ([^ ]+)$/) || [];

      if (!path) {
        return await ctx.reply('*Usage:* `/rdb_get_data <path>`', {
          parse_mode: 'MarkdownV2',
        });
      }

      const db = getRealtimeDb();

      const snapshot = await db.ref(`data/${path}`).get();
      const val = snapshot.val();

      await ctx.reply(val === null ? '`null`' : val, {
        parse_mode: val === null ? 'MarkdownV2' : undefined,
      });
    } catch (e) {
      console.error(e);
    }
  });

  bot.command('rdb_set_data_json', async (ctx) => {
    try {
      const [, path, jsonString] =
        ctx.message.text.match(
          /^\/rdb_set_data_json ([^ \r\n]+)[ \r\n]([\s\S]*)$/,
        ) || [];

      let json = NaN;
      try {
        json = JSON.parse(jsonString);
      } catch (e) {
        if (path && jsonString) {
          await ctx.reply(
            lines('```json', jsonString, '```', 'is not valid JSON'),
            {
              parse_mode: 'MarkdownV2',
            },
          );
        }
      }

      if (!path || Number.isNaN(json)) {
        return await ctx.reply('*Usage:* `/rdb_set_data_json <path> <json>`', {
          parse_mode: 'MarkdownV2',
        });
      }

      const db = getRealtimeDb();

      await db.ref(`data/${path}`).set(json);

      await ctx.reply(
        `Data has been set, you can now use \`/rdb_get_data_json ${path}\` to retrieve it`,
        {
          parse_mode: 'MarkdownV2',
        },
      );
    } catch (e) {
      console.error(e);
    }
  });

  bot.command('rdb_get_data_json', async (ctx) => {
    try {
      const [, path] =
        ctx.message.text.match(/^\/rdb_get_data_json ([^ ]+)$/) || [];

      if (!path) {
        return await ctx.reply('*Usage:* `/rdb_get_data_json <path>`', {
          parse_mode: 'MarkdownV2',
        });
      }

      const db = getRealtimeDb();

      const snapshot = await db.ref(`data/${path}`).get();

      await ctx.reply(
        lines('```json', JSON.stringify(snapshot.toJSON(), null, 2), '```'),
        {
          parse_mode: 'MarkdownV2',
        },
      );
    } catch (e) {
      console.error(e);
    }
  });
}
