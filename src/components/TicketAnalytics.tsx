import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export default function TicketAnalytics({ tickets }: any) {

  const open = tickets.filter((t:any)=>t.status==="Open").length;
  const progress = tickets.filter((t:any)=>t.status==="InProgress").length;
  const resolved = tickets.filter((t:any)=>t.status==="Resolved").length;
  const closed = tickets.filter((t:any)=>t.status==="Closed").length;

  const data = [
    { name: "Open", value: open },
    { name: "InProgress", value: progress },
    { name: "Resolved", value: resolved },
    { name: "Closed", value: closed },
  ];

  const COLORS = ["#ef4444","#f59e0b","#22c55e","#64748b"];

  return (
    <div style={{marginBottom:30}}>
      <h3>Ticket Analytics</h3>

      <PieChart width={400} height={300}>
        <Pie
          data={data}
          dataKey="value"
          outerRadius={120}
        >
          {data.map((_entry, index) => (
            <Cell key={index} fill={COLORS[index]} />
          ))}
        </Pie>

        <Tooltip />
        <Legend />
      </PieChart>
    </div>
  );
}   