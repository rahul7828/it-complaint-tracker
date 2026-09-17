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
  darkMode?: boolean;
};

const getStyles = (darkMode: boolean): any => {
  const theme = darkMode
    ? {
        wrapperBg: "#0f172a",
        wrapperBorder: "1px solid rgba(255,255,255,0.06)",
        wrapperShadow: "0 10px 30px rgba(0,0,0,0.25)",

        tableColor: "#fff",

        headerBg: "#1e293b",
        headerColor: "#f8fafc",
        headerBorder: "1px solid rgba(255,255,255,0.08)",

        filterBg: "#0f172a",
        filterBorderBottom: "4px solid #0f172a",

        inputBg: "#111827",
        inputColor: "#fff",
        inputBorder: "1px solid #334155",

        cellBg: "#111827",
        cellColor: "#e2e8f0",
        cellBorder: "1px solid rgba(255,255,255,0.04)",

        noFileColor: "#94a3b8",
        emptyColor: "#94a3b8",

        exportBg: "#2563eb",
        exportColor: "#fff",
      }
    : {
        wrapperBg: "#ffffff",
        wrapperBorder: "1px solid #e2e8f0",
        wrapperShadow: "0 10px 30px rgba(0,0,0,0.08)",

        tableColor: "#1e293b",

        headerBg: "#f1f5f9",
        headerColor: "#1e293b",
        headerBorder: "1px solid #e2e8f0",

        filterBg: "#ffffff",
        filterBorderBottom: "4px solid #ffffff",

        inputBg: "#ffffff",
        inputColor: "#1e293b",
        inputBorder: "1px solid #cbd5e1",

        cellBg: "#ffffff",
        cellColor: "#334155",
        cellBorder: "1px solid #e2e8f0",

        noFileColor: "#64748b",
        emptyColor: "#64748b",

        exportBg: "#2563eb",
        exportColor: "#fff",
      };

  return {
    wrapper: {
      background: theme.wrapperBg,
      border: theme.wrapperBorder,
      borderRadius: "12px",
      boxShadow: theme.wrapperShadow,
      overflow: "hidden",
      color: theme.tableColor,
    },

    topBar: {
      display: "flex",
      justifyContent: "flex-end",
      alignItems: "center",
      padding: "12px 16px",
      background: theme.filterBg,
    },

    exportButton: {
      background: theme.exportBg,
      color: theme.exportColor,
      border: "none",
      borderRadius: "6px",
      padding: "8px 14px",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: 600,
    },

    tableWrapper: {
      width: "100%",
      overflowX: "auto",
      overflowY: "visible",
    },

    table: {
      width: "100%",
      minWidth: "1200px",
      borderCollapse: "separate" as const,
      borderSpacing: 0,
      color: theme.tableColor,
    },

    th: {
      position: "sticky" as const,
      top: 0,
      zIndex: 2,
      background: theme.headerBg,
      color: theme.headerColor,
      padding: "11px 10px",
      textAlign: "left" as const,
      fontSize: "12px",
      fontWeight: 700,
      borderRight: theme.headerBorder,
      borderBottom: theme.headerBorder,
      whiteSpace: "nowrap" as const,
    },

    filterRow: {
      background: theme.filterBg,
    },

    filterCell: {
      background: theme.filterBg,
      padding: "7px",
      borderRight: theme.headerBorder,
      borderBottom: theme.filterBorderBottom,
    },

    input: {
      width: "100%",
      boxSizing: "border-box" as const,
      padding: "7px 8px",
      borderRadius: "5px",
      border: theme.inputBorder,
      background: theme.inputBg,
      color: theme.inputColor,
      outline: "none",
      fontSize: "12px",
    },

    td: {
      background: theme.cellBg,
      color: theme.cellColor,
      padding: "10px",
      borderRight: theme.cellBorder,
      borderBottom: theme.cellBorder,
      fontSize: "12px",
      verticalAlign: "top" as const,
    },

    ticketNo: {
      fontWeight: 700,
      cursor: "pointer",
      color: "#2563eb",
    },

    clickable: {
      cursor: "pointer",
    },

    noFile: {
      color: theme.noFileColor,
    },

    empty: {
      padding: "30px",
      textAlign: "center" as const,
      color: theme.emptyColor,
      background: theme.cellBg,
    },

    attachmentButton: {
      display: "block",
      marginBottom: "4px",
      background: "transparent",
      border: "none",
      padding: 0,
      color: "#2563eb",
      cursor: "pointer",
      fontSize: "12px",
      textAlign: "left" as const,
    },
  };
};

