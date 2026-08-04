const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://pbbhsatwiopcpknfivaw.supabase.co', process.env.SUPABASE_ANON_KEY || 'placeholder'); // we still need key

console.log('Docs say: "By default, Broadcast is enabled for all custom channels."');
