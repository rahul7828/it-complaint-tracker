import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

import {
  LayoutDashboard,
  Ticket,
  Plus,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";

import TicketList from "../components/TicketList";
import TicketDetails from "../components/TicketDetails";
import CreateTicketModal from "../components/CreateTicketModal";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

export default function UserDashboard() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] =
    useState<any>(null);

  const [showCreate, setShowCreate] =
    useState(false);

  const [activePage, setActivePage] =
    useState("dashboard");

  const [userName, setUserName] =
    useState("");

  // =====================================================
  // DISPLAY MODE
  // =====================================================

  const [darkMode, setDarkMode] = useState(() => {
    const savedMode =
      localStorage.getItem("displayMode");

    return savedMode !== "light";
  });

  // =====================================================
  // FILTERS
  // =====================================================

  const [showOpen, setShowOpen] =
    useState(true);

  const [showInProgress, setShowInProgress] =
    useState(true);

  const [showResolved, setShowResolved] =
    useState(true);

  const [showClosed, setShowClosed] =
    useState(true);

  // =====================================================
  // NORMALIZE STATUS
  // =====================================================

  const normalizeStatus = (val: any) =>
    val
      ?.toString()
      .toLowerCase()
      .replace("_", " ")
      .trim();

  // =====================================================
  // FETCH TICKETS
  // =====================================================

  const fetchTickets = async () => {
    const { data } =
      await supabase.auth.getUser();

    const user = data.user;

    if (!user) return;

    // USER NAME
    const { data: profile } =
      await supabase
        .from("users")
        .select("name")
        .eq("id", user.id)
        .single();

    if (profile?.name) {
      setUserName(profile.name);
    }

    const { data: ticketData, error } =
      await supabase
        .from("tickets")
        .select(`
          *,
          ticket_updates (
            message,
            created_at
          )
        `)
        .eq("created_by", user.id)
        .order("created_at", {
          ascending: false,
        });

    if (!error) {
      setTickets(ticketData || []);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // =====================================================
  // DISPLAY MODE TOGGLE
  // =====================================================

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const newMode = !prev;

      localStorage.setItem(
        "displayMode",
        newMode ? "dark" : "light"
      );

      return newMode;
    });
  };

  // =====================================================
  // FILTERED TICKETS
  // =====================================================

  const filteredTickets = tickets.filter(
    (t) => {
      return (
        (showOpen &&
          t.status === "Open") ||

        (showInProgress &&
          t.status === "In Progress") ||

        (showResolved &&
          t.status === "Resolved") ||

        (showClosed &&
          t.status === "Closed")
      );
    }
  );

  // =====================================================
  // STATUS COUNT
  // =====================================================

  const statusCounts: any = {
    open: 0,
    "in progress": 0,
    resolved: 0,
    closed: 0,
  };

  tickets.forEach((t) => {
    const status = normalizeStatus(
      t.status
    );

    if (
      statusCounts[status] !== undefined
    ) {
      statusCounts[status]++;
    }
  });

  // =====================================================
  // STATS
  // =====================================================

  const total = tickets.length;

  const open =
    statusCounts["open"];

  const inProgress =
    statusCounts["in progress"];

  const resolved =
    statusCounts["resolved"];

  const closed =
    statusCounts["closed"];

  const statusData = [
    {
      name: "Open",
      value: open,
    },
    {
      name: "In Progress",
      value: inProgress,
    },
    {
      name: "Resolved",
      value: resolved,
    },
    {
      name: "Closed",
      value: closed,
    },
  ];

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = async () => {
    await supabase.auth.signOut();

    window.location.href = "/";
  };

  // =====================================================
  // THEME COLORS
  // =====================================================

  const theme = {
    pageBackground: darkMode
      ? "#0f172a"
      : "#f8fafc",

    sidebarBackground: darkMode
      ? "#111827"
      : "#ffffff",

    headerBackground: darkMode
      ? "#0f172a"
      : "#f8fafc",

    cardBackground: darkMode
      ? "#000000"
      : "#ffffff",

    chartBackground: darkMode
      ? "#111827"
      : "#ffffff",

    primaryText: darkMode
      ? "#ffffff"
      : "#0f172a",

    secondaryText: darkMode
      ? "#cbd5e1"
      : "#334155",

    mutedText: darkMode
      ? "#94a3b8"
      : "#64748b",

    border: darkMode
      ? "rgba(255,255,255,0.06)"
      : "#e2e8f0",

    modeButtonBackground: darkMode
      ? "#1e293b"
      : "#ffffff",

    modeButtonText: darkMode
      ? "#f8fafc"
      : "#334155",

    modeButtonBorder: darkMode
      ? "#334155"
      : "#cbd5e1",
  };

  // =====================================================
  // STYLES
  // =====================================================

  const styles: any = {
    layout: {
      display: "flex",
      height: "100vh",
      overflow: "hidden",
      background: theme.pageBackground,
      color: theme.primaryText,
      fontFamily: "Inter, sans-serif",
      transition:
        "background 0.2s ease, color 0.2s ease",
    },

    sidebar: {
      width: 250,
      background:
        theme.sidebarBackground,
      padding: 12,
      position: "fixed",
      top: 0,
      left: 0,
      bottom: 0,
      borderRight:
        `1px solid ${theme.border}`,
      zIndex: 100,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      transition:
        "background 0.2s ease",
    },

    logoBox: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      marginBottom: 40,
      paddingTop: 10,
    },

    logo: {
      width: 50,
      height: 50,
      borderRadius: 14,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },

    brand: {
      margin: 0,
      fontSize: 18,
      color: theme.primaryText,
    },

    subBrand: {
      margin: 0,
      color: "#94a3b8",
      fontSize: 11,
    },

    menu: {
      display: "flex",
      flexDirection: "column",
      gap: 10,
    },

    activeMenu: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "14px 18px",
      borderRadius: 12,
      background:
        "rgba(16,185,129,0.15)",
      color: "#10b981",
      cursor: "pointer",
      fontWeight: 600,
    },

    menuItem: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "14px 18px",
      borderRadius: 12,
      color: theme.secondaryText,
      cursor: "pointer",
    },

    logoutBtn: {
      width: "100%",
      border: "none",
      background: "#ef4444",
      color: "#fff",
      padding: "12px",
      borderRadius: 12,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      fontWeight: 600,
      marginBottom: 10,
    },

    main: {
      marginLeft: "250px",
      width: "calc(100% - 250px)",
      height: "100vh",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    },

    header: {
      position: "sticky",
      top: 0,
      zIndex: 90,
      background:
        theme.headerBackground,
      padding: "18px 26px",
      borderBottom:
        `1px solid ${theme.border}`,
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      transition:
        "background 0.2s ease",
    },

    headerButtons: {
      display: "flex",
      alignItems: "center",
      gap: 10,
    },

    heading: {
      margin: 0,
      fontSize: 28,
      fontWeight: 700,
      color: theme.primaryText,
    },

    displayModeBtn: {
      background:
        theme.modeButtonBackground,
      color:
        theme.modeButtonText,
      border:
        `1px solid ${theme.modeButtonBorder}`,
      padding: "10px 14px",
      borderRadius: 12,
      cursor: "pointer",
      fontWeight: 600,
      fontSize: 13,
      display: "flex",
      alignItems: "center",
      gap: 7,
      outline: "none",
    },

    changePassBtn: {
      background:
        "linear-gradient(135deg,#2563eb,#4f46e5)",
      color: "#fff",
      border: "none",
      padding: "10px 16px",
      borderRadius: 12,
      cursor: "pointer",
      fontWeight: 600,
      fontSize: 13,
      outline: "none",
      boxShadow:
        "0 8px 20px rgba(37,99,235,0.30)",
    },

    content: {
      flex: 1,
      overflowY: "auto",
      overflowX: "hidden",
      padding:
        "20px 2px 0px 20px",
      display: "flex",
      flexDirection: "column",
      background:
        theme.pageBackground,
    },

    analyticsTitle: {
      marginTop: 0,
      marginBottom: 24,
      fontSize: 22,
      fontWeight: 700,
      color: theme.primaryText,
    },

    cards: {
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit, minmax(180px, 1fr))",
      gap: 16,
      marginBottom: 30,
    },

    card: {
      background:
        theme.cardBackground,
      borderRadius: 16,
      padding: 24,
      textAlign: "center",
      transition:
        "background 0.2s ease",
      boxShadow: darkMode
        ? "none"
        : "0 4px 15px rgba(0,0,0,0.08)",
    },

    cardTitle: {
      color: theme.primaryText,
      marginBottom: 18,
      fontWeight: 600,
      fontSize: 16,
    },

    cardValue: {
      color: theme.primaryText,
      margin: 0,
      fontSize: 38,
      fontWeight: 700,
    },

    charts: {
      display: "grid",
      gridTemplateColumns:
        "1fr 1fr",
      gap: 20,
      marginBottom: 20,
    },

    chartBox: {
      background:
        theme.chartBackground,
      borderRadius: 18,
      padding: 20,
      border:
        `1px solid ${theme.border}`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      transition:
        "background 0.2s ease",
    },

    chartTitle: {
      marginTop: 0,
      marginBottom: 16,
      fontSize: 18,
      color: theme.primaryText,
    },

    filterBar: {
      position: "sticky",
      top: 0,
      zIndex: 50,
      background:
        theme.pageBackground,
      paddingBottom: 14,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
      gap: 16,
      flexWrap: "wrap",
    },

    leftFilters: {
      display: "flex",
      alignItems: "center",
      gap: 18,
      flexWrap: "wrap",
    },

    rightButtons: {
      display: "flex",
      alignItems: "center",
      gap: 10,
    },

    checkLabel: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      color: theme.secondaryText,
      fontSize: 14,
    },

    addBtn: {
      background: "#10b981",
      color: "#fff",
      border: "none",
      padding: "8px 14px",
      borderRadius: 10,
      display: "flex",
      alignItems: "center",
      gap: 6,
      cursor: "pointer",
      fontWeight: 600,
      fontSize: 13,
      outline: "none",
    },

    closedBtn: {
      background: "#334155",
      color: "#fff",
      border: "none",
      padding: "8px 14px",
      borderRadius: 10,
      cursor: "pointer",
      fontWeight: 600,
      fontSize: 13,
      outline: "none",
    },
  };

  return (
    <div style={styles.layout}>

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <div style={styles.sidebar}>
        <div>

          {/* LOGO */}
          <div style={styles.logoBox}>
            <div style={styles.logo}>
              <img
                src="/logo.png"
                alt="Company Logo"
                style={styles.logo}
              />
            </div>

            <div>
              <h2 style={styles.brand}>
                Eagle Seeds
              </h2>

              <p style={styles.subBrand}>
                IT COMMAND CENTER
              </p>
            </div>
          </div>

          {/* MENU */}
          <div style={styles.menu}>

            {/* DASHBOARD */}
            <div
              onClick={() =>
                setActivePage(
                  "dashboard"
                )
              }
              style={
                activePage ===
                "dashboard"
                  ? styles.activeMenu
                  : styles.menuItem
              }
            >
              <LayoutDashboard
                size={18}
              />
              Dashboard
            </div>

            {/* ACTIVE TICKETS */}
            <div
              onClick={() =>
                setActivePage(
                  "tickets"
                )
              }
              style={
                activePage ===
                "tickets"
                  ? styles.activeMenu
                  : styles.menuItem
              }
            >
              <Ticket size={18} />
              Active Tickets
            </div>

          </div>
        </div>

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          style={styles.logoutBtn}
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

      {/* =================================================
          MAIN
      ================================================= */}

      <div style={styles.main}>

        {/* HEADER */}
        <div style={styles.header}>

          <div>
            <h1 style={styles.heading}>
              Welcome {userName}
            </h1>
          </div>

          <div
            style={
              styles.headerButtons
            }
          >

            {/* DISPLAY MODE */}
            <button
              style={
                styles.displayModeBtn
              }
              onClick={
                toggleDarkMode
              }
              title={
                darkMode
                  ? "Switch to Light Mode"
                  : "Switch to Dark Mode"
              }
            >
              {darkMode ? (
                <>
                  <Sun size={17} />
                  Light
                </>
              ) : (
                <>
                  <Moon size={17} />
                  Dark
                </>
              )}
            </button>

            {/* CHANGE PASSWORD */}
            <button
              style={
                styles.changePassBtn
              }
              onClick={() =>
                navigate(
                  "/change-password"
                )
              }
            >
              Change Password
            </button>

          </div>
        </div>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div style={styles.content}>

          {/* =================================================
              DASHBOARD
          ================================================= */}

          {activePage ===
            "dashboard" && (
            <>

              {/* TITLE */}
              <h2
                style={
                  styles.analyticsTitle
                }
              >
                Ticket Analytics
                Dashboard
              </h2>

              {/* CARDS */}
              <div style={styles.cards}>

                <Card
                  title="Total Tickets"
                  value={total}
                  color="#6366f1"
                  darkMode={
                    darkMode
                  }
                />

                <Card
                  title="Open"
                  value={open}
                  color="#ef4444"
                  darkMode={
                    darkMode
                  }
                />

                <Card
                  title="In Progress"
                  value={
                    inProgress
                  }
                  color="#f59e0b"
                  darkMode={
                    darkMode
                  }
                />

                <Card
                  title="Resolved"
                  value={resolved}
                  color="#10b981"
                  darkMode={
                    darkMode
                  }
                />

                <Card
                  title="Closed"
                  value={closed}
                  color="#6b7280"
                  darkMode={
                    darkMode
                  }
                />

              </div>

              {/* CHARTS */}
              <div style={styles.charts}>

                {/* PIE CHART */}
                <div
                  style={
                    styles.chartBox
                  }
                >

                  <h3
                    style={
                      styles.chartTitle
                    }
                  >
                    Status Distribution
                  </h3>

                  <PieChart
                    width={320}
                    height={260}
                  >

                    <Pie
                      data={
                        statusData
                      }
                      dataKey="value"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={3}
                      label={(
                        entry: any
                      ) => {

                        const percent =
                          entry?.percent ??
                          0;

                        const value =
                          entry?.value ??
                          0;

                        return `${(
                          percent *
                          100
                        ).toFixed(
                          0
                        )}% (${value})`;
                      }}
                    >

                      <Cell
                        fill="#ef4444"
                      />

                      <Cell
                        fill="#f59e0b"
                      />

                      <Cell
                        fill="#10b981"
                      />

                      <Cell
                        fill="#6b7280"
                      />

                    </Pie>

                    <text
                      x="50%"
                      y="45%"
                      textAnchor="middle"
                      style={{
                        fontSize:
                          "20px",
                        fontWeight:
                          "bold",
                        fill:
                          darkMode
                            ? "#fff"
                            : "#0f172a",
                      }}
                    >
                      {total}
                    </text>

                    <text
                      x="50%"
                      y="60%"
                      textAnchor="middle"
                      style={{
                        fontSize:
                          "12px",
                        fill:
                          darkMode
                            ? "#94a3b8"
                            : "#64748b",
                      }}
                    >
                      Total Tickets
                    </text>

                    <Tooltip />

                  </PieChart>
                </div>

                {/* BAR CHART */}
                <div
                  style={
                    styles.chartBox
                  }
                >

                  <h3
                    style={
                      styles.chartTitle
                    }
                  >
                    Status Comparison
                  </h3>

                  <BarChart
                    width={420}
                    height={260}
                    data={
                      statusData
                    }
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={
                        darkMode
                          ? "#334155"
                          : "#cbd5e1"
                      }
                    />

                    <XAxis
                      dataKey="name"
                      stroke={
                        darkMode
                          ? "#cbd5e1"
                          : "#475569"
                      }
                    />

                    <YAxis
                      stroke={
                        darkMode
                          ? "#cbd5e1"
                          : "#475569"
                      }
                    />

                    <Tooltip />

                    <Legend />

                    <Bar
                      dataKey="value"
                      radius={[
                        8,
                        8,
                        0,
                        0,
                      ]}
                      fill="#6366f1"
                    />

                  </BarChart>
                </div>

              </div>
            </>
          )}

          {/* =================================================
              ACTIVE TICKETS
          ================================================= */}

          {activePage ===
            "tickets" && (
            <>

              {/* FILTER BAR */}
              <div
                style={
                  styles.filterBar
                }
              >

                <div
                  style={
                    styles.leftFilters
                  }
                >

                  {/* OPEN */}
                  <label
                    style={
                      styles.checkLabel
                    }
                  >
                    <input
                      type="checkbox"
                      checked={
                        showOpen
                      }
                      onChange={() =>
                        setShowOpen(
                          !showOpen
                        )
                      }
                    />
                    Open
                  </label>

                  {/* IN PROGRESS */}
                  <label
                    style={
                      styles.checkLabel
                    }
                  >
                    <input
                      type="checkbox"
                      checked={
                        showInProgress
                      }
                      onChange={() =>
                        setShowInProgress(
                          !showInProgress
                        )
                      }
                    />
                    In Progress
                  </label>

                  {/* RESOLVED */}
                  <label
                    style={
                      styles.checkLabel
                    }
                  >
                    <input
                      type="checkbox"
                      checked={
                        showResolved
                      }
                      onChange={() =>
                        setShowResolved(
                          !showResolved
                        )
                      }
                    />
                    Resolved
                  </label>

                  {/* CLOSED */}
                  <label
                    style={
                      styles.checkLabel
                    }
                  >
                    <input
                      type="checkbox"
                      checked={
                        showClosed
                      }
                      onChange={() =>
                        setShowClosed(
                          !showClosed
                        )
                      }
                    />
                    Closed
                  </label>

                </div>

                {/* RIGHT BUTTONS */}
                <div
                  style={
                    styles.rightButtons
                  }
                >

                  {/* CLOSED TICKETS */}
                  <button
                    style={
                      styles.closedBtn
                    }
                    onClick={() =>
                      (window.location.href =
                        "/closed-tickets")
                    }
                  >
                    Closed Tickets
                  </button>

                  {/* ADD TICKET */}
                  <button
                    style={
                      styles.addBtn
                    }
                    onClick={() =>
                      setShowCreate(
                        true
                      )
                    }
                  >
                    <Plus size={14} />
                    Add Ticket
                  </button>

                </div>

              </div>

              {/* TICKET LIST */}
              <TicketList
                tickets={
                  filteredTickets
                }
                onSelect={
                  setSelectedTicket
                }
                darkMode={darkMode}
              />

            </>
          )}

        </div>
      </div>

      {/* =================================================
          TICKET DETAILS
      ================================================= */}

      {selectedTicket && (
        <TicketDetails
          ticket={
            selectedTicket
          }
          isAdmin={false}
          onClose={() =>
            setSelectedTicket(
              null
            )
          }
          onUpdated={
            fetchTickets
          }
        />
      )}

      {/* =================================================
          CREATE TICKET
      ================================================= */}

      {showCreate && (
        <CreateTicketModal
          onClose={() =>
            setShowCreate(
              false
            )
          }
          onSuccess={
            fetchTickets
          }
        />
      )}

    </div>
  );
}

