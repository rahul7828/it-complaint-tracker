import { useMemo, useState } from "react";
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

export default function TicketList({
  tickets,
  onSelect,
}: Props) {
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

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase().replace("_", " ").trim();

    if (s === "open") return "#ef4444";
    if (s === "in progress") return "#f59e0b";
    if (s === "resolved") return "#10b981";
    if (s === "closed") return "#64748b";

    return "#64748b";
  };

  const downloadAttachment = (fileUrl: string) => {
    if (!fileUrl) return;

    if (fileUrl.startsWith("http")) {
      window.open(fileUrl, "_blank");
    } else {
      const fullUrl = `https://hevvbfybswocqmdxwpxa.supabase.co/storage/v1/object/public/tickets/${fileUrl}`;
      window.open(fullUrl, "_blank");
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const lastRemark =
        t.ticket_updates && t.ticket_updates.length > 0
          ? t.ticket_updates[t.ticket_updates.length - 1].message
          : "";

      return (
        (t.ticket_no || "")
          .toLowerCase()
          .includes(filters.ticket_no.toLowerCase()) &&
        (t.title || "")
          .toLowerCase()
          .includes(filters.title.toLowerCase()) &&
        (t.description || "")
          .toLowerCase()
          .includes(filters.description.toLowerCase()) &&
        (t.status || "")
          .toLowerCase()
          .includes(filters.status.toLowerCase()) &&
        (t.priority || "")
          .toLowerCase()
          .includes(filters.priority.toLowerCase()) &&
        (t.created_at
          ? new Date(t.created_at)
              .toLocaleString()
              .toLowerCase()
          : ""
        ).includes(filters.created_at.toLowerCase()) &&
        (t.email || "")
          .toLowerCase()
          .includes(filters.email.toLowerCase()) &&
        (t.hod_email || "")
          .toLowerCase()
          .includes(filters.hod_email.toLowerCase()) &&
        (lastRemark || "")
          .toLowerCase()
          .includes(filters.remark.toLowerCase())
      );
    });
  }, [tickets, filters]);

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Tickets");

    worksheet.columns = [
      { header: "Ticket No", key: "ticket_no", width: 15 },
      { header: "Title", key: "title", width: 28 },
      { header: "Description", key: "description", width: 40 },
      { header: "Priority", key: "priority", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "User Email", key: "email", width: 30 },
      { header: "HOD Email", key: "hod_email", width: 30 },
      { header: "Created Date", key: "created_at", width: 22 },
    ];

    filteredTickets.forEach((t) => {
      worksheet.addRow({
        ticket_no: t.ticket_no,
        title: t.title,
        description: t.description,
        priority: t.priority,
        status: t.status,
        email: t.email,
        hod_email: t.hod_email,
        created_at: new Date(
          t.created_at || ""
        ).toLocaleString(),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    const blob = new Blob([buffer]);

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "tickets.xlsx";
    a.click();
  };

  return (
    <div style={styles.wrapper}>
      {/* EXPORT BUTTON */}
      <div style={styles.topActions}>
        <button
          onClick={exportToExcel}
          style={styles.exportBtn}
        >
          Export Excel
        </button>
      </div>

      {/* TABLE */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            {/* HEADERS */}
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

            {/* FILTERS */}
            <tr>
              {Object.keys(filters).map((key) => (
                <th
                  key={key}
                  style={styles.filterCell}
                >
                  <input
                    style={styles.filterInput}
                    placeholder="Filter..."
                    value={(filters as any)[key]}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        [key]: e.target.value,
                      })
                    }
                  />
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredTickets.map((t) => {
              const color = getStatusColor(t.status);

              return (
                <tr
                  key={t.id}
                  style={styles.row}
                >
                  {/* CLICKABLE TICKET NUMBER */}
                  <td
                    onClick={() => onSelect?.(t)}
                    style={{
                      ...styles.td,
                      borderLeft: `4px solid ${color}`,
                      cursor: "pointer",
                      color: "#38bdf8",
                      fontWeight: 700,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color =
                        "#0ea5e9")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color =
                        "#38bdf8")
                    }
                  >
                    {t.ticket_no}
                  </td>

                  <td style={styles.td}>
                    {t.title}
                  </td>

                  <td style={styles.td}>
                    <div style={styles.description}>
                      {t.description}
                    </div>
                  </td>

                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        background: `${color}20`,
                        color: color,
                        border: `1px solid ${color}`,
                      }}
                    >
                      {t.status}
                    </span>
                  </td>

                  <td style={styles.td}>
                    {t.priority || "-"}
                  </td>

                  <td style={styles.td}>
                    {t.created_at
                      ? new Date(
                          t.created_at
                        ).toLocaleString()
                      : "-"}
                  </td>

                  <td style={styles.td}>
                    {t.email}
                  </td>

                  <td style={styles.td}>
                    {t.hod_email || "-"}
                  </td>

                  <td style={styles.td}>
                    {t.ticket_updates?.length
                      ? t.ticket_updates[
                          t.ticket_updates.length - 1
                        ].message
                      : "-"}
                  </td>

                  <td style={styles.td}>
                    {Array.isArray(t.attachments) &&
                    t.attachments.length > 0 ? (
                      t.attachments.map((file, i) => (
                        <div key={i}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadAttachment(file);
                            }}
                            style={styles.downloadBtn}
                          >
                            📎{" "}
                            {file
                              .split("/")
                              .pop()}
                          </button>
                        </div>
                      ))
                    ) : (
                      <span style={styles.noFile}>
                        No file
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredTickets.length === 0 && (
          <div style={styles.empty}>
            No Tickets Found
          </div>
        )}
      </div>
    </div>
  );
}

const styles: any = {
  wrapper: {
    marginTop: "6px",
    flex: 1,
    overflow: "auto",
    background: "#0f172a",
    borderRadius: "18px",
    border: "1px solid rgba(255,255,255,0.06)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    paddingBottom: "0px",
  },

  tableWrapper: {
    overflow: "auto",
  },

  table: {
    width: "100%",
    minWidth: "1700px",
    borderCollapse: "separate",
    borderSpacing: "0 2px",
    color: "#fff",
    fontSize: "12px",
    padding: "0 10px",
  },

  th: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    background: "#1e293b",
    color: "#f8fafc",
    padding: "10px 14px",
    textAlign: "left",
    fontWeight: 600,
    whiteSpace: "nowrap",
    borderBottom:
      "1px solid rgba(255,255,255,0.08)",
  },

  filterCell: {
    position: "sticky",
    top: 54,
    zIndex: 19,
    background: "#0f172a",
    padding: "4px 8px",
    borderBottom: "4px solid #0f172a",
  },

  filterInput: {
    width: "100%",
    padding: "6px 8px",
    borderRadius: "8px",
    border: "1px solid #334155",
    background: "#111827",
    color: "#fff",
    outline: "none",
    fontSize: "12px",
  },

  td: {
    padding: "6px 14px",
    color: "#e2e8f0",
    background: "#111827",
    whiteSpace: "nowrap",
    borderTop:
      "1px solid rgba(255,255,255,0.04)",
    borderBottom:
      "1px solid rgba(255,255,255,0.04)",
  },

  row: {
    transition: "0.2s",
  },

  description: {
    maxWidth: "200px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  statusBadge: {
    padding: "5px 12px",
    borderRadius: "30px",
    fontSize: "11px",
    fontWeight: 600,
    display: "inline-block",
  },

  downloadBtn: {
    background: "rgba(37,99,235,0.12)",
    border:
      "1px solid rgba(37,99,235,0.25)",
    color: "#60a5fa",
    cursor: "pointer",
    padding: "5px 10px",
    borderRadius: "8px",
    fontSize: "11px",
  },

  noFile: {
    color: "#94a3b8",
    fontSize: "11px",
  },

  empty: {
    textAlign: "center",
    padding: "40px",
    color: "#94a3b8",
    fontSize: "14px",
  },

  topActions: {
    padding: "10px",
  },

  exportBtn: {
    padding: "7px 12px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "12px",
  },
};



































// import { useMemo, useState } from "react";
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

// export default function TicketList({
//   tickets,
//   onSelect,
// }: Props) {
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

//   const getStatusColor = (status: string) => {
//     const s = status?.toLowerCase().replace("_", " ").trim();

//     if (s === "open") return "#ef4444";
//     if (s === "in progress") return "#f59e0b";
//     if (s === "resolved") return "#10b981";
//     if (s === "closed") return "#64748b";

//     return "#64748b";
//   };

//   const downloadAttachment = (fileUrl: string) => {
//     if (!fileUrl) return;

//     if (fileUrl.startsWith("http")) {
//       window.open(fileUrl, "_blank");
//     } else {
//       const fullUrl = `https://hevvbfybswocqmdxwpxa.supabase.co/storage/v1/object/public/tickets/${fileUrl}`;
//       window.open(fullUrl, "_blank");
//     }
//   };

//   const filteredTickets = useMemo(() => {
//     return tickets.filter((t) => {
//       const lastRemark =
//         t.ticket_updates && t.ticket_updates.length > 0
//           ? t.ticket_updates[t.ticket_updates.length - 1].message
//           : "";

//       return (
//         (t.ticket_no || "")
//           .toLowerCase()
//           .includes(filters.ticket_no.toLowerCase()) &&
//         (t.title || "")
//           .toLowerCase()
//           .includes(filters.title.toLowerCase()) &&
//         (t.description || "")
//           .toLowerCase()
//           .includes(filters.description.toLowerCase()) &&
//         (t.status || "")
//           .toLowerCase()
//           .includes(filters.status.toLowerCase()) &&
//         (t.priority || "")
//           .toLowerCase()
//           .includes(filters.priority.toLowerCase()) &&
//         (t.created_at
//           ? new Date(t.created_at)
//               .toLocaleString()
//               .toLowerCase()
//           : ""
//         ).includes(filters.created_at.toLowerCase()) &&
//         (t.email || "")
//           .toLowerCase()
//           .includes(filters.email.toLowerCase()) &&
//         (t.hod_email || "")
//           .toLowerCase()
//           .includes(filters.hod_email.toLowerCase()) &&
//         (lastRemark || "")
//           .toLowerCase()
//           .includes(filters.remark.toLowerCase())
//       );
//     });
//   }, [tickets, filters]);

//   const exportToExcel = async () => {
//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet("Tickets");

//     worksheet.columns = [
//       { header: "Ticket No", key: "ticket_no", width: 15 },
//       { header: "Title", key: "title", width: 28 },
//       { header: "Description", key: "description", width: 40 },
//       { header: "Priority", key: "priority", width: 15 },
//       { header: "Status", key: "status", width: 15 },
//       { header: "User Email", key: "email", width: 30 },
//       { header: "HOD Email", key: "hod_email", width: 30 },
//       { header: "Created Date", key: "created_at", width: 22 },
//     ];

//     filteredTickets.forEach((t) => {
//       worksheet.addRow({
//         ticket_no: t.ticket_no,
//         title: t.title,
//         description: t.description,
//         priority: t.priority,
//         status: t.status,
//         email: t.email,
//         hod_email: t.hod_email,
//         created_at: new Date(
//           t.created_at || ""
//         ).toLocaleString(),
//       });
//     });

//     const buffer = await workbook.xlsx.writeBuffer();

//     const blob = new Blob([buffer]);

//     const url = window.URL.createObjectURL(blob);

//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "tickets.xlsx";
//     a.click();
//   };

//   return (
//     <div style={styles.wrapper}>
//       {/* EXPORT BUTTON */}
//       <div style={styles.topActions}>
//         <button
//           onClick={exportToExcel}
//           style={styles.exportBtn}
//         >
//           Export Excel
//         </button>
//       </div>

//       {/* TABLE */}
//       <div style={styles.tableWrapper}>
//         <table style={styles.table}>
//           <thead>
//             {/* HEADERS */}
//             <tr>
//               <th style={styles.th}>Ticket No</th>
//               <th style={styles.th}>Title</th>
//               <th style={styles.th}>Description</th>
//               <th style={styles.th}>Status</th>
//               <th style={styles.th}>Priority</th>
//               <th style={styles.th}>Created</th>
//               <th style={styles.th}>User Email</th>
//               <th style={styles.th}>HOD Email</th>
//               <th style={styles.th}>Remark</th>
//               <th style={styles.th}>Attachments</th>
//             </tr>

//             {/* FILTERS */}
//             <tr>
//               {Object.keys(filters).map((key) => (
//                 <th
//                   key={key}
//                   style={styles.filterCell}
//                 >
//                   <input
//                     style={styles.filterInput}
//                     placeholder="Filter..."
//                     value={(filters as any)[key]}
//                     onChange={(e) =>
//                       setFilters({
//                         ...filters,
//                         [key]: e.target.value,
//                       })
//                     }
//                   />
//                 </th>
//               ))}
//             </tr>
//           </thead>

//           <tbody>
//             {filteredTickets.map((t) => {
//               const color = getStatusColor(t.status);

//               return (
//                 <tr
//                   key={t.id}
//                   onClick={() => onSelect?.(t)}
//                   style={styles.row}
//                 >
//                   <td
//                     style={{
//                       ...styles.td,
//                       borderLeft: `4px solid ${color}`,
//                     }}
//                   >
//                     {t.ticket_no}
//                   </td>

//                   <td style={styles.td}>
//                     {t.title}
//                   </td>

//                   <td style={styles.td}>
//                     <div style={styles.description}>
//                       {t.description}
//                     </div>
//                   </td>

//                   <td style={styles.td}>
//                     <span
//                       style={{
//                         ...styles.statusBadge,
//                         background: `${color}20`,
//                         color: color,
//                         border: `1px solid ${color}`,
//                       }}
//                     >
//                       {t.status}
//                     </span>
//                   </td>

//                   <td style={styles.td}>
//                     {t.priority || "-"}
//                   </td>

//                   <td style={styles.td}>
//                     {t.created_at
//                       ? new Date(
//                           t.created_at
//                         ).toLocaleString()
//                       : "-"}
//                   </td>

//                   <td style={styles.td}>
//                     {t.email}
//                   </td>

//                   <td style={styles.td}>
//                     {t.hod_email || "-"}
//                   </td>

//                   <td style={styles.td}>
//                     {t.ticket_updates?.length
//                       ? t.ticket_updates[
//                           t.ticket_updates.length - 1
//                         ].message
//                       : "-"}
//                   </td>

//                   <td style={styles.td}>
//                     {Array.isArray(t.attachments) &&
//                     t.attachments.length > 0 ? (
//                       t.attachments.map((file, i) => (
//                         <div key={i}>
//                           <button
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               downloadAttachment(file);
//                             }}
//                             style={styles.downloadBtn}
//                           >
//                             📎{" "}
//                             {file
//                               .split("/")
//                               .pop()}
//                           </button>
//                         </div>
//                       ))
//                     ) : (
//                       <span style={styles.noFile}>
//                         No file
//                       </span>
//                     )}
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>

//         {filteredTickets.length === 0 && (
//           <div style={styles.empty}>
//             No Tickets Found
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// const styles: any = {
//   wrapper: {
//     marginTop: "12px",
//    // height: "calc(100vh - 210px)",
//     flex: 1,
//     overflow: "auto",
//    // borderSpacing: "0 12px",
//     background: "#0f172a",
//     borderRadius: "18px",
//     border: "1px solid rgba(255,255,255,0.06)",
//     boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
//     paddingBottom: "0px",
    
//   },  

//   /* TABLE */
//   table: {
//     width: "100%",
//     minWidth: "1700px",
//     borderCollapse: "separate",
//    // borderSpacing: "0 8px", // ✅ ROW GAP
//     borderSpacing: "0 4px",
//     color: "#fff",
//     fontSize: "12px",
//     padding: "0 10px",
  
//   },

//   /* HEADER */
//   th: {
//     position: "sticky",
//     top: 0,
//     zIndex: 20,
//     background: "#1e293b",
//     color: "#f8fafc",
//     padding: "13px 18px", // ✅ MORE COLUMN GAP
//     textAlign: "left",
//     fontWeight: 600,
//     whiteSpace: "nowrap",
//     borderBottom: "1px solid rgba(255,255,255,0.08)",
//   },

//   /* FILTER ROW */
//   // filterCell: {
//   //   position: "sticky",
//   //   top: 54,
//   //   zIndex: 19,
//   //   background: "#0f172a",
//   //   padding: "5px 12px 14px 12px", // ✅ GAP BELOW HEADER
//   //   borderBottom: "3px solid #0f172a", // ✅ HEADER/FILTER GAP
//   // },

//   filterCell: {
//   position: "sticky",
//   top: 54,
//   zIndex: 19,
//   background: "#0f172a",
//   padding: "6px 10px",
//   borderBottom: "4px solid #0f172a",
// },

//   // filterInput: {
//   //   width: "100%",
//   //   padding: "8px 10px",
//   //   borderRadius: "8px",
//   //   border: "1px solid #334155",
//   //   background: "#111827",
//   //   color: "#fff",
//   //   outline: "none",
//   //   fontSize: "12px",
//   // },

//   filterInput: {
//   width: "100%",
//   padding: "7px 10px",
//   borderRadius: "8px",
//   border: "1px solid #334155",
//   background: "#111827",
//   color: "#fff",
//   outline: "none",
//   fontSize: "12px",
// },

//   /* ROW */
//   td: {
//    // padding: "12px 18px", // ✅ COLUMN GAP
//     padding: "8px 18px",
//     color: "#e2e8f0",
//     background: "#111827",
//     whiteSpace: "nowrap",
//     borderTop: "1px solid rgba(255,255,255,0.04)",
//     borderBottom: "1px solid rgba(255,255,255,0.04)",
    
//   },

//   /* DESCRIPTION */
//   description: {
//     maxWidth: "260px",
//     overflow: "hidden",
//     textOverflow: "ellipsis",
//     whiteSpace: "nowrap",
//   },

//   /* STATUS */
//   statusBadge: {
//     padding: "5px 12px",
//     borderRadius: "30px",
//     fontSize: "11px",
//     fontWeight: 600,
//     display: "inline-block",
//   },

//   /* PRIORITY */
//   priority: {
//     padding: "4px 10px",
//     borderRadius: "20px",
//     background: "rgba(255,255,255,0.06)",
//     fontSize: "11px",
//   },

//   /* DOWNLOAD */
//   downloadBtn: {
//     background: "rgba(37,99,235,0.12)",
//     border: "1px solid rgba(37,99,235,0.25)",
//     color: "#60a5fa",
//     cursor: "pointer",
//     padding: "5px 10px",
//     borderRadius: "8px",
//     fontSize: "11px",
//   },

//   noFile: {
//     color: "#94a3b8",
//     fontSize: "11px",
//   },

//   /* EMPTY */
//   empty: {
//     textAlign: "center",
//     padding: "40px",
//     color: "#94a3b8",
//     fontSize: "14px",
//   },

//   /* SMALL BUTTONS */
//   exportBtn: {
//     padding: "8px 14px",
//     background: "#2563eb",
//     color: "#fff",
//     border: "none",
//     borderRadius: "10px",
//     cursor: "pointer",
//     fontWeight: 600,
//     fontSize: "12px",
//   },

//   closedBtn: {
//     padding: "8px 14px",
//     background: "#475569",
//     color: "#fff",
//     border: "none",
//     borderRadius: "10px",
//     cursor: "pointer",
//     fontWeight: 600,
//     fontSize: "12px",
//   },
// };
















































//final working code before vaibhav sir design changes 19/05/26
// import { useMemo, useState } from "react";
// //import React, { useMemo, useState } from "react";
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

//   // ✅ STATUS COLOR (same as charts)
//   const getStatusColor = (status: string) => {
//     const s = status?.toLowerCase().replace("_", " ").trim();

//     if (s === "open") return "#ef4444";
//     if (s === "in progress") return "#f59e0b";
//     if (s === "resolved") return "#10b981";
//     if (s === "closed") return "#6b7280";

//     return "#94a3b8";
//   };

//   const downloadAttachment = (fileUrl: string) => {
//     if (!fileUrl) return;

//     if (fileUrl.startsWith("http")) {
//       window.open(fileUrl, "_blank");
//     } else {
//       const fullUrl = `https://hevvbfybswocqmdxwpxa.supabase.co/storage/v1/object/public/tickets/${fileUrl}`;
//       window.open(fullUrl, "_blank");
//     }
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

//   /* -------- EXCEL EXPORT (UNCHANGED) -------- */
//   const exportToExcel = async () => {
//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet("Tickets");

//     worksheet.columns = [
//       { header: "Ticket No", key: "ticket_no", width: 15 },
//       { header: "Title", key: "title", width: 30 },
//       { header: "Description", key: "description", width: 40 },
//       { header: "Priority", key: "priority", width: 15 },
//       { header: "Status", key: "status", width: 15 },
//       { header: "User Email", key: "email", width: 30 },
//       { header: "HOD Email", key: "hod_email", width: 30 },
//       { header: "Created Date", key: "created_at", width: 20 },
//     ];

//     filteredTickets
//       .filter((t) => t.status !== "Closed")
//       .forEach((t) => {
//         const row = worksheet.addRow({
//           ticket_no: t.ticket_no,
//           title: t.title,
//           description: t.description,
//           priority: t.priority,
//           status: t.status,
//           email: t.email,
//           hod_email: t.hod_email,
//           created_at: new Date(t.created_at || "").toLocaleString(),
//         });

//         const priority = t.priority;

//         if (priority === "High") {
//           row.getCell("priority").fill = {
//             type: "pattern",
//             pattern: "solid",
//             fgColor: { argb: "FFFF9999" },
//           };
//         }
//         if (priority === "Medium") {
//           row.getCell("priority").fill = {
//             type: "pattern",
//             pattern: "solid",
//             fgColor: { argb: "FFFFEB9C" },
//           };
//         }
//         if (priority === "Low") {
//           row.getCell("priority").fill = {
//             type: "pattern",
//             pattern: "solid",
//             fgColor: { argb: "FFC6EFCE" },
//           };
//         }
//       });

//     const buffer = await workbook.xlsx.writeBuffer();
//     const blob = new Blob([buffer]);
//     const url = window.URL.createObjectURL(blob);

//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "tickets.xlsx";
//     a.click();
//   };

//   return (
//     <div style={styles.wrapper} tabIndex={0}>
//       <button onClick={exportToExcel} style={styles.exportBtn}>
//         Export Excel
//       </button>

//       <button
//         onClick={() => (window.location.href = "/closed-tickets")}
//         style={styles.closedBtn}
//       >
//         Closed Tickets
//       </button>

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
//           {filteredTickets.map((t) => {
//             const color = getStatusColor(t.status);

//             return (
//               <tr
//                 key={t.id}
//                 onClick={() => onSelect?.(t)}
//                 style={{
//                   cursor: "pointer",
//                   borderLeft: `5px solid ${color}`,
//                   background: `${color}10`,
//                 }}
//               >
//                 <td style={styles.td}>{t.ticket_no}</td>
//                 <td style={styles.td}>{t.title}</td>
//                 <td style={styles.td}>{t.description}</td>

//                 {/* 🔥 STATUS BADGE */}
//                 <td style={styles.td}>
//                   <span
//                     style={{
//                       padding: "4px 10px",
//                       borderRadius: "20px",
//                       color: "#fff",
//                       background: color,
//                       fontSize: "12px",
//                     }}
//                   >
//                     {t.status}
//                   </span>
//                 </td>

//                 <td style={styles.td}>{t.priority || "-"}</td>

//                 <td style={styles.td}>
//                   {t.created_at
//                     ? new Date(t.created_at).toLocaleString()
//                     : "-"}
//                 </td>

//                 <td style={styles.td}>{t.email}</td>
//                 <td style={styles.td}>{t.hod_email || "-"}</td>

//                 <td style={styles.td}>
//                   {t.ticket_updates?.length
//                     ? t.ticket_updates[t.ticket_updates.length - 1].message
//                     : "-"}
//                 </td>

//                 <td style={styles.td}>
//                   {Array.isArray(t.attachments) && t.attachments.length > 0 ? (
//                     t.attachments.map((file, i) => (
//                       <div key={i}>
//                         <button
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             downloadAttachment(file);
//                           }}
//                           style={styles.downloadBtn}
//                         >
//                           📎 {file.split("/").pop()}
//                         </button>
//                       </div>
//                     ))
//                   ) : (
//                     <span style={styles.muted}>No file</span>
//                   )}
//                 </td>
//               </tr>
//             );
//           })}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// const styles: any = {
//   wrapper: {
//     marginTop: "20px",
//     height: "70vh",
//     overflow: "scroll",
//     background: "#fff",
//     borderRadius: "10px",
//     boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
//   },
//   table: {
//     width: "100%",
//     minWidth: "1600px",
//     borderCollapse: "separate",
//     borderSpacing: "0 10px",
//   },
//   th: {
//     padding: "14px",
//     background: "#f1f5f9",
//   },
//   td: {
//     padding: "14px",
//     background: "#fff",
//   },
//   filterCell: {
//     padding: "6px",
//   },
//   filterInput: {
//     width: "100%",
//     padding: "6px",
//   },
//   exportBtn: {
//     marginBottom: 10,
//     padding: "10px",
//     background: "#4f46e5",
//     color: "#fff",
//     borderRadius: 8,
//   },
//   closedBtn: {
//     marginLeft: 10,
//     padding: "10px",
//     background: "#4f46e5",
//     color: "#fff",
//     borderRadius: 8,
//   },
//   downloadBtn: {
//     background: "none",
//     border: "none",
//     color: "#2563eb",
//     cursor: "pointer",
//   },
//   muted: {
//     color: "#9ca3af",
//   },
// };

