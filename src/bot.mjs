import { Bot } from 'grammy'
import { exec } from 'wireguard-tools/dist/utils/exec.js'

export const {
  TELEGRAM_BOT_TOKEN: token,
  TELEGRAM_SECRET_TOKEN: secretToken = String(token).split(':').pop(),
} = process.env

export const bot = new Bot(token)
const safe = bot.errorBoundary(console.error)

safe.command('ls', async ctx => ctx.reply(await exec('ls')))
safe.command('pwd', async ctx => ctx.reply(await exec('pwd')))
safe.command('version', async ctx => ctx.reply(await exec('./bin/wg -v')))
safe.on('message:text', ctx => ctx.reply(ctx.msg.text))
