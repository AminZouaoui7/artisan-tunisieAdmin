// src/pages/PriceRequestDetailsPage.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  Phone,
  Save,
  Send,
  User,
} from "lucide-react";

import {
  getAdminPriceRequestById,
  sendAdminPriceRequestEmail,
  updateAdminPriceRequestStatus,
  type AdminPriceRequestDetails,
  type PriceRequestStatus,
} from "../services/adminPriceRequestService";

import "../styles/PriceRequestDetailsPage.css";

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    Pending: "En attente",
    Answered: "Répondue",
    Closed: "Clôturée",
  };

  return labels[status] || status;
}

export default function PriceRequestDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState<AdminPriceRequestDetails | null>(null);

  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [contactPhone, setContactPhone] = useState("+216 ");
  const [replyMessage, setReplyMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  const generatedMessage = useMemo(() => {
    if (!request) return "";

    const priceText = price.trim()
      ? `${price.trim()} ${currency}`
      : "le prix convenu";

    return `Bonjour ${request.customerName},

Merci pour votre demande concernant le tapis "${request.productName}".

Après étude de votre demande, nous avons le plaisir de vous proposer cette pièce au prix de ${priceText}.

Pour confirmer votre intérêt ou réserver cette pièce unique, vous pouvez nous contacter directement au ${contactPhone.trim()}.

Bien cordialement,
L’Artisan de la Médina`;
  }, [request, price, currency, contactPhone]);

  const loadDetails = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError("");

      const data = await getAdminPriceRequestById(id);
      setRequest(data);

      const defaultPhone = data.phone ? data.phone : "+216 ";
      setContactPhone(defaultPhone);

      const defaultMessage = `Bonjour ${data.customerName},

Merci pour votre demande concernant le tapis "${data.productName}".

Après étude de votre demande, nous avons le plaisir de vous proposer cette pièce au prix de [PRIX À SAISIR].

Pour confirmer votre intérêt ou réserver cette pièce unique, vous pouvez nous contacter directement au ${defaultPhone}.

Bien cordialement,
L’Artisan de la Médina`;

      setReplyMessage(defaultMessage);
    } catch {
      setError("Impossible de charger la demande de prix.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  const applyGeneratedMessage = () => {
    setReplyMessage(generatedMessage);
    showToast("Message mis à jour avec le prix.");
  };

  const changeStatus = async (status: PriceRequestStatus) => {
    if (!request || request.status === status) return;

    try {
      setActionLoading(true);

      const result = await updateAdminPriceRequestStatus(request.id, status);
      setRequest((prev) => (prev ? { ...prev, status } : prev));
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

  const sendReply = async () => {
    if (!request) return;

    if (!price.trim()) {
      showToast("Merci de saisir le prix avant l’envoi.");
      return;
    }

    if (!contactPhone.trim()) {
      showToast("Le numéro de contact est obligatoire.");
      return;
    }

    if (!replyMessage.trim()) {
      showToast("Le message email est obligatoire.");
      return;
    }

    const confirmSend = window.confirm(
      `Envoyer cette réponse à ${request.email} ?`
    );

    if (!confirmSend) return;

    try {
      setActionLoading(true);

      const result = await sendAdminPriceRequestEmail(request.id, {
        message: replyMessage.trim(),
        contactPhone: contactPhone.trim(),
      });

      const updated = await getAdminPriceRequestById(request.id);
      setRequest(updated);

      showToast(result.message || "Email envoyé avec succès.");
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Impossible d’envoyer l’email.";

      showToast(apiMessage);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="prd-page">
        <section className="prd-state">
          <Loader2 className="spin" size={34} />
          <p>Chargement de la demande...</p>
        </section>
      </main>
    );
  }

  if (error || !request) {
    return (
      <main className="prd-page">
        <section className="prd-state prd-error">
          <AlertCircle size={34} />
          <p>{error || "Demande introuvable."}</p>
          <button type="button" onClick={() => navigate(-1)}>
            Retour
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="prd-page">
      {toast && (
        <div className="prd-toast">
          <CheckCircle2 size={20} />
          <span>{toast}</span>
        </div>
      )}

      <button type="button" className="prd-back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} />
        Retour aux demandes
      </button>

      <section className="prd-hero">
        <div className="prd-avatar">
          {request.customerName?.charAt(0)?.toUpperCase() || "C"}
        </div>

        <div className="prd-hero-content">
          <span>Réponse client</span>
          <h1>{request.customerName}</h1>

          <div className="prd-contact">
            <p>
              <Mail size={16} />
              {request.email}
            </p>

            <p>
              <Phone size={16} />
              {request.phone || "Téléphone non renseigné"}
            </p>
          </div>
        </div>

        <div className="prd-status-box">
          <span className={`prd-status status-${request.status.toLowerCase()}`}>
            {getStatusLabel(request.status)}
          </span>

          <select
            value={request.status}
            disabled={actionLoading}
            onChange={(e) => changeStatus(e.target.value as PriceRequestStatus)}
          >
            <option value="Pending">En attente</option>
            <option value="Answered">Répondue</option>
            <option value="Closed">Clôturée</option>
          </select>
        </div>
      </section>

      <section className="prd-stats">
        <div>
          <span>Produit demandé</span>
          <strong>{request.productName}</strong>
        </div>

        <div>
          <span>Pays</span>
          <strong>{request.countryCode || "—"}</strong>
        </div>

        <div>
          <span>Messages</span>
          <strong>{request.messages.length}</strong>
        </div>

        <div>
          <span>Date demande</span>
          <strong>{formatDate(request.createdAt)}</strong>
        </div>
      </section>

      <section className="prd-layout">
        <aside className="prd-card">
          <div className="prd-card-title">
            <User size={19} />
            <div>
              <h2>Informations</h2>
              <p>Détails principaux de la demande.</p>
            </div>
          </div>

          <div className="prd-info-grid">
            <div>
              <span>ID demande</span>
              <strong>{request.id}</strong>
            </div>

            <div>
              <span>ID produit</span>
              <strong>#{request.productId}</strong>
            </div>

            <div>
              <span>Produit</span>
              <strong>{request.productName}</strong>
            </div>

            <div>
              <span>Créée le</span>
              <strong>{formatDate(request.createdAt)}</strong>
            </div>

            <div>
              <span>Mise à jour</span>
              <strong>{formatDate(request.updatedAt)}</strong>
            </div>
          </div>

          <div className="prd-history">
            <div className="prd-card-title small">
              <Clock size={18} />
              <div>
                <h2>Historique messages</h2>
                <p>{request.messages.length} message(s)</p>
              </div>
            </div>

            <div className="prd-timeline">
              {request.messages.length === 0 ? (
                <p className="prd-empty">Aucun message enregistré.</p>
              ) : (
                request.messages.map((message) => (
                  <article
                    key={message.id}
                    className={`prd-message ${
                      message.senderType === "Admin"
                        ? "admin-message"
                        : "client-message"
                    }`}
                  >
                    <strong>
                      {message.senderType === "Admin"
                        ? "Administrateur"
                        : "Client"}
                    </strong>
                    <small>{formatDate(message.sentAt)}</small>
                    <p>{message.message}</p>
                  </article>
                ))
              )}
            </div>
          </div>
        </aside>

        <section className="prd-card prd-reply-card">
          <div className="prd-card-title">
            <Send size={19} />
            <div>
              <h2>Répondre au client</h2>
              <p>Saisis le prix manuellement puis prépare l’email.</p>
            </div>
          </div>

          <div className="prd-form-grid">
            <label>
              Prix proposé
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Ex : 450"
                inputMode="decimal"
              />
            </label>

            <label>
              Devise
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="TND">TND</option>
                <option value="GBP">GBP</option>
              </select>
            </label>

            <label className="full">
              Numéro de contact
              <input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+216 ..."
              />
            </label>
          </div>

          <button
            type="button"
            className="prd-generate-btn"
            onClick={applyGeneratedMessage}
          >
            <Save size={17} />
            Insérer le prix dans le message
          </button>

          <label className="prd-message-field">
            Message email
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Écris ta réponse au client..."
            />
          </label>

          <div className="prd-preview">
            <span>Destinataire</span>
            <strong>{request.email}</strong>
          </div>

          <button
            type="button"
            className="prd-send-btn"
            disabled={actionLoading}
            onClick={sendReply}
          >
            {actionLoading ? (
              <>
                <Loader2 className="spin" size={18} />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send size={18} />
                Envoyer l’email
              </>
            )}
          </button>
        </section>
      </section>
    </main>
  );
}