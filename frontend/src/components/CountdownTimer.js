import { useState, useEffect } from 'react';
import styles from '../styles/CountdownTimer.module.css';

export default function CountdownTimer({ 
  targetTime, 
  label = 'Time remaining', 
  size = 'normal',
  expiredMessage = 'Expired',
  onExpire = null
}) {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  
  useEffect(() => {
    if (!targetTime) return;
    
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = parseInt(targetTime) - now;
      
      if (remaining <= 0) {
        setTimeRemaining(expiredMessage);
        setIsExpired(true);
        
        // Call the onExpire callback if provided
        if (onExpire && typeof onExpire === 'function') {
          onExpire();
        }
        return;
      }
      
      // Calculate days, hours, minutes, seconds
      const days = Math.floor(remaining / 86400);
      const hours = Math.floor((remaining % 86400) / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;
      
      // Format the time
      const formattedTime = [
        days > 0 ? `${days}d` : '',
        (hours > 0 || days > 0) ? `${hours}h` : '',
        (minutes > 0 || hours > 0 || days > 0) ? `${minutes}m` : '',
        `${seconds}s`
      ].filter(Boolean).join(' ');
      
      setTimeRemaining(formattedTime);
    };
    
    // Initial update
    updateCountdown();
    
    // Set interval to update every second
    const interval = setInterval(updateCountdown, 1000);
    
    // Cleanup interval
    return () => clearInterval(interval);
  }, [targetTime, expiredMessage, onExpire]);
  
  const timerClass = size === 'large' 
    ? `${styles.countdownTimer} ${styles.large}` 
    : styles.countdownTimer;
  
  return (
    <div className={timerClass}>
      <div className={styles.label}>{label}</div>
      <div className={isExpired ? styles.expired : styles.time}>
        {timeRemaining}
      </div>
    </div>
  );
}