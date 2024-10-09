import { promises } from 'node:dns'
import { Buffer } from 'node:buffer'
import { Bot, InlineKeyboard, InputFile } from 'grammy'
import { generateKeyPair, generateConfigString } from 'wireguard-tools'

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
      address: [v4, ' ' + v6],
      dns: [
        '1.1.1.1',
        ' 2606:4700:4700::1111',
        ' 1.0.0.1',
        ' 2606:4700:4700::1001',
      ],
    },
    peers: [
      {
        publicKey: public_key,
        allowedIps: ['0.0.0.0/1', ' 128.0.0.0/1', ' ::/1', ' 8000::/1'],
        endpoint: `${address}:${port}`,
      },
    ],
  }).replace(
    `

  [Peer]
  `,
    `
  S1 = 0
  S2 = 0
  Jc = 120
  Jmin = 23
  Jmax = 911
  H1 = 1
  H2 = 2
  H3 = 3
  H4 = 4

  [Peer]
  `
  )
  const file = new InputFile(Buffer.from(config), 'WARP.conf')
  const { message_id } = await ctx.replyWithDocument(file)
  await ctx.reply(
    'Установите приложение для вашей системы и откройте этот файл с помощью него',
    {
      reply_parameters: { message_id },
      reply_markup: new InlineKeyboard()
        .url(
          'Для Android в Google Play',
          'https://play.google.com/store/apps/details?id=org.amnezia.awg&hl=en_SG&gl=US'
        )
        .url(
          'Для iOS в AppStore',
          'https://apps.apple.com/pl/app/amneziawg/id6478942365'
        )
        .url(
          'Для Windows на Github',
          'https://github.com/amnezia-vpn/amneziawg-windows-client/releases/tag/1.0.0'
        )
        .toFlowed(1),
    }
  )
})