// =====================================================
// CARD COMPONENT
// =====================================================

const Card = ({
  title,
  value,
  color,
  darkMode,
}: any) => (
  <div
    style={{
      background: darkMode
        ? "#000000"
        : "#ffffff",

      borderRadius: 16,

      padding: 24,

      textAlign: "center",

      borderTop: `4px solid ${color}`,

      boxShadow: darkMode
        ? "none"
        : "0 4px 15px rgba(0,0,0,0.08)",

      transition:
        "background 0.2s ease",
    }}
  >

    <p
      style={{
        color: darkMode
          ? "#ffffff"
          : "#334155",

        marginBottom: 18,

        fontWeight: 600,

        fontSize: 16,
      }}
    >
      {title}
    </p>

    <h2
      style={{
        color: darkMode
          ? "#ffffff"
          : "#0f172a",

        margin: 0,

        fontSize: 38,

        fontWeight: 700,
      }}
    >
      {value}
    </h2>

  </div>
);























// final working code before dark mode theme changes
// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { supabase } from "../supabaseClient";

// import {
//   LayoutDashboard,
//   Ticket,
//   Plus,
//   LogOut,
// } from "lucide-react";

// import TicketList from "../components/TicketList";
// import TicketDetails from "../components/TicketDetails";
// import CreateTicketModal from "../components/CreateTicketModal";

