
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
  RefreshCw,
  Calendar
} from 'lucide-react';
import { ExamConfig, ExamResult, Subject, Grade, Duration, Scale, ScopeType, SchoolYear } from './types';
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
    schoolYear: SchoolYear.Y24_25,
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
      } else if (!process.env.API_KEY) {
        setNeedsKey(true);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeyDialog = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setNeedsKey(false);
      setErrorInfo(null);
    } else {
      window.open('https://ai.google.dev/gemini-api/docs/billing', '_blank');
      alert("Hệ thống yêu cầu API Key để hoạt động. Vui lòng thiết lập API_KEY.");
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    setErrorInfo(null);
    try {
      const data = await generateExamContent(config);
      setResult(data);
      // Khi có kết quả, tự động chuyển về tab Ma trận
      setActiveTab('matrix');
    } catch (error: any) {
      if (error.message === "AUTH_REQUIRED") {
        setNeedsKey(true);
      } else {
        setErrorInfo(error.message || "Lỗi biên soạn. Vui lòng thử lại!");
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
        <div className="overflow-x-auto border-2 border-slate-200 rounded-3xl bg-white p-2">
          <div 
            className="min-w-[1500px] text-[8.5pt] table-standard times-new-roman"
            dangerouslySetInnerHTML={{ __html: content }} 
          />
        </div>
      );
    }

    const cleanContent = content.replace(/[\*\#]+/g, '');
    
    return (
      <div className="times-new-roman text-[13pt] text-justify space-y-5 px-10 leading-relaxed">
        {cleanContent.split('\n')
          .filter(line => {
            const upperLine = line.toUpperCase();
            return !upperLine.includes('UBND HUYỆN') && !upperLine.includes('PHÒNG GIÁO DỤC');
          })
          .map((line, i) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={i} className="h-4"></div>;
            
            // Nhận diện tiêu đề lớn (ví dụ: PHẦN I, ĐÁP ÁN, HƯỚNG DẪN CHẤM)
            const isMainTitle = (trimmed.startsWith('PHẦN') || trimmed.startsWith('PHẦN') || trimmed.includes('ĐÁP ÁN') || trimmed.includes('CHẤM')) && trimmed === trimmed.toUpperCase();
            const isStandardHeader = trimmed === trimmed.toUpperCase() && trimmed.length > 5;
            
            return (
              <p key={i} className={`${isMainTitle ? 'font-bold text-center text-xl uppercase pt-10 pb-4 text-blue-900 border-b-2 border-blue-100' : isStandardHeader ? 'font-bold text-center uppercase pt-8 pb-2' : ''}`}>
                {trimmed}
              </p>
            );
          })}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7f9] font-sans">
      <style>{`
        .table-standard table { width: 100%; border-collapse: collapse; border: 1.5px solid black; table-layout: fixed; margin: 15px 0; }
        .table-standard th, .table-standard td { border: 1px solid black; padding: 6px 3px; text-align: center; vertical-align: middle; line-height: 1.3; font-size: 8.5pt; }
        .table-standard th { background-color: #f8fafc; font-weight: bold; }
        .times-new-roman { font-family: 'Times New Roman', Times, serif !important; }
        @media print { .no-print { display: none; } }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      <header className="bg-gradient-to-r from-[#002147] to-[#004080] text-white shadow-2xl py-8 px-12 no-print border-b-4 border-yellow-500 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center space-x-8">
            <div className="p-4 bg-white/15 backdrop-blur-md rounded-[2.5rem] border border-white/20 shadow-2xl">
              <School className="w-12 h-12 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter leading-none mb-1">Trường THCS Đông Trà</h1>
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 bg-yellow-500 text-blue-950 rounded-lg text-[10px] font-black uppercase tracking-widest">
                  CV 7991 - Chuẩn 2018
                </span>
                <span className="text-blue-200 text-[11px] font-bold uppercase tracking-widest flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                  Hệ thống Khảo thí AI Chuyên nghiệp
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {needsKey && (
               <button 
                onClick={handleOpenKeyDialog}
                className="bg-yellow-500 hover:bg-yellow-600 text-blue-950 px-6 py-3 rounded-2xl text-xs font-black flex items-center space-x-2 animate-bounce shadow-2xl"
               >
                 <Key className="w-4 h-4" />
                 <span>KÍCH HOẠT API</span>
               </button>
            )}
            <div className="bg-white/10 px-5 py-2.5 rounded-xl border border-white/10 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
              Năm học 2025 - 2026
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1800px] mx-auto w-full p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <aside className="lg:col-span-3 space-y-8 no-print">
          <div className="bg-white rounded-[3rem] shadow-xl border border-slate-200 p-8 space-y-8 sticky top-32">
            <div className="flex items-center space-x-4 text-blue-950 border-b border-slate-100 pb-6">
              <Settings className="w-7 h-7 text-blue-800" />
              <h2 className="font-black text-xl uppercase tracking-tighter">Cấu hình Đề thi</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Năm học</label>
                <select 
                  className="w-full rounded-2xl border-slate-200 bg-slate-50 py-4 px-5 font-bold text-slate-800"
                  value={config.schoolYear}
                  onChange={(e) => setConfig(prev => ({...prev, schoolYear: e.target.value as SchoolYear}))}
                >
                  {Object.values(SchoolYear).map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Môn học</label>
                <select 
                  className="w-full rounded-2xl border-slate-200 bg-slate-50 py-4 px-5 font-bold text-slate-800"
                  value={config.subject}
                  onChange={(e) => setConfig(prev => ({...prev, subject: e.target.value}))}
                >
                  {Object.values(Subject).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Lớp</label>
                  <select 
                    className="w-full rounded-2xl border-slate-200 bg-slate-50 py-4 px-5 font-bold text-slate-800"
                    value={config.grade}
                    onChange={(e) => setConfig(prev => ({...prev, grade: e.target.value}))}
                  >
                    {Object.values(Grade).map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Thang điểm</label>
                  <select 
                    className="w-full rounded-2xl border-slate-200 bg-slate-50 py-4 px-5 font-bold text-slate-800"
                    value={config.scale}
                    onChange={(e) => setConfig(prev => ({...prev, scale: e.target.value}))}
                  >
                    {Object.values(Scale).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Hình thức/Phạm vi</label>
                <select 
                  className="w-full rounded-2xl border-slate-200 bg-slate-50 py-4 px-5 font-bold text-slate-800 mb-2"
                  value={config.scopeType}
                  onChange={(e) => setConfig(prev => ({...prev, scopeType: e.target.value as ScopeType}))}
                >
                  {Object.values(ScopeType).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {config.scopeType === ScopeType.TOPIC && (
                  <input 
                    type="text"
                    placeholder="Tên chương hoặc chủ đề..."
                    className="w-full rounded-2xl border-slate-200 py-4 px-5 font-medium bg-white shadow-inner animate-in fade-in"
                    value={config.specificTopic || ''}
                    onChange={(e) => setConfig(prev => ({...prev, specificTopic: e.target.value}))}
                  />
                )}
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-[#002147] hover:bg-blue-900 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-blue-900/20 transition-all flex items-center justify-center space-x-3 disabled:opacity-50 active:scale-[0.97]"
              >
                {loading ? <Loader2 className="animate-spin w-6 h-6" /> : <RefreshCw className="w-6 h-6" />}
                <span className="text-xl uppercase tracking-tighter">Soạn Hồ Sơ 7991</span>
              </button>
            </div>

            {errorInfo && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <p className="text-[10px] text-red-900 font-bold leading-tight italic">{errorInfo}</p>
              </div>
            )}
          </div>
        </aside>

        <section className="lg:col-span-9 flex flex-col min-h-[900px]">
          {!result && !loading && (
            <div className="flex-1 bg-white rounded-[4rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-20 text-center shadow-inner">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-8 shadow-xl">
                <FileText className="w-12 h-12 text-blue-500" />
              </div>
              <h3 className="text-3xl font-black text-blue-950 mb-4 uppercase tracking-tighter">Hệ thống Đã Sẵn Sàng</h3>
              <p className="text-slate-400 max-w-md text-lg leading-relaxed font-semibold">Bấm "Soạn Hồ Sơ 7991" để AI biên soạn Ma trận, Đặc tả, Đề thi và Đáp án chi tiết cho năm học 2025-2026.</p>
            </div>
          )}

          {loading && (
            <div className="flex-1 bg-white rounded-[4rem] shadow-2xl flex flex-col items-center justify-center p-20 text-center">
              <div className="relative mb-10">
                <div className="w-36 h-36 border-[14px] border-slate-50 border-t-yellow-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-blue-900 animate-pulse" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-blue-950 mb-3 uppercase tracking-widest">Đang khởi tạo hồ sơ khảo thí</h3>
              <p className="text-blue-800/60 text-lg font-black animate-pulse italic">Đang phân hóa 4 tầng header và lập đáp án chi tiết...</p>
            </div>
          )}

          {result && !loading && (
            <div className="flex-1 flex flex-col bg-white rounded-[4rem] shadow-2xl border border-slate-200 overflow-hidden">
              <nav className="flex bg-slate-50 border-b p-5 no-print gap-3 overflow-x-auto">
                {[
                  { id: 'matrix', label: 'Ma trận (19 cột)', icon: LayoutGrid },
                  { id: 'spec', label: 'Bảng đặc tả', icon: FileText },
                  { id: 'exam', label: 'Đề kiểm tra', icon: BookOpen },
                  { id: 'answer', label: 'Đáp án & Chấm', icon: CheckCircle2 },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center space-x-3 py-5 px-6 min-w-[200px] rounded-3xl text-xs font-black uppercase tracking-tighter transition-all ${
                      activeTab === tab.id 
                      ? 'bg-blue-900 text-white shadow-xl translate-y-[-4px] border-b-4 border-yellow-400' 
                      : 'text-slate-400 hover:bg-white hover:text-blue-900'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>

              <div className="p-8 bg-white border-b flex items-center justify-between no-print shadow-sm">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-1.5 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-black text-blue-950 uppercase tracking-[0.2em]">Xem trước nội dung hồ sơ</span>
                </div>
                <button
                  onClick={() => {
                    const titles = { matrix: 'MA_TRAN_7991', spec: 'DAC_TA_7991', exam: 'DE_KIEM_TRA', answer: 'DAP_AN_CHAM' };
                    handleDownload(activeTab === 'spec' ? 'specTable' : activeTab === 'exam' ? 'examPaper' : activeTab === 'answer' ? 'answerKey' : 'matrix', titles[activeTab]);
                  }}
                  className="flex items-center space-x-4 bg-emerald-600 hover:bg-emerald-700 text-white text-md font-black py-4 px-10 rounded-[2rem] shadow-xl transition-all active:scale-95"
                >
                  <Download className="w-6 h-6" />
                  <span>XUẤT WORD CHUẨN</span>
                </button>
              </div>

              <div className="flex-1 overflow-auto p-10 bg-slate-50 scroll-smooth">
                <div className={`mx-auto bg-white shadow-2xl p-16 min-h-full w-full ${activeTab === 'matrix' || activeTab === 'spec' ? 'max-w-[1500px]' : 'max-w-[900px]'} times-new-roman border-t-[12px] border-blue-950 rounded-b-[3rem]`}>
                  {renderContent(activeTab === 'matrix' ? result.matrix : activeTab === 'spec' ? result.specTable : activeTab === 'exam' ? result.examPaper : result.answerKey)}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="bg-white border-t py-12 text-center no-print mt-auto">
        <div className="flex flex-col items-center space-y-4 opacity-30">
          <School className="w-8 h-8 text-blue-950" />
          <p className="text-[12px] font-black uppercase tracking-[0.5em] text-blue-900">Ban Giám hiệu Trường THCS Đông Trà</p>
          <p className="text-[10px] font-bold italic text-slate-500">Giải pháp Trợ lý Khảo thí AI 2025 - Phiên bản dành cho Giáo dục Việt Nam</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
