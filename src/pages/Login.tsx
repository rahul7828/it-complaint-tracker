import { useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!email || !password) {
      alert("Please enter Email and Password");
      return;
    }

    setLoading(true);

    try {
      // ✅ LOGIN
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        alert(loginError.message);
        return;
      }

      // ✅ GET USER
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (!user) {
        alert("User not found");
        return;
      }

      // ✅ GET PROFILE
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("role, must_change_password")
        .eq("id", user.id)
        .single();

      console.log("PROFILE:", profile);

      if (profileError || !profile) {
        alert("User profile nahi mila");
        return;
      }

      // 🔥 FIRST LOGIN FORCE PASSWORD CHANGE
      if (profile.must_change_password) {
        navigate("/change-password");
        return;
      }

      // ✅ NORMAL LOGIN
      navigate(profile.role === "admin" ? "/admin" : "/user");

    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form style={styles.card} onSubmit={handleLogin}>
        <img src="/logo.png" alt="Company Logo" style={styles.logo} />

        <h2 style={styles.heading}>IT Complaint Tracker</h2>

        <input
          style={styles.input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button style={styles.button} type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* 🔐 FORGOT PASSWORD */}
        <button
          type="button"
          style={styles.linkBtn}
          onClick={async () => {
            if (!email) {
              alert("Enter email first");
              return;
            }

            // await supabase.auth.resetPasswordForEmail(email, {
            //   redirectTo: "http://localhost:5173/reset-password",
            // });



            const redirectUrl = `${window.location.origin}/reset-password`;

await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: redirectUrl,
});




            alert("Password reset link sent 📧");
          }}
        >
          Forgot Password?
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
  },
  card: {
    width: "360px",
    padding: "30px",
    borderRadius: "14px",
    background: "#ffffff",
    boxShadow: "0 15px 30px rgba(0,0,0,0.15)",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  logo: {
    height: "70px",
    objectFit: "contain",
    marginBottom: "5px",
  },
  heading: {
    textAlign: "center",
    marginBottom: "10px",
    color: "#333",
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  button: {
    padding: "12px",
    borderRadius: "8px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "15px",
  },
  linkBtn: {
    background: "none",
    border: "none",
    color: "#2563eb",
    cursor: "pointer",
    fontSize: "13px",
    textAlign: "right",
  },
};





















// FINAL WORKING CODE BEFORE PASSWORD CHANGE FUNCTION 22/04/26
// import { useState } from "react";
// import type { CSSProperties } from "react";
// import { supabase } from "../supabaseClient";
// import { useNavigate } from "react-router-dom";

// export default function Login() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   const handleLogin = async (e?: React.FormEvent) => {
//     e?.preventDefault(); // ✅ ENTER key submit prevent reload

//     if (!email || !password) {
//       alert("Please enter Email and Password");
//       return;
//     }

//     setLoading(true);

//     const { error } = await supabase.auth.signInWithPassword({
//       email,
//       password,
//     });

//     if (error) {
//       alert(error.message);
//       setLoading(false);
//       return;
//     }

//     const { data: userProfile, error: profileError } = await supabase
//       .from("users")
//       .select("role")
//       .eq("email", email)
//       .single();

//     if (profileError || !userProfile) {
//       alert("User profile nahi mila");
//       setLoading(false);
//       return;
//     }

//     navigate(userProfile.role === "admin" ? "/admin" : "/user");
//     setLoading(false);
//   };
  

//   return (
//     <div style={styles.container}>
//       <form style={styles.card} onSubmit={handleLogin}>
//         {/* LOGO */}
//         <img
//           src="/logo.png"
//           alt="Company Logo"
//           style={styles.logo}
//         />
//         <h2 style={styles.heading}>IT Complaint Tracker</h2>

//         <input
//           style={styles.input}
//           type="email"
//           placeholder="Email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//         />

//         <input
//           style={styles.input}
//           type="password"
//           placeholder="Password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//         />

//         <button
//           style={styles.button}
//           type="submit"       // ✅ important
//           disabled={loading}
//         >
//           {loading ? "Logging in..." : "Login"}
//         </button>
//       </form>
//     </div>
//   );
// }

// const styles: Record<string, CSSProperties> = {
//   container: {
//     height: "100vh",
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//     background: "linear-gradient(135deg, #667eea, #764ba2)",
//   },
//   card: {
//     width: "360px",
//     padding: "30px",
//     borderRadius: "14px",
//     background: "#ffffff",
//     boxShadow: "0 15px 30px rgba(0,0,0,0.15)",
//     display: "flex",
//     flexDirection: "column",
//     gap: "15px",
//   },

//   logo: {
//     height: "70px",
//     objectFit: "contain",
//     marginBottom: "5px",
//   },

//   heading: {
//     textAlign: "center",
//     marginBottom: "10px",
//     color: "#333",
//   },
//   input: {
//     padding: "12px",
//     borderRadius: "8px",
//     border: "1px solid #ccc",
//     fontSize: "14px",
//   },
//   button: {
//     padding: "12px",
//     borderRadius: "8px",
//     background: "#4f46e5",
//     color: "#fff",
//     border: "none",
//     cursor: "pointer",
//     fontWeight: "bold",
//     fontSize: "15px",
//   },
// };



















// final working code before deployment
// import { useState } from "react";
// import type { CSSProperties } from "react";
// import { supabase } from "../supabaseClient";
// import { useNavigate } from "react-router-dom";

// export default function Login() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   const handleLogin = async () => {
//     if (!email || !password) {
//       alert("Email aur Password dono bhare");
//       return;
//     }

//     setLoading(true);

//     const { error } = await supabase.auth.signInWithPassword({
//       email,
//       password
//     });

//     if (error) {
//       alert(error.message);
//       setLoading(false);
//       return;
//     }

//     const { data: userProfile, error: profileError } = await supabase
//       .from("users")
//       .select("role")
//       .eq("email", email)
//       .single();

//     if (profileError || !userProfile) {
//       alert("User profile nahi mila");
//       setLoading(false);
//       return;
//     }

//     navigate(userProfile.role === "admin" ? "/admin" : "/user");
//     setLoading(false);
//   };

//   return (
//     <div style={styles.container}>
//       <div style={styles.card}>
//         <h2 style={styles.heading}>IT Complaint Tracker</h2>

//         <input
//           style={styles.input}
//           type="email"
//           placeholder="Email"
//           value={email}
//           onChange={e => setEmail(e.target.value)}
//         />

//         <input
//           style={styles.input}
//           type="password"
//           placeholder="Password"
//           value={password}
//           onChange={e => setPassword(e.target.value)}
//         />

//         <button
//           style={styles.button}
//           onClick={handleLogin}
//           disabled={loading}
//         >
//           {loading ? "Logging in..." : "Login"}
//         </button>
//       </div>
//     </div>
//   );
// }

// const styles: Record<string, CSSProperties> = {
//   container: {
//     height: "100vh",
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//     background: "linear-gradient(135deg, #667eea, #764ba2)"
//   },
//   card: {
//     width: "360px",
//     padding: "30px",
//     borderRadius: "14px",
//     background: "#ffffff",
//     boxShadow: "0 15px 30px rgba(0,0,0,0.15)",
//     display: "flex",
//     flexDirection: "column",
//     gap: "15px"
//   },
//   heading: {
//     textAlign: "center",
//     marginBottom: "10px",
//     color: "#333"
//   },
//   input: {
//     padding: "12px",
//     borderRadius: "8px",
//     border: "1px solid #ccc",
//     fontSize: "14px"
//   },
//   button: {
//     padding: "12px",
//     borderRadius: "8px",
//     background: "#4f46e5",
//     color: "#fff",
//     border: "none",
//     cursor: "pointer",
//     fontWeight: "bold",
//     fontSize: "15px"
//   }
// };