// import {
//   PieChart,
//   Pie,
//   Cell,
//   Tooltip,
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Legend,
// } from "recharts";

// export default function UserDashboard() {
//   const navigate = useNavigate();

//   const [tickets, setTickets] = useState<any[]>([]);
//   const [selectedTicket, setSelectedTicket] =
//     useState<any>(null);

//   const [showCreate, setShowCreate] =
//     useState(false);

//   const [activePage, setActivePage] =
//     useState("dashboard");

//   const [userName, setUserName] =
//     useState("");

//   // FILTERS
//   const [showOpen, setShowOpen] =
//     useState(true);

//   const [showInProgress, setShowInProgress] =
//     useState(true);

//   const [showResolved, setShowResolved] =
//     useState(true);

//   const [showClosed, setShowClosed] =
//     useState(true);

//   // NORMALIZE STATUS
//   const normalizeStatus = (val: any) =>
//     val
//       ?.toString()
//       .toLowerCase()
//       .replace("_", " ")
//       .trim();

//   // FETCH TICKETS
//   const fetchTickets = async () => {
//     const { data } = await supabase.auth.getUser();

//     const user = data.user;

//     if (!user) return;

//     // USER NAME
//     const { data: profile } =
//       await supabase
//         .from("users")
//         .select("name")
//         .eq("id", user.id)
//         .single();

