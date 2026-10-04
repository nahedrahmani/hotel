import { useCallback, useRef, useState, type ReactNode } from 'react';

type Options = { confirmLabel?: string; danger?: boolean };
type Pending = Options & { message: ReactNode; resolve: (ok: boolean) => void };

/**
 * Confirmation dialog in the app's modal style, used instead of window.confirm.
 *   const [confirm, confirmDialog] = useConfirm();
 *   if (!(await confirm('Supprimer cette facture ?', { danger: true }))) return;
 *   ...render {confirmDialog} once in the page.
 */
export function useConfirm(): [(message: ReactNode, options?: Options) => Promise<boolean>, ReactNode] {
  const [pending, setPending] = useState<Pending | null>(null);
  const pendingRef = useRef<Pending | null>(null);

  const confirm = useCallback((message: ReactNode, options: Options = {}) =>
    new Promise<boolean>(resolve => {
      const p = { ...options, message, resolve };
      pendingRef.current = p;
      setPending(p);
    }), []);

  const close = (ok: boolean) => {
    pendingRef.current?.resolve(ok);
    pendingRef.current = null;
    setPending(null);
  };

  const dialog = pending && (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} role="dialog" aria-modal>
      <div className="modal-dialog modal-dialog-centered modal-sm">
        <div className="modal-content border-0 shadow">
          <div className="modal-body pt-4">{pending.message}</div>
          <div className="modal-footer border-0">
            <button className="btn btn-light" onClick={() => close(false)}>Annuler</button>
            <button className={`btn ${pending.danger ? 'btn-danger' : 'btn-dark'}`} onClick={() => close(true)} autoFocus>
              {pending.confirmLabel ?? (pending.danger ? 'Supprimer' : 'Confirmer')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return [confirm, dialog];
}
