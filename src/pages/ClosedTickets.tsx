import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Header from "../components/Header";
import TicketList from "../components/TicketList";
import { useNavigate } from "react-router-dom";

export default function ClosedTickets() {

  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClosedTickets = async () => {

    const { data, error } = await supabase
      .from("tickets")
      .select(`
        *,
        ticket_updates (
          message,
          created_at
        )
      `)
      .eq("status", "Closed")
      .order("created_at", { ascending: false });

    if (!error) {
      setTickets(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchClosedTickets();
  }, []);

  const navigate = useNavigate();

  return (
    <div style={{ padding: 30 }}>

      <Header title="Closed Tickets Archive" />
      <button
  onClick={() => navigate("/user")}
  style={{
    marginBottom: "15px",
    padding: "10px 16px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer"
  }}
>
🏠 Home
</button>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <TicketList tickets={tickets} />
      )}

    </div>
  );
}
















// import { useEffect, useState } from "react";
// import { supabase } from "../supabaseClient";
// import Header from "../components/Header";

// export default function ClosedTickets() {
//   const [tickets, setTickets] = useState<any[]>([]);

//   const fetchClosedTickets = async () => {
//     const { data, error } = await supabase
//       .from("tickets")
//       .select("*")
//       .eq("status", "Closed")
//       .order("created_at", { ascending: false });

//     if (!error) setTickets(data || []);
//   };

//   useEffect(() => {
//     fetchClosedTickets();
//   }, []);

//   return (
//     <div style={{ padding: 30 }}>
//       <Header title="Closed Tickets Archive" />

//       <table style={{ width: "100%", background: "#fff" }}>
//         <thead>
//           <tr>
//             <th>Ticket No</th>
//             <th>Title</th>
//             <th>Description</th>
//             <th>Status</th>
//             <th>Priority</th>
//             <th>Email</th>
//             <th>HOD Email</th>
//             <th>Remark</th>
//             <th>Date</th>
//           </tr>
//         </thead>

//         <tbody>
//           {tickets.map((t) => (
//             <tr key={t.id}>
//               <td>{t.ticket_no}</td>
//               <td>{t.title}</td>
//               <td>{t.description}</td>
//               <td>{t.status}</td>
//               <td>{t.priority}</td>
//               <td>{t.email}</td>
//               <td>{t.hod_email}</td>
//               <td>{t.remark}</td>
//               <td>{new Date(t.created_at).toLocaleString()}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }