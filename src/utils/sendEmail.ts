// 
















import { supabase } from "../supabaseClient";

export const sendTicketEmail = async (payload: any) => {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    console.log("SENDING PAYLOAD:", payload); // ✅ DEBUG

    const res = await fetch(
      "https://hevvbfybswocqmdxwpxa.supabase.co/functions/v1/ticket-email-notification",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const dataRes = await res.json();
    console.log("Email response:", dataRes);

  } catch (err) {
    console.error("Email Error:", err);
  }
};