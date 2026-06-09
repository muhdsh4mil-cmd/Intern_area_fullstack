import React, { useState, useEffect, useCallback } from "react";
import { getMySubscription, getPaymentHistory } from "../api/subscriptionsAPI";
import { createOrder, verifyPayment } from "../api/paymentsAPI";

// ─── Plan definitions ──────────────────────────────────────────────────────────
const PLANS = [
  {
    id: "free",
    name: "Free",
    emoji: "🌱",
    price: 0,
    priceLabel: "Free forever",
    limit: "1 application / month",
    limitNum: 1,
    color: "from-slate-500 to-slate-600",
    cardBorder: "border-slate-200",
    badgeBg: "bg-slate-100 text-slate-700",
    btnClass: "bg-slate-100 text-slate-500 cursor-not-allowed",
    features: [
      "1 internship application / month",
      "Basic profile & resume builder",
      "Browse all job listings",
      "Community access",
    ],
    popular: false,
  },
  {
    id: "bronze",
    name: "Bronze",
    emoji: "🥉",
    price: 100,
    priceLabel: "₹100 / month",
    limit: "3 applications / month",
    limitNum: 3,
    color: "from-amber-500 to-orange-500",
    cardBorder: "border-amber-200",
    badgeBg: "bg-amber-100 text-amber-700",
    btnClass: "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-200",
    features: [
      "3 internship applications / month",
      "Priority application visibility",
      "Resume analytics",
      "All Free features",
    ],
    popular: false,
  },
  {
    id: "silver",
    name: "Silver",
    emoji: "🥈",
    price: 300,
    priceLabel: "₹300 / month",
    limit: "5 applications / month",
    limitNum: 5,
    color: "from-slate-400 to-blue-500",
    cardBorder: "border-blue-200",
    badgeBg: "bg-blue-100 text-blue-700",
    btnClass: "bg-gradient-to-r from-slate-400 to-blue-500 text-white hover:from-slate-500 hover:to-blue-600 shadow-lg shadow-blue-200",
    features: [
      "5 internship applications / month",
      "Featured candidate badge",
      "Direct HR message access",
      "All Bronze features",
    ],
    popular: true,
  },
  {
    id: "gold",
    name: "Gold",
    emoji: "🥇",
    price: 1000,
    priceLabel: "₹1,000 / month",
    limit: "Unlimited applications",
    limitNum: Infinity,
    color: "from-yellow-400 to-amber-500",
    cardBorder: "border-yellow-300",
    badgeBg: "bg-yellow-100 text-yellow-700",
    btnClass: "bg-gradient-to-r from-yellow-400 to-amber-500 text-white hover:from-yellow-500 hover:to-amber-600 shadow-lg shadow-yellow-200",
    features: [
      "Unlimited internship applications",
      "Top of search results",
      "Dedicated placement support",
      "All Silver features",
    ],
    popular: false,
  },
];

// ─── IST Time helpers ──────────────────────────────────────────────────────────
function getISTNow() {
  const now = new Date();
  return new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
}

function isPaymentWindowOpen() {
  const ist = getISTNow();
  const h = ist.getUTCHours();
  const m = ist.getUTCMinutes();
  const total = h * 60 + m;
  return total >= 600 && total < 660;
}

function getTimeUntilNextWindow() {
  const ist = getISTNow();
  const h = ist.getUTCHours();
  const m = ist.getUTCMinutes();
  const total = h * 60 + m;

  let minsLeft;
  if (total < 600) {
    minsLeft = 600 - total;
  } else if (total >= 660) {
    minsLeft = 1440 - total + 600;
  } else {
    return null; // window open
  }

  const hh = Math.floor(minsLeft / 60);
  const mm = minsLeft % 60;
  return hh > 0 ? `${hh}h ${mm}m` : `${mm}m`;
}

// ─── Inline checkout handler — loads Razorpay script dynamically ──────────────
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ─── Subcomponents ─────────────────────────────────────────────────────────────

