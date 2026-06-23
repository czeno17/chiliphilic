import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bvtmutehmgrtwsbscmak.supabase.co';
const supabaseAnonKey = 'sb_publishable_bzOwbub0A5EUPTWxJpRtzg_5Qw2LPUz';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);