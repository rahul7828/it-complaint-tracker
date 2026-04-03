import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import sgMail from "npm:@sendgrid/mail";

sgMail.setApiKey(Deno.env.get("SENDGRID_API_KEY")!);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    const {
      ticket_no,
      title,
      description,
      priority,
      status,
      to = [],        // ✅ NEW
      cc = [],        // ✅ NEW
      bcc = [],       // ✅ NEW
      user_email,     // fallback
      hod_email,      // fallback
      is_admin,
      remark,
      attachments = [],
    } = payload;

    // ✅ normalize (string -> array)
    const normalizeEmails = (val: any) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      return String(val)
        .split(",")
        .map((e) => e.trim())
        .filter((e) => e);
    };

    let toEmails = normalizeEmails(to);
    let ccEmails = normalizeEmails(cc);
    let bccEmails = normalizeEmails(bcc);

    // ✅ fallback (old support)
    if (toEmails.length === 0 && user_email) {
      toEmails = normalizeEmails(user_email);
    }

    if (ccEmails.length === 0 && hod_email) {
      ccEmails = normalizeEmails(hod_email);
    }

    // ✅ ALWAYS ADD IT MAIL
    if (!toEmails.includes("it@eagleseeds.com")) {
      toEmails.push("it@eagleseeds.com");
    }

    /* ---------------- ATTACHMENT HTML ---------------- */
    const attachmentHtml = attachments.length
      ? `
        <tr>
          <td><b>Attachments</b></td>
          <td>
            ${attachments
              .map(
                (url: string, i: number) =>
                  `<a href="${url}" target="_blank">Attachment ${i + 1}</a><br/>`
              )
              .join("")}
          </td>
        </tr>
      `
      : "";

    const msg = {
      to: toEmails,     // ✅ MULTIPLE TO
      cc: ccEmails,     // ✅ MULTIPLE CC
      bcc: bccEmails,   // ✅ OPTIONAL
      from: "rahul.sharma@eagleseeds.com",
      subject: `Ticket Update - ${ticket_no}`,
      html: `
        <div style="font-family:Arial;padding:20px">
          <h2 style="color:#4f46e5">Ticket Notification</h2>

          <table border="1" cellpadding="8" style="border-collapse:collapse;width:100%">
            <tr><td><b>Ticket No</b></td><td>${ticket_no}</td></tr>
            <tr><td><b>Title</b></td><td>${title}</td></tr>
            <tr><td><b>Description</b></td><td>${description}</td></tr>
            <tr><td><b>Status</b></td><td>${status}</td></tr>
            <tr><td><b>Priority</b></td><td>${priority}</td></tr>

            ${remark ? `<tr><td><b>Remark</b></td><td>${remark}</td></tr>` : ""}

            ${attachmentHtml}

          </table>

          <p style="margin-top:20px">Regards,<br/>IT Team</p>
        </div>
      `,
    };

    // ✅ DEBUG
    console.log("FINAL TO:", toEmails);
    console.log("FINAL CC:", ccEmails);
    console.log("FINAL BCC:", bccEmails);

    await sgMail.send(msg);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("ERROR:", err);

    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});






















//final working code before multiple email ids attach
// import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// import sgMail from "npm:@sendgrid/mail";

// sgMail.setApiKey(Deno.env.get("SENDGRID_API_KEY")!);

// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
// };

// Deno.serve(async (req) => {

//   // ✅ CORS FIX
//   if (req.method === "OPTIONS") {
//     return new Response("ok", { headers: corsHeaders });
//   }

//   try {
//     const payload = await req.json();

//     const {
//       ticket_no,
//       title,
//       description,
//       priority,
//       status,
//       user_email,
//       hod_email,
//       is_admin,
//       remark,
//       attachments = [] // ✅ NEW
//     } = payload;

//     let toEmails: string[] = [];
//     let ccEmails: string[] = [];

//     /* ---------------- CREATE ---------------- */
//     if (status === "Open") {
//       toEmails = [user_email, "it@eagleseeds.com"];
//       ccEmails = [hod_email];
//     }

