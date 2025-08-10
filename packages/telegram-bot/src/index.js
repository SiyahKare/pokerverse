require('dotenv').config()
const express = require('express')
const { Telegraf } = require('telegraf')
const pino = require('pino')()

const PORT = process.env.PORT || 3000
const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://mini.pokerverse.yourdomain.com'
const API_URL = process.env.API_URL || 'https://api.pokerverse.yourdomain.com'

if (!TG_BOT_TOKEN) {
  pino.error('TG_BOT_TOKEN missing')
  process.exit(1)
}

const bot = new Telegraf(TG_BOT_TOKEN)

bot.start(async (ctx) => {
  const kb = {
    reply_markup: {
      inline_keyboard: [[{ text: 'Pokerverse MiniApp', web_app: { url: WEBAPP_URL } }]],
    },
  }
  await ctx.reply('Pokerverse’a hoş geldin! MiniApp’i açmak için tıkla:', kb)
})

bot.command('mini', async (ctx) => {
  await ctx.reply('MiniApp’i aç:', {
    reply_markup: { inline_keyboard: [[{ text: 'Aç', web_app: { url: WEBAPP_URL } }]] },
  })
})

// Webhook endpoint (opsiyonel)
const app = express()
app.use(express.json())

app.get('/health', (req, res) => res.json({ ok: true }))
app.post('/webhook', (req, res) => {
  bot.handleUpdate(req.body)
  res.sendStatus(200)
})

app.listen(PORT, () => {
  pino.info({ PORT, WEBAPP_URL, API_URL }, 'telegram-bot listening')
})

// Long-poll fallback (webhook kullanmıyorsan)
if (process.env.USE_LONGPOLL === '1') {
  bot.launch().then(() => pino.info('bot long-poll launched'))
}

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))


