import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rzssnpgcpkutuvfavgie.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_aK_pFZjg6DB6Wvv_swwEKQ_-2o1gKxL';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type DbScript = {
  id: string;
  user_id: string;
  title: string;
  raw_text: string;
  created_at: string;
};

export type DbRunAttempt = {
  id: string;
  user_id: string;
  script_id: string | null;
  scene_name: string;
  character_name: string;
  accuracy: number;
  duration_seconds: number;
  created_at: string;
};
