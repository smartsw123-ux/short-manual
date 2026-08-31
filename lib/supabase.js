import { createClient } from '@supabase/supabase-js';

// 서버 전용 Supabase 클라이언트 (service_role 키 → RLS 우회).
// 절대 클라이언트 컴포넌트에서 import 하지 마세요.

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const MANUALS_BUCKET = process.env.SUPABASE_MANUALS_BUCKET || 'manuals';

export function getSupabase() {
  if (!url || !serviceKey) {
    throw new Error(
      'Supabase 환경변수가 없습니다. Vercel 프로젝트 설정에 SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY 를 추가하세요.'
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function supabaseConfigured() {
  return Boolean(url && serviceKey);
}
