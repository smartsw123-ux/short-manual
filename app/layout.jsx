export const metadata = {
  title: '장비 숏뉴얼 (Short-Manual) · AI 매뉴얼 & 자동 A/S 티켓',
  description: '차대번호 기반 AI 매뉴얼 검색 + 자동 A/S 티켓 시스템',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <script src="https://cdn.tailwindcss.com" />
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
        <style>{`
          body{font-family:'Inter','Apple SD Gothic Neo','Malgun Gothic',sans-serif;}
          .mono,code{font-family:'JetBrains Mono',ui-monospace,monospace;}
          ::-webkit-scrollbar{width:8px;height:8px;}
          ::-webkit-scrollbar-track{background:#0f172a;}
          ::-webkit-scrollbar-thumb{background:#334155;border-radius:8px;}
          @keyframes toastIn{from{opacity:0;transform:translateY(12px) scale(.96);}to{opacity:1;transform:none;}}
          .toast-in{animation:toastIn .28s cubic-bezier(.16,1,.3,1) both;}
          @keyframes modalIn{from{opacity:0;transform:translateY(20px) scale(.97);}to{opacity:1;transform:none;}}
          .modal-in{animation:modalIn .3s cubic-bezier(.16,1,.3,1) both;}
          @keyframes scanline{0%{top:0;}100%{top:100%;}}
          .scanline{animation:scanline 1.6s linear infinite;}
          .blueprint{background-color:#0a1120;background-image:linear-gradient(rgba(59,130,246,.14) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,.14) 1px,transparent 1px);background-size:20px 20px;}
        `}</style>
      </head>
      <body className="bg-slate-950 text-slate-100 min-h-screen">{children}</body>
    </html>
  );
}