//     /* ---------------- UPDATE ---------------- */
//     else {
//       if (is_admin) {
//         // ✅ ADMIN UPDATE
//         toEmails = [user_email];
//         ccEmails = [hod_email, "it@eagleseeds.com"];
//       } else {
//         // ✅ USER UPDATE
//         toEmails = ["it@eagleseeds.com"];
//         ccEmails = [hod_email];
//       }
//     }

//     // ✅ ATTACHMENT HTML
//     const attachmentHtml = attachments.length
//       ? `
//         <tr>
//           <td><b>Attachments</b></td>
//           <td>
//             ${attachments
//               .map((url: string, i: number) =>
//                 `<a href="${url}" target="_blank">Attachment ${i + 1}</a><br/>`
//               )
//               .join("")}
//           </td>
//         </tr>
//       `
//       : "";

//     const msg = {
//       to: toEmails,
//       cc: ccEmails,
//       from: "rahul.sharma@eagleseeds.com",
//       subject: `Ticket Update - ${ticket_no}`,
//       html: `
//         <div style="font-family:Arial;padding:20px">
//           <h2 style="color:#4f46e5">Ticket Notification</h2>

//           <table border="1" cellpadding="8" style="border-collapse:collapse;width:100%">
//             <tr><td><b>Ticket No</b></td><td>${ticket_no}</td></tr>
//             <tr><td><b>Title</b></td><td>${title}</td></tr>
//             <tr><td><b>Description</b></td><td>${description}</td></tr>
//             <tr><td><b>Status</b></td><td>${status}</td></tr>
//             <tr><td><b>Priority</b></td><td>${priority}</td></tr>

//             ${remark ? `<tr><td><b>Remark</b></td><td>${remark}</td></tr>` : ""}

//             ${attachmentHtml}  <!-- ✅ ATTACHMENT -->

//           </table>

//           <p style="margin-top:20px">Regards,<br/>IT Team</p>
//         </div>
//       `,
//     };

//     // ✅ DEBUG (optional but helpful)
//     console.log("TO:", toEmails);
//     console.log("CC:", ccEmails);
//     console.log("ATTACHMENTS:", attachments);

//     await sgMail.send(msg);

//     return new Response(JSON.stringify({ success: true }), {
//       status: 200,
//       headers: { ...corsHeaders, "Content-Type": "application/json" },
//     });

//   } catch (err: any) {
//     console.error("ERROR:", err);

//     return new Response(JSON.stringify({ error: err.message }), {
//       status: 500,
//       headers: { ...corsHeaders, "Content-Type": "application/json" },
//     });
//   }
// });























// final working code before attachment send in email 30/03/26
// import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// import sgMail from "npm:@sendgrid/mail";

// sgMail.setApiKey(Deno.env.get("SENDGRID_API_KEY")!);

// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
// };

// Deno.serve(async (req) => {

//   if (req.method === "OPTIONS") {
//     return new Response("ok", { headers: corsHeaders });
//   }

//   try {
//     const payload = await req.json();

//     const {
//       ticket_no,
//       title,
//       description,
//       priority,
//       status,
//       user_email,
//       hod_email,
//       is_admin,   // ✅ NEW FLAG
//       remark
//     } = payload;

//     let toEmails: string[] = [];
//     let ccEmails: string[] = [];

//     /* ---------------- CREATE ---------------- */
//     if (status === "Open") {
//       toEmails = [user_email, "it@eagleseeds.com"];
//       ccEmails = [hod_email];
//     }

//     /* ---------------- UPDATE ---------------- */
//     else {
//       if (is_admin) {
//         // ✅ ADMIN UPDATE
//         toEmails = [user_email];
//         ccEmails = [hod_email, "it@eagleseeds.com"];
//       } else {
//         // ✅ USER UPDATE
//         toEmails = ["it@eagleseeds.com"];
//         ccEmails = [hod_email];
//       }
//     }

//     const msg = {
//       to: toEmails,
//       cc: ccEmails, // ✅ IMPORTANT
//       from: "rahul.sharma@eagleseeds.com",
//       subject: `Ticket Update - ${ticket_no}`,
//       html: `
//         <div style="font-family:Arial;padding:20px">
//           <h2 style="color:#4f46e5">Ticket Notification</h2>

