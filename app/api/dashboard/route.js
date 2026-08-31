import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { handle } from '@/lib/handler';

export const runtime = 'nodejs';

export const GET = handle(async () => {
  const sb = getSupabase();

  const [
    { count: totalQ },
    { count: resolvedQ },
    { data: openTickets },
    { data: faultLogs },
    { data: manuals },
    { data: equipment },
  ] = await Promise.all([
    sb.from('queries').select('*', { count: 'exact', head: true }),
    sb.from('queries').select('*', { count: 'exact', head: true }).eq('resolved', true),
    sb.from('tickets').select('*').eq('status', 'open'),
    sb.from('fault_logs').select('*').limit(20),
    sb
      .from('manuals')
      .select('id, chassis_no, file_name, page_count, char_count, created_at')
      .order('created_at', { ascending: false }),
    sb.from('equipment').select('*').order('created_at', { ascending: false }),
  ]);

  const total = totalQ || 0;
  const solved = resolvedQ || 0;
  const defenseRate = total ? Math.round((solved / total) * 100) : 0;

  const buckets = { 유압: 0, 엔진: 0, 전기: 0, 기타: 0 };
  for (const f of faultLogs || []) {
    const s = `${f.error_code} ${f.model}`.toLowerCase();
    if (/유압|hyd|402|릴리프|쿨러|밸브/.test(s)) buckets['유압'] += f.occurrences;
    else if (/엔진|engine|연료|fuel|108|터보/.test(s)) buckets['엔진'] += f.occurrences;
    else if (/전기|elec|센서|sensor|231|하네스/.test(s)) buckets['전기'] += f.occurrences;
    else buckets['기타'] += f.occurrences;
  }

  return NextResponse.json({
    kpi: {
      total_questions: total,
      ai_resolved: solved,
      defense_rate: defenseRate,
      open_tickets: (openTickets || []).length,
    },
    fault_logs: faultLogs || [],
    part_breakdown: buckets,
    manuals: manuals || [],
    equipment: equipment || [],
  });
});
