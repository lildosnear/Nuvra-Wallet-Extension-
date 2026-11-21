import { createApp } from './app.js'
import { createStore } from './store.js'
import { createDevMailer } from './mailer.js'

const port = Number(process.env.PORT || 8787)
const store = createStore(process.env.NUVRA_STORE_FILE || null)
const mailer = createDevMailer()
const app = createApp({
  store,
  mailer,
  config: {
    rpID: process.env.NUVRA_RP_ID || 'localhost',
    origins: (process.env.NUVRA_ORIGINS || 'http://localhost:8787').split(','),
  },
})

app.listen(port, () => {
  console.log(`nuvra-backend listening on http://localhost:${port}`)
})