//           <table border="1" cellpadding="8" style="border-collapse:collapse;width:100%">
//             <tr><td><b>Ticket No</b></td><td>${ticket_no}</td></tr>
//             <tr><td><b>Title</b></td><td>${title}</td></tr>
//             <tr><td><b>Description</b></td><td>${description}</td></tr>
//             <tr><td><b>Status</b></td><td>${status}</td></tr>
//             <tr><td><b>Priority</b></td><td>${priority}</td></tr>
//             ${
//               remark
//                 ? `<tr><td><b>Remark</b></td><td>${remark}</td></tr>`
//                 : ""
//             }
//           </table>

//           <p style="margin-top:20px">Regards,<br/>IT Team</p>
//         </div>
//       `,
//     };

//     console.log("TO:", toEmails);
//     console.log("CC:", ccEmails);

//     await sgMail.send(msg);

//     return new Response(JSON.stringify({ success: true }), {
//       status: 200,
//       headers: { ...corsHeaders, "Content-Type": "application/json" },
//     });

//   } catch (err: any) {
//     console.error("ERROR:", err);

//     return new Response(JSON.stringify({ error: err.message }), {
//       status: 500,
//       headers: { ...corsHeaders, "Content-Type": "application/json" },
//     });
//   }
// });























//final working code before hod and IT cc function add 30/03/26
// import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// import sgMail from "npm:@sendgrid/mail";

// sgMail.setApiKey(Deno.env.get("SENDGRID_API_KEY")!);

// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
// };

// Deno.serve(async (req) => {

//   if (req.method === "OPTIONS") {
//     return new Response("ok", { headers: corsHeaders });
//   }

//   try {
//     const payload = await req.json();

//     const {
//       ticket_no,
//       title,
//       description,
//       department,
//       priority,
//       status,
//       email,
//       remark // ✅ NEW
//     } = payload;

//     const msg = {
//       to: Array.isArray(email) ? email : [email],
//       from: "rahul.sharma@eagleseeds.com",
//       subject: `Ticket Update - ${ticket_no}`,
//       html: `
//         <div style="font-family:Arial;padding:20px">
//           <h2 style="color:#4f46e5">Ticket Notification</h2>

//           <table border="1" cellpadding="8" style="border-collapse:collapse;width:100%">
//             <tr><td><b>Ticket No</b></td><td>${ticket_no}</td></tr>
//             <tr><td><b>Title</b></td><td>${title}</td></tr>
//             <tr><td><b>Description</b></td><td>${description}</td></tr>
//             <tr><td><b>Status</b></td><td>${status}</td></tr>
//             <tr><td><b>Priority</b></td><td>${priority}</td></tr>
//             ${
//               remark
//                 ? `<tr><td><b>Latest Remark</b></td><td>${remark}</td></tr>`
//                 : ""
//             }
//           </table>

//           <p style="margin-top:20px">Regards,<br/>IT Team</p>
//         </div>
//       `,
//     };

//     await sgMail.send(msg);

//     return new Response(JSON.stringify({ success: true }), {
//       status: 200,
//       headers: { ...corsHeaders, "Content-Type": "application/json" },
//     });

//   } catch (err: any) {
//     console.error("ERROR:", err);

//     return new Response(JSON.stringify({ error: err.message }), {
//       status: 500,
//       headers: { ...corsHeaders, "Content-Type": "application/json" },
//     });
//   }
// });
























// import "jsr:@supabase/functions-js/edge-runtime.d.ts"
// import sgMail from "npm:@sendgrid/mail";

// sgMail.setApiKey(Deno.env.get("SENDGRID_API_KEY")!);

// Deno.serve(async (req) => {

//   const payload = await req.json();

//   const {
//     ticket_no,
//     title,
//     description,
//     department,
//     priority,
//     status,
//     email,
//     hod_email,
//     assigned_to
//   } = payload;

//   let subject = "";
//   let recipients: string[] = [];

