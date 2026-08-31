import { NextResponse } from 'next/server';
import { getSupabase, MANUALS_BUCKET } from '@/lib/supabase';
import { extractPdfText } from '@/lib/pdf';
import { handle } from '@/lib/handler';

export const runtime = 'nodejs';
export const maxDuration = 60;

export const GET = handle(async (request) => {
  const sb = getSupabase();
  const chassis = new URL(request.url).searchParams.get('chassis');
  let q = sb
    .from('manuals')
    .select('id, created_at, chassis_no, file_name, storage_path, page_count, char_count')
    .order('created_at', { ascending: false });
  if (chassis) q = q.eq('chassis_no', chassis);
  const { data, error } = await q;
  if (error) throw new Error(error.message);

  const withUrls = (data || []).map((m) => ({
    ...m,
    url: sb.storage.from(MANUALS_BUCKET).getPublicUrl(m.storage_path).data.publicUrl,
  }));
  return NextResponse.json({ manuals: withUrls });
});

export const POST = handle(async (request) => {
  const sb = getSupabase();
  const form = await request.formData();
  const chassis = String(form.get('chassis_no') || '').trim();
  const files = form.getAll('files').filter((f) => f && typeof f === 'object' && 'arrayBuffer' in f);

  if (!chassis) return NextResponse.json({ error: '차대번호가 필요합니다.' }, { status: 400 });
  if (!files.length) return NextResponse.json({ error: 'PDF 파일을 선택하세요.' }, { status: 400 });

  const { data: eq } = await sb.from('equipment').select('chassis_no').eq('chassis_no', chassis).maybeSingle();
  if (!eq) return NextResponse.json({ error: '먼저 해당 차대번호로 장비를 등록하세요.' }, { status: 400 });

  const results = [];
  for (const file of files) {
    const name = file.name || 'manual.pdf';
    const buf = await file.arrayBuffer();

    const path = `${chassis}/${Date.now()}_${name.replace(/[^\w.\-]+/g, '_')}`;
    const up = await sb.storage.from(MANUALS_BUCKET).upload(path, buf, {
      contentType: file.type || 'application/pdf',
      upsert: false,
    });
    if (up.error) {
      results.push({ file: name, ok: false, error: up.error.message });
      continue;
    }

    let extracted = { text: '', pageCount: null, charCount: 0 };
    try {
      extracted = await extractPdfText(buf);
    } catch {
      extracted.text = '';
    }

    const { data: row, error } = await sb
      .from('manuals')
      .insert({
        chassis_no: chassis,
        file_name: name,
        storage_path: path,
        page_count: extracted.pageCount,
        extracted_text: extracted.text || null,
        char_count: extracted.charCount || 0,
      })
      .select('id, file_name, page_count, char_count')
      .single();

    if (error) results.push({ file: name, ok: false, error: error.message });
    else results.push({ file: name, ok: true, ...row, indexed: (extracted.charCount || 0) > 0 });
  }

  return NextResponse.json({ results });
});

export const DELETE = handle(async (request) => {
  const sb = getSupabase();
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 });
  const { data: m } = await sb.from('manuals').select('storage_path').eq('id', id).maybeSingle();
  if (m?.storage_path) await sb.storage.from(MANUALS_BUCKET).remove([m.storage_path]);
  const { error } = await sb.from('manuals').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return NextResponse.json({ ok: true });
});
