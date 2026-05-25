import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import useAuthStore from '../store/authStore';
import { createDonationOrder, verifyPayment } from '../api/donations';

const page = {
  initial:    { opacity: 0, y: 20 },
  animate:    { opacity: 1, y: 0 },
  exit:       { opacity: 0, y: -10 },
  transition: { duration: 0.3 },
};

function fmtINR(amount) {
  return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
}

function fmtDate(dateStr) {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Step Indicator ──────────────────────────────────────────────────────────

function StepIndicator({ current }) {
  const steps = ['Summary', 'Payment', 'Success'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 36 }}>
      {steps.map((label, i) => {
        const step = i + 1;
        const done = current > step;
        const active = current === step;
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? 'var(--color-primary)' : '#fff',
                border: `2.5px solid ${(done || active) ? 'var(--color-primary)' : 'var(--color-border)'}`,
                color: done ? '#fff' : active ? 'var(--color-primary)' : '#9CA3AF',
                fontWeight: 700, fontSize: 15,
                boxShadow: active ? '0 0 0 4px rgba(13,110,110,0.12)' : 'none',
                transition: 'all 0.3s',
              }}>
                {done ? <Check size={17} strokeWidth={3} /> : step}
              </div>
              <span style={{
                fontSize: 12,
                fontWeight: active ? 600 : 400,
                color: (done || active) ? 'var(--color-primary)' : '#9CA3AF',
                whiteSpace: 'nowrap',
              }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                width: 56, height: 2, marginBottom: 18,
                background: current > step ? 'var(--color-primary)' : 'var(--color-border)',
                transition: 'background 0.3s',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Verify Overlay ──────────────────────────────────────────────────────────

function VerifyOverlay() {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 32,
        width: 300, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          width: 40, height: 40,
          border: '4px solid var(--color-border)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px',
        }} />
        <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>
          Verifying your payment...
        </p>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          Please don't close this window
        </p>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function DonationCheckout() {
  const { charityId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const state = location.state || {};
  const amount      = state.amount      || 0;
  const projectId   = state.projectId   || null;
  const message     = state.message     || '';
  const isAnonymous = state.isAnonymous || false;
  const charityName = state.charityName || 'the charity';

  useEffect(() => {
    if (!amount || amount < 10) {
      toast.error('Please select a charity and donation amount first');
      navigate('/charities', { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [currentStep,       setCurrentStep]       = useState(1);
  const [loading,           setLoading]           = useState(false);
  const [orderData,         setOrderData]         = useState(null);
  const [showVerifyOverlay, setShowVerifyOverlay] = useState(false);
  const [completedDonation, setCompletedDonation] = useState(null);

  // ── Create order when entering step 2 ────────────────────────────────────

  const initiatePayment = useCallback(async () => {
    setLoading(true);
    try {
      const res = await createDonationOrder({
        charityId,
        amount,
        projectId:   projectId  || undefined,
        message:     message    || undefined,
        isAnonymous: isAnonymous || false,
      });
      setOrderData(res.data.data);
    } catch (err) {
      toast.error(err.message || 'Failed to create order');
      setCurrentStep(1);
    } finally {
      setLoading(false);
    }
  }, [charityId, amount, projectId, message, isAnonymous]);

  useEffect(() => {
    if (currentStep === 2) initiatePayment();
  }, [currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Confetti on success ───────────────────────────────────────────────────

  useEffect(() => {
    if (currentStep === 3) {
      confetti({
        particleCount: 160,
        spread: 75,
        origin: { y: 0.5 },
        colors: ['#0D6E6E', '#F4A535', '#22C55E', '#FFFFFF'],
      });
    }
  }, [currentStep]);

  // ── Razorpay handlers ─────────────────────────────────────────────────────

  const handlePaymentSuccess = async (response) => {
    setShowVerifyOverlay(true);
    try {
      const res = await verifyPayment({
        razorpay_order_id:   response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature:  response.razorpay_signature,
        donationId:          orderData.donationId,
      });
      setCompletedDonation(res.data.data);
      setCurrentStep(3);
    } catch (err) {
      toast.error(
        `Payment verification failed. Reference ID: ${response.razorpay_payment_id}`
      );
    } finally {
      setShowVerifyOverlay(false);
    }
  };

  const openRazorpay = () => {
    if (!window.Razorpay) {
      toast.error('Payment system not loaded. Please refresh the page.');
      return;
    }

    const options = {
      key:         orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY,
      amount:      orderData.amount,   // already in paise from backend
      currency:    'INR',
      name:        'GiveHope',
      description: `Donation to ${orderData.charityName}`,
      image:       '/favicon.svg',
      order_id:    orderData.orderId,
      prefill: {
        name:    user?.name    || '',
        email:   user?.email   || '',
        contact: user?.phone   || '',
      },
      notes: {
        donationId:  orderData.donationId,
        charityName: orderData.charityName,
      },
      theme: { color: '#0D6E6E' },
      modal: {
        ondismiss: () => {
          toast('Payment cancelled. You can try again.', { icon: 'ℹ️' });
        },
      },
      handler: async (response) => {
        await handlePaymentSuccess(response);
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  // ── Step 1 — Summary ──────────────────────────────────────────────────────

  const charityInitial = charityName ? charityName[0].toUpperCase() : '?';

  const renderStep1 = () => (
    <div className="card" style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
        <div style={{
          width: 46, height: 46, borderRadius: '50%',
          background: 'var(--color-primary)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 20, flexShrink: 0,
        }}>
          {charityInitial}
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 3 }}>{charityName}</p>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 12, fontWeight: 600, color: 'var(--color-success)',
            background: 'rgba(34,197,94,0.10)', borderRadius: 999, padding: '2px 10px',
          }}>
            ✓ Verified
          </span>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '0 0 22px' }} />

      {/* Amount */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ color: 'var(--color-text-muted)', fontSize: 15 }}>Donation Amount</span>
        <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-primary)' }}>
          {fmtINR(amount)}
        </span>
      </div>

      {/* Project */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Project</span>
        <span style={{ fontSize: 14, fontWeight: 500 }}>
          {projectId ? 'Selected Project' : 'General Donation'}
        </span>
      </div>

      {/* Message */}
      {message && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, gap: 16 }}>
          <span style={{ color: 'var(--color-text-muted)', fontSize: 14, flexShrink: 0 }}>Message</span>
          <span style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--color-text-muted)', textAlign: 'right' }}>
            "{message}"
          </span>
        </div>
      )}

      {/* Anonymous */}
      {isAnonymous && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Anonymous</span>
          <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
            Yes — your name won't be shown
          </span>
        </div>
      )}

      <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '18px 0' }} />

      {/* Total */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontWeight: 600, fontSize: 16 }}>Total Payable</span>
        <span style={{ fontWeight: 700, fontSize: 20 }}>{fmtINR(amount)}</span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'right', marginBottom: 28 }}>
        100% goes to the charity. Zero platform fee.
      </p>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none', border: 'none',
            color: 'var(--color-primary)', fontWeight: 600, fontSize: 14,
            cursor: 'pointer', padding: '12px 14px',
            borderRadius: 'var(--radius-sm)', fontFamily: 'inherit',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          ← Change Amount
        </button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setCurrentStep(2)}
          style={{
            flex: 1, background: 'var(--color-accent)', color: '#1A1A2E',
            border: 'none', borderRadius: 'var(--radius-md)',
            fontWeight: 700, fontSize: 16, cursor: 'pointer',
            padding: '14px 20px', fontFamily: 'inherit',
          }}
        >
          Proceed to Payment →
        </motion.button>
      </div>
    </div>
  );

  // ── Step 2 — Payment ──────────────────────────────────────────────────────

  const renderStep2 = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{
            width: 44, height: 44,
            border: '4px solid var(--color-border)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>
            Preparing your payment...
          </p>
        </div>
      );
    }

    if (!orderData) return null;

    return (
      <div className="card" style={{ padding: 32 }}>
        {/* Donor info */}
        <div style={{
          marginBottom: 20, padding: '14px 18px',
          background: 'rgba(13,110,110,0.04)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(13,110,110,0.12)',
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8 }}>
            Donating as:
          </p>
          <p style={{ fontWeight: 700, marginBottom: 2 }}>{user?.name}</p>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 8 }}>{user?.email}</p>
          <p style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 600 }}>
            🔒 Your details are secured
          </p>
        </div>

        {/* Payment method card */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '16px 18px', background: '#fff',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          borderLeft: '4px solid var(--color-primary)',
          marginBottom: 16,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 700, color: '#072654', fontSize: 15, letterSpacing: '-0.01em' }}>
                razorpay
              </span>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                India's #1 Payment Gateway
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              Pay via UPI, Cards, Net Banking, Wallets &amp; More
            </p>
          </div>
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: 'var(--color-success)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Check size={14} color="#fff" strokeWidth={3} />
          </div>
        </div>

        {/* Test mode banner */}
        <div style={{
          background: '#FFFBEB', border: '1.5px solid #F4A535',
          borderRadius: 10, padding: '12px 16px', margin: '0 0 20px',
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>🧪</span>
          <div>
            <div style={{ fontWeight: 600, color: '#92400E', fontSize: 13 }}>
              Test Mode — No real money charged
            </div>
            <div style={{ color: '#B45309', fontSize: 12, marginTop: 4 }}>
              Use card: <strong>4111 1111 1111 1111</strong> ·{' '}
              Any future expiry · Any CVV · OTP: <strong>1234</strong>
            </div>
          </div>
        </div>

        {/* Pay button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={openRazorpay}
          style={{
            width: '100%', background: 'var(--color-accent)', color: '#1A1A2E',
            border: 'none', borderRadius: 12,
            fontWeight: 700, fontSize: 17, cursor: 'pointer',
            padding: '16px 20px', fontFamily: 'inherit',
            letterSpacing: '-0.01em',
          }}
        >
          Pay {fmtINR(amount)} Securely →
        </motion.button>

        <button
          onClick={() => { setCurrentStep(1); setOrderData(null); }}
          style={{
            background: 'none', border: 'none',
            color: 'var(--color-text-muted)', fontSize: 13,
            cursor: 'pointer', width: '100%', textAlign: 'center',
            marginTop: 12, fontFamily: 'inherit', padding: 6,
          }}
        >
          ← Go back
        </button>
      </div>
    );
  };

  // ── Step 3 — Success ──────────────────────────────────────────────────────

  const renderStep3 = () => {
    const donation        = completedDonation;
    const paymentId       = donation?.paymentId   || '';
    const donationDate    = donation?.updatedAt   || donation?.createdAt || new Date().toISOString();
    const projectName     = donation?.project?.title || 'General Donation';
    const finalCharity    = donation?.charity?.name  || charityName;
    const finalAmount     = donation?.amount          || amount;

    const shareText = encodeURIComponent(
      `I just donated ₹${parseFloat(finalAmount).toLocaleString('en-IN')} to ${finalCharity} on GiveHope! 🙏 Join me in making a difference.`
    );

    const copyPaymentId = () => {
      navigator.clipboard.writeText(paymentId)
        .then(() => toast.success('Copied!'))
        .catch(() => toast.error('Could not copy'));
    };

    return (
      <>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'var(--color-success)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            animation: 'popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: '0 8px 24px rgba(34,197,94,0.30)',
          }}>
            <Check size={36} color="#fff" strokeWidth={3} />
          </div>
          <h2 style={{ fontWeight: 800, fontSize: 26, marginBottom: 8 }}>
            Thank You, {user?.name?.split(' ')[0]}! 🙏
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-primary)', fontStyle: 'italic' }}>
            Your generosity makes a real difference
          </p>
        </div>

        {/* Summary card */}
        <div style={{
          background: '#F0FAF7', borderRadius: 12,
          padding: 22, marginBottom: 24, position: 'relative',
        }}>
          <span style={{
            position: 'absolute', top: 16, right: 16,
            background: 'var(--color-success)', color: '#fff',
            fontSize: 11, fontWeight: 700,
            borderRadius: 999, padding: '3px 10px', letterSpacing: '0.02em',
          }}>
            CONFIRMED
          </span>

          <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, paddingRight: 90 }}>
            {finalCharity}
          </p>
          <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-primary)', marginBottom: 14 }}>
            {fmtINR(finalAmount)}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Project</span>
              <span style={{ fontWeight: 500 }}>{projectName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
              <span style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}>Transaction ID</span>
              <button
                onClick={copyPaymentId}
                title="Click to copy"
                style={{
                  background: 'rgba(0,0,0,0.06)', border: 'none',
                  borderRadius: 6, padding: '3px 9px',
                  fontFamily: 'monospace', fontSize: 11,
                  cursor: 'pointer', color: 'var(--color-text)',
                  maxWidth: 200, overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
              >
                {paymentId || '—'}
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Date</span>
              <span style={{ fontWeight: 500 }}>{fmtDate(donationDate)}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => window.print()}
            className="no-print"
            style={{
              background: '#fff', border: '2px solid var(--color-primary)',
              color: 'var(--color-primary)', borderRadius: 'var(--radius-md)',
              fontWeight: 600, fontSize: 14, cursor: 'pointer',
              padding: '13px 20px', fontFamily: 'inherit', width: '100%',
            }}
          >
            🖨️ Download Receipt
          </button>

          <a
            href={`https://wa.me/?text=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="no-print"
            style={{
              display: 'block', textAlign: 'center', textDecoration: 'none',
              background: '#22C55E', color: '#fff',
              borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 14,
              padding: '13px 20px', fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          >
            💬 Share on WhatsApp
          </a>

          <a
            href={`https://twitter.com/intent/tweet?text=${shareText}&url=https://givehope.in`}
            target="_blank"
            rel="noopener noreferrer"
            className="no-print"
            style={{
              display: 'block', textAlign: 'center', textDecoration: 'none',
              background: '#1A1A2E', color: '#fff',
              borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 14,
              padding: '13px 20px', fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          >
            𝕏 Share on X / Twitter
          </a>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/charities')}
            className="no-print"
            style={{
              background: 'var(--color-accent)', color: '#1A1A2E',
              border: 'none', borderRadius: 'var(--radius-md)',
              fontWeight: 700, fontSize: 15, cursor: 'pointer',
              padding: '14px 20px', fontFamily: 'inherit', width: '100%',
            }}
          >
            Explore More Charities →
          </motion.button>
        </div>
      </>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <motion.div {...page}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes popIn  {
          0%   { transform: scale(0); }
          70%  { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @media print {
          nav, footer, .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>

      {showVerifyOverlay && <VerifyOverlay />}

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '100px 20px 80px' }}>
        <StepIndicator current={currentStep} />

        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}
            >
              {renderStep1()}
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}
            >
              {renderStep2()}
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}
            >
              {renderStep3()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
