import React, { useMemo, useState } from "react";
import ExcelJS from "exceljs";

type Ticket = {
  id: string;
  ticket_no: string;
  title: string;
  description: string;
  status: string;
  priority: string | null;
  created_at: string | null;
  email: string;
  hod_email: string | null;
  attachments: string[] | null;
  ticket_updates?: {
    message: string;
    created_at: string;
  }[];
};

type Props = {
  tickets: Ticket[];
  onSelect?: (ticket: Ticket) => void;
};

export default function TicketList({ tickets, onSelect }: Props) {
  const [filters, setFilters] = useState({
    ticket_no: "",
    title: "",
    description: "",
    status: "",
    priority: "",
    created_at: "",
    email: "",
    hod_email: "",
    remark: "",
  });

  const downloadAttachment = (filePath: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) return;

    const url = `${supabaseUrl}/storage/v1/object/public/tickets/${filePath}`;
    window.open(url, "_blank");
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const lastRemark =
        t.ticket_updates && t.ticket_updates.length > 0
          ? t.ticket_updates[t.ticket_updates.length - 1].message
          : "";

      return (
        (t.ticket_no || "").toLowerCase().includes(filters.ticket_no.toLowerCase()) &&
        (t.title || "").toLowerCase().includes(filters.title.toLowerCase()) &&
        (t.description || "").toLowerCase().includes(filters.description.toLowerCase()) &&
        (t.status || "").toLowerCase().includes(filters.status.toLowerCase()) &&
        (t.priority || "").toLowerCase().includes(filters.priority.toLowerCase()) &&
        (t.created_at
          ? new Date(t.created_at).toLocaleString().toLowerCase()
          : ""
        ).includes(filters.created_at.toLowerCase()) &&
        (t.email || "").toLowerCase().includes(filters.email.toLowerCase()) &&
        (t.hod_email || "").toLowerCase().includes(filters.hod_email.toLowerCase()) &&
        (lastRemark || "").toLowerCase().includes(filters.remark.toLowerCase())
      );
    });
  }, [tickets, filters]);
  // excel export feature
  const exportToExcel = async () => {

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Tickets");

  worksheet.columns = [
    { header: "Ticket No", key: "ticket_no", width: 15 },
    { header: "Title", key: "title", width: 30 },
    { header: "Description", key: "description", width: 40 },
    { header: "Priority", key: "priority", width: 15 },
    { header: "Status", key: "status", width: 15 },
    { header: "User Email", key: "email", width: 30 },
    { header: "HOD Email", key: "hod_email", width: 30 },
    { header: "Created Date", key: "created_at", width: 20 },
  ];

  filteredTickets
    .filter((t) => t.status !== "Closed")
    .forEach((t) => {

      const row = worksheet.addRow({
        ticket_no: t.ticket_no,
        title: t.title,
        description: t.description,
        priority: (t as any).priority,
        status: t.status,
        email: t.email,
        hod_email: t.hod_email,
        created_at: new Date((t as any).created_at).toLocaleString(),
      });

      const priority = (t as any).priority;

      if (priority === "High") {
        row.getCell("priority").fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFF9999" },
        };
      }

      if (priority === "Medium") {
        row.getCell("priority").fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFEB9C" },
        };
      }

      if (priority === "Low") {
        row.getCell("priority").fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFC6EFCE" },
        };
      }

      if (priority === "Urgent") {
        row.getCell("priority").fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFF0000" },
        };
      }
    });

  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([buffer]);

  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;

  a.download = "tickets.xlsx";

  a.click();

};

