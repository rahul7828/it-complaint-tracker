import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

import {
  LayoutDashboard,
  Ticket,
  Users,
  LogOut,
  Bell,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import TicketList from "../components/TicketList";
import TicketDetails from "../components/TicketDetails";

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

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] =
    useState<any>(null);

  // ACTIVE PAGE PERSIST
  const [activePage, setActivePage] =
    useState(
      localStorage.getItem(
        "adminActivePage"
      ) || "dashboard"
    );

  const [userName, setUserName] =
    useState("");

  const [notificationCount, setNotificationCount] =
    useState(0);

  // STATUS FILTERS PERSIST
  const [showOpen, setShowOpen] =
    useState(
      JSON.parse(
        localStorage.getItem("showOpen") ??
          "true"
      )
    );

  const [showInProgress, setShowInProgress] =
    useState(
      JSON.parse(
        localStorage.getItem(
          "showInProgress"
        ) ?? "true"
      )
    );

  const [showResolved, setShowResolved] =
    useState(
      JSON.parse(
        localStorage.getItem(
          "showResolved"
        ) ?? "true"
      )
    );

  const [showClosed, setShowClosed] =
    useState(
      JSON.parse(
        localStorage.getItem(
          "showClosed"
        ) ?? "true"
      )
    );

  // DATE FILTERS PERSIST
  const [fromDate, setFromDate] =
    useState(
      localStorage.getItem("fromDate") ||
        ""
    );

  const [toDate, setToDate] =
    useState(
      localStorage.getItem("toDate") || ""
    );

  // FILTER BOX COLLAPSE
  const [showDateFilter, setShowDateFilter] =
    useState(
      JSON.parse(
        localStorage.getItem(
          "showDateFilter"
        ) ?? "true"
      )
    );

  // SAVE FILTERS
  useEffect(() => {
    localStorage.setItem(
      "adminActivePage",
      activePage
    );
  }, [activePage]);

  useEffect(() => {
    localStorage.setItem(
      "showOpen",
      JSON.stringify(showOpen)
    );
  }, [showOpen]);

  useEffect(() => {
    localStorage.setItem(
      "showInProgress",
      JSON.stringify(showInProgress)
    );
  }, [showInProgress]);

  useEffect(() => {
    localStorage.setItem(
      "showResolved",
      JSON.stringify(showResolved)
    );
  }, [showResolved]);

  useEffect(() => {
    localStorage.setItem(
      "showClosed",
      JSON.stringify(showClosed)
    );
  }, [showClosed]);

  useEffect(() => {
    localStorage.setItem(
      "fromDate",
      fromDate
    );
  }, [fromDate]);

  useEffect(() => {
    localStorage.setItem(
      "toDate",
      toDate
    );
  }, [toDate]);

  useEffect(() => {
    localStorage.setItem(
      "showDateFilter",
      JSON.stringify(showDateFilter)
    );
  }, [showDateFilter]);

  // NORMALIZE
  const normalizeStatus = (val: any) =>
    val
      ?.toString()
      .toLowerCase()
      .replace("_", " ")
      .trim();

  // FETCH

  // FETCH
  const fetchTickets = async () => {
    // USER
    const { data: authData } =
      await supabase.auth.getUser();

    const user = authData.user;

    if (user) {
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
    }


  // const fetchTickets = async () => {
  //   const { data: authData } =
  //     await supabase.auth.getUser();

  //   const user = authData.user;

  //   if (user) {
  //     const { data: profile, error } =
  //       await supabase
  //         .from("users")
  //         .select("name,email")
  //         .eq("id", user.id)
  //         .maybeSingle();

  //     if (profile?.name) {
  //       setUserName(profile.name);
  //     } else if (profile?.email) {
  //       setUserName(profile.email);
  //     } else {
  //       setUserName("Admin");
  //     }
  //   }

    const { data } = await supabase
      .from("tickets")
      .select(
        `*, ticket_updates (message, created_at)`
      )
      .order("created_at", {
        ascending: false,
      });

    setTickets(data || []);
  };

  useEffect(() => {
    fetchTickets();

    const channel = supabase
      .channel("admin-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tickets",
        },
        () => {
          fetchTickets();

          setNotificationCount(
            (prev) => prev + 1
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // FILTERED TICKETS
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const statusMatch =
        (showOpen &&
          t.status === "Open") ||
        (showInProgress &&
          t.status ===
            "In Progress") ||
        (showResolved &&
          t.status === "Resolved") ||
        (showClosed &&
          t.status === "Closed");

      const ticketDate = t.created_at
        ? new Date(t.created_at)
        : null;

      let fromMatch = true;
      let toMatch = true;

      if (fromDate && ticketDate) {
        fromMatch =
          ticketDate >=
          new Date(fromDate);
      }

      if (toDate && ticketDate) {
        const endDate = new Date(toDate);

        endDate.setHours(
          23,
          59,
          59,
          999
        );

        toMatch =
          ticketDate <= endDate;
      }

      return (
        statusMatch &&
        fromMatch &&
        toMatch
      );
    });
  }, [
    tickets,
    showOpen,
    showInProgress,
    showResolved,
    showClosed,
    fromDate,
    toDate,
  ]);

  // STATUS COUNT
  const statusCounts: any = {
    open: 0,
    "in progress": 0,
    resolved: 0,
    closed: 0,
  };

  filteredTickets.forEach((t) => {
    const status = normalizeStatus(
      t.status
    );

    if (
      statusCounts[status] !== undefined
    ) {
      statusCounts[status]++;
    }
  });

  const total = filteredTickets.length;

  const open = statusCounts["open"];

  const inProgress =
    statusCounts["in progress"];

  const resolved =
    statusCounts["resolved"];

  const closed =
    statusCounts["closed"];

  const statusData = [
    { name: "Open", value: open },
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

  // LOGOUT
  const handleLogout = async () => {
    await supabase.auth.signOut();

    window.location.href = "/";
  };

  return (
    <div style={styles.layout}>
      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <div>
          {/* LOGO */}
          <div style={styles.logoBox}>
            <img
              src="/logo.png"
              alt="logo"
              style={styles.logo}
            />

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
              <LayoutDashboard size={18} />
              Dashboard
            </div>

            <div
              onClick={() =>
                setActivePage("tickets")
              }
              style={
                activePage ===
                "tickets"
                  ? styles.activeMenu
                  : styles.menuItem
              }
            >
              <Ticket size={18} />
              All Tickets
            </div>
          </div>

          {/* DATE FILTER */}
          <div style={styles.filterSection}>
            <div
              style={styles.filterHeader}
              onClick={() =>
                setShowDateFilter(
                  !showDateFilter
                )
              }
            >
              <span>
                Filter By Date
              </span>

              {showDateFilter ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </div>

            {showDateFilter && (
              <div
                style={
                  styles.filterContent
                }
              >
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) =>
                    setFromDate(
                      e.target.value
                    )
                  }
                  style={
                    styles.dateInput
                  }
                />

                <input
                  type="date"
                  value={toDate}
                  onChange={(e) =>
                    setToDate(
                      e.target.value
                    )
                  }
                  style={
                    styles.dateInput
                  }
                />

                <button
                  style={
                    styles.clearBtn
                  }
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                  }}
                >
                  Clear Filter
                </button>
              </div>
            )}
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

      {/* MAIN */}
      <div style={styles.main}>
        {/* HEADER */}
        <div style={styles.header}>
          <h1 style={styles.heading}>
            Welcome {userName}
          </h1>

          <div style={styles.headerRight}>
            <div
              style={styles.bellBox}
            >
              <Bell size={20} />

              {notificationCount >
                0 && (
                <span
                  style={
                    styles.badge
                  }
                >
                  {
                    notificationCount
                  }
                </span>
              )}
            </div>

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

        {/* CONTENT */}
        <div style={styles.content}>
          {/* DASHBOARD */}
          {activePage ===
            "dashboard" && (
            <>
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
                />

                <Card
                  title="Open"
                  value={open}
                  color="#ef4444"
                />

                <Card
                  title="In Progress"
                  value={
                    inProgress
                  }
                  color="#f59e0b"
                />

                <Card
                  title="Resolved"
                  value={resolved}
                  color="#10b981"
                />

                <Card
                  title="Closed"
                  value={closed}
                  color="#6b7280"
                />
              </div>

              {/* CHARTS */}
              <div style={styles.charts}>
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
                    Status
                    Distribution
                  </h3>

                  <PieChart
                    width={350}
                    height={320}
                  >
                    <Pie
                      data={statusData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      label={({
                        percent,
                        value,
                      }: any) =>
                        `${(
                          percent *
                          100
                        ).toFixed(
                          0
                        )}% (${value})`
                      }
                    >
                      <Cell fill="#ef4444" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#10b981" />
                      <Cell fill="#6b7280" />
                    </Pie>

                    <Tooltip />
                  </PieChart>
                </div>

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
                    Status
                    Comparison
                  </h3>

                  <BarChart
                    width={420}
                    height={260}
                    data={statusData}
                  >
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="name" />

                    <YAxis />

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

          {/* TICKETS */}
          {activePage ===
            "tickets" && (
            <>
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

                <div
                  style={
                    styles.rightButtons
                  }
                >
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

                  <button
                    style={
                      styles.userBtn
                    }
                    onClick={() =>
                      (window.location.href =
                        "/users")
                    }
                  >
                    <Users size={16} />
                    Manage Users
                  </button>
                </div>
              </div>

              <TicketList
                tickets={
                  filteredTickets
                }
                onSelect={
                  setSelectedTicket
                }
              />
            </>
          )}
        </div>
      </div>

      {/* DETAILS */}
      {selectedTicket && (
        <TicketDetails
          ticket={selectedTicket}
          isAdmin={true}
          onClose={() =>
            setSelectedTicket(null)
          }
          onUpdated={fetchTickets}
        />
      )}
    </div>
  );
};

// CARD
const Card = ({
  title,
  value,
  color,
}: any) => (
  <div
    style={{
      ...styles.card,
      borderTop: `4px solid ${color}`,
    }}
  >
    <p style={styles.cardTitle}>
      {title}
    </p>

    <h2 style={styles.cardValue}>
      {value}
    </h2>
  </div>
);

// STYLES
const styles: any = {
  layout: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
    background: "#0f172a",
    color: "#fff",
    fontFamily:
      "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },

  sidebar: {
    width: 250,
    background: "#111827",
    padding: 12,
    position: "fixed",
    top: 0,
    left: 0,
    bottom: 0,
    borderRight:
      "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },

  logoBox: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 40,
    paddingTop: 10,
  },

  logo: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },

  brand: {
    margin: 0,
    fontSize: 18,
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
    color: "#cbd5e1",
    cursor: "pointer",
  },

  filterSection: {
    marginTop: 24,
    background: "#1e293b",
    borderRadius: 12,
    padding: 10,
    border:
      "1px solid rgba(255,255,255,0.06)",
  },

  filterHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  },

  filterContent: {
    marginTop: 12,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  dateInput: {
    width: "100%",
    boxSizing: "border-box",
    background: "#0f172a",
    color: "#fff",
    border: "1px solid #334155",
    padding: "8px 10px",
    borderRadius: 8,
    outline: "none",
    fontSize: 12,
  },

  clearBtn: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    padding: "9px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 12,
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
  },

  main: {
    marginLeft: 250,
    width: "calc(100% - 250px)",
    display: "flex",
    flexDirection: "column",
  },

  header: {
    background: "#0f172a",
    padding: "18px 26px",
    borderBottom:
      "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  heading: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
  },

  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },

  bellBox: {
    position: "relative",
    width: 42,
    height: 42,
    borderRadius: "50%",
    background: "#111827",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: "50%",
    background: "#ef4444",
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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
  },

  content: {
    flex: 1,
    overflowY: "auto",
    padding: 20,
  },

  analyticsTitle: {
    marginTop: 0,
    marginBottom: 24,
    fontSize: 22,
    fontWeight: 700,
  },

  cards: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 16,
    marginBottom: 30,
  },

  card: {
    background: "#000",
    borderRadius: 16,
    padding: 24,
    textAlign: "center",
  },

  cardTitle: {
    marginBottom: 18,
    fontWeight: 600,
    fontSize: 16,
  },

  cardValue: {
    margin: 0,
    fontSize: 38,
    fontWeight: 700,
  },

  charts: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
  },

  chartBox: {
    background: "#111827",
    borderRadius: 18,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

  chartTitle: {
    marginTop: 0,
    marginBottom: 16,
    fontSize: 18,
  },

  filterBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 16,
  },

  leftFilters: {
    display: "flex",
    gap: 18,
    flexWrap: "wrap",
  },

  rightButtons: {
    display: "flex",
    gap: 10,
  },

  checkLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  closedBtn: {
    background: "#334155",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600,
  },

  userBtn: {
    background: "#10b981",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: 10,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 600,
  },
};

































