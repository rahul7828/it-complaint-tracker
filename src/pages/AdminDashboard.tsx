import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Header from "../components/Header";
import TicketList from "../components/TicketList";
import TicketDetails from "../components/TicketDetails";

export default function AdminDashboard() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  const fetchTickets = async () => {
    const { data, error } = await supabase
      .from("tickets")
      .select(`*, ticket_updates (message, created_at)`)
      .order("created_at", { ascending: false }); // ✅ SAFE ORDER

    if (!error) setTickets(data || []);
  };

  useEffect(() => {
    fetchTickets();

    // 🔥 REALTIME LISTENER (ADMIN)
    const channel = supabase
      .channel("admin-tickets-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        () => {
          fetchTickets(); // auto refresh
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div style={styles.page}>
      <Header title="Admin Dashboard" />

      <div style={styles.container}>
        <TicketList tickets={tickets} onSelect={setSelectedTicket} />

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

const styles: any = {
  page: {
    minHeight: "100vh",
    background: "#f1f5f9",
  },
  container: {
    padding: 30,
  },
};
