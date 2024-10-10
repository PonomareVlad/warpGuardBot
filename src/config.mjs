import dns from 'node:dns'
import { generateKeyPair, generateConfigString } from 'wireguard-tools'

export const { CLOUDFLARE_API_URL: api } = process.env

const defaultHeaders = new Headers({
  'content-type': 'application/json',
  'user-agent': '',
})

export async function makeConfig() {
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

  const [address] = await dns.promises.resolve4(hostname)

  return generateConfigString({
    wgInterface: {
      name: id,
      privateKey,
      address: [v4, v6],
      dns: [
        '1.1.1.1',
        '2606:4700:4700::1111',
        '1.0.0.1',
        '2606:4700:4700::1001',
      ],
      S1: 0,
      S2: 0,
      Jc: 120,
      Jmin: 23,
      Jmax: 911,
      H1: 1,
      H2: 2,
      H3: 3,
      H4: 4,
    },
    peers: [
      {
        publicKey: public_key,
        allowedIps: ['0.0.0.0/1', '128.0.0.0/1', '::/1', '8000::/1'],
        endpoint: `${address}:${port}`,
      },
    ],
  })
}