// import { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { supabase } from "../supabaseClient";

// import {
//   LayoutDashboard,
//   Ticket,
//   Users,
//   LogOut,
//   Bell,
//   ChevronDown,
//   ChevronUp,
// } from "lucide-react";

// import TicketList from "../components/TicketList";
// import TicketDetails from "../components/TicketDetails";

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

// export default function AdminDashboard() {
//   const navigate = useNavigate();

//   const [tickets, setTickets] = useState<any[]>([]);
//   const [selectedTicket, setSelectedTicket] =
//     useState<any>(null);

//   // ACTIVE PAGE PERSIST
//   const [activePage, setActivePage] =
//     useState(
//       localStorage.getItem(
//         "adminActivePage"
//       ) || "dashboard"
//     );

//   const [userName, setUserName] =
//     useState("");

//   const [notificationCount, setNotificationCount] =
//     useState(0);

//   // STATUS FILTERS PERSIST
//   const [showOpen, setShowOpen] =
//     useState(
//       JSON.parse(
//         localStorage.getItem("showOpen") ??
//           "true"
//       )
//     );

//   const [showInProgress, setShowInProgress] =
//     useState(
//       JSON.parse(
//         localStorage.getItem(
//           "showInProgress"
//         ) ?? "true"
//       )
//     );

//   const [showResolved, setShowResolved] =
//     useState(
//       JSON.parse(
//         localStorage.getItem(
//           "showResolved"
//         ) ?? "true"
//       )
//     );

//   const [showClosed, setShowClosed] =
//     useState(
//       JSON.parse(
//         localStorage.getItem(
//           "showClosed"
//         ) ?? "true"
//       )
//     );

//   // DATE FILTERS PERSIST
//   const [fromDate, setFromDate] =
//     useState(
//       localStorage.getItem("fromDate") ||
//         ""
//     );

//   const [toDate, setToDate] =
//     useState(
//       localStorage.getItem("toDate") || ""
//     );

//   // FILTER BOX COLLAPSE
//   const [showDateFilter, setShowDateFilter] =
//     useState(
//       JSON.parse(
//         localStorage.getItem(
//           "showDateFilter"
//         ) ?? "true"
//       )
//     );

//   // SAVE FILTERS
//   useEffect(() => {
//     localStorage.setItem(
//       "adminActivePage",
//       activePage
//     );
//   }, [activePage]);

//   useEffect(() => {
//     localStorage.setItem(
//       "showOpen",
//       JSON.stringify(showOpen)
//     );
//   }, [showOpen]);

//   useEffect(() => {
//     localStorage.setItem(
//       "showInProgress",
//       JSON.stringify(showInProgress)
//     );
//   }, [showInProgress]);

//   useEffect(() => {
//     localStorage.setItem(
//       "showResolved",
//       JSON.stringify(showResolved)
//     );
//   }, [showResolved]);

//   useEffect(() => {
//     localStorage.setItem(
//       "showClosed",
//       JSON.stringify(showClosed)
//     );
//   }, [showClosed]);

//   useEffect(() => {
//     localStorage.setItem(
//       "fromDate",
//       fromDate
//     );
//   }, [fromDate]);

//   useEffect(() => {
//     localStorage.setItem(
//       "toDate",
//       toDate
//     );
//   }, [toDate]);

//   useEffect(() => {
//     localStorage.setItem(
//       "showDateFilter",
//       JSON.stringify(showDateFilter)
//     );
//   }, [showDateFilter]);

//   // NORMALIZE
//   const normalizeStatus = (val: any) =>
//     val
//       ?.toString()
//       .toLowerCase()
//       .replace("_", " ")
//       .trim();

//   // FETCH
//   const fetchTickets = async () => {
//     const { data: authData } =
//       await supabase.auth.getUser();

//     const user = authData.user;

//     if (user) {
//       const { data: profile } =
//         await supabase
//           .from("users")
//           .select("name")
//           .eq("id", user.id)
//           .single();

//       if (profile?.name) {
//         setUserName(profile.name);
//       }
//     }

