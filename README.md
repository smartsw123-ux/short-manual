# 장비 숏뉴얼 (Short-Manual)

건설기계 운전원 ↔ 제조사를 연결하는 **AI 매뉴얼 검색 + 자동 A/S 티켓** 시스템.

- **Next.js 15** (App Router) · Vercel 배포
- **Supabase** — Postgres(데이터) + Storage(PDF 파일)
- **Claude API** — 업로드된 매뉴얼 PDF 를 근거로 구조화된 정비 가이드 생성
- 로그인 없음 (오픈 접속, 서버 DB 공유)

---

## 🚀 최초 설정 (한 번만)

### 1. Supabase 프로젝트

1. https://supabase.com → 무료 가입 → **New project** 생성
2. 프로젝트가 준비되면 **좌측 메뉴 > SQL Editor** → **New query** →
   이 저장소의 [`supabase/schema.sql`](supabase/schema.sql) 내용을 통째로 붙여넣고 **RUN**
   (테이블 5개 + Storage 버킷 `manuals` 자동 생성)
3. **Settings > API** 에서 아래 2개 값 복사
   - `Project URL` → `SUPABASE_URL`
   - `service_role` `secret` 키 → `SUPABASE_SERVICE_ROLE_KEY`  ⚠️ 절대 공개 금지

### 2. Anthropic (Claude) API 키

1. https://console.anthropic.com → **API Keys** → **Create Key**
2. 값 복사 → `ANTHROPIC_API_KEY`
3. 결제 수단 등록 필요 (사용량 과금 · 질문 1건당 대략 수십 원)

### 3. Vercel 환경변수

Vercel 프로젝트 **Settings > Environment Variables** 에 추가 (Production, Preview 모두 체크):

| Key | Value |
|---|---|
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (service_role) |
| `ANTHROPIC_API_KEY` | `sk-ant-...` |
| `ANTHROPIC_MODEL` | `claude-sonnet-5` *(선택)* |

추가 후 **Deployments > 최신 배포 > Redeploy** 로 반영.

### 4. 확인

배포된 사이트 접속 → 우측 상단 배지가 **"시스템 연결됨"** 이면 완료.
"설정 필요" 로 뜨면 화면의 노란 배너가 무엇이 빠졌는지 알려줍니다.

---

## 🧪 사용 흐름

1. **STEP 0** — 장비 등록 (차대번호 입력 = 시스템 키)
2. **운전원 화면** — 에러 코드 + 증상을 자유 입력 → "AI 숏뉴얼 질문"
   → 업로드된 매뉴얼을 근거로 점검표 · 부품 리스트 생성
3. 👍 해결 완료 / 👎 해결 불가 → 👎 는 **A/S 티켓 자동 생성**
4. **제조사 대시보드** — PDF 다중 업로드(자동 텍스트 색인), 티켓 처리(출동 지시),
   KPI(방어율), 고장 로그, 부위별 집중도

여러 브라우저·기기에서 접속해도 **같은 서버 DB** 를 봅니다. (운전원이 만든 티켓을 제조사가 즉시 확인)

---

## 💻 로컬 개발

```bash
npm install
cp .env.example .env.local   # 값 채우기
npm run dev
```

---

## 📁 구조

```
app/
  page.jsx              화면 (운전원 / 대시보드 / 등록)
  layout.jsx
  api/
    equipment/          장비 등록·조회
    manuals/            PDF 업로드 + 텍스트 추출 + 목록/삭제
    ask/                RAG + Claude 구조화 답변
    feedback/           👍/👎 · 👎 시 티켓 자동 생성
    tickets/            티켓 목록·생성, [id]/dispatch 출동 지시
    dashboard/          KPI · 고장로그 · 라이브러리
    health/             환경변수/스키마 점검
lib/
  supabase.js  claude.js  pdf.js
supabase/schema.sql
public/prototype.html   (구 정적 프로토타입 · 참고용)
```

## 참고

- 스캔본 PDF(이미지)는 텍스트 추출이 안 되어 "미색인" 으로 표시됩니다. OCR 파이프라인은 추후 과제.
- RAG 는 키워드 기반 청크 선택(임베딩 미사용) — 소규모 매뉴얼에 적합. 대용량은 pgvector 도입 필요.
