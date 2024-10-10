import { Buffer } from 'node:buffer'
import { makeConfig } from './config.mjs'
import { Bot, InlineKeyboard, InputFile } from 'grammy'

export const {
  TELEGRAM_BOT_TOKEN: token,
  TELEGRAM_SECRET_TOKEN: secretToken = String(token).split(':').pop(),
} = process.env

export const bot = new Bot(token)

const safe = bot.errorBoundary(console.error)

safe.command('start', async ctx => {
  await ctx.replyWithChatAction('upload_document')
  const config = await makeConfig()
  const file = new InputFile(Buffer.from(config), `Cloudflare WARP.conf`)
  const { message_id } = await ctx.replyWithDocument(file)
  await ctx.reply(
    'Установите приложение для вашей системы и откройте этот файл с помощью него',
    {
      reply_parameters: { message_id },
      reply_markup: new InlineKeyboard()
        .url(
          'Для iOS и macOS в AppStore',
          'https://apps.apple.com/pl/app/amneziawg/id6478942365'
        )
        .url(
          'Для Android в Google Play',
          'https://play.google.com/store/apps/details?id=org.amnezia.awg&hl=en_SG&gl=US'
        )
        .url(
          'Для Windows на Github',
          'https://github.com/amnezia-vpn/amneziawg-windows-client/releases/tag/1.0.0'
        )
        .toFlowed(1),
    }
  )
})
