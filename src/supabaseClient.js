import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://bxeujckwyeimvruyfoam.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4ZXVqY2t3eWVpbXZydXlmb2FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMzU4MzEsImV4cCI6MjA4ODYxMTgzMX0.dqWlG0FJGHek1G28kts_PmsE6ES5JVG6ifP9OX4tXYs";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
