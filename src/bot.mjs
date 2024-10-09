import {
  generateKeyPair,
  checkWgIsInstalled,
  generateConfigString,
} from 'wireguard-tools'
import { promises } from 'node:dns'
import { Buffer } from 'node:buffer'
import { Bot, InputFile } from 'grammy'

export const {
  CLOUDFLARE_API_URL: api,
  TELEGRAM_BOT_TOKEN: token,
  TELEGRAM_SECRET_TOKEN: secretToken = String(token).split(':').pop(),
} = process.env

const defaultHeaders = new Headers({
  'content-type': 'application/json',
  'user-agent': '',
})

export const bot = new Bot(token)

const safe = bot.errorBoundary(console.error)

safe.command('version', async ctx => ctx.reply(await checkWgIsInstalled()))

safe.command('start', async ctx => {
  await ctx.replyWithChatAction('upload_document')
  const { publicKey, privateKey } = await generateKeyPair()
  const date = new Date()
  date.setMilliseconds(0)
  const {
    result: { id, token },
  } = await fetch(new URL('reg', api), {
    body: JSON.stringify({
      install_id: '',
      tos: date,
      key: publicKey,
      fcm_token: '',
      type: 'ios',
      locale: 'en_US',
    }),
    headers: defaultHeaders,
    method: 'POST',
  }).then(response => response.json())
  const headers = new Headers(defaultHeaders)
  headers.set('authorization', `Bearer ${token}`)
  const {
    result: {
      config: {
        peers: [
          {
            public_key,
            endpoint: { host },
          },
        ],
        interface: {
          addresses: { v4, v6 },
        },
      },
    },
  } = await fetch(new URL(`reg/${id}`, api), {
    body: JSON.stringify({ warp_enabled: true }),
    method: 'PATCH',
    headers,
  }).then(response => response.json())
  const { hostname, port } = new URL(`https://${host}`)
  const [address] = await promises.resolve4(hostname)
  const config = generateConfigString({
    wgInterface: {
      privateKey,
      address: [`${v4}/24`],
      dns: ['1.1.1.1'],
    },
    peers: [
      {
        publicKey: public_key,
        allowedIps: ['0.0.0.0/0', '::/0'],
        endpoint: `${address}:${port}`,
      },
    ],
  })
  const file = new InputFile(Buffer.from(config), 'WARP.conf')
  await ctx.replyWithDocument(file)
})
