# Stock Alerts

A self-hosted market watchlist and price alert progressive web app. Track stocks and selected cryptocurrencies, set target prices, keep notes about your plan, and receive Telegram messages when a target is reached.

The frontend uses React, TypeScript, and Vite. Firebase provides email/password authentication, Firestore, Storage, Hosting, and scheduled Cloud Functions.

## What the app currently does

- Create stock alerts and crypto alerts for BTC, ETH, and SOL.
- Set an alert for when a price is at or above, or at or below, a target.
- Keep a personal watchlist with an entry price, target price, thesis, optional image, and custom order.
- See a dashboard summary, active alerts, and triggered alert history.
- See live stock quotes, daily price changes, and distance to watchlist targets.
- Send alert messages through one Telegram bot and one configured chat.
- Install the site as a PWA from a supported browser.

### Important: notification delivery is shared

`DEFAULT_CHAT_ID` is one Firebase Functions secret for the whole deployment. The scheduled jobs read active alerts across the entire Firestore project and send every triggered alert to that single Telegram chat. Alert notes are included in the message. The destination is not connected to the user account that created the alert.

This setup is suitable for a private, single-owner deployment. Do not invite other people to create accounts on a public deployment: their alerts and notes would be sent to the owner’s Telegram chat. Per-user Telegram destinations and browser push notifications are not implemented.

Alerts are checked on a schedule, so notification delivery is not real time. Stock checks run every 15 minutes from 15:00 through 22:45, Monday to Friday, in `Europe/Madrid`. Crypto checks run every 20 minutes from 07:00 through 23:40 every day in `Europe/Madrid`. A notification can arrive after the target is first reached. Failed Telegram sends are logged, but the alert is still marked as triggered; inspect and change that behavior before relying on alerts for anything time-critical.

The PWA shows an informational countdown to the next scheduled stock and crypto checks. It only updates in the browser and does not call Firebase or change the schedule. The Cloud Scheduler schedules themselves determine scheduled-function usage: with the current cron rules, the stock job runs 32 times per weekday (up to 160 times per week) and the crypto job runs 51 times per day (357 times per week), even when there are no matching active alerts. Together that is up to 517 scheduled executions per week. Separately, each open signed-in PWA refreshes live stock quotes every five minutes while it has tickers to show, invoking the `getStockQuotes` HTTP function; ticker lookups can invoke `getStockPrice`. Review Firebase pricing and quotas and set a billing budget before deploying.

Stock prices are fetched from Finnhub and crypto prices from CoinGecko. The alert message formats prices as USD. The app dashboard fetches current stock quotes from Finnhub; crypto live quotes are not yet shown in the dashboard. Historical charts, browser push notifications, multiple watchlists, and per-user notification settings are not implemented.

## Requirements

- Node.js 22 or later and npm.
- A Firebase project with Authentication, Firestore, Storage, Hosting, and Cloud Functions enabled.
- Firebase CLI (`npm install -g firebase-tools`).
- A Telegram bot and chat for notifications.
- Finnhub and CoinGecko API keys.

