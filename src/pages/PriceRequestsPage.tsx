import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  Mail,
  MessageSquareText,
  Phone,
  Search,
  Send,
  User,
  X,
} from "lucide-react";

import {
  getAdminPriceRequestById,
  getAdminPriceRequests,
  sendAdminPriceRequestEmail,
  updateAdminPriceRequestStatus,
  type AdminPriceRequestDetails,
  type AdminPriceRequestListItem,
  type PriceRequestStatus,
} from "../services/adminPriceRequestService";

import "../styles/PriceRequestsPage.css";

const statuses = ["All", "Pending", "Answered", "Closed"];

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    All: "Toutes",
    Pending: "En attente",
    Answered: "Répondue",
    Closed: "Clôturée",
  };

  return labels[status] || status;
}

export default function PriceRequestsPage() {
  const [requests, setRequests] = useState<AdminPriceRequestListItem[]>([]);
  const [selectedRequest, setSelectedRequest] =
    useState<AdminPriceRequestDetails | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [replyMessage, setReplyMessage] = useState("");
  const [contactPhone, setContactPhone] = useState("+216 ");

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [confirmSend, setConfirmSend] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const filteredRequests = useMemo(() => {
    const s = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesStatus =
        statusFilter === "All" || request.status === statusFilter;

      const matchesSearch =
        !s ||
        request.customerName.toLowerCase().includes(s) ||
        request.email.toLowerCase().includes(s) ||
        request.productName.toLowerCase().includes(s) ||
        request.phone?.toLowerCase().includes(s);

      return matchesStatus && matchesSearch;
    });
  }, [requests, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((x) => x.status === "Pending").length,
      answered: requests.filter((x) => x.status === "Answered").length,
      closed: requests.filter((x) => x.status === "Closed").length,
    };
  }, [requests]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminPriceRequests();
      setRequests(data);
    } catch {
      setError("Impossible de charger les demandes de prix.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const openDetails = async (id: string) => {
    try {
      setDetailsLoading(true);
      setError("");
      setHistoryOpen(false);

      const data = await getAdminPriceRequestById(id);
      setSelectedRequest(data);

      const defaultText = `Bonjour ${data.customerName},

Merci pour votre demande concernant le tapis "${data.productName}".

Nous avons bien étudié votre demande. Vous trouverez le prix et les informations nécessaires dans cet email.

Pour confirmer votre intérêt ou réserver cette pièce, vous pouvez nous contacter directement au numéro ci-dessous.

Bien cordialement,
L’Artisan de la Médina`;

      setReplyMessage(defaultText);
    } catch {
      setError("Impossible de charger le détail de la demande.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const refreshRequestStatus = (id: string, status: PriceRequestStatus) => {
    setRequests((prev) =>
      prev.map((request) =>
        request.id === id ? { ...request, status } : request
      )
    );

    setSelectedRequest((prev) =>
      prev && prev.id === id ? { ...prev, status } : prev
    );
  };

  const sendReply = async () => {
    if (!selectedRequest) return;

    if (!replyMessage.trim()) {
      showToast("Le message est obligatoire.");
      return;
    }

    if (!contactPhone.trim()) {
      showToast("Le numéro de contact est obligatoire.");
      return;
    }

    try {
      setActionLoading(true);

      const result = await sendAdminPriceRequestEmail(selectedRequest.id, {
        message: replyMessage.trim(),
        contactPhone: contactPhone.trim(),
      });

      refreshRequestStatus(selectedRequest.id, result.status);

      const updatedDetails = await getAdminPriceRequestById(selectedRequest.id);
      setSelectedRequest(updatedDetails);

      showToast(result.message || "Email envoyé avec succès.");
      setConfirmSend(false);
    } catch (error: any) {
  console.error("SEND EMAIL ERROR:", error?.response?.data);

  const apiMessage =
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    "Impossible d’envoyer l’email.";

  showToast(apiMessage);
}
    
    finally {
      setActionLoading(false);
    }
  };

  const changeStatus = async (id: string, status: PriceRequestStatus) => {
    if (!selectedRequest || selectedRequest.status === status) return;

    try {
      setActionLoading(true);

      const result = await updateAdminPriceRequestStatus(id, status);
      refreshRequestStatus(id, status);
      showToast(result.message || "Statut mis à jour.");
    } catch (error: any) {
      showToast(
        error?.response?.data?.message ||
          "Impossible de mettre à jour le statut."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const closeMainModal = () => {
    setSelectedRequest(null);
    setHistoryOpen(false);
    setConfirmSend(false);
  };

  return (
    <main className="admin-price-requests-page">
      {toast && (
        <div className="price-requests-toast">
          <CheckCircle2 size={20} />
          <span>{toast}</span>
        </div>
      )}

     

      <section className="price-requests-stats-grid">
        <div>
          <span>Total demandes</span>
          <strong>{stats.total}</strong>
        </div>

        <div>
          <span>En attente</span>
          <strong>{stats.pending}</strong>
        </div>

        <div>
          <span>Répondues</span>
          <strong>{stats.answered}</strong>
        </div>

        <div>
          <span>Clôturées</span>
          <strong>{stats.closed}</strong>
        </div>
      </section>

      <section className="price-requests-filter-card">
        <div className="price-requests-search-box">
          <Search size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par client, email, produit ou téléphone..."
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {getStatusLabel(status)}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="price-requests-light-btn"
          onClick={() => {
            setSearch("");
            setStatusFilter("All");
          }}
        >
          Réinitialiser
        </button>
      </section>

      {loading ? (
        <section className="price-requests-state-card">
          <Loader2 className="spin" size={28} />
          <p>Chargement des demandes...</p>
        </section>
      ) : error ? (
        <section className="price-requests-error-card">
          <AlertCircle size={28} />
          <p>{error}</p>
          <button type="button" onClick={loadRequests}>
            Réessayer
          </button>
        </section>
      ) : filteredRequests.length === 0 ? (
        <section className="price-requests-state-card">
          <MessageSquareText size={30} />
          <p>Aucune demande trouvée.</p>
        </section>
      ) : (
        <section className="price-requests-table-card">
          <div className="price-requests-table-wrap">
            <table className="price-requests-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Produit</th>
                  <th>Contact</th>
                  <th>Pays</th>
                  <th>Messages</th>
                  <th>Statut</th>
                  <th>Créée le</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <div className="price-request-user">
                        <div className="price-request-avatar">
                          {request.customerName?.charAt(0)?.toUpperCase() ||
                            "C"}
                        </div>

                        <div>
                          <strong>{request.customerName}</strong>
                          <span>{request.email}</span>
                        </div>
                      </div>
                    </td>

                    <td>{request.productName}</td>
                    <td>{request.phone || "—"}</td>
                    <td>{request.countryCode || "—"}</td>
                    <td>{request.messagesCount}</td>

                    <td>
                      <span
                        className={`price-request-status status-${request.status.toLowerCase()}`}
                      >
                        {getStatusLabel(request.status)}
                      </span>
                    </td>

                    <td>{formatDate(request.createdAt)}</td>

                    <td>
                      <button
                        type="button"
                        className="price-request-view-btn"
                        onClick={() => openDetails(request.id)}
                      >
                        <Eye size={17} />
                        Voir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {(selectedRequest || detailsLoading) && (
        <div className="price-request-profile-overlay">
          <section className="price-request-profile-modal price-request-modal-redesign">
            {detailsLoading ? (
              <div className="price-request-profile-loading">
                <Loader2 className="spin" size={34} />
                <p>Chargement de la demande...</p>
              </div>
            ) : selectedRequest ? (
              <>
                <button
                  type="button"
                  className="price-request-profile-close"
                  onClick={closeMainModal}
                >
                  <X size={20} />
                </button>

                <div className="price-request-profile-hero price-request-redesign-hero">
                  <div className="price-request-profile-avatar">
                    {selectedRequest.customerName?.charAt(0)?.toUpperCase() ||
                      "C"}
                  </div>

                  <div className="price-request-profile-main">
                    <span>Réponse client</span>
                    <h2>{selectedRequest.customerName}</h2>

                    <div className="price-request-profile-contact">
                      <p>
                        <Mail size={16} />
                        {selectedRequest.email}
                      </p>

                      <p>
                        <Phone size={16} />
                        {selectedRequest.phone || "Téléphone non renseigné"}
                      </p>
                    </div>
                  </div>

                  <div className="price-request-profile-status">
                    <span
                      className={`price-request-status status-${selectedRequest.status.toLowerCase()}`}
                    >
                      {getStatusLabel(selectedRequest.status)}
                    </span>

                    <select
                      value={selectedRequest.status}
                      disabled={actionLoading}
                      onChange={(e) =>
                        changeStatus(
                          selectedRequest.id,
                          e.target.value as PriceRequestStatus
                        )
                      }
                    >
                      <option value="Pending">En attente</option>
                      <option value="Answered">Répondue</option>
                      <option value="Closed">Clôturée</option>
                    </select>
                  </div>
                </div>

                <div className="price-request-profile-stats">
                  <div>
                    <span>Produit demandé</span>
                    <strong>{selectedRequest.productName}</strong>
                  </div>

                  <div>
                    <span>Pays</span>
                    <strong>{selectedRequest.countryCode || "—"}</strong>
                  </div>

                  <div>
                    <span>Messages</span>
                    <strong>{selectedRequest.messages.length}</strong>
                  </div>

                  <div>
                    <span>Date demande</span>
                    <strong>{formatDate(selectedRequest.createdAt)}</strong>
                  </div>
                </div>

                <div className="price-request-profile-body price-request-body-redesign">
                  <section className="price-request-panel premium-summary-panel">
                    <div className="price-request-panel-title premium-panel-title">
                      <div className="premium-title-icon">
                        <User size={18} />
                      </div>

                      <div>
                        <h3>Informations demande</h3>
                        <p>Détails principaux de la demande client.</p>
                      </div>
                    </div>

                    <div className="price-request-summary-grid premium-summary-grid">
                      <div>
                        <span>ID demande</span>
                        <strong>{selectedRequest.id}</strong>
                      </div>

                      <div>
                        <span>ID produit</span>
                        <strong>#{selectedRequest.productId}</strong>
                      </div>

                      <div>
                        <span>Produit</span>
                        <strong>{selectedRequest.productName}</strong>
                      </div>

                      <div>
                        <span>Créée le</span>
                        <strong>{formatDate(selectedRequest.createdAt)}</strong>
                      </div>

                      <div>
                        <span>Mise à jour</span>
                        <strong>{formatDate(selectedRequest.updatedAt)}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="price-request-history-button"
                      onClick={() => setHistoryOpen(true)}
                    >
                      <Clock size={18} />
                      Voir l’historique messages
                      <span>{selectedRequest.messages.length}</span>
                    </button>
                  </section>

                  <section className="price-request-panel premium-reply-panel price-request-reply-redesign">
                    <div className="price-request-panel-title premium-panel-title">
                      <div className="premium-title-icon">
                        <Send size={18} />
                      </div>

                      <div>
                        <h3>Répondre au client</h3>
                        <p>
                          Prépare un email clair avec le prix et le numéro de
                          contact.
                        </p>
                      </div>
                    </div>

                    <div className="premium-reply-grid">
                      <label className="price-request-label premium-phone-field">
                        Numéro de contact
                        <input
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="+216 ..."
                        />
                      </label>

                      <div className="premium-email-preview">
                        <span>Destinataire</span>
                        <strong>{selectedRequest.email}</strong>
                      </div>
                    </div>

                    <label className="price-request-label premium-message-field">
                      Message email
                      <textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Écris ta réponse au client..."
                      />
                    </label>

                    <div className="premium-reply-footer">
                     

                      <button
                        type="button"
                        className="price-request-send-btn premium-send-btn"
                        disabled={actionLoading}
                        onClick={() => setConfirmSend(true)}
                      >
                        <Send size={18} />
                        Envoyer l’email
                      </button>
                    </div>
                  </section>
                </div>
              </>
            ) : null}
          </section>
        </div>
      )}

      {historyOpen && selectedRequest && (
        <div className="price-request-history-overlay">
          <section className="price-request-history-modal">
            <button
              type="button"
              className="price-request-history-close"
              onClick={() => setHistoryOpen(false)}
            >
              <X size={20} />
            </button>

            <div className="history-modal-header">
              <div className="premium-title-icon">
                <Clock size={20} />
              </div>

              <div>
                <span>Historique messages</span>
                <h3>{selectedRequest.customerName}</h3>
                <p>{selectedRequest.productName}</p>
              </div>
            </div>

            <div className="history-modal-list premium-timeline">
              {selectedRequest.messages.length === 0 ? (
                <p className="price-request-empty-text">
                  Aucun message enregistré.
                </p>
              ) : (
                selectedRequest.messages.map((message) => (
                  <article
                    className={`price-request-message premium-message-card ${
                      message.senderType === "Admin"
                        ? "admin-message"
                        : "client-message"
                    }`}
                    key={message.id}
                  >
                    <div className="premium-message-head">
                      <span className="premium-sender-dot" />
                      <div>
                        <strong>
                          {message.senderType === "Admin"
                            ? "Administrateur"
                            : "Client"}
                        </strong>
                        <small>{formatDate(message.sentAt)}</small>
                      </div>
                    </div>

                    <p>{message.message}</p>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {confirmSend && selectedRequest && (
        <div className="price-request-confirm-overlay">
          <section className="price-request-confirm-modal">
            <div className="price-request-confirm-icon">
              <AlertTriangle size={26} />
            </div>

            <h3>Envoyer cette réponse ?</h3>
            <p>
              L’email sera envoyé à <strong>{selectedRequest.email}</strong> et
              la demande passera automatiquement en statut répondu.
            </p>

            <div className="price-request-confirm-actions">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setConfirmSend(false)}
              >
                Annuler
              </button>

              <button type="button" disabled={actionLoading} onClick={sendReply}>
                {actionLoading ? (
                  <>
                    <Loader2 className="spin" size={17} />
                    Envoi...
                  </>
                ) : (
                  "Oui, envoyer"
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}