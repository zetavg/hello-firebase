import { Telegraf } from 'telegraf';
import { Context } from 'telegraf/typings/context';
import { Update, BotCommand } from 'telegraf/typings/core/types/typegram';
import { getFirestore } from '../../db';
import { lines } from '../utils';

export const COMMANDS: BotCommand[] = [
  {
    command: 'fs_set_data',
    description: 'Set data in Firestore (as JSON)',
  },
  {
    command: 'fs_get_data',
    description: 'Get data in Firestore',
  },
];

export function mount(bot: Telegraf<Context<Update>>): void {
  bot.command('fs_set_data', async (ctx) => {
    try {
      const [, id, jsonString] =
        ctx.message.text.match(/^\/fs_set_data ([^ \r\n]+)[ \r\n]([\s\S]*)$/) ||
        [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let json: any = NaN;
      try {
        json = JSON.parse(jsonString);
      } catch (e) {
        if (id && jsonString) {
          await ctx.reply(
            lines('```json', jsonString, '```', 'is not valid JSON'),
            {
              parse_mode: 'MarkdownV2',
            },
          );
        }
      }

      if (!id || Number.isNaN(json)) {
        return await ctx.reply('*Usage:* `/fs_set_data <id> <json>`', {
          parse_mode: 'MarkdownV2',
        });
      }

      const db = getFirestore();

      await db.collection('data').doc(id).set(json);

      await ctx.reply(
        `Data has been set, you can now use \`/fs_get_data ${id}\` to retrieve it`,
        {
          parse_mode: 'MarkdownV2',
        },
      );
    } catch (e) {
      console.error(e);
      await ctx.reply(e.message);
    }
  });

  bot.command('fs_get_data', async (ctx) => {
    try {
      const [, id] = ctx.message.text.match(/^\/fs_get_data ([^ ]+)$/) || [];

      if (!id) {
        return await ctx.reply('*Usage:* `/fs_get_data <id>`', {
          parse_mode: 'MarkdownV2',
        });
      }

      const db = getFirestore();

      const doc = await db.collection('data').doc(id).get();
      const data = doc.exists ? doc.data() : null;

      await ctx.reply(lines('```json', JSON.stringify(data, null, 2), '```'), {
        parse_mode: 'MarkdownV2',
      });
    } catch (e) {
      console.error(e);
    }
  });
}
