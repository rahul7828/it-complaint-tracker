import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Header from "../components/Header";
import TicketList from "../components/TicketList";
import TicketDetails from "../components/TicketDetails";
import CreateTicketModal from "../components/CreateTicketModal";
import TicketAnalytics from "../components/TicketAnalytics";

export default function UserDashboard() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);

  // ✅ Filters
  const [showOpen, setShowOpen] = useState(true);
  const [showInProgress, setShowInProgress] = useState(true);
  const [showClosed, setShowClosed] = useState(true);

  const [search, setSearch] = useState("");

  const fetchTickets = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    const { data, error } = await supabase
      .from("tickets")
      .select(`*,ticket_updates (message, created_at)`)
      .order("created_at", { ascending: false });

    if (!error) setTickets(data || []);
  };

  useEffect(() => {
    fetchTickets();

    const channel = supabase
      .channel("tickets-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ✅ Clear Closed (hide only)
  const clearClosedTickets = () => {
    setShowClosed(false);
  };

  // ✅ Filter logic
  const filteredTickets = tickets.filter((t) => {
    const statusMatch =
      (showOpen && t.status === "Open") ||
      (showInProgress && t.status === "In Progress") ||
      (showClosed && t.status === "Closed");

    const searchMatch =
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());

    return statusMatch && searchMatch;
  });

  return (
    <div style={styles.page}>
      <Header title="User Dashboard" />

      <div style={styles.container}>
        <TicketAnalytics tickets={filteredTickets} />

        {/* ✅ FILTER BAR */}
        <div style={styles.filterBar}>
          <label>
            <input
              type="checkbox"
              checked={showOpen}
              onChange={() => setShowOpen(!showOpen)}
            />
            Open
          </label>

          <label>
            <input
              type="checkbox"
              checked={showInProgress}
              onChange={() => setShowInProgress(!showInProgress)}
            />
            In Progress
          </label>

          <label>
            <input
              type="checkbox"
              checked={showClosed}
              onChange={() => setShowClosed(!showClosed)}
            />
            Closed
          </label>

          {/* 🔍 Search */}
          <input
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.search}
          />
        </div>

        {/* Buttons */}
        <div style={{ marginTop: 10 }}>
          <button
            onClick={() => (window.location.href = "/closed-tickets")}
            style={styles.btn}
          >
            View Closed Tickets
          </button>

          <button
            onClick={clearClosedTickets}
            style={{ ...styles.btn, background: "#dc2626" }}
          >
            Clear Closed Tickets
          </button>
        </div>

        <button style={styles.addBtn} onClick={() => setShowCreate(true)}>
          + Add New Ticket
        </button>

        <TicketList tickets={filteredTickets} onSelect={setSelectedTicket} />

        {selectedTicket && (
          <TicketDetails
            ticket={selectedTicket}
            isAdmin={false}
            onClose={() => setSelectedTicket(null)}
            onUpdated={fetchTickets}
          />
        )}

        {showCreate && (
          <CreateTicketModal
            onClose={() => setShowCreate(false)}
            onSuccess={fetchTickets}
          />
        )}
      </div>
    </div>
  );
}

const styles: any = {
  page: {
    minHeight: "100vh",
    background: "#f1f5f9",
  },
  container: {
    padding: 30,
  },
  filterBar: {
    display: "flex",
    gap: 20,
    alignItems: "center",
    marginBottom: 15,
    flexWrap: "wrap",
  },
  search: {
    padding: "8px 12px",
    borderRadius: 6,
    border: "1px solid #ccc",
  },
  addBtn: {
    marginTop: 10,
    marginBottom: 15,
    padding: "10px 18px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
  btn: {
    marginRight: 10,
    padding: "10px 18px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
};


















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

