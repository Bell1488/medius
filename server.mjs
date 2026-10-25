import http from 'node:http';
import https from 'node:https';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';
import { SocksProxyAgent } from 'socks-proxy-agent';

const root = fileURLToPath(new URL('.', import.meta.url));
const dist = join(root, 'dist');
const port = Number(process.env.PORT || 8787);
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const proxyUrl = process.env.SOCKS5H_PROXY;
const telegramAgent = proxyUrl ? new SocksProxyAgent(proxyUrl) : undefined;
const cbrAgent = proxyUrl ? new SocksProxyAgent(proxyUrl) : undefined;
const bankRateUrl = process.env.BANK_RATE_URL;
const bankAdvantagePercent = Math.min(Math.max(Number(process.env.BANK_ADVANTAGE_PERCENT ?? 2), 0), 10);
// Positive values make the customer rate less favorable than the CBR reference rate.
const rateUpdateIntervalMs = Math.max(Number(process.env.RATE_UPDATE_INTERVAL_MS || 3600000), 60000);
const rateState = { rates: null, officialRubRates: null, updatedAt: null };
const xmlParser = new XMLParser({ ignoreAttributes: false });
const rateLimit = new Map();
const minimumLeadAmountCny = 500;

function requestText(url, agent) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      agent,
      timeout: 15000,
      headers: { 'User-Agent': 'mediusobmen.cc/1.0' },
    }, (response) => {
      let data = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) resolve(data);
        else reject(new Error(`HTTP ${response.statusCode} while loading rates`));
      });
    });
    request.on('timeout', () => request.destroy(new Error('Rates request timed out')));
    request.on('error', reject);
  });
}

async function updateRates() {
  try {
    const xml = await requestText('https://www.cbr.ru/scripts/XML_daily.asp', cbrAgent);
    const document = xmlParser.parse(xml);
    const valutes = Array.isArray(document?.ValCurs?.Valute)
      ? document.ValCurs.Valute
      : document?.ValCurs?.Valute ? [document.ValCurs.Valute] : [];
    const rubRates = { RUB: 1 };

    for (const currency of ['USD', 'CNY']) {
      const item = valutes.find((value) => value.CharCode === currency);
      const value = Number(String(item?.Value || '').replace(',', '.').replace(/\s/g, ''));
      const nominal = Number(item?.Nominal || 1);
      if (!Number.isFinite(value) || !Number.isFinite(nominal) || value <= 0 || nominal <= 0) {
        throw new Error(`Missing ${currency} rate from CBR response`);
      }
      rubRates[currency] = value / nominal;
    }

    const rates = {};
    for (const from of ['RUB', 'CNY', 'USD']) {
      for (const to of ['RUB', 'CNY', 'USD']) {
        rates[`${from}_${to}`] = Number((rubRates[from] / rubRates[to]).toFixed(8));
      }
    }

    // Use an approved bank-rate feed when configured. The feed must return
    // { buyCnyRub, sellCnyRub } in RUB per CNY. Otherwise CBR remains the fallback.
    let referenceBuyCnyRub = rubRates.CNY;
    let referenceSellCnyRub = rubRates.CNY;
    if (bankRateUrl) {
      try {
        const bankData = JSON.parse(await requestText(bankRateUrl, cbrAgent));
        if (Number.isFinite(Number(bankData.buyCnyRub)) && Number.isFinite(Number(bankData.sellCnyRub))) {
          referenceBuyCnyRub = Number(bankData.buyCnyRub);
          referenceSellCnyRub = Number(bankData.sellCnyRub);
        }
      } catch (error) {
        console.error(`Could not load bank rate feed: ${error.message}`);
      }
    }

    rates.RUB_CNY = Number((1 / referenceBuyCnyRub).toFixed(8));
    rates.CNY_RUB = Number(referenceSellCnyRub.toFixed(8));

    // Make the customer rate 2% better than the selected bank/CBR reference.
    const customerFactor = 1 + bankAdvantagePercent / 100;
    rates.RUB_CNY = Number((rates.RUB_CNY * customerFactor).toFixed(8));
    rates.CNY_RUB = Number((rates.CNY_RUB * customerFactor).toFixed(8));

    rateState.rates = rates;
    rateState.officialRubRates = rubRates;
    rateState.updatedAt = new Date().toISOString();
    console.log(`Rates updated at ${rateState.updatedAt}; bank advantage ${bankAdvantagePercent}%`);
  } catch (error) {
    console.error(`Could not update CBR rates: ${error.message}`);
  }
}

void updateRates();
const rateTimer = setInterval(updateRates, rateUpdateIntervalMs);
rateTimer.unref();

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

function json(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(body));
}

function clean(value, max = 500) {
  return typeof value === 'string' ? value.trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, max) : '';
}

