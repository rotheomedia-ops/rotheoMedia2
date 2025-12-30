
import React, { useRef, useState, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import { UploadedFile } from '../types';

interface FileUploadProps {
  files: UploadedFile[];
  setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  maxFiles?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({ files, setFiles, maxFiles = 10 }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = (selectedFiles: FileList | File[]) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFiles: UploadedFile[] = Array.from(selectedFiles)
      .filter((file: File) => file.type.startsWith('image/'))
      .slice(0, maxFiles - files.length)
      .map((file: File) => ({
        id: Math.random().toString(36).substring(2, 11),
        file,
        preview: URL.createObjectURL(file)
      }));

    setFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files ? Array.from(e.target.files) : []);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files ? Array.from(e.dataTransfer.files) : []);
  };

  // Paste support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) pastedFiles.push(blob);
        }
      }

      if (pastedFiles.length > 0) {
        processFiles(pastedFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [files, maxFiles]);

  const removeFile = (id: string) => {
    setFiles(prev => {
      const filtered = prev.filter(f => f.id !== id);
      const removed = prev.find(f => f.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return filtered;
    });
  };

  return (
    <div className="space-y-4" ref={containerRef}>
      <div 
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
          isDragging 
            ? 'border-indigo-500 bg-indigo-50 scale-[1.01]' 
            : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50'
        }`}
      >
        <Upload className={`w-10 h-10 mb-2 transition-colors ${isDragging ? 'text-indigo-600' : 'text-slate-400'}`} />
        <span className="text-sm font-medium text-slate-700 text-center">
          {isDragging ? 'Solte as imagens aqui' : 'Arraste, cole (Ctrl+V) ou clique para upload'}
        </span>
        <span className="text-xs text-slate-500 mt-1">PNG, JPG, HEIC, WEBP, RAW até 50MB (máx {maxFiles})</span>
        <input 
          ref={fileInputRef}
          type="file" 
          multiple 
          accept="image/*"
          className="hidden" 
          onChange={handleFileChange}
        />
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {files.map(file => (
            <div key={file.id} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-white">
              <img src={file.preview} alt="preview" className="w-full h-full object-cover" />
              <button 
                onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                className="absolute top-1 right-1 bg-white/90 p-1 rounded-full text-red-500 shadow hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