//     const { data } = await supabase
//       .from("tickets")
//       .select(
//         `*, ticket_updates (message, created_at)`
//       )
//       .order("created_at", {
//         ascending: false,
//       });

//     setTickets(data || []);
//   };

//   useEffect(() => {
//     fetchTickets();

//     const channel = supabase
//       .channel("admin-realtime")
//       .on(
//         "postgres_changes",
//         {
//           event: "INSERT",
//           schema: "public",
//           table: "tickets",
//         },
//         () => {
//           fetchTickets();

//           setNotificationCount(
//             (prev) => prev + 1
//           );
//         }
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, []);

//   // FILTERED TICKETS
//   const filteredTickets = useMemo(() => {
//     return tickets.filter((t) => {
//       const statusMatch =
//         (showOpen &&
//           t.status === "Open") ||
//         (showInProgress &&
//           t.status ===
//             "In Progress") ||
//         (showResolved &&
//           t.status === "Resolved") ||
//         (showClosed &&
//           t.status === "Closed");

//       const ticketDate = t.created_at
//         ? new Date(t.created_at)
//         : null;

//       let fromMatch = true;
//       let toMatch = true;

//       if (fromDate && ticketDate) {
//         fromMatch =
//           ticketDate >=
//           new Date(fromDate);
//       }

//       if (toDate && ticketDate) {
//         const endDate = new Date(toDate);

//         endDate.setHours(
//           23,
//           59,
//           59,
//           999
//         );

//         toMatch =
//           ticketDate <= endDate;
//       }

//       return (
//         statusMatch &&
//         fromMatch &&
//         toMatch
//       );
//     });
//   }, [
//     tickets,
//     showOpen,
//     showInProgress,
//     showResolved,
//     showClosed,
//     fromDate,
//     toDate,
//   ]);

//   // STATUS COUNT
//   const statusCounts: any = {
//     open: 0,
//     "in progress": 0,
//     resolved: 0,
//     closed: 0,
//   };

//   filteredTickets.forEach((t) => {
//     const status = normalizeStatus(
//       t.status
//     );

//     if (
//       statusCounts[status] !== undefined
//     ) {
//       statusCounts[status]++;
//     }
//   });

//   const total = filteredTickets.length;

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
//     {
//       name: "Closed",
//       value: closed,
//     },
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
//             <img
//               src="/logo.png"
//               alt="logo"
//               style={styles.logo}
//             />

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
//               <LayoutDashboard size={18} />
//               Dashboard
//             </div>

//             <div
//               onClick={() =>
//                 setActivePage("tickets")
//               }
//               style={
//                 activePage ===
//                 "tickets"
//                   ? styles.activeMenu
//                   : styles.menuItem
//               }
//             >
//               <Ticket size={18} />
//               All Tickets
//             </div>
//           </div>

//           {/* DATE FILTER */}
//           <div style={styles.filterSection}>
//             <div
//               style={styles.filterHeader}
//               onClick={() =>
//                 setShowDateFilter(
//                   !showDateFilter
//                 )
//               }
//             >
//               <span>
//                 Filter By Date
//               </span>

//               {showDateFilter ? (
//                 <ChevronUp size={16} />
//               ) : (
//                 <ChevronDown size={16} />
//               )}
//             </div>

//             {showDateFilter && (
//               <div
//                 style={
//                   styles.filterContent
//                 }
//               >
//                 <input
//                   type="date"
//                   value={fromDate}
//                   onChange={(e) =>
//                     setFromDate(
//                       e.target.value
//                     )
//                   }
//                   style={
//                     styles.dateInput
//                   }
//                 />

//                 <input
//                   type="date"
//                   value={toDate}
//                   onChange={(e) =>
//                     setToDate(
//                       e.target.value
//                     )
//                   }
//                   style={
//                     styles.dateInput
//                   }
//                 />

//                 <button
//                   style={
//                     styles.clearBtn
//                   }
//                   onClick={() => {
//                     setFromDate("");
//                     setToDate("");
//                   }}
//                 >
//                   Clear Filter
//                 </button>
//               </div>
//             )}
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
//           <h1 style={styles.heading}>
//             Welcome {userName}
//           </h1>

//           <div style={styles.headerRight}>
//             <div
//               style={styles.bellBox}
//             >
//               <Bell size={20} />

//               {notificationCount >
//                 0 && (
//                 <span
//                   style={
//                     styles.badge
//                   }
//                 >
//                   {
//                     notificationCount
//                   }
//                 </span>
//               )}
//             </div>

//             <button
//               style={
//                 styles.changePassBtn
//               }
//               onClick={() =>
//                 navigate(
//                   "/change-password"
//                 )
//               }
//             >
//               Change Password
//             </button>
//           </div>
//         </div>

//         {/* CONTENT */}
//         <div style={styles.content}>
//           {/* DASHBOARD */}
//           {activePage ===
//             "dashboard" && (
//             <>
//               <h2
//                 style={
//                   styles.analyticsTitle
//                 }
//               >
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
//                   value={
//                     inProgress
//                   }
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
//                 {/* PIE */}
//                 <div
//                   style={
//                     styles.chartBox
//                   }
//                 >
//                   <h3
//                     style={
//                       styles.chartTitle
//                     }
//                   >
//                     Status
//                     Distribution
//                   </h3>

//                   <PieChart
//                     width={350}
//                     height={320}
//                   >
//                     <Pie
//                       data={statusData}
//                       dataKey="value"
//                       cx="50%"
//                       cy="50%"
//                       innerRadius={70}
//                       outerRadius={100}
//                       label={({
//                         percent,
//                         value,
//                       }: any) =>
//                         `${(
//                           percent *
//                           100
//                         ).toFixed(
//                           0
//                         )}% (${value})`
//                       }
//                     >
//                       <Cell fill="#ef4444" />
//                       <Cell fill="#f59e0b" />
//                       <Cell fill="#10b981" />
//                       <Cell fill="#6b7280" />
//                     </Pie>

//                     <Tooltip />
//                   </PieChart>
//                 </div>

//                 {/* BAR */}
//                 <div
//                   style={
//                     styles.chartBox
//                   }
//                 >
//                   <h3
//                     style={
//                       styles.chartTitle
//                     }
//                   >
//                     Status
//                     Comparison
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

//           {/* TICKETS */}
//           {activePage ===
//             "tickets" && (
//             <>
//               <div
//                 style={
//                   styles.filterBar
//                 }
//               >
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
//                       checked={
//                         showOpen
//                       }
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
//                       checked={
//                         showResolved
//                       }
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
//                       checked={
//                         showClosed
//                       }
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
//                     style={
//                       styles.userBtn
//                     }
//                     onClick={() =>
//                       (window.location.href =
//                         "/users")
//                     }
//                   >
//                     <Users size={16} />
//                     Manage Users
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
//           isAdmin={true}
//           onClose={() =>
//             setSelectedTicket(null)
//           }
//           onUpdated={fetchTickets}
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
//     fontFamily:
//     "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
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
//     display: "flex",
//     flexDirection: "column",
//     justifyContent: "space-between",
//   },

//   logoBox: {
//     display: "flex",
//     alignItems: "center",
//     gap: 12,
//     marginBottom: 40,
//     paddingTop: 10,
//   },

//   logo: {
//     width: 50,
//     height: 50,
//     borderRadius: 12,
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

//   filterSection: {
//     marginTop: 24,
//     background: "#1e293b",
//     borderRadius: 12,
//     padding: 10,
//     border:
//       "1px solid rgba(255,255,255,0.06)",
//   },

//   filterHeader: {
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "space-between",
//     cursor: "pointer",
//     fontWeight: 600,
//     fontSize: 14,
//   },

//   filterContent: {
//     marginTop: 12,
//     display: "flex",
//     flexDirection: "column",
//     gap: 10,
//   },

//   dateInput: {
//     width: "100%",
//     boxSizing: "border-box",
//     background: "#0f172a",
//     color: "#fff",
//     border: "1px solid #334155",
//     padding: "8px 10px",
//     borderRadius: 8,
//     outline: "none",
//     fontSize: 12,
//   },

//   clearBtn: {
//     background: "#ef4444",
//     color: "#fff",
//     border: "none",
//     padding: "9px",
//     borderRadius: 8,
//     cursor: "pointer",
//     fontWeight: 600,
//     fontSize: 12,
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
//   },

//   main: {
//     marginLeft: 250,
//     width: "calc(100% - 250px)",
//     display: "flex",
//     flexDirection: "column",
//   },

