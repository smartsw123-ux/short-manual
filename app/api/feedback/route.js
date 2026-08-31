import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { handle } from '@/lib/handler';

export const runtime = 'nodejs';

function ticketNo(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `TK-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

export const POST = handle(async (request) => {
  const sb = getSupabase();
  const body = await request.json();

  const queryId = body.query_id;
  const resolved = body.resolved === true;
  const attempted = (body.attempted || '').trim();

  if (!queryId) return NextResponse.json({ error: 'query_id 필요' }, { status: 400 });

  const { data: q, error: qErr } = await sb.from('queries').select('*').eq('id', queryId).maybeSingle();
  if (qErr || !q) return NextResponse.json({ error: '질의를 찾을 수 없습니다.' }, { status: 404 });

  await sb.from('queries').update({ resolved }).eq('id', queryId);

  if (resolved) return NextResponse.json({ ok: true, ticket: null });

  const { data: ticket, error: tErr } = await sb
    .from('tickets')
    .insert({
      ticket_no: ticketNo(),
      chassis_no: q.chassis_no,
      model: q.model,
      error_code: q.error_code,
      question: q.question,
      attempted:
        attempted ||
        (Array.isArray(q.ai_answer?.checklist) ? q.ai_answer.checklist.map((c) => c.action).join(' · ') : null),
      ai_answer: q.ai_answer,
      status: 'open',
      query_id: q.id,
    })
    .select()
    .single();

  if (tErr) throw new Error(tErr.message);

  await sb.from('queries').update({ ticket_id: ticket.id }).eq('id', queryId);
  return NextResponse.json({ ok: true, ticket });
});
