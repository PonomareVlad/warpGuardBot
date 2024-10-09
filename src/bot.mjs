import { Bot } from 'grammy'
import { checkWgIsInstalled, generateKeyPair } from 'wireguard-tools'

export const {
  CLOUDFLARE_API_URL: api,
  TELEGRAM_BOT_TOKEN: token,
  TELEGRAM_SECRET_TOKEN: secretToken = String(token).split(':').pop(),
} = process.env

export const bot = new Bot(token)

const safe = bot.errorBoundary(console.error)

safe.command('version', async ctx => ctx.reply(await checkWgIsInstalled()))
safe.command('keys', async ctx => {
  const { publicKey, privateKey, preSharedKey } = await generateKeyPair({
    preSharedKey: true,
  })
  await ctx.reply(publicKey)
  await ctx.reply(privateKey)
  await ctx.reply(preSharedKey)
})
safe.on('message:text', ctx => ctx.reply(ctx.msg.text))
