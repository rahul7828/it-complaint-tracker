import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/user" element={<UserDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

// import { useEffect, useState } from "react"
// import { supabase } from "./supabaseClient"
// import Login from "./pages/Login"
// import UserDashboard from "./pages/UserDashboard"
// import AdminDashboard from "./pages/AdminDashboard"

// function App() {
//   const [loading, setLoading] = useState(true)
//   const [session, setSession] = useState<any>(null)
//   const [role, setRole] = useState<string | null>(null)

//   useEffect(() => {
//     supabase.auth.getSession().then(({ data }) => {
//       setSession(data.session)
//       setLoading(false)
//       if (data.session) loadProfile(data.session.user.id)
//     })

//     supabase.auth.onAuthStateChange((_e, s) => {
//       setSession(s)
//       if (s) loadProfile(s.user.id)
//     })
//   }, [])

//   const loadProfile = async (id: string) => {
//     const { data } = await supabase
//       .from("users")
//       .select("role")
//       .eq("id", id)
//       .single()

//     setRole(data?.role || "user")
//   }

//   if (loading) return <p>Loading...</p>
//   if (!session) return <Login />

//   return role === "admin" ? <AdminDashboard /> : <UserDashboard />
// }

// export default App
