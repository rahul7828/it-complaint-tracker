import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function TicketUpdateModal({
  ticket,
  close,
}: {
  ticket: any;
  close: () => void;
}) {
  const [status, setStatus] = useState(ticket.status);
  const [comment, setComment] = useState(ticket.comments || "");

  const update = async () => {
    await supabase
      .from("tickets")
      .update({
        status,
        comments: comment,
        updated_at: new Date().toISOString(), // ✅ CRITICAL FIX
      })
      .eq("id", ticket.id);

    close();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3>Update Ticket</h3>

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option>Open</option>
          <option>In Progress</option>
          <option>Closed</option>
        </select>

        <textarea
          placeholder="Admin Comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <button onClick={update}>Save</button>
        <button onClick={close}>Cancel</button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    background: "#fff",
    padding: "20px",
    width: "350px",
    borderRadius: "10px",
  },
};
  

