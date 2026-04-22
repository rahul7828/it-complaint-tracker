import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Header from "../components/Header";
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
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  // ✅ Normalize
  const normalizeStatus = (val: any) =>
    val?.toString().toLowerCase().replace("_", " ").trim();

  const fetchTickets = async () => {
    const { data } = await supabase
      .from("tickets")
      .select(`*, ticket_updates (message, created_at)`)
      .order("created_at", { ascending: false });

    setTickets(data || []);
  };

  useEffect(() => {
    fetchTickets();

    const channel = supabase
      .channel("admin-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        fetchTickets
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // =========================
  // 🔥 STATUS COUNT
  // =========================
  const statusCounts: any = {
    open: 0,
    "in progress": 0,
    resolved: 0,
    closed: 0,
  };

  tickets.forEach((t) => {
    const status = normalizeStatus(t.status);
    if (statusCounts[status] !== undefined) {
      statusCounts[status]++;
    }
  });

  // =========================
  // 📊 STATS
  // =========================
  const total = tickets.length;
  const open = statusCounts["open"];
  const inProgress = statusCounts["in progress"];
  const resolved = statusCounts["resolved"];
  const closed = statusCounts["closed"];

  const statusData = [
    { name: "Open", value: open },
    { name: "In Progress", value: inProgress },
    { name: "Resolved", value: resolved },
    { name: "Closed", value: closed },
  ];

  return (
    <div style={styles.page}>
      <Header title="Admin Dashboard" />

      <div style={styles.container}>

        {/* ✅ CARDS */}
        <div style={styles.cards}>
          <Card title="Total Tickets" value={total} color="#6366f1" />
          <Card title="Open" value={open} color="#ef4444" />
          <Card title="In Progress" value={inProgress} color="#f59e0b" />
          <Card title="Resolved" value={resolved} color="#10b981" />
          <Card title="Closed" value={closed} color="#6b7280" />
        </div>

        {/* ✅ CHARTS */}
        <div style={styles.charts}>

          {/* 🔥 PREMIUM DONUT CHART */}
          <div style={styles.chartBox}>
            <h3>Status Distribution</h3>

            <PieChart width={320} height={260}>
              <Pie
                data={statusData}
                dataKey="value"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={3}
                label={(entry: any) => {
  const percent = entry?.percent ?? 0;
  const value = entry?.value ?? 0;

  return `${(percent * 100).toFixed(0)}% (${value})`;
}}
                isAnimationActive={true}
              >
                <Cell fill="#ef4444" />
                <Cell fill="#f59e0b" />
                <Cell fill="#10b981" />
                <Cell fill="#6b7280" />
              </Pie>

              {/* CENTER TEXT */}
              <text
                x="50%"
                y="45%"
                textAnchor="middle"
                style={{ fontSize: "20px", fontWeight: "bold" }}
              >
                {total}
              </text>

              <text
                x="50%"
                y="60%"
                textAnchor="middle"
                style={{ fontSize: "12px", fill: "#666" }}
              >
                Total Tickets
              </text>

              <Tooltip
                formatter={(value: any, name: any) => [
                  `${value} tickets`,
                  name,
                ]}
              />
            </PieChart>
          </div>

          {/* 📊 BAR CHART */}
          <div style={styles.chartBox}>
            <h3>Status Comparison</h3>

            <BarChart width={420} height={260} data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: any) => `${value} tickets`} />
              <Legend />
              <Bar
                dataKey="value"
                radius={[8, 8, 0, 0]}
                fill="#6366f1"
              />
            </BarChart>
          </div>

        </div>

        {/* 👥 BUTTON */}
        <button
          style={styles.userBtn}
          onClick={() => (window.location.href = "/users")}
        >
          👥 Manage Users
        </button>

        {/* 📋 LIST */}
        <TicketList tickets={tickets} onSelect={setSelectedTicket} />

        {/* 📄 DETAILS */}
        {selectedTicket && (
          <TicketDetails
            ticket={selectedTicket}
            isAdmin={true}
            onClose={() => setSelectedTicket(null)}
            onUpdated={fetchTickets}
          />
        )}
      </div>
    </div>
  );
}

// ✅ CARD
const Card = ({ title, value, color }: any) => (
  <div style={{ ...styles.card, borderTop: `4px solid ${color}` }}>
    <p>{title}</p>
    <h2>{value}</h2>
  </div>
);

// 🎨 STYLES
const styles: any = {
  page: {
    minHeight: "100vh",
    background: "#f1f5f9",
  },
  container: {
    padding: 30,
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 20,
    marginBottom: 30,
  },
  card: {
    background: "#fff",
    padding: 20,
    borderRadius: 12,
    textAlign: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  charts: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
    marginBottom: 30,
  },
  chartBox: {
    background: "#fff",
    padding: 20,
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    textAlign: "center",
    transition: "0.3s",
  },
  userBtn: {
    padding: "10px 18px",
    background: "#059669",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    marginBottom: "20px",
  },
};




















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
