import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  ReceiptText,
  Truck,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminFetch, buildBackendUrl } from "../services/adminApi";
import "../styles/OrderDetailsPage.css";

type OrderItem = {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: {
    id: number;
    name: string;
    mainImageUrl?: string;
  };
};

type OrderDetails = {
  id: string;
  publicReference?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode: string;
  totalAmount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  shippingStatus: string;
  trackingNumber?: string | null;
  shippingProvider?: string | null;
  invoiceNumber?: string | null;
  createdAt: string;
  updatedAt?: string;
  paidAt?: string;
  invoiceSentAt?: string;
  items: OrderItem[];
};

const statusLabel: Record<string, string> = {
  Pending: "En attente",
  Confirmed: "Confirmée",
  Shipped: "Expédiée",
  Delivered: "Livrée",
  Cancelled: "Annulée",
};

const paymentLabel: Record<string, string> = {
  Unpaid: "Non payé",
  AwaitingBankTransfer: "Virement attendu",
  Paid: "Payé",
};

const shippingLabel: Record<string, string> = {
  NotShipped: "Non expédiée",
  Preparing: "En préparation",
  Shipped: "Expédiée",
  Delivered: "Livrée",
};

export default function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrder = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await adminFetch<OrderDetails>(`/admin/orders/${id}`);
        setOrder(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Commande introuvable.");
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id]);

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency || "EUR",
    }).format(amount);
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";

    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  };

  const reference = useMemo(() => {
    if (!order) return "";
    return order.publicReference || order.id;
  }, [order]);

  const timeline = useMemo(() => {
    if (!order) return [];

    return [
      {
        label: "Commande créée",
        active: true,
        icon: CalendarDays,
        value: formatDate(order.createdAt),
      },
      {
        label: "Commande validée",
        active: ["Confirmed", "Shipped", "Delivered"].includes(order.status),
        icon: CheckCircle2,
        value: statusLabel[order.status] ?? order.status,
      },
      {
        label: "Paiement",
        active: order.paymentStatus === "Paid",
        icon: CreditCard,
        value: paymentLabel[order.paymentStatus] ?? order.paymentStatus,
      },
      {
        label: "Expédition",
        active: ["Shipped", "Delivered"].includes(order.shippingStatus),
        icon: Truck,
        value: shippingLabel[order.shippingStatus] ?? order.shippingStatus,
      },
    ];
  }, [order]);

  if (loading) {
    return (
      <div className="order-details-page">
        <div className="order-details-loading">
          <Loader2 className="spin" size={38} />
          <p>Chargement de la commande...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-details-page">
        <button className="order-back-btn" onClick={() => navigate("/orders")}>
          <ArrowLeft size={18} />
          Retour aux commandes
        </button>

        <div className="order-details-empty">
          <Package size={46} />
          <h3>Commande introuvable</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="order-details-page">
      <button className="order-back-btn" onClick={() => navigate("/orders")}>
        <ArrowLeft size={18} />
        Retour aux commandes
      </button>

      <section className="order-details-hero">
        <div className="order-details-hero-content">
          <span className="order-details-kicker">
            <ReceiptText size={16} />
            Détail commande
          </span>

          <h1>{reference}</h1>

          <p>
            Créée le {formatDate(order.createdAt)} · Mise à jour le{" "}
            {formatDate(order.updatedAt)}
          </p>

          <div className="order-hero-badges">
            <span className={`order-badge status-${order.status}`}>
              {statusLabel[order.status] ?? order.status}
            </span>

            <span className={`order-badge payment-${order.paymentStatus}`}>
              {paymentLabel[order.paymentStatus] ?? order.paymentStatus}
            </span>

            <span className={`order-badge shipping-${order.shippingStatus}`}>
              {shippingLabel[order.shippingStatus] ?? order.shippingStatus}
            </span>
          </div>
        </div>

        <div className="order-total-card">
          <span>Total commande</span>
          <strong>{formatPrice(order.totalAmount, order.currency)}</strong>
          <small>{order.items.length} article(s)</small>
        </div>
      </section>

      <section className="order-timeline">
        {timeline.map((step, index) => {
          const Icon = step.icon;

          return (
            <div
              key={step.label}
              className={`order-timeline-step ${step.active ? "active" : ""}`}
            >
              <div className="order-timeline-icon">
                <Icon size={18} />
              </div>

              {index < timeline.length - 1 && <div className="order-timeline-line" />}

              <div>
                <strong>{step.label}</strong>
                <span>{step.value}</span>
              </div>
            </div>
          );
        })}
      </section>

      <section className="order-details-grid">
        <article className="order-info-card">
          <div className="order-card-title">
            <User size={20} />
            <h2>Client</h2>
          </div>

          <div className="order-info-main">
            <strong>
              {order.firstName} {order.lastName}
            </strong>
          </div>

          <div className="order-info-line">
            <Mail size={16} />
            <span>{order.email}</span>
          </div>

          <div className="order-info-line">
            <Phone size={16} />
            <span>{order.phone}</span>
          </div>
        </article>

        <article className="order-info-card">
          <div className="order-card-title">
            <MapPin size={20} />
            <h2>Adresse de livraison</h2>
          </div>

          <div className="order-info-main">
            <strong>
              {order.city}, {order.country}
            </strong>
          </div>

          <p className="order-address">{order.addressLine1}</p>
          {order.addressLine2 && <p className="order-address">{order.addressLine2}</p>}
          <p className="order-address">{order.postalCode}</p>
        </article>

        <article className="order-info-card">
          <div className="order-card-title">
            <CreditCard size={20} />
            <h2>Paiement</h2>
          </div>

          <div className="order-mini-list">
            <div>
              <span>Méthode</span>
              <strong>{order.paymentMethod}</strong>
            </div>

            <div>
              <span>Statut</span>
              <strong>{paymentLabel[order.paymentStatus] ?? order.paymentStatus}</strong>
            </div>

            <div>
              <span>Payé le</span>
              <strong>{formatDate(order.paidAt)}</strong>
            </div>

            <div>
              <span>Facture</span>
              <strong>{order.invoiceNumber ?? "-"}</strong>
            </div>
          </div>
        </article>

        <article className="order-info-card">
          <div className="order-card-title">
            <Truck size={20} />
            <h2>Expédition</h2>
          </div>

          <div className="order-mini-list">
            <div>
              <span>Statut</span>
              <strong>{shippingLabel[order.shippingStatus] ?? order.shippingStatus}</strong>
            </div>

            <div>
              <span>Transporteur</span>
              <strong>{order.shippingProvider ?? "-"}</strong>
            </div>

            <div>
              <span>Numéro de suivi</span>
              <strong>{order.trackingNumber ?? "-"}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="order-items-card">
        <div className="order-card-title">
          <Package size={20} />
          <h2>Articles commandés</h2>
        </div>

        <div className="order-items-list">
          {order.items.map((item) => (
            <div className="order-item-row" key={item.id}>
              <div className="order-item-thumb">
                {item.product?.mainImageUrl ? (
                  <img
                    src={
                      item.product.mainImageUrl.startsWith("http")
                        ? item.product.mainImageUrl
                        : buildBackendUrl(item.product.mainImageUrl)
                    }
                    alt={item.productName}
                  />
                ) : (
                  <Package size={24} />
                )}
              </div>

              <div className="order-item-content">
                <strong>{item.productName}</strong>
                <span>Produit #{item.productId}</span>
              </div>

              <div className="order-item-qty">
                <span>Qté</span>
                <strong>{item.quantity}</strong>
              </div>

              <div className="order-item-price">
                <span>{formatPrice(item.unitPrice, order.currency)} / unité</span>
                <strong>{formatPrice(item.totalPrice, order.currency)}</strong>
              </div>
            </div>
          ))}
        </div>

        <div className="order-items-footer">
          <span>Total</span>
          <strong>{formatPrice(order.totalAmount, order.currency)}</strong>
        </div>
      </section>

      
    </div>
  );
}
