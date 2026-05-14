import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Lock, Mail } from "lucide-react";
import {
  isAdminAuthenticated,
  loginAdmin,
} from "../services/adminAuthService";
import logo from "../assets/color white.png";

import "../styles/LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("admin@artisanmadina.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectPath =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname || "/dashboard";

  if (isAdminAuthenticated()) {
    return <Navigate to={redirectPath} replace />;
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email et mot de passe requis.");
      return;
    }

    try {
      setLoading(true);

      await loginAdmin({
        email: email.trim(),
        password,
      });

      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setError(
        err instanceof Error ? err.message : "Email ou mot de passe incorrect."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <header className="login-header">
          
          <img className="login-logo" src={logo} alt="Artisan Medina" />
          <p className="login-kicker">Administration Artisan Medina</p>
          <h1>L'Artisan de la Médina</h1>
          <p className="login-subtitle">
            Accédez au back-office premium pour gérer vos produits, commandes et clients.
          </p>
        </header>

        <form onSubmit={submit}>
          <label>
            Email admin
            <div className="login-field">
              <Mail size={16} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@email.com"
                autoComplete="email"
              />
            </div>
          </label>

          <label>
            Mot de passe
            <div className="login-field">
              <Lock size={16} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          </label>

          {error && <p className="login-error">{error}</p>}

          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? "Connexion…" : "Se connecter "}
          </button>
        </form>
      </section>
    </main>
  );
}
