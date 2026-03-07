import {
PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

type Props = {
  tickets: any[];
};

export default function TicketAnalytics({ tickets }: Props) {

  const statusCount = {
    Open: 0,
    InProgress: 0,
    Resolved: 0,
    Closed: 0
  };

  tickets.forEach((t) => {
    if (t.status === "Open") statusCount.Open++;
    if (t.status === "InProgress") statusCount.InProgress++;
    if (t.status === "Resolved") statusCount.Resolved++;
    if (t.status === "Closed") statusCount.Closed++;
  });

  const totalTickets =
    statusCount.Open +
    statusCount.InProgress +
    statusCount.Resolved +
    statusCount.Closed;

  const data = [
    { name: "Open", value: statusCount.Open },
    { name: "In Progress", value: statusCount.InProgress },
    { name: "Resolved", value: statusCount.Resolved },
    { name: "Closed", value: statusCount.Closed }
  ];

  const COLORS = ["#ef4444", "#f59e0b", "#10b981", "#6b7280"];

  return (
    <div style={{ width: "100%", marginTop: 20 }}>

      <h2 style={{ marginBottom: 20 }}>Ticket Analytics Dashboard</h2>

      {/* KPI CARDS */}

      <div style={styles.cardContainer}>

        <div style={styles.card}>
          <h4>Total Tickets</h4>
          <p style={styles.number}>{totalTickets}</p>
        </div>

        <div style={{ ...styles.card, borderTop: "4px solid #ef4444" }}>
          <h4>Open</h4>
          <p style={styles.number}>{statusCount.Open}</p>
        </div>

        <div style={{ ...styles.card, borderTop: "4px solid #f59e0b" }}>
          <h4>In Progress</h4>
          <p style={styles.number}>{statusCount.InProgress}</p>
        </div>

        <div style={{ ...styles.card, borderTop: "4px solid #10b981" }}>
          <h4>Resolved</h4>
          <p style={styles.number}>{statusCount.Resolved}</p>
        </div>

        <div style={{ ...styles.card, borderTop: "4px solid #6b7280" }}>
          <h4>Closed</h4>
          <p style={styles.number}>{statusCount.Closed}</p>
        </div>

      </div>

      {/* CHARTS */}

      <div style={styles.chartContainer}>

        {/* PIE CHART */}

        <div style={styles.chartBox}>
          <h3>Status Distribution</h3>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>

              <Pie
                data={data}
                dataKey="value"
                outerRadius={100}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {data.map((_, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>

              <Tooltip />
              <Legend />

            </PieChart>
          </ResponsiveContainer>

        </div>

        {/* BAR CHART */}

        <div style={styles.chartBox}>
          <h3>Status Comparison</h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="name" />

              <YAxis allowDecimals={false} />

              <Tooltip />

              <Legend />

              <Bar dataKey="value" fill="#6366f1" />

            </BarChart>
          </ResponsiveContainer>

        </div>

      </div>

    </div>
  );
}

const styles: any = {

  cardContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "15px",
    marginBottom: "30px"
  },

  card: {
    background: "#ffffff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
    textAlign: "center"
  },

  number: {
    fontSize: "26px",
    fontWeight: "bold",
    marginTop: "10px"
  },

  chartContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px"
  },

  chartBox: {
    background: "#ffffff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.1)"
  }

};






















// import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

// type Props = {
//   tickets: any[];
// };

// export default function TicketAnalytics({ tickets }: Props) {

//   const statusCount = {
//     Open: 0,
//     InProgress: 0,
//     Resolved: 0,
//     Closed: 0
//   };

//   tickets.forEach((t) => {
//     if (t.status === "Open") statusCount.Open++;
//     if (t.status === "InProgress") statusCount.InProgress++;
//     if (t.status === "Resolved") statusCount.Resolved++;
//     if (t.status === "Closed") statusCount.Closed++;
//   });

//   const data = [
//     { name: "Open", value: statusCount.Open },
//     { name: "InProgress", value: statusCount.InProgress },
//     { name: "Resolved", value: statusCount.Resolved },
//     { name: "Closed", value: statusCount.Closed }
//   ];

//   const COLORS = ["#ef4444", "#f59e0b", "#10b981", "#6b7280"];

//   return (
//     <div style={{ width: "100%", height: 300, marginTop: 20 }}>
//       <h3>Ticket Status Analytics</h3>

//       <ResponsiveContainer>
//         <PieChart>
//           <Pie
//             data={data}
//             dataKey="value"
//             outerRadius={100}
//             label
//           >
//             {data.map((_, index) => (
//               <Cell key={index} fill={COLORS[index]} />
//             ))}
//           </Pie>

//           <Tooltip />
//         </PieChart>
//       </ResponsiveContainer>

//     </div>
//   );
// }
















// import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

// export default function TicketAnalytics({ tickets }: any) {

//   const open = tickets.filter((t:any)=>t.status==="Open").length;
//   const progress = tickets.filter((t:any)=>t.status==="InProgress").length;
//   const resolved = tickets.filter((t:any)=>t.status==="Resolved").length;
//   const closed = tickets.filter((t:any)=>t.status==="Closed").length;

//   const data = [
//     { name: "Open", value: open },
//     { name: "InProgress", value: progress },
//     { name: "Resolved", value: resolved },
//     { name: "Closed", value: closed },
//   ];

//   const COLORS = ["#ef4444","#f59e0b","#22c55e","#64748b"];

//   return (
//     <div style={{marginBottom:30}}>
//       <h3>Ticket Analytics</h3>

//       <PieChart width={400} height={300}>
//         <Pie
//           data={data}
//           dataKey="value"
//           outerRadius={120}
//         >
//           {data.map((_entry, index) => (
//             <Cell key={index} fill={COLORS[index]} />
//           ))}
//         </Pie>

//         <Tooltip />
//         <Legend />
//       </PieChart>
//     </div>
//   );
// }   