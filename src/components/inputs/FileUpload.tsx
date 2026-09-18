import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Trash2, CheckCircle2 } from 'lucide-react';
import { UploadedFileMock } from '../../types';
import { formatBytes } from '../../utils/formUtils';

interface FileUploadProps {
  id: string;
  files: UploadedFileMock[];
  onChange: (files: UploadedFileMock[]) => void;
  helperText?: string;
  hasError?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  id,
  files = [],
  onChange,
  helperText,
  hasError = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setIsUploading(true);
    // Simulate brief mock upload processing
    setTimeout(() => {
      const newFiles: UploadedFileMock[] = Array.from(fileList).map((f) => ({
        id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: f.name,
        size: f.size,
        type: f.type || 'application/octet-stream',
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }));

      onChange([...files, ...newFiles]);
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 450);
  };

  const handleRemove = (fileId: string) => {
    onChange(files.filter((f) => f.id !== fileId));
  };

  return (
    <div id={id} className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50/70'
            : hasError
            ? 'border-rose-300 bg-rose-50/20 hover:bg-rose-50/40'
            : 'border-slate-300 bg-slate-50/50 hover:bg-slate-100/70 hover:border-slate-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">
              {isUploading ? (
                <span className="text-blue-600">Mengunggah berkas...</span>
              ) : (
                <>
                  <span className="text-blue-600 font-semibold underline decoration-blue-300 underline-offset-2">
                    Pilih file
                  </span>{' '}
                  <span className="text-slate-600 sm:hidden">dari HP / galeri</span>
                  <span className="hidden sm:inline">atau tarik dan lepas di sini</span>
                </>
              )}
            </p>
            {helperText && (
              <p className="text-xs text-slate-400 mt-1">{helperText}</p>
            )}
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            File Terlampir ({files.length})
          </p>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 sm:p-3.5 text-xs hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center space-x-2.5 truncate mr-2">
                  <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div className="truncate">
                    <p className="font-medium text-slate-800 truncate text-xs sm:text-sm">{file.name}</p>
                    <p className="text-slate-400 text-[11px]">
                      {formatBytes(file.size)} • Diunggah pukul {file.uploadedAt}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span className="inline-flex items-center text-[10px] sm:text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Siap
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(file.id);
                    }}
                    className="p-2 sm:p-1 text-slate-400 hover:text-rose-600 active:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                    title="Hapus file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
