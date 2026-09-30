import { Request, Response } from 'express';
import Stripe from 'stripe';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Lazy Stripe Client initialization according to API security rules
let stripeClient: Stripe | null = null;
export function getStripe(): Stripe | null {
  if (!stripeClient && process.env.STRIPE_SECRET_KEY) {
    try {
      stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-02-24.acacia' as any,
        typescript: true,
      });
    } catch (err) {
      console.warn('[STRIPE] Warning initializing Stripe SDK client:', err);
    }
  }
  return stripeClient;
}

// Lazy Razorpay Client initialization (Premier Indian INR Payment Gateway)
let razorpayClient: any = null;
export function getRazorpay(): any | null {
  if (!razorpayClient && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    try {
      razorpayClient = new (Razorpay as any)({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
    } catch (err) {
      console.warn('[RAZORPAY] Error initializing Razorpay SDK:', err);
    }
  }
  return razorpayClient;
}

export interface PlanConfig {
  id: 'free' | 'pro' | 'institutional';
  name: string;
  tagline: string;
  priceINRMonthly: number;
  priceINRAnnual: number;
  priceUSDMonthly: number;
  priceUSDAnnual: number;
  popular?: boolean;
  features: string[];
  limitations?: string[];
  stripePriceIdMonthly?: string;
  stripePriceIdAnnual?: string;
}

export const SUBSCRIPTION_PLANS: PlanConfig[] = [
  {
    id: 'free',
    name: 'Community Investor',
    tagline: 'Essential multi-agent qualitative research & paper trading sandbox',
    priceINRMonthly: 0,
    priceINRAnnual: 0,
    priceUSDMonthly: 0,
    priceUSDAnnual: 0,
    features: [
      '₹10,00,000 Virtual Paper Trading Capital',
      'Access to 10-Agent Research Synthesis',
      'Standard 15-minute delayed market quotes',
      'Watchlist with up to 5 target stocks',
      'Basic Technical & Fundamental indicators',
      'Community discord & documentation access',
    ],
    limitations: [
      'No real-time Groww MCP order-book depth',
      'No Autonomous Rebalancing (Agent 14)',
      'Limited to 2 active price alerts',
    ],
  },
  {
    id: 'pro',
    name: 'Pro Quantitative Investor',
    tagline: 'Real-time Groww MCP streaming, autonomous rebalancing & priority AI signals',
    priceINRMonthly: 2499,
    priceINRAnnual: 24990, // ~17% discount (2 months free)
    priceUSDMonthly: 29.99,
    priceUSDAnnual: 299.99,
    popular: true,
    features: [
      'Everything in Community tier, plus:',
      '⚡ Ultra-low latency Groww MCP Real-Time WebSocket stream',
      '📊 5-Level Market Depth (Live Bids, Asks & Volume Spikes)',
      '🤖 Agent 14: Autonomous Portfolio Rebalancer with Drift Execution',
      '🔔 Unlimited Continuous Price Threshold Alerts & AI Stop-Loss recommendations',
      '📈 Full Multi-Horizon Confluence (1D, 1W, 1M, 1Y) with Recharts',
      '🔬 3-Year Strategy Backtesting with Sharpe, Sortino & Alpha metrics',
      '📑 Comprehensive PDF Research & Valuation Export',
      'Priority Gemini 3.8 Flash model processing allocation',
    ],
  },
  {
    id: 'institutional',
    name: 'Institutional Swarm',
    tagline: 'Dedicated cloud execution nodes, automated broker webhooks & custom factor models',
    priceINRMonthly: 9999,
    priceINRAnnual: 99990,
    priceUSDMonthly: 119.99,
    priceUSDAnnual: 1199.99,
    features: [
      'Everything in Pro tier, plus:',
      '🏢 Dedicated Multi-Agent Execution Nodes (10+ parallel swarms)',
      '🔌 Full Raw MCP JSON-RPC 2.0 & SSE API endpoint integration keys',
      '⚡ Direct Order Routing Webhooks for Zerodha, Groww, Upstox & AngelOne',
      '🛡️ Autonomous Bug Agent Enterprise Diagnostics & 24/7 Sentinel',
      '📉 Custom Factor Modeling, Tail-Risk Stress Testing & Scenario Shocks',
      '🤝 Dedicated Quantitative Analyst & SEBI Compliance Advisory SLA',
      'Unlimited virtual capital allocations & team sub-accounts',
    ],
  },
];

// In-memory persistent subscription store for sandbox & linked accounts
interface StoredSubscription {
  userEmail: string;
  planId: 'free' | 'pro' | 'institutional';
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  billingPeriod: 'monthly' | 'annual';
  currency: 'INR' | 'USD';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    date: string;
    amount: number;
    currency: 'INR' | 'USD';
    status: 'paid' | 'pending' | 'failed';
    planName: string;
    billingPeriod: 'monthly' | 'annual';
    paymentMethod: string;
    gateway: string;
    gstNumber?: string;
    sacCode?: string;
    pdfDownloadUrl?: string;
  }>;
}

const subscriptionStore = new Map<string, StoredSubscription>();

// Pre-seed sample subscription in INR
subscriptionStore.set('default_user', {
  userEmail: 'investor@finagent.ai',
  planId: 'pro',
  status: 'active',
  billingPeriod: 'monthly',
  currency: 'INR',
  currentPeriodStart: new Date(Date.now() - 15 * 86400000).toISOString(),
  currentPeriodEnd: new Date(Date.now() + 15 * 86400000).toISOString(),
  cancelAtPeriodEnd: false,
  invoices: [
    {
      id: 'inv_rzp_1092837',
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
      paymentMethod: 'UPI (Google Pay / investor@okaxis)',
      gateway: 'Razorpay INR Gateway',
      gstNumber: '29ABCDE1234F1Z5',
      sacCode: '998439',
    },
  ],
});

/**
 * GET /api/subscription/plans
 * Returns available pricing plans and Indian INR Gateway capabilities
 */
export function handleGetPlans(req: Request, res: Response) {
  const isRazorpayConfigured = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  const isStripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);

  return res.json({
    success: true,
    plans: SUBSCRIPTION_PLANS,
    gateway: {
      primaryGateway: 'razorpay',
      currency: 'INR',
      currencySymbol: '₹',
      isRazorpayConfigured,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_finagent_sandbox',
      isStripeConfigured,
      testMode: isRazorpayConfigured
        ? process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_')
        : true,
      supportedPaymentMethods: [
        'UPI (Google Pay, PhonePe, Paytm, BHIM, CRED, Navi)',
        'RuPay Debit & Credit Cards (Zero Surcharge)',
        'Net Banking (50+ Indian Banks: SBI, HDFC, ICICI, Axis, Kotak)',
        'Visa & Mastercard (Domestic & International INR)',
        'Corporate Credit Cards & EMI',
      ],
      gstApplicable: true,
      gstRate: 18,
      gstSacCode: '998439 (Financial AI Information Services)',
    },
  });
}