function validateLead(body) {
  const name = clean(body.name, 100);
  const contact = clean(body.contact, 120);
  if (!contact || body.consent !== true) return { error: 'Укажите телефон или Telegram и подтвердите согласие' };
  if (clean(body.website)) return { error: 'Некорректная заявка' };
  const amount = Number(String(body.amount ?? '').replace(',', '.'));
  if (!Number.isFinite(amount) || amount < minimumLeadAmountCny) {
    return { error: `Минимальная сумма заявки — ${minimumLeadAmountCny} CNY` };
  }
  return { name, contact };
}

function formatMessage(body, lead, ip) {
  const lines = [
    'Новая заявка с сайта MediusObmen.cc',
    '',
    `Имя: ${lead.name || 'не указано'}`,
    `Телефон или Telegram: ${lead.contact}`,
  ];
  if (body.amount) lines.push(`Сумма: ${clean(body.amount, 40)} CNY`);
  if (body.paymentMethod) lines.push(`Способ оплаты: ${clean(body.paymentMethod, 100)}`);
  if (body.exchange && typeof body.exchange === 'object') {
    const exchange = body.exchange;
    lines.push('', 'Расчет:', `Отдаю: ${clean(String(exchange.fromAmount), 40)} ${clean(String(exchange.fromCurrency), 10)}`,
      `Получаю: ${clean(String(exchange.toAmount), 40)} ${clean(String(exchange.toCurrency), 10)}`,
      `Курс: 1 ${clean(String(exchange.fromCurrency), 10)} = ${clean(String(exchange.rate), 40)} ${clean(String(exchange.toCurrency), 10)}`,
      `Способ: ${clean(String(exchange.method), 100)}`,
      `Комиссия: ${clean(String(exchange.commissionPercent), 20)}%`);
  }
  const attribution = body.attribution && typeof body.attribution === 'object' ? body.attribution : {};
  const source = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'yclid']
    .filter((key) => attribution[key])
    .map((key) => `${key}=${clean(String(attribution[key]), 200)}`)
    .join(', ');
  if (source) lines.push('', `Реклама: ${source}`);
  lines.push('', `IP: ${ip}`);
  return lines.join('\n');
}

function sendTelegram(text) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true });
    const request = https.request({
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${encodeURIComponent(botToken)}/sendMessage`,
      method: 'POST',
      agent: telegramAgent,
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
      timeout: 15000,
    }, (response) => {
      let data = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) resolve();
        else reject(new Error(`Telegram API ${response.statusCode}: ${data.slice(0, 200)}`));
      });
    });
    request.on('timeout', () => request.destroy(new Error('Telegram request timed out')));
    request.on('error', reject);
    request.write(payload);
    request.end();
  });
}

async function readBody(req) {
  let size = 0;
  let raw = '';
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 32 * 1024) throw new Error('Payload too large');
    raw += chunk;
  }
  return JSON.parse(raw || '{}');
}

async function serveStatic(req, res) {
  const requested = req.url === '/' ? '/index.html' : new URL(req.url, 'http://localhost').pathname;
  const safePath = normalize(requested).replace(/^([.][.][\\/])+/, '');
  let filePath = join(dist, safePath);
  try {
    const info = await stat(filePath);
    if (info.isDirectory()) filePath = join(filePath, 'index.html');
  } catch {
    filePath = join(dist, 'index.html');
  }
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
    return res.end();
  }

  if (req.method === 'GET' && req.url === '/api/rates') {
    if (!rateState.rates) {
      return json(res, 200, {
        rates: null,
        officialRubRates: null,
        updatedAt: null,
        source: 'fallback',
        error: 'Курс ЦБ РФ пока не загружен',
      });
    }
    return json(res, 200, {
      rates: rateState.rates,
      officialRubRates: rateState.officialRubRates,
      updatedAt: rateState.updatedAt,
      source: 'https://www.cbr.ru/scripts/XML_daily.asp',
    });
  }

  if (req.method === 'POST' && req.url === '/api/leads') {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const recent = (rateLimit.get(ip) || []).filter((time) => now - time < 10 * 60 * 1000);
    if (recent.length >= 8) return json(res, 429, { error: 'Слишком много заявок. Попробуйте позже.' });
    recent.push(now);
    rateLimit.set(ip, recent);
    if (!botToken || !chatId) return json(res, 503, { error: 'Сервис заявок не настроен' });
    try {
      const body = await readBody(req);
      const lead = validateLead(body);
      if (lead.error) return json(res, 400, lead);
      await sendTelegram(formatMessage(body, lead, ip));
      return json(res, 200, { ok: true });
    } catch (error) {
      console.error(error);
      return json(res, 500, { error: 'Не удалось отправить заявку' });
    }
  }

  return serveStatic(req, res);
});

server.listen(port, () => {
  if (!botToken || !chatId) console.warn('TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are not configured');
  console.log(`MediusObmen.cc server listening on :${port}${proxyUrl ? ' via SOCKS5H' : ''}`);
});
