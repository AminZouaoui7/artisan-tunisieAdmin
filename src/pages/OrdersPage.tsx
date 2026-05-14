import {
  AlertCircle,
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  Loader2,
  MailCheck,
  PackageCheck,
  Search,
  Send,
  ShieldCheck,
  Truck,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/OrdersPage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5163";

type OrderStatus = "Pending" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled";
type PaymentStatus = "Unpaid" | "AwaitingBankTransfer" | "Paid";
type ShippingStatus = "NotShipped" | "Preparing" | "Shipped" | "Delivered";

type AdminOrder = {
  id: string;
  publicReference?: string;
  customerName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  trackingNumber?: string | null;
  shippingProvider?: string | null;
  createdAt: string;
  itemsCount: number;
};

type ToastKind = "success" | "error" | "info";

type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
};

type ConfirmActionKind = "validate" | "paid" | "cancel" | "shipping";

type ConfirmAction = {
  kind: ConfirmActionKind;
  order: AdminOrder;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
};

const orderStatusLabels: Record<string, string> = {
  Pending: "En attente",
  Confirmed: "Confirmée",
  Shipped: "Expédiée",
  Delivered: "Livrée",
  Cancelled: "Annulée",
};

const paymentStatusLabels: Record<string, string> = {
  Unpaid: "Non payé",
  AwaitingBankTransfer: "Virement attendu",
  Paid: "Payé",
};

const shippingStatusLabels: Record<string, string> = {
  NotShipped: "Non expédiée",
  Preparing: "Préparation",
  Shipped: "Expédiée",
  Delivered: "Livrée",
};

function getToken() {
  return (
    localStorage.getItem("artisan_admin_token") ||
    localStorage.getItem("artisan_access_token") ||
    localStorage.getItem("token") ||
    ""
  );
}

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Une erreur est survenue.");
  }

  return data as T;
}

