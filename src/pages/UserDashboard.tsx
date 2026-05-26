import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

import {
  LayoutDashboard,
  Ticket,
  Plus,
  LogOut,
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

  // FILTERS
  const [showOpen, setShowOpen] =
    useState(true);

  const [showInProgress, setShowInProgress] =
    useState(true);

  const [showResolved, setShowResolved] =
    useState(true);

  const [showClosed, setShowClosed] =
    useState(true);

  // NORMALIZE STATUS
  const normalizeStatus = (val: any) =>
    val
      ?.toString()
      .toLowerCase()
      .replace("_", " ")
      .trim();

  // FETCH TICKETS
  const fetchTickets = async () => {
    const { data } = await supabase.auth.getUser();

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

  // FILTERED TICKETS
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

  // STATUS COUNT
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

  // STATS
  const total = tickets.length;

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
    { name: "Closed", value: closed },
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
                setActivePage("tickets")
              }
              style={
                activePage === "tickets"
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

      {/* MAIN */}
      <div style={styles.main}>
        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.heading}>
              Welcome {userName}
            </h1>
          </div>

          <button
            style={styles.changePassBtn}
            onClick={() =>
              navigate(
                "/change-password"
              )
            }
          >
            Change Password
          </button>
        </div>

        {/* CONTENT */}
        <div style={styles.content}>
          {/* DASHBOARD */}
          {activePage === "dashboard" && (
            <>
              {/* TITLE */}
              <h2 style={styles.analyticsTitle}>
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
                  value={inProgress}
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
                {/* PIE CHART */}
                <div style={styles.chartBox}>
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
                      data={statusData}
                      dataKey="value"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={3}
                      label={(
                        entry: any
                      ) => {
                        const percent =
                          entry?.percent ?? 0;

                        const value =
                          entry?.value ?? 0;

                        return `${(
                          percent * 100
                        ).toFixed(
                          0
                        )}% (${value})`;
                      }}
                    >
                      <Cell fill="#ef4444" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#10b981" />
                      <Cell fill="#6b7280" />
                    </Pie>

                    <text
                      x="50%"
                      y="45%"
                      textAnchor="middle"
                      style={{
                        fontSize: "20px",
                        fontWeight:
                          "bold",
                        fill: "#fff",
                      }}
                    >
                      {total}
                    </text>

                    <text
                      x="50%"
                      y="60%"
                      textAnchor="middle"
                      style={{
                        fontSize: "12px",
                        fill: "#94a3b8",
                      }}
                    >
                      Total Tickets
                    </text>

                    <Tooltip />
                  </PieChart>
                </div>

                {/* BAR CHART */}
                <div style={styles.chartBox}>
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

          {/* ACTIVE TICKETS */}
          {activePage === "tickets" && (
            <>
              {/* FILTER BAR */}
              <div style={styles.filterBar}>
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
                      checked={showOpen}
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
                      checked={showResolved}
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
                      checked={showClosed}
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
                    style={styles.addBtn}
                    onClick={() =>
                      setShowCreate(true)
                    }
                  >
                    <Plus size={14} />
                    Add Ticket
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
          isAdmin={false}
          onClose={() =>
            setSelectedTicket(null)
          }
          onUpdated={fetchTickets}
        />
      )}

      {/* CREATE */}
      {showCreate && (
        <CreateTicketModal
          onClose={() =>
            setShowCreate(false)
          }
          onSuccess={fetchTickets}
        />
      )}
    </div>
  );
}

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
    fontFamily: "Inter, sans-serif",
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
    zIndex: 100,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
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
    background: "#0f172a",
    padding: "18px 26px",
    borderBottom:
      "1px solid rgba(255,255,255,0.06)",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  heading: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
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
    padding: "20px 2px 0px 20px",
    display: "flex",
    flexDirection: "column",
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
    color: "#fff",
    marginBottom: 18,
    fontWeight: 600,
    fontSize: 16,
  },

  cardValue: {
    color: "#fff",
    margin: 0,
    fontSize: 38,
    fontWeight: 700,
  },

  charts: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
    marginBottom: 20,
  },

  chartBox: {
    background: "#111827",
    borderRadius: 18,
    padding: 20,
    border:
      "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

  chartTitle: {
    marginTop: 0,
    marginBottom: 16,
    fontSize: 18,
    color: "#fff",
  },

  filterBar: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    background: "#0f172a",
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
    color: "#e2e8f0",
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

//             {/* <p style={styles.subHeading}>
//               {activePage ===
//               "dashboard"
//                 ? "IT Command Center Dashboard"
//                 : "Manage Your Active Tickets"}
//             </p> */}
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

//   subHeading: {
//     marginTop: 6,
//     color: "#94a3b8",
//     fontSize: 13,
//     fontWeight: 500,
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





























// final working code before change password button add and logged username show
// import { useEffect, useState } from "react";
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
//   const [tickets, setTickets] = useState<any[]>([]);
//   const [selectedTicket, setSelectedTicket] =
//     useState<any>(null);

//   const [showCreate, setShowCreate] =
//     useState(false);

//   const [activePage, setActivePage] =
//     useState("dashboard");

//   // FILTERS
//   const [showOpen, setShowOpen] =
//     useState(true);

//   const [showInProgress, setShowInProgress] =
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
//           <h1 style={styles.heading}>
//             {activePage === "dashboard"
//               ? "Dashboard"
//               : "Active Tickets"}
//           </h1>
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

//                     {/* CENTER TEXT */}
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
//                   {/* CLOSED TICKETS */}
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

//                   {/* ADD TICKET */}
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

//               {/* TICKET LIST */}
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
//   },
// };








































































































//final working code before vaibhav sir design changes 19/05/26
// import { useEffect, useState } from "react";
// import { supabase } from "../supabaseClient";
// import Header from "../components/Header";
// import TicketList from "../components/TicketList";
// import TicketDetails from "../components/TicketDetails";
// import CreateTicketModal from "../components/CreateTicketModal";
// import TicketAnalytics from "../components/TicketAnalytics";

// export default function UserDashboard() {
//   const [tickets, setTickets] = useState<any[]>([]);
//   const [selectedTicket, setSelectedTicket] = useState<any>(null);
//   const [showCreate, setShowCreate] = useState(false);

//   const [userId, setUserId] = useState<string | null>(null); // 🔥 NEW

//   // ✅ Filters
//   const [showOpen, setShowOpen] = useState(true);
//   const [showInProgress, setShowInProgress] = useState(true);
//   const [showClosed, setShowClosed] = useState(true);

//   const [search, setSearch] = useState("");

//   /* 🔥 GET USER + FETCH TICKETS */
//   const fetchTickets = async () => {
//     const { data } = await supabase.auth.getUser();
//     const user = data.user;

//     if (!user) return;

//     setUserId(user.id); // 🔥 store userId

//     const { data: ticketData, error } = await supabase
//       .from("tickets")
//       .select(`*,ticket_updates (message, created_at)`)
//       .eq("created_by", user.id) // 🔥 IMPORTANT FILTER
//       .order("created_at", { ascending: false });

//     if (!error) setTickets(ticketData || []);
//   };

//   useEffect(() => {
//     fetchTickets();

//     const channel = supabase
//       .channel("tickets-realtime")
//       .on(
//         "postgres_changes",
//         {
//           event: "*",
//           schema: "public",
//           table: "tickets",
//           filter: `created_by=eq.${userId}`, // 🔥 REALTIME FILTER
//         },
//         () => {
//           fetchTickets();
//         }
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, [userId]); // 🔥 IMPORTANT

