import { useState } from "react";
import { supabase } from "../supabaseClient";
import type { CSSProperties } from "react";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTicketModal({ onClose, onSuccess }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [hodEmail, setHodEmail] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);

    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (!session) {
      alert("User not logged in");
      setLoading(false);
      return;
    }

    /* -------- attachments -------- */
    let attachments: string[] = [];

    if (files) {
      for (const file of Array.from(files)) {
        const path = `${session.user.id}/${Date.now()}_${file.name}`;
        await supabase.storage.from("tickets").upload(path, file);
        attachments.push(path);
      }
    }

    /* -------- insert ticket -------- */
    const { error } = await supabase.from("tickets").insert({
      title,
      description,
      email: userEmail,
      hod_email: hodEmail,
      status: "Open",
      attachments,
      created_by: session.user.id,
      updated_at: new Date().toISOString(), // ✅ VERY IMPORTANT FIX
    });

    if (error) {
      alert(error.message);
    } else {
      onSuccess(); // 🔥 refresh dashboard
      onClose();
    }

    setLoading(false);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <h2 style={styles.heading}>Create New Ticket</h2>

        <input
          style={styles.input}
          placeholder="Your Email"
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
        />

        <input
          style={styles.input}
          placeholder="Ticket Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          style={{ ...styles.input, height: "90px" }}
          placeholder="Describe your issue"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          style={styles.input}
          placeholder="HOD Email"
          value={hodEmail}
          onChange={(e) => setHodEmail(e.target.value)}
        />

        <input
          style={styles.file}
          type="file"
          multiple
          onChange={(e) => setFiles(e.target.files)}
        />

        <div style={styles.actions}>
          <button style={styles.cancel} onClick={onClose}>
            Cancel
          </button>

          <button
            style={styles.submit}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- STYLES (UNCHANGED) ---------- */

const styles: Record<string, CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  card: {
    width: "430px",
    background: "#fff",
    borderRadius: "14px",
    padding: "25px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  heading: {
    marginBottom: "10px",
    color: "#1f2937",
    textAlign: "center",
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
  },
  file: {
    fontSize: "14px",
  },
  actions: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "15px",
  },
  cancel: {
    padding: "10px 16px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    background: "#f3f4f6",
    cursor: "pointer",
  },
  submit: {
    padding: "10px 18px",
    borderRadius: "8px",
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },
};




















// import { useState } from "react";
// import { supabase } from "../supabaseClient";
// import type { CSSProperties } from "react";

// interface Props {
//   onClose: () => void;
//   onSuccess: () => void;
// }

// export default function CreateTicketModal({ onClose, onSuccess }: Props) {
//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");
//   const [userEmail, setUserEmail] = useState("");
//   const [hodEmail, setHodEmail] = useState("");
//   const [files, setFiles] = useState<FileList | null>(null);
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async () => {
//     setLoading(true);

//     const { data } = await supabase.auth.getSession();
//     const session = data.session;

//     if (!session) {
//       alert("User not logged in");
//       setLoading(false);
//       return;
//     }

//     /* -------- attachments -------- */
//     let attachments: string[] = [];

//     if (files) {
//       for (const file of Array.from(files)) {
//         const path = `${session.user.id}/${Date.now()}_${file.name}`;
//         await supabase.storage.from("tickets").upload(path, file);
//         attachments.push(path);
//       }
//     }

//     /* -------- insert ticket -------- */
//     const { error } = await supabase.from("tickets").insert({
//       title,
//       description,
//       email: userEmail,        // ✅ USER EMAIL FROM INPUT
//       hod_email: hodEmail,
//       status: "Open",
//       attachments,
//       created_by: session.user.id
//     });

//     if (error) {
//       alert(error.message);
//     } else {
//       onSuccess();
//       onClose();
//     }

//     setLoading(false);
//   };

//   return (
//     <div style={styles.overlay}>
//       <div style={styles.card}>
//         <h2 style={styles.heading}>Create New Ticket</h2>

//         <input
//           style={styles.input}
//           placeholder="Your Email"
//           value={userEmail}
//           onChange={e => setUserEmail(e.target.value)}
//         />

//         <input
//           style={styles.input}
//           placeholder="Ticket Title"
//           value={title}
//           onChange={e => setTitle(e.target.value)}
//         />

//         <textarea
//           style={{ ...styles.input, height: "90px" }}
//           placeholder="Describe your issue"
//           value={description}
//           onChange={e => setDescription(e.target.value)}
//         />

//         <input
//           style={styles.input}
//           placeholder="HOD Email"
//           value={hodEmail}
//           onChange={e => setHodEmail(e.target.value)}
//         />

//         <input
//           style={styles.file}
//           type="file"
//           multiple
//           onChange={e => setFiles(e.target.files)}
//         />

//         <div style={styles.actions}>
//           <button style={styles.cancel} onClick={onClose}>
//             Cancel
//           </button>

//           <button
//             style={styles.submit}
//             onClick={handleSubmit}
//             disabled={loading}
//           >
//             {loading ? "Submitting..." : "Submit Ticket"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ---------- STYLES ---------- */

// const styles: Record<string, CSSProperties> = {
//   overlay: {
//     position: "fixed",
//     inset: 0,
//     background: "rgba(0,0,0,0.4)",
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//     zIndex: 1000
//   },
//   card: {
//     width: "430px",
//     background: "#fff",
//     borderRadius: "14px",
//     padding: "25px",
//     boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
//     display: "flex",
//     flexDirection: "column",
//     gap: "14px"
//   },
//   heading: {
//     marginBottom: "10px",
//     color: "#1f2937",
//     textAlign: "center"
//   },
//   input: {
//     padding: "12px",
//     borderRadius: "8px",
//     border: "1px solid #d1d5db",
//     fontSize: "14px"
//   },
//   file: {
//     fontSize: "14px"
//   },
//   actions: {
//     display: "flex",
//     justifyContent: "space-between",
//     marginTop: "15px"
//   },
//   cancel: {
//     padding: "10px 16px",
//     borderRadius: "8px",
//     border: "1px solid #d1d5db",
//     background: "#f3f4f6",
//     cursor: "pointer"
//   },
//   submit: {
//     padding: "10px 18px",
//     borderRadius: "8px",
//     border: "none",
//     background: "#4f46e5",
//     color: "#fff",
//     fontWeight: "bold",
//     cursor: "pointer"
//   }
// };
