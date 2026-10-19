import React, { useState, useEffect } from 'react';
import './RefreshCountdown.css';

export const RefreshCountdown: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const currentDay = now.getDay(); // 0 is Sunday, 6 is Saturday
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Check if we are within the cron window: Mon-Fri (1-5), 15:00 - 21:00
      const isWeekDay = currentDay >= 1 && currentDay <= 5;
      const isWorkingHours = currentHour >= 15 && currentHour < 21;

      if (!isWeekDay || !isWorkingHours) {
        return 'Market Closed';
      }

      // If in window, calculate next :00, :20, :40
      const nextIntervalMinute = Math.ceil((currentMinute + 0.1) / 20) * 20;
      
      let targetMinute = nextIntervalMinute;
      let targetHour = currentHour;

      if (targetMinute === 60) {
        targetMinute = 0;
        targetHour += 1;
      }

      const target = new Date(now);
      target.setHours(targetHour, targetMinute, 0, 0);

      const diff = target.getTime() - now.getTime();
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      return `${minutes}m ${seconds}s`;
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (timeLeft === 'Market Closed') {
    return (
      <div className="refresh-countdown closed">
        <span className="countdown-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </span>
        <span className="countdown-label">Next Check:</span>
        <span className="countdown-time">Mon-Fri 15-21h</span>
      </div>
    );
  }

  return (
    <div className="refresh-countdown">
      <div className="countdown-pulse"></div>
      <span className="countdown-label">Next Check:</span>
      <span className="countdown-time">{timeLeft}</span>
    </div>
  );
};
