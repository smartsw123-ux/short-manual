import { GoogleGenAI } from '@google/genai';

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export function aiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY 환경변수가 없습니다. Vercel 프로젝트 설정에 추가하세요.');
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

// ── 매뉴얼 텍스트에서 질문/에러코드와 관련된 부분만 추려 컨텍스트 축소 (RAG) ──
export function buildContext(manuals, { errorCode, question }, budgetChars = 24000) {
  const needle = `${errorCode || ''} ${question || ''}`
    .toLowerCase()
    .split(/[^a-z0-9가-힣.\-]+/)
    .filter((w) => w.length >= 2);

  const scored = [];
  for (const m of manuals) {
    const blocks = String(m.extracted_text || '').split(/\n(?====== \[P\.\d+\])/);
    for (const block of blocks) {
      const lc = block.toLowerCase();
      let score = 0;
      for (const w of needle) {
        if (!w) continue;
        const hits = lc.split(w).length - 1;
        score += hits * (w.length >= 4 ? 3 : 1);
      }
      if (errorCode && lc.includes(errorCode.toLowerCase())) score += 40;
      if (score > 0) scored.push({ file: m.file_name, block: block.trim(), score });
    }
  }
  scored.sort((a, b) => b.score - a.score);

  let out = '';
  const used = [];
  for (const s of scored) {
    if (out.length + s.block.length > budgetChars) continue;
    out += `\n\n--- 출처: ${s.file} ---\n${s.block}`;
    used.push(s.file);
    if (out.length > budgetChars * 0.9) break;
  }

  if (!out) {
    for (const m of manuals) {
      const head = String(m.extracted_text || '').slice(
        0,
        Math.floor(budgetChars / Math.max(1, manuals.length))
      );
      if (head) {
        out += `\n\n--- 출처: ${m.file_name} (발췌) ---\n${head}`;
        used.push(m.file_name);
      }
    }
  }
  return { context: out.trim(), sources: [...new Set(used)] };
}

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    summary: { type: 'STRING', description: '2~3문장 핵심 요약' },
    checklist: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          item: { type: 'STRING' },
          standard: { type: 'STRING' },
          action: { type: 'STRING' },
        },
        required: ['item', 'standard', 'action'],
      },
    },
    parts: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          part_no: { type: 'STRING', description: '매뉴얼에 없으면 "확인 필요"' },
          qty: { type: 'STRING' },
        },
        required: ['name', 'part_no', 'qty'],
      },
    },
    manual_ref: {
      type: 'OBJECT',
      properties: {
        file: { type: 'STRING' },
        page: { type: 'STRING' },
        section: { type: 'STRING' },
      },
    },
    safety_note: { type: 'STRING' },
    confidence: { type: 'NUMBER', description: '0~1' },
    grounded: { type: 'BOOLEAN', description: '업로드된 매뉴얼에 실제 근거가 있으면 true' },
  },
  required: ['summary', 'checklist', 'parts', 'confidence', 'grounded'],
};

const SYSTEM = `당신은 건설기계 제조사의 숙련 서비스 엔지니어입니다.
현장 운전원이 계기판 경고나 고장 증상을 물으면, 제공된 "장비 스펙"과 "매뉴얼 발췌"에 근거해
현장에서 바로 실행 가능한 정비 가이드를 한국어로 제공합니다.

규칙:
- 반드시 지정된 JSON 스키마 형식으로만 답합니다.
- 매뉴얼 발췌에 근거가 있으면 grounded=true, 파츠 번호/페이지를 그대로 인용합니다.
- 매뉴얼에 근거가 없으면 grounded=false, confidence 를 0.5 이하로 낮추고 일반적 점검 절차를 안내합니다.
- 추측으로 파츠 번호를 지어내지 않습니다. 모르면 "확인 필요".
- 안전이 걸린 경우 safety_note 에 명확히 적습니다.`;

export async function generateAnswer({ equipment, errorCode, question, context, sources }) {
  const ai = getClient();

  const prompt = `[장비 스펙]
- 종류: ${equipment.eq_type}
- 제조사/모델: ${equipment.maker} ${equipment.model}
- 차대번호(Chassis No.): ${equipment.chassis_no}
- 엔진: ${equipment.engine_maker || '-'} ${equipment.engine_model || ''}

[운전원 질문]
${question}
${errorCode ? `\n[계기판 에러 코드] ${errorCode}` : ''}

[연동된 매뉴얼 발췌]${
    context
      ? `\n${context}`
      : '\n(업로드된 매뉴얼이 없습니다. 일반 지식으로 답하되 grounded=false 로 표시하세요.)'
  }
`;

  const resp = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM,
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
      maxOutputTokens: 2048,
      temperature: 0.3,
    },
  });

  const text = resp.text;
  if (!text) throw new Error('AI 응답이 비었습니다.');

  let answer;
  try {
    answer = JSON.parse(text);
  } catch {
    throw new Error('AI 응답 형식 오류 (JSON 파싱 실패)');
  }

  if (!answer.manual_ref && sources.length) {
    answer.manual_ref = { file: sources[0], page: '', section: '' };
  }
  answer._sources = sources;
  answer._model = MODEL;
  return answer;
}
