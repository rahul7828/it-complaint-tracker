import { useState } from "react";
import { supabase } from "../supabaseClient";

type Props = {
  ticket: any;
  onClose: () => void;
  onSuccess: () => void;
};

export default function EditTicketModal({
  ticket,
  onClose,
  onSuccess,
}: Props) {
  const [title, setTitle] =
    useState(ticket.title || "");

  const [
    description,
    setDescription,
  ] = useState(
    ticket.description || ""
  );

  const [email, setEmail] =
    useState(ticket.email || "");

  const [hodEmail, setHodEmail] =
    useState(
      ticket.hod_email || ""
    );

  const [priority, setPriority] =
    useState(
      ticket.priority || "Medium"
    );

  const [loading, setLoading] =
    useState(false);

  const handleUpdate =
    async () => {
      try {
        setLoading(true);

        const { error } =
          await supabase
            .from("tickets")
            .update({
              title,
              description,
              email,
              hod_email: hodEmail,
              priority,
              updated_at:
                new Date().toISOString(),
            })
            .eq("id", ticket.id);

        if (error) throw error;

        alert(
          "Ticket Updated Successfully ✅"
        );

        onSuccess();
        onClose();
      } catch (err: any) {
        alert(
          err.message ||
            "Update Failed"
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <h2 style={styles.header}>
          Edit Ticket
        </h2>

        <div style={styles.content}>
          <input
            style={styles.input}
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
            placeholder="User Email"
          />

          <input
            style={styles.input}
            value={title}
            onChange={(e) =>
              setTitle(
                e.target.value
              )
            }
            placeholder="Title"
          />

          <textarea
            style={{
              ...styles.input,
              height: "120px",
              resize: "none",
            }}
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value
              )
            }
            placeholder="Description"
          />

          <input
            style={styles.input}
            value={hodEmail}
            onChange={(e) =>
              setHodEmail(
                e.target.value
              )
            }
            placeholder="HOD Email"
          />

          <select
            style={styles.input}
            value={priority}
            onChange={(e) =>
              setPriority(
                e.target.value
              )
            }
          >
            <option value="High">
              High
            </option>

            <option value="Medium">
              Medium
            </option>

            <option value="Low">
              Low
            </option>

            <option value="Urgent">
              Urgent
            </option>
          </select>
        </div>

        <div style={styles.actions}>
          <button
            style={styles.cancel}
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            style={styles.submit}
            disabled={loading}
            onClick={handleUpdate}
          >
            {loading
              ? "Updating..."
              : "Update Ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: any = {
  overlay: {
    position: "fixed",
    inset: 0,
    background:
      "rgba(0,0,0,0.7)",
    display: "flex",
    justifyContent:
      "center",
    alignItems: "center",
    zIndex: 10000,
  },

  card: {
    width: "500px",
    background: "#111827",
    borderRadius: "20px",
    overflow: "hidden",
  },

  header: {
    color: "#fff",
    textAlign: "center",
    padding: "20px",
    margin: 0,
    borderBottom:
      "1px solid rgba(255,255,255,0.08)",
  },

  content: {
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },

  input: {
    padding: "12px",
    borderRadius: "10px",
    border:
      "1px solid rgba(255,255,255,0.08)",
    background: "#0f172a",
    color: "#fff",
    outline: "none",
  },

  actions: {
    display: "flex",
    justifyContent:
      "space-between",
    padding: "20px",
    borderTop:
      "1px solid rgba(255,255,255,0.08)",
  },

  cancel: {
    background: "#334155",
    color: "#fff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "10px",
    cursor: "pointer",
  },

  submit: {
    background: "#10b981",
    color: "#fff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "10px",
    cursor: "pointer",
  },
};