export default function TicketList({
  tickets,
  onSelect,
  darkMode = true,
}: Props) {
  const styles = getStyles(darkMode);

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

  const [expandedDescriptions, setExpandedDescriptions] = useState<
    Record<string, boolean>
  >({});

  const [expandedHodEmails, setExpandedHodEmails] = useState<
    Record<string, boolean>
  >({});

  const getLastRemark = (ticket: Ticket) => {
    if (
      !ticket.ticket_updates ||
      ticket.ticket_updates.length === 0
    ) {
      return "";
    }

    const sorted = [...ticket.ticket_updates].sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    );

    return sorted[0]?.message || "";
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const lastRemark = getLastRemark(ticket);

      return (
        ticket.ticket_no
          ?.toLowerCase()
          .includes(filters.ticket_no.toLowerCase()) &&
        ticket.title
          ?.toLowerCase()
          .includes(filters.title.toLowerCase()) &&
        ticket.description
          ?.toLowerCase()
          .includes(filters.description.toLowerCase()) &&
        ticket.status
          ?.toLowerCase()
          .includes(filters.status.toLowerCase()) &&
        (ticket.priority || "")
          .toLowerCase()
          .includes(filters.priority.toLowerCase()) &&
        (ticket.created_at || "")
          .toLowerCase()
          .includes(filters.created_at.toLowerCase()) &&
        ticket.email
          ?.toLowerCase()
          .includes(filters.email.toLowerCase()) &&
        (ticket.hod_email || "")
          .toLowerCase()
          .includes(filters.hod_email.toLowerCase()) &&
        lastRemark
          .toLowerCase()
          .includes(filters.remark.toLowerCase())
      );
    });
  }, [tickets, filters]);

  const updateFilter = (
    field: keyof typeof filters,
    value: string
  ) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleDescription = (id: string) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleHodEmail = (id: string) => {
    setExpandedHodEmails((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "#ef4444";

      case "In Progress":
        return "#f59e0b";

      case "Resolved":
        return "#10b981";

      case "Closed":
        return "#64748b";

      default:
        return "#64748b";
    }
  };

  const downloadAttachment = async (url: string) => {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to download attachment");
      }

      const blob = await response.blob();

      const fileName =
        url.split("/").pop()?.split("?")[0] ||
        "attachment";

      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Attachment download error:", error);
      window.open(url, "_blank");
    }
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Tickets");

    worksheet.columns = [
      {
        header: "Ticket No",
        key: "ticket_no",
        width: 18,
      },
      {
        header: "Title",
        key: "title",
        width: 30,
      },
      {
        header: "Description",
        key: "description",
        width: 45,
      },
      {
        header: "Priority",
        key: "priority",
        width: 15,
      },
      {
        header: "Status",
        key: "status",
        width: 18,
      },
      {
        header: "User Email",
        key: "email",
        width: 30,
      },
      {
        header: "HOD Email",
        key: "hod_email",
        width: 30,
      },
      {
        header: "Created Date",
        key: "created_at",
        width: 25,
      },
    ];

    filteredTickets.forEach((ticket) => {
      worksheet.addRow({
        ticket_no: ticket.ticket_no,
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority || "",
        status: ticket.status,
        email: ticket.email,
        hod_email: ticket.hod_email || "",
        created_at: ticket.created_at
          ? new Date(ticket.created_at).toLocaleString()
          : "",
      });
    });

    worksheet.getRow(1).font = {
      bold: true,
    };

    worksheet.getRow(1).alignment = {
      vertical: "middle",
      horizontal: "center",
    };

    const buffer = await workbook.xlsx.writeBuffer();

    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "Tickets.xlsx";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.topBar}>
        <button
          type="button"
          style={styles.exportButton}
          onClick={exportToExcel}
        >
          Export Excel
        </button>
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Ticket No</th>
              <th style={styles.th}>Title</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Priority</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>User Email</th>
              <th style={styles.th}>HOD Email</th>
              <th style={styles.th}>Created Date</th>
              <th style={styles.th}>Remark</th>
              <th style={styles.th}>Attachments</th>
            </tr>

            <tr style={styles.filterRow}>
              <td style={styles.filterCell}>
                <input
                  style={styles.input}
                  value={filters.ticket_no}
                  onChange={(e) =>
                    updateFilter(
                      "ticket_no",
                      e.target.value
                    )
                  }
                  placeholder="Search"
                />
              </td>

              <td style={styles.filterCell}>
                <input
                  style={styles.input}
                  value={filters.title}
                  onChange={(e) =>
                    updateFilter(
                      "title",
                      e.target.value
                    )
                  }
                  placeholder="Search"
                />
              </td>

              <td style={styles.filterCell}>
                <input
                  style={styles.input}
                  value={filters.description}
                  onChange={(e) =>
                    updateFilter(
                      "description",
                      e.target.value
                    )
                  }
                  placeholder="Search"
                />
              </td>

              <td style={styles.filterCell}>
                <input
                  style={styles.input}
                  value={filters.priority}
                  onChange={(e) =>
                    updateFilter(
                      "priority",
                      e.target.value
                    )
                  }
                  placeholder="Search"
                />
              </td>

              <td style={styles.filterCell}>
                <input
                  style={styles.input}
                  value={filters.status}
                  onChange={(e) =>
                    updateFilter(
                      "status",
                      e.target.value
                    )
                  }
                  placeholder="Search"
                />
              </td>

              <td style={styles.filterCell}>
                <input
                  style={styles.input}
                  value={filters.email}
                  onChange={(e) =>
                    updateFilter(
                      "email",
                      e.target.value
                    )
                  }
                  placeholder="Search"
                />
              </td>

              <td style={styles.filterCell}>
                <input
                  style={styles.input}
                  value={filters.hod_email}
                  onChange={(e) =>
                    updateFilter(
                      "hod_email",
                      e.target.value
                    )
                  }
                  placeholder="Search"
                />
              </td>

              <td style={styles.filterCell}>
                <input
                  style={styles.input}
                  value={filters.created_at}
                  onChange={(e) =>
                    updateFilter(
                      "created_at",
                      e.target.value
                    )
                  }
                  placeholder="Search"
                />
              </td>

              <td style={styles.filterCell}>
                <input
                  style={styles.input}
                  value={filters.remark}
                  onChange={(e) =>
                    updateFilter(
                      "remark",
                      e.target.value
                    )
                  }
                  placeholder="Search"
                />
              </td>

              <td style={styles.filterCell}></td>
            </tr>
          </thead>

          <tbody>
            {filteredTickets.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  style={styles.empty}
                >
                  No tickets found.
                </td>
              </tr>
            ) : (
              filteredTickets.map((ticket) => {
                const isDescriptionExpanded =
                  !!expandedDescriptions[ticket.id];

                const isHodEmailExpanded =
                  !!expandedHodEmails[ticket.id];

                const lastRemark =
                  getLastRemark(ticket);

                const statusColor =
                  getStatusColor(ticket.status);

                return (
                  <tr key={ticket.id}>
                    <td
                      style={{
                        ...styles.td,
                        borderLeft: `4px solid ${statusColor}`,
                      }}
                    >
                      <span
                        style={styles.ticketNo}
                        onClick={() =>
                          onSelect?.(ticket)
                        }
                      >
                        {ticket.ticket_no}
                      </span>
                    </td>

                    <td style={styles.td}>
                      {ticket.title}
                    </td>

                    <td
                      style={{
                        ...styles.td,
                        maxWidth: "300px",
                      }}
                    >
                      <div
                        style={{
                          cursor: "pointer",
                          whiteSpace:
                            isDescriptionExpanded
                              ? "normal"
                              : "nowrap",
                          overflow:
                            isDescriptionExpanded
                              ? "visible"
                              : "hidden",
                          textOverflow:
                            isDescriptionExpanded
                              ? "clip"
                              : "ellipsis",
                        }}
                        onClick={() =>
                          toggleDescription(ticket.id)
                        }
                        title={
                          isDescriptionExpanded
                            ? "Click to collapse"
                            : "Click to expand"
                        }
                      >
                        {ticket.description}
                      </div>
                    </td>

                    <td style={styles.td}>
                      {ticket.priority || "-"}
                    </td>

                    <td style={styles.td}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 8px",
                          borderRadius: "999px",
                          background: statusColor,
                          color: "#fff",
                          fontSize: "11px",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {ticket.status}
                      </span>
                    </td>

                    <td style={styles.td}>
                      {ticket.email}
                    </td>

                    <td
                      style={{
                        ...styles.td,
                        maxWidth: "220px",
                      }}
                    >
                      <div
                        style={{
                          cursor: "pointer",
                          whiteSpace:
                            isHodEmailExpanded
                              ? "normal"
                              : "nowrap",
                          overflow:
                            isHodEmailExpanded
                              ? "visible"
                              : "hidden",
                          textOverflow:
                            isHodEmailExpanded
                              ? "clip"
                              : "ellipsis",
                        }}
                        onClick={() =>
                          toggleHodEmail(ticket.id)
                        }
                        title={
                          isHodEmailExpanded
                            ? "Click to collapse"
                            : "Click to expand"
                        }
                      >
                        {ticket.hod_email || "-"}
                      </div>
                    </td>

                    <td style={styles.td}>
                      {ticket.created_at
                        ? new Date(
                            ticket.created_at
                          ).toLocaleString()
                        : "-"}
                    </td>

                    <td style={styles.td}>
                      {lastRemark || "-"}
                    </td>

                    <td style={styles.td}>
                      {ticket.attachments &&
                      ticket.attachments.length > 0 ? (
                        ticket.attachments.map(
                          (url, index) => (
                            <button
                              key={`${ticket.id}-${index}`}
                              type="button"
                              style={
                                styles.attachmentButton
                              }
                              onClick={() =>
                                downloadAttachment(
                                  url
                                )
                              }
                            >
                              Attachment {index + 1}
                            </button>
                          )
                        )
                      ) : (
                        <span style={styles.noFile}>
                          No file
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}



























// final working code before dark and light mode changes
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

//   // EXPAND STATES
//   const [
//     expandedDescriptions,
//     setExpandedDescriptions,
//   ] = useState<Record<string, boolean>>(
//     {}
//   );

//   const [
//     expandedEmails,
//     setExpandedEmails,
//   ] = useState<Record<string, boolean>>(
//     {}
//   );

//   const getStatusColor = (
//     status: string
//   ) => {
//     const s = status
//       ?.toLowerCase()
//       .replace("_", " ")
//       .trim();

//     if (s === "open")
//       return "#ef4444";

//     if (s === "in progress")
//       return "#f59e0b";

//     if (s === "resolved")
//       return "#10b981";

//     if (s === "closed")
//       return "#64748b";

//     return "#64748b";
//   };

//   const downloadAttachment = (
//     fileUrl: string
//   ) => {
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
//         t.ticket_updates &&
//         t.ticket_updates.length > 0
//           ? t.ticket_updates[
//               t.ticket_updates.length -
//                 1
//             ].message
//           : "";

//       return (
//         (t.ticket_no || "")
//           .toLowerCase()
//           .includes(
//             filters.ticket_no.toLowerCase()
//           ) &&
//         (t.title || "")
//           .toLowerCase()
//           .includes(
//             filters.title.toLowerCase()
//           ) &&
//         (t.description || "")
//           .toLowerCase()
//           .includes(
//             filters.description.toLowerCase()
//           ) &&
//         (t.status || "")
//           .toLowerCase()
//           .includes(
//             filters.status.toLowerCase()
//           ) &&
//         (t.priority || "")
//           .toLowerCase()
//           .includes(
//             filters.priority.toLowerCase()
//           ) &&
//         (
//           t.created_at
//             ? new Date(
//                 t.created_at
//               ).toLocaleString()
//             : ""
//         ).includes(
//           filters.created_at.toLowerCase()
//         ) &&
//         (t.email || "")
//           .toLowerCase()
//           .includes(
//             filters.email.toLowerCase()
//           ) &&
//         (t.hod_email || "")
//           .toLowerCase()
//           .includes(
//             filters.hod_email.toLowerCase()
//           ) &&
//         (lastRemark || "")
//           .toLowerCase()
//           .includes(
//             filters.remark.toLowerCase()
//           )
//       );
//     });
//   }, [tickets, filters]);

//   const exportToExcel = async () => {
//     const workbook =
//       new ExcelJS.Workbook();

//     const worksheet =
//       workbook.addWorksheet("Tickets");

//     worksheet.columns = [
//       {
//         header: "Ticket No",
//         key: "ticket_no",
//         width: 15,
//       },
//       {
//         header: "Title",
//         key: "title",
//         width: 28,
//       },
//       {
//         header: "Description",
//         key: "description",
//         width: 50,
//       },
//       {
//         header: "Priority",
//         key: "priority",
//         width: 15,
//       },
//       {
//         header: "Status",
//         key: "status",
//         width: 15,
//       },
//       {
//         header: "User Email",
//         key: "email",
//         width: 30,
//       },
//       {
//         header: "HOD Email",
//         key: "hod_email",
//         width: 30,
//       },
//       {
//         header: "Created Date",
//         key: "created_at",
//         width: 22,
//       },
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

//     const buffer =
//       await workbook.xlsx.writeBuffer();

//     const blob = new Blob([buffer]);

//     const url =
//       window.URL.createObjectURL(blob);

//     const a =
//       document.createElement("a");

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
//               <th style={styles.th}>
//                 Ticket No
//               </th>

//               <th style={styles.th}>
//                 Title
//               </th>

//               <th
//                 style={
//                   styles.descriptionTh
//                 }
//               >
//                 Description
//               </th>

//               <th style={styles.th}>
//                 Status
//               </th>

//               <th style={styles.th}>
//                 Priority
//               </th>

//               <th style={styles.th}>
//                 Created
//               </th>

//               <th style={styles.emailTh}>
//                 User Email
//               </th>

//               <th
//                 style={
//                   styles.hodEmailTh
//                 }
//               >
//                 HOD Email
//               </th>

//               <th
//                 style={styles.remarkTh}
//               >
//                 Remark
//               </th>

//               <th style={styles.th}>
//                 Attachments
//               </th>
//             </tr>

//             {/* FILTERS */}
//             <tr>
//               {Object.keys(filters).map(
//                 (key) => (
//                   <th
//                     key={key}
//                     style={
//                       styles.filterCell
//                     }
//                   >
//                     <input
//                       style={
//                         styles.filterInput
//                       }
//                       placeholder="Filter..."
//                       value={
//                         (filters as any)[
//                           key
//                         ]
//                       }
//                       onChange={(e) =>
//                         setFilters({
//                           ...filters,
//                           [key]:
//                             e.target.value,
//                         })
//                       }
//                     />
//                   </th>
//                 )
//               )}
//             </tr>
//           </thead>

//           <tbody>
//             {filteredTickets.map((t) => {
//               const color =
//                 getStatusColor(
//                   t.status
//                 );

//               return (
//                 <tr
//                   key={t.id}
//                   style={styles.row}
//                 >
//                   {/* TICKET NUMBER */}
//                   <td
//                     onClick={() =>
//                       onSelect?.(t)
//                     }
//                     style={{
//                       ...styles.td,
//                       borderLeft: `4px solid ${color}`,
//                       cursor: "pointer",
//                       color: "#38bdf8",
//                       fontWeight: 700,
//                     }}
//                     onMouseEnter={(e) =>
//                       (e.currentTarget.style.color =
//                         "#0ea5e9")
//                     }
//                     onMouseLeave={(e) =>
//                       (e.currentTarget.style.color =
//                         "#38bdf8")
//                     }
//                   >
//                     {t.ticket_no}
//                   </td>

//                   {/* TITLE */}
//                   <td style={styles.td}>
//                     {t.title}
//                   </td>

//                   {/* DESCRIPTION */}
//                   <td
//                     style={
//                       styles.descriptionTd
//                     }
//                   >
//                     <div
//                       role="button"
//                       tabIndex={0}
//                       onClick={() =>
//                         setExpandedDescriptions(
//                           (prev) => ({
//                             ...prev,
//                             [t.id]:
//                               !prev[t.id],
//                           })
//                         )
//                       }
//                       onKeyDown={(e) => {
//                         if (
//                           e.key ===
//                             "Enter" ||
//                           e.key === " "
//                         ) {
//                           e.preventDefault();

//                           setExpandedDescriptions(
//                             (prev) => ({
//                               ...prev,
//                               [t.id]:
//                                 !prev[
//                                   t.id
//                                 ],
//                             })
//                           );
//                         }
//                       }}
//                       style={{
//                         ...styles.description,
//                         ...(expandedDescriptions[
//                           t.id
//                         ]
//                           ? styles.expandedText
//                           : styles.collapsedText),
//                       }}
//                     >
//                       {t.description}
//                     </div>
//                   </td>

//                   {/* STATUS */}
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

//                   {/* PRIORITY */}
//                   <td style={styles.td}>
//                     {t.priority || "-"}
//                   </td>

//                   {/* CREATED */}
//                   <td style={styles.td}>
//                     {t.created_at
//                       ? new Date(
//                           t.created_at
//                         ).toLocaleString()
//                       : "-"}
//                   </td>

//                   {/* USER EMAIL */}
//                   <td
//                     style={styles.emailTd}
//                   >
//                     {t.email}
//                   </td>

//                   {/* HOD EMAIL */}
//                   <td
//                     style={
//                       styles.hodEmailTd
//                     }
//                   >
//                     <div
//                       role="button"
//                       tabIndex={0}
//                       onClick={() =>
//                         setExpandedEmails(
//                           (prev) => ({
//                             ...prev,
//                             [t.id]:
//                               !prev[t.id],
//                           })
//                         )
//                       }
//                       onKeyDown={(e) => {
//                         if (
//                           e.key ===
//                             "Enter" ||
//                           e.key === " "
//                         ) {
//                           e.preventDefault();

//                           setExpandedEmails(
//                             (prev) => ({
//                               ...prev,
//                               [t.id]:
//                                 !prev[
//                                   t.id
//                                 ],
//                             })
//                           );
//                         }
//                       }}
//                       style={{
//                         ...(expandedEmails[
//                           t.id
//                         ]
//                           ? styles.expandedText
//                           : styles.collapsedText),
//                       }}
//                     >
//                       {t.hod_email ||
//                         "-"}
//                     </div>
//                   </td>

//                   {/* REMARK */}
//                   <td
//                     style={styles.remarkTd}
//                   >
//                     <div
//                       style={
//                         styles.remarkText
//                       }
//                     >
//                       {t.ticket_updates
//                         ?.length
//                         ? t
//                             .ticket_updates[
//                             t
//                               .ticket_updates
//                               .length -
//                               1
//                           ].message
//                         : "-"}
//                     </div>
//                   </td>

//                   {/* ATTACHMENTS */}
//                   <td style={styles.td}>
//                     {Array.isArray(
//                       t.attachments
//                     ) &&
//                     t.attachments
//                       .length > 0 ? (
//                       t.attachments.map(
//                         (file, i) => (
//                           <div key={i}>
//                             <button
//                               onClick={(
//                                 e
//                               ) => {
//                                 e.stopPropagation();

//                                 downloadAttachment(
//                                   file
//                                 );
//                               }}
//                               style={
//                                 styles.downloadBtn
//                               }
//                             >
//                               📎{" "}
//                               {file
//                                 .split("/")
//                                 .pop()}
//                             </button>
//                           </div>
//                         )
//                       )
//                     ) : (
//                       <span
//                         style={
//                           styles.noFile
//                         }
//                       >
//                         No file
//                       </span>
//                     )}
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>

//         {filteredTickets.length ===
//           0 && (
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
//     marginTop: "6px",
//     flex: 1,
//     overflow: "auto",
//     background: "#0f172a",
//     borderRadius: "18px",
//     border:
//       "1px solid rgba(255,255,255,0.06)",
//     boxShadow:
//       "0 10px 30px rgba(0,0,0,0.25)",
//     paddingBottom: "0px",
//   },

//   tableWrapper: {
//     overflow: "auto",
//   },

//   table: {
//     width: "100%",
//     minWidth: "1900px",
//     borderCollapse: "separate",
//     borderSpacing: "0 2px",
//     color: "#fff",
//     fontSize: "12px",
//     padding: "0 10px",
//   },

//   th: {
//     position: "sticky",
//     top: 0,
//     zIndex: 20,
//     background: "#1e293b",
//     color: "#f8fafc",
//     padding: "10px 14px",
//     textAlign: "left",
//     fontWeight: 600,
//     whiteSpace: "nowrap",
//     borderBottom:
//       "1px solid rgba(255,255,255,0.08)",
//   },

//   descriptionTh: {
//     position: "sticky",
//     top: 0,
//     zIndex: 20,
//     background: "#1e293b",
//     color: "#f8fafc",
//     padding: "10px 14px",
//     textAlign: "left",
//     fontWeight: 600,
//     minWidth: "320px",
//     borderBottom:
//       "1px solid rgba(255,255,255,0.08)",
//   },

//   emailTh: {
//     position: "sticky",
//     top: 0,
//     zIndex: 20,
//     background: "#1e293b",
//     color: "#f8fafc",
//     padding: "10px 14px",
//     textAlign: "left",
//     fontWeight: 600,
//     minWidth: "220px",
//     borderBottom:
//       "1px solid rgba(255,255,255,0.08)",
//   },

//   hodEmailTh: {
//     position: "sticky",
//     top: 0,
//     zIndex: 20,
//     background: "#1e293b",
//     color: "#f8fafc",
//     padding: "10px 14px",
//     textAlign: "left",
//     fontWeight: 600,
//     width: "220px",
//     minWidth: "220px",
//     maxWidth: "220px",
//     borderBottom:
//       "1px solid rgba(255,255,255,0.08)",
//   },

//   remarkTh: {
//     position: "sticky",
//     top: 0,
//     zIndex: 20,
//     background: "#1e293b",
//     color: "#f8fafc",
//     padding: "10px 14px",
//     textAlign: "left",
//     fontWeight: 600,
//     minWidth: "260px",
//     borderBottom:
//       "1px solid rgba(255,255,255,0.08)",
//   },

//   filterCell: {
//     position: "sticky",
//     top: 54,
//     zIndex: 19,
//     background: "#0f172a",
//     padding: "4px 8px",
//     borderBottom:
//       "4px solid #0f172a",
//   },

//   filterInput: {
//     width: "100%",
//     padding: "6px 8px",
//     borderRadius: "8px",
//     border: "1px solid #334155",
//     background: "#111827",
//     color: "#fff",
//     outline: "none",
//     fontSize: "12px",
//   },

//   td: {
//     padding: "8px 14px",
//     color: "#e2e8f0",
//     background: "#111827",
//     whiteSpace: "nowrap",
//     borderTop:
//       "1px solid rgba(255,255,255,0.04)",
//     borderBottom:
//       "1px solid rgba(255,255,255,0.04)",
//     verticalAlign: "top",
//   },

//   descriptionTd: {
//     padding: "8px 14px",
//     color: "#e2e8f0",
//     background: "#111827",
//     minWidth: "320px",
//     maxWidth: "320px",
//     verticalAlign: "top",
//   },

//   emailTd: {
//     padding: "8px 14px",
//     color: "#e2e8f0",
//     background: "#111827",
//     whiteSpace: "nowrap",
//     minWidth: "220px",
//   },

//   hodEmailTd: {
//     padding: "8px 14px",
//     color: "#e2e8f0",
//     background: "#111827",
//     width: "220px",
//     minWidth: "220px",
//     maxWidth: "220px",
//     verticalAlign: "top",
//   },

//   remarkTd: {
//     padding: "8px 14px",
//     color: "#e2e8f0",
//     background: "#111827",
//     minWidth: "260px",
//     maxWidth: "260px",
//     verticalAlign: "top",
//   },

//   row: {
//     transition: "0.2s",
//   },

//   description: {
//     minWidth: "300px",
//     maxWidth: "320px",
//   },

//   remarkText: {
//     whiteSpace: "normal",
//     wordBreak: "break-word",
//     overflowWrap: "break-word",
//     lineHeight: "1.5",
//   },

//   collapsedText: {
//     overflow: "hidden",
//     textOverflow: "ellipsis",
//     whiteSpace: "nowrap",
//     cursor: "pointer",
//   },

//   expandedText: {
//     whiteSpace: "normal",
//     wordBreak: "break-word",
//     overflowWrap: "break-word",
//     cursor: "pointer",
//     lineHeight: "1.5",
//   },

//   statusBadge: {
//     padding: "5px 12px",
//     borderRadius: "30px",
//     fontSize: "11px",
//     fontWeight: 600,
//     display: "inline-block",
//   },

//   downloadBtn: {
//     background:
//       "rgba(37,99,235,0.12)",
//     border:
//       "1px solid rgba(37,99,235,0.25)",
//     color: "#60a5fa",
//     cursor: "pointer",
//     padding: "5px 10px",
//     borderRadius: "8px",
//     fontSize: "11px",
//     marginBottom: "5px",
//   },

//   noFile: {
//     color: "#94a3b8",
//     fontSize: "11px",
//   },

//   empty: {
//     textAlign: "center",
//     padding: "40px",
//     color: "#94a3b8",
//     fontSize: "14px",
//   },

//   topActions: {
//     padding: "10px",
//   },

//   exportBtn: {
//     padding: "7px 12px",
//     background: "#2563eb",
//     color: "#fff",
//     border: "none",
//     borderRadius: "10px",
//     cursor: "pointer",
//     fontWeight: 600,
//     fontSize: "12px",
//   },
// };








