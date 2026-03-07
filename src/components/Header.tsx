import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

type Props = {
  title: string;
};

export default function Header({ title }: Props) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div style={styles.header}>

      {/* Left Side - Logo + Company */}
      <div style={styles.left}>
        <img
          src="/logo.png"
          alt="logo"
          style={styles.logo}
        />

        <div>
          <h2 style={styles.company}>Eagle Seeds</h2>
          {/* <p style={styles.subtitle}>IT Complaint Tracker</p> */}
        </div>
      </div>

      {/* Center Title */}
      <h2 style={styles.title}>{title}</h2>

      {/* Right Side Logout */}
      <button onClick={handleLogout} style={styles.logout}>
        Logout
      </button>

    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {

  header: {
    height: 70,
    background: "linear-gradient(135deg, #4f46e5, #3b82f6)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 30px",
    boxShadow: "0 6px 15px rgba(0,0,0,0.15)"
  },

  left: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },

  logo: {
    height: 42,
    width: 42,
    objectFit: "contain",
    borderRadius: 6,
    background: "#fff",
    padding: 3
  },

  company: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700
  },

  subtitle: {
    margin: 0,
    fontSize: 12,
    opacity: 0.9
  },

  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 600
  },

  logout: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600
  }

};


























// import { supabase } from "../supabaseClient";
// import { useNavigate } from "react-router-dom";

// type Props = {
//   title: string;
// };

// export default function Header({ title }: Props) {
//   const navigate = useNavigate();

//   const handleLogout = async () => {
//     await supabase.auth.signOut();
//     navigate("/");
//   };

//   return (
//     <div style={styles.header}>
//       <h2 style={styles.title}>{title}</h2>
//       <h2 style={styles.company}>Eagle Seeds</h2>
//       <button onClick={handleLogout} style={styles.logout}>
//         Logout
//       </button>
//     </div>
//   );
// }

// const styles: { [key: string]: React.CSSProperties } = {
//   header: {
//     height: 70,
//     background: "linear-gradient(135deg, #4f46e5, #3b82f6)",
//     color: "#fff",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "space-between",
//     padding: "0 30px",
//     boxShadow: "0 6px 15px rgba(0,0,0,0.15)"
//   },
//   title: {
//     margin: 0,
//     fontSize: 20,
//     fontWeight: 600
//   },
//   logout: {
//     background: "#ef4444",
//     color: "#fff",
//     border: "none",
//     padding: "8px 16px",
//     borderRadius: 8,
//     cursor: "pointer",
//     fontWeight: 600
//   }
   
// };
