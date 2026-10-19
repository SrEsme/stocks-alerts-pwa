import { useEffect, useState } from 'react';
import './RefreshCountdown.css';

type Job = 'stocks' | 'crypto';

const madridClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Madrid',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23'
});

function getNextCheck(job: Job, from = Date.now()) {
  // Both cron schedules fire on minutes divisible by five. Search a week
  // ahead so weekends and the stock market's quiet hours are handled correctly.
  const firstCandidate = Math.floor(from / 300_000) * 300_000 + 300_000;
  for (let step = 0; step <= 8 * 24 * 12; step += 1) {
    const timestamp = firstCandidate + step * 300_000;
    const parts = Object.fromEntries(madridClock.formatToParts(timestamp).map(({ type, value }) => [type, value]));
    const hour = Number(parts.hour);
    const minute = Number(parts.minute);
    const weekday = parts.weekday;
    const isStockCheck = job === 'stocks'
      && weekday !== 'Sat' && weekday !== 'Sun'
      && hour >= 15 && hour <= 22 && minute % 15 === 0;
    const isCryptoCheck = job === 'crypto'
      && hour >= 7 && hour <= 23 && minute % 20 === 0;
    if (isStockCheck || isCryptoCheck) return timestamp;
  }
  return firstCandidate;
}

function formatRemaining(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours) return `${hours}h ${minutes}m`;
  if (minutes) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export const RefreshCountdown = () => {
  const [now, setNow] = useState(Date.now());
  const [checks, setChecks] = useState(() => ({
    stocks: getNextCheck('stocks'),
    crypto: getNextCheck('crypto')
  }));

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (now >= checks.stocks || now >= checks.crypto) {
      setChecks({ stocks: getNextCheck('stocks', now), crypto: getNextCheck('crypto', now) });
    }
  }, [now, checks]);

  return (
    <aside className="refresh-countdown" aria-label="Next scheduled alert checks">
      <span className="countdown-clock" aria-hidden="true">◷</span>
      <span className="countdown-title">Next alert checks</span>
      <span className="countdown-job">Stocks <strong>{formatRemaining(checks.stocks - now)}</strong></span>
      <span className="countdown-separator" aria-hidden="true">·</span>
      <span className="countdown-job">Crypto <strong>{formatRemaining(checks.crypto - now)}</strong></span>
      <span className="countdown-timezone">Europe/Madrid</span>
    </aside>
  );
};
