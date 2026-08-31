'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/* ═══════════════ helpers ═══════════════ */
const api = async (url, opts) => {
  const r = await fetch(url, opts);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `요청 실패 (${r.status})`);
  return j;
};

function useToasts() {
  const [items, setItems] = useState([]);
  const push = useCallback((msg, type = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setItems((s) => [...s, { id, msg, type }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 4200);
  }, []);
  const node = (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 items-end">
      {items.map((t) => {
        const c =
          t.type === 'success' ? 'border-emerald-500/40 text-emerald-200 bg-emerald-950/90'
          : t.type === 'error' ? 'border-rose-500/40 text-rose-200 bg-rose-950/90'
          : t.type === 'warn' ? 'border-amber-500/40 text-amber-200 bg-amber-950/90'
          : 'border-blue-500/40 text-blue-200 bg-blue-950/90';
        return (
          <div key={t.id} className={`toast-in border rounded-xl px-4 py-3 text-xs shadow-2xl max-w-sm ${c}`}>
            {t.msg}
          </div>
        );
      })}
    </div>
  );
  return { push, node };
}

/* ═══════════════ main ═══════════════ */
export default function Page() {
  const { push, node: toasts } = useToasts();
  const [health, setHealth] = useState(null);
  const [view, setView] = useState('register'); // register | operator | dashboard
  const [equipment, setEquipment] = useState(null);
  const [modal, setModal] = useState(null); // {title, body, actions}

  useEffect(() => {
    api('/api/health').then(setHealth).catch(() => setHealth({ ready: false }));
    try {
      const saved = localStorage.getItem('sm_chassis');
      if (saved) loadEquipment(saved);
    } catch {}
  }, []); // eslint-disable-line

  async function loadEquipment(chassis) {
    try {
      const { equipment: e } = await api(`/api/equipment?chassis=${encodeURIComponent(chassis)}`);
      if (e) {
        setEquipment(e);
        setView('operator');
      }
    } catch {}
  }

  return (
    <div className="p-4 md:p-8">
      <Header
        health={health}
        equipment={equipment}
        view={view}
        setView={setView}
        onReset={() => {
          try { localStorage.removeItem('sm_chassis'); } catch {}
          setEquipment(null);
          setView('register');
        }}
      />

      {health && !health.ready && <SetupBanner health={health} />}

      <main className="max-w-7xl mx-auto">
        {view === 'register' && (
          <Register
            onDone={(e) => {
              setEquipment(e);
              try { localStorage.setItem('sm_chassis', e.chassis_no); } catch {}
              setView('operator');
              push(`장비 등록 완료 · 차대번호 ${e.chassis_no}`, 'success');
            }}
            push={push}
          />
        )}

        {view === 'operator' && equipment && (
          <Operator equipment={equipment} push={push} setModal={setModal} />
        )}

        {view === 'dashboard' && <Dashboard equipment={equipment} push={push} setModal={setModal} />}
      </main>

      {toasts}
      {modal && <Modal {...modal} onClose={() => setModal(null)} />}
    </div>
  );
}

/* ═══════════════ Header ═══════════════ */
function Header({ health, equipment, view, setView, onReset }) {
  return (
    <header className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
      <div className="flex items-center gap-3 min-w-0">
        <span className="shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white w-11 h-11 flex items-center justify-center rounded-xl text-lg shadow-lg shadow-blue-900/40">
          <i className="fas fa-helmet-safety" />
        </span>
        <div className="min-w-0">
          <h1 className="text-lg md:text-xl lg:text-2xl font-extrabold tracking-tight text-white leading-snug">
            장비 숏뉴얼 <span className="text-blue-400">Short-Manual</span>
          </h1>
          <p className="text-slate-400 text-[11px] mt-0.5">
            차대번호 기반 AI 매뉴얼 검색 · 실제 PDF 업로드 · 자동 A/S 티켓 (서버 DB 연동)
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        {health && (
          <span
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
              health.ready
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}
          >
            <i className={`fas fa-circle text-[7px] ${health.ready ? 'animate-pulse' : ''}`} />
            {health.ready ? '시스템 연결됨' : '설정 필요'}
          </span>
        )}
        {equipment && (
          <span className="px-3 py-1.5 bg-blue-500/10 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-semibold hidden sm:flex items-center gap-2">
            <i className="fas fa-id-badge" /> {equipment.model}{' '}
            <span className="mono text-blue-400">{equipment.chassis_no}</span>
          </span>
        )}
        <button
          onClick={() => setView(view === 'dashboard' ? 'operator' : 'dashboard')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg flex items-center gap-2"
        >
          <i className="fas fa-exchange-alt" />
          {view === 'dashboard' ? '운전원 화면' : '제조사 대시보드'}
        </button>
        {equipment && (
          <button
            onClick={onReset}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold rounded-xl border border-slate-700"
          >
            <i className="fas fa-rotate-left" /> 장비 변경
          </button>
        )}
      </div>
    </header>
  );
}

/* ═══════════════ Setup banner ═══════════════ */
function SetupBanner({ health }) {
  return (
    <div className="max-w-7xl mx-auto mb-6 bg-amber-950/40 border border-amber-500/30 rounded-2xl p-5 text-xs text-amber-100 space-y-2">
      <p className="font-bold text-sm flex items-center gap-2">
        <i className="fas fa-triangle-exclamation" /> 초기 설정이 필요합니다
      </p>
      <ul className="space-y-1 text-amber-200/90 list-disc list-inside">
        <li>Supabase 환경변수: {health.supabase_env ? '✅' : '❌ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 를 Vercel 에 추가'}</li>
        <li>Anthropic 키: {health.anthropic_env ? '✅' : '❌ ANTHROPIC_API_KEY 를 Vercel 에 추가'}</li>
        <li>
          DB 스키마: {health.schema_ok ? '✅' : `❌ supabase/schema.sql 을 Supabase SQL Editor 에서 실행${health.schema_error ? ` (${health.schema_error})` : ''}`}
        </li>
      </ul>
      <p className="text-amber-200/70">환경변수 추가 후에는 Vercel 에서 재배포(Redeploy)해야 반영됩니다.</p>
    </div>
  );
}

/* ═══════════════ STEP 0 · Register ═══════════════ */
function Register({ onDone, push }) {
  const [f, setF] = useState({
    eq_type: '유압식 굴착기',
    maker: 'HB건설기계',
    model: 'HB30-II',
    chassis_no: 'HB-CH-2026-9921',
    engine_maker: 'Cummins',
    engine_model: 'QSB4.5',
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const { equipment } = await api('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(f),
      });
      onDone(equipment);
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  const field = (label, k, opts) => (
    <div>
      <label className="block text-slate-300 font-semibold mb-1">{label}</label>
      {opts ? (
        <select value={f[k]} onChange={set(k)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500">
          {opts.map((o) => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input value={f[k]} onChange={set(k)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500" />
      )}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl my-4 md:my-8">
      <div className="text-center mb-6">
        <span className="bg-blue-600/20 text-blue-300 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/30">
          STEP 0 · 장비 마스터 데이터 등록
        </span>
        <h2 className="text-xl md:text-2xl font-bold text-white mt-3">차대번호(Chassis No.) 기반 매칭</h2>
        <p className="text-slate-400 text-xs mt-1.5">
          입력한 차대번호가 시스템 핵심 키입니다. 이후 매뉴얼·질문·티켓이 모두 이 번호에 귀속됩니다.
        </p>
      </div>
      <form onSubmit={submit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('장비 종류 *', 'eq_type', ['유압식 굴착기', '휠로더', '산업용 공기압축기', '지게차', '스키드 스티어 로더'])}
          {field('제조사 (고객사) *', 'maker')}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('장비 모델명 *', 'model')}
          {field('차대번호 (Chassis No.) *', 'chassis_no')}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('엔진 제조사', 'engine_maker')}
          {field('엔진 모델명', 'engine_model')}
        </div>
        <button disabled={busy} className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg text-sm mt-2 flex items-center justify-center gap-2">
          {busy ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-link" />}
          장비 등록 및 매칭 시작
        </button>
      </form>
    </div>
  );
}

/* ═══════════════ VIEW 1 · Operator ═══════════════ */
function Operator({ equipment, push, setModal }) {
  const [errorCode, setErrorCode] = useState('');
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [result, setResult] = useState(null); // {query_id, answer, manual_count, sources}
  const [feedback, setFeedback] = useState(null); // 'yes' | 'no'
  const [ocr, setOcr] = useState(false);

  async function ask(e) {
    e?.preventDefault();
    if (!question.trim()) return push('증상이나 질문을 입력하세요.', 'warn');
    setAsking(true);
    setResult(null);
    setFeedback(null);
    try {
      const j = await api('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chassis_no: equipment.chassis_no, error_code: errorCode, question }),
      });
      setResult(j);
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setAsking(false);
    }
  }

  function simulateOCR() {
    setOcr(true);
    setTimeout(() => {
      setErrorCode('ERR-402');
      setQuestion((q) => q || '계기판에 ERR-402 경고등이 떴습니다. 조치 방법과 필요한 부품을 알려주세요.');
      setOcr(false);
      push('OCR 인식(데모) · ERR-402 자동 입력', 'success');
    }, 1600);
  }

  async function sendFeedback(kind) {
    if (feedback) return;
    if (kind === 'yes') {
      try {
        await api('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query_id: result.query_id, resolved: true }),
        });
        setFeedback('yes');
        push('👍 해결 완료 · AI 방어율에 반영', 'success');
      } catch (err) {
        push(err.message, 'error');
      }
      return;
    }
    // 👎 → 시도한 조치 입력 후 티켓 생성
    let attempted = (result.answer?.checklist || []).map((c) => c.action).join(' · ');
    setModal({
      title: 'A/S 긴급 정비 요청서 생성',
      body: (
        <div className="space-y-3">
          <p className="text-slate-400">아래 내용으로 제조사 대시보드에 티켓이 접수됩니다.</p>
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-[11px] mono space-y-1">
            <div>모델: <span className="text-white">{equipment.model}</span></div>
            <div>차대번호: <span className="text-blue-300">{equipment.chassis_no}</span></div>
            <div>에러: <span className="text-amber-400">{errorCode || '-'}</span></div>
          </div>
          <label className="block text-slate-300 text-xs">현장에서 시도한 조치</label>
          <textarea
            id="sm-attempted"
            defaultValue={attempted}
            rows={3}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
          />
        </div>
      ),
      actions: [
        { label: '취소', kind: 'ghost' },
        {
          label: '제조사로 접수',
          kind: 'primary',
          onClick: async () => {
            const val = document.getElementById('sm-attempted')?.value || attempted;
            try {
              const { ticket } = await api('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query_id: result.query_id, resolved: false, attempted: val }),
              });
              setFeedback('no');
              push(`👎 해결 불가 · 티켓 ${ticket.ticket_no} 접수됨`, 'error');
            } catch (err) {
              push(err.message, 'error');
            }
          },
        },
      ],
    });
  }

  const a = result?.answer;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT: phone */}
      <section className="lg:col-span-6 flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-2 px-2">
          <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <i className="fas fa-mobile-screen-button text-blue-400" /> VIEW 1 · 현장 운전원
          </h2>
          <span className="text-[11px] text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-500/30">
            매뉴얼 {result ? result.manual_count : '–'}권 연동
          </span>
        </div>

        <div className="w-full max-w-md bg-slate-950 border-[10px] border-slate-800 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col min-h-[720px]">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 pt-6 pb-3 flex items-center justify-between">
            <span className="font-bold text-sm">{equipment.model} AI 어시스턴트</span>
            <button onClick={simulateOCR} className="bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-lg text-xs border border-white/25 flex items-center gap-1.5">
              <i className="fas fa-camera" /> OCR 스캔 (데모)
            </button>
          </div>

          <div className="flex-1 bg-slate-900 p-4 overflow-y-auto flex flex-col gap-3 text-xs">
            <div className="text-center text-[10px] text-slate-500">
              세션 연결됨 · 시리얼 <span className="mono text-slate-400">{equipment.chassis_no}</span>
            </div>

            {ocr && (
              <div className="rounded-xl overflow-hidden border border-blue-500/40 relative bg-slate-950 h-32 flex items-center justify-center">
                <div className="absolute left-4 right-4 h-0.5 bg-blue-400/80 shadow-[0_0_12px_2px_rgba(96,165,250,.8)] scanline" />
                <p className="text-[10px] text-blue-200 mono z-10">계기판 판독 중…</p>
              </div>
            )}

            {/* input form */}
            <form onSubmit={ask} className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 space-y-2">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">계기판 에러 코드 (선택)</label>
                <input
                  value={errorCode}
                  onChange={(e) => setErrorCode(e.target.value)}
                  placeholder="예: ERR-402, SPN-1234, P0341 …"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white mono text-[11px] focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">증상 / 질문 *</label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={3}
                  placeholder="예: 작업 중 붐 상승이 느려지고 유압유 온도 경고가 뜹니다. 어떻게 점검하나요?"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-[11px] focus:outline-none focus:border-blue-500"
                />
              </div>
              <button disabled={asking} className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg font-bold flex items-center justify-center gap-2">
                {asking ? <><i className="fas fa-spinner fa-spin" /> AI 매뉴얼 분석 중…</> : <><i className="fas fa-wand-magic-sparkles" /> AI 숏뉴얼 질문</>}
              </button>
            </form>

            {a && (
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <i className="fas fa-robot text-[10px]" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">AI 숏뉴얼</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border ${a.grounded ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/15 text-amber-300 border-amber-500/30'}`}>
                    {a.grounded ? '매뉴얼 근거' : '일반 지식'} · 신뢰도 {Math.round((a.confidence || 0) * 100)}%
                  </span>
                </div>
                <div className="bg-slate-800 border border-slate-700 text-slate-200 p-3.5 rounded-2xl rounded-tl-none w-full space-y-3">
                  <p className="text-slate-100 leading-relaxed">{a.summary}</p>

                  {a.checklist?.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-slate-700">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-700/60 text-slate-300">
                          <tr><th className="p-2">점검 항목</th><th className="p-2">정상 기준</th><th className="p-2">조치 사항</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50 text-slate-300">
                          {a.checklist.map((c, i) => (
                            <tr key={i}>
                              <td className="p-2 font-medium text-white">{c.item}</td>
                              <td className="p-2">{c.standard}</td>
                              <td className="p-2 text-amber-300">{c.action}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {a.parts?.length > 0 && (
                    <div className="bg-slate-900/90 border border-emerald-500/30 p-2.5 rounded-xl">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-emerald-400 text-[11px] flex items-center gap-1.5">
                          <i className="fas fa-boxes-stacked" /> 교체 필요 부품
                        </span>
                        <button
                          onClick={() => {
                            const txt = `[부품 발주서]\n장비: ${equipment.model} (${equipment.chassis_no})\n에러: ${errorCode || '-'}\n────\n` +
                              a.parts.map((p, i) => `${i + 1}. ${p.name} | Part No. ${p.part_no} | ${p.qty}`).join('\n');
                            navigator.clipboard?.writeText(txt).then(
                              () => push('발주서 클립보드 복사됨', 'success'),
                              () => push('복사 실패', 'error')
                            );
                          }}
                          className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-semibold"
                        >
                          <i className="fas fa-copy" /> 발주서 복사
                        </button>
                      </div>
                      <table className="w-full text-left text-[11px]">
                        <thead className="text-slate-500"><tr><th className="p-1">부품</th><th className="p-1">Part No.</th><th className="p-1 text-right">수량</th></tr></thead>
                        <tbody className="text-slate-300">
                          {a.parts.map((p, i) => (
                            <tr key={i} className="border-t border-slate-800">
                              <td className="p-1">{p.name}</td>
                              <td className="p-1 mono text-emerald-300">{p.part_no}</td>
                              <td className="p-1 text-right text-white font-bold">{p.qty}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {a.safety_note && (
                    <p className="text-[11px] text-amber-200 bg-amber-950/40 border border-amber-500/20 rounded-lg p-2">
                      <i className="fas fa-triangle-exclamation mr-1" /> {a.safety_note}
                    </p>
                  )}
                  {a.manual_ref?.file && (
                    <p className="text-[10px] text-slate-500">
                      근거: <span className="mono text-slate-400">{a.manual_ref.file}</span>
                      {a.manual_ref.page ? ` ${a.manual_ref.page}` : ''} {a.manual_ref.section || ''}
                    </p>
                  )}
                </div>

                {/* feedback */}
                <div className="bg-slate-800/50 border border-slate-800 p-2.5 rounded-xl w-full text-[11px] text-slate-400 mt-1">
                  {!feedback ? (
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span>이 정보가 도움이 되었나요?</span>
                      <div className="flex gap-2">
                        <button onClick={() => sendFeedback('yes')} className="px-2.5 py-1 bg-slate-700 hover:bg-emerald-600/30 hover:text-emerald-400 rounded">
                          <i className="fas fa-thumbs-up" /> 해결 완료
                        </button>
                        <button onClick={() => sendFeedback('no')} className="px-2.5 py-1 bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30 rounded">
                          <i className="fas fa-thumbs-down" /> 해결 불가 (정비 요청)
                        </button>
                      </div>
                    </div>
                  ) : feedback === 'yes' ? (
                    <p className="text-emerald-300"><i className="fas fa-circle-check mr-1" /> 해결 완료로 기록되었습니다.</p>
                  ) : (
                    <p className="text-rose-200"><i className="fas fa-truck-medical mr-1" /> A/S 긴급 정비 요청서가 제조사 대시보드로 접수되었습니다.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* RIGHT: manual match panel */}
      <section className="lg:col-span-6 flex flex-col gap-4">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <i className="far fa-file-pdf text-rose-400" /> VIEW 2 · 매뉴얼 매칭
          </h2>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-xs space-y-3">
          {!result ? (
            <p className="text-slate-500 text-center py-16">
              왼쪽에서 질문하면 AI 가 참조한 매뉴얼 근거가 여기에 표시됩니다.
            </p>
          ) : result.sources?.length ? (
            <>
              <p className="text-slate-400">AI 가 참조한 매뉴얼 (차대번호 {equipment.chassis_no}):</p>
              {result.sources.map((s) => (
                <div key={s} className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <i className="far fa-file-pdf text-rose-400 mr-1" /> <span className="mono text-white">{s}</span>
                </div>
              ))}
              {a?.manual_ref?.section && (
                <div className="bg-slate-950 border border-blue-500/30 rounded-lg p-3 text-blue-200">
                  <p className="font-bold text-white mb-1">{a.manual_ref.section}</p>
                  <p className="text-[11px] text-slate-400">{a.manual_ref.file} {a.manual_ref.page}</p>
                </div>
              )}
            </>
          ) : (
            <p className="text-amber-300 bg-amber-950/30 border border-amber-500/20 rounded-lg p-3">
              이 차대번호에 업로드된 매뉴얼이 없어 일반 지식으로 답했습니다. 제조사 대시보드에서 PDF 를 업로드하면 정확도가 올라갑니다.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

/* ═══════════════ VIEW 3 · Dashboard ═══════════════ */
function Dashboard({ equipment, push, setModal }) {
  const [data, setData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const load = useCallback(() => {
    api('/api/dashboard').then(setData).catch((e) => push(e.message, 'error'));
  }, [push]);
  useEffect(() => { load(); }, [load]);

  async function upload(e) {
    const files = [...(e.target.files || [])];
    if (!files.length) return;
    const chassis = equipment?.chassis_no || data?.equipment?.[0]?.chassis_no;
    if (!chassis) {
      push('먼저 운전원 화면에서 장비를 등록하세요.', 'warn');
      return;
    }
    const fd = new FormData();
    fd.append('chassis_no', chassis);
    files.forEach((f) => fd.append('files', f));
    setUploading(true);
    try {
      const { results } = await api('/api/manuals', { method: 'POST', body: fd });
      const ok = results.filter((r) => r.ok).length;
      const idx = results.filter((r) => r.indexed).length;
      push(`${ok}/${results.length}개 업로드 완료 · ${idx}개 텍스트 색인됨`, ok ? 'success' : 'error');
      load();
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function dispatch(id) {
    try {
      await api(`/api/tickets/${id}/dispatch`, { method: 'POST' });
      push('엔지니어 출동 지시 전달됨', 'success');
      load();
    } catch (err) {
      push(err.message, 'error');
    }
  }

  if (!data) return <div className="text-center text-slate-500 py-20"><i className="fas fa-spinner fa-spin" /> 불러오는 중…</div>;

  const k = data.kpi;
  const bd = data.part_breakdown;
  const bdTotal = Math.max(1, Object.values(bd).reduce((a, b) => a + b, 0));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b border-slate-800 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <i className="fas fa-industry text-blue-400" /> 제조사 B2B 대시보드
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">차대번호 기반 다중 매뉴얼 연동 · 실시간 A/S 티켓</p>
        </div>
        <div>
          <input ref={fileRef} type="file" accept="application/pdf" multiple hidden onChange={upload} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2"
          >
            {uploading ? <><i className="fas fa-spinner fa-spin" /> 업로드·색인 중…</> : <><i className="fas fa-file-arrow-up" /> 매뉴얼 PDF 업로드 (다중)</>}
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Kpi label="누적 현장 질문" value={k.total_questions} unit="건" color="text-blue-400" icon="fa-comments" />
        <Kpi label="AI 자체 해결률 (A/S 방어율)" value={`${k.defense_rate}%`} unit={`(${k.ai_resolved}건)`} color="text-emerald-400" icon="fa-shield-halved" border="border-emerald-500/30" />
        <Kpi label="긴급 A/S 접수 대기" value={k.open_tickets} unit="건" color="text-rose-400" icon="fa-truck-medical" border="border-rose-500/30" />
      </div>

      {/* Tickets */}
      <TicketTable onDispatch={dispatch} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* fault logs */}
        <div className="lg:col-span-7 bg-slate-950 p-5 rounded-xl border border-slate-800">
          <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2 mb-4">
            <i className="fas fa-clipboard-list text-blue-400" /> 누적 고장 에러 로그 (Fault Logs)
          </h3>
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs min-w-[520px]">
              <thead className="bg-slate-900 text-slate-400">
                <tr><th className="p-2.5">모델</th><th className="p-2.5">에러코드</th><th className="p-2.5">차대번호</th><th className="p-2.5 text-center">발생</th><th className="p-2.5 text-center">AI해결</th><th className="p-2.5 text-center">에스컬레이션</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-slate-300">
                {data.fault_logs.length === 0 && (
                  <tr><td colSpan={6} className="p-4 text-center text-slate-500">아직 질문 데이터가 없습니다.</td></tr>
                )}
                {data.fault_logs.map((f, i) => (
                  <tr key={i}>
                    <td className="p-2.5 font-medium text-white">{f.model || '-'}</td>
                    <td className="p-2.5 mono text-amber-400">{f.error_code}</td>
                    <td className="p-2.5 mono text-slate-400">{f.chassis_no}</td>
                    <td className="p-2.5 text-center font-bold">{f.occurrences}</td>
                    <td className="p-2.5 text-center text-emerald-400">{f.ai_resolved}</td>
                    <td className="p-2.5 text-center text-rose-400">{f.escalated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* part breakdown */}
        <div className="lg:col-span-5 bg-slate-950 p-5 rounded-xl border border-slate-800">
          <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2 mb-4">
            <i className="fas fa-chart-simple text-emerald-400" /> 부위별 고장 집중도
          </h3>
          <div className="space-y-3 text-xs">
            {Object.entries(bd).map(([name, val]) => {
              const pct = Math.round((val / bdTotal) * 100);
              const color = name === '유압' ? 'bg-blue-600' : name === '엔진' ? 'bg-amber-500' : name === '전기' ? 'bg-purple-500' : 'bg-slate-500';
              return (
                <div key={name}>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-300">{name} 계통</span>
                    <span className="text-white font-bold">{pct}% ({val})</span>
                  </div>
                  <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800">
                    <div className={`${color} h-full rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* manual library */}
      <div>
        <h3 className="font-bold text-sm text-slate-200 mb-3">
          <i className="fas fa-book text-rose-400 mr-1.5" /> 매뉴얼 라이브러리 (차대번호 매핑)
        </h3>
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs min-w-[640px]">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
              <tr><th className="p-3">차대번호</th><th className="p-3">파일명</th><th className="p-3 text-center">페이지</th><th className="p-3 text-center">색인 문자수</th><th className="p-3">업로드</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {data.manuals.length === 0 && (
                <tr><td colSpan={5} className="p-4 text-center text-slate-500">업로드된 매뉴얼이 없습니다. 위 버튼으로 PDF 를 올리세요.</td></tr>
              )}
              {data.manuals.map((m) => (
                <tr key={m.id} className="hover:bg-slate-900/50">
                  <td className="p-3 mono text-blue-400">{m.chassis_no}</td>
                  <td className="p-3 text-slate-200"><i className="far fa-file-pdf text-rose-400 mr-1" />{m.file_name}</td>
                  <td className="p-3 text-center">{m.page_count ?? '-'}</td>
                  <td className="p-3 text-center">
                    {m.char_count > 0
                      ? <span className="text-emerald-400">{m.char_count.toLocaleString()}</span>
                      : <span className="text-amber-400" title="스캔 PDF 등 텍스트 추출 불가">0 (미색인)</span>}
                  </td>
                  <td className="p-3 text-slate-500">{new Date(m.created_at).toLocaleString('ko-KR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, unit, color, icon, border = 'border-slate-800' }) {
  return (
    <div className={`bg-slate-950 p-4 rounded-xl border ${border}`}>
      <p className="text-xs text-slate-400 font-medium mb-1"><i className={`fas ${icon} mr-1 ${color}`} /> {label}</p>
      <p className={`text-3xl font-extrabold ${color}`}>{value} <span className="text-xs font-normal text-slate-400">{unit}</span></p>
    </div>
  );
}

function TicketTable({ onDispatch }) {
  const [tickets, setTickets] = useState(null);
  useEffect(() => {
    const load = () => api('/api/tickets').then((j) => setTickets(j.tickets)).catch(() => setTickets([]));
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-slate-950 p-5 rounded-xl border border-rose-500/30">
      <h3 className="font-bold text-sm text-rose-400 flex items-center gap-2 mb-4">
        <i className="fas fa-triangle-exclamation" /> A/S 긴급 정비 요청서 (Trouble Tickets)
        <span className="text-[10px] text-slate-500 font-normal">· 8초마다 자동 새로고침</span>
      </h3>
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-xs min-w-[720px]">
          <thead className="bg-slate-900 text-slate-400">
            <tr><th className="p-2.5">티켓</th><th className="p-2.5">모델</th><th className="p-2.5">차대번호</th><th className="p-2.5">에러</th><th className="p-2.5">시도한 조치</th><th className="p-2.5">접수</th><th className="p-2.5 text-right">상태</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-900 text-slate-300">
            {tickets === null && <tr><td colSpan={7} className="p-4 text-center text-slate-500">불러오는 중…</td></tr>}
            {tickets?.length === 0 && <tr><td colSpan={7} className="p-4 text-center text-slate-500">대기 중인 긴급 요청이 없습니다.</td></tr>}
            {tickets?.map((t) => (
              <tr key={t.id}>
                <td className="p-2.5 mono text-slate-400">{t.ticket_no}</td>
                <td className="p-2.5 font-medium text-white">{t.model || '-'}</td>
                <td className="p-2.5 mono">{t.chassis_no}</td>
                <td className="p-2.5 mono text-amber-400">{t.error_code || '-'}</td>
                <td className="p-2.5 text-slate-400 max-w-[220px] truncate" title={t.attempted}>{t.attempted || '-'}</td>
                <td className="p-2.5 text-slate-500">{new Date(t.created_at).toLocaleString('ko-KR')}</td>
                <td className="p-2.5 text-right">
                  {t.status === 'open' ? (
                    <button onClick={() => onDispatch(t.id)} className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold text-[10px]">
                      엔지니어 출동 지시
                    </button>
                  ) : (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold">
                      <i className="fas fa-check mr-1" />출동 지시됨
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════ Modal ═══════════════ */
function Modal({ title, body, actions, onClose }) {
  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="modal-in bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h3 className="font-bold text-white text-sm">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><i className="fas fa-xmark" /></button>
        </div>
        <div className="p-5 text-xs text-slate-300">{body}</div>
        <div className="px-5 py-4 border-t border-slate-800 flex justify-end gap-2">
          {(actions || [{ label: '닫기', kind: 'primary' }]).map((act, i) => (
            <button
              key={i}
              onClick={async () => { if (act.onClick) await act.onClick(); onClose(); }}
              className={
                act.kind === 'primary'
                  ? 'px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold'
                  : 'px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold'
              }
            >
              {act.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
