
const SUPABASE_URL = "https://agebzbieovrsyqwqmkbu.supabase.co";

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZWJ6Ymllb3Zyc3lxd3Fta2J1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5NDU0NDcsImV4cCI6MjEwMzUyMTQ0N30.t8t1lD7tuS1iXzsU5O-IqjKRpgjG-OGGUoKxQMEBw1c";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);