//   if (status === "Open") {

//     subject = `New IT Ticket Created - ${ticket_no}`;

//     recipients = [
//       email,
//       hod_email,
//       "rahul.sharma@eagleseeds.com"
//     ];

//   }

//   if (status === "Assigned") {

//     subject = `Ticket Assigned - ${ticket_no}`;

//     recipients = [
//       assigned_to,
//       "it@eagleseeds.com"
//     ];

//   }

//   if (status === "Closed") {

//     subject = `Ticket Closed - ${ticket_no}`;

//     recipients = [
//       email,
//       hod_email,
//       "it@eagleseeds.com"
//     ].filter(Boolean);

//   }

//   const html = `
//   <div style="font-family:Arial;padding:20px">

//     <h2 style="color:#0d6efd">IT Support Ticket Update</h2>

//     <table border="1" cellpadding="10" style="border-collapse:collapse">

//       <tr>
//         <td><b>Ticket No</b></td>
//         <td>${ticket_no}</td>
//       </tr>

//       <tr>
//         <td><b>Title</b></td>
//         <td>${title}</td>
//       </tr>

//       <tr>
//         <td><b>Description</b></td>
//         <td>${description}</td>
//       </tr>

//       <tr>
//         <td><b>Department</b></td>
//         <td>${department}</td>
//       </tr>

//       <tr>
//         <td><b>Priority</b></td>
//         <td>${priority}</td>
//       </tr>

//       <tr>
//         <td><b>Status</b></td>
//         <td>${status}</td>
//       </tr>

//     </table>

//     <br/>

//     <p>IT Team will resolve the issue shortly.</p>

//     <p>Regards,<br/>IT Support Team</p>

//   </div>
//   `;

//   const msg = {
//     to: recipients,
//     from: "rahul.sharm@eagleseeds.com",
//     subject: subject,
//     html: html
//   };

//   await sgMail.send(msg);

//   return new Response(JSON.stringify({ success: true }), { status: 200 });

// });





















 



















// last final code 18/03/26
// import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// import sgMail from "npm:@sendgrid/mail";

// sgMail.setApiKey(Deno.env.get("SENDGRID_API_KEY")!);

// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
// };

// Deno.serve(async (req) => {

//   if (req.method === "OPTIONS") {
//     return new Response("ok", { headers: corsHeaders });
//   }

//   try {
//     const payload = await req.json();

//     const {
//       ticket_no,
//       title,
//       description,
//       department,
//       priority,
//       status,
//       email,
//       remark // ✅ NEW
//     } = payload;

//     const msg = {
//       to: Array.isArray(email) ? email : [email],
//       from: "rahul.sharma@eagleseeds.com",
//       subject: `Ticket Update - ${ticket_no}`,
//       html: `
//         <div style="font-family:Arial;padding:20px">
//           <h2 style="color:#4f46e5">Ticket Notification</h2>

//           <table border="1" cellpadding="8" style="border-collapse:collapse;width:100%">
//             <tr><td><b>Ticket No</b></td><td>${ticket_no}</td></tr>
//             <tr><td><b>Title</b></td><td>${title}</td></tr>
//             <tr><td><b>Description</b></td><td>${description}</td></tr>
//             <tr><td><b>Status</b></td><td>${status}</td></tr>
//             <tr><td><b>Priority</b></td><td>${priority}</td></tr>
//             ${
//               remark
//                 ? `<tr><td><b>Latest Remark</b></td><td>${remark}</td></tr>`
//                 : ""
//             }
//           </table>

//           <p style="margin-top:20px">Regards,<br/>IT Team</p>
//         </div>
//       `,
//     };

//     await sgMail.send(msg);

//     return new Response(JSON.stringify({ success: true }), {
//       status: 200,
//       headers: { ...corsHeaders, "Content-Type": "application/json" },
//     });

//   } catch (err: any) {
//     console.error("ERROR:", err);

//     return new Response(JSON.stringify({ error: err.message }), {
//       status: 500,
//       headers: { ...corsHeaders, "Content-Type": "application/json" },
//     });
//   }
// });