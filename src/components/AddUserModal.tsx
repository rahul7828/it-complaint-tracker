import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

type Props = {
  onClose: () => void;
  onSuccess: () => void;
  editingUser?: any;
};

export default function AddUserModal({ onClose, onSuccess, editingUser }: Props) {

  const [form, setForm] = useState({
    username: "",
    name: "",
    role: "user",
    department: "IT",
    email: "",
  });

  const [loading, setLoading] = useState(false);

  // ✅ EDIT MODE DATA
  useEffect(() => {
    if (editingUser) {
      setForm({
        username: editingUser.username || "",
        name: editingUser.name || "",
        role: editingUser.role || "user",
        department: editingUser.department || "IT",
        email: editingUser.email || "",
      });
    }
  }, [editingUser]);

  const handleSubmit = async () => {
    try {
      setLoading(true);

      /* ---------------- ADD USER ---------------- */
      if (!editingUser) {

        if (!form.email) {
          alert("Email required");
          return;
        }

        // 🔥 FIXED PASSWORD
        const password = "Eagle@117";

        // ✅ CREATE AUTH USER
        const { data: authData, error: authError } =
          await supabase.auth.signUp({
            email: form.email,
            password: password,
          });

        if (authError) throw authError;

        // ✅ INSERT INTO USERS TABLE
        const { error } = await supabase.from("users").insert({
          id: authData.user?.id,
          username: form.username,
          name: form.name,
          role: form.role,
          department: form.department,
          email: form.email,
        });

        if (error) throw error;

        alert(`User Added ✅\nPassword: ${password}`);
      }

      /* ---------------- EDIT USER ---------------- */
      else {
        const { error } = await supabase
          .from("users")
          .update({
            username: form.username,
            name: form.name,
            role: form.role,
            department: form.department,
            email: form.email,
          })
          .eq("id", editingUser.id);

        if (error) throw error;

        alert("User Updated ✅");
      }

      onSuccess();
      onClose();

    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <h2>{editingUser ? "Edit User" : "Add User"}</h2>

        <input
          placeholder="Username"
          value={form.username}
          onChange={(e) =>
            setForm({ ...form, username: e.target.value })
          }
          style={styles.input}
        />

        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
          style={styles.input}
        />

        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
          style={styles.input}
        />

        <select
          value={form.role}
          onChange={(e) =>
            setForm({ ...form, role: e.target.value })
          }
          style={styles.input}
        >
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>

        <select
          value={form.department}
          onChange={(e) =>
            setForm({ ...form, department: e.target.value })
          }
          style={styles.input}
        >
          <option value="IT">IT</option>
          <option value="HR">HR</option>
          <option value="Finance">Finance</option>
          <option value="Sales">Sales</option>
          <option value="PRD">PRD</option>
        </select>

        <div style={styles.actions}>
          <button onClick={onClose}>Cancel</button>

          <button onClick={handleSubmit} disabled={loading}>
            {loading
              ? "Saving..."
              : editingUser
              ? "Update User"
              : "Add User"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- STYLES ---------- */

const styles: any = {
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
    width: "350px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  input: {
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "6px",
  },

  actions: {
    display: "flex",
    justifyContent: "space-between",
  },
};






















// import { useState } from "react";
// import { supabase } from "../supabaseClient";

// type Props = {
//   onClose: () => void;
//   onSuccess: () => void;
// };

// export default function AddUserModal({ onClose, onSuccess }: Props) {

//   const [form, setForm] = useState({
//     username: "",
//     name: "",
//     role: "user",
//     department: "IT",
//     email: "",
//     password: "", // ✅ NEW
//   });

//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async () => {
//     try {
//       setLoading(true);

//       // ✅ VALIDATION
//       if (!form.email || !form.password) {
//         alert("Email & Password required");
//         return;
//       }

//       // 🔥 STEP 1: CREATE AUTH USER
//       const { data: authData, error: authError } =
//         await supabase.auth.signUp({
//           email: form.email,
//           password: form.password,
//         });

//       if (authError) throw authError;

//       // 🔥 STEP 2: INSERT INTO USERS TABLE
//       const { error } = await supabase.from("users").insert({
//         id: authData.user?.id, // 🔥 IMPORTANT
//         username: form.username,
//         name: form.name,
//         role: form.role,
//         department: form.department,
//         email: form.email,
        
//       });

//       if (error) throw error;

//       alert("User added ✅");
//       onSuccess();
//       onClose();

//     } catch (err: any) {
//       alert(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={styles.overlay}>
//       <div style={styles.card}>
//         <h2>Add User</h2>

//         <input
//           placeholder="Username"
//           value={form.username}
//           onChange={(e) =>
//             setForm({ ...form, username: e.target.value })
//           }
//           style={styles.input}
//         />

//         <input
//           placeholder="Name"
//           value={form.name}
//           onChange={(e) =>
//             setForm({ ...form, name: e.target.value })
//           }
//           style={styles.input}
//         />

//         <input
//           placeholder="Email"
//           value={form.email}
//           onChange={(e) =>
//             setForm({ ...form, email: e.target.value })
//           }
//           style={styles.input}
//         />

//         {/* ✅ PASSWORD FIELD */}
//         <input
//           type="password"
//           placeholder="Password"
//           value={form.password}
//           onChange={(e) =>
//             setForm({ ...form, password: e.target.value })
//           }
//           style={styles.input}
//         />

//         {/* ✅ ROLE */}
//         <select
//           value={form.role}
//           onChange={(e) =>
//             setForm({ ...form, role: e.target.value })
//           }
//           style={styles.input}
//         >
//           <option value="admin">Admin</option>
//           <option value="user">User</option>
//         </select>

//         {/* ✅ DEPARTMENT */}
//         <select
//           value={form.department}
//           onChange={(e) =>
//             setForm({ ...form, department: e.target.value })
//           }
//           style={styles.input}
//         >
//           <option value="IT">IT</option>
//           <option value="HR">HR</option>
//           <option value="Finance">Finance</option>
//           <option value="Sales">Sales</option>
//           <option value="PRD">PRD</option> {/* ✅ ADDED */}
//         </select>

//         <div style={styles.actions}>
//           <button onClick={onClose}>Cancel</button>

//           <button onClick={handleSubmit} disabled={loading}>
//             {loading ? "Saving..." : "Add User"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ---------- STYLES ---------- */

// const styles: any = {
//   overlay: {
//     position: "fixed",
//     inset: 0,
//     background: "rgba(0,0,0,0.5)",
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//   },

//   card: {
//     background: "#fff",
//     padding: "20px",
//     borderRadius: "10px",
//     width: "350px",
//     display: "flex",
//     flexDirection: "column",
//     gap: "10px",
//   },

//   input: {
//     padding: "10px",
//     border: "1px solid #ccc",
//     borderRadius: "6px",
//   },

//   actions: {
//     display: "flex",
//     justifyContent: "space-between",
//   },
// };

















// working code
// import { useState } from "react";
// import { supabase } from "../supabaseClient";

// type Props = {
//   onClose: () => void;
//   onSuccess: () => void;
// };

// export default function AddUserModal({ onClose, onSuccess }: Props) {
//   const [form, setForm] = useState({
//     username: "",
//     name: "",
//     role: "user",
//     department: "IT",
//     email: "",
//   });

//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async () => {
//     try {
//       setLoading(true);

//       const { error } = await supabase.from("users").insert(form);
//       if (error) throw error;

//       alert("User added ✅");
//       onSuccess();
//       onClose();
//     } catch (err: any) {
//       alert(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={styles.overlay}>
//       <div style={styles.card}>
//         <h2>Add User</h2>

//         <input placeholder="Username"
//           value={form.username}
//           onChange={(e)=>setForm({...form, username:e.target.value})}
//           style={styles.input}
//         />

//         <input placeholder="Name"
//           value={form.name}
//           onChange={(e)=>setForm({...form, name:e.target.value})}
//           style={styles.input}
//         />

//         <input placeholder="Email"
//           value={form.email}
//           onChange={(e)=>setForm({...form, email:e.target.value})}
//           style={styles.input}
//         />

//         {/* ✅ ROLE DROPDOWN */}
//         <select
//           value={form.role}
//           onChange={(e)=>setForm({...form, role:e.target.value})}
//           style={styles.input}
//         >
//           <option value="admin">Admin</option>
//           <option value="user">User</option>
//         </select>

//         {/* ✅ DEPARTMENT DROPDOWN */}
//         <select
//           value={form.department}
//           onChange={(e)=>setForm({...form, department:e.target.value})}
//           style={styles.input}
//         >
//           <option value="IT">IT</option>
//           <option value="HR">HR</option>
//           <option value="Finance">Finance</option>
//           <option value="Sales">Sales</option>
//           <option value="PRD">PRD</option>
//         </select>

//         <div style={styles.actions}>
//           <button onClick={onClose}>Cancel</button>
//           <button onClick={handleSubmit} disabled={loading}>
//             {loading ? "Saving..." : "Add User"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// const styles:any = {
//   overlay:{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",justifyContent:"center",alignItems:"center"},
//   card:{background:"#fff",padding:"20px",borderRadius:"10px",width:"350px",display:"flex",flexDirection:"column",gap:"10px"},
//   input:{padding:"10px",border:"1px solid #ccc",borderRadius:"6px"},
//   actions:{display:"flex",justifyContent:"space-between"}
// };