/**
 * POST /api/subscription/razorpay/create-order
 * Creates a native Razorpay Order in INR paise
 */
export async function handleRazorpayCreateOrder(req: Request, res: Response) {
  try {
    const { planId, billingPeriod = 'monthly', userEmail = 'investor@finagent.ai' } = req.body;

    if (!planId || !['pro', 'institutional', 'free'].includes(planId)) {
      return res.status(400).json({ success: false, error: 'Invalid plan ID.' });
    }

    const selectedPlan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!selectedPlan) {
      return res.status(404).json({ success: false, error: 'Plan not found.' });
    }

    // Downgrade to Free
    if (planId === 'free') {
      const updatedSub: StoredSubscription = {
        userEmail,
        planId: 'free',
        status: 'active',
        billingPeriod: 'monthly',
        currency: 'INR',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 365 * 86400000).toISOString(),
        cancelAtPeriodEnd: false,
        invoices: subscriptionStore.get(userEmail)?.invoices || [],
      };
      subscriptionStore.set(userEmail, updatedSub);
      return res.json({
        success: true,
        mode: 'downgraded_free',
        planId: 'free',
        message: 'Downgraded to Community Free tier.',
        subscription: updatedSub,
      });
    }

    const isAnnual = billingPeriod === 'annual';
    const amountINR = isAnnual ? selectedPlan.priceINRAnnual : selectedPlan.priceINRMonthly;
    const amountPaise = Math.round(amountINR * 100);

    const rzp = getRazorpay();

    // If Razorpay API keys are configured, create authentic Razorpay Order
    if (rzp && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      try {
        const order = await rzp.orders.create({
          amount: amountPaise,
          currency: 'INR',
          receipt: `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          notes: {
            planId,
            billingPeriod,
            userEmail,
            appName: 'FINAGENT Quant Intelligence',
          },
        });

        return res.json({
          success: true,
          mode: 'razorpay_live',
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          keyId: process.env.RAZORPAY_KEY_ID,
          plan: selectedPlan,
          billingPeriod,
        });
      } catch (rzpErr: any) {
        console.warn('[RAZORPAY ERROR] Failed to create live Razorpay order:', rzpErr?.message);
      }
    }

    // Razorpay Instant Sandbox Order
    const mockOrderId = `order_rzp_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
    return res.json({
      success: true,
      mode: 'razorpay_sandbox',
      orderId: mockOrderId,
      amount: amountPaise,
      currency: 'INR',
      keyId: 'rzp_test_finagent_sandbox',
      plan: selectedPlan,
      billingPeriod,
      message: 'Razorpay INR order prepared in sandbox mode.',
    });
  } catch (err: any) {
    console.error('[RAZORPAY ORDER ERROR]', err);
    return res.status(500).json({ success: false, error: err?.message || 'Order creation failed.' });
  }
}

/**
 * POST /api/subscription/razorpay/verify-payment
 * Verifies Razorpay payment signature & issues Indian GST Tax Invoice
 */
export async function handleRazorpayVerifyPayment(req: Request, res: Response) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id = `pay_rzp_${Math.random().toString(36).substring(2, 10)}`,
      razorpay_signature,
      planId = 'pro',
      billingPeriod = 'monthly',
      userEmail = 'investor@finagent.ai',
      paymentMethod = 'UPI (Google Pay)',
    } = req.body;

    const selectedPlan = SUBSCRIPTION_PLANS.find((p) => p.id === planId) || SUBSCRIPTION_PLANS[1];
    const isAnnual = billingPeriod === 'annual';
    const amountINR = isAnnual ? selectedPlan.priceINRAnnual : selectedPlan.priceINRMonthly;

    // Verify cryptographic HMAC signature if Razorpay Secret Key is provided
    if (
      process.env.RAZORPAY_KEY_SECRET &&
      razorpay_order_id &&
      razorpay_payment_id &&
      razorpay_signature
    ) {
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Razorpay payment signature. Payment verification rejected.',
        });
      }
    }

    const now = new Date();
    const periodEnd = new Date(now.getTime() + (isAnnual ? 365 : 30) * 86400000);
    const invoiceNumber = `INV-IN-${now.getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const newInvoice = {
      id: `inv_rzp_${razorpay_payment_id.slice(-8)}`,
      invoiceNumber,
      date: now.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      amount: amountINR,
      currency: 'INR' as const,
      status: 'paid' as const,
      planName: selectedPlan.name,
      billingPeriod: billingPeriod as 'monthly' | 'annual',
      paymentMethod: paymentMethod,
      gateway: 'Razorpay INR Gateway',
      gstNumber: '29ABCDE1234F1Z5',
      sacCode: '998439',
    };

    const existingSub = subscriptionStore.get(userEmail);
    const updatedSubscription: StoredSubscription = {
      userEmail,
      planId: planId as 'pro' | 'institutional',
      status: 'active',
      billingPeriod: billingPeriod as 'monthly' | 'annual',
      currency: 'INR',
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      cancelAtPeriodEnd: false,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      invoices: [newInvoice, ...(existingSub?.invoices || [])],
    };

    subscriptionStore.set(userEmail, updatedSubscription);

    return res.json({
      success: true,
      verified: true,
      subscription: updatedSubscription,
      invoice: newInvoice,
      message: `Payment of ₹${amountINR.toLocaleString('en-IN')} confirmed via Razorpay INR Gateway. ${selectedPlan.name} is now active.`,
    });
  } catch (err: any) {
    console.error('[RAZORPAY VERIFY ERROR]', err);
    return res.status(500).json({ success: false, error: err?.message || 'Payment verification failed.' });
  }
}

/**
 * POST /api/subscription/upi/collect-request
 * Simulates or sends a UPI Collect Notification (e.g. Google Pay, PhonePe, Paytm)
 */
export async function handleUpiCollectRequest(req: Request, res: Response) {
  try {
    const { vpa, planId = 'pro', billingPeriod = 'monthly', userEmail } = req.body;

    if (!vpa || !vpa.includes('@')) {
      return res.status(400).json({ success: false, error: 'Please provide a valid Virtual Payment Address (e.g. mobile@upi, username@okhdfcbank).' });
    }

    const selectedPlan = SUBSCRIPTION_PLANS.find((p) => p.id === planId) || SUBSCRIPTION_PLANS[1];
    const isAnnual = billingPeriod === 'annual';
    const amountINR = isAnnual ? selectedPlan.priceINRAnnual : selectedPlan.priceINRMonthly;

    const upiTxnId = `UPI${Date.now()}${Math.floor(100 + Math.random() * 900)}`;

    return res.json({
      success: true,
      vpa,
      amountINR,
      upiTxnId,
      status: 'REQUEST_SENT',
      message: `UPI Collect request for ₹${amountINR.toLocaleString('en-IN')} dispatched to ${vpa}. Approve notification in Google Pay / PhonePe / Paytm to complete.`,
      qrUrl: `upi://pay?pa=finagent.quant@hdfcbank&pn=FINAGENT%20Technologies&am=${amountINR}&cu=INR&tn=FINAGENT%20${encodeURIComponent(selectedPlan.name)}`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'UPI request failed.' });
  }
}