//   header: {
//     background: "#0f172a",
//     padding: "18px 26px",
//     borderBottom:
//       "1px solid rgba(255,255,255,0.06)",
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },

//   heading: {
//     margin: 0,
//     fontSize: 28,
//     fontWeight: 700,
//   },

//   headerRight: {
//     display: "flex",
//     alignItems: "center",
//     gap: 16,
//   },

//   bellBox: {
//     position: "relative",
//     width: 42,
//     height: 42,
//     borderRadius: "50%",
//     background: "#111827",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   badge: {
//     position: "absolute",
//     top: -4,
//     right: -4,
//     minWidth: 20,
//     height: 20,
//     borderRadius: "50%",
//     background: "#ef4444",
//     color: "#fff",
//     fontSize: 11,
//     fontWeight: 700,
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
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
//   },

//   content: {
//     flex: 1,
//     overflowY: "auto",
//     padding: 20,
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
//     marginBottom: 18,
//     fontWeight: 600,
//     fontSize: 16,
//   },

//   cardValue: {
//     margin: 0,
//     fontSize: 38,
//     fontWeight: 700,
//   },

//   charts: {
//     display: "grid",
//     gridTemplateColumns: "1fr 1fr",
//     gap: 20,
//   },

//   chartBox: {
//     background: "#111827",
//     borderRadius: 18,
//     padding: 20,
//     display: "flex",
//     flexDirection: "column",
//     alignItems: "center",
//   },

//   chartTitle: {
//     marginTop: 0,
//     marginBottom: 16,
//     fontSize: 18,
//   },

//   filterBar: {
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 16,
//     flexWrap: "wrap",
//     gap: 16,
//   },

//   leftFilters: {
//     display: "flex",
//     gap: 18,
//     flexWrap: "wrap",
//   },

//   rightButtons: {
//     display: "flex",
//     gap: 10,
//   },

//   checkLabel: {
//     display: "flex",
//     alignItems: "center",
//     gap: 8,
//   },

//   closedBtn: {
//     background: "#334155",
//     color: "#fff",
//     border: "none",
//     padding: "10px 16px",
//     borderRadius: 10,
//     cursor: "pointer",
//     fontWeight: 600,
//   },

//   userBtn: {
//     background: "#10b981",
//     color: "#fff",
//     border: "none",
//     padding: "10px 16px",
//     borderRadius: 10,
//     cursor: "pointer",
//     display: "flex",
//     alignItems: "center",
//     gap: 8,
//     fontWeight: 600,
//   },
// };





























// fianl working code afte go live and before dashboard date filter
// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { supabase } from "../supabaseClient";

// import {
//   LayoutDashboard,
//   Ticket,
//   Users,
//   LogOut,
//   Bell,
// } from "lucide-react";

// import TicketList from "../components/TicketList";
// import TicketDetails from "../components/TicketDetails";

// import {
//   PieChart,
//   Pie,
//  Cell,
//   Tooltip,
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Legend,
// } from "recharts";

// export default function AdminDashboard() {
//   const navigate = useNavigate();

//   const [tickets, setTickets] = useState<any[]>([]);
//   const [selectedTicket, setSelectedTicket] =
//     useState<any>(null);

//   const [activePage, setActivePage] =
//     useState("dashboard");

//   const [userName, setUserName] =
//     useState("");

//   const [notificationCount, setNotificationCount] =
//     useState(0);

//   // FILTERS
//   const [showOpen, setShowOpen] =
//     useState(true);

//   const [showInProgress, setShowInProgress] =
//     useState(true);

//   const [showResolved, setShowResolved] =
//     useState(true);

//   const [showClosed, setShowClosed] =
//     useState(true);

//   // NORMALIZE
//   const normalizeStatus = (val: any) =>
//     val
//       ?.toString()
//       .toLowerCase()
//       .replace("_", " ")
//       .trim();

//   // FETCH
//   const fetchTickets = async () => {
//     // USER
//     const { data: authData } =
//       await supabase.auth.getUser();

//     const user = authData.user;

//     if (user) {
//       // USER NAME
//       const { data: profile } =
//         await supabase
//           .from("users")
//           .select("name")
//           .eq("id", user.id)
//           .single();

//       if (profile?.name) {
//         setUserName(profile.name);
//       }
//     }

//     // TICKETS
//     const { data } = await supabase
//       .from("tickets")
//       .select(
//         `*, ticket_updates (message, created_at)`
//       )
//       .order("created_at", {
//         ascending: false,
//       });

//     setTickets(data || []);
//   };

//   useEffect(() => {
//     fetchTickets();

//     const channel = supabase
//       .channel("admin-realtime")
//       .on(
//         "postgres_changes",
//         {
//           event: "INSERT",
//           schema: "public",
//           table: "tickets",
//         },
//         () => {
//           fetchTickets();

//           setNotificationCount(
//             (prev) => prev + 1
//           );
//         }
//       )
//       .on(
//         "postgres_changes",
//         {
//           event: "*",
//           schema: "public",
//           table: "tickets",
//         },
//         fetchTickets
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, []);

//   // STATUS COUNT
//   const statusCounts: any = {
//     open: 0,
//     "in progress": 0,
//     resolved: 0,
//     closed: 0,
//   };

//   tickets.forEach((t) => {
//     const status = normalizeStatus(t.status);

//     if (statusCounts[status] !== undefined) {
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
//     { name: "Resolved", value: resolved },
//     { name: "Closed", value: closed },
//   ];

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
//               tabIndex={0}
//               onClick={() =>
//                 setActivePage("dashboard")
//               }
//               onKeyDown={(e) => {
//                 if (
//                   e.key === "Enter" ||
//                   e.key === " "
//                 ) {
//                   setActivePage(
//                     "dashboard"
//                   );
//                 }
//               }}
//               style={
//                 activePage === "dashboard"
//                   ? styles.activeMenu
//                   : styles.menuItem
//               }
//             >
//               <LayoutDashboard size={18} />
//               Dashboard
//             </div>

//             {/* TICKETS */}
//             <div
//               tabIndex={0}
//               onClick={() =>
//                 setActivePage("tickets")
//               }
//               onKeyDown={(e) => {
//                 if (
//                   e.key === "Enter" ||
//                   e.key === " "
//                 ) {
//                   setActivePage("tickets");
//                 }
//               }}
//               style={
//                 activePage === "tickets"
//                   ? styles.activeMenu
//                   : styles.menuItem
//               }
//             >
//               <Ticket size={18} />
//               All Tickets
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

//           <div style={styles.headerRight}>
//             {/* NOTIFICATION */}
//             <div
//               style={styles.bellBox}
//               onClick={() =>
//                 setNotificationCount(0)
//               }
//             >
//               <Bell size={20} />

//               {notificationCount > 0 && (
//                 <span style={styles.badge}>
//                   {notificationCount}
//                 </span>
//               )}
//             </div>

//             {/* CHANGE PASSWORD */}
//             <button
//               style={styles.changePassBtn}
//               onClick={() =>
//                 navigate(
//                   "/change-password"
//                 )
//               }
//             >
//               Change Password
//             </button>
//           </div>
//         </div>

//         {/* CONTENT */}
//         <div style={styles.content}>
//           {/* DASHBOARD */}
//           {activePage === "dashboard" && (
//             <>
//               {/* TITLE */}
//               <h2 style={styles.analyticsTitle}>
//                 Ticket Analytics Dashboard
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
//                 {/* PIE */}
//                 <div style={styles.chartBox}>
//                   <h3 style={styles.chartTitle}>
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
//                       label={(entry: any) => {
//                         const percent =
//                           entry?.percent ?? 0;

//                         const value =
//                           entry?.value ?? 0;

//                         return `${(
//                           percent * 100
//                         ).toFixed(0)}% (${value})`;
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
//                         fontWeight: "bold",
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

//                 {/* BAR */}
//                 <div style={styles.chartBox}>
//                   <h3 style={styles.chartTitle}>
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
//                       radius={[8, 8, 0, 0]}
//                       fill="#6366f1"
//                     />
//                   </BarChart>
//                 </div>
//               </div>
//             </>
//           )}

//           {/* TICKETS PAGE */}
//           {activePage === "tickets" && (
//             <>
//               {/* FILTER BAR */}
//               <div style={styles.filterBar}>
//                 {/* LEFT */}
//                 <div style={styles.leftFilters}>
//                   <label
//                     style={styles.checkLabel}
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
//                     style={styles.checkLabel}
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
//                     style={styles.checkLabel}
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
//                     style={styles.checkLabel}
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