export default function OrdersPage() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [shippingStatus, setShippingStatus] = useState("");

  const [shippingModalOrder, setShippingModalOrder] = useState<AdminOrder | null>(null);
  const [shippingProvider, setShippingProvider] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const pushToast = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now();

    setToasts((prev) => [...prev, { id, kind, message }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3800);
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (status) params.append("status", status);
      if (paymentStatus) params.append("paymentStatus", paymentStatus);
      if (shippingStatus) params.append("shippingStatus", shippingStatus);
      if (search.trim()) params.append("search", search.trim());

      const query = params.toString();
      const data = await apiRequest<AdminOrder[]>(`/api/admin/orders${query ? `?${query}` : ""}`);

      setOrders(data);
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Erreur chargement commandes.");
    } finally {
      setLoading(false);
    }
  }, [status, paymentStatus, shippingStatus, search, pushToast]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      fetchOrders();
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [fetchOrders]);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((x) => x.status === "Pending").length,
      paid: orders.filter((x) => x.paymentStatus === "Paid").length,
      shipped: orders.filter((x) => x.shippingStatus === "Shipped").length,
    };
  }, [orders]);

  const runAction = async (
    orderId: string,
    actionName: string,
    request: () => Promise<unknown>,
    successMessage: string
  ) => {
    try {
      setActionLoading(`${orderId}-${actionName}`);
      await request();
      pushToast("success", successMessage);
      await fetchOrders();
    } catch (error) {
      pushToast("error", error instanceof Error ? error.message : "Action impossible.");
    } finally {
      setActionLoading(null);
    }
  };

  const askValidateOrder = (order: AdminOrder) => {
    setConfirmAction({
      kind: "validate",
      order,
      title: "Valider cette commande ?",
      message: "Le client recevra un email de validation avec les instructions de paiement.",
      confirmLabel: "Valider la commande",
    });
  };

  const askMarkAsPaid = (order: AdminOrder) => {
    setConfirmAction({
      kind: "paid",
      order,
      title: "Confirmer le paiement ?",
      message: "La commande passera en préparation et une facture sera envoyée au client.",
      confirmLabel: "Confirmer le paiement",
    });
  };

  const askCancelOrder = (order: AdminOrder) => {
    setConfirmAction({
      kind: "cancel",
      order,
      title: "Annuler cette commande ?",
      message: "Cette action restaurera le stock et le client recevra un email d’annulation.",
      confirmLabel: "Annuler la commande",
      danger: true,
    });
  };

  const openShippingModal = (order: AdminOrder) => {
    setShippingModalOrder(order);
    setShippingProvider(order.shippingProvider ?? "");
    setTrackingNumber(order.trackingNumber ?? "");
  };

  const submitShipping = () => {
    if (!shippingModalOrder) return;

    if (!shippingProvider.trim() || !trackingNumber.trim()) {
      pushToast("error", "Transporteur et numéro de suivi sont obligatoires.");
      return;
    }

    setConfirmAction({
      kind: "shipping",
      order: shippingModalOrder,
      title: "Confirmer l’expédition ?",
      message: "Le client recevra un email avec le transporteur et le numéro de suivi.",
      confirmLabel: "Confirmer l’expédition",
    });
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;

    const { kind, order } = confirmAction;
    setConfirmAction(null);

    if (kind === "validate") {
      await runAction(
        order.id,
        "validate",
        () => apiRequest(`/api/admin/orders/${order.id}/validate`, { method: "PATCH" }),
        "Commande validée et email envoyé au client."
      );
    }

    if (kind === "paid") {
      await runAction(
        order.id,
        "paid",
        () => apiRequest(`/api/admin/orders/${order.id}/mark-paid`, { method: "PATCH" }),
        "Paiement confirmé, facture envoyée et commande mise en préparation."
      );
    }

    if (kind === "cancel") {
      await runAction(
        order.id,
        "cancel",
        () => apiRequest(`/api/admin/orders/${order.id}/cancel`, { method: "PATCH" }),
        "Commande annulée et stock restauré."
      );
    }

    if (kind === "shipping") {
      await runAction(
        order.id,
        "shipping",
        () =>
          apiRequest(`/api/admin/orders/${order.id}/shipping`, {
            method: "PATCH",
            body: JSON.stringify({
              status: "Shipped",
              shippingProvider: shippingProvider.trim(),
              trackingNumber: trackingNumber.trim(),
            }),
          }),
        "Commande expédiée et email de suivi envoyé."
      );

      setShippingModalOrder(null);
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency || "EUR",
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  };

  const getOrderReference = (order: AdminOrder) => {
    return order.publicReference || order.id;
  };

  return (
    <div className="admin-orders-page">
      <div className="orders-toast-stack">
        {toasts.map((toast) => (
          <div key={toast.id} className={`orders-toast orders-toast-${toast.kind}`}>
            {toast.kind === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      <section className="orders-hero">
        <div>
          <span className="orders-kicker">
            <ShieldCheck size={16} />
            Administration
          </span>
          <h1>Gestion des commandes</h1>
        </div>

        <button className="orders-refresh-btn" onClick={fetchOrders}>
          {loading ? <Loader2 className="spin" size={18} /> : <PackageCheck size={18} />}
          Actualiser
        </button>
      </section>

      <section className="orders-stats-grid">
        <div className="orders-stat-card">
          <div className="orders-stat-icon">
            <PackageCheck size={22} />
          </div>
          <span>Total commandes</span>
          <strong>{stats.total}</strong>
        </div>

        <div className="orders-stat-card warning">
          <div className="orders-stat-icon">
            <Clock3 size={22} />
          </div>
          <span>En attente</span>
          <strong>{stats.pending}</strong>
        </div>

        <div className="orders-stat-card success">
          <div className="orders-stat-icon">
            <CreditCard size={22} />
          </div>
          <span>Payées</span>
          <strong>{stats.paid}</strong>
        </div>

        <div className="orders-stat-card purple">
          <div className="orders-stat-icon">
            <Truck size={22} />
          </div>
          <span>Expédiées</span>
          <strong>{stats.shipped}</strong>
        </div>
      </section>

      <section className="orders-panel">
        <div className="orders-toolbar">
          <div className="orders-search">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par client, email, téléphone ou référence..."
            />
          </div>

          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Tous les statuts</option>
            <option value="Pending">En attente</option>
            <option value="Confirmed">Confirmée</option>
            <option value="Shipped">Expédiée</option>
            <option value="Delivered">Livrée</option>
            <option value="Cancelled">Annulée</option>
          </select>

          <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
            <option value="">Tous paiements</option>
            <option value="Unpaid">Non payé</option>
            <option value="AwaitingBankTransfer">Virement attendu</option>
            <option value="Paid">Payé</option>
          </select>

          <select value={shippingStatus} onChange={(e) => setShippingStatus(e.target.value)}>
            <option value="">Toutes livraisons</option>
            <option value="NotShipped">Non expédiée</option>
            <option value="Preparing">Préparation</option>
            <option value="Shipped">Expédiée</option>
            <option value="Delivered">Livrée</option>
          </select>
        </div>

        {loading ? (
          <div className="orders-loading">
            <Loader2 className="spin" size={34} />
            <p>Chargement des commandes...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="orders-empty">
            <PackageCheck size={42} />
            <h3>Aucune commande trouvée</h3>
            <p>Essaie de modifier les filtres ou la recherche.</p>
          </div>
        ) : (
          <div className="orders-table-wrap">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Commande</th>
                  <th>Client</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Paiement</th>
                  <th>Livraison</th>
                  <th>Date</th>
                  <th className="right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <button
                        className="orders-id-btn"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        {getOrderReference(order)}
                      </button>
                      <span className="orders-sub">{order.itemsCount} article(s)</span>
                    </td>

                    <td>
                      <strong>{order.customerName}</strong>
                      <span className="orders-sub">{order.email}</span>
                      <span className="orders-sub">
                        {order.city}, {order.country}
                      </span>
                    </td>

                    <td>
                      <strong>{formatPrice(order.totalAmount, order.currency)}</strong>
                      <span className="orders-sub">{order.paymentMethod}</span>
                    </td>

                    <td>
                      <span className={`orders-badge status-${order.status}`}>
                        {orderStatusLabels[order.status] ?? order.status}
                      </span>
                    </td>

                    <td>
                      <span className={`orders-badge payment-${order.paymentStatus}`}>
                        {paymentStatusLabels[order.paymentStatus] ?? order.paymentStatus}
                      </span>
                    </td>

                    <td>
                      <span className={`orders-badge shipping-${order.shippingStatus}`}>
                        {shippingStatusLabels[order.shippingStatus] ?? order.shippingStatus}
                      </span>

                      {order.trackingNumber && (
                        <span className="orders-sub">Suivi : {order.trackingNumber}</span>
                      )}
                    </td>

                    <td>
                      <span>{formatDate(order.createdAt)}</span>
                    </td>

                    <td>
                      <div className="orders-actions">
                        <button
                          title="Voir détails"
                          onClick={() => navigate(`/orders/${order.id}`)}
                          className="icon-action"
                        >
                          <Eye size={16} />
                        </button>

                        {order.status === "Pending" && (
                          <button
                            onClick={() => askValidateOrder(order)}
                            disabled={actionLoading === `${order.id}-validate`}
                            className="icon-action success"
                            title="Valider et envoyer email"
                          >
                            {actionLoading === `${order.id}-validate` ? (
                              <Loader2 className="spin" size={16} />
                            ) : (
                              <MailCheck size={16} />
                            )}
                          </button>
                        )}

                        {order.paymentStatus !== "Paid" && order.status !== "Cancelled" && (
                          <button
                            onClick={() => askMarkAsPaid(order)}
                            disabled={actionLoading === `${order.id}-paid`}
                            className="icon-action gold"
                            title="Marquer payé et envoyer facture"
                          >
                            {actionLoading === `${order.id}-paid` ? (
                              <Loader2 className="spin" size={16} />
                            ) : (
                              <Banknote size={16} />
                            )}
                          </button>
                        )}

                        {order.paymentStatus === "Paid" &&
                          order.shippingStatus !== "Shipped" &&
                          order.shippingStatus !== "Delivered" && (
                            <button
                              onClick={() => openShippingModal(order)}
                              className="icon-action purple"
                              title="Expédier"
                            >
                              <Send size={16} />
                            </button>
                          )}

                        {order.paymentStatus !== "Paid" && order.status !== "Cancelled" && (
                          <button
                            onClick={() => askCancelOrder(order)}
                            disabled={actionLoading === `${order.id}-cancel`}
                            className="icon-action danger"
                            title="Annuler"
                          >
                            {actionLoading === `${order.id}-cancel` ? (
                              <Loader2 className="spin" size={16} />
                            ) : (
                              <XCircle size={16} />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {shippingModalOrder && (
        <div className="orders-modal-backdrop">
          <div className="orders-modal">
            <button className="orders-modal-close" onClick={() => setShippingModalOrder(null)}>
              ×
            </button>

            <div className="orders-modal-icon">
              <Truck size={26} />
            </div>

            <h2>Expédier la commande</h2>
            <p>
              Commande <strong>{getOrderReference(shippingModalOrder)}</strong> — le client
              recevra un email avec le transporteur et le numéro de suivi.
            </p>

            <label>
              Transporteur
              <input
                value={shippingProvider}
                onChange={(e) => setShippingProvider(e.target.value)}
                placeholder="DHL, FedEx, UPS..."
              />
            </label>

            <label>
              Numéro de suivi
              <input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Ex: 123456789"
              />
            </label>

            <div className="orders-modal-actions">
              <button className="orders-secondary-btn" onClick={() => setShippingModalOrder(null)}>
                Annuler
              </button>

              <button
                className="orders-primary-btn"
                onClick={submitShipping}
                disabled={actionLoading === `${shippingModalOrder.id}-shipping`}
              >
                {actionLoading === `${shippingModalOrder.id}-shipping` ? (
                  <Loader2 className="spin" size={18} />
                ) : (
                  <Send size={18} />
                )}
                Continuer
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="orders-modal-backdrop">
          <div className={`orders-confirm-modal ${confirmAction.danger ? "danger" : ""}`}>
            <button className="orders-modal-close" onClick={() => setConfirmAction(null)}>
              <X size={18} />
            </button>

            <div className="orders-confirm-icon">
              <AlertTriangle size={28} />
            </div>

            <h2>{confirmAction.title}</h2>

            <p>{confirmAction.message}</p>

            <div className="orders-confirm-summary">
              <span>Commande</span>
              <strong>{getOrderReference(confirmAction.order)}</strong>
            </div>

            <div className="orders-confirm-summary">
              <span>Client</span>
              <strong>{confirmAction.order.customerName}</strong>
            </div>

            <div className="orders-confirm-summary">
              <span>Montant</span>
              <strong>
                {formatPrice(confirmAction.order.totalAmount, confirmAction.order.currency)}
              </strong>
            </div>

            <div className="orders-modal-actions">
              <button className="orders-secondary-btn" onClick={() => setConfirmAction(null)}>
                Retour
              </button>

              <button
                className={`orders-primary-btn ${confirmAction.danger ? "danger" : ""}`}
                onClick={executeConfirmedAction}
                disabled={actionLoading !== null}
              >
                {actionLoading ? <Loader2 className="spin" size={18} /> : <CheckCircle2 size={18} />}
                {confirmAction.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}