import { useState } from "react";
import { supabase } from "../supabaseClient";
import { sendTicketEmail } from "../utils/sendEmail";

type Props = {
  ticket: any;
  onClose: () => void;
  onSuccess: () => void;
};

export default function EditTicketModal({
  ticket,
  onClose,
  onSuccess,
}: Props) {
  const [title, setTitle] =
    useState(ticket.title || "");

  const [
    description,
    setDescription,
  ] = useState(
    ticket.description || ""
  );

  const [email, setEmail] =
    useState(ticket.email || "");

  const [hodEmail, setHodEmail] =
    useState(
      ticket.hod_email || ""
    );

  const [priority, setPriority] =
    useState(
      ticket.priority || "Medium"
    );

  const [loading, setLoading] =
    useState(false);

  const handleUpdate = async () => {
  try {
    setLoading(true);

    const { error } = await supabase
      .from("tickets")
      .update({
        title,
        description,
        email,
        hod_email: hodEmail,
        priority,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticket.id);

    if (error) throw error;

    await sendTicketEmail({
      ticket_no: ticket.ticket_no,
      title,
      description,
      priority,
      status: ticket.status,
      user_email: email,
      hod_email: hodEmail,
      remark: "Ticket details updated",
    });

    alert(
      "Ticket Updated Successfully ✅"
    );

    onSuccess();
    onClose();
  } catch (err: any) {
    alert(
      err.message ||
      "Update Failed"
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.header}>
  <div>
    <h2 style={styles.ticketHeading}>
      {ticket.ticket_no}
    </h2>

    <p style={styles.ticketSubHeading}>
      Edit Ticket Details
    </p>
  </div>
</div>




        {/* <h2 style={styles.header}>
          Edit Ticket
        </h2> */}

        <div style={styles.content}>

  {/* <div style={styles.ticketBox}>
    <span style={styles.ticketLabel}>
      Ticket Number
    </span>

    <div style={styles.ticketNo}>
      {ticket.ticket_no}
    </div>
  </div> */}

  <label style={styles.fieldLabel}>
    User Email
  </label>

  <input
    style={styles.input}
    value={email}
    onChange={(e) =>
      setEmail(e.target.value)
    }
  />

  <label style={styles.fieldLabel}>
    Title
  </label>

  <input
    style={styles.input}
    value={title}
    onChange={(e) =>
      setTitle(e.target.value)
    }
  />

  <label style={styles.fieldLabel}>
    Description
  </label>

  <textarea
    style={{
      ...styles.input,
      height: "80px",
      resize: "none",
    }}
    value={description}
    onChange={(e) =>
      setDescription(
        e.target.value
      )
    }
  />

  <label style={styles.fieldLabel}>
    HOD Email
  </label>

  <input
    style={styles.input}
    value={hodEmail}
    onChange={(e) =>
      setHodEmail(
        e.target.value
      )
    }
  />

  <label style={styles.fieldLabel}>
    Priority
  </label>

  <select
    style={styles.input}
    value={priority}
    onChange={(e) =>
      setPriority(
        e.target.value
      )
    }
  >
    <option value="High">
      High
    </option>

    <option value="Medium">
      Medium
    </option>

    <option value="Low">
      Low
    </option>

    <option value="Urgent">
      Urgent
    </option>
  </select>

</div>

        <div style={styles.actions}>
          <button
            style={styles.cancel}
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            style={styles.submit}
            disabled={loading}
            onClick={handleUpdate}
          >
            {loading
              ? "Updating..."
              : "Update Ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: any = {
  overlay: {
    position: "fixed",
    inset: 0,
    background:
      "rgba(0,0,0,0.7)",
    display: "flex",
    justifyContent:
      "center",
    alignItems: "center",
    zIndex: 10000,
  },

  card: {
    width: "500px",
    maxHeight: "85vh",
    background: "#111827",
    borderRadius: "20px",
    overflow: "auto",
  },

  header: {
    color: "#fff",
    textAlign: "left",
    padding: "20px",
    margin: 0,
    borderBottom:
      "1px solid rgba(255,255,255,0.08)",
  },

  content: {
    padding: "15px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  input: {
    padding: "12px",
    borderRadius: "10px",
    border:
      "1px solid rgba(255,255,255,0.08)",
    background: "#0f172a",
    color: "#fff",
    outline: "none",
  },

  actions: {
    display: "flex",
    justifyContent:
      "space-between",
    padding: "20px",
    borderTop:
      "1px solid rgba(255,255,255,0.08)",
  },

  cancel: {
    background: "#334155",
    color: "#fff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "10px",
    cursor: "pointer",
  },

  submit: {
    background: "#10b981",
    color: "#fff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "10px",
    cursor: "pointer",
  },

//   ticketBox: {
//   background: "#0f172a",
//   border:
//     "1px solid rgba(255,255,255,0.08)",
//   borderRadius: "12px",
//   padding: "10px",
//   marginBottom: "0px",
// },

ticketLabel: {
  color: "#94a3b8",
  fontSize: "12px",
  display: "block",
  marginBottom: "6px",
},

// ticketNo: {
//   color: "#10b981",
//   fontWeight: 700,
//   fontSize: "18px",
// },

ticketHeading: {
  margin: 0,
  color: "#fff",
  fontSize: "28px",
  fontWeight: 700,
  textAlign: "left",
},

ticketSubHeading: {
  margin: "5px 0 0 0",
  color: "#94a3b8",
  fontSize: "13px",
  textAlign: "left",
},

fieldLabel: {
  color: "#cbd5e1",
  fontSize: "13px",
  fontWeight: 600,
  marginBottom: "-2px",
},

};




























// import { useState } from "react";
// import { supabase } from "../supabaseClient";

// type Props = {
//   ticket: any;
//   onClose: () => void;
//   onSuccess: () => void;
// };

// export default function EditTicketModal({
//   ticket,
//   onClose,
//   onSuccess,
// }: Props) {
//   const [title, setTitle] =
//     useState(ticket.title || "");

//   const [
//     description,
//     setDescription,
//   ] = useState(
//     ticket.description || ""
//   );

//   const [email, setEmail] =
//     useState(ticket.email || "");

//   const [hodEmail, setHodEmail] =
//     useState(
//       ticket.hod_email || ""
//     );

//   const [priority, setPriority] =
//     useState(
//       ticket.priority || "Medium"
//     );

//   const [loading, setLoading] =
//     useState(false);

//   const handleUpdate =
//     async () => {
//       try {
//         setLoading(true);

//         const { error } =
//           await supabase
//             .from("tickets")
//             .update({
//               title,
//               description,
//               email,
//               hod_email: hodEmail,
//               priority,
//               updated_at:
//                 new Date().toISOString(),
//             })
//             .eq("id", ticket.id);

//         if (error) throw error;

//         alert(
//           "Ticket Updated Successfully ✅"
//         );

//         onSuccess();
//         onClose();
//       } catch (err: any) {
//         alert(
//           err.message ||
//             "Update Failed"
//         );
//       } finally {
//         setLoading(false);
//       }
//     };

//   return (
//     <div style={styles.overlay}>
//       <div style={styles.card}>
//         <h2 style={styles.header}>
//           Edit Ticket
//         </h2>

//         <div style={styles.content}>
//           <input
//             style={styles.input}
//             value={email}
//             onChange={(e) =>
//               setEmail(
//                 e.target.value
//               )
//             }
//             placeholder="User Email"
//           />

//           <input
//             style={styles.input}
//             value={title}
//             onChange={(e) =>
//               setTitle(
//                 e.target.value
//               )
//             }
//             placeholder="Title"
//           />

//           <textarea
//             style={{
//               ...styles.input,
//               height: "120px",
//               resize: "none",
//             }}
//             value={description}
//             onChange={(e) =>
//               setDescription(
//                 e.target.value
//               )
//             }
//             placeholder="Description"
//           />

//           <input
//             style={styles.input}
//             value={hodEmail}
//             onChange={(e) =>
//               setHodEmail(
//                 e.target.value
//               )
//             }
//             placeholder="HOD Email"
//           />

//           <select
//             style={styles.input}
//             value={priority}
//             onChange={(e) =>
//               setPriority(
//                 e.target.value
//               )
//             }
//           >
//             <option value="High">
//               High
//             </option>

//             <option value="Medium">
//               Medium
//             </option>

//             <option value="Low">
//               Low
//             </option>

//             <option value="Urgent">
//               Urgent
//             </option>
//           </select>
//         </div>

//         <div style={styles.actions}>
//           <button
//             style={styles.cancel}
//             onClick={onClose}
//           >
//             Cancel
//           </button>

//           <button
//             style={styles.submit}
//             disabled={loading}
//             onClick={handleUpdate}
//           >
//             {loading
//               ? "Updating..."
//               : "Update Ticket"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// const styles: any = {
//   overlay: {
//     position: "fixed",
//     inset: 0,
//     background:
//       "rgba(0,0,0,0.7)",
//     display: "flex",
//     justifyContent:
//       "center",
//     alignItems: "center",
//     zIndex: 10000,
//   },

//   card: {
//     width: "500px",
//     background: "#111827",
//     borderRadius: "20px",
//     overflow: "hidden",
//   },

//   header: {
//     color: "#fff",
//     textAlign: "center",
//     padding: "20px",
//     margin: 0,
//     borderBottom:
//       "1px solid rgba(255,255,255,0.08)",
//   },

//   content: {
//     padding: "20px",
//     display: "flex",
//     flexDirection: "column",
//     gap: "15px",
//   },

//   input: {
//     padding: "12px",
//     borderRadius: "10px",
//     border:
//       "1px solid rgba(255,255,255,0.08)",
//     background: "#0f172a",
//     color: "#fff",
//     outline: "none",
//   },

//   actions: {
//     display: "flex",
//     justifyContent:
//       "space-between",
//     padding: "20px",
//     borderTop:
//       "1px solid rgba(255,255,255,0.08)",
//   },

//   cancel: {
//     background: "#334155",
//     color: "#fff",
//     border: "none",
//     padding: "10px 18px",
//     borderRadius: "10px",
//     cursor: "pointer",
//   },

//   submit: {
//     background: "#10b981",
//     color: "#fff",
//     border: "none",
//     padding: "10px 18px",
//     borderRadius: "10px",
//     cursor: "pointer",
//   },
// };