function PaymentWindowBanner({ open, timeUntil, bypassActive, onToggleBypass, showToggle }) {
  if (open) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl px-5 py-3 text-sm font-semibold shadow-sm mb-8 animate-fade-in">
        <div className="flex items-center gap-3">
          <span className="text-xl animate-pulse">🟢</span>
          <span>
            {bypassActive ? (
              <span>🛠️ <strong>Developer Mode:</strong> Payment time-window restriction is bypassed on localhost.</span>
            ) : (
              <span>Payment window is <strong>open now</strong> (10:00 AM – 11:00 AM IST). Upgrade your plan anytime until 11:00 AM!</span>
            )}
          </span>
        </div>
        {showToggle && (
          <button 
            onClick={onToggleBypass}
            className="text-xs px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 font-bold transition-all shrink-0 cursor-pointer"
          >
            Enable Strict Time Limit
          </button>
        )}
      </div>
    );
  }
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-5 py-3 text-sm font-semibold shadow-sm mb-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <span className="text-xl">🔒</span>
        <span>
          Payments are only available <strong>10:00 AM – 11:00 AM IST</strong>.
          {timeUntil && <> Next window opens in <strong>{timeUntil}</strong>.</>}
        </span>
      </div>
      {showToggle && (
        <button 
          onClick={onToggleBypass}
          className="text-xs px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 font-bold transition-all shrink-0 cursor-pointer"
        >
          🛠️ Bypass Limit (Dev Mode)
        </button>
      )}
    </div>
  );
}

function UsageMeter({ used, limit, plan }) {
  if (!plan || plan === "free") return null;
  const isUnlimited = limit === null;
  const pct = isUnlimited ? 100 : Math.min(100, Math.round((used / limit) * 100));
  const barColor = pct >= 100 ? "bg-red-500" : pct >= 70 ? "bg-amber-400" : "bg-emerald-500";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-8 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-slate-700">This month's applications</span>
        <span className="text-sm font-bold text-slate-900">
          {isUnlimited ? `${used} used` : `${used} / ${limit}`}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      {isUnlimited && (
        <p className="text-xs text-emerald-600 font-semibold">✨ Unlimited — apply as many times as you like!</p>
      )}
    </div>
  );
}

