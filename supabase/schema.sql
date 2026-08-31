-- ═══════════════════════════════════════════════════════════════
--  장비 숏뉴얼 (Short-Manual) · 데이터베이스 스키마
--  Supabase 대시보드 > SQL Editor 에 통째로 붙여넣고 RUN 하세요.
-- ═══════════════════════════════════════════════════════════════

-- 1. 장비 마스터 (차대번호가 시스템 핵심 키)
create table if not exists equipment (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  eq_type       text not null,
  maker         text not null,
  model         text not null,
  chassis_no    text not null unique,          -- SYSTEM KEY
  engine_maker  text,
  engine_model  text
);

-- 2. 매뉴얼 (차대번호에 매핑된 PDF + 추출 텍스트)
create table if not exists manuals (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  chassis_no     text not null references equipment(chassis_no) on delete cascade,
  file_name      text not null,
  storage_path   text not null,                -- Supabase Storage 경로
  page_count     int,
  extracted_text text,                         -- RAG 검색 대상
  char_count     int
);
create index if not exists manuals_chassis_idx on manuals(chassis_no);

-- 3. 질의 로그 (운전원의 모든 질문 — KPI/고장로그 집계 소스)
create table if not exists queries (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  chassis_no    text not null,
  model         text,
  error_code    text,
  question      text not null,
  ai_answer     jsonb,                         -- {summary, checklist[], parts[], manual_ref, confidence}
  resolved      boolean,                       -- null=미평가, true=👍, false=👎
  ticket_id     uuid
);
create index if not exists queries_chassis_idx on queries(chassis_no);
create index if not exists queries_error_idx   on queries(error_code);

-- 4. A/S 긴급 정비 요청 티켓
create table if not exists tickets (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  ticket_no     text not null,
  chassis_no    text not null,
  model         text,
  error_code    text,
  question      text,
  attempted     text,                          -- 시도한 조치
  ai_answer     jsonb,
  status        text not null default 'open',  -- open | dispatched | resolved
  dispatched_at timestamptz,
  query_id      uuid
);
create index if not exists tickets_status_idx on tickets(status);

-- 5. 고장 로그 집계 뷰 (queries 에서 실시간 파생)
create or replace view fault_logs as
select
  chassis_no,
  model,
  error_code,
  count(*)                                             as occurrences,
  count(*) filter (where resolved is true)             as ai_resolved,
  count(*) filter (where resolved is false)            as escalated,
  max(created_at)                                      as last_seen
from queries
where error_code is not null and error_code <> ''
group by chassis_no, model, error_code
order by occurrences desc;

-- ─── Storage 버킷 ──────────────────────────────────────────────
-- 아래는 SQL 로 버킷을 만드는 방법입니다. (대시보드 UI 로 만들어도 됩니다)
insert into storage.buckets (id, name, public)
values ('manuals', 'manuals', true)
on conflict (id) do nothing;

-- ─── RLS (로그인 없는 테스트 단계) ────────────────────────────
-- 지금은 서버(service_role 키)에서만 접근하므로 RLS 를 켜고 정책은 두지 않습니다.
-- service_role 키는 RLS 를 우회하므로 서버 API 는 정상 동작하고, 익명 클라이언트는 차단됩니다.
alter table equipment enable row level security;
alter table manuals   enable row level security;
alter table queries   enable row level security;
alter table tickets   enable row level security;