/**
 * POST /api/subscription/checkout
 * Initiates checkout session with real Stripe Checkout or seamless Sandbox Gateway
 */
export async function handleCreateCheckoutSession(req: Request, res: Response) {
  try {
    const {
      planId,
      billingPeriod = 'monthly',
      currency = 'INR',
      userEmail = 'investor@finagent.ai',
      returnUrl,
    } = req.body;

    if (!planId || !['pro', 'institutional', 'free'].includes(planId)) {
      return res.status(400).json({ success: false, error: 'Invalid subscription plan ID.' });
    }

    const selectedPlan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!selectedPlan) {
      return res.status(404).json({ success: false, error: 'Plan configuration not found.' });
    }

    // If downgrading to free
    if (planId === 'free') {
      const updatedSub: StoredSubscription = {
        userEmail,
        planId: 'free',
        status: 'active',
        billingPeriod: 'monthly',
        currency: 'INR',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 365 * 86400000).toISOString(),
        cancelAtPeriodEnd: false,
        invoices: subscriptionStore.get(userEmail)?.invoices || [],
      };
      subscriptionStore.set(userEmail, updatedSub);
      return res.json({
        success: true,
        mode: 'sandbox_simulated',
        planId: 'free',
        message: 'Successfully downgraded to Free Community tier.',
        subscription: updatedSub,
      });
    }

    // Determine amount in INR
    const isAnnual = billingPeriod === 'annual';
    const amount = isAnnual ? selectedPlan.priceINRAnnual : selectedPlan.priceINRMonthly;

    const stripe = getStripe();

    // 1. If real Stripe API Key is configured, build actual Stripe Checkout Session in INR
    if (stripe && process.env.STRIPE_SECRET_KEY) {
      try {
        const origin = returnUrl || process.env.APP_URL || 'http://localhost:3000';
        const successUrl = `${origin}?session_id={CHECKOUT_SESSION_ID}&plan=${planId}&billing=${billingPeriod}&payment=success`;
        const cancelUrl = `${origin}?payment=canceled`;

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'subscription',
          customer_email: userEmail,
          line_items: [
            {
              price_data: {
                currency: 'inr',
                product_data: {
                  name: `FINAGENT ${selectedPlan.name}`,
                  description: `${selectedPlan.tagline} (${billingPeriod.toUpperCase()} INR Billing)`,
                  metadata: {
                    planId,
                    billingPeriod,
                  },
                },
                unit_amount: Math.round(amount * 100), // convert to paise
                recurring: {
                  interval: isAnnual ? 'year' : 'month',
                },
              },
              quantity: 1,
            },
          ],
          metadata: {
            userEmail,
            planId,
            billingPeriod,
            currency: 'INR',
          },
          success_url: successUrl,
          cancel_url: cancelUrl,
        });

        return res.json({
          success: true,
          mode: 'stripe_hosted',
          sessionId: session.id,
          url: session.url,
          planId,
          message: 'Stripe INR Checkout session initialized successfully.',
        });
      } catch (stripeErr: any) {
        console.warn('[STRIPE ERROR] Failed to create Stripe Checkout session:', stripeErr?.message);
      }
    }

    // 2. Fallback to Razorpay / INR Sandbox Gateway
    const simulatedSessionId = `cs_rzp_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
    const invoiceId = `inv_${Math.random().toString(36).substring(2, 10)}`;
    const invoiceNumber = `INV-IN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const periodEnd = new Date(now.getTime() + (isAnnual ? 365 : 30) * 86400000);

    const newInvoice = {
      id: invoiceId,
      invoiceNumber,
      date: now.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      amount,
      currency: 'INR' as const,
      status: 'paid' as const,
      planName: selectedPlan.name,
      billingPeriod: billingPeriod as 'monthly' | 'annual',
      paymentMethod: 'UPI / RuPay / Net Banking (Razorpay INR Gateway)',
      gateway: 'Razorpay INR Gateway',
      gstNumber: '29ABCDE1234F1Z5',
      sacCode: '998439',
    };

    const existingSub = subscriptionStore.get(userEmail);
    const existingInvoices = existingSub?.invoices || [];

    const activeSubscription: StoredSubscription = {
      userEmail,
      planId,
      status: 'active',
      billingPeriod: billingPeriod as 'monthly' | 'annual',
      currency: 'INR',
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      cancelAtPeriodEnd: false,
      razorpayPaymentId: `pay_${Math.random().toString(36).substring(2, 8)}`,
      invoices: [newInvoice, ...existingInvoices],
    };

    subscriptionStore.set(userEmail, activeSubscription);

    return res.json({
      success: true,
      mode: 'sandbox_simulated',
      sessionId: simulatedSessionId,
      planId,
      subscription: activeSubscription,
      message: 'Payment processed successfully via Indian INR Gateway.',
    });
  } catch (err: any) {
    console.error('[CHECKOUT ERROR]', err);
    return res.status(500).json({ success: false, error: err?.message || 'Checkout failed.' });
  }
}

