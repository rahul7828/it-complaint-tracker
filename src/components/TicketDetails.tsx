import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { sendTicketEmail } from "../utils/sendEmail";

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

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    const { data: userData } = await supabase
      .from("users")
      .select("name")
      .eq("id", session.user.id)
      .single();

    const finalName = userData?.name || "Unknown";

    const { data: insertedUpdate } = await supabase
      .from("ticket_updates")
      .insert({
        ticket_id: ticket.id,
        message,
        status,
        created_by: session.user.id,
        created_by_role: isAdmin ? "admin" : "user",
        created_by_name: finalName,
      })
      .select()
      .single();

    await supabase
      .from("tickets")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticket.id);

    await sendTicketEmail({
      ticket_no: ticket.ticket_no,
      title: ticket.title,
      description: ticket.description,
      department: "IT",
      priority: ticket.priority,
      status: status,
      user_email: ticket.email,
      hod_email: ticket.hod_email,
      is_admin: isAdmin,
      remark: insertedUpdate?.message || "Updated",
    });

    setMessage("");
    fetchUpdates();
    onUpdated();
    setLoading(false);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.ticketNo}>
              {ticket.ticket_no}
            </h2>

            <p style={styles.subText}>
              Ticket Details & Updates
            </p>
          </div>

          <button
            onClick={onClose}
            style={styles.closeBtn}
          >
            ✕
          </button>
        </div>

        {/* INFO CARD */}
        <div style={styles.card}>
          <Info
            label="Title"
            value={ticket.title}
          />

          <Info
            label="Description"
            value={ticket.description}
          />

          <Info
            label="Current Status"
            value={ticket.status}
            badge
          />
        </div>

        {/* STATUS */}
        <div style={{ marginTop: 20 }}>
          <label style={styles.sectionLabel}>
            Change Status
          </label>

          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value)
            }
            style={styles.select}
          >
            <option>Open</option>
            <option>In Progress</option>
            <option>Resolved</option>
            <option>Closed</option>
          </select>
        </div>

        {/* HISTORY */}
        <div style={styles.historyHeader}>
          Update History
        </div>

        <div style={styles.chat}>
          {updates.length === 0 && (
            <div style={styles.empty}>
              No updates yet
            </div>
          )}

          {updates.map((u) => (
            <div key={u.id} style={styles.msg}>
              <div style={styles.msgHeader}>
                <strong
                  style={styles.userName}
                >
                  {u.created_by_name}
                </strong>

                <span style={styles.time}>
                  {new Date(
                    u.created_at
                  ).toLocaleString()}
                </span>
              </div>

              <p style={styles.msgText}>
                {u.message}
              </p>

              {u.status && (
                <span style={styles.status}>
                  Status → {u.status}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* COMMENT */}
        <div style={{ marginTop: 18 }}>
          <label style={styles.sectionLabel}>
            Add Comment
          </label>

          <textarea
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            placeholder="Write your comment here..."
            style={styles.textarea}
          />
        </div>

        {/* ACTIONS */}
        <div style={styles.actions}>
          <button
            onClick={onClose}
            style={styles.secondaryBtn}
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={styles.primaryBtn}
          >
            {loading
              ? "Saving..."
              : "Submit Update"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  badge,
}: any) {
  return (
    <div style={styles.infoItem}>
      <div style={styles.label}>
        {label}
      </div>

      <div
        style={
          badge
            ? styles.badge
            : styles.value
        }
      >
        {value}
      </div>
    </div>
  );
}

const styles: any = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.72)",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    padding: 20,
  },

  modal: {
    //width: "720px",
    width: "620px",
    //maxHeight: "92vh",
    maxHeight: "82vh",
    overflowY: "auto",
    background:
      "linear-gradient(to bottom, #111827, #0f172a)",
    borderRadius: 22,
    border:
      "1px solid rgba(255,255,255,0.08)",
    boxShadow:
      "0 20px 50px rgba(0,0,0,0.5)",
    padding: 24,
    color: "#fff",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 22,
    borderBottom:
      "1px solid rgba(255,255,255,0.08)",
    paddingBottom: 16,
  },

  ticketNo: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: "#fff",
  },

  subText: {
    margin: "6px 0 0 0",
    color: "#94a3b8",
    fontSize: 13,
  },

  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    border: "none",
    background: "#ef4444",
    color: "#fff",
    fontSize: 18,
    cursor: "pointer",
    fontWeight: 700,
  },

  card: {
    background: "#111827",
    border:
      "1px solid rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 18,
  },

  infoItem: {
    marginBottom: 16,
  },

  label: {
    fontSize: 13,
    color: "#94a3b8",
    marginBottom: 8,
    fontWeight: 500,
  },

  value: {
    background: "#0f172a",
    border:
      "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: "12px 14px",
    color: "#f8fafc",
    lineHeight: 1.5,
  },

  badge: {
    display: "inline-block",
    background:
      "rgba(16,185,129,0.15)",
    color: "#10b981",
    border:
      "1px solid rgba(16,185,129,0.35)",
    padding: "8px 16px",
    borderRadius: 999,
    fontWeight: 600,
    fontSize: 14,
  },

  sectionLabel: {
    display: "block",
    marginBottom: 10,
    color: "#cbd5e1",
    fontWeight: 600,
    fontSize: 14,
  },

  select: {
    width: "100%",
    background: "#111827",
    color: "#fff",
    border:
      "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: "14px",
    outline: "none",
    fontSize: 14,
  },

  historyHeader: {
    marginTop: 26,
    marginBottom: 14,
    fontSize: 20,
    fontWeight: 700,
    color: "#fff",
  },

  chat: {
    maxHeight: 180,
    overflowY: "auto",
    background: "#111827",
    border:
      "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 14,
  },

  empty: {
    textAlign: "center",
    color: "#94a3b8",
    padding: "20px 0",
  },

  msg: {
    background: "#0f172a",
    border:
      "1px solid rgba(255,255,255,0.06)",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
  },

  msgHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  userName: {
    color: "#fff",
    fontSize: 14,
  },

  time: {
    color: "#94a3b8",
    fontSize: 12,
  },

  msgText: {
    margin: "8px 0",
    color: "#e2e8f0",
    lineHeight: 1.5,
    fontSize: 14,
  },

  status: {
    display: "inline-block",
    marginTop: 6,
    fontSize: 12,
    color: "#38bdf8",
    background:
      "rgba(56,189,248,0.12)",
    padding: "6px 10px",
    borderRadius: 999,
  },

  textarea: {
    width: "100%",
    minHeight: 85,
    resize: "none",
    background: "#111827",
    color: "#fff",
    border:
      "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 14,
    outline: "none",
    fontSize: 14,
    boxSizing: "border-box",
  },

  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 24,
  },

  primaryBtn: {
    background: "#10b981",
    color: "#fff",
    border: "none",
    padding: "12px 20px",
    borderRadius: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
  },

  secondaryBtn: {
    background: "#1e293b",
    color: "#fff",
    border:
      "1px solid rgba(255,255,255,0.08)",
    padding: "12px 20px",
    borderRadius: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
  },
};

























