
import React, { useState } from 'react';
import { 
  FileText, 
  Settings, 
  Download, 
  Loader2, 
  CheckCircle2, 
  School,
  BookOpen,
  LayoutGrid,
  AlertCircle
} from 'lucide-react';
import { ExamConfig, ExamResult, Subject, Grade, Duration, Scale, ScopeType } from './types';
import { generateExamContent } from './services/geminiService';
import { downloadAsFile } from './services/wordService';

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

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const data = await generateExamContent(config);
      setResult(data);
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Đã có lỗi xảy ra trong quá trình soạn thảo. Vui lòng thử lại!");
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
        <div className="overflow-x-auto border rounded-lg p-4 bg-white shadow-inner">
          <div 
            className="min-w-[1200px] text-[10pt] table-standard times-new-roman"
            dangerouslySetInnerHTML={{ __html: content }} 
          />
        </div>
      );
    }

    const cleanContent = content.replace(/[\*\#]+/g, '');
    
    return (
      <div className="times-new-roman text-[13pt] text-justify space-y-2 px-4 leading-normal">
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
              <p key={i} className={`${isHeader ? 'font-bold text-center uppercase py-2' : ''}`}>
                {trimmed}
              </p>
            );
          })}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 font-sans">
      <style>{`
        .table-standard table { width: 100%; border-collapse: collapse; margin: 1rem 0; border: 1px solid black; table-layout: fixed; }
        .table-standard th, .table-standard td { border: 1px solid black; padding: 4px 2px; text-align: center; vertical-align: middle; word-wrap: break-word; overflow: hidden; }
        .table-standard th { background-color: #f8fafc; font-weight: bold; font-size: 9pt; }
        .times-new-roman { font-family: 'Times New Roman', Times, serif !important; }
        @media print { .no-print { display: none; } }
      `}</style>

      <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white shadow-2xl py-6 px-6 no-print">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-5">
            <div className="p-3 bg-white/20 backdrop-blur-xl rounded-2xl shadow-inner border border-white/20">
              <School className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight uppercase leading-tight">Trường THCS Đông Trà</h1>
              <p className="text-blue-200 text-sm font-semibold tracking-wide">TRỢ LÝ AI SOẠN THẢO CHUYÊN NGHIỆP CV 7991</p>
            </div>
          </div>
          <div className="bg-green-500/20 px-5 py-2.5 rounded-2xl border border-green-400/30 flex items-center space-x-3 text-xs font-bold uppercase tracking-widest text-green-300">
            <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
            <span>Hệ thống trực tuyến</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] mx-auto w-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3 space-y-6 no-print">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 space-y-6 sticky top-8">
            <h2 className="flex items-center space-x-3 font-black text-slate-800 text-xl border-b border-slate-100 pb-4">
              <Settings className="w-6 h-6 text-blue-700" />
              <span>Cấu hình đề thi</span>
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Môn học</label>
                <select 
                  className="w-full rounded-2xl border-slate-200 bg-slate-50 focus:ring-4 focus:ring-blue-100 py-3.5 font-bold text-slate-700 transition-all cursor-pointer"
                  value={config.subject}
                  onChange={(e) => setConfig(prev => ({...prev, subject: e.target.value}))}
                >
                  {Object.values(Subject).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Lớp</label>
                  <select 
                    className="w-full rounded-2xl border-slate-200 bg-slate-50 py-3.5 font-bold text-slate-700"
                    value={config.grade}
                    onChange={(e) => setConfig(prev => ({...prev, grade: e.target.value}))}
                  >
                    {Object.values(Grade).map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Thang điểm</label>
                  <select 
                    className="w-full rounded-2xl border-slate-200 bg-slate-50 py-3.5 font-bold text-slate-700"
                    value={config.scale}
                    onChange={(e) => setConfig(prev => ({...prev, scale: e.target.value}))}
                  >
                    {Object.values(Scale).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Thời gian làm bài</label>
                <select 
                  className="w-full rounded-2xl border-slate-200 bg-slate-50 py-3.5 font-bold text-slate-700"
                  value={config.duration}
                  onChange={(e) => setConfig(prev => ({...prev, duration: e.target.value}))}
                >
                  {Object.values(Duration).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Phạm vi kiến thức</label>
                <select 
                  className="w-full rounded-2xl border-slate-200 bg-slate-50 py-3.5 font-bold text-slate-700 mb-3"
                  value={config.scopeType}
                  onChange={(e) => setConfig(prev => ({...prev, scopeType: e.target.value as ScopeType}))}
                >
                  {Object.values(ScopeType).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {config.scopeType === ScopeType.TOPIC && (
                  <input 
                    type="text"
                    id="specificTopicInput"
                    placeholder="Nhập chương hoặc chủ đề..."
                    className="w-full rounded-2xl border-slate-200 focus:ring-4 focus:ring-blue-100 py-3.5 px-4 font-medium text-slate-800 bg-white shadow-sm transition-all"
                    value={config.specificTopic || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setConfig(prev => ({...prev, specificTopic: value}));
                    }}
                  />
                )}
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-black py-4.5 rounded-2xl shadow-xl shadow-blue-200 hover:shadow-blue-300 transition-all flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.98]"
              >
                {loading ? <Loader2 className="animate-spin w-6 h-6" /> : <LayoutGrid className="w-6 h-6 group-hover:rotate-12 transition-transform" />}
                <span className="text-lg uppercase">Tạo hồ sơ đề</span>
              </button>
            </div>

            <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start space-x-4">
              <AlertCircle className="w-6 h-6 text-blue-700 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-900 font-medium leading-relaxed italic">
                * Đã sửa lỗi nhập liệu "Theo chủ đề". Bạn đã có thể gõ chữ bình thường vào ô nhập liệu này.
              </p>
            </div>
          </div>
        </aside>

        <section className="lg:col-span-9 flex flex-col min-h-[700px]">
          {!result && !loading && (
            <div className="flex-1 bg-white rounded-[40px] border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-16 text-center shadow-inner no-print">
              <div className="w-28 h-28 bg-blue-50 rounded-full flex items-center justify-center mb-8 animate-bounce shadow-lg shadow-blue-100">
                <FileText className="w-14 h-14 text-blue-400" />
              </div>
              <h3 className="text-3xl font-black text-slate-800 mb-4 uppercase tracking-tight">Trung tâm soạn thảo AI</h3>
              <p className="text-slate-500 max-w-lg text-lg leading-relaxed font-medium">Hệ thống đã sẵn sàng phục vụ giáo viên Trường THCS Đông Trà.</p>
            </div>
          )}

          {loading && (
            <div className="flex-1 bg-white rounded-[40px] shadow-2xl flex flex-col items-center justify-center p-16 text-center no-print">
              <div className="relative mb-10">
                <div className="w-32 h-32 border-[12px] border-slate-50 border-t-blue-700 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-blue-700 animate-pulse" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3 uppercase tracking-wider">Đang biên soạn hồ sơ đề thi</h3>
              <p className="text-slate-500 text-lg font-medium animate-pulse italic">Hệ thống đang thiết lập các bảng gộp ô phức tạp theo mẫu chuẩn...</p>
            </div>
          )}

          {result && !loading && (
            <div className="flex-1 flex flex-col bg-white rounded-[40px] shadow-2xl border border-slate-200 overflow-hidden">
              <div className="flex bg-slate-50 border-b p-3 no-print">
                {[
                  { id: 'matrix', label: 'Ma trận đề', icon: LayoutGrid },
                  { id: 'spec', label: 'Bảng đặc tả', icon: FileText },
                  { id: 'exam', label: 'Đề kiểm tra', icon: BookOpen },
                  { id: 'answer', label: 'Đáp án & HD chấm', icon: CheckCircle2 },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center space-x-3 py-4 px-6 rounded-2xl text-sm font-black uppercase tracking-tighter transition-all ${
                      activeTab === tab.id 
                      ? 'bg-blue-700 text-white shadow-xl shadow-blue-200' 
                      : 'text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="p-5 bg-white border-b flex items-center justify-between no-print">
                <div className="flex items-center space-x-3">
                  <span className="text-[10px] font-black text-blue-700 uppercase tracking-[0.2em] px-4 py-2 bg-blue-50 rounded-full">
                    Chế độ Preview ma trận CV 7991
                  </span>
                </div>
                <button
                  onClick={() => {
                    const titles = { matrix: 'MA_TRAN', spec: 'DAC_TA', exam: 'DE_KIEM_TRA', answer: 'DAP_AN' };
                    handleDownload(activeTab === 'spec' ? 'specTable' : activeTab === 'exam' ? 'examPaper' : activeTab === 'answer' ? 'answerKey' : 'matrix', titles[activeTab]);
                  }}
                  className="flex items-center space-x-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black py-3 px-8 rounded-2xl shadow-xl hover:shadow-emerald-200 transition-all active:scale-95"
                >
                  <Download className="w-5 h-5" />
                  <span>XUẤT WORD (.DOC)</span>
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4 sm:p-12 bg-slate-200/50 scroll-smooth">
                <div className={`mx-auto bg-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] p-8 sm:p-12 min-h-full w-full ${activeTab === 'matrix' || activeTab === 'spec' ? 'max-w-[32cm]' : 'max-w-[21cm]'} times-new-roman border-t-8 border-blue-700 rounded-b-xl`}>
                  {renderContent(activeTab === 'matrix' ? result.matrix : activeTab === 'spec' ? result.specTable : activeTab === 'exam' ? result.examPaper : result.answerKey)}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="bg-white border-t py-10 text-center text-slate-400 text-xs no-print">
        <div className="max-w-7xl mx-auto flex flex-col items-center space-y-4">
          <p className="font-bold uppercase tracking-widest">Hội đồng Sư phạm Trường THCS Đông Trà</p>
          <p className="max-w-md mx-auto opacity-70">Hệ thống AI chuyên dụng soạn hồ sơ đề kiểm tra.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
