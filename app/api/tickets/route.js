import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { handle } from '@/lib/handler';

export const runtime = 'nodejs';

function ticketNo(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `TK-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

export const GET = handle(async (request) => {
  const sb = getSupabase();
  const status = new URL(request.url).searchParams.get('status');
  let q = sb.from('tickets').select('*').order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return NextResponse.json({ tickets: data });
});

export const POST = handle(async (request) => {
  const sb = getSupabase();
  const body = await request.json();
  const chassis = (body.chassis_no || '').trim();
  if (!chassis) return NextResponse.json({ error: '차대번호 필요' }, { status: 400 });

  const { data: eq } = await sb.from('equipment').select('*').eq('chassis_no', chassis).maybeSingle();

  const { data, error } = await sb
    .from('tickets')
    .insert({
      ticket_no: ticketNo(),
      chassis_no: chassis,
      model: eq?.model || body.model || null,
      error_code: (body.error_code || '').trim() || null,
      question: (body.question || '').trim() || null,
      attempted: (body.attempted || '').trim() || null,
      ai_answer: body.ai_answer || null,
      status: 'open',
      query_id: body.query_id || null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return NextResponse.json({ ticket: data });
});