//final working code before vaibhav sir design changes 21/05/26
// import { useEffect, useState } from "react";
// import { supabase } from "../supabaseClient";
// import { sendTicketEmail } from "../utils/sendEmail"; // ✅ ADD THIS


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

//   const fetchUpdates = async () => {
//     const { data } = await supabase
//       .from("ticket_updates")
//       .select("*")
//       .eq("ticket_id", ticket.id)
//       .order("created_at", { ascending: true });

//     setUpdates(data || []);
//   };

//   useEffect(() => {
//     fetchUpdates();
//   }, [ticket.id]);

//   const handleSubmit = async () => {
//     if (!message.trim()) return;
//     setLoading(true);

//     const { data: { session } } = await supabase.auth.getSession();
//     if (!session) return;

//     const { data: userData } = await supabase
//       .from("users")
//       .select("name")
//       .eq("id", session.user.id)
//       .single();

//     const finalName = userData?.name || "Unknown";

//     // await supabase.from("ticket_updates").insert({
//     //   ticket_id: ticket.id,
//     //   message,
//     //   status,
//     //   created_by: session.user.id,
//     //   created_by_role: isAdmin ? "admin" : "user",
//     //   created_by_name: finalName,
//     // });


    
// // new code added to update remark and send email notification 27/03/2026
//     const { data: insertedUpdate } = await supabase
//   .from("ticket_updates")
//   .insert({
//     ticket_id: ticket.id,
//     message,
//     status,
//     created_by: session.user.id,
//     created_by_role: isAdmin ? "admin" : "user",
//     created_by_name: finalName,
//   })
//   .select()
//   .single(); // ✅ VERY IMPORTANT




//     await supabase
//       .from("tickets")
//       .update({
//         status,
//         updated_at: new Date().toISOString(),
//       })
//       .eq("id", ticket.id);




// // email sent trigger after update with remark 27/03/2026
//     await sendTicketEmail({
//     ticket_no: ticket.ticket_no,
//     title: ticket.title,
//     description: ticket.description,
//     department: "IT",
//     priority: ticket.priority,
//     status: status,
//     user_email: ticket.email,
//     hod_email: ticket.hod_email,
//     is_admin: isAdmin,
//     // email: [ticket.email, ticket.hod_email],
//     remark: insertedUpdate?.message || "Updated",
//   });




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
//                 <span style={styles.status}>Status → {u.status}</span>
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
//           <button onClick={onClose} style={styles.secondaryBtn}>Cancel</button>
//           <button onClick={handleSubmit} disabled={loading} style={styles.primaryBtn}>
//             {loading ? "Saving..." : "Submit"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// function Info({ label, value, badge }: any) {
//   return (
//     <div style={{ marginBottom: 10 }}>
//       <div style={styles.label}>{label}</div>
//       <div style={badge ? styles.badge : styles.value}>{value}</div>
//     </div>
//   );
// }

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
//   header: { display: "flex", justifyContent: "space-between" },
//   closeBtn: { border: "none", background: "transparent", fontSize: 20 },
//   card: { background: "#f9fafb", padding: 14, borderRadius: 10 },
//   label: { fontSize: 12, color: "#6b7280" },
//   value: { padding: 8, border: "1px solid #e5e7eb", borderRadius: 6 },
//   badge: { background: "#dbeafe", padding: "6px 14px", borderRadius: 20 },
//   select: { width: "100%", padding: 8, marginBottom: 10 },
//   chat: { maxHeight: 220, overflowY: "auto", border: "1px solid #e5e7eb", padding: 10 },
//   msg: { background: "#f1f5f9", padding: 12, borderRadius: 8, marginBottom: 8 },
//   msgHeader: { display: "flex", justifyContent: "space-between" },
//   time: { color: "#6b7280" },
//   status: { fontSize: 12, color: "#2563eb" },
//   textarea: { width: "100%", height: 80, marginTop: 10, padding: 10 },
//   actions: { display: "flex", justifyContent: "flex-end", gap: 10 },
//   primaryBtn: { background: "#4f46e5", color: "#fff", padding: "10px 18px", borderRadius: 8 },
//   secondaryBtn: { background: "#e5e7eb", padding: "10px 18px", borderRadius: 8 },
// };