//     if (profile?.name) {
//       setUserName(profile.name);
//     }

//     const { data: ticketData, error } =
//       await supabase
//         .from("tickets")
//         .select(`
//           *,
//           ticket_updates (
//             message,
//             created_at
//           )
//         `)
//         .eq("created_by", user.id)
//         .order("created_at", {
//           ascending: false,
//         });

//     if (!error) {
//       setTickets(ticketData || []);
//     }
//   };

//   useEffect(() => {
//     fetchTickets();
//   }, []);

//   // FILTERED TICKETS
//   const filteredTickets = tickets.filter(
//     (t) => {
//       return (
//         (showOpen &&
//           t.status === "Open") ||

//         (showInProgress &&
//           t.status === "In Progress") ||

//         (showResolved &&
//           t.status === "Resolved") ||

//         (showClosed &&
//           t.status === "Closed")
//       );
//     }
//   );

//   // STATUS COUNT
//   const statusCounts: any = {
//     open: 0,
//     "in progress": 0,
//     resolved: 0,
//     closed: 0,
//   };

//   tickets.forEach((t) => {
//     const status = normalizeStatus(
//       t.status
//     );

//     if (
//       statusCounts[status] !== undefined
//     ) {
//       statusCounts[status]++;
//     }
//   });

//   // STATS
//   const total = tickets.length;

