import { NextResponse } from 'next/server';
import { supabaseConfigured, getSupabase } from '@/lib/supabase';
import { claudeConfigured } from '@/lib/claude';

export const runtime = 'nodejs';

export async function GET() {
  const out = {
    supabase_env: supabaseConfigured(),
    anthropic_env: claudeConfigured(),
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

  out.ready = out.supabase_env && out.anthropic_env && out.schema_ok;
  return NextResponse.json(out);
}
