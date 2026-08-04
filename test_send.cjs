const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://pbbhsatwiopcpknfivaw.supabase.co', 'placeholder');

const channel = supabase.channel('test', { config: { presence: { key: '123' } } });
channel.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    try {
      const res = channel.send({ type: 'broadcast', event: 'test', payload: {} });
      console.log('Send result:', res);
    } catch (e) {
      console.error('Send error:', e);
    }
    process.exit(0);
  }
});