//   const open = statusCounts["open"];

//   const inProgress =
//     statusCounts["in progress"];

//   const resolved =
//     statusCounts["resolved"];

//   const closed =
//     statusCounts["closed"];

//   const statusData = [
//     { name: "Open", value: open },
//     {
//       name: "In Progress",
//       value: inProgress,
//     },
//     {
//       name: "Resolved",
//       value: resolved,
//     },
//     { name: "Closed", value: closed },
//   ];

//   // LOGOUT
//   const handleLogout = async () => {
//     await supabase.auth.signOut();

//     window.location.href = "/";
//   };

//   return (
//     <div style={styles.layout}>
//       {/* SIDEBAR */}
//       <div style={styles.sidebar}>
//         <div>
//           {/* LOGO */}
//           <div style={styles.logoBox}>
//             <div style={styles.logo}>
//               <img
//                 src="/logo.png"
//                 alt="Company Logo"
//                 style={styles.logo}
//               />
//             </div>

//             <div>
//               <h2 style={styles.brand}>
//                 Eagle Seeds
//               </h2>

//               <p style={styles.subBrand}>
//                 IT COMMAND CENTER
//               </p>
//             </div>
//           </div>

//           {/* MENU */}
//           <div style={styles.menu}>
//             {/* DASHBOARD */}
//             <div
//               onClick={() =>
//                 setActivePage(
//                   "dashboard"
//                 )
//               }
//               style={
//                 activePage ===
//                 "dashboard"
//                   ? styles.activeMenu
//                   : styles.menuItem
//               }
//             >
//               <LayoutDashboard
//                 size={18}
//               />
//               Dashboard
//             </div>

