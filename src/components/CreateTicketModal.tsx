import { useState } from "react";
import { supabase } from "../supabaseClient";
import { sendTicketEmail } from "../utils/sendEmail";
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
  const [priority, setPriority] = useState("Medium");

  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ parse emails
  const parseEmails = (emailString: string) => {
    return emailString
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e !== "");
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        alert("User not logged in");
        return;
      }

      // ✅ parse + validate
      const userEmailList = parseEmails(userEmail);
      const hodEmailList = parseEmails(hodEmail);

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const allEmails = [...userEmailList, ...hodEmailList];

      const invalidEmails = allEmails.filter(
        (email) => !emailRegex.test(email)
      );

      if (invalidEmails.length > 0) {
        alert("Invalid emails: " + invalidEmails.join(", "));
        return;
      }

      /* -------- STEP 1: CREATE TICKET -------- */
      const { data: insertedData, error } = await supabase
        .from("tickets")
        .insert({
          title,
          description,
          email: userEmailList.join(","),      // store
          hod_email: hodEmailList.join(","),   // store
          status: "Open",
          priority,
          created_by: session.user.id,
          updated_at: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (error || !insertedData) throw error;

      /* -------- STEP 2: UPLOAD FILES -------- */
      let attachments: string[] = [];

      for (const file of files) {
        const cleanName = file.name.replace(/\s+/g, "_");
        const path = `${insertedData.ticket_no}/${cleanName}`;

        const { error: uploadError } = await supabase.storage
          .from("tickets")
          .upload(path, file);

        if (uploadError) continue;

        const { data: publicUrlData } = supabase.storage
          .from("tickets")
          .getPublicUrl(path);

        if (publicUrlData?.publicUrl) {
          attachments.push(publicUrlData.publicUrl);
        }
      }

      /* -------- STEP 3: UPDATE DB -------- */
      if (attachments.length > 0) {
        await supabase
          .from("tickets")
          .update({ attachments })
          .eq("id", insertedData.id);
      }

      /* -------- STEP 4: SEND EMAIL (FINAL FIX) -------- */
      await sendTicketEmail({
        ticket_no: insertedData.ticket_no,
        title,
        description,
        department: "IT",
        priority,
        status: "Open",

        // 🔥 FINAL STRUCTURE
        to: userEmailList,
        cc: hodEmailList,
        bcc: [],

        is_admin: false,
        remark: "New Ticket Created",
        attachments,
      });

      alert("Ticket Created ✅");
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err?.message || "Error ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <h2 style={styles.header}>Create New Ticket</h2>

        <div style={styles.content}>
          <input
            style={styles.input}
            placeholder="Enter emails (comma separated)"
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
            style={{ ...styles.input, height: "90px", resize: "none" }}
            placeholder="Describe your issue"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            style={styles.input}
            placeholder="HOD Emails (comma separated)"
            value={hodEmail}
            onChange={(e) => setHodEmail(e.target.value)}
          />

          <select
            style={styles.input}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
            <option value="Urgent">Urgent</option>
          </select>

          <input
            type="file"
            multiple
            onChange={(e) => {
              if (!e.target.files) return;
              const newFiles = Array.from(e.target.files);
              setFiles((prev) => [...prev, ...newFiles]);
              e.target.value = "";
            }}
          />

          {files.length > 0 && (
            <div>
              <p style={{ fontWeight: "bold" }}>Selected Files:</p>

              <div style={styles.previewWrap}>
                {files.map((file, index) => {
                  const fileUrl = URL.createObjectURL(file);

                  return (
                    <div key={index} style={styles.previewBox}>
                      <button
                        onClick={() =>
                          setFiles((prev) =>
                            prev.filter((_, i) => i !== index)
                          )
                        }
                        style={styles.removeBtn}
                      >
                        ×
                      </button>

                      {file.type.startsWith("image/") && (
                        <img src={fileUrl} style={styles.previewImg} />
                      )}

                      {file.type === "application/pdf" && (
                        <iframe src={fileUrl} style={styles.previewImg} />
                      )}

                      {!file.type.startsWith("image/") &&
                        file.type !== "application/pdf" && <div>📁 File</div>}

                      <div style={styles.fileName}>{file.name}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

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

/* ---------- STYLES ---------- */

const styles: Record<string, CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  card: {
    width: "430px",
    maxHeight: "90vh",
    background: "#fff",
    borderRadius: "14px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    zIndex: 10000,
  },
  header: {
    position: "sticky",
    top: 0,
    background: "#fff",
    padding: "15px",
    textAlign: "center",
    fontWeight: "bold",
    borderBottom: "1px solid #eee",
    zIndex: 10,
  },
  content: {
    padding: "20px",
    overflowY: "auto",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
  },
  previewWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  previewBox: {
    width: "120px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "8px",
    textAlign: "center",
    position: "relative",
  },
  previewImg: {
    width: "100%",
    height: "80px",
    objectFit: "cover",
  },
  fileName: {
    fontSize: "11px",
    marginTop: "5px",
    wordBreak: "break-word",
  },
  removeBtn: {
    position: "absolute",
    top: "2px",
    right: "5px",
    background: "red",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    cursor: "pointer",
    width: "18px",
    height: "18px",
  },
  actions: {
    position: "sticky",
    bottom: 0,
    background: "#fff",
    padding: "15px",
    display: "flex",
    justifyContent: "space-between",
    borderTop: "1px solid #eee",
  },
  cancel: {
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "6px",
  },
  submit: {
    padding: "10px 16px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
  },
};























// import { useState } from "react";
// import { supabase } from "../supabaseClient";
// import { sendTicketEmail } from "../utils/sendEmail";
// import type { CSSProperties } from "react";

// interface Props {
//   onClose: () => void;
//   onSuccess: () => void;
// }

// export default function CreateTicketModal({ onClose, onSuccess }: Props) {
//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");
//   const [userEmail, setUserEmail] = useState(""); // comma supported
//   const [hodEmail, setHodEmail] = useState("");   // comma supported
//   const [priority, setPriority] = useState("Medium");

//   const [files, setFiles] = useState<File[]>([]);
//   const [loading, setLoading] = useState(false);

//   // ✅ parse emails
//   const parseEmails = (emailString: string) => {
//     return emailString
//       .split(",")
//       .map((e) => e.trim())
//       .filter((e) => e !== "");
//   };

//   const handleSubmit = async () => {
//     try {
//       setLoading(true);

//       const { data } = await supabase.auth.getSession();
//       const session = data.session;

//       if (!session) {
//         alert("User not logged in");
//         return;
//       }

//       // ✅ parse + validate emails
//       const userEmailList = parseEmails(userEmail);
//       const hodEmailList = parseEmails(hodEmail);

//       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//       const allEmails = [...userEmailList, ...hodEmailList];

//       const invalidEmails = allEmails.filter(
//         (email) => !emailRegex.test(email)
//       );

//       if (invalidEmails.length > 0) {
//         alert("Invalid emails: " + invalidEmails.join(", "));
//         return;
//       }

//       /* -------- STEP 1: CREATE TICKET -------- */
//       const { data: insertedData, error } = await supabase
//         .from("tickets")
//         .insert({
//           title,
//           description,
//           email: userEmailList.join(","),      // ✅ changed
//           hod_email: hodEmailList.join(","),   // ✅ changed
//           status: "Open",
//           priority,
//           created_by: session.user.id,
//           updated_at: new Date().toISOString(),
//         })
//         .select("*")
//         .single();

//       if (error || !insertedData) throw error;

//       /* -------- STEP 2: UPLOAD FILES -------- */
//       let attachments: string[] = [];

//       for (const file of files) {
//         const cleanName = file.name.replace(/\s+/g, "_");
//         const path = `${insertedData.ticket_no}/${cleanName}`;

//         const { error: uploadError } = await supabase.storage
//           .from("tickets")
//           .upload(path, file);

//         if (uploadError) continue;

//         const { data: publicUrlData } = supabase.storage
//           .from("tickets")
//           .getPublicUrl(path);

//         if (publicUrlData?.publicUrl) {
//           attachments.push(publicUrlData.publicUrl);
//         }
//       }

//       /* -------- STEP 3: UPDATE DB -------- */
//       if (attachments.length > 0) {
//         await supabase
//           .from("tickets")
//           .update({ attachments })
//           .eq("id", insertedData.id);
//       }

//       /* -------- STEP 4: EMAIL -------- */
//       const allReceivers = [...userEmailList, ...hodEmailList];

//       for (const email of allReceivers) {
//         await sendTicketEmail({
//           ticket_no: insertedData.ticket_no,
//           title,
//           description,
//           department: "IT",
//           priority,
//           status: "Open",
//           user_email: email,
//           hod_email: "",
//           is_admin: false,
//           remark: "New Ticket Created",
//           attachments,
//         });
//       }

//       alert("Ticket Created ✅");
//       onSuccess();
//       onClose();
//     } catch (err: any) {
//       alert(err?.message || "Error ❌");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={styles.overlay}>
//       <div style={styles.card}>
//         <h2 style={styles.header}>Create New Ticket</h2>

//         <div style={styles.content}>
//           <input
//             style={styles.input}
//             placeholder="Enter emails (comma separated)"
//             value={userEmail}
//             onChange={(e) => setUserEmail(e.target.value)}
//           />

//           <input
//             style={styles.input}
//             placeholder="Ticket Title"
//             value={title}
//             onChange={(e) => setTitle(e.target.value)}
//           />

//           <textarea
//             style={{ ...styles.input, height: "90px", resize: "none" }}
//             placeholder="Describe your issue"
//             value={description}
//             onChange={(e) => setDescription(e.target.value)}
//           />

//           <input
//             style={styles.input}
//             placeholder="HOD Emails (comma separated)"
//             value={hodEmail}
//             onChange={(e) => setHodEmail(e.target.value)}
//           />

//           <select
//             style={styles.input}
//             value={priority}
//             onChange={(e) => setPriority(e.target.value)}
//           >
//             <option value="High">High</option>
//             <option value="Medium">Medium</option>
//             <option value="Low">Low</option>
//             <option value="Urgent">Urgent</option>
//           </select>

//           <input
//             type="file"
//             multiple
//             onChange={(e) => {
//               if (!e.target.files) return;
//               const newFiles = Array.from(e.target.files);
//               setFiles((prev) => [...prev, ...newFiles]);
//               e.target.value = "";
//             }}
//           />

//           {files.length > 0 && (
//             <div>
//               <p style={{ fontWeight: "bold" }}>Selected Files:</p>

//               <div style={styles.previewWrap}>
//                 {files.map((file, index) => {
//                   const fileUrl = URL.createObjectURL(file);

//                   return (
//                     <div key={index} style={styles.previewBox}>
//                       <button
//                         onClick={() =>
//                           setFiles((prev) =>
//                             prev.filter((_, i) => i !== index)
//                           )
//                         }
//                         style={styles.removeBtn}
//                       >
//                         ×
//                       </button>

//                       {file.type.startsWith("image/") && (
//                         <img src={fileUrl} style={styles.previewImg} />
//                       )}

//                       {file.type === "application/pdf" && (
//                         <iframe src={fileUrl} style={styles.previewImg} />
//                       )}

//                       {!file.type.startsWith("image/") &&
//                         file.type !== "application/pdf" && <div>📁 File</div>}

//                       <div style={styles.fileName}>{file.name}</div>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           )}
//         </div>

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
//     background: "rgba(0,0,0,0.5)",
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//     zIndex: 9999,
//   },
//   card: {
//     width: "430px",
//     maxHeight: "90vh",
//     background: "#fff",
//     borderRadius: "14px",
//     display: "flex",
//     flexDirection: "column",
//     overflow: "hidden",
//     zIndex: 10000,
//   },
//   header: {
//     position: "sticky",
//     top: 0,
//     background: "#fff",
//     padding: "15px",
//     textAlign: "center",
//     fontWeight: "bold",
//     borderBottom: "1px solid #eee",
//     zIndex: 10,
//   },
//   content: {
//     padding: "20px",
//     overflowY: "auto",
//     flex: 1,
//     display: "flex",
//     flexDirection: "column",
//     gap: "14px",
//   },
//   input: {
//     padding: "12px",
//     borderRadius: "8px",
//     border: "1px solid #d1d5db",
//   },
//   previewWrap: {
//     display: "flex",
//     flexWrap: "wrap",
//     gap: "10px",
//   },
//   previewBox: {
//     width: "120px",
//     border: "1px solid #ddd",
//     borderRadius: "8px",
//     padding: "8px",
//     textAlign: "center",
//     position: "relative",
//   },
//   previewImg: {
//     width: "100%",
//     height: "80px",
//     objectFit: "cover",
//   },
//   fileName: {
//     fontSize: "11px",
//     marginTop: "5px",
//     wordBreak: "break-word",
//   },
//   removeBtn: {
//     position: "absolute",
//     top: "2px",
//     right: "5px",
//     background: "red",
//     color: "#fff",
//     border: "none",
//     borderRadius: "50%",
//     cursor: "pointer",
//     width: "18px",
//     height: "18px",
//   },
//   actions: {
//     position: "sticky",
//     bottom: 0,
//     background: "#fff",
//     padding: "15px",
//     display: "flex",
//     justifyContent: "space-between",
//     borderTop: "1px solid #eee",
//   },
//   cancel: {
//     padding: "10px",
//     border: "1px solid #ccc",
//     borderRadius: "6px",
//   },
//   submit: {
//     padding: "10px 16px",
//     background: "#4f46e5",
//     color: "#fff",
//     border: "none",
//     borderRadius: "6px",
//   },
// };





















// main final working code with multiple attachment 03/04/26  
// import { useState } from "react";
// import { supabase } from "../supabaseClient";
// import { sendTicketEmail } from "../utils/sendEmail";
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
//   const [priority, setPriority] = useState("Medium");

//   // ✅ multiple files
//   const [files, setFiles] = useState<File[]>([]);
//   const [loading, setLoading] = useState(false);

  
//   const handleSubmit = async () => {
//     try {
//       setLoading(true);
      

//       const { data } = await supabase.auth.getSession();
//       const session = data.session;

//       if (!session) {
//         alert("User not logged in");
//         return;
//       }

//       /* -------- STEP 1: CREATE TICKET -------- */
//       const { data: insertedData, error } = await supabase
//         .from("tickets")
//         .insert({
//           title,
//           description,
//           email: userEmail,
//           hod_email: hodEmail,
//           status: "Open",
//           priority,
//           created_by: session.user.id,
//           updated_at: new Date().toISOString(),
//         })
//         .select("*")
//         .single();

//       if (error || !insertedData) throw error;

//       /* -------- STEP 2: UPLOAD FILES -------- */
//       let attachments: string[] = [];

//       for (const file of files) {
//         const cleanName = file.name.replace(/\s+/g, "_");
//         const path = `${insertedData.ticket_no}/${cleanName}`;

//         const { error: uploadError } = await supabase.storage
//           .from("tickets")
//           .upload(path, file);

//         if (uploadError) continue;

//         const { data: publicUrlData } = supabase.storage
//           .from("tickets")
//           .getPublicUrl(path);

//         if (publicUrlData?.publicUrl) {
//           attachments.push(publicUrlData.publicUrl);
//         }
//       }

//       /* -------- STEP 3: UPDATE DB -------- */
//       if (attachments.length > 0) {
//         await supabase
//           .from("tickets")
//           .update({ attachments })
//           .eq("id", insertedData.id);
//       }

//       /* -------- STEP 4: EMAIL -------- */
//       await sendTicketEmail({
//         ticket_no: insertedData.ticket_no,
//         title,
//         description,
//         department: "IT",
//         priority,
//         status: "Open",
//         user_email: userEmail,
//         hod_email: hodEmail,
//         is_admin: false,
//         remark: "New Ticket Created",
//         attachments,
//       });

//       alert("Ticket Created ✅");
//       onSuccess();
//       onClose();
//     } catch (err: any) {
//       alert(err?.message || "Error ❌");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={styles.overlay}>
//       <div style={styles.card}>

//         {/* ✅ HEADER FIXED */}
//         <h2 style={styles.header}>Create New Ticket</h2>

//         {/* ✅ SCROLL AREA */}
//         <div style={styles.content}>
//           <input
//             style={styles.input}
//             placeholder="Your Email"
//             value={userEmail}
//             onChange={(e) => setUserEmail(e.target.value)}
//           />

//           <input
//             style={styles.input}
//             placeholder="Ticket Title"
//             value={title}
//             onChange={(e) => setTitle(e.target.value)}
//           />

//           <textarea
//             style={{ ...styles.input, height: "90px", resize: "none" }}
//             placeholder="Describe your issue"
//             value={description}
//             onChange={(e) => setDescription(e.target.value)}
//           />

//           <input
//             style={styles.input}
//             placeholder="HOD Email"
//             value={hodEmail}
//             onChange={(e) => setHodEmail(e.target.value)}
//           />

//           <select
//             style={styles.input}
//             value={priority}
//             onChange={(e) => setPriority(e.target.value)}
//           >
//             <option value="High">High</option>
//             <option value="Medium">Medium</option>
//             <option value="Low">Low</option>
//             <option value="Urgent">Urgent</option>
//           </select>

//           {/* ✅ FILE INPUT */}
//           <input
//             type="file"
//             multiple
//             onChange={(e) => {
//               if (!e.target.files) return;
//               const newFiles = Array.from(e.target.files);
//               setFiles((prev) => [...prev, ...newFiles]);
//             }}
//           />

//           {/* ✅ PREVIEW */}
//           {files.length > 0 && (
//             <div>
//               <p style={{ fontWeight: "bold" }}>Selected Files:</p>

//               <div style={styles.previewWrap}>
//                 {files.map((file, index) => {
//                   const fileUrl = URL.createObjectURL(file);

//                   return (
//                     <div key={index} style={styles.previewBox}>
//                       {/* remove */}
//                       <button
//                         onClick={() =>
//                           setFiles((prev) =>
//                             prev.filter((_, i) => i !== index)
//                           )
//                         }
//                         style={styles.removeBtn}
//                       >
//                         ×
//                       </button>

//                       {/* image */}
//                       {file.type.startsWith("image/") && (
//                         <img src={fileUrl} style={styles.previewImg} />
//                       )}

//                       {/* pdf */}
//                       {file.type === "application/pdf" && (
//                         <iframe src={fileUrl} style={styles.previewImg} />
//                       )}

//                       {/* other */}
//                       {!file.type.startsWith("image/") &&
//                         file.type !== "application/pdf" && (
//                           <div>📁 File</div>
//                         )}

//                       <div style={styles.fileName}>{file.name}</div>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           )}
//         </div>

//         {/* ✅ FIXED BUTTON */}
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
//     background: "rgba(0,0,0,0.5)",
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//     zIndex: 9999,
//   },

//   card: {
//     width: "430px",
//     maxHeight: "90vh",
//     background: "#fff",
//     borderRadius: "14px",
//     display: "flex",
//     flexDirection: "column",
//     overflow: "hidden",
//     zIndex: 10000,
//   },

//   header: {
//     position: "sticky",
//     top: 0,
//     background: "#fff",
//     padding: "15px",
//     textAlign: "center",
//     fontWeight: "bold",
//     borderBottom: "1px solid #eee",
//     zIndex: 10,
//   },

//   content: {
//     padding: "20px",
//     overflowY: "auto",
//     flex: 1,
//     display: "flex",
//     flexDirection: "column",
//     gap: "14px",
//   },

//   input: {
//     padding: "12px",
//     borderRadius: "8px",
//     border: "1px solid #d1d5db",
//   },

//   previewWrap: {
//     display: "flex",
//     flexWrap: "wrap",
//     gap: "10px",
//   },

//   previewBox: {
//     width: "120px",
//     border: "1px solid #ddd",
//     borderRadius: "8px",
//     padding: "8px",
//     textAlign: "center",
//     position: "relative",
//   },

//   previewImg: {
//     width: "100%",
//     height: "80px",
//     objectFit: "cover",
//   },

//   fileName: {
//     fontSize: "11px",
//     marginTop: "5px",
//     wordBreak: "break-word",
//   },

//   removeBtn: {
//     position: "absolute",
//     top: "2px",
//     right: "5px",
//     background: "red",
//     color: "#fff",
//     border: "none",
//     borderRadius: "50%",
//     cursor: "pointer",
//     width: "18px",
//     height: "18px",
//   },

//   actions: {
//     position: "sticky",
//     bottom: 0,
//     background: "#fff",
//     padding: "15px",
//     display: "flex",
//     justifyContent: "space-between",
//     borderTop: "1px solid #eee",
//   },

//   cancel: {
//     padding: "10px",
//     border: "1px solid #ccc",
//     borderRadius: "6px",
//   },

//   submit: {
//     padding: "10px 16px",
//     background: "#4f46e5",
//     color: "#fff",
//     border: "none",
//     borderRadius: "6px",
//   },
// };






















// final working code with multiple attachment and download and email 02/04/26  
// import { useState } from "react";
// import { supabase } from "../supabaseClient";
// import { sendTicketEmail } from "../utils/sendEmail";
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
//   const [priority, setPriority] = useState("Medium");

//   //multiple attachment
//   //const [files, setFiles] = useState<FileList | null>(null);
//   const [files, setFiles] = useState<File[]>([]);
  
//   const [loading, setLoading] = useState(false);



// const handleSubmit = async () => {
//   try {
//     setLoading(true);

//     console.log("FILES:", files);

//     const { data } = await supabase.auth.getSession();
//     const session = data.session;

//     if (!session) {
//       alert("User not logged in");
//       return;
//     }

//     /* -------- STEP 1: CREATE TICKET -------- */
//     const { data: insertedData, error } = await supabase
//       .from("tickets")
//       .insert({
//         title,
//         description,
//         email: userEmail,
//         hod_email: hodEmail,
//         status: "Open",
//         priority: priority,
//         created_by: session.user.id,
//         updated_at: new Date().toISOString(),
//       })
//       .select("*")
//       .single();

//     if (error || !insertedData) {
//       throw error;
//     }

//     console.log("INSERTED DATA:", insertedData);

//     /* -------- STEP 2: UPLOAD FILES -------- */
//     let attachments: string[] = [];

//   // multiple ttachment
//   // if (files && files.length > 0) 
//    if (files.length > 0)
//       {
//       //for (const file of Array.from(files)) 

//       // multiple attachment
//       for (const file of files)
//         {

//         // ✅ CLEAN FILE NAME (space remove)
//         const cleanName = file.name.replace(/\s+/g, "_");

//         // ✅ CORRECT PATH (NO DOUBLE TIMESTAMP ISSUE)
//         const path = `${insertedData.ticket_no}/${cleanName}`;

//         const { error: uploadError } = await supabase.storage
//           .from("tickets")
//           .upload(path, file);

//         if (uploadError) {
//           console.error("Upload error:", uploadError);
//           continue;
//         }

//         const { data: publicUrlData } = supabase.storage
//           .from("tickets")
//           .getPublicUrl(path);

//         if (publicUrlData?.publicUrl) {
//           attachments.push(publicUrlData.publicUrl);
//         }
//       }
//     }

//     console.log("ATTACHMENTS SAVED:", attachments);

//     /* -------- STEP 3: UPDATE DB -------- */
//     if (attachments.length > 0) {
//       const { error: updateError } = await supabase
//         .from("tickets")
//         .update({ attachments })
//         .eq("id", insertedData.id);

//       if (updateError) {
//         console.error("UPDATE ERROR:", updateError);
//       } else {
//         console.log("DB UPDATED SUCCESSFULLY ✅");
//       }
//     }

//     /* -------- STEP 4: EMAIL -------- */
//     await sendTicketEmail({
//       ticket_no: insertedData.ticket_no,
//       title,
//       description,
//       department: "IT",
//       priority,
//       status: "Open",
//       user_email: userEmail,
//       hod_email: hodEmail,
//       is_admin: false,
//       remark: "New Ticket Created",
//       attachments,
//     });

//     alert("Ticket Created ✅");

//     onSuccess();
//     onClose();

//   } catch (err: any) {
//     console.error(err);
//     alert(err?.message || "Error ❌");
//   } finally {
//     setLoading(false);
//   }
// };





// // const handleSubmit = async () => {
// //   setLoading(true);

// //   const { data } = await supabase.auth.getSession();
// //   const session = data.session;

// //   if (!session) {
// //     alert("User not logged in");
// //     setLoading(false);
// //     return;
// //   }

// //   /* -------- STEP 1: CREATE TICKET -------- */
// //   const { data: insertedData, error } = await supabase
// //     .from("tickets")
// //     .insert({
// //       title,
// //       description,
// //       email: userEmail,
// //       hod_email: hodEmail,
// //       status: "Open",
// //       priority: priority,
// //       created_by: session.user.id,
// //       updated_at: new Date().toISOString(),
// //     })
// //     .select("*")
// //     .single();

// //   if (error) {
// //     alert(error.message);
// //     setLoading(false);
// //     return;
// //   }

// //   console.log("INSERTED DATA:", insertedData);

// //   /* -------- STEP 2: UPLOAD FILES (ticket-wise folder) -------- */
// //   let attachments: string[] = [];

// //   if (files) {
// //     for (const file of Array.from(files)) {
// //       const path = `${insertedData.ticket_no}/${Date.now()}_${file.name}`;

// //       const { error: uploadError } = await supabase.storage
// //         .from("tickets")
// //         .upload(path, file);

// //       if (uploadError) {
// //         console.error(uploadError);
// //         continue;
// //       }

// //       // ✅ PUBLIC URL (browser + email both)
// //       const { data: publicUrlData } = supabase
// //         .storage
// //         .from("tickets")
// //         .getPublicUrl(path);

// //       attachments.push(publicUrlData.publicUrl);
// //     }
// //   }

// //   /* -------- STEP 3: UPDATE ATTACHMENTS IN DB -------- */
// //   await supabase
// //     .from("tickets")
// //     .update({ attachments })
// //     .eq("id", insertedData.id);

// //   /* -------- STEP 4: SEND EMAIL -------- */
// //   await sendTicketEmail({
// //     ticket_no: insertedData.ticket_no,
// //     title: title,
// //     description: description,
// //     department: "IT",
// //     priority: priority,
// //     status: "Open",
// //     user_email: userEmail,
// //     hod_email: hodEmail,
// //     is_admin: false,
// //     remark: "New Ticket Created",
// //     attachments: attachments, // ✅ EMAIL + DOWNLOAD
// //   });

// //   onSuccess();
// //   onClose();
// //   setLoading(false);
// // };



//   // const handleSubmit = async () => {
//   //   setLoading(true);

//   //   const { data } = await supabase.auth.getSession();
//   //   const session = data.session;

//   //   if (!session) {
//   //     alert("User not logged in");
//   //     setLoading(false);
//   //     return;
//   //   }

//   //   /* -------- attachments -------- */
//   //   let attachments: string[] = [];

//   //   if (files) {
//   //     for (const file of Array.from(files)) {
//   //       const path = `${session.user.id}/${Date.now()}_${file.name}`;

//   //       await supabase.storage.from("tickets").upload(path, file);
//   //       attachments.push(path);

//   //       // ✅ PUBLIC URL GENERATE
//   //       const { data: publicUrlData } = supabase
//   //         .storage
//   //         .from("tickets")
//   //         .getPublicUrl(path);

//   //       attachments.push(publicUrlData.publicUrl);
//   //     }
//   //   }

//   //   /* -------- insert ticket -------- */
//   //   const { data: insertedData, error } = await supabase
//   //     .from("tickets")
//   //     .insert({
//   //       title,
//   //       description,
//   //       email: userEmail,
//   //       hod_email: hodEmail,
//   //       status: "Open",
//   //       priority: priority,
//   //       attachments, // ✅ SAVE URL
//   //       created_by: session.user.id,
//   //       updated_at: new Date().toISOString(),
//   //     })
//   //     .select("*")
//   //     .single();

//   //   if (error) {
//   //     alert(error.message);
//   //   } else {
//   //     console.log("INSERTED DATA:", insertedData);

//   //     /* ✅ EMAIL TRIGGER */
//   //     await sendTicketEmail({
//   //       ticket_no: insertedData.ticket_no,
//   //       title: title,
//   //       description: description,
//   //       department: "IT",
//   //       priority: priority,
//   //       status: "Open",
//   //       user_email: userEmail,
//   //       hod_email: hodEmail,
//   //       is_admin: false,
//   //       remark: "New Ticket Created",
//   //       attachments: attachments, // ✅ ADD THIS
//   //     });

//   //     onSuccess();
//   //     onClose();
//   //   }

//   //   setLoading(false);
//   // };

//   return (
//     <div style={styles.overlay}>
      
//       <div style={styles.card}>
//         <h2 style={styles.heading}>Create New Ticket</h2>
  
//         <input
//           style={styles.input}
//           placeholder="Your Email"
//           value={userEmail}
//           onChange={(e) => setUserEmail(e.target.value)}
//         />

//         <input
//           style={styles.input}
//           placeholder="Ticket Title"
//           value={title}
//           onChange={(e) => setTitle(e.target.value)}
//         />

//         <textarea
//           style={{ ...styles.input, height: "90px" }}
//           placeholder="Describe your issue"
//           value={description}
//           onChange={(e) => setDescription(e.target.value)}
//         />

//         <input
//           style={styles.input}
//           placeholder="HOD Email"
//           value={hodEmail}
//           onChange={(e) => setHodEmail(e.target.value)}
//         />

//         <select
//           style={styles.input}
//           value={priority}
//           onChange={(e) => setPriority(e.target.value)}
//         >
//           <option value="High">High</option>
//           <option value="Medium">Medium</option>
//           <option value="Low">Low</option>
//           <option value="Urgent">Urgent</option>
//         </select>

//         {/* <input
//           style={styles.file}
//           type="file"
//           multiple
//           onChange={(e) => setFiles(e.target.files)}
//         /> */}

//         {/* <input
//   style={styles.file}
//   type="file"
//   multiple
//   onChange={(e) => {
//     console.log("SELECTED FILES:", e.target.files); // ✅ DEBUG
//     setFiles(e.target.files);
//   }}
// /> */}


//         {/*multiple attachment*/}
//     <input
//          style={styles.file}
//          type="file"
//          multiple
//          onChange={(e) => {
//         if (!e.target.files) return;

//        const newFiles = Array.from(e.target.files);

//        // ✅ append files (replace nahi karega)
//       setFiles((prev) => [...prev, ...newFiles]);
//       }}
//      />
       
//     {/* {files.length > 0 && (
//   <div>
//     <p>Selected Files:</p>
//     {files.map((file, index) => (
//       <div key={index}>
//         {file.name}
//         <button
//           type="button"
//           onClick={() =>
//             setFiles((prev) => prev.filter((_, i) => i !== index))
//           }
//         >
//           ❌
//         </button>
//       </div>
//     ))}
//   </div>
// )} */}





// {files.length > 0 && (
//   <div style={{ marginTop: "10px" }}>
//     <p style={{ fontWeight: "bold" }}>Selected Files:</p>

//     <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
//       {files.map((file, index) => {
//         const fileUrl = URL.createObjectURL(file);

//         return (
//           <div
//             key={index}
//             style={{
//               border: "1px solid #ddd",
//               padding: "8px",
//               borderRadius: "8px",
//               width: "120px",
//               textAlign: "center",
//               position: "relative",
//             }}
//           >
//             {/* ❌ Remove */}
//             <button
//               type="button"
//               onClick={() =>
//                 setFiles((prev) => prev.filter((_, i) => i !== index))
//               }
//               style={{
//                 position: "absolute",
//                 top: "2px",
//                 right: "5px",
//                 background: "red",
//                 color: "#fff",
//                 border: "none",
//                 borderRadius: "50%",
//                 cursor: "pointer",
//                 width: "18px",
//                 height: "18px",
//                 fontSize: "12px",
//               }}
//             >
//               ×
//             </button>

//             {/* 🖼 Image */}
//             {file.type.startsWith("image/") && (
//               <img
//                 src={fileUrl}
//                 alt="preview"
//                 style={{
//                   width: "100%",
//                   height: "80px",
//                   objectFit: "cover",
//                   borderRadius: "6px",
//                 }}
//               />
//             )}

//             {/* 📄 PDF */}
//             {file.type === "application/pdf" && (
//               <iframe
//                 src={fileUrl}
//                 style={{
//                   width: "100%",
//                   height: "80px",
//                   border: "none",
//                 }}
//               />
//             )}

//             {/* 📁 Other */}
//             {!file.type.startsWith("image/") &&
//               file.type !== "application/pdf" && (
//                 <div style={{ fontSize: "12px" }}>📁 File</div>
//               )}

//             {/* File name */}
//             <div
//               style={{
//                 fontSize: "11px",
//                 marginTop: "5px",
//                 wordBreak: "break-word",
//               }}
//             >
//               {file.name}
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   </div>
// )}






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
//     zIndex: 1000,
//   },
//   card: {
//     width: "430px",
//     background: "#fff",
//     borderRadius: "14px",
//     padding: "25px",
//     boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
//     display: "flex",
//     flexDirection: "column",
//     gap: "14px",
//   },
//   heading: {
//     marginBottom: "10px",
//     color: "#1f2937",
//     textAlign: "center",
//   },
//   input: {
//     padding: "12px",
//     borderRadius: "8px",
//     border: "1px solid #d1d5db",
//     fontSize: "14px",
//   },
//   file: {
//     fontSize: "14px",
//   },
//   actions: {
//     display: "flex",
//     justifyContent: "space-between",
//     marginTop: "15px",
//   },
//   cancel: {
//     padding: "10px 16px",
//     borderRadius: "8px",
//     border: "1px solid #d1d5db",
//     background: "#f3f4f6",
//     cursor: "pointer",
//   },
//   submit: {
//     padding: "10px 18px",
//     borderRadius: "8px",
//     border: "none",
//     background: "#4f46e5",
//     color: "#fff",
//     fontWeight: "bold",
//     cursor: "pointer",
//   },


// };






















// final working code before attachment send into email 30/03/26
// import { useState } from "react";
// import { supabase } from "../supabaseClient";
// import { sendTicketEmail } from "../utils/sendEmail"; // ✅ ADD THIS
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
//   const [priority, setPriority] = useState("Medium");
//   const [files, setFiles] = useState<FileList | null>(null);
//   const [loading, setLoading] = useState(false);




// const handleSubmit = async () => {
//   setLoading(true);

//   const { data } = await supabase.auth.getSession();
//   const session = data.session;

//   if (!session) {
//     alert("User not logged in");
//     setLoading(false);
//     return;
//   }

//   /* -------- attachments -------- */
//   let attachments: string[] = [];

//   if (files) {
//     for (const file of Array.from(files)) {
//       const path = `${session.user.id}/${Date.now()}_${file.name}`;
//       await supabase.storage.from("tickets").upload(path, file);

//       attachments.push(path);
//     }
//   }

//   /* -------- insert ticket -------- */
//   const { data: insertedData, error } = await supabase
//     .from("tickets")
//     .insert({
//       title,
//       description,
//       email: userEmail,
//       hod_email: hodEmail,
//       status: "Open",
//       priority: priority,
//       attachments,
//       created_by: session.user.id,
//       updated_at: new Date().toISOString(),
//     })
//     .select("*")
//     .single();

//   if (error) {
//     alert(error.message);
//   } else {
//     console.log("INSERTED DATA:", insertedData); // ✅ DEBUG

//     /* ✅ EMAIL TRIGGER */
//     await sendTicketEmail({
//       ticket_no: insertedData.ticket_no,  // Use generate ticket no.
//       //ticket_no: `T-${insertedData?.id}`, // ✅ FIXED (SAFE)
//       title: title,
//       description: description,
//       department: "IT",
//       priority: priority,
//       status: "Open",
//       user_email: userEmail,
//       hod_email: hodEmail,
//       is_admin: false,
//       //role: "user",
//       remark: "New Ticket Created", // ✅ NEW ADD
//     });

//     onSuccess();
//     onClose();
//   }

//   setLoading(false);
// };


//   return (
//     <div style={styles.overlay}>
//       <div style={styles.card}>
//         <h2 style={styles.heading}>Create New Ticket</h2>

//         <input
//           style={styles.input}
//           placeholder="Your Email"
//           value={userEmail}
//           onChange={(e) => setUserEmail(e.target.value)}
//         />

//         <input
//           style={styles.input}
//           placeholder="Ticket Title"
//           value={title}
//           onChange={(e) => setTitle(e.target.value)}
//         />

//         <textarea
//           style={{ ...styles.input, height: "90px" }}
//           placeholder="Describe your issue"
//           value={description}
//           onChange={(e) => setDescription(e.target.value)}
//         />

//         <input
//           style={styles.input}
//           placeholder="HOD Email"
//           value={hodEmail}
//           onChange={(e) => setHodEmail(e.target.value)}
//         />

//         <select
//           style={styles.input}
//           value={priority}
//           onChange={(e) => setPriority(e.target.value)}
//         >
//           <option value="High">High</option>
//           <option value="Medium">Medium</option>
//           <option value="Low">Low</option>
//           <option value="Urgent">Urgent</option>
//         </select>

//         <input
//           style={styles.file}
//           type="file"
//           multiple
//           onChange={(e) => setFiles(e.target.files)}
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
//     zIndex: 1000,
//   },
//   card: {
//     width: "430px",
//     background: "#fff",
//     borderRadius: "14px",
//     padding: "25px",
//     boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
//     display: "flex",
//     flexDirection: "column",
//     gap: "14px",
//   },
//   heading: {
//     marginBottom: "10px",
//     color: "#1f2937",
//     textAlign: "center",
//   },
//   input: {
//     padding: "12px",
//     borderRadius: "8px",
//     border: "1px solid #d1d5db",
//     fontSize: "14px",
//   },
//   file: {
//     fontSize: "14px",
//   },
//   actions: {
//     display: "flex",
//     justifyContent: "space-between",
//     marginTop: "15px",
//   },
//   cancel: {
//     padding: "10px 16px",
//     borderRadius: "8px",
//     border: "1px solid #d1d5db",
//     background: "#f3f4f6",
//     cursor: "pointer",
//   },
//   submit: {
//     padding: "10px 18px",
//     borderRadius: "8px",
//     border: "none",
//     background: "#4f46e5",
//     color: "#fff",
//     fontWeight: "bold",
//     cursor: "pointer",
//   },
// };






















// final working code before cc funtion add 30/03/26
// import { useState } from "react";
// import { supabase } from "../supabaseClient";
// import { sendTicketEmail } from "../utils/sendEmail"; // ✅ ADD THIS
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
//   const [priority, setPriority] = useState("Medium");
//   const [files, setFiles] = useState<FileList | null>(null);
//   const [loading, setLoading] = useState(false);




// const handleSubmit = async () => {
//   setLoading(true);

//   const { data } = await supabase.auth.getSession();
//   const session = data.session;

//   if (!session) {
//     alert("User not logged in");
//     setLoading(false);
//     return;
//   }

//   /* -------- attachments -------- */
//   let attachments: string[] = [];

//   if (files) {
//     for (const file of Array.from(files)) {
//       const path = `${session.user.id}/${Date.now()}_${file.name}`;
//       await supabase.storage.from("tickets").upload(path, file);
//       attachments.push(path);
//     }
//   }

//   /* -------- insert ticket -------- */
//   const { data: insertedData, error } = await supabase
//     .from("tickets")
//     .insert({
//       title,
//       description,
//       email: userEmail,
//       hod_email: hodEmail,
//       status: "Open",
//       priority: priority,
//       attachments,
//       created_by: session.user.id,
//       updated_at: new Date().toISOString(),
//     })
//     .select("*")
//     .single();

//   if (error) {
//     alert(error.message);
//   } else {
//     console.log("INSERTED DATA:", insertedData); // ✅ DEBUG

//     /* ✅ EMAIL TRIGGER */
//     await sendTicketEmail({
//       ticket_no: insertedData.ticket_no,  // Use generate ticket no.
//       //ticket_no: `T-${insertedData?.id}`, // ✅ FIXED (SAFE)
//       title: title,
//       description: description,
//       department: "IT",
//       priority: priority,
//       status: "Open",
//       email: [userEmail, hodEmail],
//       remark: "New Ticket Created", // ✅ NEW ADD
//     });

//     onSuccess();
//     onClose();
//   }

//   setLoading(false);
// };







//   // const handleSubmit = async () => {
//   //   setLoading(true);

//   //   const { data } = await supabase.auth.getSession();
//   //   const session = data.session;

//   //   if (!session) {
//   //     alert("User not logged in");
//   //     setLoading(false);
//   //     return;
//   //   }

//   //   /* -------- attachments -------- */
//   //   let attachments: string[] = [];

//   //   if (files) {
//   //     for (const file of Array.from(files)) {
//   //       const path = `${session.user.id}/${Date.now()}_${file.name}`;
//   //       await supabase.storage.from("tickets").upload(path, file);
//   //       attachments.push(path);
//   //     }
//   //   }

//   //   /* -------- insert ticket -------- */
//   //   const { data: insertedData, error } = await supabase
//   //     .from("tickets")
//   //     .insert({
//   //       title,
//   //       description,
//   //       email: userEmail,
//   //       hod_email: hodEmail,
//   //       status: "Open",
//   //       priority: priority,
//   //       attachments,
//   //       created_by: session.user.id,
//   //       updated_at: new Date().toISOString(),
//   //     })
//   //     .select()
//   //     .single(); // ✅ IMPORTANT

//   //   if (error) {
//   //     alert(error.message);
//   //   } else {
//   //     /* ✅ EMAIL TRIGGER */
//   //     await sendTicketEmail({
//   //       ticket_no: `T-${insertedData.id}`,
//   //       //ticket_no: insertedData.id, // ya agar aapke paas custom ticket_no hai to use karo
//   //       title,
//   //       description,
//   //       department: "IT", // optional (change if needed)
//   //       priority,
//   //       status: "Open",
//   //       email: [userEmail, hodEmail], // ✅ MULTIPLE EMAIL
//   //     });

//   //     onSuccess();
//   //     onClose();
//   //   }

//   //   setLoading(false);
//   // };

//   return (
//     <div style={styles.overlay}>
//       <div style={styles.card}>
//         <h2 style={styles.heading}>Create New Ticket</h2>

//         <input
//           style={styles.input}
//           placeholder="Your Email"
//           value={userEmail}
//           onChange={(e) => setUserEmail(e.target.value)}
//         />

//         <input
//           style={styles.input}
//           placeholder="Ticket Title"
//           value={title}
//           onChange={(e) => setTitle(e.target.value)}
//         />

//         <textarea
//           style={{ ...styles.input, height: "90px" }}
//           placeholder="Describe your issue"
//           value={description}
//           onChange={(e) => setDescription(e.target.value)}
//         />

//         <input
//           style={styles.input}
//           placeholder="HOD Email"
//           value={hodEmail}
//           onChange={(e) => setHodEmail(e.target.value)}
//         />

//         <select
//           style={styles.input}
//           value={priority}
//           onChange={(e) => setPriority(e.target.value)}
//         >
//           <option value="High">High</option>
//           <option value="Medium">Medium</option>
//           <option value="Low">Low</option>
//           <option value="Urgent">Urgent</option>
//         </select>

//         <input
//           style={styles.file}
//           type="file"
//           multiple
//           onChange={(e) => setFiles(e.target.files)}
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
//     zIndex: 1000,
//   },
//   card: {
//     width: "430px",
//     background: "#fff",
//     borderRadius: "14px",
//     padding: "25px",
//     boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
//     display: "flex",
//     flexDirection: "column",
//     gap: "14px",
//   },
//   heading: {
//     marginBottom: "10px",
//     color: "#1f2937",
//     textAlign: "center",
//   },
//   input: {
//     padding: "12px",
//     borderRadius: "8px",
//     border: "1px solid #d1d5db",
//     fontSize: "14px",
//   },
//   file: {
//     fontSize: "14px",
//   },
//   actions: {
//     display: "flex",
//     justifyContent: "space-between",
//     marginTop: "15px",
//   },
//   cancel: {
//     padding: "10px 16px",
//     borderRadius: "8px",
//     border: "1px solid #d1d5db",
//     background: "#f3f4f6",
//     cursor: "pointer",
//   },
//   submit: {
//     padding: "10px 18px",
//     borderRadius: "8px",
//     border: "none",
//     background: "#4f46e5",
//     color: "#fff",
//     fontWeight: "bold",
//     cursor: "pointer",
//   },
// };



























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
//   const [priority, setPriority] = useState("Medium"); // ✅ NEW
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

//     //update link
//         /* -------- attachments -------- */
//     // let attachments: string[] = [];

//     // if (files) {
//     //   for (const file of Array.from(files)) {
//     //     const path = `${session.user.id}/${Date.now()}_${file.name}`;
//     //     await supabase.storage.from("tickets").upload(path, file);
//     //     attachments.push(path);
//     //   }
//     // }

//     const { error } = await supabase.from("tickets").insert({
//       title,
//       description,
//       email: userEmail,
//       hod_email: hodEmail,
//       status: "Open",
//       priority: priority, // ✅ ADDED
//       attachments: [],
//       created_by: session.user.id,
//       updated_at: new Date().toISOString(),
//     });

//     if (error) {
//       alert(error.message);
//       setLoading(false);
//       return;
//     }

//     onSuccess();
//     onClose();
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
//           onChange={(e) => setUserEmail(e.target.value)}
//         />

//         <input
//           style={styles.input}
//           placeholder="Ticket Title"
//           value={title}
//           onChange={(e) => setTitle(e.target.value)}
//         />

//         <textarea
//           style={{ ...styles.input, height: "90px" }}
//           placeholder="Describe your issue"
//           value={description}
//           onChange={(e) => setDescription(e.target.value)}
//         />

//         <input
//           style={styles.input}
//           placeholder="HOD Email"
//           value={hodEmail}
//           onChange={(e) => setHodEmail(e.target.value)}
//         />

//         {/* ✅ PRIORITY DROPDOWN */}
//         <select
//           style={styles.input}
//           value={priority}
//           onChange={(e) => setPriority(e.target.value)}
//         >
//           <option value="High">High</option>
//           <option value="Medium">Medium</option>
//           <option value="Low">Low</option>
//           <option value="Urjent">Urjent</option>
//         </select>

//         <input
//           style={styles.file}
//           type="file"
//           multiple
//           onChange={(e) => setFiles(e.target.files)}
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

// /* ---------- STYLES (UNCHANGED) ---------- */

// const styles: Record<string, CSSProperties> = {
//   overlay: {
//     position: "fixed",
//     inset: 0,
//     background: "rgba(0,0,0,0.4)",
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//     zIndex: 1000,
//   },
//   card: {
//     width: "430px",
//     background: "#fff",
//     borderRadius: "14px",
//     padding: "25px",
//     boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
//     display: "flex",
//     flexDirection: "column",
//     gap: "14px",
//   },
//   heading: {
//     marginBottom: "10px",
//     color: "#1f2937",
//     textAlign: "center",
//   },
//   input: {
//     padding: "12px",
//     borderRadius: "8px",
//     border: "1px solid #d1d5db",
//     fontSize: "14px",
//   },
//   file: {
//     fontSize: "14px",
//   },
//   actions: {
//     display: "flex",
//     justifyContent: "space-between",
//     marginTop: "15px",
//   },
//   cancel: {
//     padding: "10px 16px",
//     borderRadius: "8px",
//     border: "1px solid #d1d5db",
//     background: "#f3f4f6",
//     cursor: "pointer",
//   },
//   submit: {
//     padding: "10px 18px",
//     borderRadius: "8px",
//     border: "none",
//     background: "#4f46e5",
//     color: "#fff",
//     fontWeight: "bold",
//     cursor: "pointer",
//   },
// };