//                 {/* RIGHT */}
//                 <div style={styles.rightButtons}>
//                   <button
//                     style={styles.closedBtn}
//                     onClick={() =>
//                       (window.location.href =
//                         "/closed-tickets")
//                     }
//                   >
//                     Closed Tickets
//                   </button>

//                   <button
//                     style={styles.userBtn}
//                     onClick={() =>
//                       (window.location.href =
//                         "/users")
//                     }
//                   >
//                     <Users size={16} />
//                     Manage Users
//                   </button>
//                 </div>
//               </div>

//               {/* LIST */}
//               <TicketList
//                 tickets={filteredTickets}
//                 onSelect={setSelectedTicket}
//               />
//             </>
//           )}
//         </div>
//       </div>

//       {/* DETAILS */}
//       {selectedTicket && (
//         <TicketDetails
//           ticket={selectedTicket}
//           isAdmin={true}
//           onClose={() =>
//             setSelectedTicket(null)
//           }
//           onUpdated={fetchTickets}
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
//     <p style={styles.cardTitle}>{title}</p>

//     <h2 style={styles.cardValue}>{value}</h2>
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
//     fontFamily:
//       "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
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
//     outline: "none",
//   },

//   menuItem: {
//     display: "flex",
//     alignItems: "center",
//     gap: 10,
//     padding: "14px 18px",
//     borderRadius: 12,
//     color: "#cbd5e1",
//     cursor: "pointer",
//     outline: "none",
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
//     outline: "none",
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

//   headerRight: {
//     display: "flex",
//     alignItems: "center",
//     gap: 16,
//   },

//   bellBox: {
//     position: "relative",
//     width: 42,
//     height: 42,
//     borderRadius: "50%",
//     background: "#111827",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     cursor: "pointer",
//     border:
//       "1px solid rgba(255,255,255,0.08)",
//   },

//   badge: {
//     position: "absolute",
//     top: -4,
//     right: -4,
//     minWidth: 20,
//     height: 20,
//     borderRadius: "50%",
//     background: "#ef4444",
//     color: "#fff",
//     fontSize: 11,
//     fontWeight: 700,
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     padding: "0 5px",
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

//   closedBtn: {
//     background: "#334155",
//     color: "#fff",
//     border: "none",
//     padding: "10px 16px",
//     borderRadius: 10,
//     cursor: "pointer",
//     fontWeight: 600,
//     outline: "none",
//   },

//   userBtn: {
//     background: "#10b981",
//     color: "#fff",
//     border: "none",
//     padding: "10px 16px",
//     borderRadius: 10,
//     cursor: "pointer",
//     display: "flex",
//     alignItems: "center",
//     gap: 8,
//     fontWeight: 600,
//     outline: "none",
//   },
// };












































// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { supabase } from "../supabaseClient";

// import {
//   LayoutDashboard,
//   Ticket,
//   Users,
//   LogOut,
//   Bell,
// } from "lucide-react";

// import TicketList from "../components/TicketList";
// import TicketDetails from "../components/TicketDetails";

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

// export default function AdminDashboard() {
//   const navigate = useNavigate();

//   const [tickets, setTickets] = useState<any[]>([]);
//   const [selectedTicket, setSelectedTicket] =
//     useState<any>(null);

//   const [activePage, setActivePage] =
//     useState("dashboard");

//   const [userName, setUserName] =
//     useState("");

//   const [notificationCount, setNotificationCount] =
//     useState(0);

//   // FILTERS
//   const [showOpen, setShowOpen] =
//     useState(true);

//   const [showInProgress, setShowInProgress] =
//     useState(true);

//   const [showClosed, setShowClosed] =
//     useState(true);

//   // ✅ Normalize
//   const normalizeStatus = (val: any) =>
//     val
//       ?.toString()
//       .toLowerCase()
//       .replace("_", " ")
//       .trim();

//   // FETCH
//   const fetchTickets = async () => {
//     // USER
//     const { data: authData } =
//       await supabase.auth.getUser();

//     const user = authData.user;

//     if (user) {
//       // USER NAME
//       const { data: profile } =
//         await supabase
//           .from("users")
//           .select("name")
//           .eq("id", user.id)
//           .single();

//       if (profile?.name) {
//         setUserName(profile.name);
//       }
//     }

//     // TICKETS
//     const { data } = await supabase
//       .from("tickets")
//       .select(
//         `*, ticket_updates (message, created_at)`
//       )
//       .order("created_at", {
//         ascending: false,
//       });

//     setTickets(data || []);
//   };

//   useEffect(() => {
//     fetchTickets();

//     const channel = supabase
//       .channel("admin-realtime")
//       .on(
//         "postgres_changes",
//         {
//           event: "INSERT",
//           schema: "public",
//           table: "tickets",
//         },
//         () => {
//           fetchTickets();

//           setNotificationCount(
//             (prev) => prev + 1
//           );
//         }
//       )
//       .on(
//         "postgres_changes",
//         {
//           event: "*",
//           schema: "public",
//           table: "tickets",
//         },
//         fetchTickets
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, []);

//   // STATUS COUNT
//   const statusCounts: any = {
//     open: 0,
//     "in progress": 0,
//     resolved: 0,
//     closed: 0,
//   };

//   tickets.forEach((t) => {
//     const status = normalizeStatus(t.status);

//     if (statusCounts[status] !== undefined) {
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
//     { name: "Resolved", value: resolved },
//     { name: "Closed", value: closed },
//   ];

//   // FILTERED TICKETS
//   const filteredTickets = tickets.filter(
//     (t) => {
//       return (
//         (showOpen &&
//           t.status === "Open") ||
//         (showInProgress &&
//           t.status === "In Progress") ||
//         (showClosed &&
//           t.status === "Closed")
//       );
//     }
//   );

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
//               tabIndex={0}
//               onClick={() =>
//                 setActivePage("dashboard")
//               }
//               onKeyDown={(e) => {
//                 if (
//                   e.key === "Enter" ||
//                   e.key === " "
//                 ) {
//                   setActivePage(
//                     "dashboard"
//                   );
//                 }
//               }}
//               style={
//                 activePage === "dashboard"
//                   ? styles.activeMenu
//                   : styles.menuItem
//               }
//             >
//               <LayoutDashboard size={18} />
//               Dashboard
//             </div>

//             {/* TICKETS */}
//             <div
//               tabIndex={0}
//               onClick={() =>
//                 setActivePage("tickets")
//               }
//               onKeyDown={(e) => {
//                 if (
//                   e.key === "Enter" ||
//                   e.key === " "
//                 ) {
//                   setActivePage("tickets");
//                 }
//               }}
//               style={
//                 activePage === "tickets"
//                   ? styles.activeMenu
//                   : styles.menuItem
//               }
//             >
//               <Ticket size={18} />
//               All Tickets
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

//           <div style={styles.headerRight}>
//             {/* NOTIFICATION */}
//             <div
//               style={styles.bellBox}
//               onClick={() =>
//                 setNotificationCount(0)
//               }
//             >
//               <Bell size={20} />

//               {notificationCount > 0 && (
//                 <span style={styles.badge}>
//                   {notificationCount}
//                 </span>
//               )}
//             </div>

//             {/* CHANGE PASSWORD */}
//             <button
//               style={styles.changePassBtn}
//               onClick={() =>
//                 navigate(
//                   "/change-password"
//                 )
//               }
//             >
//               Change Password
//             </button>
//           </div>
//         </div>

//         {/* CONTENT */}
//         <div style={styles.content}>
//           {/* DASHBOARD */}
//           {activePage === "dashboard" && (
//             <>
//               {/* TITLE */}
//               <h2 style={styles.analyticsTitle}>
//                 Ticket Analytics Dashboard
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
//                 {/* PIE */}
//                 <div style={styles.chartBox}>
//                   <h3 style={styles.chartTitle}>
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
//                       label={(entry: any) => {
//                         const percent =
//                           entry?.percent ?? 0;

//                         const value =
//                           entry?.value ?? 0;

//                         return `${(
//                           percent * 100
//                         ).toFixed(0)}% (${value})`;
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
//                         fontWeight: "bold",
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

//                 {/* BAR */}
//                 <div style={styles.chartBox}>
//                   <h3 style={styles.chartTitle}>
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
//                       radius={[8, 8, 0, 0]}
//                       fill="#6366f1"
//                     />
//                   </BarChart>
//                 </div>
//               </div>
//             </>
//           )}

