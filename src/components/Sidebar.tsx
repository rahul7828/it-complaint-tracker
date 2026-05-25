import { LayoutDashboard, Ticket, LogOut } from "lucide-react";
import { supabase } from "../supabaseClient";

export default function Sidebar() {
  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div style={styles.sidebar}>
      {/* TOP */}
      <div>
        <div style={styles.logoSection}>
          <img src="/logo.png" alt="logo" style={styles.logo} />

          <div>
            <h2 style={styles.title}>Eagle Seeds</h2>
            <p style={styles.subtitle}>IT Command Center</p>
          </div>
        </div>

        {/* MENU */}
        <div style={styles.menu}>
          <a href="/user" style={styles.activeItem}>
            <LayoutDashboard size={18} />
            Dashboard
          </a>

          <a href="/closed-tickets" style={styles.menuItem}>
            <Ticket size={18} />
            Closed Tickets
          </a>
        </div>
      </div>

      {/* BOTTOM */}
      <button onClick={logout} style={styles.logoutBtn}>
        <LogOut size={18} />
        Logout
      </button>
    </div>
  );
}

const styles: any = {
  sidebar: {
    width: 260,
    background: "#0f172a",
    color: "#fff",
    height: "100vh",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    position: "fixed",
    left: 0,
    top: 0,
    borderRight: "1px solid #1e293b",
  },

  logoSection: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 40,
  },

  logo: {
    width: 52,
    height: 52,
    borderRadius: 12,
    background: "#fff",
    objectFit: "contain",
  },

  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
  },

  subtitle: {
    margin: 0,
    color: "#94a3b8",
    fontSize: 12,
  },

  menu: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  activeItem: {
    background: "#10b98122",
    color: "#10b981",
    padding: "14px 16px",
    borderRadius: 12,
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontWeight: 600,
  },

  menuItem: {
    color: "#cbd5e1",
    padding: "14px 16px",
    borderRadius: 12,
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontWeight: 500,
  },

  logoutBtn: {
    background: "#ef4444",
    border: "none",
    color: "#fff",
    padding: "12px",
    borderRadius: 12,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontWeight: 600,
  },
};