import { createClient } from '@supabase/supabase-js';

// External Supabase credentials - hardcoded to prevent env override by Lovable Cloud
const EXTERNAL_SUPABASE_URL = "https://mhfaumorpvhcavjtswlg.supabase.co";
const EXTERNAL_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oZmF1bW9ycHZoY2F2anRzd2xnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyODU4MjMsImV4cCI6MjA4Mjg2MTgyM30.7AGKx6cwgZYqyXkW6PwCuqLrNxA_YpyvAnZwZR1MJzI";

export const externalSupabase = createClient(
  EXTERNAL_SUPABASE_URL,
  EXTERNAL_SUPABASE_ANON_KEY
);
