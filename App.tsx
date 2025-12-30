
import React, { useState } from 'react';
import Layout from './components/Layout';
import FileUpload from './components/FileUpload';
import { GeminiService } from './services/gemini';
import { Platform, UploadedFile, GeneratedAsset, AppTab, VOICES } from './types';
import { PLATFORM_OPTIONS } from './constants';
import { Send, Copy, Check, RefreshCw, PenTool, Download, Mic, Plus, Minus, ShoppingBag, Trash2, Mic2, Play, Music, Layers, Image as ImageIcon } from 'lucide-react';

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

  // Integrate Tab states
  const [integrateBgFiles, setIntegrateBgFiles] = useState<UploadedFile[]>([]);
  const [integrateProductFiles, setIntegrateProductFiles] = useState<UploadedFile[]>([]);
  const [integrateResult, setIntegrateResult] = useState<string | null>(null);

  // Edit Tab states
  const [editFiles, setEditFiles] = useState<UploadedFile[]>([]);
  const [editPrompt, setEditPrompt] = useState('');
  const [editResult, setEditResult] = useState<string | null>(null);
  const [editSourceUrl, setEditSourceUrl] = useState<string | null>(null);

  // Audio Tab states
  const [audioScript, setAudioScript] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);

  const gemini = new GeminiService();

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
    } catch (error) {
      console.error(error);
      alert('A geração falhou. Verifique sua conexão.');
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
      console.error(error);
      alert('A integração falhou.');
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
      console.error(error);
      alert('Falha na edição.');
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
      console.error(error);
      alert('Falha na geração do áudio.');
    } finally {
      setIsGenerating(false);
    }
  };

  const clearAll = () => {
    if (confirm('Tem certeza que deseja limpar tudo?')) {
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

  const downloadAllImages = () => {
    if (!result) return;
    result.images.forEach((img, idx) => {
      const link = document.createElement('a');
      link.href = img;
      link.download = `rotheo-${platform}-ad-${idx + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const sendToEdit = (imgUrl: string) => {
    setEditSourceUrl(imgUrl);
    setEditFiles([]);
    setActiveTab('edit');
    setEditPrompt('');
    setEditResult(null);
  };

  const sendToAudio = (script: string) => {
    setAudioScript(script);
    setActiveTab('audio');
    setGeneratedAudioUrl(null);
  };

  const copyToClipboard = (text: string, type: 'caption' | 'voice') => {
    navigator.clipboard.writeText(text);
    if (type === 'caption') {
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
    } else {
      setCopiedVoice(true);
      setTimeout(() => setCopiedVoice(false), 2000);
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">
            {activeTab === 'generate' ? 'Gerar Campanha' : activeTab === 'integrate' ? 'Integração de Cena' : activeTab === 'edit' ? 'Editor Avançado' : 'Gerador de Áudio'}
          </h2>
          <p className="text-slate-500 mt-2">
            {activeTab === 'generate' 
              ? 'Crie anúncios de alta conversão. Envie o produto e nós cuidamos do ambiente.' 
              : activeTab === 'integrate'
              ? 'Insira seu produto em fotos reais de ambientes de forma natural.'
              : activeTab === 'edit'
              ? 'Refine ativos ou adicione textos específicos mantendo as palavras exatas.'
              : 'Transforme seus roteiros em narrações profissionais prontas para uso.'}
          </p>
        </div>
        {(files.length > 0 || result || editResult || audioScript || integrateBgFiles.length > 0) && (
          <button 
            onClick={clearAll}
            className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm font-bold transition-colors border border-red-100"
          >
            <Trash2 className="w-4 h-4" />
            Limpar Tudo
          </button>
        )}
      </header>

      {activeTab === 'generate' ? (
        <div className="space-y-8 pb-20">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold mb-4">1. Fotos do Produto</h3>
            <FileUpload files={files} setFiles={setFiles} />
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">2. Configurações</h3>
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Plataforma</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['instagram', 'facebook', 'google', 'mercado-livre'] as Platform[]).map(p => (
                      <button
                        key={p}
                        onClick={() => {
                          setPlatform(p);
                          setSelectedAdOption(PLATFORM_OPTIONS[p][0].id);
                        }}
                        className={`py-2 px-2 rounded-lg text-[11px] sm:text-xs font-medium border capitalize transition-all truncate ${
                          platform === p 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {p.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Posicionamento</label>
                    <select
                      value={selectedAdOption}
                      onChange={(e) => setSelectedAdOption(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      {PLATFORM_OPTIONS[platform].map(opt => (
                        <option key={opt.id} value={opt.id}>
                          {opt.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Qtd. de Imagens (Máx 10)</label>
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg p-1">
                      <button 
                        onClick={() => setNumImages(Math.max(1, numImages - 1))}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600"
                      ><Minus className="w-4 h-4" /></button>
                      <span className="flex-1 text-center text-sm font-bold">{numImages}</span>
                      <button 
                        onClick={() => setNumImages(Math.min(10, numImages + 1))}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600"
                      ><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">3. Briefing (Opcional)</h3>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Instruções de Estilo</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Produto em luxuosa mesa de jantar. Se vazio, criaremos um ambiente perfeito para o produto detectado..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm min-h-[120px] focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-2">Dica: Se enviar uma Luminária ou Painel Solar sem briefing, usaremos IA para compor o melhor cenário.</p>
            </div>
          </section>

          <div className="flex justify-center pt-4">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || files.length === 0}
              className={`flex items-center gap-3 px-12 py-4 rounded-full font-bold text-white transition-all transform hover:scale-105 active:scale-95 ${
                isGenerating || files.length === 0
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200'
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Produzindo Criativos Únicos...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Gerar Pack de Campanha
                </>
              )}
            </button>
          </div>

          {result && (
            <div className="space-y-8 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">Seus Ativos Gerados</h3>
                {result.images.length > 1 && (
                  <button 
                    onClick={downloadAllImages}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Baixar Tudo
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {result.images.map((imgUrl, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-2xl shadow-lg border border-slate-200 flex flex-col">
                    <div className="relative group overflow-hidden rounded-xl bg-slate-100 flex items-center justify-center aspect-square">
                       <img 
                        src={imgUrl} 
                        alt={`Generated Ad ${idx + 1}`} 
                        className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105" 
                       />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = imgUrl;
                          link.download = `rotheo-media-${platform}-${idx + 1}.png`;
                          link.click();
                        }}
                        className="flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Baixar
                      </button>
                      <button 
                        onClick={() => sendToEdit(imgUrl)}
                        className="flex items-center justify-center gap-2 bg-white text-indigo-600 border border-indigo-100 py-2 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors"
                      >
                        <PenTool className="w-4 h-4" />
                        Editar
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-indigo-600" />
                      Legenda SEO (PT-BR)
                    </h3>
                    <button 
                      onClick={() => copyToClipboard(result.caption, 'caption')}
                      className="flex items-center gap-2 text-indigo-600 text-sm font-semibold hover:text-indigo-700"
                    >
                      {copiedCaption ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedCaption ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 whitespace-pre-wrap text-slate-700 leading-relaxed text-sm max-h-[350px] overflow-y-auto font-mono">
                    {result.caption}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <Mic className="w-5 h-5 text-rose-500" />
                      Voiceover Script
                    </h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => copyToClipboard(result.voiceover, 'voice')}
                        className="flex items-center gap-2 text-rose-600 text-sm font-semibold hover:text-rose-700"
                      >
                        {copiedVoice ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copiedVoice ? 'Copiado' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 whitespace-pre-wrap text-slate-700 leading-relaxed text-sm max-h-[350px] overflow-y-auto font-serif italic">
                    {result.voiceover}
                  </div>
                  <button 
                    onClick={() => sendToAudio(result.voiceover)}
                    className="mt-6 w-full flex items-center justify-center gap-2 bg-rose-500 text-white py-3 rounded-xl font-bold hover:bg-rose-600 transition-colors shadow-md"
                  >
                    <Mic2 className="w-5 h-5" />
                    Gerar Áudio Deste Script
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'integrate' ? (
        <div className="space-y-8 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-indigo-600" />
                1. Foto do Ambiente
              </h3>
              <FileUpload files={integrateBgFiles} setFiles={setIntegrateBgFiles} maxFiles={1} />
              <p className="text-xs text-slate-500 mt-2 italic">A foto da sala, escritório ou local onde o produto será inserido.</p>
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-600" />
                2. Foto do Produto
              </h3>
              <FileUpload files={integrateProductFiles} setFiles={setIntegrateProductFiles} maxFiles={1} />
              <p className="text-xs text-slate-500 mt-2 italic">A foto do item que você deseja integrar à cena.</p>
            </section>
          </div>

          <div className="flex justify-center pt-4">
            <button
              onClick={handleIntegrate}
              disabled={isGenerating || integrateBgFiles.length === 0 || integrateProductFiles.length === 0}
              className={`flex items-center gap-3 px-12 py-4 rounded-full font-bold text-white transition-all transform hover:scale-105 active:scale-95 ${
                isGenerating || integrateBgFiles.length === 0 || integrateProductFiles.length === 0
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200'
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Integrando Produto na Cena...
                </>
              ) : (
                <>
                  <Layers className="w-5 h-5" />
                  Mesclar Produto e Ambiente
                </>
              )}
            </button>
          </div>

          {integrateResult && (
            <div className="mt-12 bg-white p-8 rounded-2xl shadow-xl border border-slate-200 max-w-2xl mx-auto animate-in fade-in zoom-in duration-500">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center justify-between">
                Resultado da Integração
                <button 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = integrateResult;
                      link.download = `rotheo-integration.png`;
                      link.click();
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
              </h3>
              <img 
                src={integrateResult} 
                alt="Integrated Product" 
                className="w-full rounded-xl shadow-sm border border-slate-100"
              />
              <div className="mt-6 flex justify-center">
                 <button 
                  onClick={() => sendToEdit(integrateResult)}
                  className="flex items-center gap-2 px-6 py-3 border-2 border-indigo-100 text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors"
                >
                  <PenTool className="w-5 h-5" />
                  Refinar no Editor
                </button>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'edit' ? (
        <div className="space-y-8 pb-20">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold mb-4">1. Origem da Imagem</h3>
            {editSourceUrl && editFiles.length === 0 ? (
              <div className="mb-4 p-4 border rounded-xl bg-indigo-50 flex items-center gap-4">
                <img src={editSourceUrl} className="w-20 h-20 object-cover rounded-lg border shadow-sm" alt="Thumbnail" />
                <div>
                  <p className="text-sm font-medium text-slate-700">Refinando imagem da campanha</p>
                  <button 
                    onClick={() => { setEditSourceUrl(null); setEditFiles([]); }}
                    className="text-xs text-indigo-600 hover:underline mt-1"
                  >
                    Trocar por upload manual
                  </button>
                </div>
              </div>
            ) : null}
            <FileUpload files={editFiles} setFiles={setEditFiles} maxFiles={1} />
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold mb-4">2. Instruções de Edição</h3>
            <textarea
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder="Ex: Adicione o texto 'FRETE GRÁTIS' centralizado embaixo..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm min-h-[120px] focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </section>

          <div className="flex justify-center pt-4">
            <button
              onClick={handleEdit}
              disabled={isGenerating || (editFiles.length === 0 && !editSourceUrl) || !editPrompt}
              className={`flex items-center gap-3 px-12 py-4 rounded-full font-bold text-white transition-all transform hover:scale-105 active:scale-95 ${
                isGenerating || (editFiles.length === 0 && !editSourceUrl) || !editPrompt
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200'
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Aplicando Edições...
                </>
              ) : (
                <>
                  <PenTool className="w-5 h-5" />
                  Atualizar Imagem
                </>
              )}
            </button>
          </div>

          {editResult && (
            <div className="mt-12 bg-white p-6 rounded-2xl shadow-xl border border-slate-200 max-w-2xl mx-auto animate-in fade-in zoom-in duration-500">
              <img 
                src={editResult} 
                alt="Edited Asset" 
                className="w-full rounded-lg shadow-sm mb-4"
              />
              <div className="flex justify-end">
                <button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = editResult;
                    link.download = `rotheo-media-edit.png`;
                    link.click();
                  }}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Baixar Imagem Editada
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* AUDIO TAB */
        <div className="space-y-8 pb-20">
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold mb-4">1. Roteiro de Voiceover</h3>
              <textarea
                value={audioScript}
                onChange={(e) => setAudioScript(e.target.value)}
                placeholder="Cole o roteiro aqui para gerar a narração..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-6 text-lg min-h-[300px] focus:ring-2 focus:ring-rose-500 outline-none font-serif italic"
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">2. Configurações de Voz</h3>
              <div className="space-y-4">
                {VOICES.map(voice => (
                  <button
                    key={voice.id}
                    onClick={() => setSelectedVoice(voice.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${
                      selectedVoice === voice.id
                        ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-200'
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div>
                      <p className={`font-bold text-sm ${selectedVoice === voice.id ? 'text-rose-700' : 'text-slate-700'}`}>
                        {voice.name.split(' (')[0]}
                      </p>
                      <p className="text-xs text-slate-500">{voice.name.split(' (')[1].replace(')', '')}</p>
                    </div>
                    <Music className={`w-4 h-4 transition-transform group-hover:scale-110 ${selectedVoice === voice.id ? 'text-rose-500' : 'text-slate-300'}`} />
                  </button>
                ))}
              </div>
            </div>
          </section>

          <div className="flex justify-center pt-4">
            <button
              onClick={handleGenerateAudio}
              disabled={isGenerating || !audioScript}
              className={`flex items-center gap-3 px-12 py-4 rounded-full font-bold text-white transition-all transform hover:scale-105 active:scale-95 ${
                isGenerating || !audioScript
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-rose-500 hover:bg-rose-600 shadow-xl shadow-rose-200'
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Sintetizando Voz Profissional...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Gerar Narração
                </>
              )}
            </button>
          </div>

          {generatedAudioUrl && (
            <div className="mt-12 bg-white p-8 rounded-2xl shadow-xl border border-slate-200 max-w-xl mx-auto animate-in fade-in zoom-in duration-500 text-center">
              <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mic2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Áudio Pronto!</h3>
              <p className="text-slate-500 text-sm mb-8">Ouça a narração profissional gerada para sua campanha.</p>
              
              <audio 
                key={generatedAudioUrl}
                controls 
                className="w-full mb-8"
              >
                <source src={generatedAudioUrl} type="audio/wav" />
                Seu navegador não suporta a reprodução de áudio.
              </audio>

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = generatedAudioUrl;
                    link.download = `rotheo-voiceover.wav`;
                    link.click();
                  }}
                  className="flex-1 bg-rose-500 text-white py-3 rounded-xl font-bold hover:bg-rose-600 transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Baixar .WAV
                </button>
                <button 
                   onClick={() => setGeneratedAudioUrl(null)}
                   className="px-6 py-3 border-2 border-slate-100 text-slate-500 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Novo Áudio
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default App;
