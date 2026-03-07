import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

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

  const data = [
    { name: "Open", value: statusCount.Open },
    { name: "InProgress", value: statusCount.InProgress },
    { name: "Resolved", value: statusCount.Resolved },
    { name: "Closed", value: statusCount.Closed }
  ];

  const COLORS = ["#ef4444", "#f59e0b", "#10b981", "#6b7280"];

  return (
    <div style={{ width: "100%", height: 300, marginTop: 20 }}>
      <h3>Ticket Status Analytics</h3>

      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            outerRadius={100}
            label
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index]} />
            ))}
          </Pie>

          <Tooltip />
        </PieChart>
      </ResponsiveContainer>

    </div>
  );
}
















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