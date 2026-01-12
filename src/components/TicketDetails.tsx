import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

type Props = {
  ticket: any;
  onClose: () => void;
  isAdmin: boolean;
  onUpdated: () => void;
};

export default function TicketDetails({
  ticket,
  onClose,
  isAdmin,
  onUpdated,
}: Props) {
  const [updates, setUpdates] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(ticket.status);
  const [loading, setLoading] = useState(false);

  const fetchUpdates = async () => {
    const { data } = await supabase
      .from("ticket_updates")
      .select("*")
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: true });

    setUpdates(data || []);
  };

  useEffect(() => {
    fetchUpdates();
  }, [ticket.id]);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: userData } = await supabase
      .from("users")
      .select("name")
      .eq("id", session.user.id)
      .single();

    const finalName = userData?.name || "Unknown";

    await supabase.from("ticket_updates").insert({
      ticket_id: ticket.id,
      message,
      status,
      created_by: session.user.id,
      created_by_role: isAdmin ? "admin" : "user",
      created_by_name: finalName,
    });

    await supabase
      .from("tickets")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticket.id);

    setMessage("");
    fetchUpdates();
    onUpdated();
    setLoading(false);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3>{ticket.ticket_no}</h3>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.card}>
          <Info label="Title" value={ticket.title} />
          <Info label="Description" value={ticket.description} />
          <Info label="Current Status" value={ticket.status} badge />
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={styles.select}
        >
          <option>Open</option>
          <option>In Progress</option>
          <option>Resolved</option>
          <option>Closed</option>
        </select>

        <h4>Update History</h4>

        <div style={styles.chat}>
          {updates.map((u) => (
            <div key={u.id} style={styles.msg}>
              <div style={styles.msgHeader}>
                <strong>{u.created_by_name}</strong>
                <span style={styles.time}>
                  {new Date(u.created_at).toLocaleString()}
                </span>
              </div>
              <p>{u.message}</p>
              {u.status && (
                <span style={styles.status}>Status → {u.status}</span>
              )}
            </div>
          ))}
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your comment..."
          style={styles.textarea}
        />

        <div style={styles.actions}>
          <button onClick={onClose} style={styles.secondaryBtn}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} style={styles.primaryBtn}>
            {loading ? "Saving..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, badge }: any) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={styles.label}>{label}</div>
      <div style={badge ? styles.badge : styles.value}>{value}</div>
    </div>
  );
}

const styles: any = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  modal: {
    width: "650px",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#fff",
    borderRadius: 14,
    padding: 24,
  },
  header: { display: "flex", justifyContent: "space-between" },
  closeBtn: { border: "none", background: "transparent", fontSize: 20 },
  card: { background: "#f9fafb", padding: 14, borderRadius: 10 },
  label: { fontSize: 12, color: "#6b7280" },
  value: { padding: 8, border: "1px solid #e5e7eb", borderRadius: 6 },
  badge: { background: "#dbeafe", padding: "6px 14px", borderRadius: 20 },
  select: { width: "100%", padding: 8, marginBottom: 10 },
  chat: { maxHeight: 220, overflowY: "auto", border: "1px solid #e5e7eb", padding: 10 },
  msg: { background: "#f1f5f9", padding: 12, borderRadius: 8, marginBottom: 8 },
  msgHeader: { display: "flex", justifyContent: "space-between" },
  time: { color: "#6b7280" },
  status: { fontSize: 12, color: "#2563eb" },
  textarea: { width: "100%", height: 80, marginTop: 10, padding: 10 },
  actions: { display: "flex", justifyContent: "flex-end", gap: 10 },
  primaryBtn: { background: "#4f46e5", color: "#fff", padding: "10px 18px", borderRadius: 8 },
  secondaryBtn: { background: "#e5e7eb", padding: "10px 18px", borderRadius: 8 },
};






















// import { useEffect, useState } from "react";
// import { supabase } from "../supabaseClient";

// type Props = {
//   ticket: any;
//   onClose: () => void;
//   isAdmin: boolean;
//   onUpdated: () => void;
// };

// export default function TicketDetails({
//   ticket,
//   onClose,
//   isAdmin,
//   onUpdated,
// }: Props) {
//   const [updates, setUpdates] = useState<any[]>([]);
//   const [message, setMessage] = useState("");
//   const [status, setStatus] = useState(ticket.status);
//   const [loading, setLoading] = useState(false);
//   const [userName, setUserName] = useState("");

//   /* 🔹 Fetch logged-in user name */
//   const fetchUserName = async () => {
//     const {
//       data: { session },
//     } = await supabase.auth.getSession();

//     if (!session) return;

//     const { data, error } = await supabase
//       .from("users")
//       .select("name")
//       .eq("id", session.user.id)
//       .maybeSingle();

//     if (!error) {
//       setUserName(data?.name || "Unknown");
//     }
//   };

//   /* 🔹 Fetch chat history */
//   const fetchUpdates = async () => {
//     const { data, error } = await supabase
//       .from("ticket_updates")
//       .select("*")
//       .eq("ticket_id", ticket.id)
//       .order("created_at", { ascending: true });

//     if (!error) {
//       setUpdates(data || []);
//     }
//   };

//   useEffect(() => {
//     fetchUserName();
//     fetchUpdates();
//   }, []);

//   /* 🔹 Submit comment + status */
//   const handleSubmit = async () => {
//     if (!message.trim()) return;

//     setLoading(true);

//     const {
//       data: { session },
//     } = await supabase.auth.getSession();

//     if (!session) {
//       alert("Session expired");
//       setLoading(false);
//       return;
//     }

