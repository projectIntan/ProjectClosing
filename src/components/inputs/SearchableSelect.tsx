import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { ProjectMock } from '../../types';

interface SearchableSelectProps {
  id: string;
  projects: ProjectMock[];
  selectedCode: string;
  onSelectProject: (project: ProjectMock | null) => void;
  hasError?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  id,
  projects,
  selectedCode,
  onSelectProject,
  hasError = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Robustly find selected project whether selectedCode is the code, the full label, or name
  const selectedProject = projects.find((p) => {
    if (!selectedCode) return false;
    const val = selectedCode.trim().toLowerCase();
    const code = p.code.toLowerCase();
    const name = p.name.toLowerCase();
    const full = `${p.code} - ${p.name}`.toLowerCase();
    return (
      code === val ||
      full === val ||
      name === val ||
      val.startsWith(code) ||
      val.includes(code)
    );
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const filteredProjects = projects.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      p.code.toLowerCase().includes(term) ||
      p.name.toLowerCase().includes(term) ||
      p.client.toLowerCase().includes(term) ||
      p.businessUnit.toLowerCase().includes(term)
    );
  });

  return (
    <div ref={containerRef} className="relative" id={id}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchTerm('');
        }}
        className={`w-full min-h-[44px] flex items-center justify-between px-3.5 sm:px-4 py-2.5 text-base sm:text-sm rounded-xl border text-left transition-all ${
          hasError
            ? 'border-rose-300 bg-rose-50/30 text-slate-900 focus:ring-2 focus:ring-rose-200'
            : isOpen
            ? 'border-blue-600 ring-2 ring-blue-100 bg-white'
            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
        }`}
      >
        <div className="flex-1 truncate">
          {selectedProject ? (
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="font-semibold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded text-xs">
                {selectedProject.code}
              </span>
              <span className="font-medium text-slate-900 truncate text-sm">
                {selectedProject.name}
              </span>
            </div>
          ) : selectedCode ? (
            <span className="font-medium text-slate-900 truncate text-sm">
              {selectedCode}
            </span>
          ) : (
            <span className="text-slate-400">Pilih proyek atau cari kode...</span>
          )}
        </div>

        <div className="flex items-center space-x-1.5 ml-2">
          {(selectedProject || selectedCode) && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onSelectProject(null);
                setSearchTerm('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  onSelectProject(null);
                  setSearchTerm('');
                }
              }}
              className="p-1.5 hover:bg-slate-100 active:bg-slate-200 text-slate-400 hover:text-slate-600 rounded transition-colors"
              title="Hapus pilihan"
            >
              <X className="w-4 h-4" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${
              isOpen ? 'rotate-180 text-blue-600' : ''
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-30 mt-1.5 w-full bg-white rounded-xl shadow-xl border border-slate-200 py-2 max-h-80 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
          {/* Search box inside dropdown */}
          <div className="px-3 pb-2 border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="Cari kode, nama, klien..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-base sm:text-xs rounded-lg border border-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800 bg-slate-50"
              />
            </div>
          </div>

          {/* List items */}
          <div className="overflow-y-auto divide-y divide-slate-50 max-h-60 overscroll-contain">
            {filteredProjects.length === 0 ? (
              <div className="py-6 px-4 text-center text-xs text-slate-400">
                Tidak ada proyek yang sesuai dengan kata kunci "{searchTerm}"
              </div>
            ) : (
              filteredProjects.map((proj) => {
                const isSelected = selectedProject
                  ? selectedProject.code === proj.code
                  : proj.code === selectedCode || `${proj.code} - ${proj.name}` === selectedCode;

                return (
                  <button
                    key={proj.code}
                    type="button"
                    onClick={() => {
                      onSelectProject(proj);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`w-full min-h-[44px] text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-slate-50 active:bg-blue-50 transition-colors ${
                      isSelected ? 'bg-blue-50/70 font-medium' : ''
                    }`}
                  >
                    <div className="flex-1 pr-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded text-[11px]">
                          {proj.code}
                        </span>
                        <span className="text-slate-800 font-medium text-xs sm:text-sm">
                          {proj.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-2">
                        <span>Klien: {proj.client}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="text-slate-400">{proj.businessUnit}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