//   // ✅ Clear Closed (hide only)
//   const clearClosedTickets = () => {
//     setShowClosed(false);
//   };

//   // ✅ Filter logic
//   const filteredTickets = tickets.filter((t) => {
//     const statusMatch =
//       (showOpen && t.status === "Open") ||
//       (showInProgress && t.status === "In Progress") ||
//       (showClosed && t.status === "Closed");

//     const searchMatch =
//       t.title?.toLowerCase().includes(search.toLowerCase()) ||
//       t.description?.toLowerCase().includes(search.toLowerCase());

//     return statusMatch && searchMatch;
//   });

//   return (
//     <div style={styles.page}>
//       <Header title="User Dashboard" />

//       <div style={styles.container}>
//         <TicketAnalytics tickets={filteredTickets} />

//         {/* ✅ FILTER BAR */}
//         <div style={styles.filterBar}>
//           <label>
//             <input
//               type="checkbox"
//               checked={showOpen}
//               onChange={() => setShowOpen(!showOpen)}
//             />
//             Open
//           </label>

//           <label>
//             <input
//               type="checkbox"
//               checked={showInProgress}
//               onChange={() => setShowInProgress(!showInProgress)}
//             />
//             In Progress
//           </label>

//           <label>
//             <input
//               type="checkbox"
//               checked={showClosed}
//               onChange={() => setShowClosed(!showClosed)}
//             />
//             Closed
//           </label>

