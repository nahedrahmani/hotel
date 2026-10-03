import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, Lock } from 'lucide-react';
import axios from 'axios';
import { paymentService, type Facture, METHODE_ICONS } from '../services/paymentService';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '');

const CARD_STYLE = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1f2937',
      fontFamily: 'system-ui, sans-serif',
      '::placeholder': { color: '#9ca3af' },
      iconColor: '#6b7280',
    },
    invalid: { color: '#ef4444', iconColor: '#ef4444' },
  },
};

// ── Inner form — uses Stripe hooks ─────────────────────────────────────────

interface CheckoutFormProps {
  facture: Facture;
  montant: number;
  clientSecret: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

function CheckoutForm({ facture, montant, clientSecret, onSuccess }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setCardError('');

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) { setProcessing(false); return; }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: facture.clientNom,
          email: facture.clientEmail ?? undefined,
        },
      },
    });

    if (error) {
      setCardError(error.message ?? 'Une erreur est survenue.');
      setProcessing(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      // Record payment in our system immediately (webhook also handles this as backup)
      try {
        await paymentService.enregistrerPaiement({
          factureId: facture.id!,
          montant,
          methodePaiement: 'CARTE_BANCAIRE',
          reference: paymentIntent.id,
          note: `Stripe PaymentIntent: ${paymentIntent.id}`,
        });
        onSuccess();
      } catch {
        // Payment went through in Stripe — webhook will record it
        onSuccess();
      }
    }

    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Invoice summary */}
      <div className="bg-light rounded p-3 mb-4">
        <div className="d-flex justify-content-between small text-muted mb-1">
          <span>Facture</span>
          <span className="fw-semibold text-dark">{facture.numero}</span>
        </div>
        <div className="d-flex justify-content-between small text-muted mb-1">
          <span>Client</span>
          <span className="fw-semibold text-dark">{facture.clientNom}</span>
        </div>
        <div className="d-flex justify-content-between small text-muted">
          <span>Montant à payer</span>
          <span className="fw-bold text-success fs-6">{montant.toFixed(3)} DT</span>
        </div>
      </div>

      {/* Card input */}
      <div className="mb-3">
        <label className="form-label fw-semibold small">Informations de carte</label>
        <div className="border rounded p-3 bg-white" style={{ borderColor: cardError ? '#ef4444' : '#dee2e6' }}>
          <CardElement options={CARD_STYLE} onChange={() => setCardError('')} />
        </div>
        {cardError && <div className="text-danger small mt-1">{cardError}</div>}
      </div>

      {/* Test card hint */}
      <div className="alert alert-info py-2 small mb-4">
        <strong>Mode test</strong> — utilisez la carte <code>4242 4242 4242 4242</code>,
        date future, CVC quelconque.
      </div>

      <button
        type="submit"
        className="btn btn-success w-100 d-flex align-items-center justify-content-center gap-2"
        disabled={processing || !stripe}
      >
        {processing
          ? <><span className="spinner-border spinner-border-sm" /> Traitement en cours...</>
          : <><Lock size={16} /> Payer {montant.toFixed(3)} DT par carte</>}
      </button>

      <div className="text-center mt-3 text-muted" style={{ fontSize: '0.75rem' }}>
        <Lock size={11} className="me-1" />
        Paiement sécurisé par <strong>Stripe</strong> — vos données ne sont jamais stockées sur nos serveurs.
      </div>
    </form>
  );
}

// ── Outer modal — loads client secret then renders Elements ────────────────

interface Props {
  facture: Facture;
  montant: number;
  onSuccess: () => void;
  onClose: () => void;
}

export default function StripePaymentModal({ facture, montant, onSuccess, onClose }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initError, setInitError] = useState('');

  const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

  const initPayment = async () => {
    setLoading(true);
    setInitError('');
    try {
      const res = await axios.post(`${API_BASE}/api/payment/stripe/create-intent`, {
        factureId: facture.id,
        montant,
      });
      setClientSecret(res.data.clientSecret);
    } catch (e: unknown) {
      setInitError((e as any)?.response?.data?.message ?? 'Impossible d\'initialiser le paiement Stripe.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-init on mount
  React.useEffect(() => { initPayment(); }, []);

  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 480 }}>
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header border-0 pb-0">
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: '1.5rem' }}>{METHODE_ICONS.CARTE_BANCAIRE}</span>
              <h5 className="modal-title fw-bold mb-0">Paiement par carte</h5>
            </div>
            <button className="btn btn-sm btn-light rounded-circle" onClick={onClose} aria-label="Fermer">
              <X size={16} />
            </button>
          </div>

          <div className="modal-body pt-3">
            {loading && (
              <div className="text-center py-4">
                <div className="spinner-border text-primary mb-2" />
                <div className="text-muted small">Initialisation du paiement…</div>
              </div>
            )}

            {initError && (
              <div className="alert alert-danger">
                {initError}
                <button className="btn btn-sm btn-outline-danger ms-3" onClick={initPayment}>Réessayer</button>
              </div>
            )}

            {!loading && !initError && clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm
                  facture={facture}
                  montant={montant}
                  clientSecret={clientSecret}
                  onSuccess={handleSuccess}
                  onError={msg => setInitError(msg)}
                />
              </Elements>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}