//           {/* TICKETS PAGE */}
//           {activePage === "tickets" && (
//             <>
//               {/* FILTER BAR */}
//               <div style={styles.filterBar}>
//                 {/* LEFT */}
//                 <div style={styles.leftFilters}>
//                   <label
//                     style={styles.checkLabel}
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
//                     style={styles.checkLabel}
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
//                     style={styles.checkLabel}
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

//                 {/* RIGHT */}
//                 <div style={styles.rightButtons}>
//                   <button
//                     style={styles.closedBtn}
//                     onClick={() =>
//                       (window.location.href =
//                         "/closed-tickets")
//                     }
//                   >
//                     Closed Tickets
//                   </button>

//                   <button
//                     style={styles.userBtn}
//                     onClick={() =>
//                       (window.location.href =
//                         "/users")
//                     }
//                   >
//                     <Users size={16} />
//                     Manage Users
//                   </button>
//                 </div>
//               </div>

//               {/* LIST */}
//               <TicketList
//                 tickets={filteredTickets}
//                 onSelect={setSelectedTicket}
//               />
//             </>
//           )}
//         </div>
//       </div>

//       {/* DETAILS */}
//       {selectedTicket && (
//         <TicketDetails
//           ticket={selectedTicket}
//           isAdmin={true}
//           onClose={() =>
//             setSelectedTicket(null)
//           }
//           onUpdated={fetchTickets}
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
//     <p style={styles.cardTitle}>{title}</p>

//     <h2 style={styles.cardValue}>{value}</h2>
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
//     fontFamily:
//       "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
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
//     outline: "none",
//   },

//   menuItem: {
//     display: "flex",
//     alignItems: "center",
//     gap: 10,
//     padding: "14px 18px",
//     borderRadius: 12,
//     color: "#cbd5e1",
//     cursor: "pointer",
//     outline: "none",
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
//     outline: "none",
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

//   headerRight: {
//     display: "flex",
//     alignItems: "center",
//     gap: 16,
//   },

//   bellBox: {
//     position: "relative",
//     width: 42,
//     height: 42,
//     borderRadius: "50%",
//     background: "#111827",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     cursor: "pointer",
//     border:
//       "1px solid rgba(255,255,255,0.08)",
//   },

//   badge: {
//     position: "absolute",
//     top: -4,
//     right: -4,
//     minWidth: 20,
//     height: 20,
//     borderRadius: "50%",
//     background: "#ef4444",
//     color: "#fff",
//     fontSize: 11,
//     fontWeight: 700,
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     padding: "0 5px",
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

//   closedBtn: {
//     background: "#334155",
//     color: "#fff",
//     border: "none",
//     padding: "10px 16px",
//     borderRadius: 10,
//     cursor: "pointer",
//     fontWeight: 600,
//     outline: "none",
//   },

//   userBtn: {
//     background: "#10b981",
//     color: "#fff",
//     border: "none",
//     padding: "10px 16px",
//     borderRadius: 10,
//     cursor: "pointer",
//     display: "flex",
//     alignItems: "center",
//     gap: 8,
//     fontWeight: 600,
//     outline: "none",
//   },
// };

































// import { useEffect, useState } from "react";
// import { supabase } from "../supabaseClient";

// import {
//   LayoutDashboard,
//   Ticket,
//   Users,
//   LogOut,
//   Bell,
//   KeyRound,
// } from "lucide-react";

// import TicketList from "../components/TicketList";
// import TicketDetails from "../components/TicketDetails";

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

// export default function AdminDashboard() {
//   const [tickets, setTickets] = useState<any[]>([]);
//   const [selectedTicket, setSelectedTicket] =
//     useState<any>(null);

//   const [activePage, setActivePage] =
//     useState("dashboard");

//   const [userName, setUserName] =
//     useState("Admin");

//   const [notificationCount, setNotificationCount] =
//     useState(0);

//   // ✅ Normalize
//   const normalizeStatus = (val: any) =>
//     val
//       ?.toString()
//       .toLowerCase()
//       .replace("_", " ")
//       .trim();

//   // ✅ FETCH USER NAME
//   const fetchUserName = async () => {
//     const { data } = await supabase.auth.getUser();

//     const user = data.user;

//     if (!user) return;

//     const { data: profile } = await supabase
//       .from("users")
//       .select("*")
//       .eq("id", user.id)
//       .single();

//     setUserName(
//       profile?.name ||
//         profile?.full_name ||
//         profile?.username ||
//         profile?.email ||
//         "Admin"
//     );
//   };

//   // ✅ FETCH TICKETS
//   const fetchTickets = async () => {
//     const { data } = await supabase
//       .from("tickets")
//       .select(
//         `*, ticket_updates (message, created_at)`
//       )
//       .order("created_at", {
//         ascending: false,
//       });

//     setTickets(data || []);
//   };

//   useEffect(() => {
//     fetchTickets();
//     fetchUserName();

//     const channel = supabase
//       .channel("admin-realtime")

//       .on(
//         "postgres_changes",
//         {
//           event: "*",
//           schema: "public",
//           table: "tickets",
//         },
//         (payload) => {
//           fetchTickets();

//           // 🔔 NEW NOTIFICATION
//           if (
//             payload.eventType === "INSERT"
//           ) {
//             setNotificationCount(
//               (prev) => prev + 1
//             );
//           }
//         }
//       )

//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, []);

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

//   // ✅ LOGOUT
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
//               tabIndex={0}
//             >
//               <LayoutDashboard
//                 size={18}
//               />
//               Dashboard
//             </div>

//             {/* TICKETS */}
//             <div
//               onClick={() =>
//                 setActivePage("tickets")
//               }
//               style={
//                 activePage === "tickets"
//                   ? styles.activeMenu
//                   : styles.menuItem
//               }
//               tabIndex={0}
//             >
//               <Ticket size={18} />
//               All Tickets
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
//               {activePage === "dashboard"
//                 ? "Admin Dashboard"
//                 : "All Tickets"}
//             </h1>

//             <p style={styles.welcomeText}>
//               Welcome, {userName}
//             </p>
//           </div>

//           {/* RIGHT SIDE */}
//           <div style={styles.headerRight}>
//             {/* BELL */}
//             <div
//               style={styles.bellBox}
//               tabIndex={0}
//               title="Notifications"
//             >
//               <Bell size={20} />

//               {notificationCount >
//                 0 && (
//                 <span
//                   style={
//                     styles.bellCount
//                   }
//                 >
//                   {notificationCount}
//                 </span>
//               )}
//             </div>

//             {/* CHANGE PASSWORD */}
//             <button
//               style={
//                 styles.passwordBtn
//               }
//               onClick={() =>
//                 (window.location.href =
//                   "/change-password")
//               }
//             >
//               <KeyRound size={16} />
//               Change Password
//             </button>
//           </div>
//         </div>

//         {/* CONTENT */}
//         <div style={styles.content}>
//           {/* DASHBOARD */}
//           {activePage ===
//             "dashboard" && (
//             <>
//               {/* TITLE */}
//               <h2
//                 style={
//                   styles.analyticsTitle
//                 }
//               >
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
//                 {/* PIE */}
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
//                           entry?.percent ??
//                           0;

//                         const value =
//                           entry?.value ??
//                           0;

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

//                 {/* BAR */}
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

//           {/* TICKETS PAGE */}
//           {activePage ===
//             "tickets" && (
//             <>
//               {/* BUTTON */}
//               <div style={styles.topBar}>
//                 <button
//                   style={styles.userBtn}
//                   onClick={() =>
//                     (window.location.href =
//                       "/users")
//                   }
//                 >
//                   <Users size={16} />
//                   Manage Users
//                 </button>
//               </div>

//               {/* LIST */}
//               <TicketList
//                 tickets={tickets}
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
//           isAdmin={true}
//           onClose={() =>
//             setSelectedTicket(null)
//           }
//           onUpdated={fetchTickets}
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
//     fontFamily:
//       "Inter, sans-serif",
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
//     justifyContent:
//       "space-between",
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
//     justifyContent:
//       "space-between",
//     alignItems: "center",
//   },

//   heading: {
//     margin: 0,
//     fontSize: 28,
//     fontWeight: 700,
//   },

//   welcomeText: {
//     margin: "6px 0 0 0",
//     color: "#94a3b8",
//     fontSize: 14,
//     fontWeight: 500,
//   },

//   headerRight: {
//     display: "flex",
//     alignItems: "center",
//     gap: 14,
//   },