//           {/* 🔍 Search */}
//           <input
//             type="text"
//             placeholder="Search tickets..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             style={styles.search}
//           />
//         </div>

//         {/* Buttons */}
//         <div style={{ marginTop: 10 }}>
//           <button
//             onClick={() => (window.location.href = "/closed-tickets")}
//             style={styles.btn}
//           >
//             View Closed Tickets
//           </button>

//           <button
//             onClick={clearClosedTickets}
//             style={{ ...styles.btn, background: "#dc2626" }}
//           >
//             Clear Closed Tickets
//           </button>
//         </div>

//         <button style={styles.addBtn} onClick={() => setShowCreate(true)}>
//           + Add New Ticket
//         </button>

//         <TicketList tickets={filteredTickets} onSelect={setSelectedTicket} />

//         {selectedTicket && (
//           <TicketDetails
//             ticket={selectedTicket}
//             isAdmin={false}
//             onClose={() => setSelectedTicket(null)}
//             onUpdated={fetchTickets}
//           />
//         )}

//         {showCreate && (
//           <CreateTicketModal
//             onClose={() => setShowCreate(false)}
//             onSuccess={fetchTickets}
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
//   filterBar: {
//     display: "flex",
//     gap: 20,
//     alignItems: "center",
//     marginBottom: 15,
//     flexWrap: "wrap",
//   },
//   search: {
//     padding: "8px 12px",
//     borderRadius: 6,
//     border: "1px solid #ccc",
//   },
//   addBtn: {
//     marginTop: 10,
//     marginBottom: 15,
//     padding: "10px 18px",
//     background: "#4f46e5",
//     color: "#fff",
//     border: "none",
//     borderRadius: 8,
//     cursor: "pointer",
//   },
//   btn: {
//     marginRight: 10,
//     padding: "10px 18px",
//     background: "#4f46e5",
//     color: "#fff",
//     border: "none",
//     borderRadius: 8,
//     cursor: "pointer",
//   },
// };






















// final working code before user wise tickets show 04/04/26
// import { useEffect, useState } from "react";
// import { supabase } from "../supabaseClient";
// import Header from "../components/Header";
// import TicketList from "../components/TicketList";
// import TicketDetails from "../components/TicketDetails";
// import CreateTicketModal from "../components/CreateTicketModal";
// import TicketAnalytics from "../components/TicketAnalytics";

// export default function UserDashboard() {
//   const [tickets, setTickets] = useState<any[]>([]);
//   const [selectedTicket, setSelectedTicket] = useState<any>(null);
//   const [showCreate, setShowCreate] = useState(false);

//   // ✅ Filters
//   const [showOpen, setShowOpen] = useState(true);
//   const [showInProgress, setShowInProgress] = useState(true);
//   const [showClosed, setShowClosed] = useState(true);

//   const [search, setSearch] = useState("");

//   const fetchTickets = async () => {
//     const {
//       data: { session },
//     } = await supabase.auth.getSession();

//     if (!session) return;

//     const { data, error } = await supabase
//       .from("tickets")
//       .select(`*,ticket_updates (message, created_at)`)
//       .order("created_at", { ascending: false });

//     if (!error) setTickets(data || []);
//   };

//   useEffect(() => {
//     fetchTickets();

//     const channel = supabase
//       .channel("tickets-realtime")
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

//   // ✅ Clear Closed (hide only)
//   const clearClosedTickets = () => {
//     setShowClosed(false);
//   };

//   // ✅ Filter logic
//   const filteredTickets = tickets.filter((t) => {
//     const statusMatch =
//       (showOpen && t.status === "Open") ||
//       (showInProgress && t.status === "In Progress") ||
//       (showClosed && t.status === "Closed");

//     const searchMatch =
//       t.title?.toLowerCase().includes(search.toLowerCase()) ||
//       t.description?.toLowerCase().includes(search.toLowerCase());

