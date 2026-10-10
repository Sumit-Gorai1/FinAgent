import React from 'react';
import { Header } from './components/Header';
import { StockResearchView } from './components/StockResearchView';
import { WorkflowVisualizer } from './components/WorkflowVisualizer';
import { WatchlistMonitor } from './components/WatchlistMonitor';
import { PortfolioIntelligence } from './components/PortfolioIntelligence';
import { PaperTradingLab } from './components/PaperTradingLab';
import { ComplianceModal } from './components/ComplianceModal';
import { mockStocksCatalog, defaultWatchlist, defaultPortfolio } from './data/mockStocks';
import { getOrCreateStockData } from './utils/stockDataHelper';
import { resolveStockQuery } from './utils/stockSearchResolver';
import { StockResearchData, WatchlistItem, PortfolioHolding, PaperOrder, TriggerEvent, PriceAlert, PriceAlertNotification, UserProfile } from './types';
import { PriceAlertNotificationBanner } from './components/PriceAlertNotificationBanner';
import { BugAgentModal } from './components/BugAgentModal';
import { NseBsePipelineModal } from './components/NseBsePipelineModal';
import { AuthModal } from './components/AuthModal';
import { DynamicMarketStrip } from './components/DynamicMarketStrip';
import { IndianExchangeStocksModal } from './components/IndianExchangeStocksModal';
import { IndianStocksDirectoryView } from './components/IndianStocksDirectoryView';
import { SectorHeatmap } from './components/SectorHeatmap';
import { DashboardSnapshotsModal } from './components/DashboardSnapshotsModal';
import { DynamicBackgroundVideo } from './components/DynamicBackgroundVideo';
import { playAlertChime } from './utils/soundAlert';

