import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  CalendarCheck,
  LogOut,
  Menu,
  MessageSquareText,
  Search,
  ShoppingBag,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getAdminNotificationSummary,
  type AdminNotificationSummary,
} from "../services/adminNotificationService";
import "../styles/AdminLayout.css";

export default function AdminTopbar({
  onMenuClick,
}: {
  onMenuClick?: () => void;
}) {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const previousTotalRef = useRef<number | null>(null);

  const [notifications, setNotifications] =
    useState<AdminNotificationSummary | null>(null);
  const [openNotifications, setOpenNotifications] = useState(false);

  const total = notifications?.total ?? 0;

  const notificationItems = useMemo(
    () => [
      {
        label: "Commandes en attente",
        count: notifications?.pendingOrders ?? 0,
        path: "/orders",
        icon: ShoppingBag,
      },
      {
        label: "Réservations en attente",
        count: notifications?.pendingBookings ?? 0,
        path: "/bookings",
        icon: CalendarCheck,
      },
      {
        label: "Demandes de prix",
        count: notifications?.pendingPriceRequests ?? 0,
        path: "/price-requests",
        icon: MessageSquareText,
      },
    ],
    [notifications]
  );

  const loadNotifications = async () => {
    try {
      const data = await getAdminNotificationSummary();

      const newTotal =
        data.pendingOrders +
        data.pendingBookings +
        data.pendingPriceRequests;

      const previousTotal = previousTotalRef.current;

      if (previousTotal !== null && newTotal > previousTotal) {
        setOpenNotifications(true);
      }

      previousTotalRef.current = newTotal;
      setNotifications(data);
    } catch {
      setNotifications(null);
    }
  };

  useEffect(() => {
    loadNotifications();

    const intervalId = window.setInterval(() => {
      loadNotifications();
    }, 30000);

    const handleFocus = () => {
      loadNotifications();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadNotifications();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const logout = () => {
    localStorage.removeItem("artisan_admin_token");
    navigate("/login", { replace: true });
  };

  const goTo = (path: string) => {
    setOpenNotifications(false);
    navigate(path);
  };

  return (
    <header className="admin-topbar">
      <button className="admin-menu-btn" onClick={onMenuClick}>
        <Menu size={22} />
      </button>

      <div className="admin-topbar-search">
        <Search size={19} />
        <input type="text" placeholder="Search..." />
      </div>

      <div className="admin-topbar-actions">
        <div className="admin-notifications" ref={dropdownRef}>
          <button
            className={`admin-bell-btn ${total > 0 ? "has-notifications" : ""}`}
            type="button"
            aria-label="Notifications"
            onClick={() => setOpenNotifications((current) => !current)}
          >
            <Bell size={19} />

            {total > 0 && (
              <span className="admin-notification-badge">
                {total > 99 ? "99+" : total}
              </span>
            )}
          </button>

          {openNotifications && (
            <div className="admin-notifications-dropdown">
              <div className="admin-notifications-header">
                <div>
                  <strong>Notifications</strong>
                  <span>
                    {total} élément{total > 1 ? "s" : ""} à traiter
                  </span>
                </div>
              </div>

              <div className="admin-notifications-list">
                {notificationItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.path}
                      type="button"
                      className="admin-notification-row"
                      onClick={() => goTo(item.path)}
                    >
                      <span className="admin-notification-icon">
                        <Icon size={17} />
                      </span>

                      <span className="admin-notification-content">
                        <span className="admin-notification-label">
                          {item.label}
                        </span>
                      </span>

                      <span
                        className={`admin-notification-count ${
                          item.count > 0 ? "active" : ""
                        }`}
                      >
                        {item.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="admin-user">
          <div className="admin-user-avatar">AM</div>
          <span>Admin</span>
        </div>

        <button
          className="admin-logout-btn"
          type="button"
          onClick={logout}
          aria-label="Déconnexion"
        >
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}