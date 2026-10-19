# Stock Alerts

A personal market watchlist and price alert app for stocks and selected cryptocurrencies. Track assets, set target prices, keep notes about your plan, and receive Telegram messages when an alert is triggered.

The app is a React, TypeScript, and Vite progressive web app. Firebase provides authentication, Firestore, Storage, and scheduled Cloud Functions.

## Features

- Create alerts for stock and cryptocurrency prices.
- Organize stocks and supported cryptocurrencies in a watchlist.
- Save entry prices, target prices, notes, and optional images with watchlist items.
- Receive Telegram alerts when a target is reached.
- Install the app as a PWA and use it on mobile or desktop.

Stock prices use Finnhub. Crypto alerts currently support BTC, ETH, and SOL through CoinGecko.

## Run locally

Requirements: Node.js 22 or later, npm, and a Firebase project configured for Authentication, Firestore, and Storage.

1. Install dependencies:

   ```sh
   npm install
   npm --prefix functions install
   ```

2. Copy `.env.example` to `.env` and fill in the Firebase web app configuration from your own Firebase project.

3. Start the Vite development server:

   ```sh
   npm run dev
   ```

To build the web app, run `npm run build`. To check lint rules, run `npm run lint`.

## Firebase setup

Create a Firebase project and enable Email/Password Authentication, Cloud Firestore, and Cloud Storage. Deploy the provided Firestore rules, Storage rules, indexes, and functions to your own project. Review the rules and function endpoints before deploying them to a production project.

The scheduled Cloud Functions require these Firebase secrets:

| Secret | Purpose |
| --- | --- |
| `TELEGRAM_TOKEN` | Telegram bot token used to send alert messages |
| `DEFAULT_CHAT_ID` | Telegram chat that receives alert messages |
| `FINN_HUB_API_KEY` | Finnhub API key for stock prices |
| `COINGECKO_API_KEY` | CoinGecko API key for cryptocurrency prices |

Set each secret in your own Firebase project with `firebase functions:secrets:set SECRET_NAME`. Do not commit `.env`, service account credentials, or secret values. The sample files contain placeholders only.

## Project structure

- `src/` — React app, UI components, authentication, and Firestore hooks.
- `functions/` — scheduled alert processing and price lookup Cloud Functions.
- `firestore.rules`, `storage.rules` — Firebase access rules.
- `firebase.json`, `firestore.indexes.json` — Firebase deployment configuration.

## License

No license has been selected yet. Until a license is added, the source is visible for review but reuse and redistribution are not granted.
