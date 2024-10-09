import { Bot } from 'grammy'
import { checkWgIsInstalled } from 'wireguard-tools'

export const {
  TELEGRAM_BOT_TOKEN: token,
  TELEGRAM_SECRET_TOKEN: secretToken = String(token).split(':').pop(),
} = process.env

export const bot = new Bot(token)
const safe = bot.errorBoundary(console.error)

safe.command('version', async ctx => ctx.reply(await checkWgIsInstalled()))
safe.on('message:text', ctx => ctx.reply(ctx.msg.text))