//             {/* ACTIVE TICKETS */}
//             <div
//               onClick={() =>
//                 setActivePage("tickets")
//               }
//               style={
//                 activePage === "tickets"
//                   ? styles.activeMenu
//                   : styles.menuItem
//               }
//             >
//               <Ticket size={18} />
//               Active Tickets
//             </div>
//           </div>
//         </div>

//         {/* LOGOUT */}
//         <button
//           onClick={handleLogout}
//           style={styles.logoutBtn}
//         >
//           <LogOut size={16} />
//           Logout
//         </button>
//       </div>

//       {/* MAIN */}
//       <div style={styles.main}>
//         {/* HEADER */}
//         <div style={styles.header}>
//           <div>
//             <h1 style={styles.heading}>
//               Welcome {userName}
//             </h1>
//           </div>

//           <button
//             style={styles.changePassBtn}
//             onClick={() =>
//               navigate(
//                 "/change-password"
//               )
//             }
//           >
//             Change Password
//           </button>
//         </div>

//         {/* CONTENT */}
//         <div style={styles.content}>
//           {/* DASHBOARD */}
//           {activePage === "dashboard" && (
//             <>
//               {/* TITLE */}
//               <h2 style={styles.analyticsTitle}>
//                 Ticket Analytics
//                 Dashboard
//               </h2>

//               {/* CARDS */}
//               <div style={styles.cards}>
//                 <Card
//                   title="Total Tickets"
//                   value={total}
//                   color="#6366f1"
//                 />

//                 <Card
//                   title="Open"
//                   value={open}
//                   color="#ef4444"
//                 />

//                 <Card
//                   title="In Progress"
//                   value={inProgress}
//                   color="#f59e0b"
//                 />

//                 <Card
//                   title="Resolved"
//                   value={resolved}
//                   color="#10b981"
//                 />

//                 <Card
//                   title="Closed"
//                   value={closed}
//                   color="#6b7280"
//                 />
//               </div>

//               {/* CHARTS */}
//               <div style={styles.charts}>
//                 {/* PIE CHART */}
//                 <div style={styles.chartBox}>
//                   <h3
//                     style={
//                       styles.chartTitle
//                     }
//                   >
//                     Status Distribution
//                   </h3>

//                   <PieChart
//                     width={320}
//                     height={260}
//                   >
//                     <Pie
//                       data={statusData}
//                       dataKey="value"
//                       innerRadius={70}
//                       outerRadius={100}
//                       paddingAngle={3}
//                       label={(
//                         entry: any
//                       ) => {
//                         const percent =
//                           entry?.percent ?? 0;

//                         const value =
//                           entry?.value ?? 0;

//                         return `${(
//                           percent * 100
//                         ).toFixed(
//                           0
//                         )}% (${value})`;
//                       }}
//                     >
//                       <Cell fill="#ef4444" />
//                       <Cell fill="#f59e0b" />
//                       <Cell fill="#10b981" />
//                       <Cell fill="#6b7280" />
//                     </Pie>

//                     <text
//                       x="50%"
//                       y="45%"
//                       textAnchor="middle"
//                       style={{
//                         fontSize: "20px",
//                         fontWeight:
//                           "bold",
//                         fill: "#fff",
//                       }}
//                     >
//                       {total}
//                     </text>

//                     <text
//                       x="50%"
//                       y="60%"
//                       textAnchor="middle"
//                       style={{
//                         fontSize: "12px",
//                         fill: "#94a3b8",
//                       }}
//                     >
//                       Total Tickets
//                     </text>

//                     <Tooltip />
//                   </PieChart>
//                 </div>

//                 {/* BAR CHART */}
//                 <div style={styles.chartBox}>
//                   <h3
//                     style={
//                       styles.chartTitle
//                     }
//                   >
//                     Status Comparison
//                   </h3>

