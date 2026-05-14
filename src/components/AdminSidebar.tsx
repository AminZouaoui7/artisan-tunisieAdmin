import {
  CalendarCheck,
  ChevronRight,
  LayoutDashboard,
  MessageSquareText,
  Package,
  ShoppingBag,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import "../styles/AdminLayout.css";
import logoColorWhite from "../assets/color white.png";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Produits", icon: Package },
  { to: "/orders", label: "Commandes", icon: ShoppingBag },
  { to: "/customers", label: "Clients", icon: Users },
  { to: "/bookings", label: "Réservations", icon: CalendarCheck },
  { to: "/price-requests", label: "Demandes de prix", icon: MessageSquareText },
];

type Props = {
  open?: boolean;
  onClose?: () => void;
};

export default function AdminSidebar({ open, onClose }: Props) {
  return (
    <aside className={`admin-sidebar ${open ? "admin-sidebar--open" : ""}`}>
      <div className="admin-sidebar-top">
        <div className="admin-brand">
          <div className="admin-brand-logo">
            <img src={logoColorWhite} alt="Artisan Medina" />
          </div>

          <div className="admin-brand-text">
            <strong>Artisan Medina</strong>
          </div>
        </div>
      </div>

      <nav className="admin-nav">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/dashboard"}
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? "active" : ""}`
              }
              onClick={onClose}
            >
              <span className="admin-nav-icon">
                <Icon size={18} />
              </span>

              <span className="admin-nav-label">{item.label}</span>

              <ChevronRight size={15} className="admin-nav-arrow" />
            </NavLink>
          );
        })}
      </nav>

      <div className="admin-sidebar-footer">
        <span>Compte connecté</span>
        <strong>Administrateur</strong>
      </div>
    </aside>
  );
}