//     /* 1️⃣ Insert remark / comment */
//     const { error: insertError } = await supabase
//       .from("ticket_updates")
//       .insert({
//         ticket_id: ticket.id,
//         message: message,
//         status: status,
//         created_by: session.user.id,
//         created_by_role: isAdmin ? "admin" : "user",
//         created_by_name: userName,
//       });

//     if (insertError) {
//       console.error("INSERT ERROR:", insertError.message);
//       alert(insertError.message);
//       setLoading(false);
//       return;
//     }

//     /* 2️⃣ Update ticket status */
//     if (status !== ticket.status) {
//       const { error: statusError } = await supabase
//         .from("tickets")
//         .update({ status })
//         .eq("id", ticket.id);

//       if (statusError) {
//         console.error("STATUS UPDATE ERROR:", statusError.message);
//       }
//     }

//     setMessage("");
//     fetchUpdates();
//     onUpdated();
//     setLoading(false);
//   };

//   return (
//     <div style={styles.overlay}>
//       <div style={styles.modal}>
//         <div style={styles.header}>
//           <h3>{ticket.ticket_no}</h3>
//           <button onClick={onClose} style={styles.closeBtn}>✕</button>
//         </div>

//         <div style={styles.card}>
//           <Info label="Title" value={ticket.title} />
//           <Info label="Description" value={ticket.description} />
//           <Info label="Current Status" value={ticket.status} badge />
//         </div>

//         {/* ✅ USER + ADMIN both can update status */}
//         <select
//           value={status}
//           onChange={(e) => setStatus(e.target.value)}
//           style={styles.select}
//         >
//           <option>Open</option>
//           <option>In Progress</option>
//           <option>Resolved</option>
//           <option>Closed</option>
//         </select>

//         <h4>Update History</h4>

//         <div style={styles.chat}>
//           {updates.length === 0 && (
//             <p style={styles.muted}>No updates yet</p>
//           )}

//           {updates.map((u) => (
//             <div key={u.id} style={styles.msg}>
//               <div style={styles.msgHeader}>
//                 <strong>{u.created_by_name}</strong>
//                 <span style={styles.time}>
//                   {new Date(u.created_at).toLocaleString()}
//                 </span>
//               </div>

//               <p>{u.message}</p>

//               {u.status && (
//                 <span style={styles.status}>
//                   Status → {u.status}
//                 </span>
//               )}
//             </div>
//           ))}
//         </div>

//         <textarea
//           value={message}
//           onChange={(e) => setMessage(e.target.value)}
//           placeholder="Write your comment..."
//           style={styles.textarea}
//         />

//         <div style={styles.actions}>
//           <button onClick={onClose} style={styles.secondaryBtn}>
//             Cancel
//           </button>
//           <button
//             onClick={handleSubmit}
//             disabled={loading}
//             style={styles.primaryBtn}
//           >
//             {loading ? "Saving..." : "Submit"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* 🔹 Small info field */
// function Info({ label, value, badge }: any) {
//   return (
//     <div style={{ marginBottom: 10 }}>
//       <div style={styles.label}>{label}</div>
//       <div style={badge ? styles.badge : styles.value}>{value}</div>
//     </div>
//   );
// }

// /* 🎨 Styles */
// const styles: any = {
//   overlay: {
//     position: "fixed",
//     inset: 0,
//     background: "rgba(0,0,0,0.6)",
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//     zIndex: 999,
//   },
//   modal: {
//     width: "650px",
//     maxHeight: "90vh",
//     overflowY: "auto",
//     background: "#fff",
//     borderRadius: 14,
//     padding: 24,
//   },
//   header: {
//     display: "flex",
//     justifyContent: "space-between",
//   },
//   closeBtn: {
//     border: "none",
//     background: "transparent",
//     fontSize: 20,
//     cursor: "pointer",
//   },
//   card: {
//     background: "#f9fafb",
//     padding: 14,
//     borderRadius: 10,
//     marginBottom: 10,
//   },
//   label: { fontSize: 12, color: "#6b7280" },
//   value: { padding: 8, border: "1px solid #e5e7eb", borderRadius: 6 },
//   badge: {
//     background: "#dbeafe",
//     padding: "6px 14px",
//     borderRadius: 20,
//     fontWeight: 600,
//   },
//   select: {
//     width: "100%",
//     padding: 8,
//     marginBottom: 10,
//   },
//   chat: {
//     maxHeight: 220,
//     overflowY: "auto",
//     border: "1px solid #e5e7eb",
//     padding: 10,
//     borderRadius: 10,
//   },
//   msg: {
//     background: "#f1f5f9",
//     padding: 12,
//     borderRadius: 8,
//     marginBottom: 8,
//   },
//   msgHeader: {
//     display: "flex",
//     justifyContent: "space-between",
//     fontSize: 13,
//     marginBottom: 4,
//   },
//   time: { color: "#6b7280" },
//   status: { fontSize: 12, color: "#2563eb" },
//   textarea: {
//     width: "100%",
//     height: 80,
//     marginTop: 10,
//     padding: 10,
//   },
//   actions: {
//     display: "flex",
//     justifyContent: "flex-end",
//     gap: 10,
//     marginTop: 12,
//   },
//   primaryBtn: {
//     background: "#4f46e5",
//     color: "#fff",
//     padding: "10px 18px",
//     borderRadius: 8,
//     border: "none",
//     cursor: "pointer",
//   },
//   secondaryBtn: {
//     background: "#e5e7eb",
//     padding: "10px 18px",
//     borderRadius: 8,
//     border: "none",
//     cursor: "pointer",
//   },
//   muted: {
//     textAlign: "center",
//     color: "#9ca3af",
//   },
// };