export default function App() {
  const [activeView, setActiveView] = React.useState<
    'research' | 'workflow' | 'watchlist' | 'portfolio' | 'papertrading' | 'all-stocks' | 'sectors'
  >('research');

  const [stocks, setStocks] = React.useState<Record<string, StockResearchData>>(() => {
    const initial = { ...mockStocksCatalog };
    const SECTOR_BENCHMARKS = [
      'INFY', 'ICICIBANK', 'SBIN', 'AXISBANK', 'KOTAKBANK', 'BAJFINANCE',
      'MARUTI', 'WIPRO', 'ITC', 'HINDUNILVR', 'TITAN', 'TRENT',
      'SUNPHARMA', 'CIPLA', 'DRREDDY', 'LT', 'BHARTIARTL',
      'ONGC', 'NTPC', 'COALINDIA', 'TATAPOWER', 'TATASTEEL', 'JSWSTEEL',
      'HAL', 'BEL', 'ZOMATO', 'DIXON',
    ];
    for (const sym of SECTOR_BENCHMARKS) {
      if (!initial[sym]) {
        try {
          initial[sym] = getOrCreateStockData(sym, initial);
        } catch {}
      }
    }
    return initial;
  });
  const [selectedSymbol, setSelectedSymbol] = React.useState<string>('RELIANCE');
  const [watchlist, setWatchlist] = React.useState<WatchlistItem[]>(() => {
    try {
      const saved = localStorage.getItem('finagent_watchlist');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved watchlist', e);
    }
    return defaultWatchlist;
  });
  const [holdings, setHoldings] = React.useState<PortfolioHolding[]>(() => {
    try {
      const saved = localStorage.getItem('finagent_portfolio_holdings');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved portfolio holdings', e);
    }
    return defaultPortfolio;
  });
  const [cashBalance, setCashBalance] = React.useState<number>(() => {
    try {
      const saved = localStorage.getItem('finagent_cash_balance');
      if (saved !== null) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0) return parsed;
      }
    } catch {}
    return 1000000; // 10 Lakhs Virtual INR
  });
  const [lastSavedTimestamp, setLastSavedTimestamp] = React.useState<string>(() => {
    try {
      return (
        localStorage.getItem('finagent_portfolio_saved_time') ||
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    } catch {
      return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  });
  const [portfolioNotice, setPortfolioNotice] = React.useState<string>('');
  const [showBugAgentModal, setShowBugAgentModal] = React.useState<boolean>(false);
  const [showPipelineModal, setShowPipelineModal] = React.useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = React.useState<boolean>(false);
  const [showIndianStocksModal, setShowIndianStocksModal] = React.useState<boolean>(false);
  const [showSnapshotsModal, setShowSnapshotsModal] = React.useState<boolean>(false);

  // Auto-save portfolio holdings and cash balance changes to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('finagent_portfolio_holdings', JSON.stringify(holdings));
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      localStorage.setItem('finagent_portfolio_saved_time', nowStr);
      setLastSavedTimestamp(nowStr);
    } catch (e) {
      console.warn('Failed to save portfolio holdings', e);
    }
  }, [holdings]);

  React.useEffect(() => {
    try {
      localStorage.setItem('finagent_cash_balance', cashBalance.toString());
    } catch {}
  }, [cashBalance]);

  const handleManualSavePortfolio = () => {
    try {
      localStorage.setItem('finagent_portfolio_holdings', JSON.stringify(holdings));
      localStorage.setItem('finagent_cash_balance', cashBalance.toString());
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      localStorage.setItem('finagent_portfolio_saved_time', nowStr);
      setLastSavedTimestamp(nowStr);
      setPortfolioNotice(`Portfolio saved successfully to device at ${nowStr}!`);
      setTimeout(() => setPortfolioNotice(''), 3500);
    } catch (e) {
      console.warn('Failed to save portfolio manually', e);
    }
  };

  const handleResetPortfolio = () => {
    setHoldings(defaultPortfolio);
    setCashBalance(1000000);
    try {
      localStorage.setItem('finagent_portfolio_holdings', JSON.stringify(defaultPortfolio));
      localStorage.setItem('finagent_cash_balance', '1000000');
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      localStorage.setItem('finagent_portfolio_saved_time', nowStr);
      setLastSavedTimestamp(nowStr);
      setPortfolioNotice('Portfolio reset to default benchmark and saved.');
      setTimeout(() => setPortfolioNotice(''), 3500);
    } catch {}
  };

  // Auto-save watchlist changes to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('finagent_watchlist', JSON.stringify(watchlist));
    } catch (e) {
      console.warn('Failed to save watchlist to localStorage', e);
    }
  }, [watchlist]);

  const handleAddToWatchlist = (item: WatchlistItem) => {
    setWatchlist((prev) => {
      if (prev.some((w) => w.symbol.toUpperCase() === item.symbol.toUpperCase())) {
        return prev;
      }
      return [item, ...prev];
    });
  };

  const handleRemoveFromWatchlist = (symbol: string) => {
    setWatchlist((prev) => prev.filter((w) => w.symbol.toUpperCase() !== symbol.toUpperCase()));
  };

  const handleResetWatchlist = () => {
    setWatchlist(defaultWatchlist);
    try {
      localStorage.setItem('finagent_watchlist', JSON.stringify(defaultWatchlist));
    } catch {}
  };
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('finagent_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('finagent_user', JSON.stringify(user));
    } catch {}
  };

  const handleLogout = () => {
    try {
      const token = localStorage.getItem('finagent_auth_token');
      localStorage.removeItem('finagent_user');
      localStorage.removeItem('finagent_auth_token');
      if (token) {
        fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    } catch {}
    setCurrentUser(null);
  };

  // Sync and validate authentication session on mount
  React.useEffect(() => {
    try {
      const token = localStorage.getItem('finagent_auth_token');
      const savedUserStr = localStorage.getItem('finagent_user');
      const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
      if (token) {
        fetch(`/api/auth/me?email=${encodeURIComponent(savedUser?.email || '')}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.authenticated && data.user) {
              setCurrentUser(data.user);
              localStorage.setItem('finagent_user', JSON.stringify(data.user));
            }
          })
          .catch(() => {});
      }
    } catch {}
  }, []);

  const [paperOrders, setPaperOrders] = React.useState<PaperOrder[]>([
    {
      id: 'ORD-78901',
      symbol: 'RELIANCE',
      type: 'BUY',
      shares: 30,
      price: 1245.0,
      totalAmount: 37350,
      timestamp: '09:35 AM',
      reason: 'AI Committee High Conviction Breakout Signal',
    },
    {
      id: 'ORD-78902',
      symbol: 'HDFCBANK',
      type: 'BUY',
      shares: 50,
      price: 702.5,
      totalAmount: 35125,
      timestamp: '11:15 AM',
      reason: 'NIM Stabilization & Low Credit Risk Setup',
    },
  ]);

  const [recentAlerts, setRecentAlerts] = React.useState<
    {
      id: string;
      symbol: string;
      type: string;
      message: string;
      timestamp: string;
      severity: 'info' | 'warning' | 'critical';
    }[]
  >([
    {
      id: 'ALT-1',
      symbol: 'TCS',
      type: 'THESIS_SHIFT',
      message:
        '🚨 THESIS CHANGE ALERT: Research Score downgraded from 76 to 66. Operating margin compressed 45 bps; price breached 50-day SMA on heavy distribution.',
      timestamp: '14:20 PM',
      severity: 'critical',
    },
    {
      id: 'ALT-2',
      symbol: 'RELIANCE',
      type: 'CATALYST_EVENT',
      message:
        '🟢 POSITIVE MOMENTUM: New Energy segment receives pilot commissioning green flag. Bull Agent target upside reaffirmed at +22%.',
      timestamp: '10:05 AM',
      severity: 'info',
    },
  ]);

  // Custom Price Threshold Alerts state calibrated to actual market levels
  const [priceAlerts, setPriceAlerts] = React.useState<PriceAlert[]>([
    {
      id: 'PAL-101',
      symbol: 'RELIANCE',
      stockName: 'Reliance Industries Limited',
      targetPrice: 1300,
      condition: 'ABOVE',
      createdPrice: 1257.5,
      createdAt: '10:15 AM',
      status: 'ACTIVE',
      note: 'Breakout confirmation past key supply resistance',
    },
    {
      id: 'PAL-102',
      symbol: 'RELIANCE',
      stockName: 'Reliance Industries Limited',
      targetPrice: 1220,
      condition: 'BELOW',
      createdPrice: 1257.5,
      createdAt: '10:18 AM',
      status: 'ACTIVE',
      note: '50-Day Moving Average support invalidation stop-loss',
    },
    {
      id: 'PAL-103',
      symbol: 'HDFCBANK',
      stockName: 'HDFC Bank Limited',
      targetPrice: 730,
      condition: 'ABOVE',
      createdPrice: 708.25,
      createdAt: '11:00 AM',
      status: 'ACTIVE',
      note: 'NIM expansion momentum target',
    },
    {
      id: 'PAL-104',
      symbol: 'TCS',
      stockName: 'Tata Consultancy Services',
      targetPrice: 2160,
      condition: 'BELOW',
      createdPrice: 2200.8,
      createdAt: '09:45 AM',
      status: 'ACTIVE',
      note: 'Key support breach monitor',
    },
  ]);

  // Active Real-time Alert Notification Toasts
  const [alertNotifications, setAlertNotifications] = React.useState<PriceAlertNotification[]>([]);

  // Ref to always access latest priceAlerts synchronously in pulse interval
  const priceAlertsRef = React.useRef(priceAlerts);
  React.useEffect(() => {
    priceAlertsRef.current = priceAlerts;
  }, [priceAlerts]);

  // Price Alert Handlers
  const handleAddPriceAlert = (newAlert: Omit<PriceAlert, 'id' | 'createdAt' | 'status'>) => {
    const alertId = 'PAL-' + Date.now().toString().slice(-5);
    const created: PriceAlert = {
      ...newAlert,
      id: alertId,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'ACTIVE',
    };
    setPriceAlerts((prev) => [created, ...prev]);
  };

  const handleDeletePriceAlert = (alertId: string) => {
    setPriceAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  const handleTriggerSimulatedAlert = (alert: PriceAlert) => {
    const currPrice = alert.triggeredPrice || alert.targetPrice;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Mark as triggered in alerts state
    setPriceAlerts((prev) =>
      prev.map((a) =>
        a.id === alert.id
          ? {
              ...a,
              status: 'TRIGGERED',
              triggeredAt: nowTime,
              triggeredPrice: currPrice,
            }
          : a
      )
    );

    // Push to notification banner queue with guaranteed unique ID
    const notif: PriceAlertNotification = {
      id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      alertId: alert.id,
      symbol: alert.symbol,
      targetPrice: alert.targetPrice,
      condition: alert.condition,
      currentPrice: currPrice,
      timestamp: nowTime,
      note: alert.note,
    };
    setAlertNotifications((prev) => [notif, ...prev.filter((p) => p.alertId !== alert.id)].slice(0, 3));
    playAlertChime('alert');
  };

  const handleDismissNotification = (id: string) => {
    setAlertNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const [isAnalyzing, setIsAnalyzing] = React.useState<boolean>(false);
  const [monitoringActive, setMonitoringActive] = React.useState<boolean>(true);
  const [isLiveActive, setIsLiveActive] = React.useState<boolean>(true);
  const [feedMode, setFeedMode] = React.useState<'LIVE_MARKET' | 'SIMULATOR'>('LIVE_MARKET');
  const [isSyncingLive, setIsSyncingLive] = React.useState<boolean>(false);
  const [lastTickTime, setLastTickTime] = React.useState<string>('Just now');
  const [liveLatencyMs, setLiveLatencyMs] = React.useState<number>(1.2);
  const [pollIntervalMs, setPollIntervalMs] = React.useState<number>(4000);
  const [showComplianceModal, setShowComplianceModal] = React.useState<boolean>(false);

  // References to stabilize effect subscriptions and eliminate rapid mini-second re-subscription cascades
  const stocksRef = React.useRef(stocks);
  React.useEffect(() => {
    stocksRef.current = stocks;
  }, [stocks]);

  const holdingsRef = React.useRef(holdings);
  React.useEffect(() => {
    holdingsRef.current = holdings;
  }, [holdings]);

  const selectedSymbolRef = React.useRef(selectedSymbol);
  React.useEffect(() => {
    selectedSymbolRef.current = selectedSymbol;
  }, [selectedSymbol]);

  const inFlightSyncRef = React.useRef(false);
  const lastSyncTimeRef = React.useRef(0);

  // Helper to sync live market quotes with ultra-low latency & deduplicated in-flight protection
  const syncLiveQuotes = React.useCallback(async (targetSymbols?: string[], force = false) => {
    if (inFlightSyncRef.current) return;
    const now = Date.now();
    if (!force && now - lastSyncTimeRef.current < 600) return;

    inFlightSyncRef.current = true;
    setIsSyncingLive(true);
    const t0 = performance.now();

    try {
      const holdingSymbols = (holdingsRef.current || []).map((h) => h.symbol);
      const activeSymbols =
        targetSymbols ||
        Array.from(new Set([selectedSymbolRef.current, 'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'NVDA', '^NSEI', '^BSESN', ...holdingSymbols]));
      const symList = activeSymbols.join(',');
      const res = await fetch(`/api/live-market/quotes?symbols=${encodeURIComponent(symList)}`);
      const roundTripMs = Number((performance.now() - t0).toFixed(1));
      setLiveLatencyMs(roundTripMs);
      lastSyncTimeRef.current = Date.now();

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.quotes) {
          setStocks((prev) => {
            const updated = { ...prev };
            for (const [sym, q] of Object.entries(json.quotes as Record<string, any>)) {
              if (updated[sym]) {
                const newPrice = q.price;
                const newChange = q.change;
                const newChangePercent = q.changePercent;
                updated[sym] = {
                  ...updated[sym],
                  price: newPrice,
                  open: q.open || updated[sym].open,
                  high: Math.max(updated[sym].high || 0, q.high || newPrice),
                  low: Math.min(updated[sym].low || 999999, q.low || newPrice),
                  previousClose: q.previousClose || updated[sym].previousClose,
                  change: newChange,
                  changePercent: newChangePercent,
                  currency: q.currency || updated[sym].currency,
                  exchange: q.exchange || updated[sym].exchange,
                  fiftyTwoWeekHigh: q.fiftyTwoWeekHigh || updated[sym].fiftyTwoWeekHigh,
                  fiftyTwoWeekLow: q.fiftyTwoWeekLow || updated[sym].fiftyTwoWeekLow,
                  volume: q.volume || updated[sym].volume,
                };

                // Check active user price threshold alerts against live quote
                const activeMatchingAlerts = (priceAlertsRef.current || []).filter(
                  (alert) =>
                    alert.status === 'ACTIVE' &&
                    alert.symbol === sym &&
                    ((alert.condition === 'ABOVE' && newPrice >= alert.targetPrice) ||
                      (alert.condition === 'BELOW' && newPrice <= alert.targetPrice))
                );

                if (activeMatchingAlerts.length > 0) {
                  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const triggeredIds = new Set(activeMatchingAlerts.map((a) => a.id));

                  setPriceAlerts((prevAlerts) =>
                    prevAlerts.map((alert) =>
                      triggeredIds.has(alert.id)
                        ? {
                            ...alert,
                            status: 'TRIGGERED',
                            triggeredAt: nowTime,
                            triggeredPrice: newPrice,
                          }
                        : alert
                    )
                  );

                  setAlertNotifications((prevNotifs) => {
                    const existing = new Set(prevNotifs.map((n) => n.alertId));
                    const freshNotifs: PriceAlertNotification[] = activeMatchingAlerts
                      .filter((a) => !existing.has(a.id))
                      .map((a, idx) => ({
                        id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${idx}`,
                        alertId: a.id,
                        symbol: a.symbol,
                        targetPrice: a.targetPrice,
                        condition: a.condition,
                        currentPrice: newPrice,
                        timestamp: nowTime,
                        note: a.note,
                      }));

                    if (freshNotifs.length > 0) {
                      playAlertChime('alert');
                      return [...freshNotifs, ...prevNotifs].slice(0, 3);
                    }
                    return prevNotifs;
                  });
                }
              }
            }
            return updated;
          });

          // Dynamically synchronize live market quotes into portfolio holdings
          setHoldings((prevHoldings) => {
            let hasChanges = false;
            const updated = prevHoldings.map((h) => {
              const q = (json.quotes as Record<string, any>)[h.symbol];
              if (!q || typeof q.price !== 'number') return h;
              hasChanges = true;
              const newPrice = Number(q.price.toFixed(2));
              const oldPrice = h.currentPrice;
              const prevCls = q.previousClose || h.previousClose || h.avgBuyPrice;
              const dayChange = q.change !== undefined ? Number(q.change.toFixed(2)) : Number((newPrice - prevCls).toFixed(2));
              const dayChangePercent = q.changePercent !== undefined ? Number(q.changePercent.toFixed(2)) : (prevCls > 0 ? Number(((dayChange / prevCls) * 100).toFixed(2)) : 0);
              const unrealizedPnL = Number(((newPrice - h.avgBuyPrice) * h.shares).toFixed(2));
              const unrealizedPnLPercent = h.avgBuyPrice > 0 ? Number((((newPrice - h.avgBuyPrice) / h.avgBuyPrice) * 100).toFixed(2)) : 0;
              const dayPnL = Number((dayChange * h.shares).toFixed(2));
              const priceFlash: 'up' | 'down' | null = newPrice > oldPrice ? 'up' : newPrice < oldPrice ? 'down' : null;

              return {
                ...h,
                currentPrice: newPrice,
                previousClose: prevCls,
                dayChange,
                dayChangePercent,
                dayPnL,
                unrealizedPnL,
                unrealizedPnLPercent,
                priceFlash,
                lastUpdated: Date.now(),
              };
            });

            if (!hasChanges) return prevHoldings;
            const totalVal = updated.reduce((sum, h) => sum + h.currentPrice * h.shares, 0);
            return updated.map((h) => ({
              ...h,
              weightPercent: totalVal > 0 ? parseFloat(((h.currentPrice * h.shares / totalVal) * 100).toFixed(1)) : 0,
            }));
          });

          setLastTickTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      }
    } catch (e) {
      console.warn('Live quotes sync failed:', e);
    } finally {
      setIsSyncingLive(false);
      inFlightSyncRef.current = false;
    }
  }, []);

  // Initial Live Market Quotes Sync on mount
  React.useEffect(() => {
    syncLiveQuotes(undefined, true);
  }, [syncLiveQuotes]);

  // Dynamic Live Market Pulse Interval - stabilized with ref dependencies
  React.useEffect(() => {
    if (!isLiveActive || pollIntervalMs <= 0) return;

    if (feedMode === 'LIVE_MARKET') {
      const liveInterval = setInterval(() => {
        const holdingSymbols = (holdingsRef.current || []).map((h) => h.symbol);
        const symbolsToPoll = Array.from(
          new Set([selectedSymbolRef.current, 'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'NVDA', ...holdingSymbols])
        );
        syncLiveQuotes(symbolsToPoll);
      }, pollIntervalMs);

      return () => clearInterval(liveInterval);
    }

    const interval = setInterval(() => {
      const currentStocks = stocksRef.current;
      const symbols = Object.keys(currentStocks);
      if (symbols.length === 0) return;

      const currentSym = selectedSymbolRef.current;
      const targetSym = Math.random() > 0.4 ? currentSym : symbols[Math.floor(Math.random() * symbols.length)];
      const stock = currentStocks[targetSym];
      if (!stock) return;

      // Natural micro tick delta (±0.05% to ±0.2%)
      const tickDelta = Number(((Math.random() * 0.3 - 0.15) * (stock.price * 0.003)).toFixed(2));
      if (tickDelta === 0) return;

      const newPrice = Number((stock.price + tickDelta).toFixed(2));
      const newChange = Number((stock.change + tickDelta).toFixed(2));
      const newChangePercent = Number(
        (((newPrice - (stock.previousClose || stock.price)) / (stock.previousClose || stock.price)) * 100).toFixed(2)
      );

      setStocks((prev) => {
        if (!prev[targetSym]) return prev;
        return {
          ...prev,
          [targetSym]: {
            ...prev[targetSym],
            price: newPrice,
            change: newChange,
            changePercent: newChangePercent,
          },
        };
      });

      // Synchronize simulated tick into portfolio holding if matched or tick random holding
      if (holdingsRef.current && holdingsRef.current.length > 0) {
        const matchesHolding = holdingsRef.current.find((h) => h.symbol === targetSym);
        const tickTargetSymbol = matchesHolding ? targetSym : (Math.random() > 0.4 ? holdingsRef.current[Math.floor(Math.random() * holdingsRef.current.length)].symbol : null);

        if (tickTargetSymbol) {
          setHoldings((prev) => {
            const updated = prev.map((h) => {
              if (h.symbol !== tickTargetSymbol) return h;
              const hPrice = tickTargetSymbol === targetSym ? newPrice : Number((h.currentPrice + tickDelta).toFixed(2));
              const prevCls = h.previousClose || h.avgBuyPrice;
              const newDayChange = Number((hPrice - prevCls).toFixed(2));
              const newDayChangePercent = prevCls > 0 ? Number(((newDayChange / prevCls) * 100).toFixed(2)) : 0;
              const newPnL = Number(((hPrice - h.avgBuyPrice) * h.shares).toFixed(2));
              const newPnLPct = h.avgBuyPrice > 0 ? Number((((hPrice - h.avgBuyPrice) / h.avgBuyPrice) * 100).toFixed(2)) : 0;
              return {
                ...h,
                currentPrice: hPrice,
                dayChange: newDayChange,
                dayChangePercent: newDayChangePercent,
                dayPnL: Number((newDayChange * h.shares).toFixed(2)),
                unrealizedPnL: newPnL,
                unrealizedPnLPercent: newPnLPct,
                priceFlash: tickDelta > 0 ? 'up' : 'down',
                lastUpdated: Date.now(),
              };
            });
            const totalVal = updated.reduce((sum, h) => sum + h.currentPrice * h.shares, 0);
            return updated.map((h) => ({
              ...h,
              weightPercent: totalVal > 0 ? parseFloat(((h.currentPrice * h.shares / totalVal) * 100).toFixed(1)) : 0,
            }));
          });
        }
      }

      setLastTickTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      // Evaluate active user price threshold alerts against live simulated tick
      const activeMatchingAlerts = (priceAlertsRef.current || []).filter(
        (alert) =>
          alert.status === 'ACTIVE' &&
          alert.symbol === targetSym &&
          ((alert.condition === 'ABOVE' && newPrice >= alert.targetPrice) ||
            (alert.condition === 'BELOW' && newPrice <= alert.targetPrice))
      );

      if (activeMatchingAlerts.length > 0) {
        const nowTime = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        const triggeredAlertIds = new Set(activeMatchingAlerts.map((a) => a.id));

        // Mark triggered alerts in state cleanly
        setPriceAlerts((prevAlerts) =>
          prevAlerts.map((alert) =>
            triggeredAlertIds.has(alert.id)
              ? {
                  ...alert,
                  status: 'TRIGGERED',
                  triggeredAt: nowTime,
                  triggeredPrice: newPrice,
                }
              : alert
          )
        );

        // Queue notifications with guaranteed unique keys and alertId deduplication
        setAlertNotifications((prevNotifs) => {
          const existingAlertIds = new Set(prevNotifs.map((n) => n.alertId));
          const freshNotifs: PriceAlertNotification[] = activeMatchingAlerts
            .filter((a) => !existingAlertIds.has(a.id))
            .map((a, idx) => ({
              id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${idx}`,
              alertId: a.id,
              symbol: a.symbol,
              targetPrice: a.targetPrice,
              condition: a.condition,
              currentPrice: newPrice,
              timestamp: nowTime,
              note: a.note,
            }));

          if (freshNotifs.length > 0) {
            playAlertChime('alert');
            return [...freshNotifs, ...prevNotifs].slice(0, 3);
          }
          return prevNotifs;
        });
      }
    }, Math.max(pollIntervalMs - 800, 1500));

    return () => clearInterval(interval);
  }, [isLiveActive, feedMode, pollIntervalMs, syncLiveQuotes]);

  // Active stock data
  const currentStock = stocks[selectedSymbol] || stocks['RELIANCE'];

  // Handle Search stock (Direct, instant search with accurate pricing and chart history)
  const handleSearchSymbol = async (inputSymbol: string) => {
    if (!inputSymbol || !inputSymbol.trim()) return;
    const resolved = resolveStockQuery(inputSymbol);
    const sym = resolved || inputSymbol.toUpperCase().trim() || 'RELIANCE';

    // Immediately resolve accurate stock metadata and chart series
    const initialData = getOrCreateStockData(sym, stocks);
    setStocks((prev) => ({ ...prev, [sym]: initialData }));
    setSelectedSymbol(sym);
    selectedSymbolRef.current = sym;
    syncLiveQuotes([sym], true);
    setActiveView('research');
    setIsAnalyzing(true);

    try {
      // Call backend /api/analyze endpoint for multi-agent synthesis
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: sym, userQuery: `Analyze ${sym}` }),
      });
      const json = await res.json();

      if (json.success && json.source === 'gemini_agent_engine' && json.data) {
        // Enriched with live Gemini multi-agent response
        const g = json.data;
        const base = stocks[sym] || initialData;
        const updated: StockResearchData = {
          ...base,
          symbol: g.symbol || sym,
          name: g.name || base.name,
          price: (g.price && g.price > 0) ? g.price : base.price,
          currency: g.currency || base.currency || '₹',
          changePercent: g.changePercent || base.changePercent,
          technicals: {
            ...base.technicals,
            interpretation: g.technicalInterpretation || base.technicals.interpretation,
          },
          fundamentals: {
            ...base.fundamentals,
            interpretation: g.fundamentalInterpretation || base.fundamentals.interpretation,
          },
          sectorMacro: {
            ...base.sectorMacro,
            environmentVerdict: g.sectorMacroVerdict || base.sectorMacro.environmentVerdict,
          },
          bullCase: {
            ...base.bullCase,
            headline: g.bullThesis?.headline || base.bullCase.headline,
            targetUpside: g.bullThesis?.targetUpside || base.bullCase.targetUpside,
          },
          bearCase: {
            ...base.bearCase,
            headline: g.bearThesis?.headline || base.bearCase.headline,
            downsideRiskEstimate: g.bearThesis?.downsideRiskEstimate || base.bearCase.downsideRiskEstimate,
          },
          committee: {
            ...base.committee,
            overallScore: g.committeeScore || base.committee.overallScore,
            status: g.committeeStatus || base.committee.status,
            confidencePercent: g.confidencePercent || base.committee.confidencePercent,
            breakdown: {
              ...base.committee.breakdown,
              ...(g.scoreBreakdown || {}),
            },
            mainReasons: g.mainReasons || base.committee.mainReasons,
            mainRisks: g.mainRisks || base.committee.mainRisks,
          },
        };

        setStocks((prev) => ({ ...prev, [sym]: updated }));
      }

      // Fetch verified real-time quote directly from Exchange Gateway
      fetch(`/api/live-market/quote/${sym}`)
        .then((r) => r.json())
        .then((lq) => {
          if (lq.success && lq.data) {
            setStocks((prev) => {
              if (!prev[sym]) return prev;
              const cur = prev[sym];
              return {
                ...prev,
                [sym]: {
                  ...cur,
                  price: lq.data.price,
                  open: lq.data.open || cur.open,
                  high: lq.data.high || cur.high,
                  low: lq.data.low || cur.low,
                  previousClose: lq.data.previousClose || cur.previousClose,
                  change: lq.data.change,
                  changePercent: lq.data.changePercent,
                  currency: lq.data.currency || cur.currency,
                  exchange: lq.data.exchange || cur.exchange,
                  fiftyTwoWeekHigh: lq.data.fiftyTwoWeekHigh || cur.fiftyTwoWeekHigh,
                  fiftyTwoWeekLow: lq.data.fiftyTwoWeekLow || cur.fiftyTwoWeekLow,
                  volume: lq.data.volume || cur.volume,
                },
              };
            });
          }
        })
        .catch(() => {});

      // Fetch real chart candles
      fetch(`/api/live-market/candles/${sym}?range=1mo&interval=1d`)
        .then((r) => r.json())
        .then((cd) => {
          if (cd.success && cd.candles && cd.candles.length > 0) {
            setStocks((prev) => {
              if (!prev[sym]) return prev;
              return {
                ...prev,
                [sym]: {
                  ...prev[sym],
                  priceHistory: cd.candles,
                },
              };
            });
          }
        })
        .catch(() => {});
    } catch (err) {
      console.warn('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
      setActiveView('research');
    }
  };

  // Re-run pipeline with animated progression
  const handleTriggerReanalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 1800);
  };

  // Trigger event simulator (market shock, margin drop, etc.)
  const handleSimulateTrigger = (trigger: TriggerEvent) => {
    const sym = trigger.symbol;
    const target = stocks[sym] || stocks['RELIANCE'];

    let newStatus = target.committee.status;
    let newScore = target.committee.overallScore;
    let thesisChanged = true;
    let reasons: string[] = [];

    if (trigger.type === 'PRICE_DROP_5PCT') {
      newScore = Math.max(50, newScore - 10);
      newStatus = 'CAUTIOUS ELEVATED RISK';
      reasons = [
        '50-day Simple Moving Average breached with volume 1.8x 30-day average',
        'Momentum breakdown: RSI crossed below 40 threshold into oversold distribution',
        'Risk Agent re-evaluated near-term downside volatility risk to High',
      ];
    } else if (trigger.type === 'EARNINGS_MARGIN_MISS') {
      newScore = Math.max(52, newScore - 12);
      newStatus = 'CAUTIOUS MARGIN CONTRACTION';
      reasons = [
        'Operating margins compressed 80 bps below audited guidance',
        'Fundamental Analyst downgraded 3-year profit CAGR trajectory',
        'Bear Agent cited increased pricing pressure in core contract renewals',
      ];
    } else if (trigger.type === 'POSITIVE_POLICY_CATALYST') {
      newScore = Math.min(95, newScore + 8);
      newStatus = 'STRONG BULLISH RESEARCH SETUP';
      reasons = [
        'Government subsidy expansion provides capital expenditure acceleration',
        'Sector & Macro Agent upgraded regulatory environment to Highly Beneficial',
        'Bull Agent increased target upside projection',
      ];
    } else {
      newScore = Math.max(55, newScore - 8);
      newStatus = 'ELEVATED REGULATORY OVERSIGHT';
      reasons = [
        'Regulatory audit notice flags compliance enhancement requirements',
        'Risk Manager increased regulatory risk score from 4.8 to 7.4',
      ];
    }

    const updatedStock: StockResearchData = {
      ...target,
      thesisChanged,
      thesisChangeAlert: {
        timestamp: new Date().toLocaleTimeString(),
        previousStatus: target.committee.status,
        currentStatus: newStatus,
        reasons,
      },
      committee: {
        ...target.committee,
        overallScore: newScore,
        status: newStatus,
      },
    };

    setStocks((prev) => ({ ...prev, [sym]: updatedStock }));

    // Update watchlist
    setWatchlist((prev) =>
      prev.map((w) =>
        w.symbol === sym
          ? {
              ...w,
              committeeScore: newScore,
              thesisChanged: true,
              lastEvaluated: 'Just now',
            }
          : w
      )
    );

    // Dispatch alert to feed
    setRecentAlerts((prev) => [
      {
        id: 'ALT-' + Date.now(),
        symbol: sym,
        type: trigger.type,
        message: `🚨 SIMULATED TRIGGER: ${trigger.description} -> Investment Committee updated score to ${newScore}/100 (${newStatus}).`,
        timestamp: new Date().toLocaleTimeString(),
        severity: trigger.type.includes('POSITIVE') ? 'info' : 'critical',
      },
      ...prev,
    ]);

    setSelectedSymbol(sym);
  };

  // Paper order execution
  const handleExecuteOrder = (order: {
    symbol: string;
    type: 'BUY' | 'SELL';
    shares: number;
    price: number;
    reason: string;
  }) => {
    const total = order.shares * order.price;

    if (order.type === 'BUY') {
      setCashBalance((prev) => prev - total);
      setHoldings((prev) => {
        const existing = prev.find((h) => h.symbol === order.symbol);
        if (existing) {
          const newShares = existing.shares + order.shares;
          const newAvgPrice = (existing.shares * existing.avgBuyPrice + total) / newShares;
          return prev.map((h) =>
            h.symbol === order.symbol ? { ...h, shares: newShares, avgBuyPrice: Math.round(newAvgPrice) } : h
          );
        } else {
          return [
            ...prev,
            {
              symbol: order.symbol,
              shares: order.shares,
              avgBuyPrice: order.price,
              currentPrice: order.price,
              pnl: 0,
              pnlPercent: 0,
              researchScore: stocks[order.symbol]?.committee.overallScore || 75,
              sector: stocks[order.symbol]?.sectorMacro.sectorName || 'General',
            },
          ];
        }
      });
    } else {
      setCashBalance((prev) => prev + total);
      setHoldings((prev) =>
        prev
          .map((h) => (h.symbol === order.symbol ? { ...h, shares: Math.max(0, h.shares - order.shares) } : h))
          .filter((h) => h.shares > 0)
      );
    }

    setPaperOrders((prev) => [
      {
        id: 'ORD-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        symbol: order.symbol,
        type: order.type,
        shares: order.shares,
        price: order.price,
        totalAmount: Number(total.toFixed(2)),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reason: order.reason,
      },
      ...prev,
    ]);
  };

  const handleExecuteBatchOrders = (
    orders: Array<{
      symbol: string;
      type: 'BUY' | 'SELL';
      shares: number;
      price: number;
      reason: string;
    }>
  ) => {
    let cashDelta = 0;
    const newOrdersList: typeof paperOrders = [];

    setHoldings((prevHoldings) => {
      let currentHoldings = [...prevHoldings];

      orders.forEach((order) => {
        const total = order.shares * order.price;
        if (order.type === 'BUY') {
          cashDelta -= total;
          const existing = currentHoldings.find((h) => h.symbol === order.symbol);
          if (existing) {
            const newShares = existing.shares + order.shares;
            const newAvgPrice = (existing.shares * existing.avgBuyPrice + total) / newShares;
            currentHoldings = currentHoldings.map((h) =>
              h.symbol === order.symbol ? { ...h, shares: newShares, avgBuyPrice: Math.round(newAvgPrice) } : h
            );
          } else {
            currentHoldings.push({
              symbol: order.symbol,
              shares: order.shares,
              avgBuyPrice: order.price,
              currentPrice: order.price,
              pnl: 0,
              pnlPercent: 0,
              researchScore: stocks[order.symbol]?.committee?.overallScore || 75,
              sector: stocks[order.symbol]?.sectorMacro?.sectorName || 'General',
            });
          }
        } else {
          cashDelta += total;
          currentHoldings = currentHoldings
            .map((h) => (h.symbol === order.symbol ? { ...h, shares: Math.max(0, h.shares - order.shares) } : h))
            .filter((h) => h.shares > 0);
        }

        newOrdersList.push({
          id: 'REBAL-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
          symbol: order.symbol,
          type: order.type,
          shares: order.shares,
          price: order.price,
          totalAmount: Number(total.toFixed(2)),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          reason: order.reason,
        });
      });

      return currentHoldings;
    });

    setCashBalance((prev) => prev + cashDelta);
    setPaperOrders((prev) => [...newOrdersList, ...prev]);
  };

  const handleAddHolding = (newHolding: PortfolioHolding) => {
    setHoldings((prev) => {
      const idx = prev.findIndex((h) => h.symbol.toUpperCase() === newHolding.symbol.toUpperCase());
      let updated: PortfolioHolding[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = newHolding;
      } else {
        updated = [...prev, newHolding];
      }
      const total = updated.reduce((sum, h) => sum + h.currentPrice * h.shares, 0);
      const withWeights = updated.map((h) => ({
        ...h,
        weightPercent: total > 0 ? parseFloat(((h.currentPrice * h.shares / total) * 100).toFixed(1)) : 0,
      }));
      try {
        localStorage.setItem('finagent_portfolio_holdings', JSON.stringify(withWeights));
      } catch {}
      return withWeights;
    });

    const totalAmt = Number((newHolding.shares * newHolding.avgBuyPrice).toFixed(2));
    setPortfolioNotice(
      `✓ Added ${newHolding.symbol} (${newHolding.shares} shares @ ₹${newHolding.avgBuyPrice.toLocaleString()} = ₹${totalAmt.toLocaleString()}) • Portfolio Saved`
    );
    setTimeout(() => setPortfolioNotice(''), 4500);
  };

  const handleRemoveHolding = (symbol: string) => {
    setHoldings((prev) => {
      const updated = prev.filter((h) => h.symbol.toUpperCase() !== symbol.toUpperCase());
      const total = updated.reduce((sum, h) => sum + h.currentPrice * h.shares, 0);
      const withWeights = updated.map((h) => ({
        ...h,
        weightPercent: total > 0 ? parseFloat(((h.currentPrice * h.shares / total) * 100).toFixed(1)) : 0,
      }));
      try {
        localStorage.setItem('finagent_portfolio_holdings', JSON.stringify(withWeights));
      } catch {}
      return withWeights;
    });
    setPortfolioNotice(`✓ Removed ${symbol} • Portfolio Saved`);
    setTimeout(() => setPortfolioNotice(''), 3500);
  };

  const handleUpdateHolding = (symbol: string, newShares: number, newAvgBuyPrice?: number) => {
    setHoldings((prev) => {
      if (newShares <= 0) {
        const remaining = prev.filter((h) => h.symbol.toUpperCase() !== symbol.toUpperCase());
        try {
          localStorage.setItem('finagent_portfolio_holdings', JSON.stringify(remaining));
        } catch {}
        return remaining;
      }
      const updated = prev.map((h) => {
        if (h.symbol.toUpperCase() !== symbol.toUpperCase()) return h;
        const avgPrice = newAvgBuyPrice !== undefined ? newAvgBuyPrice : h.avgBuyPrice;
        const unrealizedPnL = Number(((h.currentPrice - avgPrice) * newShares).toFixed(2));
        const unrealizedPnLPercent = avgPrice > 0 ? Number((((h.currentPrice - avgPrice) / avgPrice) * 100).toFixed(2)) : 0;
        const dayPnL = Number(((h.dayChange || 0) * newShares).toFixed(2));
        return {
          ...h,
          shares: newShares,
          avgBuyPrice: avgPrice,
          unrealizedPnL,
          unrealizedPnLPercent,
          dayPnL,
        };
      });
      const total = updated.reduce((sum, h) => sum + h.currentPrice * h.shares, 0);
      const withWeights = updated.map((h) => ({
        ...h,
        weightPercent: total > 0 ? parseFloat(((h.currentPrice * h.shares / total) * 100).toFixed(1)) : 0,
      }));
      try {
        localStorage.setItem('finagent_portfolio_holdings', JSON.stringify(withWeights));
      } catch {}
      return withWeights;
    });
    setPortfolioNotice(`✓ Position ${symbol} updated to ${newShares} shares • Portfolio Saved`);
    setTimeout(() => setPortfolioNotice(''), 3500);
  };

  const handleQuickTrade = (symbol: string, action: 'BUY' | 'TRIM', shares: number, price: number) => {
    const existing = holdings.find((h) => h.symbol.toUpperCase() === symbol.toUpperCase());
    if (!existing && action === 'TRIM') return;

    const totalOrderValue = shares * price;

    if (action === 'BUY') {
      if (cashBalance < totalOrderValue) {
        setCashBalance((prev) => prev + Math.max(totalOrderValue - prev + 200000, 1000000));
      }
      setCashBalance((prev) => Math.max(0, prev - totalOrderValue));

      setHoldings((prev) => {
        const idx = prev.findIndex((h) => h.symbol.toUpperCase() === symbol.toUpperCase());
        let updated: PortfolioHolding[];
        if (idx >= 0) {
          const cur = prev[idx];
          const newShares = cur.shares + shares;
          const newAvg = (cur.shares * cur.avgBuyPrice + totalOrderValue) / newShares;
          const unrealizedPnL = Number(((cur.currentPrice - newAvg) * newShares).toFixed(2));
          const unrealizedPnLPercent = newAvg > 0 ? Number((((cur.currentPrice - newAvg) / newAvg) * 100).toFixed(2)) : 0;
          updated = [...prev];
          updated[idx] = {
            ...cur,
            shares: newShares,
            avgBuyPrice: Number(newAvg.toFixed(2)),
            unrealizedPnL,
            unrealizedPnLPercent,
            dayPnL: Number(((cur.dayChange || 0) * newShares).toFixed(2)),
          };
        } else {
          const stockInfo = stocks[symbol];
          const newHolding: PortfolioHolding = {
            symbol,
            name: stockInfo?.name || symbol,
            shares,
            avgBuyPrice: price,
            currentPrice: price,
            weightPercent: 0,
            sector: stockInfo?.sector || 'Diversified',
            score: 75,
            unrealizedPnL: 0,
            unrealizedPnLPercent: 0,
            dayChange: stockInfo?.change || 0,
            dayChangePercent: stockInfo?.changePercent || 0,
            dayPnL: 0,
            previousClose: stockInfo?.previousClose || price,
          };
          updated = [...prev, newHolding];
        }
        const total = updated.reduce((sum, h) => sum + h.currentPrice * h.shares, 0);
        return updated.map((h) => ({
          ...h,
          weightPercent: total > 0 ? parseFloat(((h.currentPrice * h.shares / total) * 100).toFixed(1)) : 0,
        }));
      });

      // Record paper order in history
      const orderRecord: PaperOrder = {
        id: `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        symbol,
        type: 'BUY',
        shares,
        price,
        totalAmount: totalOrderValue,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reason: 'Quick Portfolio Buy',
      };
      setPaperOrders((prev) => [orderRecord, ...prev]);
    } else {
      // TRIM
      if (!existing) return;
      const trimQty = Math.min(existing.shares, shares);
      const proceeds = trimQty * price;
      setCashBalance((prev) => prev + proceeds);

      setHoldings((prev) => {
        const remainingShares = existing.shares - trimQty;
        let updated: PortfolioHolding[];
        if (remainingShares <= 0) {
          updated = prev.filter((h) => h.symbol.toUpperCase() !== symbol.toUpperCase());
        } else {
          updated = prev.map((h) => {
            if (h.symbol.toUpperCase() !== symbol.toUpperCase()) return h;
            const unrealizedPnL = Number(((h.currentPrice - h.avgBuyPrice) * remainingShares).toFixed(2));
            const unrealizedPnLPercent = h.avgBuyPrice > 0 ? Number((((h.currentPrice - h.avgBuyPrice) / h.avgBuyPrice) * 100).toFixed(2)) : 0;
            return {
              ...h,
              shares: remainingShares,
              unrealizedPnL,
              unrealizedPnLPercent,
              dayPnL: Number(((h.dayChange || 0) * remainingShares).toFixed(2)),
            };
          });
        }
        const total = updated.reduce((sum, h) => sum + h.currentPrice * h.shares, 0);
        return updated.map((h) => ({
          ...h,
          weightPercent: total > 0 ? parseFloat(((h.currentPrice * h.shares / total) * 100).toFixed(1)) : 0,
        }));
      });

      const orderRecord: PaperOrder = {
        id: `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        symbol,
        type: 'SELL',
        shares: trimQty,
        price,
        totalAmount: proceeds,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reason: 'Quick Portfolio Trim',
      };
      setPaperOrders((prev) => [orderRecord, ...prev]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950/40 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 w-full max-w-[100vw] overflow-x-hidden relative">
      {/* Dark Cosmos & Starfield Background Motion Design */}
      <DynamicBackgroundVideo initialOpacity={0.78} />

      {/* Persistent Navigation Header */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        selectedSymbol={selectedSymbol}
        onSearchSymbol={handleSearchSymbol}
        onOpenCompliance={() => setShowComplianceModal(true)}
        isAnalyzing={isAnalyzing}
        alertsCount={priceAlerts.filter((a) => a.status === 'ACTIVE').length}
        onOpenAlerts={() => {
          setActiveView('research');
        }}
        onOpenBugAgent={() => setShowBugAgentModal(true)}
        onOpenPipeline={() => setShowPipelineModal(true)}
        onOpenIndianStocksModal={() => setShowIndianStocksModal(true)}
        onOpenSnapshots={() => setShowSnapshotsModal(true)}
        user={currentUser}
        onOpenLogin={() => setShowAuthModal(true)}
        onLogout={handleLogout}
      />

      {/* Dynamic Market Quick-Switcher Strip */}
      <DynamicMarketStrip
        stocks={stocks}
        selectedSymbol={selectedSymbol}
        onSelectSymbol={(sym) => handleSearchSymbol(sym)}
        isLiveActive={isLiveActive}
        onToggleLive={() => setIsLiveActive((prev) => !prev)}
        lastTickTime={lastTickTime}
        onOpenPipeline={() => setShowPipelineModal(true)}
        onOpenIndianStocksModal={() => setShowIndianStocksModal(true)}
        feedMode={feedMode}
        onToggleFeedMode={() => setFeedMode((prev) => (prev === 'LIVE_MARKET' ? 'SIMULATOR' : 'LIVE_MARKET'))}
        latencyMs={liveLatencyMs}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-4 py-4 sm:py-6 overflow-x-hidden">
        {activeView === 'research' && (
          <StockResearchView
            stock={currentStock}
            onOpenPaperTrade={() => setActiveView('papertrading')}
            onSelectRelatedSymbol={(sym) => {
              handleSearchSymbol(sym);
            }}
            onSearchStock={(sym) => {
              handleSearchSymbol(sym);
            }}
            onOpenIndianStocksModal={() => setShowIndianStocksModal(true)}
            onOpenSectorHeatmap={() => setActiveView('sectors')}
            stocks={stocks}
            alerts={priceAlerts}
            onAddAlert={handleAddPriceAlert}
            onDeleteAlert={handleDeletePriceAlert}
            onTriggerSimulatedAlert={handleTriggerSimulatedAlert}
            watchlist={watchlist}
            onAddToWatchlist={handleAddToWatchlist}
            onRemoveFromWatchlist={handleRemoveFromWatchlist}
          />
        )}

        {activeView === 'sectors' && (
          <SectorHeatmap
            stocks={stocks}
            onSelectStock={(sym) => {
              handleSearchSymbol(sym);
              setActiveView('research');
            }}
            selectedSymbol={selectedSymbol}
          />
        )}

        {activeView === 'all-stocks' && (
          <IndianStocksDirectoryView
            onSelectStock={(sym) => {
              handleSearchSymbol(sym);
              setActiveView('research');
            }}
            currentSymbol={selectedSymbol}
            watchlistSymbols={new Set(watchlist.map((w) => w.symbol.toUpperCase()))}
            onToggleWatchlist={(stockItem) => {
              const inWatchlist = watchlist.some((w) => w.symbol.toUpperCase() === stockItem.symbol.toUpperCase());
              if (inWatchlist) {
                handleRemoveFromWatchlist(stockItem.symbol);
              } else {
                const isEtf =
                  (stockItem.sector && (stockItem.sector.toLowerCase().includes('etf') || stockItem.sector.toLowerCase().includes('exchange traded fund'))) ||
                  stockItem.symbol.includes('BEES') ||
                  stockItem.symbol.includes('ETF');
                handleAddToWatchlist({
                  symbol: stockItem.symbol,
                  name: stockItem.name,
                  price: stockItem.price,
                  changePercent: +(Math.random() * 2 - 0.5).toFixed(2),
                  score: Math.floor(Math.random() * 20) + 72,
                  committeeScore: Math.floor(Math.random() * 20) + 72,
                  currency: stockItem.currency || '₹',
                  statusTag: 'POSITIVE',
                  thesisStatus: isEtf ? 'BUY (INDEX ACCUMULATE)' : 'BUY / MONITOR',
                  thesisChanged: false,
                  lastAnalyzed: 'Just now',
                  sector: stockItem.sector,
                  isEtf: Boolean(isEtf),
                  intrinsicValue: stockItem.intrinsicValue,
                  marginOfSafetyPercent: stockItem.marginOfSafetyPercent,
                });
              }
            }}
          />
        )}

        {activeView === 'workflow' && (
          <WorkflowVisualizer
            stock={currentStock}
            isAnalyzing={isAnalyzing}
            onTriggerAnalysis={handleTriggerReanalysis}
          />
        )}

        {activeView === 'watchlist' && (
          <WatchlistMonitor
            watchlist={watchlist}
            onSelectStock={(sym) => {
              handleSearchSymbol(sym);
            }}
            onSimulateTrigger={handleSimulateTrigger}
            monitoringActive={monitoringActive}
            setMonitoringActive={setMonitoringActive}
            recentAlerts={recentAlerts}
            onAddStock={handleAddToWatchlist}
            onRemoveStock={handleRemoveFromWatchlist}
            onResetWatchlist={handleResetWatchlist}
          />
        )}

        {activeView === 'portfolio' && (
          <PortfolioIntelligence
            holdings={holdings}
            cashBalance={cashBalance}
            stocks={stocks}
            onSelectStock={(sym) => {
              handleSearchSymbol(sym);
            }}
            onOpenPaperTrade={() => setActiveView('papertrading')}
            onExecuteBatchOrders={handleExecuteBatchOrders}
            onExecuteOrder={handleExecuteOrder}
            onAddHolding={handleAddHolding}
            onRemoveHolding={handleRemoveHolding}
            onUpdateHolding={handleUpdateHolding}
            onQuickTrade={handleQuickTrade}
            onUpdateCash={(newCash) => setCashBalance(newCash)}
            onResetPortfolio={handleResetPortfolio}
            lastSavedTime={lastSavedTimestamp}
            onSavePortfolio={handleManualSavePortfolio}
          />
        )}

        {activeView === 'papertrading' && (
          <PaperTradingLab
            currentStock={currentStock}
            cashBalance={cashBalance}
            orders={paperOrders}
            holdings={holdings}
            stocks={stocks}
            onExecuteOrder={handleExecuteOrder}
          />
        )}
      </main>

      {/* Compliance / SEBI Notice Modal */}
      {showComplianceModal && <ComplianceModal onClose={() => setShowComplianceModal(false)} />}

      {/* Autonomous Bug Agent & System Sentinel Modal */}
      <BugAgentModal
        isOpen={showBugAgentModal}
        onClose={() => setShowBugAgentModal(false)}
        onPricesUpdated={() => {
          // Re-fetch latest prices
          fetch('/api/prices')
            .then((r) => r.json())
            .then((d) => {
              if (d.success && d.prices) {
                setStocks((prev) => {
                  const copy = { ...prev };
                  Object.keys(d.prices).forEach((s) => {
                    if (copy[s]) {
                      copy[s] = {
                        ...copy[s],
                        price: d.prices[s].price,
                        change: d.prices[s].change,
                        changePercent: d.prices[s].changePercent,
                      };
                    }
                  });
                  return copy;
                });
              }
            })
            .catch(() => {});
        }}
      />

      {/* User Authentication & Email Login Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        user={currentUser}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />

      {/* NSE & BSE Direct Market Data Pipeline Inspector Modal */}
      <NseBsePipelineModal
        isOpen={showPipelineModal}
        onClose={() => setShowPipelineModal(false)}
        currentSymbol={selectedSymbol}
      />

      {/* Indian Exchange All Listed Companies Directory Modal */}
      <IndianExchangeStocksModal
        isOpen={showIndianStocksModal}
        onClose={() => setShowIndianStocksModal(false)}
        onSelectStock={(sym) => {
          handleSearchSymbol(sym);
          setShowIndianStocksModal(false);
          setActiveView('research');
        }}
        currentSymbol={selectedSymbol}
      />

      {/* Dashboard Snapshots & Visual Architecture Modal */}
      <DashboardSnapshotsModal
        isOpen={showSnapshotsModal}
        onClose={() => setShowSnapshotsModal(false)}
        onNavigateView={(v) => {
          setActiveView(v);
          setShowSnapshotsModal(false);
        }}
      />

      {/* Real-time Price Alert Notification Toast Stack */}
      <PriceAlertNotificationBanner
        notifications={alertNotifications}
        onDismiss={handleDismissNotification}
        onSelectStock={(sym) => {
          setSelectedSymbol(sym);
          setActiveView('research');
        }}
      />

      {/* Floating Portfolio Saved Notice Toast */}
      {portfolioNotice && (
        <div className="fixed bottom-6 right-6 z-50 animate-slideUp font-mono">
          <div className="bg-slate-900 border border-emerald-500/50 text-emerald-300 text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold">{portfolioNotice}</span>
            <button
              onClick={() => setPortfolioNotice('')}
              className="text-slate-400 hover:text-white ml-1 text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 px-6 text-xs text-slate-500 font-mono flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">FINAGENT</span>
          <span>•</span>
          <span>Stock Research & Portfolio Intelligence</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <button
            onClick={() => setShowSnapshotsModal(true)}
            className="text-slate-400 hover:text-cyan-400 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
          >
            Dashboard Snapshots
          </button>
          <span>•</span>
          <button
            onClick={() => setShowComplianceModal(true)}
            className="text-slate-400 hover:text-cyan-400 underline underline-offset-2"
          >
            SEBI Regulatory Framework
          </button>
        </div>
      </footer>
    </div>
  );
}
