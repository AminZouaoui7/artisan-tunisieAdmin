import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  Mail,
  MessageSquareText,
  Package,
  Phone,
  Search,
  X,
  XCircle,
} from "lucide-react";

import {
  acceptAdminBooking,
  getAdminBookingById,
  getAdminBookings,
  refuseAdminBooking,
  updateAdminBookingStatus,
  type AdminBooking,
  type BookingStatus,
} from "../services/adminBookingService";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

import "../styles/BookingsPage.css";

type StatusFilter = "All" | BookingStatus;

type ConfirmAction = {
  title: string;
  message: string;
  confirmLabel: string;
  kind: "success" | "danger" | "warning";
  onConfirm: () => Promise<void>;
};

const statuses: StatusFilter[] = [
  "All",
  "Pending",
  "Accepted",
  "Refused",
  "Cancelled",
  "Completed",
];

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatMoney(amount?: number | null) {
  if (amount === null || amount === undefined) return "Prix non défini";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    Pending: "En attente",
    Accepted: "Acceptée",
    Refused: "Refusée",
    Cancelled: "Annulée",
    Completed: "Terminée",
    All: "Toutes",
  };

  return labels[status] || status;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(
    null
  );

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null
  );

  useBodyScrollLock(Boolean(selectedBooking || detailsLoading || confirmAction));
  const [pendingStatus, setPendingStatus] = useState<BookingStatus | null>(
    null
  );

  const filteredBookings = useMemo(() => {
    const s = search.trim().toLowerCase();

    if (!s) return bookings;

    return bookings.filter(
      (booking) =>
        booking.fullName.toLowerCase().includes(s) ||
        booking.email.toLowerCase().includes(s) ||
        booking.phone?.toLowerCase().includes(s)
    );
  }, [bookings, search]);

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter((x) => x.status === "Pending").length,
      accepted: bookings.filter((x) => x.status === "Accepted").length,
      completed: bookings.filter((x) => x.status === "Completed").length,
    };
  }, [bookings]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminBookings(statusFilter);
      setBookings(data);
    } catch {
      setError("Impossible de charger les réservations showroom.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  const openDetails = async (id: number) => {
    try {
      setDetailsLoading(true);
      setError("");

      const data = await getAdminBookingById(id);
      setSelectedBooking(data);
    } catch {
      setError("Impossible de charger le détail de la réservation.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const refreshOneBookingStatus = (id: number, status: BookingStatus) => {
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === id ? { ...booking, status } : booking
      )
    );

    setSelectedBooking((prev) =>
      prev && prev.id === id ? { ...prev, status } : prev
    );
  };

  const askConfirmation = (config: ConfirmAction) => {
    setConfirmAction(config);
  };

  const runConfirmedAction = async () => {
    if (!confirmAction) return;

    await confirmAction.onConfirm();
    setConfirmAction(null);
  };

  const closeConfirmation = () => {
    setConfirmAction(null);
    setPendingStatus(null);
  };

  const handleAccept = async (id: number) => {
    askConfirmation({
      title: "Accepter cette réservation ?",
      message:
        "Cette action va confirmer le créneau showroom et envoyer automatiquement un email de confirmation au client.",
      confirmLabel: "Oui, accepter et envoyer",
      kind: "success",
      onConfirm: async () => {
        try {
          setActionLoading(true);
          const result = await acceptAdminBooking(id);
          refreshOneBookingStatus(id, result.status);
          showToast(result.message);
        } catch (error: any) {
          showToast(
            error?.response?.data?.message ||
              "Impossible d’accepter cette réservation."
          );
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleRefuse = async (id: number) => {
    askConfirmation({
      title: "Refuser cette réservation ?",
      message:
        "Cette action va refuser la demande de visite showroom et envoyer automatiquement un email d’information au client.",
      confirmLabel: "Oui, refuser et envoyer",
      kind: "danger",
      onConfirm: async () => {
        try {
          setActionLoading(true);
          const result = await refuseAdminBooking(id);
          refreshOneBookingStatus(id, result.status);
          showToast(result.message);
        } catch (error: any) {
          showToast(
            error?.response?.data?.message ||
              "Impossible de refuser cette réservation."
          );
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleStatusChange = async (id: number, status: BookingStatus) => {
    const currentStatus =
      selectedBooking?.id === id
        ? selectedBooking.status
        : bookings.find((booking) => booking.id === id)?.status;

    if (currentStatus === status) return;

    setPendingStatus(status);

    askConfirmation({
      title: "Modifier le statut ?",
      message:
        status === "Accepted" || status === "Refused"
          ? `Tu vas changer le statut vers "${getStatusLabel(
              status
            )}". Un email sera automatiquement envoyé au client.`
          : `Tu vas changer le statut de cette réservation de "${getStatusLabel(
              currentStatus || ""
            )}" vers "${getStatusLabel(status)}".`,
      confirmLabel:
        status === "Accepted" || status === "Refused"
          ? "Oui, modifier et envoyer"
          : "Oui, modifier",
      kind:
        status === "Accepted"
          ? "success"
          : status === "Refused"
          ? "danger"
          : "warning",
      onConfirm: async () => {
        try {
          setActionLoading(true);
          const result = await updateAdminBookingStatus(id, status);
          refreshOneBookingStatus(id, result.status);
          showToast(result.message);
        } catch (error: any) {
          showToast(
            error?.response?.data?.message ||
              "Impossible de mettre à jour le statut."
          );
        } finally {
          setActionLoading(false);
          setPendingStatus(null);
        }
      },
    });
  };

  return (
    <main className="admin-bookings-page">
      {toast && (
        <div className="bookings-toast">
          <CheckCircle2 size={20} />
          <span>{toast}</span>
        </div>
      )}

      <section className="bookings-hero">
    
      </section>

      <section className="bookings-stats-grid">
        <div>
          <span>Total réservations</span>
          <strong>{stats.total}</strong>
        </div>

        <div>
          <span>En attente</span>
          <strong>{stats.pending}</strong>
        </div>

        <div>
          <span>Acceptées</span>
          <strong>{stats.accepted}</strong>
        </div>

        <div>
          <span>Terminées</span>
          <strong>{stats.completed}</strong>
        </div>
      </section>

      <section className="bookings-filter-card">
        <div className="bookings-search-box">
          <Search size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email ou téléphone..."
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {getStatusLabel(status)}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="bookings-light-btn"
          onClick={() => {
            setSearch("");
            setStatusFilter("All");
          }}
        >
          Réinitialiser
        </button>
      </section>

      {loading ? (
        <section className="bookings-state-card">
          <Loader2 className="spin" size={28} />
          <p>Chargement des réservations...</p>
        </section>
      ) : error ? (
        <section className="bookings-error-card">
          <AlertCircle size={28} />
          <p>{error}</p>
          <button type="button" onClick={loadBookings}>
            Réessayer
          </button>
        </section>
      ) : filteredBookings.length === 0 ? (
        <section className="bookings-state-card">
          <CalendarCheck size={30} />
          <p>Aucune réservation trouvée.</p>
        </section>
      ) : (
        <section className="bookings-grid">
          {filteredBookings.map((booking) => (
            <article className="booking-admin-card" key={booking.id}>
              <div className="booking-card-top">
                <span
                  className={`booking-status status-${booking.status.toLowerCase()}`}
                >
                  {getStatusLabel(booking.status)}
                </span>

                <button type="button" onClick={() => openDetails(booking.id)}>
                  <Eye size={17} />
                </button>
              </div>

              <div className="booking-client">
                <div className="booking-avatar">
                  {booking.fullName?.charAt(0)?.toUpperCase() || "R"}
                </div>

                <div>
                  <h3>{booking.fullName}</h3>
                  <p>{booking.email}</p>
                </div>
              </div>

              <div className="booking-info-grid">
                <div>
                  <span>Date</span>
                  <strong>{formatDate(booking.demoDate)}</strong>
                </div>

                <div>
                  <span>Heure</span>
                  <strong>{booking.demoTime}</strong>
                </div>

                <div>
                  <span>Invités</span>
                  <strong>{booking.guestsCount}</strong>
                </div>

                <div>
                  <span>Durée</span>
                  <strong>{booking.durationMinutes} min</strong>
                </div>
              </div>

              <div className="booking-card-actions">
                <button
                  type="button"
                  className="success"
                  disabled={actionLoading || booking.status === "Accepted"}
                  onClick={() => handleAccept(booking.id)}
                >
                  <CheckCircle2 size={17} />
                  Accepter
                </button>

                <button
                  type="button"
                  className="danger"
                  disabled={actionLoading || booking.status === "Refused"}
                  onClick={() => handleRefuse(booking.id)}
                >
                  <XCircle size={17} />
                  Refuser
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {(selectedBooking || detailsLoading) && (
        <div className="booking-profile-overlay admin-modal">
          <section className="booking-profile-modal admin-modal-content">
            {detailsLoading ? (
              <div className="booking-profile-loading">
                <Loader2 className="spin" size={34} />
                <p>Chargement du détail...</p>
              </div>
            ) : selectedBooking ? (
              <>
                <button
                  type="button"
                  className="booking-profile-close"
                  onClick={() => setSelectedBooking(null)}
                >
                  <X size={20} />
                </button>

                <div className="booking-profile-hero">
                  <div className="booking-profile-avatar">
                    {selectedBooking.fullName?.charAt(0)?.toUpperCase() || "R"}
                  </div>

                  <div className="booking-profile-main">
                    <span>Réservation showroom</span>
                    <h2>{selectedBooking.fullName}</h2>

                    <div className="booking-profile-contact">
                      <p>
                        <Mail size={16} />
                        {selectedBooking.email}
                      </p>

                      <p>
                        <Phone size={16} />
                        {selectedBooking.phone || "Téléphone non renseigné"}
                      </p>
                    </div>
                  </div>

                  <div className="booking-profile-status">
                    <span
                      className={`booking-status status-${selectedBooking.status.toLowerCase()}`}
                    >
                      {getStatusLabel(selectedBooking.status)}
                    </span>

                    <select
                      value={pendingStatus || selectedBooking.status}
                      disabled={actionLoading}
                      onChange={(e) =>
                        handleStatusChange(
                          selectedBooking.id,
                          e.target.value as BookingStatus
                        )
                      }
                    >
                      <option value="Pending">En attente</option>
                      <option value="Accepted">Acceptée</option>
                      <option value="Refused">Refusée</option>
                      <option value="Cancelled">Annulée</option>
                      <option value="Completed">Terminée</option>
                    </select>
                  </div>
                </div>

                <div className="booking-profile-stats">
                  <div>
                    <span>Date showroom</span>
                    <strong>{formatDate(selectedBooking.demoDate)}</strong>
                  </div>

                  <div>
                    <span>Heure</span>
                    <strong>{selectedBooking.demoTime}</strong>
                  </div>

                  <div>
                    <span>Invités</span>
                    <strong>{selectedBooking.guestsCount}</strong>
                  </div>

                  <div>
                    <span>Durée</span>
                    <strong>{selectedBooking.durationMinutes} min</strong>
                  </div>
                </div>

                <div className="booking-profile-body admin-modal-body admin-modal-scrollbar">
                  <section className="booking-profile-panel booking-summary-panel">
                    <div className="booking-panel-title">
                      <Clock size={18} />
                      <h3>Détails réservation</h3>
                    </div>

                    <div className="booking-summary-grid">
                      <div>
                        <span>ID réservation</span>
                        <strong>#{selectedBooking.id}</strong>
                      </div>

                      <div>
                        <span>Créée le</span>
                        <strong>{formatDate(selectedBooking.createdAt)}</strong>
                      </div>

                      <div>
                        <span>Mise à jour</span>
                        <strong>{formatDate(selectedBooking.updatedAt)}</strong>
                      </div>

                      <div>
                        <span>Choix produits</span>
                        <strong>
                          {selectedBooking.letTeamChooseProducts
                            ? "Équipe choisit"
                            : "Client a choisi"}
                        </strong>
                      </div>
                    </div>

                    <div className="booking-quick-actions">
                      <button
                        type="button"
                        className="success"
                        disabled={
                          actionLoading || selectedBooking.status === "Accepted"
                        }
                        onClick={() => handleAccept(selectedBooking.id)}
                      >
                        <CheckCircle2 size={18} />
                        Accepter
                      </button>

                      <button
                        type="button"
                        className="danger"
                        disabled={
                          actionLoading || selectedBooking.status === "Refused"
                        }
                        onClick={() => handleRefuse(selectedBooking.id)}
                      >
                        <XCircle size={18} />
                        Refuser
                      </button>
                    </div>
                  </section>

                  <section className="booking-profile-panel booking-message-panel">
                    <div className="booking-panel-title">
                      <MessageSquareText size={18} />
                      <h3>Message client</h3>
                    </div>

                    <p className="booking-message-text">
                      {selectedBooking.message?.trim() ||
                        "Le client n’a pas laissé de message."}
                    </p>
                  </section>

                  <section className="booking-profile-panel booking-products-panel">
                    <div className="booking-panel-title">
                      <Package size={18} />
                      <h3>Produits à voir</h3>
                    </div>

                    {selectedBooking.productsToSee.length === 0 ? (
                      <p className="booking-empty-text">
                        Aucun produit sélectionné. Le client laisse l’équipe
                        choisir.
                      </p>
                    ) : (
                      <div className="booking-products-grid">
                        {selectedBooking.productsToSee.map((product) => (
                          <article
                            className="booking-product-card"
                            key={product.productId}
                          >
                            <div className="booking-product-image">
                              {product.mainImageUrl ? (
                                <img
                                  src={product.mainImageUrl}
                                  alt={product.productName}
                                />
                              ) : (
                                <Package size={24} />
                              )}
                            </div>

                            <div>
                              <strong>{product.productName}</strong>
                              <span>
                                {product.category || product.type || "Produit"} ·{" "}
                                {product.region || product.status}
                              </span>
                              <b>{formatMoney(product.price)}</b>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              </>
            ) : null}
          </section>
        </div>
      )}

      {confirmAction && (
        <div className="booking-confirm-overlay admin-modal">
          <section className="booking-confirm-modal admin-modal-content">
            <div className="booking-confirm-body admin-modal-body">
              <div className={`booking-confirm-icon ${confirmAction.kind}`}>
                <AlertTriangle size={26} />
              </div>

              <h3>{confirmAction.title}</h3>
              <p>{confirmAction.message}</p>
            </div>

            <div className="booking-confirm-actions admin-modal-actions">
              <button
                type="button"
                onClick={closeConfirmation}
                disabled={actionLoading}
              >
                Annuler
              </button>

              <button
                type="button"
                className={confirmAction.kind}
                onClick={runConfirmedAction}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="spin" size={17} />
                    Traitement...
                  </>
                ) : (
                  confirmAction.confirmLabel
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
