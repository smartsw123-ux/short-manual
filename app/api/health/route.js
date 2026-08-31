import { NextResponse } from 'next/server';
import { supabaseConfigured, getSupabase } from '@/lib/supabase';
import { aiConfigured } from '@/lib/ai';

export const runtime = 'nodejs';

export async function GET() {
  const out = {
    supabase_env: supabaseConfigured(),
    ai_env: aiConfigured(),
    db_ok: false,
    schema_ok: false,
  };

  if (out.supabase_env) {
    try {
      const sb = getSupabase();
      const { error } = await sb.from('equipment').select('id', { head: true, count: 'exact' });
      out.db_ok = true;
      out.schema_ok = !error;
      if (error) out.schema_error = error.message;
    } catch (e) {
      out.db_error = e.message;
    }
  }

  out.ready = out.supabase_env && out.ai_env && out.schema_ok;
  return NextResponse.json(out);
}
