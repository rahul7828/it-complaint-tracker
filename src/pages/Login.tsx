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

    /* ✅ DOMAIN SECURITY */

    const allowedDomains = [
      "eagleseeds.com",
      "eagleseeds.in",
    ];

    const emailDomain = email.split("@")[1]?.toLowerCase();

    if (!allowedDomains.includes(emailDomain)) {
      alert(
        "Only Eagle Seeds official email IDs are allowed"
      );
      return;
    }

    setLoading(true);

    try {
      /* ✅ LOGIN */

      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (loginError) {
        alert(loginError.message);
        return;
      }

      /* ✅ GET USER */

      const { data: authData } =
        await supabase.auth.getUser();

      const user = authData.user;

      if (!user) {
        alert("User not found");
        return;
      }

      /* ✅ GET PROFILE */

      const { data: profile, error: profileError } =
        await supabase
          .from("users")
          .select("role, must_change_password")
          .eq("id", user.id)
          .single();

      console.log("PROFILE:", profile);

      if (profileError || !profile) {
        alert("User profile nahi mila");
        return;
      }

      /* ✅ FORCE PASSWORD CHANGE */

      if (profile.must_change_password) {
        navigate("/change-password");
        return;
      }

      /* ✅ NORMAL LOGIN */

      navigate(
        profile.role === "admin"
          ? "/admin"
          : "/user"
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* BG GLOW */}
      <div style={styles.blur1}></div>
      <div style={styles.blur2}></div>

      <form style={styles.card} onSubmit={handleLogin}>
        {/* LOGO */}
        <div style={styles.logoWrap}>
          <img
            src="/logo.png"
            alt="Company Logo"
            style={styles.logo}
          />
        </div>

        {/* TITLE */}
        <div style={styles.headingWrap}>
          <h1 style={styles.heading}>
            IT Complaint Tracker
          </h1>

          <p style={styles.subHeading}>
            Eagle Seeds IT Helpdesk Portal
          </p>
        </div>

        {/* EMAIL */}
        <div style={styles.inputWrap}>
          <label style={styles.label}>
            Official Email
          </label>

          <input
            style={styles.input}
            type="email"
            placeholder="name@eagleseeds.com"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />
        </div>

        {/* PASSWORD */}
        <div style={styles.inputWrap}>
          <label style={styles.label}>
            Password
          </label>

          <input
            style={styles.input}
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />
        </div>

        {/* LOGIN BTN */}
        <button
          style={styles.button}
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Logging in..."
            : "Login to Dashboard"}
        </button>

        {/* FORGOT PASSWORD */}
        <button
          type="button"
          style={styles.linkBtn}
          onClick={async () => {
            if (!email) {
              alert("Enter email first");
              return;
            }

            const allowedDomains = [
              "eagleseeds.com",
              "eagleseeds.in",
            ];

            const emailDomain = email
              .split("@")[1]
              ?.toLowerCase();

            if (
              !allowedDomains.includes(emailDomain)
            ) {
              alert(
                "Only company email IDs are allowed"
              );
              return;
            }

            const redirectUrl = `${window.location.origin}/reset-password`;

            console.log(
              "REDIRECT URL:",
              redirectUrl
            );

            await supabase.auth.resetPasswordForEmail(
              email,
              {
                redirectTo: redirectUrl,
              }
            );

            alert(
              "Password reset link sent 📧"
            );
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
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background:
      "linear-gradient(135deg, #020617 0%, #0f172a 50%, #111827 100%)",
    position: "relative",
    overflow: "hidden",
    padding: "20px",
  },

  blur1: {
    position: "absolute",
    width: "320px",
    height: "320px",
    borderRadius: "50%",
    background: "#2563eb",
    filter: "blur(120px)",
    opacity: 0.18,
    top: "-80px",
    left: "-80px",
  },

  blur2: {
    position: "absolute",
    width: "320px",
    height: "320px",
    borderRadius: "50%",
    background: "#7c3aed",
    filter: "blur(120px)",
    opacity: 0.18,
    bottom: "-80px",
    right: "-80px",
  },

  card: {
    width: "100%",
    maxWidth: "420px",
    background: "rgba(15,23,42,0.92)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "24px",
    padding: "36px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    backdropFilter: "blur(18px)",
    boxShadow:
      "0 20px 50px rgba(0,0,0,0.45)",
    position: "relative",
    zIndex: 2,
  },

  logoWrap: {
    display: "flex",
    justifyContent: "center",
  },

  logo: {
    width: "64px",
    height: "64px",
    objectFit: "contain",
    borderRadius: "16px",
    background: "#ffffff",
    padding: "8px",
    boxShadow:
      "0 8px 18px rgba(0,0,0,0.22)",
  },

  headingWrap: {
    textAlign: "center",
    marginBottom: "10px",
  },

  heading: {
    color: "#ffffff",
    fontSize: "28px",
    margin: 0,
    fontWeight: 700,
    letterSpacing: "-0.5px",
    fontFamily:
    "'Inter', 'Segoe UI', sans-serif",
  },

  subHeading: {
    color: "#94a3b8",
    marginTop: "6px",
    fontSize: "13px",
    fontFamily:
    "'Inter', 'Segoe UI', sans-serif",
  },

  inputWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  label: {
    color: "#cbd5e1",
    fontSize: "13px",
    fontWeight: 600,
    fontFamily:
    "'Inter', 'Segoe UI', sans-serif",
  },

  input: {
    padding: "14px 16px",
    borderRadius: "14px",
    border:
      "1px solid rgba(255,255,255,0.08)",
    background: "#111827",
    color: "#ffffff",
    fontSize: "14px",
    outline: "none",
    transition: "0.2s",
    fontFamily:
    "'Inter', 'Segoe UI', sans-serif",
  },

  button: {
    marginTop: "8px",
    padding: "14px",
    borderRadius: "14px",
    background:
      "linear-gradient(135deg,#2563eb,#4f46e5)",
    color: "#ffffff",
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "14px",
    fontFamily:
    "'Inter', 'Segoe UI', sans-serif",
    boxShadow:
      "0 10px 25px rgba(37,99,235,0.35)",
  },

  linkBtn: {
    background: "none",
    border: "none",
    color: "#60a5fa",
    cursor: "pointer",
    fontSize: "13px",
    textAlign: "center",
    marginTop: "2px",
    fontFamily:
    "'Inter', 'Segoe UI', sans-serif",
  },
};