Cloud Functions currently requires a Firebase project on the Blaze pay-as-you-go plan. Scheduled functions also use Cloud Scheduler. Review Firebase’s current [Cloud Functions pricing and quotas](https://firebase.google.com/docs/functions/quotas) and [scheduled functions documentation](https://firebase.google.com/docs/functions/schedule-functions) before deploying, and set a budget alert in Google Cloud Billing.

## Set up your own PWA

### 1. Create a Firebase project

1. Create a new project in the [Firebase console](https://console.firebase.google.com/).
2. Enable billing as required for Cloud Functions and scheduled jobs.
3. In **Project settings → General**, add a **Web app**. You do not need to enable Firebase Hosting at this point.
4. Copy the Firebase web app configuration. These web configuration values are used by the client and are not server credentials; access is controlled by Firebase Authentication, Security Rules, and API-key restrictions.

### 2. Enable the Firebase services

In the Firebase console:

1. **Authentication → Sign-in method**: enable **Email/Password**.
2. **Authentication → Settings → Authorized domains**: make sure `localhost` and your eventual Hosting/custom domain are listed.
3. **Firestore Database**: create a database. The supplied Security Rules restrict app collections to the signed-in owner of each document.
4. **Storage**: enable Cloud Storage. Watchlist images are limited by the supplied Storage Rules to images under 5 MB in each user’s folder.
5. Keep the Functions region at `us-central1` unless you also update the URL builder in `src/config/functions.ts`.

### 3. Configure the frontend

From the project root:

```sh
npm install
cp .env.example .env
```

Fill in `.env` with your own Firebase web app values:

```dotenv
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

`VITE_FIREBASE_MEASUREMENT_ID` can be left blank if you do not use Analytics. Do not commit `.env`.

### 4. Point the Firebase CLI at your project

```sh
firebase login
firebase projects:list
firebase use --add
```

Choose the project you created and give it the local alias `default`. This writes `.firebaserc`, which is intentionally ignored so the repository does not point at someone else’s Firebase project.

### 5. Configure price and Telegram credentials

Create a Finnhub API key and a CoinGecko API key. Create a Telegram bot with BotFather, start a chat with the bot, and obtain the numeric chat ID that should receive alerts.

Store each value as a Firebase Functions secret. The CLI prompts for the value; do not put secret values in the repository:

```sh
firebase functions:secrets:set TELEGRAM_TOKEN
firebase functions:secrets:set DEFAULT_CHAT_ID
firebase functions:secrets:set FINN_HUB_API_KEY
firebase functions:secrets:set COINGECKO_API_KEY
```

The functions bind these secrets at runtime. Firebase requires a secret to be explicitly bound to each function that reads it; see the official [Functions secrets setup](https://firebase.google.com/docs/functions/config-env#secret-parameters).

For local emulator work, create `functions/.secret.local` with the same variable names and local test values. This file is ignored by Git. Do not copy production secrets into a public repository.

### 6. Install dependencies and deploy the backend

```sh
npm ci
npm ci --prefix functions
firebase deploy --only firestore,storage,functions
```

This deploys Firestore rules and indexes, Storage rules, and Cloud Functions. The app currently uses a single `us-central1` region for Functions.

### 7. Build and deploy the PWA

```sh
npm run build
firebase deploy --only hosting
```

Firebase Hosting serves the static project overview at `/` and the PWA at `/pwa/`. Create the first email/password user in **Firebase Console → Authentication → Users**, then open `/pwa/` and sign in. Add a watchlist item and create a small test alert. Make sure the Telegram bot can message the configured chat before testing notifications.

The project overview is served at `/`. The PWA, including its own product landing page and sign-in, is served separately at `/pwa/`.

To run the frontend locally after setting up Firebase:

```sh
npm run dev
```

Open the local project overview at `https://localhost:5173/` and the PWA at `https://localhost:5173/pwa/`.

The local frontend uses the Firebase project and deployed Functions URL configured above. The Firebase Emulator Suite is not fully wired into the frontend yet.

## Notification and deployment cautions

- This repository enables public email/password sign-up. In the current backend, any account can create alerts that are sent to the one shared Telegram chat.
- `getStockPrice` is an unauthenticated HTTP function and can consume your Finnhub or CoinGecko quota. Add authentication, App Check, or rate limiting before operating a public multi-user service.
- The built-in web API key is not a substitute for Security Rules. Review and test the supplied Firestore and Storage Rules in your own Firebase project.
- Scheduled checks can be delayed or fail because of scheduler timing, provider limits, or Telegram availability. The app is not a trading system and does not provide investment advice.

## Project layout

- `src/` — React UI, authentication, data hooks, and Firebase client configuration.
- `index.html` and `public/project-landing.css` — independent, static project overview.
- `pwa/index.html` — PWA entry point; its own product landing and sign-in are part of the React app.
- `functions/` — scheduled alert processing, Telegram delivery, and price lookup.
- `firestore.rules`, `storage.rules` — Firebase access rules.
- `firebase.json`, `firestore.indexes.json` — Firebase deployment configuration.

## License

No license has been selected yet. Until one is added, the source is available to inspect, but permission to reuse or redistribute it is not granted.
