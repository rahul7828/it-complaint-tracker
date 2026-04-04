import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Header from "../components/Header";
import AddUserModal from "../components/AddUserModal";

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showAddUser, setShowAddUser] = useState(false);

  const fetchUsers = async () => {
    const { data } = await supabase.from("users").select("*").order("created_at", { ascending: false });
    setUsers(data || []);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const deleteUser = async (id: string) => {
    if (!confirm("Delete user?")) return;

    await supabase.from("users").delete().eq("id", id);
    fetchUsers();
  };

  const updateUser = async () => {
    const { id, ...updateData } = editingUser;

    const { error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", id);

    if (!error) {
      alert("Updated ✅");
      setEditingUser(null);
      fetchUsers();
    }
  };

  return (
    <div style={styles.page}>
      <Header title="User Management" />

      <div style={styles.container}>

        {/* 🔥 TOP ACTIONS */}
        <div style={styles.topBar}>
          <button onClick={() => (window.location.href = "/admin")}>
            ⬅ Back
          </button>

          <button
            style={styles.addBtn}
            onClick={() => setShowAddUser(true)}
          >
            + Add User
          </button>
        </div>

        {/* ✅ USER TABLE */}
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Department</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>

          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={5} style={styles.empty}>
                  No users found
                </td>
              </tr>
            )}

            {users.map((u) => (
              <tr key={u.id}>
                <td style={styles.td}>{u.name}</td>
                <td style={styles.td}>{u.email}</td>
                <td style={styles.td}>{u.role}</td>
                <td style={styles.td}>{u.department}</td>
                <td style={styles.td}>
                  <button onClick={() => setEditingUser(u)}>Edit</button>
                  <button onClick={() => deleteUser(u.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✅ ADD USER MODAL */}
      {showAddUser && (
        <AddUserModal
          onClose={() => setShowAddUser(false)}
          onSuccess={fetchUsers}
        />
      )}

      {/* ✅ EDIT MODAL */}
      {editingUser && (
        <div style={styles.overlay}>
          <div style={styles.card}>
            <h3>Edit User</h3>

            <input
              placeholder="Name"
              value={editingUser.name}
              onChange={(e) =>
                setEditingUser({ ...editingUser, name: e.target.value })
              }
            />

            <input
              placeholder="Email"
              value={editingUser.email}
              onChange={(e) =>
                setEditingUser({ ...editingUser, email: e.target.value })
              }
            />

            <input
              placeholder="Password"
              type="password"
              onChange={(e) =>
                setEditingUser({ ...editingUser, password: e.target.value })
              }
            />

            <select
              value={editingUser.role}
              onChange={(e) =>
                setEditingUser({ ...editingUser, role: e.target.value })
              }
            >
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>

            <select
              value={editingUser.department}
              onChange={(e) =>
                setEditingUser({
                  ...editingUser,
                  department: e.target.value,
                })
              }
            >
              <option value="IT">IT</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="Sales">Sales</option>
            </select>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={updateUser}>Update</button>
              <button onClick={() => setEditingUser(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- STYLES ---------- */

const styles: any = {
  page: {
    minHeight: "100vh",
    background: "#f1f5f9",
  },

  container: {
    padding: 30,
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
  },

  addBtn: {
    padding: "10px 16px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },

  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: "0 10px",
  },

  th: {
    padding: "12px",
    background: "#e2e8f0",
    textAlign: "left",
  },

  td: {
    padding: "12px",
    background: "#fff",
  },

  empty: {
    textAlign: "center",
    padding: "20px",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    width: "320px",
  },
};