// final working code before vaibhav sir design changes
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
//     e?.preventDefault();

//     if (!email || !password) {
//       alert("Please enter Email and Password");
//       return;
//     }

//     setLoading(true);

//     try {
//       // ✅ LOGIN
//       const { error: loginError } = await supabase.auth.signInWithPassword({
//         email,
//         password,
//       });

//       if (loginError) {
//         alert(loginError.message);
//         return;
//       }

//       // ✅ GET USER
//       const { data: authData } = await supabase.auth.getUser();
//       const user = authData.user;

//       if (!user) {
//         alert("User not found");
//         return;
//       }

//       // ✅ GET PROFILE
//       const { data: profile, error: profileError } = await supabase
//         .from("users")
//         .select("role, must_change_password")
//         .eq("id", user.id)
//         .single();

//       console.log("PROFILE:", profile);

//       if (profileError || !profile) {
//         alert("User profile nahi mila");
//         return;
//       }

//       // 🔥 FIRST LOGIN FORCE PASSWORD CHANGE
//       if (profile.must_change_password) {
//         navigate("/change-password");
//         return;
//       }

//       // ✅ NORMAL LOGIN
//       navigate(profile.role === "admin" ? "/admin" : "/user");

//     } catch (err: any) {
//       alert(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={styles.container}>
//       <form style={styles.card} onSubmit={handleLogin}>
//         <img src="/logo.png" alt="Company Logo" style={styles.logo} />

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

//         <button style={styles.button} type="submit" disabled={loading}>
//           {loading ? "Logging in..." : "Login"}
//         </button>

//         {/* 🔐 FORGOT PASSWORD */}
//         <button
//           type="button"
//           style={styles.linkBtn}
//           onClick={async () => {
//             if (!email) {
//               alert("Enter email first");
//               return;
//             }

//             // await supabase.auth.resetPasswordForEmail(email, {
//             //   redirectTo: "http://locatlhost:5173/reset-password",
//             // });



//             const redirectUrl = `${window.location.origin}/reset-password`;
//             console.log("REDIRECT URL:", `${window.location.origin}/reset-password`);


// await supabase.auth.resetPasswordForEmail(email, {
//   redirectTo: redirectUrl,
// });




//             alert("Password reset link sent 📧");
//           }}
//         >
//           Forgot Password?
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
//   linkBtn: {
//     background: "none",
//     border: "none",
//     color: "#2563eb",
//     cursor: "pointer",
//     fontSize: "13px",
//     textAlign: "right",
//   },
// };





















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
