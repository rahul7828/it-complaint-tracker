import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = async () => {
    if (!password) {
      alert("Enter new password");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    alert("Password reset successfully ✅");
    navigate("/");

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Reset Password</h2>

        <input
          type="password"
          placeholder="Enter New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        <button onClick={handleReset} style={styles.button}>
          {loading ? "Updating..." : "Update Password"}
        </button>
      </div>
    </div>
  );
}

const styles: any = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f1f5f9",
  },
  card: {
    padding: "30px",
    background: "#fff",
    borderRadius: "10px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    width: "300px",
  },
  input: {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  button: {
    padding: "10px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};





















// import { useState } from "react";
// import { supabase } from "../supabaseClient";

// export default function ResetPassword() {
//   const [password, setPassword] = useState("");

//   const handleReset = async () => {
//     const { error } = await supabase.auth.updateUser({
//       password,
//     });

//     if (error) {
//       alert(error.message);
//       return;
//     }

//     alert("Password reset successful ✅");
//     window.location.href = "/";
//   };

//   return (
//     <div style={{ padding: 30 }}>
//       <h2>Reset Password</h2>

//       <input
//         type="password"
//         placeholder="New Password"
//         onChange={(e) => setPassword(e.target.value)}
//       />

//       <button onClick={handleReset}>
//         Reset Password
//       </button>
//     </div>
//   );
// }