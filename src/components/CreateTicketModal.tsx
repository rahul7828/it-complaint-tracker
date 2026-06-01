import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { sendTicketEmail } from "../utils/sendEmail";
import type { CSSProperties } from "react";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  editData?: any;
}

export default function CreateTicketModal({
  onClose,
  onSuccess,
  editData,
}: Props) {
  const isEdit = !!editData;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [hodEmail, setHodEmail] = useState("");
  const [priority, setPriority] = useState("Medium");

  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  /* ================= PREFILL (EDIT MODE) ================= */
  useEffect(() => {
    if (editData) {
      setTitle(editData.title || "");
      setDescription(editData.description || "");
      setUserEmail(editData.email || "");
      setHodEmail(editData.hod_email || "");
      setPriority(editData.priority || "Medium");
    }
  }, [editData]);

  /* ================= EMAIL PARSER ================= */
  const parseEmails = (emailString: string) => {
    return emailString
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e !== "");
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    try {
      setLoading(true);

      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        alert("User not logged in");
        return;
      }

      const userEmailList = parseEmails(userEmail);
      const hodEmailList = parseEmails(hodEmail);

      let insertedData;
      let error;

      /* ================= EDIT MODE ================= */
      if (isEdit) {
        const res = await supabase
          .from("tickets")
          .update({
            title,
            description,
            email: userEmailList.join(","),
            hod_email: hodEmailList.join(","),
            priority,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editData.id)
          .select("*")
          .single();

        insertedData = res.data;
        error = res.error;
      }

      /* ================= CREATE MODE ================= */
      else {
        const res = await supabase
          .from("tickets")
          .insert({
            title,
            description,
            email: userEmailList.join(","),
            hod_email: hodEmailList.join(","),
            status: "Open",
            priority,
            created_by: session.user.id,
            updated_at: new Date().toISOString(),
          })
          .select("*")
          .single();

        insertedData = res.data;
        error = res.error;
      }

      if (error || !insertedData) throw error;

      /* ================= FILE UPLOAD (UNCHANGED LOGIC) ================= */
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

      if (attachments.length > 0) {
        await supabase
          .from("tickets")
          .update({ attachments })
          .eq("id", insertedData.id);
      }

      /* ================= EMAIL (UNCHANGED LOGIC) ================= */
      await sendTicketEmail({
        ticket_no: insertedData.ticket_no,
        title,
        description,
        department: "IT",
        priority,
        status: isEdit ? "Updated" : "Open",

        to: userEmailList,
        cc: hodEmailList,
        bcc: [],

        is_admin: false,
        remark: isEdit ? "Ticket Updated" : "New Ticket Created",
        attachments,
      });

      alert(isEdit ? "Ticket Updated ✅" : "Ticket Created ✅");

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
        {/* HEADER */}
        <h2 style={styles.header}>
          {isEdit ? "Edit Ticket" : "Create Ticket"}
        </h2>

        {/* CONTENT */}
        <div style={styles.content}>
          <input
            style={styles.input}
            placeholder="User Emails (comma separated)"
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
            style={{ ...styles.input, height: "110px", resize: "none" }}
            placeholder="Description"
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
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
            <option>Urgent</option>
          </select>

          {/* FILE INPUT (UNCHANGED) */}
          <input
            type="file"
            multiple
            style={styles.fileInput}
            onChange={(e) => {
              if (!e.target.files) return;

              const newFiles = Array.from(e.target.files);
              setFiles((prev) => [...prev, ...newFiles]);
              e.target.value = "";
            }}
          />
        </div>

        {/* ACTIONS */}
        <div style={styles.actions}>
          <button style={styles.cancel} onClick={onClose}>
            Cancel
          </button>

          <button
            style={styles.submit}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? "Submitting..."
              : isEdit
              ? "Update Ticket"
              : "Submit Ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= STYLES (UNCHANGED) ================= */

const styles: Record<string, CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },

  card: {
    width: "460px",
    background: "#111827",
    borderRadius: "20px",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
  },

  header: {
    padding: "20px",
    color: "#fff",
    textAlign: "center",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },

  content: {
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  input: {
    padding: "12px",
    borderRadius: "10px",
    background: "#0f172a",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.08)",
  },

  fileInput: {
    padding: "10px",
    background: "#0f172a",
    borderRadius: "10px",
    color: "#fff",
  },

  actions: {
    display: "flex",
    justifyContent: "space-between",
    padding: "15px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },

  cancel: {
    padding: "10px 14px",
    background: "#1e293b",
    color: "#fff",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
  },

  submit: {
    padding: "10px 14px",
    background: "#10b981",
    color: "#fff",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
  },
};




























// final working code before go live
// import { useState } from "react";
// import { supabase } from "../supabaseClient";
// import { sendTicketEmail } from "../utils/sendEmail";
// import type { CSSProperties } from "react";

// interface Props {
//   onClose: () => void;
//   onSuccess: () => void;
// }

// export default function CreateTicketModal({
//   onClose,
//   onSuccess,
// }: Props) {
//   const [title, setTitle] = useState("");
//   const [description, setDescription] =
//     useState("");
//   const [userEmail, setUserEmail] =
//     useState("");
//   const [hodEmail, setHodEmail] =
//     useState("");
//   const [priority, setPriority] =
//     useState("Medium");

//   const [files, setFiles] = useState<File[]>(
//     []
//   );
//   const [loading, setLoading] =
//     useState(false);

//   // ✅ parse emails
//   const parseEmails = (
//     emailString: string
//   ) => {
//     return emailString
//       .split(",")
//       .map((e) => e.trim())
//       .filter((e) => e !== "");
//   };

//   const handleSubmit = async () => {
//     try {
//       setLoading(true);

//       const { data } =
//         await supabase.auth.getSession();

//       const session = data.session;

//       if (!session) {
//         alert("User not logged in");
//         return;
//       }

//       // ✅ parse + validate
//       const userEmailList =
//         parseEmails(userEmail);

//       const hodEmailList =
//         parseEmails(hodEmail);

//       const emailRegex =
//         /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//       const allEmails = [
//         ...userEmailList,
//         ...hodEmailList,
//       ];

//       const invalidEmails =
//         allEmails.filter(
//           (email) =>
//             !emailRegex.test(email)
//         );

//       if (invalidEmails.length > 0) {
//         alert(
//           "Invalid emails: " +
//             invalidEmails.join(", ")
//         );
//         return;
//       }

//       /* -------- STEP 1: CREATE TICKET -------- */
//       const {
//         data: insertedData,
//         error,
//       } = await supabase
//         .from("tickets")
//         .insert({
//           title,
//           description,
//           email:
//             userEmailList.join(","),

//           hod_email:
//             hodEmailList.join(","),

//           status: "Open",
//           priority,
//           created_by: session.user.id,
//           updated_at:
//             new Date().toISOString(),
//         })
//         .select("*")
//         .single();

//       if (error || !insertedData)
//         throw error;

//       /* -------- STEP 2: UPLOAD FILES -------- */
//       let attachments: string[] = [];

//       for (const file of files) {
//         const cleanName =
//           file.name.replace(/\s+/g, "_");

//         const path = `${insertedData.ticket_no}/${cleanName}`;

//         const { error: uploadError } =
//           await supabase.storage
//             .from("tickets")
//             .upload(path, file);

//         if (uploadError) continue;

//         const { data: publicUrlData } =
//           supabase.storage
//             .from("tickets")
//             .getPublicUrl(path);

//         if (publicUrlData?.publicUrl) {
//           attachments.push(
//             publicUrlData.publicUrl
//           );
//         }
//       }

//       /* -------- STEP 3: UPDATE DB -------- */
//       if (attachments.length > 0) {
//         await supabase
//           .from("tickets")
//           .update({ attachments })
//           .eq("id", insertedData.id);
//       }

//       /* -------- STEP 4: SEND EMAIL -------- */
//       await sendTicketEmail({
//         ticket_no:
//           insertedData.ticket_no,

//         title,
//         description,
//         department: "IT",
//         priority,
//         status: "Open",

//         to: userEmailList,
//         cc: hodEmailList,
//         bcc: [],  

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
//         {/* HEADER */}
//         <h2 style={styles.header}>
//           Create New Ticket
//         </h2>

//         {/* CONTENT */}
//         <div style={styles.content}>
//           {/* USER EMAIL */}
//           <input
//             style={styles.input}
//             placeholder="Enter emails (comma separated)"
//             value={userEmail}
//             onChange={(e) =>
//               setUserEmail(
//                 e.target.value
//               )
//             }
//           />

//           {/* TITLE */}
//           <input
//             style={styles.input}
//             placeholder="Ticket Title"
//             value={title}
//             onChange={(e) =>
//               setTitle(e.target.value)
//             }
//           />

//           {/* DESCRIPTION */}
//           <textarea
//             style={{
//               ...styles.input,
//               height: "110px",
//               resize: "none",
//             }}
//             placeholder="Describe your issue"
//             value={description}
//             onChange={(e) =>
//               setDescription(
//                 e.target.value
//               )
//             }
//           />

//           {/* HOD EMAIL */}
//           <input
//             style={styles.input}
//             placeholder="HOD Emails (comma separated)"
//             value={hodEmail}
//             onChange={(e) =>
//               setHodEmail(
//                 e.target.value
//               )
//             }
//           />

//           {/* PRIORITY */}
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

//           {/* FILE INPUT */}
//           <input
//             type="file"
//             multiple
//             style={styles.fileInput}
//             onChange={(e) => {
//               if (!e.target.files)
//                 return;

//               const newFiles = Array.from(
//                 e.target.files
//               );

//               setFiles((prev) => [
//                 ...prev,
//                 ...newFiles,
//               ]);

//               e.target.value = "";
//             }}
//           />

//           {/* FILE PREVIEW */}
//           {files.length > 0 && (
//             <div>
//               <p style={styles.fileHeading}>
//                 Selected Files
//               </p>

//               <div style={styles.previewWrap}>
//                 {files.map(
//                   (file, index) => {
//                     const fileUrl =
//                       URL.createObjectURL(
//                         file
//                       );

//                     return (
//                       <div
//                         key={index}
//                         style={
//                           styles.previewBox
//                         }
//                       >
//                         <button
//                           onClick={() =>
//                             setFiles(
//                               (prev) =>
//                                 prev.filter(
//                                   (
//                                     _,
//                                     i
//                                   ) =>
//                                     i !==
//                                     index
//                                 )
//                             )
//                           }
//                           style={
//                             styles.removeBtn
//                           }
//                         >
//                           ×
//                         </button>

//                         {file.type.startsWith(
//                           "image/"
//                         ) && (
//                           <img
//                             src={fileUrl}
//                             style={
//                               styles.previewImg
//                             }
//                           />
//                         )}

//                         {file.type ===
//                           "application/pdf" && (
//                           <iframe
//                             src={fileUrl}
//                             style={
//                               styles.previewImg
//                             }
//                           />
//                         )}

//                         {!file.type.startsWith(
//                           "image/"
//                         ) &&
//                           file.type !==
//                             "application/pdf" && (
//                             <div
//                               style={{
//                                 fontSize:
//                                   "40px",
//                               }}
//                             >
//                               📁
//                             </div>
//                           )}

//                         <div
//                           style={
//                             styles.fileName
//                           }
//                         >
//                           {file.name}
//                         </div>
//                       </div>
//                     );
//                   }
//                 )}
//               </div>
//             </div>
//           )}
//         </div>

//         {/* ACTIONS */}
//         <div style={styles.actions}>
//           <button
//             style={styles.cancel}
//             onClick={onClose}
//           >
//             Cancel
//           </button>

//           <button
//             style={styles.submit}
//             onClick={handleSubmit}
//             disabled={loading}
//           >
//             {loading
//               ? "Submitting..."
//               : "Submit Ticket"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ---------- STYLES ---------- */

// const styles: Record<
//   string,
//   CSSProperties
// > = {
//   overlay: {
//     position: "fixed",
//     inset: 0,
//     background:
//       "rgba(0,0,0,0.7)",
//     backdropFilter: "blur(4px)",
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//     zIndex: 9999,
//     padding: "20px",
//   },

//   card: {
//     width: "460px",
//     maxHeight: "90vh",
//     background: "#111827",
//     borderRadius: "20px",
//     display: "flex",
//     flexDirection: "column",
//     overflow: "hidden",
//     zIndex: 10000,
//     border:
//       "1px solid rgba(255,255,255,0.08)",
//     boxShadow:
//       "0 20px 40px rgba(0,0,0,0.45)",
//   },

//   header: {
//     position: "sticky",
//     top: 0,
//     background: "#111827",
//     padding: "20px",
//     textAlign: "center",
//     fontWeight: 700,
//     fontSize: "24px",
//     color: "#fff",
//     borderBottom:
//       "1px solid rgba(255,255,255,0.06)",
//     zIndex: 10,
//   },

//   content: {
//     padding: "22px",
//     overflowY: "auto",
//     flex: 1,
//     display: "flex",
//     flexDirection: "column",
//     gap: "16px",
//   },

//   input: {
//     padding: "13px 14px",
//     borderRadius: "12px",
//     border:
//       "1px solid rgba(255,255,255,0.08)",
//     background: "#0f172a",
//     color: "#fff",
//     outline: "none",
//     fontSize: "14px",
//   },

//   fileInput: {
//     color: "#cbd5e1",
//     background: "#0f172a",
//     padding: "10px",
//     borderRadius: "10px",
//     border:
//       "1px solid rgba(255,255,255,0.08)",
//   },

//   fileHeading: {
//     marginBottom: "12px",
//     color: "#fff",
//     fontWeight: 600,
//   },

//   previewWrap: {
//     display: "flex",
//     flexWrap: "wrap",
//     gap: "12px",
//   },

//   previewBox: {
//     width: "120px",
//     border:
//       "1px solid rgba(255,255,255,0.08)",
//     borderRadius: "12px",
//     padding: "8px",
//     textAlign: "center",
//     position: "relative",
//     background: "#0f172a",
//   },

//   previewImg: {
//     width: "100%",
//     height: "80px",
//     objectFit: "cover",
//     borderRadius: "8px",
//   },

//   fileName: {
//     fontSize: "11px",
//     marginTop: "6px",
//     wordBreak: "break-word",
//     color: "#cbd5e1",
//   },

//   removeBtn: {
//     position: "absolute",
//     top: "4px",
//     right: "4px",
//     background: "#ef4444",
//     color: "#fff",
//     border: "none",
//     borderRadius: "50%",
//     cursor: "pointer",
//     width: "20px",
//     height: "20px",
//     fontWeight: "bold",
//   },

//   actions: {
//     position: "sticky",
//     bottom: 0,
//     background: "#111827",
//     padding: "18px 22px",
//     display: "flex",
//     justifyContent:
//       "space-between",
//     borderTop:
//       "1px solid rgba(255,255,255,0.06)",
//   },

//   cancel: {
//     padding: "10px 18px",
//     border:
//       "1px solid rgba(255,255,255,0.1)",
//     borderRadius: "10px",
//     background: "#1e293b",
//     color: "#fff",
//     cursor: "pointer",
//     fontWeight: 600,
//   },

//   submit: {
//     padding: "10px 18px",
//     background: "#10b981",
//     color: "#fff",
//     border: "none",
//     borderRadius: "10px",
//     cursor: "pointer",
//     fontWeight: 600,
//   },
// };






















// final working code before vaibhav sir design changes 21/05/26
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

//       // ✅ parse + validate
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
//           email: userEmailList.join(","),      // store
//           hod_email: hodEmailList.join(","),   // store
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

//       /* -------- STEP 4: SEND EMAIL (FINAL FIX) -------- */
//       await sendTicketEmail({
//         ticket_no: insertedData.ticket_no,
//         title,
//         description,
//         department: "IT",
//         priority,
//         status: "Open",

//         // 🔥 FINAL STRUCTURE
//         to: userEmailList,
//         cc: hodEmailList,
//         bcc: [],

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
