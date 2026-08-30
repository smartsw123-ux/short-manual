# 장비 숏뉴얼 (Short-Manual) — 데모 배포

이 폴더( `web/` )가 배포 대상입니다. 안에 `index.html` 하나만 있으면 됩니다.

- 프론트엔드 전용 프로토타입입니다. (백엔드/서버 DB 없음)
- 입력한 장비 정보·생성한 A/S 티켓·업로드 목록은 **접속한 브라우저에만** `localStorage`로 저장됩니다.
  즉 A 기기에서 만든 티켓을 B 기기에서는 볼 수 없습니다. (여러 사용자 공유가 필요해지면 백엔드 추가 단계로 진행)
- 헤더의 **"데모 초기화"** 버튼으로 저장된 내용을 지우고 처음부터 다시 볼 수 있습니다.

---

## 방법 A. Vercel 드래그 앤 드롭 (가장 쉬움, 계정만 있으면 3분)

1. https://vercel.com 접속 → **Sign Up** → "Continue with GitHub" (또는 Email) 로 가입
   - GitHub 계정이 없어도 이메일로 가입 가능
2. 로그인 후 https://vercel.com/new 로 이동
3. 페이지 아래쪽 **"Deploy a folder"** 또는 상단의 업로드 영역에, 이 `web` 폴더를 **통째로 끌어다 놓기**
   (또는 "Browse" 눌러서 `web` 폴더 선택)
4. **Deploy** 클릭 → 30초~1분 대기
5. 완료되면 `https://xxxx.vercel.app` 주소가 나옵니다. 이 주소를 공유하면 누구나 접속 가능

### 수정 사항을 다시 반영하려면
- 같은 방법으로 폴더를 다시 올리면 같은 프로젝트에 새 버전이 배포됩니다.
- 또는 아래 "방법 B"처럼 GitHub에 연결해두면, 파일을 저장하는 순간 자동 반영됩니다.

---

## 방법 B. GitHub 연결 (자동 배포, 조금 더 세팅)

1. https://github.com 가입 → 새 저장소(Repository) 생성 (예: `short-manual`, Public 또는 Private)
2. 이 폴더의 `index.html` 을 저장소에 업로드
   (GitHub 웹페이지에서 "Add file → Upload files" 로 드래그해도 됩니다)
3. https://vercel.com/new → "Import Git Repository" → 방금 만든 저장소 선택 → **Deploy**
4. 이후 GitHub 저장소의 파일을 수정할 때마다 Vercel이 자동으로 새로 배포합니다.

---

## 나만의 도메인 붙이기 (선택)

1. 가비아/후이즈/Cloudflare 등에서 도메인 구매 (예: `short-manual.kr`, 연 1~2만원)
2. Vercel 프로젝트 → **Settings → Domains** → 도메인 입력
3. 안내되는 DNS 레코드(CNAME/A)를 도메인 업체 관리 페이지에 입력
4. 몇 분~몇 시간 뒤 `https://short-manual.kr` 로 접속 가능 (HTTPS 자동 적용)

---

## 다음 단계 (실서비스로 확장할 때)

| 필요 기능 | 추가할 것 |
|---|---|
| 로그인 / 회원 | Supabase Auth |
| 티켓·장비 정보를 서버에 저장하고 제조사와 공유 | Supabase Database |
| 계기판 사진 실제 OCR | Google Cloud Vision 또는 Claude 비전 API |
| PDF 업로드 후 실제 검색 기반 답변 | Supabase Storage + 벡터 검색(pgvector) + LLM |
| 문자/이메일 알림 | 알리고(국내), Twilio, Resend 등 |

이 단계부터는 프로토타입을 프레임워크(예: Next.js)로 재구성하는 작업이 필요합니다.