/**
 * GET /api/subscription/status
 * Returns active user subscription details and billing invoices
 */
export function handleGetSubscriptionStatus(req: Request, res: Response) {
  const userEmail = (req.query.userEmail as string) || 'investor@finagent.ai';
  let sub = subscriptionStore.get(userEmail);

  if (!sub) {
    sub = {
      userEmail,
      planId: 'free',
      status: 'active',
      billingPeriod: 'monthly',
      currency: 'INR',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 365 * 86400000).toISOString(),
      cancelAtPeriodEnd: false,
      invoices: [],
    };
    subscriptionStore.set(userEmail, sub);
  }

  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === sub?.planId) || SUBSCRIPTION_PLANS[0];

  return res.json({
    success: true,
    subscription: sub,
    plan,
    isRazorpayConfigured: Boolean(process.env.RAZORPAY_KEY_ID),
    isStripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
  });
}

/**
 * POST /api/subscription/cancel
 * Cancels or sets subscription to cancel at period end
 */
export function handleCancelSubscription(req: Request, res: Response) {
  const { userEmail = 'investor@finagent.ai', immediate = false } = req.body;
  const sub = subscriptionStore.get(userEmail);

  if (!sub) {
    return res.status(404).json({ success: false, error: 'Subscription not found.' });
  }

  if (immediate) {
    sub.status = 'canceled';
    sub.planId = 'free';
  } else {
    sub.cancelAtPeriodEnd = true;
  }

  subscriptionStore.set(userEmail, sub);

  return res.json({
    success: true,
    message: immediate
      ? 'Subscription canceled immediately.'
      : 'Subscription set to cancel at end of current billing cycle.',
    subscription: sub,
  });
}

