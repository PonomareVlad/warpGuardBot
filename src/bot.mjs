import { Bot } from 'grammy'
import { exec } from 'wireguard-tools/dist/utils/exec'

export const {
  TELEGRAM_BOT_TOKEN: token,
  TELEGRAM_SECRET_TOKEN: secretToken = String(token).split(':').pop(),
} = process.env

export const bot = new Bot(token)
const safe = bot.errorBoundary(console.error)

safe.command('version', async ctx => ctx.reply(await exec('./src/wg -v')))
safe.on('message:text', ctx => ctx.reply(ctx.msg.text))
