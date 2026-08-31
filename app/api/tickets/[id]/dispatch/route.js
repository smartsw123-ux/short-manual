import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { handle } from '@/lib/handler';

export const runtime = 'nodejs';

export const POST = handle(async (_request, { params }) => {
  const sb = getSupabase();
  const { id } = await params;

  const { data, error } = await sb
    .from('tickets')
    .update({ status: 'dispatched', dispatched_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return NextResponse.json({ ticket: data });
});
