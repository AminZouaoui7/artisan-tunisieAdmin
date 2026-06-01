import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  Gem,
  MoreHorizontal,
  Package,
  Search,
  ShoppingBag,
  Sparkles,
  Truck,
  Users,
  Wallet,
} from "lucide-react";

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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function statusClass(value?: string) {
  const v = (value || "").toLowerCase();

  if (v.includes("paid") || v.includes("confirmed") || v.includes("shipped")) return "success";
  if (v.includes("pending")) return "pending";
  if (v.includes("cancel") || v.includes("unpaid") || v.includes("sold")) return "danger";

  return "neutral";
}

export default function AdminDashboard() {
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
        detail: `${stats.paidOrders} commandes payées`,
        icon: Wallet,
        tone: "purple",
      },
      {
        label: "Commandes",
        value: stats.totalOrders,
        detail: `${stats.pendingOrders} en attente`,
        icon: ShoppingBag,
        tone: "blue",
      },
      {
        label: "Produits",
        value: stats.totalProducts,
        detail: `${stats.activeProducts} actifs`,
        icon: Package,
        tone: "orange",
      },
      {
        label: "Clients",
        value: stats.totalCustomers,
        detail: "Clients inscrits",
        icon: Users,
        tone: "pink",
      },
    ];
  }, [dashboard]);

  if (loading) {
    return (
      <main className="admin-dashboard-page">
        <div className="dashboard-state-card">Chargement du dashboard...</div>
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
      <section className="dashboard-topbar">
        <div>
          <p className="dashboard-kicker">Artisan Medina Admin</p>
          <h1>Dashboard</h1>
        </div>

        <div className="dashboard-search">
          <Search size={18} />
          <input placeholder="Rechercher commande, client, produit..." />
        </div>
      </section>

      {dashboard.alerts.length > 0 && (
        <section className="dashboard-alerts">
          {dashboard.alerts.map((alert) => (
            <div className="dashboard-alert" key={alert.type}>
              <span className="dashboard-alert-icon">
                <AlertTriangle size={17} />
              </span>
              <div>
                <strong>{alert.message}</strong>
                <small>{alert.count} élément(s) à traiter</small>
              </div>
              <em>{alert.count}</em>
            </div>
          ))}
        </section>
      )}

      <section className="dashboard-stats-grid">
        {statsCards.map((card) => {
          const Icon = card.icon;

          return (
            <article className="dashboard-stat-card" key={card.label}>
              <button className="card-more" type="button">
                <MoreHorizontal size={20} />
              </button>

              <div className={`dashboard-stat-icon ${card.tone}`}>
                <Icon size={24} />
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

      <section className="dashboard-main-grid">
        <article className="dashboard-panel trend-panel">
          <div className="dashboard-panel-header">
            <h2>Commandes & produits</h2>
            <button type="button">
              Vue globale <ChevronDown size={15} />
            </button>
          </div>

          <div className="dashboard-chart-area">
            <div className="fake-bars">
              {[
                [45, 70],
                [64, 86],
                [38, 58],
                [71, 44],
                [52, 76],
                [78, 91],
              ].map(([a, b], index) => (
                <div className="bar-group" key={index}>
                  <span style={{ height: `${a}%` }} />
                  <strong style={{ height: `${b}%` }} />
                </div>
              ))}
            </div>

            <div className="dashboard-donut">
              <div className="donut-ring">
                <div className="donut-center">
                  <Package size={22} />
                  <strong>{stats.activeProducts}</strong>
                </div>
              </div>

              <div className="donut-legend">
                <span><i className="purple-dot" /> Actifs</span>
                <span><i className="green-dot" /> Réservés</span>
              </div>
            </div>
          </div>
        </article>

        <article className="dashboard-panel gender-panel">
          <div className="dashboard-panel-header">
            <h2>État produits</h2>
          </div>

          <div className="mini-donut">
            <div className="mini-donut-center">
              <Gem size={24} />
            </div>
          </div>

          <div className="product-state-list">
            <span><i className="green-dot" /> Featured : {stats.featuredProducts}</span>
            <span><i className="purple-dot" /> Réservés : {stats.reservedProducts}</span>
            <span><i className="orange-dot" /> Vendus/Rupture : {stats.soldOutProducts}</span>
          </div>
        </article>

        <article className="dashboard-panel orders-panel">
          <div className="dashboard-panel-header">
            <h2>Dernières commandes</h2>
            <span>{dashboard.recentOrders.length} récentes</span>
          </div>

          <div className="dashboard-orders-list">
            {dashboard.recentOrders.length === 0 && (
              <p className="empty-text">Aucune commande récente.</p>
            )}

            {dashboard.recentOrders.map((order) => (
              <div className="dashboard-order-row" key={order.id}>
                <div>
                  <strong>#{order.id} — {order.customerName}</strong>
                  <small>{order.email}</small>
                </div>

                <span>{formatMoney(order.totalAmount, order.currency || "EUR")}</span>

                <em className={`status-pill ${statusClass(order.paymentStatus)}`}>
                  {order.paymentStatus}
                </em>

                <small>{formatDate(order.createdAt)}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-panel division-panel">
          <div className="dashboard-panel-header">
            <h2>Demandes & showroom</h2>
          </div>

          <div className="division-list">
            <div className="division-row">
              <Wallet size={19} />
              <span>Demandes de prix</span>
              <strong>{stats.pendingPriceRequests}</strong>
            </div>

            <div className="division-row">
              <CalendarDays size={19} />
              <span>Réservations showroom</span>
              <strong>{stats.pendingDemoBookings}</strong>
            </div>

            <div className="division-row">
              <Truck size={19} />
              <span>Expéditions</span>
              <strong>{stats.shippedOrders}</strong>
            </div>
          </div>
        </article>

        <article className="dashboard-highlight-card">
          <Sparkles size={28} />
          <strong>{stats.pendingOrders}</strong>
          <span>Commandes en attente</span>

          <div className="highlight-wave">
            <span />
          </div>
        </article>

        <article className="dashboard-panel mini-panel">
          <div className="dashboard-panel-header">
            <h2>Demandes de prix</h2>
          </div>

          {dashboard.recentPriceRequests.length === 0 && (
            <p className="empty-text">Aucune demande récente.</p>
          )}

          {dashboard.recentPriceRequests.map((request) => (
            <div className="mini-item" key={request.id}>
              <div>
                <strong>{request.customerName}</strong>
                <span>{request.productName}</span>
              </div>
              <small>{request.status} · {formatDate(request.createdAt)}</small>
            </div>
          ))}
        </article>

        <article className="dashboard-panel mini-panel">
          <div className="dashboard-panel-header">
            <h2>Réservations showroom</h2>
          </div>

          {dashboard.recentDemoBookings.length === 0 && (
            <p className="empty-text">Aucune réservation récente.</p>
          )}

          {dashboard.recentDemoBookings.map((booking) => (
            <div className="mini-item" key={booking.id}>
              <div>
                <strong>{booking.fullName}</strong>
                <span>{booking.demoDate} à {booking.demoTime}</span>
              </div>
              <small>{booking.status} · {formatDate(booking.createdAt)}</small>
            </div>
          ))}
        </article>
      </section>
    </main>
  );
}