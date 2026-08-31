import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { buildContext, generateAnswer } from '@/lib/ai';
import { handle } from '@/lib/handler';

export const runtime = 'nodejs';
export const maxDuration = 60;

export const POST = handle(async (request) => {
  const sb = getSupabase();
  const body = await request.json();

  const chassis = (body.chassis_no || '').trim();
  const errorCode = (body.error_code || '').trim();
  const question = (body.question || '').trim();

  if (!chassis || !question) {
    return NextResponse.json({ error: '차대번호와 질문이 필요합니다.' }, { status: 400 });
  }

  const { data: equipment } = await sb.from('equipment').select('*').eq('chassis_no', chassis).maybeSingle();
  if (!equipment) return NextResponse.json({ error: '등록되지 않은 차대번호입니다.' }, { status: 404 });

  const { data: manuals } = await sb
    .from('manuals')
    .select('file_name, extracted_text')
    .eq('chassis_no', chassis);

  const { context, sources } = buildContext(manuals || [], { errorCode, question });

  const answer = await generateAnswer({ equipment, errorCode, question, context, sources });

  const { data: q } = await sb
    .from('queries')
    .insert({
      chassis_no: chassis,
      model: equipment.model,
      error_code: errorCode || null,
      question,
      ai_answer: answer,
      resolved: null,
    })
    .select('id')
    .single();

  return NextResponse.json({ query_id: q?.id, answer, manual_count: (manuals || []).length, sources });
});