//                   <BarChart
//                     width={420}
//                     height={260}
//                     data={statusData}
//                   >
//                     <CartesianGrid strokeDasharray="3 3" />

//                     <XAxis dataKey="name" />

//                     <YAxis />

//                     <Tooltip />

//                     <Legend />

//                     <Bar
//                       dataKey="value"
//                       radius={[
//                         8,
//                         8,
//                         0,
//                         0,
//                       ]}
//                       fill="#6366f1"
//                     />
//                   </BarChart>
//                 </div>
//               </div>
//             </>
//           )}

//           {/* ACTIVE TICKETS */}
//           {activePage === "tickets" && (
//             <>
//               {/* FILTER BAR */}
//               <div style={styles.filterBar}>
//                 <div
//                   style={
//                     styles.leftFilters
//                   }
//                 >
//                   <label
//                     style={
//                       styles.checkLabel
//                     }
//                   >
//                     <input
//                       type="checkbox"
//                       checked={showOpen}
//                       onChange={() =>
//                         setShowOpen(
//                           !showOpen
//                         )
//                       }
//                     />
//                     Open
//                   </label>

//                   <label
//                     style={
//                       styles.checkLabel
//                     }
//                   >
//                     <input
//                       type="checkbox"
//                       checked={
//                         showInProgress
//                       }
//                       onChange={() =>
//                         setShowInProgress(
//                           !showInProgress
//                         )
//                       }
//                     />
//                     In Progress
//                   </label>

//                   <label
//                     style={
//                       styles.checkLabel
//                     }
//                   >
//                     <input
//                       type="checkbox"
//                       checked={showResolved}
//                       onChange={() =>
//                         setShowResolved(
//                           !showResolved
//                         )
//                       }
//                     />
//                     Resolved
//                   </label>

//                   <label
//                     style={
//                       styles.checkLabel
//                     }
//                   >
//                     <input
//                       type="checkbox"
//                       checked={showClosed}
//                       onChange={() =>
//                         setShowClosed(
//                           !showClosed
//                         )
//                       }
//                     />
//                     Closed
//                   </label>
//                 </div>

//                 <div
//                   style={
//                     styles.rightButtons
//                   }
//                 >
//                   <button
//                     style={
//                       styles.closedBtn
//                     }
//                     onClick={() =>
//                       (window.location.href =
//                         "/closed-tickets")
//                     }
//                   >
//                     Closed Tickets
//                   </button>

//                   <button
//                     style={styles.addBtn}
//                     onClick={() =>
//                       setShowCreate(true)
//                     }
//                   >
//                     <Plus size={14} />
//                     Add Ticket
//                   </button>
//                 </div>
//               </div>

//               <TicketList
//                 tickets={
//                   filteredTickets
//                 }
//                 onSelect={
//                   setSelectedTicket
//                 }
//               />
//             </>
//           )}
//         </div>
//       </div>

//       {/* DETAILS */}
//       {selectedTicket && (
//         <TicketDetails
//           ticket={selectedTicket}
//           isAdmin={false}
//           onClose={() =>
//             setSelectedTicket(null)
//           }
//           onUpdated={fetchTickets}
//         />
//       )}

//       {/* CREATE */}
//       {showCreate && (
//         <CreateTicketModal
//           onClose={() =>
//             setShowCreate(false)
//           }
//           onSuccess={fetchTickets}
//         />
//       )}
//     </div>
//   );
// }

// // CARD
// const Card = ({
//   title,
//   value,
//   color,
// }: any) => (
//   <div
//     style={{
//       ...styles.card,
//       borderTop: `4px solid ${color}`,
//     }}
//   >
//     <p style={styles.cardTitle}>
//       {title}
//     </p>

//     <h2 style={styles.cardValue}>
//       {value}
//     </h2>
//   </div>
// );

// // STYLES
// const styles: any = {
//   layout: {
//     display: "flex",
//     height: "100vh",
//     overflow: "hidden",
//     background: "#0f172a",
//     color: "#fff",
//     fontFamily: "Inter, sans-serif",
//   },

//   sidebar: {
//     width: 250,
//     background: "#111827",
//     padding: 12,
//     position: "fixed",
//     top: 0,
//     left: 0,
//     bottom: 0,
//     borderRight:
//       "1px solid rgba(255,255,255,0.06)",
//     zIndex: 100,
//     display: "flex",
//     flexDirection: "column",
//     justifyContent: "space-between",
//   },

//   logoBox: {
//     display: "flex",
//     alignItems: "center",
//     gap: 14,
//     marginBottom: 40,
//     paddingTop: 10,
//   },

