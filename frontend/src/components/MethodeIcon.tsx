import { CreditCard, Wallet, Banknote, Landmark, FileText, Globe } from 'lucide-react';
import type { MethodePaiement } from '../services/paymentService';

const ICONS: Record<MethodePaiement, typeof CreditCard> = {
  CARTE_BANCAIRE: CreditCard, PAYPAL: Wallet, ESPECES: Banknote, VIREMENT_BANCAIRE: Landmark, CHEQUE: FileText, KONNECT: Globe,
};

/** Icon for a payment method (replaces the old emoji map). */
export default function MethodeIcon({ methode, size = 16 }: { methode: MethodePaiement; size?: number }) {
  const Icon = ICONS[methode] ?? Wallet;
  return <Icon size={size} />;
}
