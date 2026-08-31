import { NextResponse } from 'next/server';

// API 라우트 공통 래퍼: 예외를 사용자에게 읽히는 JSON 으로 변환.
export const handle =
  (fn) =>
  async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      const msg = e?.message || '서버 오류가 발생했습니다.';
      const isConfig = /환경변수|API_KEY|SUPABASE|GEMINI/.test(msg);
      console.error('[api]', msg, e);
      return NextResponse.json({ error: msg }, { status: isConfig ? 503 : 500 });
    }
  };