//end code of excel export button


  return (
    <div style={styles.wrapper} tabIndex={0}>
      <button onClick={exportToExcel} style={{
  marginBottom: "15px",
  padding: "10px 16px",
  background: "#4f46e5",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer"
}}>
Export Excel
</button>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Ticket No</th>
            <th style={styles.th}>Title</th>
            <th style={styles.th}>Description</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Priority</th>
            <th style={styles.th}>Created</th>
            <th style={styles.th}>User Email</th>
            <th style={styles.th}>HOD Email</th>
            <th style={styles.th}>Remark</th>
            <th style={styles.th}>Attachments</th>
          </tr>

          <tr>
            {Object.keys(filters).map((key) => (
              <th key={key} style={styles.filterCell}>
                <input
                  style={styles.filterInput}
                  placeholder="Filter"
                  value={(filters as any)[key]}
                  onChange={(e) =>
                    setFilters({ ...filters, [key]: e.target.value })
                  }
                />
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {filteredTickets.length === 0 && (
            <tr>
              <td colSpan={10} style={styles.empty}>
                No tickets found
              </td>
            </tr>
          )}

          {filteredTickets.map((t) => (
            <tr
              key={t.id}
              onClick={() => onSelect?.(t)}
              style={{ cursor: "pointer" }}
            >
              <td style={styles.td}>{t.ticket_no}</td>
              <td style={styles.td}>{t.title}</td>
              <td style={styles.td}>{t.description}</td>
              <td style={styles.td}>{t.status}</td>
              <td style={styles.td}>{t.priority || "-"}</td>
              <td style={styles.td}>
                {t.created_at
                  ? new Date(t.created_at).toLocaleString()
                  : "-"}
              </td>
              <td style={styles.td}>{t.email}</td>
              <td style={styles.td}>{t.hod_email || "-"}</td>

              <td style={styles.td}>
                {t.ticket_updates && t.ticket_updates.length > 0
                  ? t.ticket_updates[t.ticket_updates.length - 1].message
                  : "-"}
              </td>

              <td style={styles.td}>
                {Array.isArray(t.attachments) && t.attachments.length > 0 ? (
                  t.attachments.map((file, i) => (
                    <div key={i}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadAttachment(file);
                        }}
                        style={styles.downloadBtn}
                      >
                        📎 {file.split("/").pop()}
                      </button>
                    </div>
                  ))
                ) : (
                  <span style={styles.muted}>No file</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  wrapper: {
    marginTop: "20px",
    height: "70vh",
    overflow: "scroll",
    background: "#fff",
    borderRadius: "10px",
    boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
    outline: "none",
  },
  exportBtn: {
  margin: "10px",
  padding: "10px 16px",
  background: "#4f46e5",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer"
},
  table: {
    width: "100%",
    minWidth: "1600px",
    tableLayout: "fixed",
    borderCollapse: "separate",
    borderSpacing: "0 10px",
  },
  th: {
    padding: "14px",
    background: "#f1f5f9",
    textAlign: "left",
    fontWeight: 600,
    position: "sticky",
    top: 0,
    zIndex: 2,
  },
  td: {
    padding: "14px",
    background: "#ffffff",
    borderTop: "1px solid #e5e7eb",
    borderBottom: "1px solid #e5e7eb",
    wordBreak: "break-word",
  },
  filterCell: {
    padding: "6px",
    background: "#f8fafc",
  },
  filterInput: {
    width: "100%",
    padding: "6px",
    fontSize: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
  },
  downloadBtn: {
    background: "none",
    border: "none",
    color: "#2563eb",
    cursor: "pointer",
    padding: 0,
  },
  muted: {
    color: "#9ca3af",
    fontSize: "13px",
  },
  empty: {
    textAlign: "center",
    padding: "30px",
    color: "#6b7280",
  },

};



























/// main last final working code before excel export feature
// import React, { useMemo, useState } from "react";
// import ExcelJS from "exceljs";

// type Ticket = {
//   id: string;
//   ticket_no: string;
//   title: string;
//   description: string;
//   status: string;
//   priority: string | null;
//   created_at: string | null;
//   email: string;
//   hod_email: string | null;
//   attachments: string[] | null;
//   ticket_updates?: {
//     message: string;
//     created_at: string;
//   }[];
// };

// type Props = {
//   tickets: Ticket[];
//   onSelect?: (ticket: Ticket) => void;
// };

// export default function TicketList({ tickets, onSelect }: Props) {
//   const [filters, setFilters] = useState({
//     ticket_no: "",
//     title: "",
//     description: "",
//     status: "",
//     priority: "",
//     created_at: "",
//     email: "",
//     hod_email: "",
//     remark: "",
//   });

//   const downloadAttachment = (filePath: string) => {
//     const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
//     if (!supabaseUrl) return;

//     const url = `${supabaseUrl}/storage/v1/object/public/tickets/${filePath}`;
//     window.open(url, "_blank");
//   };

//   const filteredTickets = useMemo(() => {
//     return tickets.filter((t) => {
//       const lastRemark =
//         t.ticket_updates && t.ticket_updates.length > 0
//           ? t.ticket_updates[t.ticket_updates.length - 1].message
//           : "";

//       return (
//         (t.ticket_no || "").toLowerCase().includes(filters.ticket_no.toLowerCase()) &&
//         (t.title || "").toLowerCase().includes(filters.title.toLowerCase()) &&
//         (t.description || "").toLowerCase().includes(filters.description.toLowerCase()) &&
//         (t.status || "").toLowerCase().includes(filters.status.toLowerCase()) &&
//         (t.priority || "").toLowerCase().includes(filters.priority.toLowerCase()) &&
//         (t.created_at
//           ? new Date(t.created_at).toLocaleString().toLowerCase()
//           : ""
//         ).includes(filters.created_at.toLowerCase()) &&
//         (t.email || "").toLowerCase().includes(filters.email.toLowerCase()) &&
//         (t.hod_email || "").toLowerCase().includes(filters.hod_email.toLowerCase()) &&
//         (lastRemark || "").toLowerCase().includes(filters.remark.toLowerCase())
//       );
//     });
//   }, [tickets, filters]);
//   // excel export feature
//   const exportToExcel = async () => {

//   const workbook = new ExcelJS.Workbook();
//   const worksheet = workbook.addWorksheet("Tickets");

//   worksheet.columns = [
//     { header: "Ticket No", key: "ticket_no", width: 15 },
//     { header: "Title", key: "title", width: 30 },
//     { header: "Description", key: "description", width: 40 },
//     { header: "Priority", key: "priority", width: 15 },
//     { header: "Status", key: "status", width: 15 },
//     { header: "User Email", key: "email", width: 30 },
//     { header: "HOD Email", key: "hod_email", width: 30 },
//     { header: "Created Date", key: "created_at", width: 20 },
//   ];

//   filteredTickets
//     .filter((t) => t.status !== "Closed")
//     .forEach((t) => {

//       const row = worksheet.addRow({
//         ticket_no: t.ticket_no,
//         title: t.title,
//         description: t.description,
//         priority: (t as any).priority,
//         status: t.status,
//         email: t.email,
//         hod_email: t.hod_email,
//         created_at: new Date((t as any).created_at).toLocaleString(),
//       });

//       const priority = (t as any).priority;

//       if (priority === "High") {
//         row.getCell("priority").fill = {
//           type: "pattern",
//           pattern: "solid",
//           fgColor: { argb: "FFFF9999" },
//         };
//       }

//       if (priority === "Medium") {
//         row.getCell("priority").fill = {
//           type: "pattern",
//           pattern: "solid",
//           fgColor: { argb: "FFFFEB9C" },
//         };
//       }

//       if (priority === "Low") {
//         row.getCell("priority").fill = {
//           type: "pattern",
//           pattern: "solid",
//           fgColor: { argb: "FFC6EFCE" },
//         };
//       }

//       if (priority === "Urgent") {
//         row.getCell("priority").fill = {
//           type: "pattern",
//           pattern: "solid",
//           fgColor: { argb: "FFFF0000" },
//         };
//       }
//     });

//   const buffer = await workbook.xlsx.writeBuffer();

//   const blob = new Blob([buffer]);

//   const url = window.URL.createObjectURL(blob);

//   const a = document.createElement("a");

//   a.href = url;

//   a.download = "tickets.xlsx";

//   a.click();

// };

// //end code of excel export button

//   return (
//     <div style={styles.wrapper} tabIndex={0}>
//       <table style={styles.table}>
//         <thead>
//           <tr>
//             <th style={styles.th}>Ticket No</th>
//             <th style={styles.th}>Title</th>
//             <th style={styles.th}>Description</th>
//             <th style={styles.th}>Status</th>
//             <th style={styles.th}>Priority</th>
//             <th style={styles.th}>Created</th>
//             <th style={styles.th}>User Email</th>
//             <th style={styles.th}>HOD Email</th>
//             <th style={styles.th}>Remark</th>
//             <th style={styles.th}>Attachments</th>
//           </tr>

//           <tr>
//             {Object.keys(filters).map((key) => (
//               <th key={key} style={styles.filterCell}>
//                 <input
//                   style={styles.filterInput}
//                   placeholder="Filter"
//                   value={(filters as any)[key]}
//                   onChange={(e) =>
//                     setFilters({ ...filters, [key]: e.target.value })
//                   }
//                 />
//               </th>
//             ))}
//           </tr>
//         </thead>

//         <tbody>
//           {filteredTickets.length === 0 && (
//             <tr>
//               <td colSpan={10} style={styles.empty}>
//                 No tickets found
//               </td>
//             </tr>
//           )}

//           {filteredTickets.map((t) => (
//             <tr
//               key={t.id}
//               onClick={() => onSelect?.(t)}
//               style={{ cursor: "pointer" }}
//             >
//               <td style={styles.td}>{t.ticket_no}</td>
//               <td style={styles.td}>{t.title}</td>
//               <td style={styles.td}>{t.description}</td>
//               <td style={styles.td}>{t.status}</td>
//               <td style={styles.td}>{t.priority || "-"}</td>
//               <td style={styles.td}>
//                 {t.created_at
//                   ? new Date(t.created_at).toLocaleString()
//                   : "-"}
//               </td>
//               <td style={styles.td}>{t.email}</td>
//               <td style={styles.td}>{t.hod_email || "-"}</td>

//               <td style={styles.td}>
//                 {t.ticket_updates && t.ticket_updates.length > 0
//                   ? t.ticket_updates[t.ticket_updates.length - 1].message
//                   : "-"}
//               </td>

//               <td style={styles.td}>
//                 {Array.isArray(t.attachments) && t.attachments.length > 0 ? (
//                   t.attachments.map((file, i) => (
//                     <div key={i}>
//                       <button
//                         type="button"
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           downloadAttachment(file);
//                         }}
//                         style={styles.downloadBtn}
//                       >
//                         📎 {file.split("/").pop()}
//                       </button>
//                     </div>
//                   ))
//                 ) : (
//                   <span style={styles.muted}>No file</span>
//                 )}
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// const styles: { [key: string]: React.CSSProperties } = {
//   wrapper: {
//     marginTop: "20px",
//     height: "70vh",
//     overflow: "scroll",
//     background: "#fff",
//     borderRadius: "10px",
//     boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
//     outline: "none",
//   },
//   table: {
//     width: "100%",
//     minWidth: "1600px",
//     tableLayout: "fixed",
//     borderCollapse: "separate",
//     borderSpacing: "0 10px",
//   },
//   th: {
//     padding: "14px",
//     background: "#f1f5f9",
//     textAlign: "left",
//     fontWeight: 600,
//     position: "sticky",
//     top: 0,
//     zIndex: 2,
//   },
//   td: {
//     padding: "14px",
//     background: "#ffffff",
//     borderTop: "1px solid #e5e7eb",
//     borderBottom: "1px solid #e5e7eb",
//     wordBreak: "break-word",
//   },
//   filterCell: {
//     padding: "6px",
//     background: "#f8fafc",
//   },
//   filterInput: {
//     width: "100%",
//     padding: "6px",
//     fontSize: "12px",
//     border: "1px solid #d1d5db",
//     borderRadius: "6px",
//   },
//   downloadBtn: {
//     background: "none",
//     border: "none",
//     color: "#2563eb",
//     cursor: "pointer",
//     padding: 0,
//   },
//   muted: {
//     color: "#9ca3af",
//     fontSize: "13px",
//   },
//   empty: {
//     textAlign: "center",
//     padding: "30px",
//     color: "#6b7280",
//   },
// };




















// //final working code before vaibhav sir changes
// import React, { useMemo, useState } from "react";

// type Ticket = {
//   id: string;
//   ticket_no: string;
//   title: string;
//   description: string;
//   status: string;
//   email: string;
//   hod_email: string;
//   attachments: string[] | null;
//   ticket_updates?: {
//     message: string;
//     created_at: string;
//   }[];
// };

// type Props = {
//   tickets: Ticket[];
//   onSelect?: (ticket: Ticket) => void;
// };

// export default function TicketList({ tickets, onSelect }: Props) {
//   const [filters, setFilters] = useState({
//     ticket_no: "",
//     title: "",
//     description: "",
//     status: "",
//     email: "",
//     hod_email: "",
//     remark: "",
//   });

//   const downloadAttachment = (filePath: string) => {
//     const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
//     if (!supabaseUrl) return;

//     const url = `${supabaseUrl}/storage/v1/object/public/tickets/${filePath}`;
//     window.open(url, "_blank");
//   };

//   const filteredTickets = useMemo(() => {
//     return tickets.filter((t) => {
//       const lastRemark =
//         t.ticket_updates && t.ticket_updates.length > 0
//           ? t.ticket_updates[t.ticket_updates.length - 1].message
//           : "";

//       return (
//         t.ticket_no.toLowerCase().includes(filters.ticket_no.toLowerCase()) &&
//         t.title.toLowerCase().includes(filters.title.toLowerCase()) &&
//         t.description.toLowerCase().includes(filters.description.toLowerCase()) &&
//         t.status.toLowerCase().includes(filters.status.toLowerCase()) &&
//         t.email.toLowerCase().includes(filters.email.toLowerCase()) &&
//         t.hod_email.toLowerCase().includes(filters.hod_email.toLowerCase()) &&
//         lastRemark.toLowerCase().includes(filters.remark.toLowerCase())
//       );
//     });
//   }, [tickets, filters]);

//   return (
//     /* ✅ KEYBOARD + SCROLL FIX */
//     <div
//       style={styles.wrapper}
//       tabIndex={0}               // ✅ keyboard focus
//     >
//       <table style={styles.table}>
//         <thead>
//           <tr>
//             <th style={styles.th}>Ticket No</th>
//             <th style={styles.th}>Title</th>
//             <th style={styles.th}>Description</th>
//             <th style={styles.th}>Status</th>
//             <th style={styles.th}>User Email</th>
//             <th style={styles.th}>HOD Email</th>
//             <th style={styles.th}>Remark</th>
//             <th style={styles.th}>Attachments</th>
//           </tr>

//           <tr>
//             {Object.keys(filters).map((key) => (
//               <th key={key} style={styles.filterCell}>
//                 <input
//                   style={styles.filterInput}
//                   placeholder="Filter"
//                   value={(filters as any)[key]}
//                   onChange={(e) =>
//                     setFilters({ ...filters, [key]: e.target.value })
//                   }
//                 />
//               </th>
//             ))}
//             <th />
//           </tr>
//         </thead>

//         <tbody>
//           {filteredTickets.length === 0 && (
//             <tr>
//               <td colSpan={8} style={styles.empty}>
//                 No tickets found
//               </td>
//             </tr>
//           )}

//           {filteredTickets.map((t) => (
//             <tr
//               key={t.id}
//               onClick={() => onSelect?.(t)}
//               style={{ cursor: "pointer" }}
//             >
//               <td style={styles.td}>{t.ticket_no}</td>
//               <td style={styles.td}>{t.title}</td>
//               <td style={styles.td}>{t.description}</td>
//               <td style={styles.td}>{t.status}</td>
//               <td style={styles.td}>{t.email}</td>
//               <td style={styles.td}>{t.hod_email}</td>

//               <td style={styles.td}>
//                 {t.ticket_updates && t.ticket_updates.length > 0
//                   ? t.ticket_updates[t.ticket_updates.length - 1].message
//                   : "-"}
//               </td>

//               <td style={styles.td}>
//                 {Array.isArray(t.attachments) && t.attachments.length > 0 ? (
//                   t.attachments.map((file, i) => (
//                     <div key={i}>
//                       <button
//                         type="button"
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           downloadAttachment(file);
//                         }}
//                         style={styles.downloadBtn}
//                       >
//                         📎 {file.split("/").pop()}
//                       </button>
//                     </div>
//                   ))
//                 ) : (
//                   <span style={styles.muted}>No file</span>
//                 )}
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// /* 🎨 STYLES (SCROLL NEVER DISAPPEARS) */
// const styles: { [key: string]: React.CSSProperties } = {
//   wrapper: {
//     marginTop: "20px",
//     height: "70vh",
//     overflow: "scroll",          // ✅ always show scrollbar
//     background: "#fff",
//     borderRadius: "10px",
//     boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
//     outline: "none",             // ✅ no focus border
//   },
//   table: {
//     width: "100%",
//     minWidth: "1400px",           // ✅ scrollbar stays even if rows less
//     tableLayout: "fixed",         // ✅ prevents shrinking
//     borderCollapse: "separate",
//     borderSpacing: "0 10px",
//   },
//   th: {
//     padding: "14px",
//     background: "#f1f5f9",
//     textAlign: "left",
//     fontWeight: 600,
//     position: "sticky",
//     top: 0,
//     zIndex: 2,
//   },
//   td: {
//     padding: "14px",
//     background: "#ffffff",
//     borderTop: "1px solid #e5e7eb",
//     borderBottom: "1px solid #e5e7eb",
//     wordBreak: "break-word",
//   },
//   filterCell: {
//     padding: "6px",
//     background: "#f8fafc",
//   },
//   filterInput: {
//     width: "100%",
//     padding: "6px",
//     fontSize: "12px",
//     border: "1px solid #d1d5db",
//     borderRadius: "6px",
//   },
//   downloadBtn: {
//     background: "none",
//     border: "none",
//     color: "#2563eb",
//     cursor: "pointer",
//     padding: 0,
//   },
//   muted: {
//     color: "#9ca3af",
//     fontSize: "13px",
//   },
//   empty: {
//     textAlign: "center",
//     padding: "30px",
//     color: "#6b7280",
//   },
// };


























//working coder with filter but scroll bar is disappeared
// import React, { useMemo, useState } from "react";

// type Ticket = {
//   id: string;
//   ticket_no: string;
//   title: string;
//   description: string;
//   status: string;
//   email: string;
//   hod_email: string;
//   attachments: string[] | null;
//   ticket_updates?: {
//     message: string;
//     created_at: string;
//   }[];
// };

// type Props = {
//   tickets: Ticket[];
//   onSelect?: (ticket: Ticket) => void;
// };

// export default function TicketList({ tickets, onSelect }: Props) {
//   /* 🔹 FILTER STATE (LOGIC ONLY) */
//   const [filters, setFilters] = useState({
//     ticket_no: "",
//     title: "",
//     description: "",
//     status: "",
//     email: "",
//     hod_email: "",
//     remark: "",
//   });

//   const downloadAttachment = (filePath: string) => {
//     const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
//     if (!supabaseUrl) return;

//     const url = `${supabaseUrl}/storage/v1/object/public/tickets/${filePath}`;
//     window.open(url, "_blank");
//   };

//   /* 🔹 FILTERED DATA (NO API CHANGE) */
//   const filteredTickets = useMemo(() => {
//     return tickets.filter((t) => {
//       const lastRemark =
//         t.ticket_updates && t.ticket_updates.length > 0
//           ? t.ticket_updates[t.ticket_updates.length - 1].message
//           : "";

//       return (
//         t.ticket_no.toLowerCase().includes(filters.ticket_no.toLowerCase()) &&
//         t.title.toLowerCase().includes(filters.title.toLowerCase()) &&
//         t.description
//           .toLowerCase()
//           .includes(filters.description.toLowerCase()) &&
//         t.status.toLowerCase().includes(filters.status.toLowerCase()) &&
//         t.email.toLowerCase().includes(filters.email.toLowerCase()) &&
//         t.hod_email.toLowerCase().includes(filters.hod_email.toLowerCase()) &&
//         lastRemark.toLowerCase().includes(filters.remark.toLowerCase())
//       );
//     });
//   }, [tickets, filters]);

//   return (
//     <div style={styles.wrapper}>
//       <table style={styles.table}>
//         <thead>
//           <tr>
//             <th style={styles.th}>Ticket No</th>
//             <th style={styles.th}>Title</th>
//             <th style={styles.th}>Description</th>
//             <th style={styles.th}>Status</th>
//             <th style={styles.th}>User Email</th>
//             <th style={styles.th}>HOD Email</th>
//             <th style={styles.th}>Remark</th>
//             <th style={styles.th}>Attachments</th>
//           </tr>

//           {/* 🔹 FILTER ROW */}
//           <tr>
//             {Object.keys(filters).map((key) => (
//               <th key={key} style={styles.filterCell}>
//                 <input
//                   style={styles.filterInput}
//                   placeholder="Filter"
//                   value={(filters as any)[key]}
//                   onChange={(e) =>
//                     setFilters({ ...filters, [key]: e.target.value })
//                   }
//                 />
//               </th>
//             ))}
//             <th /> {/* attachments column */}
//           </tr>
//         </thead>

//         <tbody>
//           {filteredTickets.length === 0 && (
//             <tr>
//               <td colSpan={8} style={styles.empty}>
//                 No tickets found
//               </td>
//             </tr>
//           )}

//           {filteredTickets.map((t) => (
//             <tr
//               key={t.id}
//               onClick={() => onSelect?.(t)}
//               style={{ cursor: "pointer" }}
//             >
//               <td style={styles.td}>{t.ticket_no}</td>
//               <td style={styles.td}>{t.title}</td>
//               <td style={styles.td}>{t.description}</td>
//               <td style={styles.td}>{t.status}</td>
//               <td style={styles.td}>{t.email}</td>
//               <td style={styles.td}>{t.hod_email}</td>

//               <td style={styles.td}>
//                 {t.ticket_updates && t.ticket_updates.length > 0
//                   ? t.ticket_updates[t.ticket_updates.length - 1].message
//                   : "-"}
//               </td>

//               <td style={styles.td}>
//                 {Array.isArray(t.attachments) && t.attachments.length > 0 ? (
//                   t.attachments.map((file, i) => (
//                     <div key={i}>
//                       <button
//                         type="button"
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           downloadAttachment(file);
//                         }}
//                         style={styles.downloadBtn}
//                       >
//                         📎 {file.split("/").pop()}
//                       </button>
//                     </div>
//                   ))
//                 ) : (
//                   <span style={styles.muted}>No file</span>
//                 )}
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// /* 🎨 STYLES (UI SAME + SCROLL FIX) */
// const styles: { [key: string]: React.CSSProperties } = {
//   wrapper: {
//     marginTop: "20px",
//     maxHeight: "70vh",       // ✅ vertical scroll
//     overflowY: "auto",
//     overflowX: "auto",       // ✅ horizontal scroll
//     background: "#fff",
//     borderRadius: "10px",
//     boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
//   },
//   table: {
//     width: "100%",
//     minWidth: "1200px",      // ✅ force horizontal scroll
//     borderCollapse: "separate",
//     borderSpacing: "0 10px",
//   },
//   th: {
//     padding: "14px",
//     background: "#f1f5f9",
//     textAlign: "left",
//     fontWeight: 600,
//     position: "sticky",
//     top: 0,
//     zIndex: 1,
//   },
//   td: {
//     padding: "14px",
//     background: "#ffffff",
//     borderTop: "1px solid #e5e7eb",
//     borderBottom: "1px solid #e5e7eb",
//   },
//   filterCell: {
//     padding: "6px",
//     background: "#f8fafc",
//   },
//   filterInput: {
//     width: "100%",
//     padding: "6px",
//     fontSize: "12px",
//     border: "1px solid #d1d5db",
//     borderRadius: "6px",
//   },
//   downloadBtn: {
//     background: "none",
//     border: "none",
//     color: "#2563eb",
//     cursor: "pointer",
//     padding: 0,
//   },
//   muted: {
//     color: "#9ca3af",
//     fontSize: "13px",
//   },
//   empty: {
//     textAlign: "center",
//     padding: "30px",
//     color: "#6b7280",
//   },
// };



















// final working code after deployment
// import React from "react";
// //import { supabase } from "../supabaseClient";

// type Ticket = {
//   id: string;
//   ticket_no: string;
//   title: string;
//   description: string;
//   status: string;
//   email: string;
//   hod_email: string;
//   attachments: string[] | null;
//   ticket_updates?: {
//     message: string;
//     created_at: string;
//   }[];
// };

// type Props = {
//   tickets: Ticket[];
//   onSelect?: (ticket: Ticket) => void;
// };

// export default function TicketList({ tickets, onSelect }: Props) {
//   const downloadAttachment = (filePath: string) => {
//   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

//   if (!supabaseUrl) {
//     alert("Supabase URL not found");
//     return;
//   }

//   const url =
//     `${supabaseUrl}/storage/v1/object/public/tickets/${filePath}`;

//   window.open(url, "_blank");
// };

//   // const downloadAttachment = (filePath: string) => {
//   //   const { data } = supabase
//   //     .storage
//   //     .from("attachments")
//   //     .getPublicUrl(filePath);

//   //   window.open(data.publicUrl, "_blank");
//   // };

//   return (
//     <div style={styles.wrapper}>
//       <table style={styles.table}>
//         <thead>
//           <tr>
//             <th style={styles.th}>Ticket No</th>
//             <th style={styles.th}>Title</th>
//             <th style={styles.th}>Description</th>
//             <th style={styles.th}>Status</th>
//             <th style={styles.th}>User Email</th>
//             <th style={styles.th}>HOD Email</th>
//             <th style={styles.th}>Remark</th>
//             <th style={styles.th}>Attachments</th>
//           </tr>
//         </thead>

//         <tbody>
//           {tickets.length === 0 && (
//             <tr>
//               <td colSpan={8} style={styles.empty}>
//                 No tickets found
//               </td>
//             </tr>
//           )}

//           {tickets.map((t) => (
//             <tr
//               key={t.id}
//               onClick={() => onSelect?.(t)}
//               style={{ cursor: "pointer" }}
//             >
//               <td style={styles.td}>{t.ticket_no}</td>
//               <td style={styles.td}>{t.title}</td>
//               <td style={styles.td}>{t.description}</td>
//               <td style={styles.td}>{t.status}</td>
//               <td style={styles.td}>{t.email}</td>
//               <td style={styles.td}>{t.hod_email}</td>

//               {/* ✅ LAST UPDATE ONLY */}
//               <td style={styles.td}>
//                 {t.ticket_updates && t.ticket_updates.length > 0
//                   ? t.ticket_updates[t.ticket_updates.length - 1].message
//                   : "-"}
//               </td>

//               <td style={styles.td}>
//                 {Array.isArray(t.attachments) && t.attachments.length > 0 ? (
//                   t.attachments.map((file, i) => (
//                     <div key={i}>
//                       <button
//                         type="button"
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           downloadAttachment(file);
//                         }}
//                         style={styles.downloadBtn}
//                       >
//                         📎 {file.split("/").pop()}
//                       </button>
//                     </div>
//                   ))
//                 ) : (
//                   <span style={styles.muted}>No file</span>
//                 )}
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// const styles: { [key: string]: React.CSSProperties } = {
//   wrapper: {
//     marginTop: "20px",
//     overflowX: "auto",
//     background: "#fff",
//     borderRadius: "10px",
//     boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
//   },
//   table: {
//     width: "100%",
//     borderCollapse: "separate",
//     borderSpacing: "0 10px",
//   },
//   th: {
//     padding: "14px",
//     background: "#f1f5f9",
//     textAlign: "left",
//     fontWeight: 600,
//   },
//   td: {
//     padding: "14px",
//     background: "#ffffff",
//     borderTop: "1px solid #e5e7eb",
//     borderBottom: "1px solid #e5e7eb",
//   },
//   downloadBtn: {
//     background: "none",
//     border: "none",
//     color: "#2563eb",
//     cursor: "pointer",
//     padding: 0,
//   },
//   muted: {
//     color: "#9ca3af",
//     fontSize: "13px",
//   },
//   empty: {
//     textAlign: "center",
//     padding: "30px",
//     color: "#6b7280",
//   },
// };
