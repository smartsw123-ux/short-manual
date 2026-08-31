import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { handle } from '@/lib/handler';

export const runtime = 'nodejs';

export const GET = handle(async (request) => {
  const sb = getSupabase();
  const chassis = new URL(request.url).searchParams.get('chassis');

  if (chassis) {
    const { data, error } = await sb.from('equipment').select('*').eq('chassis_no', chassis).maybeSingle();
    if (error) throw new Error(error.message);
    return NextResponse.json({ equipment: data });
  }

  const { data, error } = await sb.from('equipment').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return NextResponse.json({ equipment: data });
});

export const POST = handle(async (request) => {
  const sb = getSupabase();
  const body = await request.json();

  const row = {
    eq_type: (body.eq_type || '').trim(),
    maker: (body.maker || '').trim(),
    model: (body.model || '').trim(),
    chassis_no: (body.chassis_no || '').trim(),
    engine_maker: (body.engine_maker || '').trim() || null,
    engine_model: (body.engine_model || '').trim() || null,
  };

  if (!row.eq_type || !row.maker || !row.model || !row.chassis_no) {
    return NextResponse.json({ error: '장비 종류·제조사·모델명·차대번호는 필수입니다.' }, { status: 400 });
  }

  const { data, error } = await sb
    .from('equipment')
    .upsert(row, { onConflict: 'chassis_no' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return NextResponse.json({ equipment: data });
});
