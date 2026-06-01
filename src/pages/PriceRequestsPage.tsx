import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Loader2,
  MessageSquareText,
  Search,
} from "lucide-react";

import {
  getAdminPriceRequests,
  type AdminPriceRequestListItem,
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
  const navigate = useNavigate();

  const [requests, setRequests] = useState<AdminPriceRequestListItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const filteredRequests = useMemo(() => {
    const s = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesStatus =
        statusFilter === "All" || request.status === statusFilter;

      const matchesSearch =
        !s ||
        request.customerName?.toLowerCase().includes(s) ||
        request.email?.toLowerCase().includes(s) ||
        request.productName?.toLowerCase().includes(s) ||
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

  const openDetailsPage = (id: string) => {
    navigate(`/admin/price-requests/${id}`);
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
            showToast("Filtres réinitialisés.");
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
                        onClick={() => openDetailsPage(request.id)}
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
    </main>
  );
}