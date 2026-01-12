import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hevvbfybswocqmdxwpxa.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhldnZiZnlic3dvY3FtZHh3cHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzODI0NzQsImV4cCI6MjA4MTk1ODQ3NH0.yiHJiC2t3GQYmkKOzARQmj-LerD658p2Szqm1OdK0fw";

export const supabase = createClient(supabaseUrl,supabaseAnonKey);
