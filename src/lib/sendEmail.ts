import { supabase } from "../supabaseClient";

type SendEmailProps = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailProps) {
  const { data, error } = await supabase.functions.invoke(
    "resend-email",
    {
      body: { to, subject, html },
    }
  );

  if (error) {
    console.error("❌ Email error:", error);
    throw error;
  }

  console.log("✅ Email sent:", data);
  return data;
}