function SuccessModal({ invoiceNumber, plan, planExpiresAt, onClose }) {
  const planObj = PLANS.find((p) => p.id === plan);
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center animate-scale-up">
        <div className="text-6xl mb-4">{planObj?.emoji || "🎉"}</div>
        <h2 className="font-outfit font-extrabold text-2xl text-slate-800 mb-2">
          Subscription Activated!
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          Your <strong>{planObj?.name} Plan</strong> is now active.
          {planExpiresAt && (
            <> Valid until <strong>{new Date(planExpiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong>.</>
          )}
        </p>
        <div className="bg-slate-50 rounded-2xl p-4 mb-6 text-left">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Invoice Number</p>
          <p className="font-mono font-bold text-slate-800 text-sm">{invoiceNumber}</p>
        </div>
        <p className="text-xs text-slate-400 mb-6">📧 A detailed invoice has been sent to your registered email address.</p>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary-light text-white font-bold text-sm hover:opacity-90 transition-opacity"
        >
          Done — Let's Apply! 🚀
        </button>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function PricingPlans({ user, setView, addToast }) {
  const isDevHost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const [bypassWindow, setBypassWindow] = useState(isDevHost);
  const [subscription, setSubscription] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(isPaymentWindowOpen());
  const [timeUntil, setTimeUntil] = useState(getTimeUntilNextWindow());
  const [processingPlan, setProcessingPlan] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [activeTab, setActiveTab] = useState("plans"); // "plans" | "history"

  // Fetch subscription data
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getMySubscription()
      .then(setSubscription)
      .catch(() => setSubscription({ plan: "free", monthlyApplicationsUsed: 0, monthlyLimit: 1, isUnlimited: false }))
      .finally(() => setLoading(false));
  }, [user]);

  // Tick the IST clock every 30 seconds to update window state
  useEffect(() => {
    const tick = () => {
      setPaymentOpen(isPaymentWindowOpen());
      setTimeUntil(getTimeUntilNextWindow());
    };
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  // Fetch history when tab switches
  useEffect(() => {
    if (activeTab === "history" && user) {
      getPaymentHistory()
        .then((d) => setHistory(d.subscriptions || []))
        .catch(() => {});
    }
  }, [activeTab, user]);

  const handleUpgrade = useCallback(async (plan) => {
    if (!user) {
      addToast("Please log in to upgrade your plan.", "info");
      return;
    }
    if (!paymentOpen && !bypassWindow) {
      addToast("Payments are only available 10:00 AM – 11:00 AM IST.", "info");
      return;
    }

    setProcessingPlan(plan);

    try {
      // Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        addToast("Failed to load payment gateway. Please try again.", "error");
        setProcessingPlan(null);
        return;
      }

      // Create order on backend
      const order = await createOrder({ plan });

      // Open Razorpay checkout modal
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "InternArea",
        description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan Subscription`,
        order_id: order.orderId,
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: { color: "#008BDC" },
        handler: async (response) => {
          try {
            const result = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan,
            });
            // Refresh subscription data
            const updated = await getMySubscription();
            setSubscription(updated);
            setSuccessData({ invoiceNumber: result.invoiceNumber, plan, planExpiresAt: result.planExpiresAt });
          } catch (err) {
            addToast(err.response?.data?.message || "Payment verification failed.", "error");
          } finally {
            setProcessingPlan(null);
          }
        },
        modal: {
          ondismiss: () => setProcessingPlan(null),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to initiate payment.";
      addToast(msg, "error");
      setProcessingPlan(null);
    }
  }, [user, paymentOpen, addToast]);

  const currentPlan = subscription?.plan || "free";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

        {/* ── Header ── */}
        <div className="text-center mb-10">
          <span className="inline-block bg-primary/10 text-primary text-[11px] font-extrabold px-4 py-1.5 rounded-full uppercase tracking-widest border border-primary/20 mb-4 font-outfit">
            Subscription Plans
          </span>
          <h1 className="font-outfit font-extrabold text-4xl sm:text-5xl text-slate-900 tracking-tight mb-3">
            Unlock More <span className="text-primary">Opportunities</span>
          </h1>
          <p className="text-slate-500 text-base max-w-xl mx-auto">
            Choose the plan that matches your ambition. Upgrade anytime to apply for more internships and stand out from the crowd.
          </p>
        </div>

        {/* ── Tab switcher ── */}
        <div className="flex justify-center mb-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-1 flex gap-1 shadow-sm">
            {["plans", "history"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-primary text-white shadow-md shadow-primary/30"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab === "plans" ? "📋 Plans" : "🧾 Payment History"}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "plans" && (
          <>
            {/* ── Payment window banner ── */}
            <PaymentWindowBanner 
              open={paymentOpen || bypassWindow} 
              timeUntil={paymentOpen || bypassWindow ? null : timeUntil} 
              bypassActive={bypassWindow}
              onToggleBypass={() => setBypassWindow(!bypassWindow)}
              showToggle={isDevHost}
            />

            {/* ── Usage meter (for logged-in paid users) ── */}
            {subscription && (
              <UsageMeter
                used={subscription.monthlyApplicationsUsed}
                limit={subscription.monthlyLimit}
                plan={subscription.plan}
              />
            )}

            {/* ── Plan cards ── */}
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {PLANS.map((plan) => {
                  const isCurrent = plan.id === currentPlan;
                  const isUpgrade = PLANS.findIndex(p => p.id === plan.id) > PLANS.findIndex(p => p.id === currentPlan);
                  const isProcessing = processingPlan === plan.id;

                  return (
                    <div
                      key={plan.id}
                      className={`relative bg-white rounded-3xl border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col ${
                        plan.cardBorder
                      } ${isCurrent ? "ring-2 ring-primary ring-offset-2" : ""} ${
                        plan.popular ? "shadow-lg" : "shadow-sm"
                      }`}
                    >
                      {/* Popular badge */}
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-primary text-white text-[11px] font-extrabold px-4 py-1 rounded-full shadow-md">
                            ⭐ Most Popular
                          </span>
                        </div>
                      )}

                      {/* Current plan badge */}
                      {isCurrent && (
                        <div className="absolute -top-3 right-4">
                          <span className="bg-emerald-500 text-white text-[11px] font-extrabold px-3 py-1 rounded-full shadow-md">
                            ✓ Your Plan
                          </span>
                        </div>
                      )}

                      <div className="p-6 flex flex-col flex-1">
                        {/* Plan icon & name */}
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center text-2xl mb-4 shadow-md`}>
                          {plan.emoji}
                        </div>
                        <h3 className="font-outfit font-extrabold text-xl text-slate-800 mb-1">{plan.name} Plan</h3>
                        <p className="text-2xl font-extrabold text-slate-900 mb-1 font-outfit">
                          {plan.price === 0 ? <span className="text-slate-500 text-lg">Free</span> : `₹${plan.price}`}
                          {plan.price > 0 && <span className="text-slate-400 text-sm font-semibold"> /mo</span>}
                        </p>
                        <p className={`inline-flex self-start text-xs font-bold px-3 py-1 rounded-full mb-4 ${plan.badgeBg}`}>
                          {plan.limit}
                        </p>

                        {/* Features */}
                        <ul className="space-y-2 mb-6 flex-1">
                          {plan.features.map((f) => (
                            <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                              <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                              {f}
                            </li>
                          ))}
                        </ul>

                        {/* CTA button */}
                        {plan.id === "free" || isCurrent ? (
                          <div className={`w-full py-2.5 rounded-xl text-center text-sm font-bold ${plan.id === "free" ? "bg-slate-100 text-slate-400" : "bg-emerald-50 text-emerald-600 border border-emerald-200"}`}>
                            {isCurrent ? "✓ Active Plan" : "Current Plan"}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleUpgrade(plan.id)}
                            disabled={(!paymentOpen && !bypassWindow) || isProcessing || !isUpgrade}
                            className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${plan.btnClass}`}
                          >
                            {isProcessing ? (
                              <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Processing...
                              </span>
                            ) : (!paymentOpen && !bypassWindow) ? (
                              "🔒 Opens 10–11 AM IST"
                            ) : !isUpgrade ? (
                              "Downgrade not available"
                            ) : (
                              `Upgrade to ${plan.name} →`
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Bottom note ── */}
            <p className="text-center text-xs text-slate-400 mt-8">
              🔒 Secure payment via Razorpay &nbsp;·&nbsp; Plans renew monthly &nbsp;·&nbsp; Cancel anytime &nbsp;·&nbsp; Invoice sent to your email
            </p>
          </>
        )}

        {activeTab === "history" && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="font-outfit font-bold text-lg text-slate-800">Payment History</h3>
              <p className="text-slate-400 text-sm mt-0.5">All your past subscriptions and transactions</p>
            </div>
            {history.length === 0 ? (
              <div className="py-16 text-center">
                <span className="text-4xl block mb-3">🧾</span>
                <p className="text-slate-500 font-semibold">No payments yet</p>
                <p className="text-slate-400 text-sm mt-1">Your subscription history will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {history.map((sub) => {
                  const planObj = PLANS.find((p) => p.id === sub.plan);
                  return (
                    <div key={sub._id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${planObj?.color || "from-slate-400 to-slate-500"} flex items-center justify-center text-lg`}>
                          {planObj?.emoji || "📋"}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{planObj?.name || sub.plan} Plan</p>
                          <p className="text-xs text-slate-400">{sub.invoiceNumber} · {new Date(sub.startDate).toLocaleDateString("en-IN")}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-800">₹{sub.price}</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          sub.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}>
                          {sub.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Back button ── */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setView("dashboard")}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 font-semibold transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* ── Success modal ── */}
      {successData && (
        <SuccessModal
          invoiceNumber={successData.invoiceNumber}
          plan={successData.plan}
          planExpiresAt={successData.planExpiresAt}
          onClose={() => {
            setSuccessData(null);
            setView("dashboard");
          }}
        />
      )}
    </div>
  );
}
