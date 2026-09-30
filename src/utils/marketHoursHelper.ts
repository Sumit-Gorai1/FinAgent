/**
 * Market Hours & Trading Session Status Helper
 * Provides real-time market session status for Indian Stock Exchanges (NSE / BSE)
 * Normal Trading Hours: Monday to Friday, 09:15 to 15:30 IST
 */

export interface MarketSessionStatus {
  isOpen: boolean;
  isRegularHoursToday: boolean;
  status: 'OPEN' | 'CLOSED' | 'PRE_OPEN' | 'POST_CLOSE';
  formattedTime: string;
  sessionDescription: string;
  hoursDescription: string;
  nextSessionText: string;
}

/**
 * Calculates current Indian Market (NSE / BSE) trading session status in IST (UTC+5:30)
 */
export function getIndianMarketStatus(): MarketSessionStatus {
  const now = new Date();
  // Get time in IST (UTC+5:30)
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const istDate = new Date(utcMs + 3600000 * 5.5);

  const day = istDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const isWeekday = day >= 1 && day <= 5;
  // Indian Normal Trading: 09:15 (555 mins) to 15:30 (930 mins) IST
  let status: 'OPEN' | 'CLOSED' | 'PRE_OPEN' | 'POST_CLOSE' = 'CLOSED';
  let isOpen = false;

  if (isWeekday) {
    if (totalMinutes >= 555 && totalMinutes < 930) {
      status = 'OPEN';
      isOpen = true;
    } else if (totalMinutes >= 540 && totalMinutes < 555) {
      status = 'PRE_OPEN';
    } else if (totalMinutes >= 940 && totalMinutes < 960) {
      status = 'POST_CLOSE';
    } else {
      status = 'CLOSED';
    }
  }

  const formattedTime = istDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  let sessionDescription = 'Markets Closed';
  let nextSessionText = 'Opens at 09:15 AM IST';

  if (isOpen) {
    sessionDescription = 'Market Open (Live Trading)';
    nextSessionText = 'Closes today at 03:30 PM IST';
  } else if (!isWeekday) {
    sessionDescription = 'Weekend Closed';
    nextSessionText = 'Reopens Monday at 09:15 AM IST';
  } else if (totalMinutes < 555) {
    sessionDescription = 'Pre-Market / Closed';
    nextSessionText = 'Opens today at 09:15 AM IST';
  } else {
    sessionDescription = 'Market Over (Closed)';
    nextSessionText = 'Reopens tomorrow at 09:15 AM IST';
  }

  return {
    isOpen,
    isRegularHoursToday: isWeekday,
    status,
    formattedTime,
    sessionDescription,
    hoursDescription: '09:15 – 15:30 IST (Mon–Fri)',
    nextSessionText,
  };
}

/**
 * Helper to determine if real-time order depth should be displayed for the active instrument.
 * For Indian equities (NSE/BSE, currency ₹, or default), order depth is ONLY displayed
 * when markets are open (09:15 - 15:30 IST).
 */
export function isOrderDepthActiveForStock(symbol?: string, currency?: string): boolean {
  // If US stock
  if (currency === '$' || symbol === 'AAPL' || symbol === 'NVDA' || symbol === 'MSFT') {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const estDate = new Date(utcMs - 3600000 * 4); // EDT UTC-4
    const day = estDate.getDay();
    const mins = estDate.getHours() * 60 + estDate.getMinutes();
    return day >= 1 && day <= 5 && mins >= 570 && mins < 960;
  }

  // Indian equities: only active when market is open
  return getIndianMarketStatus().isOpen;
}
