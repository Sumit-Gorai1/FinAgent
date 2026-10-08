import React from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Bell,
  RefreshCw,
  HelpCircle,
  ChevronRight,
  Maximize2,
  Minimize2,
  Zap,
} from 'lucide-react';
import { StockResearchData, AssistantMessage, PriceAlert } from '../types';
import { EducationalDisclaimer } from './EducationalDisclaimer';

interface AIResearchAssistantProps {
  stock: StockResearchData;
  alerts: PriceAlert[];
  onOpenAlertModalWithValues?: (targetPrice: number, condition: 'ABOVE' | 'BELOW', note: string) => void;
  isOpen: boolean;
  onClose: () => void;
  isFloating?: boolean;
}

export const AIResearchAssistant: React.FC<AIResearchAssistantProps> = ({
  stock,
  alerts,
  onOpenAlertModalWithValues,
  isOpen,
  onClose,
  isFloating = true,
}) => {
  const [messages, setMessages] = React.useState<AssistantMessage[]>([
    {
      id: 'msg-init',
      role: 'assistant',
      content: `Hello! I am your **FINAGENT AI Research Copilot** for **${stock.name} (${stock.symbol})**.

I can help you interpret multi-agent indicator synthesis, formulate high-conviction price threshold alerts (stop-loss, resistance breakout), or answer any questions about this stock's financials and risk matrix.

Choose a quick prompt below or type your inquiry:`,
      timestamp: 'Just now',
    },
  ]);

  const [inputQuery, setInputQuery] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isExpanded, setIsExpanded] = React.useState<boolean>(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (queryText?: string) => {
    const text = (queryText || inputQuery).trim();
    if (!text || isLoading) return;

    const userMsg: AssistantMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          symbol: stock.symbol,
          stockContext: {
            symbol: stock.symbol,
            name: stock.name,
            price: stock.price,
            changePercent: stock.changePercent,
            committee: stock.committee,
            technicals: stock.technicals,
            fundamentals: stock.fundamentals,
            bullCase: stock.bullCase,
            bearCase: stock.bearCase,
            fiftyTwoWeekHigh: stock.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: stock.fiftyTwoWeekLow,
            activeAlertsCount: alerts.filter((a) => a.symbol === stock.symbol && a.status === 'ACTIVE').length,
          },
          history: messages.slice(-4).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();

      const botMsg: AssistantMessage = {
        id: 'bot-' + Date.now(),
        role: 'assistant',
        content: data.response || 'I analyzed the stock data and provided recommendations based on current technical and fundamental parameters.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedAlertPrice: data.suggestedAlert?.price,
        suggestedAlertCondition: data.suggestedAlert?.condition,
        suggestedAlertNote: data.suggestedAlert?.note,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Error fetching AI Assistant response:', err);
      // Fallback
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot-err-' + Date.now(),
          role: 'assistant',
          content: `For **${stock.symbol}** at **₹${stock.price}**, key technical thresholds to consider:
- **Resistance / Breakout Level**: ₹${Math.round(stock.price * 1.04)} (+4%)
- **Support / Stop-Loss Level**: ₹${Math.round(stock.price * 0.96)} (-4%)
- **20-Day Moving Average**: ₹${stock.technicals.sma20} (Momentum baseline)

You can set custom price threshold alerts using the **Set Alert** button to get notified immediately when either level is reached.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedAlertPrice: Math.round(stock.price * 1.04),
          suggestedAlertCondition: 'ABOVE',
          suggestedAlertNote: `Breakout target above ₹${Math.round(stock.price * 1.04)}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    {
      label: '🎯 Recommend Price Alerts',
      query: `What price threshold alerts (breakout and stop-loss) should I set for ${stock.symbol}?`,
    },
    {
      label: '📊 Audit RSI & Moving Averages',
      query: `Explain what the RSI (${stock.technicals.rsi14}) and Moving Averages tell us about ${stock.symbol}'s momentum right now.`,
    },
    {
      label: '⚖️ Summarize Bull vs Bear Thesis',
      query: `Give me a concise summary of the key Bull and Bear arguments for ${stock.symbol}.`,
    },
    {
      label: '🛡️ Explain Risk Score',
      query: `What are the primary risk factors identified by the Risk Manager for ${stock.symbol}?`,
    },
    {
      label: '❓ How do Price Alerts work?',
      query: `How do custom price threshold alerts and notifications function in FINAGENT?`,
    },
  ];

  if (!isOpen) return null;

  return (
    <div
      className={
        isFloating
          ? `fixed z-40 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 ${
              isExpanded
                ? 'inset-6 md:inset-12'
                : 'bottom-6 right-6 w-[92vw] sm:w-[460px] h-[580px] max-h-[85vh]'
            }`
          : 'w-full h-[650px] bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shadow-xl'
      }
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-950">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                FINAGENT AI COPILOT
              </h3>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-cyan-950 border border-cyan-800 text-cyan-300">
                {stock.symbol}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Autonomous Equity Research & Alert Strategy Assistant
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isFloating && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title={isExpanded ? 'Minimize' : 'Expand'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
          {isFloating && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs font-sans">
        {messages.map((msg) => {
          const isBot = msg.role === 'assistant';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isBot ? 'justify-start' : 'justify-end'}`}
            >
              {isBot && (
                <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 space-y-2 leading-relaxed ${
                  isBot
                    ? 'bg-slate-950/80 border border-slate-800 text-slate-200'
                    : 'bg-cyan-600 text-white font-medium ml-auto'
                }`}
              >
                <div className="whitespace-pre-line break-words text-xs">
                  {msg.content}
                </div>

                {/* Suggested Alert Action Card */}
                {isBot && msg.suggestedAlertPrice && onOpenAlertModalWithValues && (
                  <div className="mt-3 p-2.5 rounded-xl bg-cyan-950/50 border border-cyan-700/60 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-cyan-300 font-bold flex items-center gap-1">
                        <Bell className="w-3 h-3 text-cyan-400" />
                        AI Recommended Alert Threshold
                      </span>
                      <span className="text-white font-bold">
                        {stock.currency}
                        {msg.suggestedAlertPrice.toLocaleString()} ({msg.suggestedAlertCondition})
                      </span>
                    </div>

                    {msg.suggestedAlertNote && (
                      <div className="text-[11px] text-slate-300 italic">
                        "{msg.suggestedAlertNote}"
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        onOpenAlertModalWithValues(
                          msg.suggestedAlertPrice!,
                          msg.suggestedAlertCondition || 'ABOVE',
                          msg.suggestedAlertNote || 'AI recommended threshold'
                        )
                      }
                      className="mt-1 w-full py-1.5 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold rounded-lg shadow flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Apply This Price Alert
                    </button>
                  </div>
                )}

                <div className="text-[10px] text-slate-400 text-right font-mono">
                  {msg.timestamp}
                </div>
              </div>

              {!isBot && (
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2.5 text-slate-400">
            <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 shrink-0">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              Synthesizing multi-agent intelligence...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/40">
        <div className="text-[10px] font-mono text-slate-500 mb-1.5">QUICK ASSISTANCE:</div>
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p.query)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-mono whitespace-nowrap transition-colors border border-slate-700/60 disabled:opacity-50"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Educational Use Disclaimer */}
      <div className="px-3 pb-1">
        <EducationalDisclaimer variant="footer" actionContext="AI_SIGNAL" />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 border-t border-slate-800 bg-slate-950 rounded-b-2xl flex items-center gap-2"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={`Ask anything about ${stock.symbol}, technicals, or alert targets...`}
          disabled={isLoading}
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 focus:border-cyan-500 focus:outline-none text-slate-200 text-xs font-sans placeholder:text-slate-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || isLoading}
          className="p-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl shadow-md transition-all shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