//   bellBox: {
//     position: "relative",
//     width: 42,
//     height: 42,
//     borderRadius: 12,
//     background: "#111827",
//     border:
//       "1px solid rgba(255,255,255,0.08)",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     cursor: "pointer",
//     color: "#fff",
//   },

//   bellCount: {
//     position: "absolute",
//     top: -6,
//     right: -4,
//     background: "#ef4444",
//     color: "#fff",
//     borderRadius: "50%",
//     minWidth: 20,
//     height: 20,
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     fontSize: 11,
//     fontWeight: 700,
//     padding: "0 4px",
//   },

//   passwordBtn: {
//     background: "#6366f1",
//     color: "#fff",
//     border: "none",
//     padding: "10px 16px",
//     borderRadius: 10,
//     cursor: "pointer",
//     display: "flex",
//     alignItems: "center",
//     gap: 8,
//     fontWeight: 600,
//     fontSize: 13,
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
//     gridTemplateColumns:
//       "1fr 1fr",
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

//   topBar: {
//     display: "flex",
//     justifyContent: "flex-end",
//     marginBottom: 14,
//   },

//   userBtn: {
//     background: "#10b981",
//     color: "#fff",
//     border: "none",
//     padding: "10px 16px",
//     borderRadius: 10,
//     cursor: "pointer",
//     display: "flex",
//     alignItems: "center",
//     gap: 8,
//     fontWeight: 600,
//   },
// };
































//final working code before before bell icon and user name on dashboard 24/05/26
// import { useEffect, useState } from "react";
// import { supabase } from "../supabaseClient";

// import {
//   LayoutDashboard,
//   Ticket,
//   Users,
//   LogOut,
// } from "lucide-react";

// import TicketList from "../components/TicketList";
// import TicketDetails from "../components/TicketDetails";

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

// export default function AdminDashboard() {
//   const [tickets, setTickets] = useState<any[]>([]);
//   const [selectedTicket, setSelectedTicket] =
//     useState<any>(null);

//   const [activePage, setActivePage] =
//     useState("dashboard");

//   // ✅ Normalize
//   const normalizeStatus = (val: any) =>
//     val
//       ?.toString()
//       .toLowerCase()
//       .replace("_", " ")
//       .trim();

//   // FETCH
//   const fetchTickets = async () => {
//     const { data } = await supabase
//       .from("tickets")
//       .select(
//         `*, ticket_updates (message, created_at)`
//       )
//       .order("created_at", { ascending: false });

//     setTickets(data || []);
//   };

//   useEffect(() => {
//     fetchTickets();

//     const channel = supabase
//       .channel("admin-realtime")
//       .on(
//         "postgres_changes",
//         {
//           event: "*",
//           schema: "public",
//           table: "tickets",
//         },
//         fetchTickets
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, []);

//   // STATUS COUNT
//   const statusCounts: any = {
//     open: 0,
//     "in progress": 0,
//     resolved: 0,
//     closed: 0,
//   };

//   tickets.forEach((t) => {
//     const status = normalizeStatus(t.status);

//     if (statusCounts[status] !== undefined) {
//       statusCounts[status]++;
//     }
//   });

//   // STATS
//   const total = tickets.length;
//   const open = statusCounts["open"];
//   const inProgress =
//     statusCounts["in progress"];
//   const resolved = statusCounts["resolved"];
//   const closed = statusCounts["closed"];

//   const statusData = [
//     { name: "Open", value: open },
//     {
//       name: "In Progress",
//       value: inProgress,
//     },
//     { name: "Resolved", value: resolved },
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
//                 setActivePage("dashboard")
//               }
//               style={
//                 activePage === "dashboard"
//                   ? styles.activeMenu
//                   : styles.menuItem
//               }
//             >
//               <LayoutDashboard size={18} />
//               Dashboard
//             </div>

//             {/* TICKETS */}
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
//               All Tickets
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
//           <h1 style={styles.heading}>
//             {activePage === "dashboard"
//               ? "Admin Dashboard"
//               : "All Tickets"}
//           </h1>
//         </div>

//         {/* CONTENT */}
//         <div style={styles.content}>
//           {/* DASHBOARD */}
//           {activePage === "dashboard" && (
//             <>
//               {/* TITLE */}
//               <h2 style={styles.analyticsTitle}>
//                 Ticket Analytics Dashboard
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
//                 {/* PIE */}
//                 <div style={styles.chartBox}>
//                   <h3 style={styles.chartTitle}>
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
//                       label={(entry: any) => {
//                         const percent =
//                           entry?.percent ?? 0;

//                         const value =
//                           entry?.value ?? 0;

//                         return `${(
//                           percent * 100
//                         ).toFixed(0)}% (${value})`;
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
//                         fontWeight: "bold",
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

//                 {/* BAR */}
//                 <div style={styles.chartBox}>
//                   <h3 style={styles.chartTitle}>
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
//                       radius={[8, 8, 0, 0]}
//                       fill="#6366f1"
//                     />
//                   </BarChart>
//                 </div>
//               </div>
//             </>
//           )}

//           {/* TICKETS PAGE */}
//           {activePage === "tickets" && (
//             <>
//               {/* BUTTON */}
//               <div style={styles.topBar}>
//                 <button
//                   style={styles.userBtn}
//                   onClick={() =>
//                     (window.location.href =
//                       "/users")
//                   }
//                 >
//                   <Users size={16} />
//                   Manage Users
//                 </button>
//               </div>

//               {/* LIST */}
//               <TicketList
//                 tickets={tickets}
//                 onSelect={setSelectedTicket}
//               />
//             </>
//           )}
//         </div>
//       </div>

//       {/* DETAILS */}
//       {selectedTicket && (
//         <TicketDetails
//           ticket={selectedTicket}
//           isAdmin={true}
//           onClose={() =>
//             setSelectedTicket(null)
//           }
//           onUpdated={fetchTickets}
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
//     <p style={styles.cardTitle}>{title}</p>

//     <h2 style={styles.cardValue}>{value}</h2>
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
//     background: "rgba(16,185,129,0.15)",
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
//   },

//   heading: {
//     margin: 0,
//     fontSize: 28,
//     fontWeight: 700,
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
//     gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
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

//   topBar: {
//     display: "flex",
//     justifyContent: "flex-end",
//     marginBottom: 14,
//   },

//   userBtn: {
//     background: "#10b981",
//     color: "#fff",
//     border: "none",
//     padding: "10px 16px",
//     borderRadius: 10,
//     cursor: "pointer",
//     display: "flex",
//     alignItems: "center",
//     gap: 8,
//     fontWeight: 600,
//   },
// };
























//final working code before vaibhav sir design changes 19/05/26
// import { useEffect, useState } from "react";
// import { supabase } from "../supabaseClient";
// import Header from "../components/Header";
// import TicketList from "../components/TicketList";
// import TicketDetails from "../components/TicketDetails";
// import {PieChart,Pie,Cell,Tooltip,BarChart,Bar,XAxis,YAxis,CartesianGrid,Legend,} from "recharts";

// export default function AdminDashboard() {
//   const [tickets, setTickets] = useState<any[]>([]);
//   const [selectedTicket, setSelectedTicket] = useState<any>(null);

//   // ✅ Normalize
//   const normalizeStatus = (val: any) =>
//     val?.toString().toLowerCase().replace("_", " ").trim();

//   const fetchTickets = async () => {
//     const { data } = await supabase
//       .from("tickets")
//       .select(`*, ticket_updates (message, created_at)`)
//       .order("created_at", { ascending: false });

//     setTickets(data || []);
//   };

//   useEffect(() => {
//     fetchTickets();

//     const channel = supabase
//       .channel("admin-realtime")
//       .on(
//         "postgres_changes",
//         { event: "*", schema: "public", table: "tickets" },
//         fetchTickets
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, []);

//   // =========================
//   // 🔥 STATUS COUNT
//   // =========================
//   const statusCounts: any = {
//     open: 0,
//     "in progress": 0,
//     resolved: 0,
//     closed: 0,
//   };

//   tickets.forEach((t) => {
//     const status = normalizeStatus(t.status);
//     if (statusCounts[status] !== undefined) {
//       statusCounts[status]++;
//     }
//   });

//   // =========================
//   // 📊 STATS
//   // =========================
//   const total = tickets.length;
//   const open = statusCounts["open"];
//   const inProgress = statusCounts["in progress"];
//   const resolved = statusCounts["resolved"];
//   const closed = statusCounts["closed"];

//   const statusData = [
//     { name: "Open", value: open },
//     { name: "In Progress", value: inProgress },
//     { name: "Resolved", value: resolved },
//     { name: "Closed", value: closed },
//   ];

