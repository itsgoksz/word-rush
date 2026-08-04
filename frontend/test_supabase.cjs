const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://placeholder.supabase.co', 'placeholder');
console.log('starting');
supabase.auth.signUp({ email: 'test@wordrush.app', password: 'password123' })
  .then(res => console.log('res', res))
  .catch(err => console.error('err', err));
