
import React from 'react';
import { ImagePlus, PenTool, Settings, Mic2, Layers, Cog, Zap, AlertCircle } from 'lucide-react';
import { AppTab } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

const LogoIcon = () => (
  <div className="relative flex items-center justify-center w-12 h-12 group">
    <div className="absolute inset-0 bg-blue-100 rounded-full scale-110 group-hover:scale-125 transition-transform duration-500 opacity-50 blur-sm"></div>
    <Cog className="w-10 h-10 text-slate-700 animate-[spin_15s_linear_infinite] relative z-10" />
    <Zap className="w-5 h-5 text-amber-500 fill-amber-400 absolute z-20 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
  </div>
);

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const isConfigured = !!process.env.API_KEY;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-xl z-20">
        <div className="p-8 border-b border-slate-100 bg-gradient-to-br from-white to-slate-50">
          <div className="flex items-center gap-4">
            <LogoIcon />
            <div>
              <h1 className="text-xl font-black tracking-tighter text-slate-800 leading-tight uppercase">
                Engenharia
                <span className="block text-indigo-600 text-lg">Elétrica</span>
              </h1>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-3">
          <button
            onClick={() => setActiveTab('generate')}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'generate'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 translate-x-1'
                : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
            }`}
          >
            <ImagePlus className="w-5 h-5" />
            Gerar Anúncios
          </button>
          <button
            onClick={() => setActiveTab('integrate')}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'integrate'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 translate-x-1'
                : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
            }`}
          >
            <Layers className="w-5 h-5" />
            Integrar Produto
          </button>
          <button
            onClick={() => setActiveTab('edit')}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'edit'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 translate-x-1'
                : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
            }`}
          >
            <PenTool className="w-5 h-5" />
            Editor de Ativos
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'audio'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 translate-x-1'
                : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
            }`}
          >
            <Mic2 className="w-5 h-5" />
            Narração IA
          </button>
        </nav>

        <div className="p-6 border-t border-slate-100">
          {!isConfigured && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-red-700 leading-tight">
                <strong>API_KEY ausente:</strong> Configure no painel do Vercel para habilitar a geração.
              </p>
            </div>
          )}
          <div className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer group">
            <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform" />
            <span className="text-sm font-bold">Painel de Controle</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto max-h-screen">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
