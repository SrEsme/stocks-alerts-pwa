import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { defineSecret } from "firebase-functions/params";

const DEFAULT_CHAT_ID = defineSecret("DEFAULT_CHAT_ID");
const TELEGRAM_TOKEN = defineSecret("TELEGRAM_TOKEN");
const FINN_HUB_API_KEY = defineSecret("FINN_HUB_API_KEY");
const COINGECKO_API_KEY = defineSecret("COINGECKO_API_KEY");

initializeApp();
const db = getFirestore();

// CoinGecko ticker-to-ID mapping
const CRYPTO_TICKER_TO_ID = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana'
};

// Scheduled function runs every 15 minutes (stocks only, Mon-Fri market hours)
export const minuteJob = onSchedule(
  {
    schedule: "*/15 15-22 * * 1-5",
    timeZone: "Europe/Madrid",
    secrets: [DEFAULT_CHAT_ID, TELEGRAM_TOKEN, FINN_HUB_API_KEY]
  },
  async (event) => {
    console.log(
      '🔔 minuteJob executed at ',
      new Date().toLocaleString('ca-ES', { timeZone: 'Europe/Madrid' })
    );

    try {
      // 1. Get active stock alerts (assetType is 'stock' or missing/undefined for backward compat)
      const snapshot = await db.collection('alerts').where('status', '==', 'active').get();
      const allAlerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Filter to stock alerts only (missing assetType = stock for backward compat)
      const alerts = allAlerts.filter(a => !a.assetType || a.assetType === 'stock');

      if (alerts.length === 0) {
        console.log('No active stock alerts');
        return;
      }

      // 2. Get unique tickers and prices
      const uniqueTickers = [...new Set(alerts.map(alert => alert.ticker))];
      console.log(`Processing ${alerts.length} stock alerts for ${uniqueTickers.length} unique tickers`);

      const pricesMap = await getCurrentPrices(uniqueTickers);

      // 3. Process alerts and send notifications
      await processAlerts(alerts, pricesMap);

    } catch (error) {
      logger.error('Error processing stock alerts:', error);
    }
  }
);

// Scheduled function for crypto alerts - runs every 15 minutes, 24/7
export const cryptoAlertJob = onSchedule(
  {
    schedule: "*/20 7-23 * * *",
    timeZone: "Europe/Madrid",
    secrets: [DEFAULT_CHAT_ID, TELEGRAM_TOKEN, COINGECKO_API_KEY]
  },
  async (event) => {
    console.log(
      '🪙 cryptoAlertJob executed at ',
      new Date().toLocaleString('ca-ES', { timeZone: 'Europe/Madrid' })
    );

    try {
      // 1. Get active crypto alerts only
      const snapshot = await db.collection('alerts')
        .where('assetType', '==', 'crypto')
        .where('status', '==', 'active')
        .get();
      const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (alerts.length === 0) {
        console.log('No active crypto alerts');
        return;
      }

      // 2. Get unique tickers and prices
      const uniqueTickers = [...new Set(alerts.map(alert => alert.ticker))];
      console.log(`Processing ${alerts.length} crypto alerts for ${uniqueTickers.length} unique tickers`);

      const pricesMap = await getCryptoPrices(uniqueTickers);

      // 3. Process alerts and send notifications
      await processAlerts(alerts, pricesMap);

    } catch (error) {
      logger.error('Error processing crypto alerts:', error);
    }
  }
);

// Shared alert processing logic
async function processAlerts(alerts, pricesMap) {
  const notificationsToSend = [];
  const alertsToUpdate = [];

  for (const alert of alerts) {
    const currentPrice = pricesMap[alert.ticker];

    if (!currentPrice) {
      console.warn(`Could not fetch price for ${alert.ticker}`);
      continue;
    }

    let shouldNotify = false;

    if (alert.typeOfAlert === 'ge' && currentPrice >= alert.price) {
      shouldNotify = true;
    } else if (alert.typeOfAlert === 'le' && currentPrice <= alert.price) {
      shouldNotify = true;
    }

    if (shouldNotify) {
      const direction = alert.typeOfAlert === 'ge' ? '📈' : '📉';
      const isCrypto = alert.assetType === 'crypto';
      const prefix = isCrypto ? '🪙 CRYPTO' : '';

      let message = `${direction}${prefix ? ' ' + prefix : ''} ALERT: ${alert.ticker}\n` +
                   `Current Price: $${currentPrice}\n` +
                   `Target: $${alert.price}`;

      if (alert.note) {
        message += `\n\n📝 ${alert.note}`;
      }

      notificationsToSend.push({
        text: message,
        ticker: alert.ticker
      });

      alertsToUpdate.push({
        id: alert.id,
        triggeredAt: new Date(),
        triggeredPrice: currentPrice
      });
    }
  }

  if (notificationsToSend.length === 0) {
    console.log('No alerts triggered');
    return;
  }

  // Send Telegram notifications
  console.log(`🚀 Sending ${notificationsToSend.length} Telegram notifications...`);
  for (const item of notificationsToSend) {
    try {
      await sendTelegram(item.text);
      console.log(`✅ Telegram alert for ${item.ticker} sent`);
    } catch (error) {
      console.error(`❌ Error sending Telegram for ${item.ticker}:`, error);
    }
  }

  // Update alerts in Firestore
  const updatePromises = alertsToUpdate.map(alert =>
    db.collection('alerts').doc(alert.id).update({
      status: 'triggered',
      triggeredAt: alert.triggeredAt,
      triggeredPrice: alert.triggeredPrice
    })
  );

  await Promise.allSettled(updatePromises);
  console.log(`✅ Successfully updated ${alertsToUpdate.length} alerts`);
}

