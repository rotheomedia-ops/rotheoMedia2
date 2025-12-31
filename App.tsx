
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import FileUpload from './components/FileUpload';
import { GeminiService } from './services/gemini';
import { Platform, UploadedFile, GeneratedAsset, AppTab, VOICES } from './types';
import { PLATFORM_OPTIONS } from './constants';
import { Send, Copy, Check, RefreshCw, PenTool, Download, Mic, Plus, Minus, ShoppingBag, Trash2, Mic2, Play, Music, Layers, Image as ImageIcon, Key, AlertTriangle } from 'lucide-react';

// Fixed global declaration for aistudio to avoid modifier conflict errors
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('generate');
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [selectedAdOption, setSelectedAdOption] = useState(PLATFORM_OPTIONS.instagram[0].id);
  const [numImages, setNumImages] = useState(1);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedAsset | null>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedVoice, setCopiedVoice] = useState(false);

  // States extras
  const [integrateBgFiles, setIntegrateBgFiles] = useState<UploadedFile[]>([]);
  const [integrateProductFiles, setIntegrateProductFiles] = useState<UploadedFile[]>([]);
  const [integrateResult, setIntegrateResult] = useState<string | null>(null);
  const [editFiles, setEditFiles] = useState<UploadedFile[]>([]);
  const [editPrompt, setEditPrompt] = useState('');
  const [editResult, setEditResult] = useState<string | null>(null);
  const [editSourceUrl, setEditSourceUrl] = useState<string | null>(null);
  const [audioScript, setAudioScript] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);

  const gemini = new GeminiService();

  const handleApiError = async (error: any) => {
    console.error("Erro na API:", error);
    const msg = error?.message || "";
    
    if (msg.includes("403") || msg.includes("401") || msg.includes("API_KEY") || msg.includes("not found")) {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
      } else {
        alert("CONFIGURAÇÃO NECESSÁRIA:\n\nPara usar este app no Vercel, você deve adicionar a variável de ambiente 'API_KEY' com sua chave do Google AI Studio (ai.google.dev) nas configurações do seu projeto.");
      }
      return true;
    }
    return false;
  };

  const handleGenerate = async () => {
    if (files.length === 0) return;
    setIsGenerating(true);
    setResult(null);
    try {
      const selectedOption = PLATFORM_OPTIONS[platform].find(o => o.id === selectedAdOption);
      const ratio = selectedOption?.ratio || '1:1';
      
      const imagePromises = Array.from({ length: numImages }).map((_, idx) => 
        gemini.generateAdImage(files.map(f => f.file), prompt, ratio, idx)
      );
      
      const [images, copyData] = await Promise.all([
        Promise.all(imagePromises),
        gemini.generateAdCopy(prompt, platform)
      ]);
      
      setResult({
        images,
        caption: copyData.caption,
        voiceover: copyData.voiceover,
        hashtags: [] 
      });
    } catch (error: any) {
      const handled = await handleApiError(error);
      if (!handled) {
        alert('Ocorreu um erro inesperado. Verifique sua conexão e tente novamente.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleIntegrate = async () => {
    if (integrateBgFiles.length === 0 || integrateProductFiles.length === 0) return;
    setIsGenerating(true);
    setIntegrateResult(null);
    try {
      const resultUrl = await gemini.integrateProduct(
        integrateBgFiles[0].file,
        integrateProductFiles.map(f => f.file)
      );
      setIntegrateResult(resultUrl);
    } catch (error) {
      await handleApiError(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = async () => {
    const sourceImage = editFiles.length > 0 ? editFiles[0].file : editSourceUrl;
    if (!sourceImage || !editPrompt) return;
    setIsGenerating(true);
    try {
      const editedUrl = await gemini.editImage(sourceImage, editPrompt);
      setEditResult(editedUrl);
    } catch (error) {
      await handleApiError(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!audioScript) return;
    setIsGenerating(true);
    try {
      const url = await gemini.generateAudio(audioScript, selectedVoice);
      setGeneratedAudioUrl(url);
    } catch (error) {
      await handleApiError(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearAll = () => {
    if (confirm('Deseja limpar todos os dados?')) {
      setFiles([]);
      setPrompt('');
      setResult(null);
      setEditFiles([]);
      setEditPrompt('');
      setEditResult(null);
      setEditSourceUrl(null);
      setAudioScript('');
      setGeneratedAudioUrl(null);
      setIntegrateBgFiles([]);
      setIntegrateProductFiles([]);
      setIntegrateResult(null);
    }
  };

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
    } else {
      alert("Atenção: Você está em um ambiente de produção (Vercel). A chave de API deve ser configurada nas 'Environment Variables' do projeto com o nome API_KEY.");
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <header className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-widest mb-2">
            <div className="w-8 h-1 bg-indigo-600 rounded-full"></div>
            Market Intelligence
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">
            {activeTab === 'generate' ? 'Gerador de Criativos' : activeTab === 'integrate' ? 'Fusão de Cenário' : activeTab === 'edit' ? 'Editor Visual' : 'Estúdio de Voz'}
          </h2>
          <p className="text-slate-500 mt-3 max-w-2xl text-lg leading-relaxed">
            {activeTab === 'generate' 
              ? 'Transforme fotos simples de produtos em anúncios de alto padrão cinematográfico para redes sociais.' 
              : activeTab === 'integrate'
              ? 'Posicione seus equipamentos elétricos ou produtos em ambientes reais com iluminação física combinada.'
              : activeTab === 'edit'
              ? 'Adicione selos de oferta, textos promocionais ou altere detalhes mantendo o realismo.'
              : 'Gere locuções profissionais em segundos para Reels, TikTok ou anúncios de rádio.'}
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button 
            onClick={handleOpenKeySelector}
            className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
          >
            <Key className="w-4 h-4" />
            Configurar API
          </button>
          <button 
            onClick={clearAll}
            className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-red-100 text-red-500 rounded-2xl text-sm font-bold hover:bg-red-50 transition-all shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            Limpar
          </button>
        </div>
      </header>

      {/* Alerta de Chave Faltando */}
      {!process.env.API_KEY && (!window.aistudio) && (
        <div className="mb-10 p-6 bg-amber-50 border-2 border-amber-200 rounded-3xl flex items-center gap-5 animate-pulse">
          <div className="w-12 h-12 bg-amber-200 rounded-full flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <h4 className="font-bold text-amber-900">Configuração de API Pendente</h4>
            <p className="text-sm text-amber-700">Acesse o Vercel > Settings > Environment Variables e adicione <strong>API_KEY</strong> para habilitar as funções de IA.</p>
          </div>
        </div>
      )}

      {activeTab === 'generate' ? (
        <div className="space-y-10 pb-20">
          <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
               <ImageIcon className="w-6 h-6 text-indigo-600" />
               1. Enviar Fotos do Produto
            </h3>
            <FileUpload files={files} setFiles={setFiles} />
          </section>

          <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-8">
              <h3 className="text-xl font-bold mb-2">2. Canais e Formatos</h3>
              
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-4">Plataforma de Destino</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['instagram', 'facebook', 'google', 'mercado-livre'] as Platform[]).map(p => (
                    <button
                      key={p}
                      onClick={() => {
                        setPlatform(p);
                        setSelectedAdOption(PLATFORM_OPTIONS[p][0].id);
                      }}
                      className={`py-4 px-4 rounded-2xl text-sm font-bold border-2 transition-all capitalize ${
                        platform === p 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' 
                          : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                      }`}
                    >
                      {p.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-3">Posicionamento</label>
                  <select
                    value={selectedAdOption}
                    onChange={(e) => setSelectedAdOption(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                  >
                    {PLATFORM_OPTIONS[platform].map(opt => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name} ({opt.dimensions})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-3">Variações</label>
                  <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 rounded-2xl p-2">
                    <button 
                      onClick={() => setNumImages(Math.max(1, numImages - 1))}
                      className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg text-slate-600 transition-colors"
                    ><Minus className="w-4 h-4" /></button>
                    <span className="flex-1 text-center text-sm font-black">{numImages}</span>
                    <button 
                      onClick={() => setNumImages(Math.min(10, numImages + 1))}
                      className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg text-slate-600 transition-colors"
                    ><Plus className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-2">3. Direção Criativa</h3>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-3">Contexto da Cena</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ex: Luminária industrial em um loft moderno com tons quentes e sombras suaves. Inclua o texto 'OFERTA' no topo."
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 text-sm min-h-[160px] focus:ring-4 focus:ring-indigo-100 outline-none transition-all leading-relaxed"
                />
                <div className="mt-4 p-4 bg-indigo-50 rounded-2xl text-[11px] text-indigo-700 leading-snug">
                  <strong>Dica:</strong> Se você não digitar nada, nossa IA analisará seu produto e criará o melhor cenário comercial automaticamente.
                </div>
              </div>
            </div>
          </section>

          <div className="flex justify-center pt-6">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || files.length === 0}
              className={`flex items-center gap-4 px-16 py-6 rounded-full font-black text-xl text-white shadow-2xl transition-all transform hover:scale-105 active:scale-95 ${
                isGenerating || files.length === 0
                  ? 'bg-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-7 h-7 animate-spin" />
                  Sintetizando Criativos...
                </>
              ) : (
                <>
                  <Send className="w-7 h-7" />
                  Gerar Campanha Completa
                </>
              )}
            </button>
          </div>

          {result && (
            <div className="space-y-12 mt-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
               <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-800">Seus Ativos de Marketing</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {result.images.map((imgUrl, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col group hover:border-indigo-200 transition-all">
                    <div className="relative overflow-hidden rounded-2xl bg-slate-50 aspect-square">
                       <img 
                        src={imgUrl} 
                        alt={`Gerado ${idx + 1}`} 
                        className="w-full h-full object-contain transition-transform duration-1000 group-hover:scale-110" 
                       />
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button 
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = imgUrl;
                              link.download = `criativo-${idx + 1}.png`;
                              link.click();
                            }}
                            className="p-3 bg-white rounded-full text-slate-900 hover:bg-indigo-600 hover:text-white transition-all transform hover:scale-110"
                          >
                            <Download className="w-6 h-6" />
                          </button>
                          <button 
                            onClick={() => {
                              setEditSourceUrl(imgUrl);
                              setActiveTab('edit');
                            }}
                            className="p-3 bg-white rounded-full text-slate-900 hover:bg-indigo-600 hover:text-white transition-all transform hover:scale-110"
                          >
                            <PenTool className="w-6 h-6" />
                          </button>
                       </div>
                    </div>
                    <div className="mt-5 text-center">
                      <p className="text-xs font-bold text-slate-400 uppercase">Variação #{idx + 1}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                      <ShoppingBag className="w-6 h-6 text-indigo-600" />
                      Legenda Estratégica
                    </h3>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(result.caption);
                        setCopiedCaption(true);
                        setTimeout(() => setCopiedCaption(false), 2000);
                      }}
                      className="flex items-center gap-2 text-indigo-600 font-bold hover:bg-indigo-50 px-4 py-2 rounded-xl transition-all"
                    >
                      {copiedCaption ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      {copiedCaption ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 whitespace-pre-wrap text-slate-700 leading-relaxed text-lg font-medium italic">
                    {result.caption}
                  </div>
                </div>

                <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                      <Mic className="w-6 h-6 text-rose-500" />
                      Roteiro de Locução
                    </h3>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(result.voiceover);
                        setCopiedVoice(true);
                        setTimeout(() => setCopiedVoice(false), 2000);
                      }}
                      className="flex items-center gap-2 text-rose-600 font-bold hover:bg-rose-50 px-4 py-2 rounded-xl transition-all"
                    >
                      {copiedVoice ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      {copiedVoice ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 whitespace-pre-wrap text-slate-700 leading-relaxed text-lg font-mono">
                    {result.voiceover}
                  </div>
                  <button 
                    onClick={() => {
                      setAudioScript(result.voiceover);
                      setActiveTab('audio');
                    }}
                    className="mt-8 w-full flex items-center justify-center gap-3 bg-rose-500 text-white py-5 rounded-3xl font-black text-lg hover:bg-rose-600 transition-all shadow-xl shadow-rose-100"
                  >
                    <Mic2 className="w-6 h-6" />
                    Gerar Narração Profissional
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'integrate' ? (
        <div className="space-y-10 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <ImageIcon className="w-6 h-6 text-indigo-600" />
                1. Foto do Ambiente Real
              </h3>
              <FileUpload files={integrateBgFiles} setFiles={setIntegrateBgFiles} maxFiles={1} />
            </section>
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-indigo-600" />
                2. Foto do Produto
              </h3>
              <FileUpload files={integrateProductFiles} setFiles={setIntegrateProductFiles} maxFiles={1} />
            </section>
          </div>
          <div className="flex justify-center">
             <button
              onClick={handleIntegrate}
              disabled={isGenerating || integrateBgFiles.length === 0 || integrateProductFiles.length === 0}
              className={`flex items-center gap-4 px-16 py-6 rounded-full font-black text-xl text-white shadow-2xl transition-all ${
                isGenerating || integrateBgFiles.length === 0 || integrateProductFiles.length === 0
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isGenerating ? <RefreshCw className="animate-spin" /> : <Layers />}
              Fundir Produto na Cena
            </button>
          </div>
          {integrateResult && (
            <div className="mt-12 bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-200 animate-in zoom-in duration-500 max-w-4xl mx-auto">
               <img src={integrateResult} className="w-full rounded-2xl shadow-inner border border-slate-50" alt="Result" />
               <div className="mt-8 flex justify-center">
                  <button 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = integrateResult;
                      link.download = `fusao.png`;
                      link.click();
                    }}
                    className="flex items-center gap-2 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all"
                  >
                    <Download className="w-6 h-6" />
                    Baixar Resultado
                  </button>
               </div>
            </div>
          )}
        </div>
      ) : activeTab === 'edit' ? (
        <div className="space-y-10 pb-20">
          <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold mb-6">1. Imagem de Origem</h3>
            {editSourceUrl && editFiles.length === 0 ? (
              <div className="mb-6 p-6 border-2 border-indigo-100 rounded-3xl bg-indigo-50/50 flex items-center gap-6">
                <img src={editSourceUrl} className="w-32 h-32 object-cover rounded-2xl border-4 border-white shadow-xl" alt="Preview" />
                <div className="space-y-1">
                  <p className="text-indigo-900 font-bold text-lg">Pronto para Edição</p>
                  <p className="text-indigo-600/70 text-sm">Imagem importada da geração anterior.</p>
                  <button onClick={() => setEditSourceUrl(null)} className="text-xs font-black text-indigo-700 underline mt-2 block">Usar outra foto</button>
                </div>
              </div>
            ) : (
              <FileUpload files={editFiles} setFiles={setEditFiles} maxFiles={1} />
            )}
          </section>
          <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
             <h3 className="text-xl font-bold mb-6">2. O que deseja alterar?</h3>
             <textarea
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="Ex: Adicione um selo circular vermelho no canto superior escrito 'PROMOÇÃO' com fonte branca moderna."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 text-lg min-h-[160px] focus:ring-4 focus:ring-indigo-100 outline-none transition-all leading-relaxed"
              />
          </section>
          <div className="flex justify-center">
            <button
              onClick={handleEdit}
              disabled={isGenerating || (!editFiles.length && !editSourceUrl) || !editPrompt}
              className="flex items-center gap-4 px-16 py-6 rounded-full font-black text-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-2xl disabled:bg-slate-300 transition-all"
            >
              {isGenerating ? <RefreshCw className="animate-spin" /> : <PenTool />}
              Aplicar Alterações
            </button>
          </div>
          {editResult && (
            <div className="mt-12 bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-200 animate-in zoom-in duration-500 max-w-4xl mx-auto">
               <img src={editResult} className="w-full rounded-2xl" alt="Edit result" />
               <div className="mt-8 flex justify-center">
                  <a href={editResult} download="edicao.png" className="flex items-center gap-2 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black">
                    <Download /> Baixar Edição
                  </a>
               </div>
            </div>
          )}
        </div>
      ) : (
        /* AUDIO TAB */
        <div className="space-y-10 pb-20">
          <section className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200 grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
               <h3 className="text-2xl font-black mb-8">1. Script para Narração</h3>
               <textarea
                value={audioScript}
                onChange={(e) => setAudioScript(e.target.value)}
                placeholder="Escreva ou cole aqui o roteiro..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl p-8 text-xl min-h-[400px] focus:ring-4 focus:ring-rose-100 outline-none transition-all leading-relaxed font-serif"
              />
            </div>
            <div>
               <h3 className="text-2xl font-black mb-8">2. Perfil de Voz</h3>
               <div className="space-y-4">
                 {VOICES.map(v => (
                   <button
                    key={v.id}
                    onClick={() => setSelectedVoice(v.id)}
                    className={`w-full p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between group ${
                      selectedVoice === v.id ? 'border-rose-500 bg-rose-50' : 'border-slate-100 hover:border-slate-200'
                    }`}
                   >
                     <div>
                       <p className={`font-black ${selectedVoice === v.id ? 'text-rose-700' : 'text-slate-700'}`}>{v.name.split(' (')[0]}</p>
                       <p className="text-xs text-slate-500">{v.name.split(' (')[1]}</p>
                     </div>
                     <Music className={`w-5 h-5 ${selectedVoice === v.id ? 'text-rose-500' : 'text-slate-300'}`} />
                   </button>
                 ))}
               </div>
            </div>
          </section>
          <div className="flex justify-center">
             <button
              onClick={handleGenerateAudio}
              disabled={isGenerating || !audioScript}
              className="flex items-center gap-4 px-16 py-6 rounded-full font-black text-xl text-white bg-rose-500 hover:bg-rose-600 shadow-2xl disabled:bg-slate-300 transition-all"
            >
              {isGenerating ? <RefreshCw className="animate-spin" /> : <Play />}
              Sintetizar Voz de Alta Fidelidade
            </button>
          </div>
          {generatedAudioUrl && (
            <div className="mt-12 bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-200 max-w-2xl mx-auto text-center animate-in zoom-in duration-500">
               <div className="w-24 h-24 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                 <Mic2 className="w-12 h-12" />
               </div>
               <h3 className="text-3xl font-black mb-10">Narração Concluída</h3>
               <audio controls className="w-full mb-10" key={generatedAudioUrl}>
                 <source src={generatedAudioUrl} type="audio/wav" />
               </audio>
               <a href={generatedAudioUrl} download="locucao.wav" className="inline-flex items-center gap-3 px-12 py-5 bg-rose-500 text-white rounded-3xl font-black text-lg hover:bg-rose-600 transition-all shadow-xl shadow-rose-100">
                 <Download /> Baixar Áudio Masterizado
               </a>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default App;
