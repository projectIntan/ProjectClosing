/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Questionnaire } from './components/Questionnaire';
import { Dashboard } from './components/Dashboard';
import { BarChart3, ClipboardList } from 'lucide-react';

export default function App() {
  const [path, setPath] = React.useState(window.location.pathname);

  React.useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (nextPath: string) => {
    window.history.pushState({}, '', nextPath);
    setPath(nextPath);
    window.scrollTo({ top: 0 });
  };

  return <>
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
        <button onClick={() => navigate('/')} className="text-sm font-bold tracking-tight text-slate-800">Project Closing</button>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/')} className={`inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold ${path === '/' || path === '/questionnaire' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}><ClipboardList className="mr-2 h-4 w-4" /> Questionnaire</button>
          <button onClick={() => navigate('/dashboard')} className={`inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold ${path === '/dashboard' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}><BarChart3 className="mr-2 h-4 w-4" /> Dashboard</button>
        </div>
      </div>
    </nav>
    {path === '/dashboard' ? <Dashboard /> : <Questionnaire />}
  </>;
}