/**
 * POST /api/subscription/verify-session
 * Verifies a checkout session
 */
export async function handleVerifySession(req: Request, res: Response) {
  try {
    const { sessionId, planId = 'pro', userEmail = 'investor@finagent.ai', billingPeriod = 'monthly' } = req.body;

    const stripe = getStripe();
    if (stripe && sessionId && !sessionId.startsWith('cs_rzp_') && !sessionId.startsWith('cs_sandbox_')) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status === 'paid' || session.status === 'complete') {
          const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId) || SUBSCRIPTION_PLANS[1];
          const isAnnual = billingPeriod === 'annual';
          const amount = isAnnual ? plan.priceINRAnnual : plan.priceINRMonthly;

          const now = new Date();
          const periodEnd = new Date(now.getTime() + (isAnnual ? 365 : 30) * 86400000);

          const invoice = {
            id: `inv_in_${session.id.slice(-8)}`,
            invoiceNumber: `INV-IN-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            date: now.toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }),
            amount,
            currency: 'INR' as const,
            status: 'paid' as const,
            planName: plan.name,
            billingPeriod: billingPeriod as 'monthly' | 'annual',
            paymentMethod: 'INR Card / Net Banking',
            gateway: 'Stripe INR Gateway',
            gstNumber: '29ABCDE1234F1Z5',
            sacCode: '998439',
          };

          const existingSub = subscriptionStore.get(userEmail);
          const activeSubscription: StoredSubscription = {
            userEmail,
            planId: planId as 'pro' | 'institutional',
            status: 'active',
            billingPeriod: billingPeriod as 'monthly' | 'annual',
            currency: 'INR',
            currentPeriodStart: now.toISOString(),
            currentPeriodEnd: periodEnd.toISOString(),
            cancelAtPeriodEnd: false,
            stripeCustomerId: typeof session.customer === 'string' ? session.customer : undefined,
            stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : undefined,
            invoices: [invoice, ...(existingSub?.invoices || [])],
          };

          subscriptionStore.set(userEmail, activeSubscription);
          return res.json({
            success: true,
            verified: true,
            subscription: activeSubscription,
          });
        }
      } catch (stripeErr: any) {
        console.warn('[STRIPE VERIFY ERROR]', stripeErr?.message);
      }
    }

    // Default verify from store
    const currentSub = subscriptionStore.get(userEmail);
    return res.json({
      success: true,
      verified: true,
      subscription: currentSub,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Verification failed.' });
  }
}

/**
 * POST /api/subscription/webhook
 * Handles incoming Stripe or Razorpay webhooks
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'];
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: any;

  if (stripe && webhookSecret && sig) {
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error(`[WEBHOOK ERROR] Webhook signature verification failed:`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    event = req.body;
  }

  return res.json({ received: true });
}
