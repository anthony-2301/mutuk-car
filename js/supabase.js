// js/supabase.js
const SUPABASE_URL = 'https://nuejepagywuozxdjymln.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZWplcGFneXd1b3p4ZGp5bWxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3OTUyMTksImV4cCI6MjEwMTM3MTIxOX0.NY5ubUi-2S9yMlpyFhAwCDMqUIywKJ9eiSho08mBB2k';

// Initialisation globale pour qu'elle soit accessible partout
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);