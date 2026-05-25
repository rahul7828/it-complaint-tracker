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

  // ✅ FIXED STATUS MATCH
  tickets.forEach((t) => {
    if (t.status === "Open") statusCount.Open++;
    if (t.status === "In Progress") statusCount.InProgress++;
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

  // ✅ REMOVE ZERO VALUES (MAIN FIX)
  const filteredData = data.filter(item => item.value > 0);

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

        {/* PIE / DONUT CHART */}

        <div style={styles.chartBox}>
          <h3>Status Distribution</h3>

          <ResponsiveContainer width="100%" height={300}>
  <PieChart>

    {/* ✅ CENTER TOTAL */}
    <text
      x="50%"
      y="50%"
      textAnchor="middle"
      dominantBaseline="middle"
      style={{ fontSize: 18, fontWeight: "bold" }}
    >
      {totalTickets}
    </text>

    <Pie
      data={filteredData}
      dataKey="value"
      cx="50%"
      cy="50%"
      innerRadius={60}
      outerRadius={100}
      paddingAngle={3}

      // ✅ FIXED LABEL (no TS error)
      label={({ percent }) =>
        percent ? `${(percent * 100).toFixed(0)}%` : ""
      }
    >
      {filteredData.map((_, index) => (
        <Cell key={index} fill={COLORS[index]} />
      ))}
    </Pie>

    <Tooltip />
    <Legend verticalAlign="bottom" height={36} />

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
    background: "#000000",
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