// Get price for a single ticker (HTTP) - supports both stock and crypto
export const getStockPrice = onRequest({
  cors: true,
  secrets: [FINN_HUB_API_KEY, COINGECKO_API_KEY]
}, async (req, res) => {
  const ticker = req.query.ticker;
  const assetType = req.query.assetType || 'stock';

  if (!ticker) {
    return res.status(400).json({ success: false, error: 'Ticker is required' });
  }

  try {
    const upperTicker = ticker.toUpperCase();
    console.log(`🔍 Price fetch for: ${upperTicker} (${assetType})`);

    let price;
    if (assetType === 'crypto') {
      const pricesMap = await getCryptoPrices([upperTicker]);
      price = pricesMap[upperTicker];
    } else {
      const pricesMap = await getCurrentPrices([upperTicker]);
      price = pricesMap[upperTicker];
    }

    if (price === undefined) {
      return res.status(404).json({ success: false, error: 'Price not found' });
    }

    return res.status(200).json({
      success: true,
      ticker: upperTicker,
      price: price
    });
  } catch (error) {
    console.error('Error fetching price:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fetch a small batch of Finnhub quotes for the authenticated app's dashboard.
export const getStockQuotes = onRequest({
  cors: true,
  secrets: [FINN_HUB_API_KEY]
}, async (req, res) => {
  const authorization = req.headers.authorization || '';
  if (!authorization.startsWith('Bearer ')) return res.status(401).json({ success: false, error: 'Authentication required' });
  try {
    await getAuth().verifyIdToken(authorization.slice(7));
  } catch {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const rawTickers = String(req.query.tickers || '');
  const tickers = [...new Set(rawTickers.split(',').map(ticker => ticker.trim().toUpperCase()).filter(Boolean))];
  if (tickers.length === 0) return res.status(400).json({ success: false, error: 'Tickers are required' });
  if (tickers.length > 20 || tickers.some(ticker => !/^[A-Z0-9.^-]{1,15}$/.test(ticker))) {
    return res.status(400).json({ success: false, error: 'Provide up to 20 valid ticker symbols' });
  }

  try {
    const quotes = {};
    await Promise.all(tickers.map(async ticker => {
      const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(ticker)}&token=${FINN_HUB_API_KEY.value()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Quote provider returned ${response.status}`);
      const data = await response.json();
      if (typeof data.c === 'number' && data.c > 0) {
        quotes[ticker] = { price: data.c, change: data.d ?? 0, changePercent: data.dp ?? 0, high: data.h, low: data.l, open: data.o, previousClose: data.pc };
      }
    }));
    return res.status(200).json({ success: true, quotes });
  } catch (error) {
    logger.error('Error fetching stock quotes:', error);
    return res.status(502).json({ success: false, error: 'Could not fetch stock quotes' });
  }
});

// Fetch prices from FinnHub API (stocks)
async function getCurrentPrices(tickers) {
  try {
    const pricesMap = {};
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    for (const ticker of tickers) {
      const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(ticker)}&token=${FINN_HUB_API_KEY.value()}`;
      console.log(`Fetching stock price for ${ticker}...`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error fetching price for ${ticker}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data && typeof data.c === 'number') {
        pricesMap[ticker] = data.c;
        console.log(`Price for ${ticker}: ${data.c}`);
      }

      if (tickers.indexOf(ticker) < tickers.length - 1) {
        await delay(1000);
      }
    }

    return pricesMap;
  } catch (error) {
    logger.error('Error fetching stock prices:', error);
    throw error;
  }
}

// Fetch prices from CoinGecko API (crypto)
async function getCryptoPrices(tickers) {
  try {
    const pricesMap = {};

    // Map tickers to CoinGecko IDs
    const ids = tickers
      .map(t => CRYPTO_TICKER_TO_ID[t])
      .filter(Boolean);

    if (ids.length === 0) {
      console.warn('No valid crypto tickers found:', tickers);
      return pricesMap;
    }

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`;
    console.log(`Fetching crypto prices from CoinGecko...`);

    const response = await fetch(url, {
      headers: {
        'x-cg-demo-api-key': COINGECKO_API_KEY.value()
      }
    });
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Map back from CoinGecko IDs to tickers
    for (const ticker of tickers) {
      const coinId = CRYPTO_TICKER_TO_ID[ticker];
      if (coinId && data[coinId] && typeof data[coinId].usd === 'number') {
        pricesMap[ticker] = data[coinId].usd;
        console.log(`Crypto price for ${ticker}: ${data[coinId].usd}`);
      }
    }

    return pricesMap;
  } catch (error) {
    logger.error('Error fetching crypto prices:', error);
    throw error;
  }
}

// Send message to Telegram
async function sendTelegram(text, chatId = DEFAULT_CHAT_ID.value()) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN.value()}/sendMessage`;
  const body = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML'
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.description || "Telegram API Error");
  }
  return data;
}
