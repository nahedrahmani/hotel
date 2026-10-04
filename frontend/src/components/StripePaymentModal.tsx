import React, { useEffect, useState } from 'react';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, Lock, CreditCard } from 'lucide-react';
import { paymentService, type Facture, STRIPE_PUBLISHABLE_KEY } from '../services/paymentService';
import { apiError } from '../utils/api';
import { formatDT } from '../utils/format';

// Stripe.js is fetched the first time a payment dialog opens, not on every page load
let stripePromise: Promise<Stripe | null> | null = null;
const getStripe = () => (stripePromise ??= loadStripe(STRIPE_PUBLISHABLE_KEY));

const TEST_MODE = STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_');

const CARD_STYLE = {
  style: {
    base: { fontSize: '16px', color: '#212529', fontFamily: 'system-ui, sans-serif', '::placeholder': { color: '#6c757d' } },
    invalid: { color: '#dc3545' },
  },
};

interface CheckoutFormProps {
  facture: Facture;
  montant: number;
  clientSecret: string;
  onSuccess: () => void;
}

function CheckoutForm({ facture, montant, clientSecret, onSuccess }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const card = elements?.getElement(CardElement);
    if (!stripe || !card) return;

    setProcessing(true);
    setCardError('');
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card, billing_details: { name: facture.clientNom, email: facture.clientEmail ?? undefined } },
    });

    if (error) {
      setCardError(error.message ?? 'Le paiement a été refusé.');
      setProcessing(false);
      return;
    }
    if (paymentIntent?.status === 'succeeded') {
      // The server checks this PaymentIntent with Stripe before recording the payment
      try {
        await paymentService.enregistrerPaiement({
          factureId: facture.id!, montant, methodePaiement: 'CARTE_BANCAIRE',
          reference: paymentIntent.id, note: `Stripe ${paymentIntent.id}`,
        });
      } catch {
        // Charged but not recorded yet: the Stripe webhook records it as a fallback
      }
      onSuccess();
    }
    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <dl className="row small bg-light rounded-3 p-3 mx-0 mb-3">
        <dt className="col-6 text-muted fw-normal">Facture</dt>
        <dd className="col-6 text-end mb-1">{facture.numero}</dd>
        <dt className="col-6 text-muted fw-normal">Montant</dt>
        <dd className="col-6 text-end fw-semibold mb-0">{formatDT(montant)}</dd>
      </dl>

      <label className="form-label fw-semibold small">Carte bancaire</label>
      <div className={`border rounded-2 p-3 bg-white ${cardError ? 'border-danger' : ''}`}>
        <CardElement options={CARD_STYLE} onChange={() => setCardError('')} />
      </div>
      {cardError && <div className="text-danger small mt-1">{cardError}</div>}

      {TEST_MODE && (
        <div className="text-muted small mt-2">Mode test : carte 4242 4242 4242 4242, date future, CVC quelconque.</div>
      )}

      <button type="submit" className="btn btn-dark w-100 d-flex align-items-center justify-content-center gap-2 mt-4"
        disabled={processing || !stripe}>
        {processing ? <span className="spinner-border spinner-border-sm" /> : <Lock size={15} />}
        Payer {formatDT(montant)}
      </button>
      <div className="text-center text-muted mt-2" style={{ fontSize: '0.75rem' }}>
        Paiement traité par Stripe. Les données de carte ne passent pas par nos serveurs.
      </div>
    </form>
  );
}

interface Props {
  facture: Facture;
  montant: number;
  onSuccess: () => void;
  onClose: () => void;
}

export default function StripePaymentModal({ facture, montant, onSuccess, onClose }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState('');

  const initPayment = async () => {
    setLoading(true);
    setInitError('');
    try {
      setClientSecret((await paymentService.createStripeIntent(facture.id!, montant)).data.clientSecret);
    } catch (e) {
      setInitError(apiError(e, 'Le paiement n\'a pas pu démarrer.'));
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { initPayment(); }, []);

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 460 }}>
        <div className="modal-content border-0 shadow">
          <div className="modal-header border-0">
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2"><CreditCard size={18} /> Paiement par carte</h5>
            <button className="btn btn-sm btn-light" onClick={onClose} aria-label="Fermer"><X size={16} /></button>
          </div>
          <div className="modal-body pt-0">
            {loading && <div className="text-center py-4"><div className="spinner-border" /></div>}
            {initError && (
              <div className="alert alert-danger py-2 d-flex justify-content-between align-items-center gap-3">
                <span>{initError}</span>
                <button className="btn btn-sm btn-outline-danger" onClick={initPayment}>Réessayer</button>
              </div>
            )}
            {!loading && !initError && clientSecret && (
              <Elements stripe={getStripe()} options={{ clientSecret }}>
                <CheckoutForm facture={facture} montant={montant} clientSecret={clientSecret}
                  onSuccess={() => { onSuccess(); onClose(); }} />
              </Elements>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