//     return statusMatch && searchMatch;
//   });

//   return (
//     <div style={styles.page}>
//       <Header title="User Dashboard" />

//       <div style={styles.container}>
//         <TicketAnalytics tickets={filteredTickets} />

//         {/* ✅ FILTER BAR */}
//         <div style={styles.filterBar}>
//           <label>
//             <input
//               type="checkbox"
//               checked={showOpen}
//               onChange={() => setShowOpen(!showOpen)}
//             />
//             Open
//           </label>

//           <label>
//             <input
//               type="checkbox"
//               checked={showInProgress}
//               onChange={() => setShowInProgress(!showInProgress)}
//             />
//             In Progress
//           </label>

//           <label>
//             <input
//               type="checkbox"
//               checked={showClosed}
//               onChange={() => setShowClosed(!showClosed)}
//             />
//             Closed
//           </label>

//           {/* 🔍 Search */}
//           <input
//             type="text"
//             placeholder="Search tickets..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             style={styles.search}
//           />
//         </div>

//         {/* Buttons */}
//         <div style={{ marginTop: 10 }}>
//           <button
//             onClick={() => (window.location.href = "/closed-tickets")}
//             style={styles.btn}
//           >
//             View Closed Tickets
//           </button>

//           <button
//             onClick={clearClosedTickets}
//             style={{ ...styles.btn, background: "#dc2626" }}
//           >
//             Clear Closed Tickets
//           </button>
//         </div>

//         <button style={styles.addBtn} onClick={() => setShowCreate(true)}>
//           + Add New Ticket
//         </button>

//         <TicketList tickets={filteredTickets} onSelect={setSelectedTicket} />

//         {selectedTicket && (
//           <TicketDetails
//             ticket={selectedTicket}
//             isAdmin={false}
//             onClose={() => setSelectedTicket(null)}
//             onUpdated={fetchTickets}
//           />
//         )}

//         {showCreate && (
//           <CreateTicketModal
//             onClose={() => setShowCreate(false)}
//             onSuccess={fetchTickets}
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
//   filterBar: {
//     display: "flex",
//     gap: 20,
//     alignItems: "center",
//     marginBottom: 15,
//     flexWrap: "wrap",
//   },
//   search: {
//     padding: "8px 12px",
//     borderRadius: 6,
//     border: "1px solid #ccc",
//   },
//   addBtn: {
//     marginTop: 10,
//     marginBottom: 15,
//     padding: "10px 18px",
//     background: "#4f46e5",
//     color: "#fff",
//     border: "none",
//     borderRadius: 8,
//     cursor: "pointer",
//   },
//   btn: {
//     marginRight: 10,
//     padding: "10px 18px",
//     background: "#4f46e5",
//     color: "#fff",
//     border: "none",
//     borderRadius: 8,
//     cursor: "pointer",
//   },
// };


















// main code final last deploy
// import { useEffect, useState } from "react";
// import { supabase } from "../supabaseClient";
// import Header from "../components/Header";
// import TicketList from "../components/TicketList";
// import TicketDetails from "../components/TicketDetails";
// import CreateTicketModal from "../components/CreateTicketModal";
// import TicketAnalytics from "../components/TicketAnalytics";

// export default function UserDashboard() {
//   const [tickets, setTickets] = useState<any[]>([]);
//   const [selectedTicket, setSelectedTicket] = useState<any>(null);
//   const [showCreate, setShowCreate] = useState(false); // ✅ FIX

//   const fetchTickets = async () => {
//     const {
//       data: { session },
//     } = await supabase.auth.getSession();

//     if (!session) return;

//     const { data, error } = await supabase
//       .from("tickets")
//       .select(`*,ticket_updates (message, created_at)`)
//       //.eq("created_by", session.user.id)
//       //.order("updated_at", { ascending: false });
//       .order("created_at", { ascending: false });

//     if (!error) setTickets(data || []);
//   };

//   // useEffect(() => {
//   //   fetchTickets();
//   // }, []);
//   useEffect(() => {
//   fetchTickets();

//   const channel = supabase
//     .channel("tickets-realtime")
//     .on(
//       "postgres_changes",
//       { event: "*", schema: "public", table: "tickets" },
//       () => {
//         fetchTickets(); // 🔥 auto refresh
//       }
//     )
//     .subscribe();

