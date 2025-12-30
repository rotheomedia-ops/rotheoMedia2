
import React from 'react';
import { ImagePlus, PenTool, Settings, Mic2, Layers, Cog, Zap } from 'lucide-react';
import { AppTab } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

const LogoIcon = () => (
  <div className="relative flex items-center justify-center w-10 h-10 group">
    <div className="absolute inset-0 bg-indigo-100 rounded-full scale-0 group-hover:scale-110 transition-transform duration-300 opacity-50"></div>
    <Cog className="w-10 h-10 text-indigo-600 animate-[spin_12s_linear_infinite] relative z-10" />
    <Zap className="w-5 h-5 text-amber-500 fill-amber-500 absolute z-20 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
  </div>
);

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <LogoIcon />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800 leading-none">
                Rotheo Media
              </h1>
              <p className="text-[10px] text-indigo-600 mt-1 uppercase tracking-widest font-extrabold">Engenharia Elétrica</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('generate')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'generate'
                ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ImagePlus className="w-5 h-5" />
            Generate Ads
          </button>
          <button
            onClick={() => setActiveTab('integrate')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'integrate'
                ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-5 h-5" />
            Scene Integration
          </button>
          <button
            onClick={() => setActiveTab('edit')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'edit'
                ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <PenTool className="w-5 h-5" />
            Edit Content
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'audio'
                ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Mic2 className="w-5 h-5" />
            Generate Audio
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100 mt-auto">
          <div className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer">
            <Settings className="w-5 h-5" />
            <span className="text-sm font-medium">Configurações</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