//   logo: {
//     width: 50,
//     height: 50,
//     borderRadius: 14,
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   brand: {
//     margin: 0,
//     fontSize: 18,
//   },

//   subBrand: {
//     margin: 0,
//     color: "#94a3b8",
//     fontSize: 11,
//   },

//   menu: {
//     display: "flex",
//     flexDirection: "column",
//     gap: 10,
//   },

//   activeMenu: {
//     display: "flex",
//     alignItems: "center",
//     gap: 10,
//     padding: "14px 18px",
//     borderRadius: 12,
//     background:
//       "rgba(16,185,129,0.15)",
//     color: "#10b981",
//     cursor: "pointer",
//     fontWeight: 600,
//   },

//   menuItem: {
//     display: "flex",
//     alignItems: "center",
//     gap: 10,
//     padding: "14px 18px",
//     borderRadius: 12,
//     color: "#cbd5e1",
//     cursor: "pointer",
//   },

//   logoutBtn: {
//     width: "100%",
//     border: "none",
//     background: "#ef4444",
//     color: "#fff",
//     padding: "12px",
//     borderRadius: 12,
//     cursor: "pointer",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 8,
//     fontWeight: 600,
//     marginBottom: 10,
//   },

//   main: {
//     marginLeft: "250px",
//     width: "calc(100% - 250px)",
//     height: "100vh",
//     overflow: "hidden",
//     display: "flex",
//     flexDirection: "column",
//   },

//   header: {
//     position: "sticky",
//     top: 0,
//     zIndex: 90,
//     background: "#0f172a",
//     padding: "18px 26px",
//     borderBottom:
//       "1px solid rgba(255,255,255,0.06)",
//     flexShrink: 0,
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "space-between",
//   },

//   heading: {
//     margin: 0,
//     fontSize: 28,
//     fontWeight: 700,
//   },

//   changePassBtn: {
//     background:
//       "linear-gradient(135deg,#2563eb,#4f46e5)",
//     color: "#fff",
//     border: "none",
//     padding: "10px 16px",
//     borderRadius: 12,
//     cursor: "pointer",
//     fontWeight: 600,
//     fontSize: 13,
//     outline: "none",
//     boxShadow:
//       "0 8px 20px rgba(37,99,235,0.30)",
//   },

//   content: {
//     flex: 1,
//     overflowY: "auto",
//     overflowX: "hidden",
//     padding: "20px 2px 0px 20px",
//     display: "flex",
//     flexDirection: "column",
//   },

//   analyticsTitle: {
//     marginTop: 0,
//     marginBottom: 24,
//     fontSize: 22,
//     fontWeight: 700,
//   },

//   cards: {
//     display: "grid",
//     gridTemplateColumns:
//       "repeat(auto-fit, minmax(180px, 1fr))",
//     gap: 16,
//     marginBottom: 30,
//   },

//   card: {
//     background: "#000",
//     borderRadius: 16,
//     padding: 24,
//     textAlign: "center",
//   },

//   cardTitle: {
//     color: "#fff",
//     marginBottom: 18,
//     fontWeight: 600,
//     fontSize: 16,
//   },

//   cardValue: {
//     color: "#fff",
//     margin: 0,
//     fontSize: 38,
//     fontWeight: 700,
//   },

//   charts: {
//     display: "grid",
//     gridTemplateColumns: "1fr 1fr",
//     gap: 20,
//     marginBottom: 20,
//   },

//   chartBox: {
//     background: "#111827",
//     borderRadius: 18,
//     padding: 20,
//     border:
//       "1px solid rgba(255,255,255,0.06)",
//     display: "flex",
//     flexDirection: "column",
//     alignItems: "center",
//   },

//   chartTitle: {
//     marginTop: 0,
//     marginBottom: 16,
//     fontSize: 18,
//     color: "#fff",
//   },

//   filterBar: {
//     position: "sticky",
//     top: 0,
//     zIndex: 50,
//     background: "#0f172a",
//     paddingBottom: 14,
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 14,
//     gap: 16,
//     flexWrap: "wrap",
//   },

//   leftFilters: {
//     display: "flex",
//     alignItems: "center",
//     gap: 18,
//     flexWrap: "wrap",
//   },

//   rightButtons: {
//     display: "flex",
//     alignItems: "center",
//     gap: 10,
//   },

//   checkLabel: {
//     display: "flex",
//     alignItems: "center",
//     gap: 8,
//     color: "#e2e8f0",
//     fontSize: 14,
//   },

//   addBtn: {
//     background: "#10b981",
//     color: "#fff",
//     border: "none",
//     padding: "8px 14px",
//     borderRadius: 10,
//     display: "flex",
//     alignItems: "center",
//     gap: 6,
//     cursor: "pointer",
//     fontWeight: 600,
//     fontSize: 13,
//     outline: "none",
//   },

//   closedBtn: {
//     background: "#334155",
//     color: "#fff",
//     border: "none",
//     padding: "8px 14px",
//     borderRadius: 10,
//     cursor: "pointer",
//     fontWeight: 600,
//     fontSize: 13,
//     outline: "none",
//   },
// };


