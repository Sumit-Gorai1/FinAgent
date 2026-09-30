import React from 'react';
import {
  Check,
  Zap,
  Shield,
  CreditCard,
  Crown,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Clock,
  Download,
  AlertCircle,
  Building2,
  Lock,
  ExternalLink,
  ChevronRight,
  Layers,
  FileText,
  BadgeCheck,
  QrCode,
  Smartphone,
  Landmark,
  Copy,
  Info,
} from 'lucide-react';
import {
  SubscriptionPlan,
  SubscriptionPlanTier,
  BillingPeriod,
  UserSubscription,
  SubscriptionInvoice,
  UserProfile,
} from '../types';

interface SubscriptionBillingHubProps {
  user: UserProfile | null;
  onUpdateUserSubscription?: (sub: UserSubscription, tier: 'PRO_INVESTOR' | 'INSTITUTIONAL' | 'RETAIL') => void;
  onOpenLoginModal?: () => void;
  onClose?: () => void;
}

export const SubscriptionBillingHub: React.FC<SubscriptionBillingHubProps> = ({
  user,
  onUpdateUserSubscription,
  onOpenLoginModal,
  onClose,
}) => {
  const [plans, setPlans] = React.useState<SubscriptionPlan[]>([]);
  const [billingPeriod, setBillingPeriod] = React.useState<BillingPeriod>('monthly');
  const [isLoadingPlans, setIsLoadingPlans] = React.useState<boolean>(true);
  const [isProcessingCheckout, setIsProcessingCheckout] = React.useState<boolean>(false);
  const [checkoutTargetPlan, setCheckoutTargetPlan] = React.useState<SubscriptionPlan | null>(null);

  // INR Payment Gateway Tab in Modal
  const [selectedInrMethod, setSelectedInrMethod] = React.useState<'upi' | 'cards' | 'netbanking' | 'razorpay'>('upi');
  const [upiIdInput, setUpiIdInput] = React.useState<string>('trader@okaxis');
  const [upiCollectSent, setUpiCollectSent] = React.useState<boolean>(false);
  const [selectedBank, setSelectedBank] = React.useState<string>('HDFC');
  const [cardDetails, setCardDetails] = React.useState({
    number: '•••• •••• •••• 5042',
    name: 'SURESH GUPTA',
    expiry: '08/29',
    cvv: '•••',
  });
  const [otpStep, setOtpStep] = React.useState<boolean>(false);
  const [otpInput, setOtpInput] = React.useState<string>('842910');

  const [gatewayStatus, setGatewayStatus] = React.useState<{
    primaryGateway: string;
    currency: string;
    currencySymbol: string;
    isRazorpayConfigured: boolean;
    razorpayKeyId: string;
    supportedPaymentMethods: string[];
    gstApplicable: boolean;
    gstRate: number;
    gstSacCode: string;
  }>({
    primaryGateway: 'razorpay',
    currency: 'INR',
    currencySymbol: '₹',
    isRazorpayConfigured: false,
    razorpayKeyId: 'rzp_test_finagent_sandbox',
    supportedPaymentMethods: [
      'UPI (Google Pay, PhonePe, Paytm, BHIM, CRED)',
      'RuPay Debit & Credit Cards',
      'Net Banking (50+ Indian Scheduled Banks)',
      'Visa & Mastercard (Domestic INR)',
    ],
    gstApplicable: true,
    gstRate: 18,
    gstSacCode: '998439',
  });

  // Current active subscription state
  const [activeSubscription, setActiveSubscription] = React.useState<UserSubscription>({
    planId: (user?.tier === 'INSTITUTIONAL' ? 'institutional' : user?.tier === 'PRO_INVESTOR' ? 'pro' : 'free') as SubscriptionPlanTier,
    status: 'active',
    billingPeriod: 'monthly',
    currency: 'INR',
    currentPeriodStart: new Date(Date.now() - 15 * 86400000).toISOString(),
    currentPeriodEnd: new Date(Date.now() + 15 * 86400000).toISOString(),
    cancelAtPeriodEnd: false,
    invoices: [
      {
        id: 'inv_in_001',
        invoiceNumber: 'INV-IN-2026-0042',
        date: new Date(Date.now() - 15 * 86400000).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        amount: 2499,
        currency: 'INR',
        status: 'paid',
        planName: 'Pro Quantitative Investor',
        billingPeriod: 'monthly',
        paymentMethod: 'UPI (Google Pay / trader@okaxis)',
      },
    ],
  });

  const [notification, setNotification] = React.useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);

  // Load plans and active status from server
  React.useEffect(() => {
    let isMounted = true;
    const loadSubscriptionData = async () => {
      try {
        setIsLoadingPlans(true);
        // 1. Fetch available plans and gateway capability
        const plansRes = await fetch('/api/subscription/plans');
        if (plansRes.ok) {
          const data = await plansRes.json();
          if (isMounted && data.plans) {
            setPlans(data.plans);
            if (data.gateway) {
              setGatewayStatus(data.gateway);
            }
          }
        }

        // 2. Fetch subscription status for user
        const emailParam = encodeURIComponent(user?.email || 'investor@finagent.ai');
        const statusRes = await fetch(`/api/subscription/status?userEmail=${emailParam}`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (isMounted && statusData.subscription) {
            setActiveSubscription(statusData.subscription);
          }
        }
      } catch (err) {
        console.warn('Failed to load subscription data:', err);
      } finally {
        if (isMounted) setIsLoadingPlans(false);
      }
    };

    loadSubscriptionData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Handle Checkout initiation
  const handleInitiateCheckout = (plan: SubscriptionPlan) => {
    if (plan.id === activeSubscription.planId) {
      setNotification({
        type: 'info',
        message: `You are currently subscribed to the ${plan.name} plan.`,
      });
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    setCheckoutTargetPlan(plan);
    setOtpStep(false);
    setUpiCollectSent(false);
  };

  // Execute payment through Razorpay / Indian INR Gateway
  const handleConfirmInrPayment = async () => {
    if (!checkoutTargetPlan) return;
    setIsProcessingCheckout(true);

    try {
      const isAnnual = billingPeriod === 'annual';
      const amountINR = isAnnual ? checkoutTargetPlan.priceINRAnnual : checkoutTargetPlan.priceINRMonthly;

      // 1. Create Razorpay order on backend
      const orderRes = await fetch('/api/subscription/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: checkoutTargetPlan.id,
          billingPeriod,
          userEmail: user?.email || 'investor@finagent.ai',
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to initiate Indian payment gateway order.');
      }

      // 2. Determine payment method label
      let methodLabel = 'UPI (Google Pay / PhonePe)';
      if (selectedInrMethod === 'upi') {
        methodLabel = `UPI (${upiIdInput || 'UPI Quick Pay'})`;
      } else if (selectedInrMethod === 'cards') {
        methodLabel = 'RuPay / Indian Card (•••• 5042)';
      } else if (selectedInrMethod === 'netbanking') {
        methodLabel = `Net Banking (${selectedBank} Bank)`;
      } else {
        methodLabel = 'Razorpay Gateway Direct';
      }

      // 3. Verify payment and generate Indian GST tax invoice
      const verifyRes = await fetch('/api/subscription/razorpay/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: `pay_inr_${Math.random().toString(36).substring(2, 10)}`,
          razorpay_signature: `sig_${Math.random().toString(36).substring(2, 12)}`,
          planId: checkoutTargetPlan.id,
          billingPeriod,
          userEmail: user?.email || 'investor@finagent.ai',
          paymentMethod: methodLabel,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || 'Indian gateway verification failed.');
      }

      if (verifyData.subscription) {
        setActiveSubscription(verifyData.subscription);
        const newTier =
          checkoutTargetPlan.id === 'institutional'
            ? 'INSTITUTIONAL'
            : checkoutTargetPlan.id === 'pro'
            ? 'PRO_INVESTOR'
            : 'RETAIL';

        if (onUpdateUserSubscription) {
          onUpdateUserSubscription(verifyData.subscription, newTier);
        }

        setNotification({
          type: 'success',
          message: `🎉 Payment of ₹${amountINR.toLocaleString('en-IN')} Successful via ${methodLabel}! ${checkoutTargetPlan.name} is now active.`,
        });
        setTimeout(() => setNotification(null), 6000);
      }

      setCheckoutTargetPlan(null);
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err?.message || 'Payment processing failed on Indian INR gateway.',
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  // Dispatch simulated UPI collect request
  const handleSendUpiCollect = async () => {
    if (!checkoutTargetPlan || !upiIdInput.includes('@')) {
      alert('Please enter a valid UPI ID (e.g. mobile@upi, username@okhdfcbank)');
      return;
    }

    try {
      setIsProcessingCheckout(true);
      const res = await fetch('/api/subscription/upi/collect-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vpa: upiIdInput,
          planId: checkoutTargetPlan.id,
          billingPeriod,
          userEmail: user?.email || 'investor@finagent.ai',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUpiCollectSent(true);
      }
    } catch (err) {
      console.warn('UPI dispatch error:', err);
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  // Handle Cancellation
  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your FINAGENT subscription at the end of the current billing cycle?')) {
      return;
    }

    try {
      const res = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user?.email || 'investor@finagent.ai',
          immediate: false,
        }),
      });

      const data = await res.json();
      if (data.success && data.subscription) {
        setActiveSubscription(data.subscription);
        setNotification({
          type: 'info',
          message: 'Subscription will remain active until the end of your billing cycle and will not renew.',
        });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (err: any) {
      alert('Failed to update subscription cancellation.');
    }
  };

  // Price calculation in INR
  const getInrPrice = (plan: SubscriptionPlan) => {
    if (billingPeriod === 'annual') {
      const monthlyEq = Math.round(plan.priceINRAnnual / 12);
      return {
        display: `₹${monthlyEq.toLocaleString('en-IN')}`,
        period: '/month',
        billedText:
          plan.priceINRAnnual > 0
            ? `Billed annually (₹${plan.priceINRAnnual.toLocaleString('en-IN')}/yr)`
            : 'Free forever',
        rawAnnual: plan.priceINRAnnual,
        rawTotal: plan.priceINRAnnual,
      };
    }
    return {
      display: `₹${plan.priceINRMonthly.toLocaleString('en-IN')}`,
      period: '/month',
      billedText: plan.priceINRMonthly > 0 ? 'Billed monthly' : 'Free forever',
      rawAnnual: plan.priceINRAnnual,
      rawTotal: plan.priceINRMonthly,
    };
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner & Gateway Badge */}
      <div className="p-4 sm:p-6 md:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-emerald-950/30 border border-slate-800/80 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-800/80 font-bold shadow-sm">
                <span>🇮🇳</span>
                <span>INDIAN INR PAYMENT GATEWAY</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800/80 text-cyan-300 border border-slate-700 text-[11px] font-semibold">
                <Zap className="w-3 h-3 text-cyan-400" />
                <span>Razorpay • UPI • RuPay • NetBanking</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight font-mono">
              Unlock Autonomous Quant Swarms & Institutional Analytics
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Supercharge your research with ultra-low latency Groww MCP streaming order depth, Autonomous Portfolio
              Rebalancing (Agent 14), continuous price threshold alerts, and multi-horizon AI conviction.
            </p>
          </div>

          {/* Current Membership Card Widget */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/80 w-full lg:w-auto min-w-0 lg:min-w-[280px] shadow-lg backdrop-blur space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
              <span>YOUR CURRENT PLAN</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                {activeSubscription.status.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-lg font-bold text-white capitalize">
                {activeSubscription.planId === 'institutional'
                  ? 'Institutional Swarm'
                  : activeSubscription.planId === 'pro'
                  ? 'Pro Quantitative'
                  : 'Community Investor'}
              </span>
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
              <span>Renews On:</span>
              <span className="text-slate-200">
                {new Date(activeSubscription.currentPeriodEnd).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            {activeSubscription.cancelAtPeriodEnd && (
              <div className="text-[10px] text-amber-400 bg-amber-950/40 p-1.5 rounded border border-amber-900/50">
                ⚠️ Scheduled to cancel at period end
              </div>
            )}
          </div>
        </div>

        {/* Indian Billing Cycle Toggle (Monthly vs Annual in INR) */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono">Billing Cycle:</span>
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 inline-flex items-center gap-1 font-mono text-xs">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-1.5 rounded-lg transition-all ${
                  billingPeriod === 'monthly'
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly (₹ INR)
              </button>
              <button
                onClick={() => setBillingPeriod('annual')}
                className={`px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  billingPeriod === 'annual'
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Annual (₹ INR)</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                  Save 17% (2 Mo Free)
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Inclusive of 18% GST (SAC: 998439) • RBI Compliant</span>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs font-mono flex items-center gap-3 border shadow-lg ${
            notification.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-200'
              : notification.type === 'error'
              ? 'bg-rose-950/60 border-rose-700/80 text-rose-200'
              : 'bg-cyan-950/60 border-cyan-700/80 text-cyan-200'
          }`}
        >
          {notification.type === 'success' ? (
            <BadgeCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          )}
          <span className="flex-1">{notification.message}</span>
        </div>
      )}

      {/* Pricing Cards Grid in INR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = activeSubscription.planId === plan.id;
          const priceInfo = getInrPrice(plan);
          const isPro = plan.id === 'pro';
          const isInstitutional = plan.id === 'institutional';

          return (
            <div
              key={plan.id}
              className={`rounded-3xl p-6 md:p-7 flex flex-col justify-between transition-all relative ${
                isPro
                  ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/30 border-2 border-emerald-500/80 shadow-2xl shadow-emerald-950/40 ring-1 ring-emerald-500/20'
                  : isInstitutional
                  ? 'bg-slate-900/90 border border-indigo-700/50 shadow-xl'
                  : 'bg-slate-900/60 border border-slate-800 shadow-lg'
              }`}
            >
              {/* Popular Badge */}
              {isPro && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-[11px] font-mono font-bold tracking-wider uppercase shadow-md flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-slate-950" />
                  MOST POPULAR • INDIAN QUANT PRO
                </div>
              )}

              {isInstitutional && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-indigo-900/90 text-indigo-200 border border-indigo-700 text-[10px] font-mono font-bold tracking-wider uppercase shadow-md flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-indigo-400" />
                  INDIAN PMS & HEDGE FUND NODES
                </div>
              )}

              {/* Plan Header */}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white font-mono">{plan.name}</h3>
                  {isCurrent && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                      CURRENT PLAN
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1 min-h-[36px]">{plan.tagline}</p>

                {/* Price Display in INR */}
                <div className="mt-5 pb-5 border-b border-slate-800">
                  <div className="flex items-baseline gap-1.5 font-mono">
                    <span className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                      {priceInfo.display}
                    </span>
                    <span className="text-xs text-slate-400">{priceInfo.period}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono block mt-1">
                    {priceInfo.billedText}
                  </span>
                </div>

                {/* Features List */}
                <div className="mt-6 space-y-3">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                    What's included:
                  </span>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Limitations for free */}
                  {plan.limitations && plan.limitations.length > 0 && (
                    <div className="pt-3 border-t border-slate-800/60 space-y-1.5 text-xs text-slate-500">
                      {plan.limitations.map((lim, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
                          <span>{lim}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-4">
                {isCurrent ? (
                  <div className="space-y-2">
                    <button
                      disabled
                      className="w-full py-3 rounded-xl bg-slate-800/90 text-emerald-400 font-mono font-bold text-xs border border-slate-700/80 cursor-default flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Active Tier ({activeSubscription.billingPeriod.toUpperCase()})
                    </button>
                    {plan.id !== 'free' && !activeSubscription.cancelAtPeriodEnd && (
                      <button
                        onClick={handleCancelSubscription}
                        className="w-full text-center text-[11px] font-mono text-slate-500 hover:text-rose-400 transition-colors py-1"
                      >
                        Cancel Auto-Renewal
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleInitiateCheckout(plan)}
                    className={`w-full py-3 rounded-xl font-mono font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${
                      isPro
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/40'
                        : isInstitutional
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-900/30'
                        : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
                    }`}
                  >
                    <span>
                      {plan.id === 'free'
                        ? 'Downgrade to Free'
                        : `Pay ₹ with Indian Gateway`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Deep-Dive Comparison Matrix */}
      <div className="p-6 md:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              CAPABILITIES & TIER MATRIX (INR PRICING)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Transparent comparison across execution speed, AI swarm depth, broker connectors, and compliance.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">SEBI Research Synthesis Certified</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold text-slate-300">Feature Capability</th>
                <th className="pb-3 text-center w-36">Community (₹0)</th>
                <th className="pb-3 text-center w-44 text-emerald-300 font-bold bg-emerald-950/20 rounded-t-lg">
                  Pro Quant (₹2,499)
                </th>
                <th className="pb-3 text-center w-48 text-indigo-300 font-bold">Institutional Swarm (₹9,999)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-3 font-medium text-white">Live Groww MCP Real-Time Streaming</td>
                <td className="py-3 text-center text-slate-500">15-min Delayed</td>
                <td className="py-3 text-center text-emerald-400 font-bold bg-emerald-950/20">Ultra-Low Latency</td>
                <td className="py-3 text-center text-emerald-400 font-bold">Dedicated Node Feed</td>
              </tr>
              <tr>
                <td className="py-3 font-medium text-white">5-Level Market Depth & Order Book</td>
                <td className="py-3 text-center text-slate-500">—</td>
                <td className="py-3 text-center text-emerald-400 font-bold bg-emerald-950/20">Full L2 Depth</td>
                <td className="py-3 text-center text-emerald-400 font-bold">Full L2 + Algo Flow</td>
              </tr>
              <tr>
                <td className="py-3 font-medium text-white">Agent 14: Autonomous Portfolio Rebalancing</td>
                <td className="py-3 text-center text-slate-500">Read-Only</td>
                <td className="py-3 text-center text-emerald-400 font-bold bg-emerald-950/20">Unlimited Execution</td>
                <td className="py-3 text-center text-emerald-400 font-bold">Multi-Portfolio Swarm</td>
              </tr>
              <tr>
                <td className="py-3 font-medium text-white">Price Threshold Alerts & Stop-Loss Engine</td>
                <td className="py-3 text-center text-slate-400">Max 2 Alerts</td>
                <td className="py-3 text-center text-emerald-400 font-bold bg-emerald-950/20">Unlimited Active Alerts</td>
                <td className="py-3 text-center text-emerald-400 font-bold">Continuous Webhook Dispatch</td>
              </tr>
              <tr>
                <td className="py-3 font-medium text-white">Indian Broker Routing Webhooks (Zerodha, Groww, Upstox)</td>
                <td className="py-3 text-center text-slate-500">—</td>
                <td className="py-3 text-center text-slate-500 bg-emerald-950/20">—</td>
                <td className="py-3 text-center text-emerald-400 font-bold">Direct Automated Routing</td>
              </tr>
              <tr>
                <td className="py-3 font-medium text-white">GST Tax Invoice with Input Tax Credit (ITC)</td>
                <td className="py-3 text-center text-slate-500">—</td>
                <td className="py-3 text-center text-emerald-400 font-bold bg-emerald-950/20">Included (18% GST)</td>
                <td className="py-3 text-center text-emerald-400 font-bold">Included (Corporate Tax Invoice)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoices & Billing History Panel (INR & GST) */}
      <div className="p-6 md:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4 font-mono">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">INDIAN TAX INVOICES & BILLING HISTORY (₹ INR)</h2>
          </div>
          <span className="text-[11px] text-slate-400">GSTIN: 29ABCDE1234F1Z5 • SAC: 998439</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2.5">Invoice #</th>
                <th className="pb-2.5">Date</th>
                <th className="pb-2.5">Plan</th>
                <th className="pb-2.5">Amount (₹)</th>
                <th className="pb-2.5">Gateway & Mode</th>
                <th className="pb-2.5">Status</th>
                <th className="pb-2.5 text-right">Tax Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {activeSubscription.invoices && activeSubscription.invoices.length > 0 ? (
                activeSubscription.invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-3 font-bold text-white">{inv.invoiceNumber}</td>
                    <td className="py-3 text-slate-400">{inv.date}</td>
                    <td className="py-3 font-semibold text-emerald-300">{inv.planName}</td>
                    <td className="py-3 font-bold text-white">
                      ₹{inv.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 text-slate-400">{inv.paymentMethod}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {inv.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() =>
                          alert(
                            `TAX INVOICE (${inv.invoiceNumber})\n\nIssuer: FINAGENT Technologies Pvt Ltd\nGSTIN: 29ABCDE1234F1Z5\nSAC Code: 998439\nPlan: ${inv.planName}\nBase Amount: ₹${Math.round(
                              inv.amount / 1.18
                            )}\nCGST (9%): ₹${Math.round(
                              (inv.amount / 1.18) * 0.09
                            )}\nSGST (9%): ₹${Math.round(
                              (inv.amount / 1.18) * 0.09
                            )}\nTotal Paid: ₹${inv.amount.toLocaleString(
                              'en-IN'
                            )}\nMode: ${inv.paymentMethod}\nStatus: PAID`
                          )
                        }
                        className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download GST Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    No payment invoices recorded yet. Subscribe to a plan above to generate your first receipt.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Indian INR Payment Checkout Modal (Razorpay / UPI / RuPay) */}
      {checkoutTargetPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-xl w-full p-4 sm:p-6 md:p-7 shadow-2xl space-y-6 font-mono relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  ₹
                </div>
                <div>
                  <span className="text-sm font-bold text-white block">
                    INDIAN INR PAYMENT GATEWAY
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Powered by Razorpay & National Payments Corporation of India (NPCI)
                  </span>
                </div>
              </div>
              <button
                onClick={() => setCheckoutTargetPlan(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Order Summary & Tax Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Plan:</span>
                <span className="text-white font-bold">{checkoutTargetPlan.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Billing Interval:</span>
                <span className="text-emerald-400 font-semibold capitalize">
                  {billingPeriod} (Auto-renews)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Base Price:</span>
                <span className="text-slate-300">
                  ₹{Math.round(getInrPrice(checkoutTargetPlan).rawTotal / 1.18).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">GST (18% CGST+SGST):</span>
                <span className="text-slate-300">
                  ₹{(
                    getInrPrice(checkoutTargetPlan).rawTotal -
                    Math.round(getInrPrice(checkoutTargetPlan).rawTotal / 1.18)
                  ).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-sm">
                <span className="font-bold text-white">Total Amount in INR:</span>
                <span className="font-bold text-emerald-400 text-lg">
                  ₹{getInrPrice(checkoutTargetPlan).rawTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Payment Method Tabs for INR */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 block">
                SELECT INDIAN PAYMENT METHOD:
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedInrMethod('upi')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    selectedInrMethod === 'upi'
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedInrMethod('cards')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    selectedInrMethod === 'cards'
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>RuPay / Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedInrMethod('netbanking')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    selectedInrMethod === 'netbanking'
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Landmark className="w-4 h-4 text-emerald-400" />
                  <span>Net Banking</span>
                </button>
              </div>

              {/* Method Detail Panel */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-3">
                {/* 1. UPI Tab Content */}
                {selectedInrMethod === 'upi' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Supported UPI Apps:</span>
                      <span className="text-emerald-400 font-bold">
                        GPay • PhonePe • Paytm • BHIM • CRED
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-slate-400 block">
                        Enter UPI ID / VPA:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={upiIdInput}
                          onChange={(e) => setUpiIdInput(e.target.value)}
                          placeholder="e.g. mobile@upi, user@okhdfcbank"
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleSendUpiCollect}
                          className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                        >
                          Request Collect
                        </button>
                      </div>
                    </div>

                    {/* Dynamic UPI QR Code Box */}
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-4">
                      <div className="w-16 h-16 bg-white p-1 rounded-lg flex items-center justify-center shrink-0">
                        <QrCode className="w-14 h-14 text-slate-950" />
                      </div>
                      <div className="space-y-1 text-[11px]">
                        <span className="font-bold text-white block">
                          Or Scan & Pay with any UPI App
                        </span>
                        <p className="text-slate-400">
                          Scan with Google Pay, PhonePe or Paytm to authorize ₹
                          {getInrPrice(checkoutTargetPlan).rawTotal.toLocaleString('en-IN')}.
                        </p>
                        <span className="text-[10px] text-emerald-400 font-mono">
                          UPI ID: finagent.quant@hdfcbank
                        </span>
                      </div>
                    </div>

                    {upiCollectSent && (
                      <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-700/80 text-[11px] text-emerald-300 flex items-center gap-2">
                        <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>
                          Collect request sent to {upiIdInput}. Click 'Confirm Payment' below once authorized.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. RuPay & Cards Content */}
                {selectedInrMethod === 'cards' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Card Types:</span>
                      <span className="text-emerald-400 font-bold">
                        RuPay (Zero Fee) • Visa • Mastercard
                      </span>
                    </div>

                    <div className="space-y-2 text-[11px]">
                      <div>
                        <label className="text-slate-400 block mb-1">Card Number:</label>
                        <input
                          type="text"
                          value={cardDetails.number}
                          onChange={(e) =>
                            setCardDetails({ ...cardDetails, number: e.target.value })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-slate-400 block mb-1">Expiry:</label>
                          <input
                            type="text"
                            value={cardDetails.expiry}
                            onChange={(e) =>
                              setCardDetails({ ...cardDetails, expiry: e.target.value })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1">CVV:</label>
                          <input
                            type="password"
                            value={cardDetails.cvv}
                            onChange={(e) =>
                              setCardDetails({ ...cardDetails, cvv: e.target.value })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      <span>2-Factor Authentication with RBI 3D Secure OTP</span>
                    </div>
                  </div>
                )}

                {/* 3. Net Banking Content */}
                {selectedInrMethod === 'netbanking' && (
                  <div className="space-y-3">
                    <label className="text-[11px] text-slate-400 block">
                      Select Indian Bank:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['HDFC', 'SBI', 'ICICI', 'Axis', 'Kotak', 'PNB'].map((bank) => (
                        <button
                          key={bank}
                          type="button"
                          onClick={() => setSelectedBank(bank)}
                          className={`py-2 px-1 rounded-lg border text-center transition-all ${
                            selectedBank === bank
                              ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                          }`}
                        >
                          {bank} Bank
                        </button>
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      Direct secure redirection to {selectedBank} NetBanking gateway.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Actions */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleConfirmInrPayment}
                disabled={isProcessingCheckout}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-950/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessingCheckout ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing on Indian Payment Gateway...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>
                      Pay ₹{getInrPrice(checkoutTargetPlan).rawTotal.toLocaleString('en-IN')} via Razorpay / INR Gateway
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setCheckoutTargetPlan(null)}
                className="w-full py-2.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                Cancel & Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
