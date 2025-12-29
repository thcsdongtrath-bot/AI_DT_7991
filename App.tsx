
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Settings, 
  Download, 
  Loader2, 
  CheckCircle2, 
  School,
  BookOpen,
  LayoutGrid,
  AlertCircle,
  Key,
  RefreshCw
} from 'lucide-react';
import { ExamConfig, ExamResult, Subject, Grade, Duration, Scale, ScopeType } from './types';
import { generateExamContent } from './services/geminiService';
import { downloadAsFile } from './services/wordService';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const App: React.FC = () => {
  const [config, setConfig] = useState<ExamConfig>({
    subject: Subject.TOAN,
    grade: Grade.G6,
    school: 'TRƯỜNG THCS ĐÔNG TRÀ',
    duration: Duration.M45,
    scale: Scale.S10,
    scopeType: ScopeType.HK1,
    specificTopic: ''
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [activeTab, setActiveTab] = useState<'matrix' | 'spec' | 'exam' | 'answer'>('matrix');
  const [needsKey, setNeedsKey] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        try {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setNeedsKey(!hasKey);
        } catch (e) {
          console.error("Key check failed", e);
        }
      }
    };
    checkKey();
  }, []);

  const handleOpenKeyDialog = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setNeedsKey(false);
      setErrorInfo(null);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    setErrorInfo(null);
    try {
      const data = await generateExamContent(config);
      setResult(data);
    } catch (error: any) {
      if (error.message === "AUTH_REQUIRED") {
        setNeedsKey(true);
      } else {
        setErrorInfo(error.message || "Quá trình soạn thảo gặp lỗi. Vui lòng thử lại!");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (type: keyof ExamResult, name: string) => {
    if (!result) return;
    downloadAsFile(result[type], `${name}.doc`);
  };

  const isHtmlString = (str: string) => str.trim().startsWith('<table') || str.trim().startsWith('<div');

  const renderContent = (content: string) => {
    if (isHtmlString(content)) {
      return (
        <div className="overflow-x-auto border-2 border-slate-200 rounded-2xl bg-white p-1">
          <div 
            className="min-w-[1400px] text-[8.5pt] table-standard times-new-roman"
            dangerouslySetInnerHTML={{ __html: content }} 
          />
        </div>
      );
    }

    const cleanContent = content.replace(/[\*\#]+/g, '');
    
    return (
      <div className="times-new-roman text-[13pt] text-justify space-y-4 px-8 leading-relaxed">
        {cleanContent.split('\n')
          .filter(line => {
            const upperLine = line.toUpperCase();
            return !upperLine.includes('UBND HUYỆN') && !upperLine.includes('PHÒNG GIÁO DỤC');
          })
          .map((line, i) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={i} className="h-4"></div>;
            const isHeader = trimmed === trimmed.toUpperCase() && trimmed.length > 5;
            return (
              <p key={i} className={`${isHeader ? 'font-bold text-center uppercase pt-6 pb-2' : ''}`}>
                {trimmed}
              </p>
            );
          })}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] font-sans">
      <style>{`
        .table-standard table { width: 100%; border-collapse: collapse; border: 1.5px solid black; table-layout: fixed; }
        .table-standard th, .table-standard td { border: 1px solid black; padding: 4px 2px; text-align: center; vertical-align: middle; line-height: 1.1; overflow: hidden; }
        .table-standard th { background-color: #f1f5f9; font-weight: bold; font-size: 8pt; }
        .table-standard tr:nth-child(even) td { background-color: #fcfcfc; }
        .times-new-roman { font-family: 'Times New Roman', Times, serif !important; }
        @media print { .no-print { display: none; } }
      `}</style>

      <header className="bg-gradient-to-r from-[#001f3f] to-[#003366] text-white shadow-2xl py-6 px-10 no-print">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-6">
            <div className="p-4 bg-white/10 backdrop-blur-lg rounded-[2rem] border border-white/20 shadow-inner">
              <School className="w-12 h-12 text-blue-200" />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight leading-none">Trường THCS Đông Trà</h1>
              <div className="flex items-center space-x-3 mt-2">
                <span className="px-3 py-1 bg-blue-500/30 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-100 border border-blue-400/30">
                  Mẫu 4 tầng Header 7991
                </span>
                <span className="text-blue-300/80 text-[10px] font-bold uppercase tracking-widest">Hệ thống khảo thí AI</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {needsKey && (
               <button 
                onClick={handleOpenKeyDialog}
                className="bg-[#f59e0b] hover:bg-[#d97706] text-white px-6 py-3 rounded-2xl text-xs font-black flex items-center space-x-2 animate-pulse shadow-xl"
               >
                 <Key className="w-4 h-4" />
                 <span>KÍCH HOẠT API</span>
               </button>
            )}
            <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10 flex items-center space-x-4 text-[10px] font-bold uppercase">
              <div className="w-2.5 h-2.5 bg-green-400 rounded-full shadow-[0_0_12px_rgba(74,222,128,0.6)] animate-pulse"></div>
              <span className="text-slate-300">Máy chủ ổn định</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1700px] mx-auto w-full p-4 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <aside className="lg:col-span-3 space-y-8 no-print">
          <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-200 p-10 space-y-8 sticky top-10">
            <div className="flex items-center space-x-4 text-slate-900 border-b border-slate-100 pb-6">
              <Settings className="w-7 h-7 text-blue-700" />
              <h2 className="font-black text-xl uppercase tracking-tighter">Cấu hình hồ sơ</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Môn học khảo thí</label>
                <select 
                  className="w-full rounded-2xl border-slate-200 bg-slate-50 py-4.5 px-6 font-bold text-slate-800 focus:ring-4 focus:ring-blue-100 transition-all cursor-pointer shadow-sm"
                  value={config.subject}
                  onChange={(e) => setConfig(prev => ({...prev, subject: e.target.value}))}
                >
                  {Object.values(Subject).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Khối lớp</label>
                  <select 
                    className="w-full rounded-2xl border-slate-200 bg-slate-50 py-4.5 px-6 font-bold text-slate-800"
                    value={config.grade}
                    onChange={(e) => setConfig(prev => ({...prev, grade: e.target.value}))}
                  >
                    {Object.values(Grade).map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thang điểm</label>
                  <select 
                    className="w-full rounded-2xl border-slate-200 bg-slate-50 py-4.5 px-6 font-bold text-slate-800"
                    value={config.scale}
                    onChange={(e) => setConfig(prev => ({...prev, scale: e.target.value}))}
                  >
                    {Object.values(Scale).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thời gian thi</label>
                <select 
                  className="w-full rounded-2xl border-slate-200 bg-slate-50 py-4.5 px-6 font-bold text-slate-800"
                  value={config.duration}
                  onChange={(e) => setConfig(prev => ({...prev, duration: e.target.value}))}
                >
                  {Object.values(Duration).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phạm vi chuyên môn</label>
                <select 
                  className="w-full rounded-2xl border-slate-200 bg-slate-50 py-4.5 px-6 font-bold text-slate-800 mb-4 shadow-sm"
                  value={config.scopeType}
                  onChange={(e) => setConfig(prev => ({...prev, scopeType: e.target.value as ScopeType}))}
                >
                  {Object.values(ScopeType).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {config.scopeType === ScopeType.TOPIC && (
                  <input 
                    type="text"
                    placeholder="Tên chương hoặc chủ đề cụ thể..."
                    className="w-full rounded-2xl border-slate-200 focus:ring-4 focus:ring-blue-100 py-4.5 px-6 font-medium bg-white shadow-inner animate-in fade-in slide-in-from-top-2"
                    value={config.specificTopic || ''}
                    onChange={(e) => setConfig(prev => ({...prev, specificTopic: e.target.value}))}
                  />
                )}
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-[#003366] hover:bg-[#002244] text-white font-black py-6 rounded-3xl shadow-2xl shadow-blue-900/20 transition-all flex items-center justify-center space-x-4 disabled:opacity-50 active:scale-[0.96] group"
              >
                {loading ? <Loader2 className="animate-spin w-7 h-7" /> : <RefreshCw className="w-7 h-7 group-hover:rotate-180 transition-transform duration-700" />}
                <span className="text-xl uppercase tracking-tighter">Biên soạn hồ sơ</span>
              </button>
            </div>

            {errorInfo && (
              <div className="p-5 bg-red-50 border border-red-100 rounded-3xl flex items-start space-x-4 animate-bounce">
                <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
                <p className="text-[11px] text-red-900 font-bold leading-tight italic">{errorInfo}</p>
              </div>
            )}
          </div>
        </aside>

        <section className="lg:col-span-9 flex flex-col min-h-[900px]">
          {needsKey && !result && !loading && (
             <div className="flex-1 bg-white rounded-[4rem] border-2 border-amber-200 bg-amber-50/10 flex flex-col items-center justify-center p-20 text-center no-print shadow-inner">
               <div className="w-24 h-24 bg-amber-100 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-lg">
                 <Key className="w-12 h-12 text-amber-600 animate-pulse" />
               </div>
               <h3 className="text-3xl font-black text-slate-900 mb-4 uppercase">Kích hoạt quyền truy cập</h3>
               <p className="text-slate-500 mb-10 max-w-md text-lg font-medium leading-relaxed">Hệ thống Gemini 3 Flash yêu cầu API Key chính chủ để đảm bảo chất lượng soạn thảo hồ sơ 7991 cao nhất.</p>
               <button 
                  onClick={handleOpenKeyDialog}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-14 py-5 rounded-[2rem] text-xl font-black shadow-2xl shadow-amber-200 active:scale-95 transition-all"
               >
                 CHỌN API KEY CỦA BẠN
               </button>
             </div>
          )}

          {!result && !loading && !needsKey && (
            <div className="flex-1 bg-white rounded-[4rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center p-20 text-center no-print shadow-inner">
              <div className="w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center mb-10 shadow-2xl border-4 border-white">
                <FileText className="w-16 h-16 text-blue-400" />
              </div>
              <h3 className="text-4xl font-black text-slate-900 mb-6 uppercase tracking-tighter">Trung tâm khảo thí AI</h3>
              <p className="text-slate-400 max-w-xl text-xl leading-relaxed font-semibold">Tự động hóa xây dựng Ma trận, Đặc tả, Đề thi và Đáp án chuẩn 100% Công văn 7991 cho giáo viên Đông Trà.</p>
            </div>
          )}

          {loading && (
            <div className="flex-1 bg-white rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center p-20 text-center no-print">
              <div className="relative mb-12">
                <div className="w-40 h-40 border-[16px] border-slate-50 border-t-blue-800 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <BookOpen className="w-14 h-14 text-blue-800 animate-pulse" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-wider">Đang khởi tạo ma trận 4 tầng</h3>
              <p className="text-blue-700/60 text-xl font-black animate-pulse italic">AI đang tính toán tỉ lệ điểm và biên soạn đề...</p>
            </div>
          )}

          {result && !loading && (
            <div className="flex-1 flex flex-col bg-white rounded-[4rem] shadow-2xl border border-slate-200 overflow-hidden">
              <nav className="flex bg-[#fcfdfe] border-b p-5 no-print gap-3 overflow-x-auto">
                {[
                  { id: 'matrix', label: 'Ma trận (4 tầng)', icon: LayoutGrid },
                  { id: 'spec', label: 'Bảng đặc tả', icon: FileText },
                  { id: 'exam', label: 'Đề kiểm tra', icon: BookOpen },
                  { id: 'answer', label: 'Đáp án & HD', icon: CheckCircle2 },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center space-x-3 py-5 px-8 min-w-[200px] rounded-3xl text-sm font-black uppercase tracking-tighter transition-all ${
                      activeTab === tab.id 
                      ? 'bg-blue-800 text-white shadow-[0_20px_40px_-10px_rgba(30,58,138,0.5)] translate-y-[-4px]' 
                      : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>

              <div className="p-8 bg-white border-b flex items-center justify-between no-print">
                <div className="flex items-center space-x-5">
                  <div className="h-10 w-1.5 bg-blue-800 rounded-full"></div>
                  <span className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Hồ sơ chính thức (Preview)</span>
                </div>
                <button
                  onClick={() => {
                    const titles = { matrix: 'MA_TRAN_7991_4TANG', spec: 'DAC_TA_7991', exam: 'DE_KIEM_TRA', answer: 'DAP_AN' };
                    handleDownload(activeTab === 'spec' ? 'specTable' : activeTab === 'exam' ? 'examPaper' : activeTab === 'answer' ? 'answerKey' : 'matrix', titles[activeTab]);
                  }}
                  className="flex items-center space-x-4 bg-[#10b981] hover:bg-[#059669] text-white text-md font-black py-4 px-10 rounded-3xl shadow-2xl hover:shadow-emerald-200 transition-all active:scale-95 group"
                >
                  <Download className="w-6 h-6 group-hover:translate-y-1 transition-transform" />
                  <span>XUẤT WORD CHUẨN</span>
                </button>
              </div>

              <div className="flex-1 overflow-auto p-6 sm:p-14 bg-slate-50 scroll-smooth">
                <div className={`mx-auto bg-white shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] p-12 sm:p-20 min-h-full w-full ${activeTab === 'matrix' || activeTab === 'spec' ? 'max-w-[1500px]' : 'max-w-[900px]'} times-new-roman border-t-[12px] border-blue-900 rounded-b-[3rem]`}>
                  {renderContent(activeTab === 'matrix' ? result.matrix : activeTab === 'spec' ? result.specTable : activeTab === 'exam' ? result.examPaper : result.answerKey)}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="bg-white border-t py-14 text-center no-print">
        <div className="flex flex-col items-center space-y-4 opacity-30">
          <School className="w-8 h-8 text-slate-900" />
          <p className="text-[12px] font-black uppercase tracking-[0.5em] text-slate-800">Hội đồng Sư phạm Trường THCS Đông Trà</p>
          <p className="text-[10px] font-bold italic tracking-widest text-blue-900">Giải pháp trợ lý AI 2025 - Phiên bản Cao cấp</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
