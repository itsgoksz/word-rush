import dotenv from 'dotenv'
dotenv.config()

export async function saveMatchResult(room: any) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.log('[Supabase Stub] Match finished:', room.id)
    console.log('[Supabase Stub] Final Scores:', room.players)
    console.log('[Supabase Stub] History:', JSON.stringify(room.history, null, 2))
    return
  }

  // TODO: Actual Supabase insertion logic goes here.
  // const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
  // await supabase.from('matches').insert({...})
  // await supabase.from('rounds').insert([...])
}
