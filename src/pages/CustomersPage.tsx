import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Eye,
  Loader2,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  ShoppingBag,
  UserCheck,
  Users,
  X,
  CalendarCheck,
  MessageSquareText,
} from "lucide-react";

import {
  getAdminCustomerById,
  getAdminCustomers,
  toggleAdminCustomerActive,
  type AdminCustomerDetails,
  type AdminCustomerListItem,
} from "../services/adminCustomerService";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

import "../styles/CustomersPage.css";

type ActiveFilter = "all" | "active" | "inactive";

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency || "EUR",
  }).format(amount || 0);
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomerListItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] =
    useState<AdminCustomerDetails | null>(null);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  useBodyScrollLock(Boolean(selectedCustomer || detailsLoading));

  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const activeParam = useMemo(() => {
    if (activeFilter === "active") return true;
    if (activeFilter === "inactive") return false;
    return null;
  }, [activeFilter]);

  const stats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter((x) => x.isActive).length;
    const verified = customers.filter((x) => x.emailConfirmed).length;
    const inactive = customers.filter((x) => !x.isActive).length;

    return { total, active, verified, inactive };
  }, [customers]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminCustomers(search, activeParam);
      setCustomers(data);
    } catch {
      setError("Impossible de charger les clients.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadCustomers();
    }, 350);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, activeParam]);

  const openDetails = async (id: number) => {
    try {
      setDetailsLoading(true);
      setError("");

      const data = await getAdminCustomerById(id);
      setSelectedCustomer(data);
    } catch {
      setError("Impossible de charger le détail du client.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const toggleActive = async (id: number) => {
    try {
      setToggleLoading(true);

      const result = await toggleAdminCustomerActive(id);

      setToast(result.message);

      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === id
            ? { ...customer, isActive: result.isActive }
            : customer
        )
      );

      setSelectedCustomer((prev) =>
        prev && prev.id === id ? { ...prev, isActive: result.isActive } : prev
      );

      window.setTimeout(() => setToast(""), 2800);
    } catch {
      setToast("Erreur pendant la mise à jour du compte.");
      window.setTimeout(() => setToast(""), 2800);
    } finally {
      setToggleLoading(false);
    }
  };

  return (
    <main className="admin-customers-page">
      {toast && (
        <div className="customers-toast">
          <CheckCircle2 size={20} />
          <span>{toast}</span>
        </div>
      )}

      

      <section className="customers-stats-grid">
        <div>
          <span>Total clients</span>
          <strong>{stats.total}</strong>
        </div>

        <div>
          <span>Clients actifs</span>
          <strong>{stats.active}</strong>
        </div>

        <div>
          <span>Emails vérifiés</span>
          <strong>{stats.verified}</strong>
        </div>

        <div>
          <span>Désactivés</span>
          <strong>{stats.inactive}</strong>
        </div>
      </section>

      <section className="customers-filter-card">
        <div className="customers-search-box">
          <Search size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou email..."
          />
        </div>

        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value as ActiveFilter)}
        >
          <option value="all">Tous les clients</option>
          <option value="active">Comptes actifs</option>
          <option value="inactive">Comptes désactivés</option>
        </select>

        <button
          className="customers-light-btn"
          type="button"
          onClick={() => {
            setSearch("");
            setActiveFilter("all");
          }}
        >
          Réinitialiser
        </button>
      </section>

      {loading ? (
        <section className="customers-state-card">
          <Loader2 className="spin" size={28} />
          <p>Chargement des clients...</p>
        </section>
      ) : error ? (
        <section className="customers-error-card">
          <AlertCircle size={28} />
          <p>{error}</p>
          <button type="button" onClick={loadCustomers}>
            Réessayer
          </button>
        </section>
      ) : customers.length === 0 ? (
        <section className="customers-state-card">
          <Users size={30} />
          <p>Aucun client trouvé.</p>
        </section>
      ) : (
        <section className="customers-table-card">
          <div className="customers-table-wrap">
            <table className="customers-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Compte</th>
                  <th>Email confirmé</th>
                  <th>Créé le</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="customer-profile-cell">
                        <div className="customer-avatar">
                          {customer.fullName?.charAt(0)?.toUpperCase() || "C"}
                        </div>

                        <div>
                          <strong>{customer.fullName}</strong>
                          <span>ID #{customer.id}</span>
                        </div>
                      </div>
                    </td>

                    <td>{customer.email}</td>
                    <td>{customer.phone || "—"}</td>

                    <td>
                      <span
                        className={
                          customer.isActive
                            ? "customer-badge badge-active"
                            : "customer-badge badge-inactive"
                        }
                      >
                        {customer.isActive ? "Actif" : "Désactivé"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={
                          customer.emailConfirmed
                            ? "customer-badge badge-confirmed"
                            : "customer-badge badge-pending"
                        }
                      >
                        {customer.emailConfirmed ? "Confirmé" : "Non confirmé"}
                      </span>
                    </td>

                    <td>{formatDate(customer.createdAt)}</td>

                    <td>
                      <div className="customers-actions">
                        <button
                          type="button"
                          onClick={() => openDetails(customer.id)}
                        >
                          <Eye size={17} />
                          Voir
                        </button>

                        <button
                          type="button"
                          className={customer.isActive ? "danger" : "success"}
                          disabled={toggleLoading}
                          onClick={() => toggleActive(customer.id)}
                        >
                          {customer.isActive ? (
                            <Ban size={17} />
                          ) : (
                            <UserCheck size={17} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {(selectedCustomer || detailsLoading) && (
  <div className="customer-profile-overlay admin-modal">
    <section className="customer-profile-modal admin-modal-content">
      {detailsLoading ? (
        <div className="customer-profile-loading">
          <Loader2 className="spin" size={34} />
          <p>Chargement du profil client...</p>
        </div>
      ) : selectedCustomer ? (
        <>
          <button
            type="button"
            className="customer-profile-close"
            onClick={() => setSelectedCustomer(null)}
          >
            <X size={20} />
          </button>

         <div className="customer-profile-hero customer-profile-hero-premium">
  <div className="customer-profile-avatar">
    {selectedCustomer.fullName?.charAt(0)?.toUpperCase() || "C"}
  </div>

  <div className="customer-profile-main">
    <span>Profil client</span>
    <h2>{selectedCustomer.fullName}</h2>

    <div className="customer-profile-contact">
      <p>
        <Mail size={16} />
        {selectedCustomer.email}
      </p>

      <p>
        <Phone size={16} />
        {selectedCustomer.phone || "Téléphone non renseigné"}
      </p>
    </div>
  </div>

  <div className="customer-profile-status">
    <span
      className={
        selectedCustomer.isActive
          ? "customer-status-pill status-green"
          : "customer-status-pill status-red"
      }
    >
      {selectedCustomer.isActive ? "Compte actif" : "Compte désactivé"}
    </span>

    <span
      className={
        selectedCustomer.emailConfirmed
          ? "customer-status-pill status-blue"
          : "customer-status-pill status-orange"
      }
    >
      {selectedCustomer.emailConfirmed ? "Email confirmé" : "Email non confirmé"}
    </span>
  </div>
</div>

          <div className="customer-profile-stats">
            <div>
              <span>Commandes</span>
              <strong>{selectedCustomer.orders.length}</strong>
            </div>

            <div>
              <span>Demandes de prix</span>
              <strong>{selectedCustomer.priceRequests.length}</strong>
            </div>

            <div>
              <span>Réservations</span>
              <strong>{selectedCustomer.demoBookings.length}</strong>
            </div>

            <div>
              <span>Inscription</span>
              <strong>{formatDate(selectedCustomer.createdAt)}</strong>
            </div>
          </div>

          <div className="customer-profile-body admin-modal-body admin-modal-scrollbar">
            <section className="customer-profile-panel customer-profile-summary">
              <div className="customer-panel-title">
                <ShieldCheck size={18} />
                <h3>Informations du compte</h3>
              </div>

              <div className="customer-summary-grid">
                <div>
                  <span>ID client</span>
                  <strong>#{selectedCustomer.id}</strong>
                </div>

                <div>
                  <span>Statut</span>
                  <strong>
                    {selectedCustomer.isActive ? "Actif" : "Désactivé"}
                  </strong>
                </div>

                <div>
                  <span>Email</span>
                  <strong>
                    {selectedCustomer.emailConfirmed
                      ? "Confirmé"
                      : "Non confirmé"}
                  </strong>
                </div>

                <div>
                  <span>Créé le</span>
                  <strong>{formatDate(selectedCustomer.createdAt)}</strong>
                </div>

                <div>
                  <span>Mis à jour</span>
                  <strong>{formatDate(selectedCustomer.updatedAt)}</strong>
                </div>
              </div>

              <button
                type="button"
                className={
                  selectedCustomer.isActive
                    ? "customer-toggle-btn danger"
                    : "customer-toggle-btn success"
                }
                disabled={toggleLoading}
                onClick={() => toggleActive(selectedCustomer.id)}
              >
                {toggleLoading ? (
                  <Loader2 className="spin" size={18} />
                ) : selectedCustomer.isActive ? (
                  <Ban size={18} />
                ) : (
                  <ShieldCheck size={18} />
                )}

                {selectedCustomer.isActive
                  ? "Désactiver ce compte"
                  : "Activer ce compte"}
              </button>
            </section>

            <section className="customer-profile-panel">
              <div className="customer-panel-title">
                <ShoppingBag size={18} />
                <h3>Commandes</h3>
              </div>

              <div className="customer-profile-list">
                {selectedCustomer.orders.length === 0 ? (
                  <p className="customer-empty-text">
                    Aucune commande pour ce client.
                  </p>
                ) : (
                  selectedCustomer.orders.map((order) => (
                    <div className="customer-profile-row" key={order.id}>
                      <div>
                        <strong>Commande #{order.id}</strong>
                        <span>{formatDate(order.createdAt)}</span>
                      </div>

                      <div>
                        <b>{formatMoney(order.totalAmount, order.currency)}</b>
                        <small>
                          {order.status} · {order.paymentStatus}
                        </small>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="customer-profile-panel">
              <div className="customer-panel-title">
                <MessageSquareText size={18} />
                <h3>Demandes de prix</h3>
              </div>

              <div className="customer-profile-list">
                {selectedCustomer.priceRequests.length === 0 ? (
                  <p className="customer-empty-text">Aucune demande de prix.</p>
                ) : (
                  selectedCustomer.priceRequests.map((request) => (
                    <div className="customer-profile-row" key={request.id}>
                      <div>
                        <strong>{request.productName}</strong>
                        <span>{formatDate(request.createdAt)}</span>
                      </div>

                      <div>
                        <small>{request.status}</small>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="customer-profile-panel">
              <div className="customer-panel-title">
                <CalendarCheck size={18} />
                <h3>Réservations showroom</h3>
              </div>

              <div className="customer-profile-list">
                {selectedCustomer.demoBookings.length === 0 ? (
                  <p className="customer-empty-text">
                    Aucune réservation showroom.
                  </p>
                ) : (
                  selectedCustomer.demoBookings.map((booking) => (
                    <div className="customer-profile-row" key={booking.id}>
                      <div>
                        <strong>{formatDate(booking.demoDate)}</strong>
                        <span>{booking.demoTime}</span>
                      </div>

                      <div>
                        <small>{booking.status}</small>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </>
      ) : null}
    </section>
  </div>
)}

    </main>
  );
}