//   return (
//     <div style={styles.page}>
//       <Header title="Admin Dashboard" />

//       <div style={styles.container}>

//         {/* ✅ CARDS */}
//         <div style={styles.cards}>
//           <Card title="Total Tickets" value={total} color="#6366f1" />
//           <Card title="Open" value={open} color="#ef4444" />
//           <Card title="In Progress" value={inProgress} color="#f59e0b" />
//           <Card title="Resolved" value={resolved} color="#10b981" />
//           <Card title="Closed" value={closed} color="#6b7280" />
//         </div>

//         {/* ✅ CHARTS */}
//         <div style={styles.charts}>

//           {/* 🔥 PREMIUM DONUT CHART */}
//           <div style={styles.chartBox}>
//             <h3>Status Distribution</h3>

//             <PieChart width={320} height={260}>
//               <Pie
//                 data={statusData}
//                 dataKey="value"
//                 innerRadius={70}
//                 outerRadius={100}
//                 paddingAngle={3}
//                 label={(entry: any) => {
//   const percent = entry?.percent ?? 0;
//   const value = entry?.value ?? 0;

//   return `${(percent * 100).toFixed(0)}% (${value})`;
// }}
//                 isAnimationActive={true}
//               >
//                 <Cell fill="#ef4444" />
//                 <Cell fill="#f59e0b" />
//                 <Cell fill="#10b981" />
//                 <Cell fill="#6b7280" />
//               </Pie>

//               {/* CENTER TEXT */}
//               <text
//                 x="50%"
//                 y="45%"
//                 textAnchor="middle"
//                 style={{ fontSize: "20px", fontWeight: "bold" }}
//               >
//                 {total}
//               </text>

//               <text
//                 x="50%"
//                 y="60%"
//                 textAnchor="middle"
//                 style={{ fontSize: "12px", fill: "#666" }}
//               >
//                 Total Tickets
//               </text>

//               <Tooltip
//                 formatter={(value: any, name: any) => [
//                   `${value} tickets`,
//                   name,
//                 ]}
//               />
//             </PieChart>
//           </div>

//           {/* 📊 BAR CHART */}
//           <div style={styles.chartBox}>
//             <h3>Status Comparison</h3>

//             <BarChart width={420} height={260} data={statusData}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="name" />
//               <YAxis />
//               <Tooltip formatter={(value: any) => `${value} tickets`} />
//               <Legend />
//               <Bar
//                 dataKey="value"
//                 radius={[8, 8, 0, 0]}
//                 fill="#6366f1"
//               />
//             </BarChart>
//           </div>

//         </div>

//         {/* 👥 BUTTON */}
//         <button
//           style={styles.userBtn}
//           onClick={() => (window.location.href = "/users")}
//         >
//           👥 Manage Users
//         </button>

//         {/* 📋 LIST */}
//         <TicketList tickets={tickets} onSelect={setSelectedTicket} />

//         {/* 📄 DETAILS */}
//         {selectedTicket && (
//           <TicketDetails
//             ticket={selectedTicket}
//             isAdmin={true}
//             onClose={() => setSelectedTicket(null)}
//             onUpdated={fetchTickets}
//           />
//         )}
//       </div>
//     </div>
//   );
// }

// // ✅ CARD
// const Card = ({ title, value, color }: any) => (
//   <div style={{ ...styles.card, borderTop: `4px solid ${color}` }}>
//     <p>{title}</p>
//     <h2>{value}</h2>
//   </div>
// );

// // 🎨 STYLES
// const styles: any = {
//   page: {
//     minHeight: "100vh",
//     background: "#f1f5f9",
//   },
//   container: {
//     padding: 30,
//   },
//   cards: {
//     display: "grid",
//     gridTemplateColumns: "repeat(5, 1fr)",
//     gap: 20,
//     marginBottom: 30,
//   },
//   card: {
//     background: "#fff",
//     padding: 20,
//     borderRadius: 12,
//     textAlign: "center",
//     boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
//   },
//   charts: {
//     display: "grid",
//     gridTemplateColumns: "1fr 1fr",
//     gap: 20,
//     marginBottom: 30,
//   },
//   chartBox: {
//     background: "#fff",
//     padding: 20,
//     borderRadius: 12,
//     boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
//     textAlign: "center",
//     transition: "0.3s",
//   },
//   userBtn: {
//     padding: "10px 18px",
//     background: "#059669",
//     color: "#fff",
//     border: "none",
//     borderRadius: "8px",
//     cursor: "pointer",
//     marginBottom: "20px",
//   },
// };




















// final working code before admins dashboard add charts 04/04/26
// import { useEffect, useState } from "react";
// import { supabase } from "../supabaseClient";
// import Header from "../components/Header";
// import TicketList from "../components/TicketList";
// import TicketDetails from "../components/TicketDetails";

// export default function AdminDashboard() {
//   const [tickets, setTickets] = useState<any[]>([]);
//   const [selectedTicket, setSelectedTicket] = useState<any>(null);

//   const fetchTickets = async () => {
//     const { data, error } = await supabase
//       .from("tickets")
//       .select(`*, ticket_updates (message, created_at)`)
//       .order("created_at", { ascending: false });

//     if (!error) setTickets(data || []);
//   };

//   useEffect(() => {
//     fetchTickets();

//     // 🔥 REALTIME LISTENER
//     const channel = supabase
//       .channel("admin-tickets-realtime")
//       .on(
//         "postgres_changes",
//         { event: "*", schema: "public", table: "tickets" },
//         () => {
//           fetchTickets();
//         }
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, []);

//   return (
//     <div style={styles.page}>
//       <Header title="Admin Dashboard" />

//       <div style={styles.container}>

//         {/* ✅ USER MANAGEMENT BUTTON */}
//         <button
//           style={styles.userBtn}
//           onClick={() => (window.location.href = "/users")}
//         >
//           👥 Manage Users
//         </button>

//         {/* ✅ TICKET LIST */}
//         <TicketList tickets={tickets} onSelect={setSelectedTicket} />

//         {/* ✅ TICKET DETAILS */}
//         {selectedTicket && (
//           <TicketDetails
//             ticket={selectedTicket}
//             isAdmin={true}
//             onClose={() => setSelectedTicket(null)}
//             onUpdated={fetchTickets}
//           />
//         )}
//       </div>
//     </div>
//   );
// }

// const styles: any = {
//   page: {
//     minHeight: "100vh",
//     background: "#f1f5f9",
//   },

//   container: {
//     padding: 30,
//   },

//   userBtn: {
//     padding: "10px 18px",
//     background: "#059669",
//     color: "#fff",
//     border: "none",
//     borderRadius: "8px",
//     cursor: "pointer",
//     marginBottom: "20px",
//   },
// };





















//final working code before add user and user list 03/04/26
// import { useEffect, useState } from "react";
// import { supabase } from "../supabaseClient";
// import Header from "../components/Header";
// import TicketList from "../components/TicketList";
// import TicketDetails from "../components/TicketDetails";

// export default function AdminDashboard() {
//   const [tickets, setTickets] = useState<any[]>([]);
//   const [selectedTicket, setSelectedTicket] = useState<any>(null);

//   const fetchTickets = async () => {
//     const { data, error } = await supabase
//       .from("tickets")
//       .select(`*, ticket_updates (message, created_at)`)
//       .order("created_at", { ascending: false }); // ✅ SAFE ORDER

//     if (!error) setTickets(data || []);
//   };

//   useEffect(() => {
//     fetchTickets();

//     // 🔥 REALTIME LISTENER (ADMIN)
//     const channel = supabase
//       .channel("admin-tickets-realtime")
//       .on(
//         "postgres_changes",
//         { event: "*", schema: "public", table: "tickets" },
//         () => {
//           fetchTickets(); // auto refresh
//         }
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, []);

//   return (
//     <div style={styles.page}>
//       <Header title="Admin Dashboard" />

//       <div style={styles.container}>
//         <TicketList tickets={tickets} onSelect={setSelectedTicket} />

//         {selectedTicket && (
//           <TicketDetails
//             ticket={selectedTicket}
//             isAdmin={true}
//             onClose={() => setSelectedTicket(null)}
//             onUpdated={fetchTickets}
//           />
//         )}
//       </div>
//     </div>
//   );
// }

// const styles: any = {
//   page: {
//     minHeight: "100vh",
//     background: "#f1f5f9",
//   },
//   container: {
//     padding: 30,
//   },
// };
