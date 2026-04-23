import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function ChangePassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

const handleChange = async () => {
  if (!password) {
    alert("Enter new password");
    return;
  }

  setLoading(true);

  try {
    // ✅ Update password
    const { error: passError } = await supabase.auth.updateUser({
      password,
    });

    if (passError) {
      alert(passError.message);
      return;
    }

    // ✅ Get user
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (!user) {
      alert("User not found");
      return;
    }

    console.log("USER ID:", user.id);

    // 🔥 UPDATE FLAG
    const { data, error: updateError } = await supabase
      .from("users")
      .update({ must_change_password: false })
      .eq("id", user.id)
      //.eq("email", user.email)
      .select(); // 👈 IMPORTANT (see result)

    console.log("UPDATE RESULT:", data);

    if (updateError) {
      alert("DB Update Error: " + updateError.message);
      return;
    }

    if (!data || data.length === 0) {
      alert("User row not updated ❌ (ID mismatch or RLS issue)");
      return;
    }

    alert("Password updated successfully ✅");

    navigate("/"); // better than window.location

  } catch (err: any) {
    alert(err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Change Password</h2>

        <input
          type="password"
          placeholder="Enter New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        <button onClick={handleChange} style={styles.button}>
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