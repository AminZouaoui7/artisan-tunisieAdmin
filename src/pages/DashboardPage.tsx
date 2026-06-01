import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Eye,
  Loader2,
  Package,
  ShoppingBag,
  Users,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getAdminDashboard } from "../services/adminDashboardService";
import type { AdminDashboardDto } from "../types/adminDashboardTypes";
import "../styles/DashboardPage.css";

function formatMoney(value: number, currency = "EUR") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDate(value?: string) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function statusClass(value?: string) {
  const v = (value || "").toLowerCase();

  if (v.includes("paid") || v.includes("confirmed") || v.includes("shipped")) {
    return "success";
  }

  if (v.includes("pending") || v.includes("attente")) {
    return "pending";
  }

  if (v.includes("cancel") || v.includes("unpaid") || v.includes("annul")) {
    return "danger";
  }

  return "neutral";
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState<AdminDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminDashboard()
      .then(setDashboard)
      .catch(() => setError("Impossible de charger les données du dashboard."))
      .finally(() => setLoading(false));
  }, []);

  const statsCards = useMemo(() => {
    if (!dashboard) return [];

    const { stats } = dashboard;

    return [
      {
        label: "Revenus payés",
        value: formatMoney(stats.paidRevenue),
        detail: `${stats.paidOrders} commande(s) payée(s)`,
        icon: Wallet,
      },
      {
        label: "Commandes",
        value: stats.totalOrders,
        detail: `${stats.pendingOrders} en attente`,
        icon: ShoppingBag,
      },
      {
        label: "Produits actifs",
        value: stats.activeProducts,
        detail: `${stats.totalProducts} produit(s) au total`,
        icon: Package,
      },
      {
        label: "Clients",
        value: stats.totalCustomers,
        detail: "Clients inscrits",
        icon: Users,
      },
    ];
  }, [dashboard]);

  if (loading) {
    return (
      <main className="admin-dashboard-page">
        <div className="dashboard-state-card">
          <Loader2 className="spin" size={28} />
          Chargement du dashboard...
        </div>
      </main>
    );
  }

  if (error || !dashboard) {
    return (
      <main className="admin-dashboard-page">
        <div className="dashboard-state-card error">{error}</div>
      </main>
    );
  }

  const { stats } = dashboard;

  return (
    <main className="admin-dashboard-page">
      <section className="dashboard-header">
        <div>
          <p>Artisan Medina Admin</p>
          <h1>Tableau de bord</h1>
          <span>Vue simple des éléments importants à suivre.</span>
        </div>
      </section>

      {(stats.pendingOrders > 0 ||
        stats.pendingPriceRequests > 0 ||
        stats.pendingDemoBookings > 0) && (
        <section className="dashboard-alerts-simple">
          {stats.pendingOrders > 0 && (
            <button onClick={() => navigate("/orders")}>
              <AlertTriangle size={18} />
              <span>{stats.pendingOrders} commande(s) en attente</span>
            </button>
          )}

          {stats.pendingPriceRequests > 0 && (
            <button onClick={() => navigate("/price-requests")}>
              <AlertTriangle size={18} />
              <span>{stats.pendingPriceRequests} demande(s) de prix</span>
            </button>
          )}

          {stats.pendingDemoBookings > 0 && (
            <button onClick={() => navigate("/bookings")}>
              <CalendarDays size={18} />
              <span>{stats.pendingDemoBookings} réservation(s) showroom</span>
            </button>
          )}
        </section>
      )}

      <section className="dashboard-simple-stats">
        {statsCards.map((card) => {
          const Icon = card.icon;

          return (
            <article key={card.label} className="dashboard-simple-card">
              <div className="dashboard-simple-icon">
                <Icon size={22} />
              </div>

              <div>
                <strong>{card.value}</strong>
                <span>{card.label}</span>
                <small>{card.detail}</small>
              </div>
            </article>
          );
        })}
      </section>

      <section className="dashboard-content-grid">
        <article className="dashboard-simple-panel">
          <div className="dashboard-panel-title">
            <div>
              <h2>Dernières commandes</h2>
              <span>{dashboard.recentOrders.length} récente(s)</span>
            </div>

            <button onClick={() => navigate("/orders")}>
              Voir tout
              <Eye size={16} />
            </button>
          </div>

          <div className="dashboard-table">
            {dashboard.recentOrders.length === 0 && (
              <p className="dashboard-empty">Aucune commande récente.</p>
            )}

            {dashboard.recentOrders.map((order) => (
              <div className="dashboard-table-row" key={order.id}>
                <div>
                  <strong>{order.customerName}</strong>
                  <span>{order.email}</span>
                </div>

                <strong>{formatMoney(order.totalAmount, order.currency || "EUR")}</strong>

                <em className={`status-pill ${statusClass(order.paymentStatus)}`}>
                  {order.paymentStatus}
                </em>

                <small>{formatDate(order.createdAt)}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-simple-panel">
          <div className="dashboard-panel-title">
            <div>
              <h2>À traiter</h2>
              <span>Demandes importantes</span>
            </div>
          </div>

          <div className="dashboard-actions-list">
            <button onClick={() => navigate("/orders")}>
              <ShoppingBag size={18} />
              <span>Commandes en attente</span>
              <strong>{stats.pendingOrders}</strong>
            </button>

            <button onClick={() => navigate("/price-requests")}>
              <Wallet size={18} />
              <span>Demandes de prix</span>
              <strong>{stats.pendingPriceRequests}</strong>
            </button>

            <button onClick={() => navigate("/bookings")}>
              <CalendarDays size={18} />
              <span>Réservations showroom</span>
              <strong>{stats.pendingDemoBookings}</strong>
            </button>

            <button onClick={() => navigate("/products")}>
              <Package size={18} />
              <span>Produits réservés</span>
              <strong>{stats.reservedProducts}</strong>
            </button>
          </div>
        </article>
      </section>
    </main>
  );
}