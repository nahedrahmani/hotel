import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CreditCard, FlaskConical, X } from 'lucide-react';
import { paymentService } from '../../services/paymentService';
import { apiError } from '../../utils/api';
import { formatDT } from '../../utils/format';

/**
 * Stands in for Konnect's payment page when payment-service runs with KONNECT_MODE=simulation.
 * No money moves: "Payer" marks the simulated payment as completed, then the guest goes back to
 * the hotel exactly as Konnect would send them, and the payment is confirmed the usual way.
 */
export default function SimulatedPaymentPage() {
  const [params] = useSearchParams();
  const ref = params.get('payment_ref') ?? '';
  const [payment, setPayment] = useState<{ status: string; amount: number; description: string } | null>(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState<'pay' | 'refuse' | null>(null);

  useEffect(() => {
    paymentService.getSimulatedPayment(ref)
      .then(r => setPayment(r.data))
      .catch(e => setError(apiError(e, 'Paiement introuvable.')));
  }, [ref]);

  const finish = async (paid: boolean) => {
    setSending(paid ? 'pay' : 'refuse');
    setError('');
    try {
      const res = await paymentService.finishSimulatedPayment(ref, paid);
      window.location.assign(res.data.redirectUrl);
    } catch (e) {
      setError(apiError(e, 'Le paiement n\'a pas pu être traité.'));
      setSending(null);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: 520 }}>
      <div className="alert alert-warning d-flex align-items-center gap-2 py-2 small">
        <FlaskConical size={16} /> Mode simulation : aucun paiement réel n'est effectué.
      </div>
      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <h2 className="h5 fw-bold mb-4">Paiement sécurisé</h2>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          {!payment && !error && <div className="text-center py-4"><div className="spinner-border" /></div>}
          {payment && (
            <>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Destinataire</span>
                <span className="fw-semibold">Royal Tulip Korbous Bay</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Objet</span>
                <span>{payment.description}</span>
              </div>
              <div className="d-flex justify-content-between align-items-baseline border-top pt-3 mt-3 mb-4">
                <span className="text-muted">Montant</span>
                {/* Konnect amounts are in millimes */}
                <span className="fs-3 fw-bold">{formatDT(payment.amount / 1000)}</span>
              </div>
              {payment.status === 'pending' ? (
                <div className="d-flex gap-2">
                  <button className="btn btn-light d-flex align-items-center gap-2" onClick={() => finish(false)} disabled={sending !== null}>
                    {sending === 'refuse' ? <span className="spinner-border spinner-border-sm" /> : <X size={16} />} Refuser
                  </button>
                  <button className="btn btn-dark flex-grow-1 d-flex align-items-center justify-content-center gap-2" onClick={() => finish(true)} disabled={sending !== null}>
                    {sending === 'pay' ? <span className="spinner-border spinner-border-sm" /> : <CreditCard size={16} />}
                    Payer {formatDT(payment.amount / 1000)}
                  </button>
                </div>
              ) : (
                <div className="alert alert-secondary py-2 mb-0">Ce paiement est déjà terminé.</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
