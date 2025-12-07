// src/supabaseClient.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bazibzquasbdgjwdcwbz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhemlienF1YXNiZGdqd2Rjd2J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1OTA4NTMsImV4cCI6MjA3OTE2Njg1M30.6DzpF3l7zr6ld2z37Qa4XCPB11ZoQZqPHEOQvtQolDg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
