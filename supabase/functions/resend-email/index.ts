// 👇 VERY IMPORTANT
export const config = {
  auth: false,
};

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // ✅ CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, cc, subject, html } = await req.json();

    // ✅ basic validation
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: "Missing fields" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY missing" }),
        { status: 500, headers: corsHeaders }
      );
    }

    // 📧 Send mail via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "IT Support <onboarding@resend.dev>", // testing domain
        to,   // 👈 dynamic user email
        cc,   // 👈 dynamic hod email
        subject,
        html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "Resend error", data }),
        { status: res.status, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: corsHeaders }
    );
  }
});















// email send working code
// // 👇 VERY IMPORTANT
// export const config = {
//   auth: false,
// };

// import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Headers":
//     "authorization, x-client-info, apikey, content-type",
//   "Access-Control-Allow-Methods": "POST, OPTIONS",
// };

// serve(async (req) => {
//   // ✅ CORS preflight
//   if (req.method === "OPTIONS") {
//     return new Response("ok", { headers: corsHeaders });
//   }

//   try {
//     const { to, cc, subject, html } = await req.json();

//     if (!to || !subject || !html) {
//       return new Response(
//         JSON.stringify({ error: "Missing fields" }),
//         { status: 400, headers: corsHeaders }
//       );
//     }

//     const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

//     if (!RESEND_API_KEY) {
//       return new Response(
//         JSON.stringify({ error: "RESEND_API_KEY missing" }),
//         { status: 500, headers: corsHeaders }
//       );
//     }

//     const res = await fetch("https://api.resend.com/emails", {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${RESEND_API_KEY}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         from: "onboarding@resend.dev", // 👈 apna verified domain
//         to: "rahul.sharma@eagleseeds.com",
//         cc: "rahul.sharma@eagleseeds.com",
//         subject,
//         html,
//       }),
//     });

//     const data = await res.json();

//     if (!res.ok) {
//       return new Response(
//         JSON.stringify({ error: "Resend error", data }),
//         { status: res.status, headers: corsHeaders }
//       );
//     }

//     return new Response(
//       JSON.stringify({ success: true, data }),
//       { headers: corsHeaders }
//     );
//   } catch (err) {
//     return new Response(
//       JSON.stringify({ error: String(err) }),
//       { status: 500, headers: corsHeaders }
//     );
//   }
// });


















// // final working code 
// // 👇 THIS LINE IS VERY IMPORTANT
// export const config = {
//   auth: false,
// };



// import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Headers":
//     "authorization, x-client-info, apikey, content-type",
//   "Access-Control-Allow-Methods": "POST, OPTIONS",
// };

// serve(async (req) => {
//   // ✅ CORS preflight
//   if (req.method === "OPTIONS") {
//     return new Response("ok", { headers: corsHeaders });
//   }

//   try {
//     const { to, cc, subject, html } = await req.json();

//     if (!to || !subject || !html) {
//       return new Response(
//         JSON.stringify({ error: "Missing fields" }),
//         { status: 400, headers: corsHeaders }
//       );
//     }

//     const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

//     const res = await fetch("https://api.resend.com/emails", {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${RESEND_API_KEY}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         from: "IT Support <onboarding@resend.dev>",
//         to,
//         cc,
//         subject,
//         html,
//       }),
//     });

//     const data = await res.json();

//     return new Response(
//       JSON.stringify({ success: true, data }),
//       { headers: corsHeaders }
//     );
//   } catch (err) {
//     return new Response(
//       JSON.stringify({ error: String(err) }),
//       { status: 500, headers: corsHeaders }
//     );
//   }
// });


















/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/resend-email' \
    --header 'Authorization: Bearer eyJhbGciOiJFUzI1NiIsImtpZCI6ImI4MTI2OWYxLTIxZDgtNGYyZS1iNzE5LWMyMjQwYTg0MGQ5MCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjIwODQwMDE0MjR9.3K2WcBIdNS6jwbLRgm4aJTqVGPfIHu9cPxIBxUnNWwLz2GDynLuou5vytjahw-xOPRaftxTX-PJNxv-aoIGZCw' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