//   return () => {
//     supabase.removeChannel(channel);
//   };
// }, []);


//   return (
//     <div style={styles.page}>
//       <Header title="User Dashboard" />

//       <div style={styles.container}>
//         <TicketAnalytics tickets={tickets}/>
//         <button
//                  onClick={() => window.location.href="/closed-tickets"}
//                  style={{
//                  marginTop:20,
//                  marginLeft:15,
//                  marginRight:15,
//                  padding:"10px 18px",
//                  background:"#4f46e5",
//                  //background:"#64748b",
//                  color:"#fff",
//                  border:"none",
//                  borderRadius:8,
//                  cursor:"pointer"
// }}
// >
// Closed Tickets
// </button>
//         {/* ✅ ADD NEW TICKET BUTTON */}
//         <button style={styles.addBtn} onClick={() => setShowCreate(true)}>
//           + Add New Ticket
//         </button> 

//         <TicketList tickets={tickets} onSelect={setSelectedTicket} />

//         {selectedTicket && (
//           <TicketDetails
//             ticket={selectedTicket}
//             isAdmin={false}
//             onClose={() => setSelectedTicket(null)}
//             onUpdated={fetchTickets}
//           />
//         )}

//         {showCreate && (
//           <CreateTicketModal
//             onClose={() => setShowCreate(false)}
//             onSuccess={fetchTickets} // ✅ correct prop
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
//   addBtn: {
//     margintop: 20,
//     marginBottom: 15,
//     padding: "10px 18px",
//     background: "#4f46e5",
//     color: "#fff",
//     border: "none",
//     borderRadius: 8,
//     cursor: "pointer",
//   },
// };
























// final working code before addind export and closed ticket page
// import { useEffect, useState } from "react";
// import { supabase } from "../supabaseClient";
// import Header from "../components/Header";
// import TicketList from "../components/TicketList";
// import TicketDetails from "../components/TicketDetails";
// import CreateTicketModal from "../components/CreateTicketModal";

// export default function UserDashboard() {
//   const [tickets, setTickets] = useState<any[]>([]);
//   const [selectedTicket, setSelectedTicket] = useState<any>(null);
//   const [showCreate, setShowCreate] = useState(false); // ✅ FIX

//   const fetchTickets = async () => {
//     const {
//       data: { session },
//     } = await supabase.auth.getSession();

//     if (!session) return;

//     const { data, error } = await supabase
//       .from("tickets")
//       .select(`*,ticket_updates (message, created_at)`)
//       //.eq("created_by", session.user.id)
//       //.order("updated_at", { ascending: false });
//       .order("created_at", { ascending: false });

//     if (!error) setTickets(data || []);
//   };

//   // useEffect(() => {
//   //   fetchTickets();
//   // }, []);
//   useEffect(() => {
//   fetchTickets();

//   const channel = supabase
//     .channel("tickets-realtime")
//     .on(
//       "postgres_changes",
//       { event: "*", schema: "public", table: "tickets" },
//       () => {
//         fetchTickets(); // 🔥 auto refresh
//       }
//     )
//     .subscribe();

//   return () => {
//     supabase.removeChannel(channel);
//   };
// }, []);


//   return (
//     <div style={styles.page}>
//       <Header title="User Dashboard" />

//       <div style={styles.container}>
//         {/* ✅ ADD NEW TICKET BUTTON */}
//         <button style={styles.addBtn} onClick={() => setShowCreate(true)}>
//           + Add New Ticket
//         </button>

//         <TicketList tickets={tickets} onSelect={setSelectedTicket} />

//         {selectedTicket && (
//           <TicketDetails
//             ticket={selectedTicket}
//             isAdmin={false}
//             onClose={() => setSelectedTicket(null)}
//             onUpdated={fetchTickets}
//           />
//         )}

//         {showCreate && (
//           <CreateTicketModal
//             onClose={() => setShowCreate(false)}
//             onSuccess={fetchTickets} // ✅ correct prop
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
//   addBtn: {
//     marginBottom: 15,
//     padding: "10px 18px",
//     background: "#4f46e5",
//     color: "#fff",
//     border: "none",
//     borderRadius: 8,
//     cursor: "pointer",
//   },
// };

