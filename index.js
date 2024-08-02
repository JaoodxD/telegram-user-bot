import { Api, TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions/index.js'
import { createInterface } from 'node:readline/promises'
import { NewMessage } from 'telegram/events/index.js'
import fs from 'node:fs/promises'
import { randomUUID } from 'node:crypto'

const { stdin: input, stdout: output } = process
const rl = createInterface({ input, output })

const apiId = process.env.TELEGRAM_API_ID
const apiHash = process.env.TELEGRAM_API_HASH
const session = process.env.TELEGRAM_TOKEN || ''
const stringSession = new StringSession(session)

console.log('Loading...')
const client = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 5
})

await client.start({
  phoneNumber: () => rl.question('Please enter your phone number: '),
  password: () => rl.question('Please enter your password: '),
  phoneCode: () => rl.question('Please enter the code you recieved: '),
  onError: err => console.error(err)
})

console.log(client.session.save())

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

client.addEventHandler(async function (event) {
  // console.dir(event.message, { depth: null })
  console.log(event.message)
  if (event.message.media && event.message.media.className === 'MessageMediaPhoto') {
    const photo = event.message.media.photo
    const buffer = await client.downloadFile(new Api.InputPhotoFileLocation({
      id: photo.id,
      accessHash: photo.accessHash,
      fileReference: photo.fileReference,
      thumbSize: 'y'
    }), {
      dcId: photo.dcId
    })
    await fs.writeFile(`./${randomUUID()}.jpg`, buffer)
  }
}, new NewMessage({}))

async function shutdown () {
  await client.disconnect()
  await client.destroy()
}
