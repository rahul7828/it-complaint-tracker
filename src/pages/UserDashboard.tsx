import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Header from "../components/Header";
import TicketList from "../components/TicketList";
import TicketDetails from "../components/TicketDetails";
import CreateTicketModal from "../components/CreateTicketModal";

export default function UserDashboard() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false); // ✅ FIX

  const fetchTickets = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    const { data, error } = await supabase
      .from("tickets")
      .select(`*,ticket_updates (message, created_at)`)
      //.eq("created_by", session.user.id)
      //.order("updated_at", { ascending: false });
      .order("created_at", { ascending: false });

    if (!error) setTickets(data || []);
  };

  // useEffect(() => {
  //   fetchTickets();
  // }, []);
  useEffect(() => {
  fetchTickets();

  const channel = supabase
    .channel("tickets-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "tickets" },
      () => {
        fetchTickets(); // 🔥 auto refresh
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);


  return (
    <div style={styles.page}>
      <Header title="User Dashboard" />

      <div style={styles.container}>
        {/* ✅ ADD NEW TICKET BUTTON */}
        <button style={styles.addBtn} onClick={() => setShowCreate(true)}>
          + Add New Ticket
        </button>

        <TicketList tickets={tickets} onSelect={setSelectedTicket} />

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
            onSuccess={fetchTickets} // ✅ correct prop
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
  addBtn: {
    marginBottom: 15,
    padding: "10px 18px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
};


