import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BarChart3, ExternalLink, Filter, Loader2, RefreshCw, Search, X } from 'lucide-react';
import { getDashboardData } from '../services/dashboardApi';
import { DashboardData, DashboardSubmission } from '../types/dashboard';

const emptySummary = { total_projects: 0, total_submissions: 0, open_issues: 0, followup_required: 0, high_critical_priority: 0, lessons_learned: 0 };

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function formatDate(value: string) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('id-ID', { dateStyle: 'medium' });
}

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [year, setYear] = useState('all');
  const [businessUnit, setBusinessUnit] = useState('all');
  const [project, setProject] = useState('all');
  const [department, setDepartment] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<DashboardSubmission | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try { setData(await getDashboardData()); } catch (err: any) { setError(err?.message || 'Dashboard gagal dimuat.'); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const submissions = data?.submissions || [];
  const years = unique(submissions.map((item) => item.timestamp ? new Date(item.timestamp).getFullYear().toString() : ''));
  const businessUnits = unique(submissions.map((item) => item.business_unit));
  const departments = unique(submissions.map((item) => item.function));
  const projectOptions = unique(submissions.map((item) => item.project_code));

  const filtered = useMemo(() => submissions.filter((item) => {
    const itemYear = item.timestamp ? new Date(item.timestamp).getFullYear().toString() : '';
    const haystack = `${item.project_code} ${item.project_name} ${item.client} ${item.submission_id}`.toLowerCase();
    return (year === 'all' || itemYear === year) &&
      (businessUnit === 'all' || item.business_unit === businessUnit) &&
      (project === 'all' || item.project_code === project) &&
      (department === 'all' || item.function === department) &&
      (!search.trim() || haystack.includes(search.trim().toLowerCase()));
  }), [submissions, year, businessUnit, project, department, search]);

  const summary = useMemo(() => ({
    total_projects: unique(filtered.map((item) => item.project_code)).length,
    total_submissions: filtered.length,
    open_issues: filtered.filter((item) => item.issues && item.issues.toLowerCase() !== 'tidak ada').length,
    followup_required: filtered.filter((item) => /^(ya|yes)$/i.test(item.followup_required)).length,
    high_critical_priority: filtered.filter((item) => /high|critical|tinggi|kritis/i.test(item.priority)).length,
    lessons_learned: filtered.filter((item) => Boolean(item.lessons_learned)).length,
  }), [filtered]);

  const reset = () => { setYear('all'); setBusinessUnit('all'); setProject('all'); setDepartment('all'); setSearch(''); setSelected(null); };
  const documents = selected ? (data?.supporting_documents || []).filter((doc) => doc.submission_id === selected.submission_id) : [];
  const followups = filtered.filter((item) => item.action_plan || item.followup_required);
  const lessons = filtered.filter((item) => item.lessons_learned || item.best_practices || item.never_again);
  const filteredBuckets = (key: 'business_unit' | 'function') => {
    const counts: Record<string, number> = {};
    filtered.forEach((item) => { const label = item[key] || 'Tidak diisi'; counts[label] = (counts[label] || 0) + 1; });
    return Object.entries(counts).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Memuat dashboard...</div>;
  if (error) return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6"><div className="max-w-md rounded-2xl border border-rose-200 bg-white p-6 text-center"><AlertCircle className="mx-auto w-8 h-8 text-rose-500" /><h2 className="mt-3 font-semibold text-slate-800">Dashboard tidak tersedia</h2><p className="mt-2 text-sm text-slate-500">{error}</p><button onClick={load} className="mt-5 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"><RefreshCw className="w-4 h-4 mr-2" /> Coba lagi</button></div></div>;
  if (!data) return null;

  const kpis = [
    ['Total Projects', summary.total_projects, 'text-blue-600'], ['Submissions', summary.total_submissions, 'text-indigo-600'], ['Open Issues', summary.open_issues, 'text-amber-600'], ['Follow-up Required', summary.followup_required, 'text-orange-600'], ['High / Critical', summary.high_critical_priority, 'text-rose-600'], ['Lessons Learned', summary.lessons_learned, 'text-emerald-600'],
  ];

  const chart = (title: string, values: { label: string; count: number }[]) => {
    const max = Math.max(...values.map((item) => item.count), 1);
    return <div className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-semibold text-slate-800">{title}</h3><div className="mt-5 space-y-3">{values.length ? values.map((item) => <div key={item.label}><div className="flex justify-between text-xs text-slate-600"><span className="truncate pr-3">{item.label}</span><span className="font-semibold">{item.count}</span></div><div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.max((item.count / max) * 100, item.count ? 8 : 0)}%` }} /></div></div>) : <p className="text-sm text-slate-400">Data belum tersedia.</p>}</div></div>;
  };

  return <div className="min-h-screen bg-slate-50 text-slate-800">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-7xl px-5 py-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Management View</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Project Closing Dashboard</h1><p className="mt-1 text-sm text-slate-500">Read-only overview of submitted project closing data</p></div><button onClick={load} className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw className="mr-2 h-4 w-4" /> Refresh</button></div></div></header>
    <main className="mx-auto max-w-7xl space-y-6 px-5 py-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4"><div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700"><Filter className="h-4 w-4 text-blue-600" /> Filters</div><div className="grid gap-3 md:grid-cols-5"><select value={year} onChange={(e) => setYear(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="all">All Years</option>{years.map((item) => <option key={item}>{item}</option>)}</select><select value={businessUnit} onChange={(e) => setBusinessUnit(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="all">All Business Units</option>{businessUnits.map((item) => <option key={item}>{item}</option>)}</select><select value={project} onChange={(e) => setProject(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="all">All Projects</option>{projectOptions.map((item) => <option key={item}>{item}</option>)}</select><select value={department} onChange={(e) => setDepartment(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="all">All Functions</option>{departments.map((item) => <option key={item}>{item}</option>)}</select><button onClick={reset} className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"><X className="mr-2 h-4 w-4" /> Reset</button></div></section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">{kpis.map(([label, value, color]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className={`mt-3 text-3xl font-bold ${color}`}>{value}</p></div>)}</section>
      <section className="grid gap-6 lg:grid-cols-2">{chart('By Business Unit', filteredBuckets('business_unit'))}{chart('By Function / Department', filteredBuckets('function'))}</section>
      <section className="rounded-2xl border border-slate-200 bg-white"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5"><div><h2 className="font-semibold">Project Overview</h2><p className="mt-1 text-xs text-slate-500">{filtered.length} submission(s) in current view</p></div><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search project or submission" className="rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm" /></div></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Project</th><th className="px-5 py-3">Business Unit</th><th className="px-5 py-3">Client</th><th className="px-5 py-3">Submission</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((item) => <tr key={item.submission_id} onClick={() => setSelected(item)} className="cursor-pointer hover:bg-blue-50/40"><td className="px-5 py-3"><p className="font-semibold text-slate-800">{item.project_code || '—'}</p><p className="max-w-xs truncate text-xs text-slate-500">{item.project_name || '—'}</p></td><td className="px-5 py-3 text-slate-600">{item.business_unit || '—'}</td><td className="px-5 py-3 text-slate-600">{item.client || '—'}</td><td className="px-5 py-3"><p className="font-medium text-slate-700">{item.submission_id}</p><p className="text-xs text-slate-400">{formatDate(item.timestamp)}</p></td><td className="px-5 py-3 text-slate-600">{item.status || '—'}</td></tr>)}</tbody></table>{!filtered.length && <div className="p-10 text-center text-sm text-slate-400">Tidak ada data yang sesuai filter.</div>}</div></section>
      <section className="grid gap-6 lg:grid-cols-2"><div className="rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-100 p-5"><h2 className="font-semibold">Follow-up Monitoring</h2><p className="mt-1 text-xs text-slate-500">Informasi berasal dari jawaban kuesioner.</p></div><div className="divide-y divide-slate-100">{followups.length ? followups.map((item) => <div key={item.submission_id} className="p-4"><div className="flex justify-between gap-3"><p className="font-semibold text-slate-800">{item.project_code || item.submission_id}</p><span className="text-xs text-slate-500">{item.priority || 'Priority unavailable'}</span></div><p className="mt-1 text-sm text-slate-600">{item.action_plan || 'Follow-up diperlukan; action plan tidak tersedia.'}</p><p className="mt-2 text-xs text-slate-400">PIC: {item.pic_name || '—'} · Target: {formatDate(item.target_date)}</p></div>) : <p className="p-5 text-sm text-slate-400">Data follow-up belum tersedia.</p>}</div></div><div className="rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-100 p-5"><h2 className="font-semibold">Lessons Learned</h2><p className="mt-1 text-xs text-slate-500">Lessons, best practices, dan masalah yang perlu dihindari.</p></div><div className="divide-y divide-slate-100">{lessons.length ? lessons.map((item) => <div key={item.submission_id} className="p-4"><p className="font-semibold text-slate-800">{item.project_code || item.submission_id}</p>{item.lessons_learned && <p className="mt-2 text-sm text-slate-600"><b>Lessons:</b> {item.lessons_learned}</p>}{item.best_practices && <p className="mt-1 text-sm text-slate-600"><b>Best practices:</b> {item.best_practices}</p>}{item.never_again && <p className="mt-1 text-sm text-slate-600"><b>Never again:</b> {item.never_again}</p>}</div>) : <p className="p-5 text-sm text-slate-400">Data lessons learned belum tersedia.</p>}</div></div></section>
      {selected && <section className="rounded-2xl border border-blue-200 bg-white p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-600">Selected Submission</p><h2 className="mt-1 text-xl font-bold">{selected.project_code || selected.submission_id}</h2><p className="text-sm text-slate-500">{selected.project_name} · {selected.client}</p></div><button onClick={() => setSelected(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><div className="mt-5 grid gap-4 md:grid-cols-4 text-sm"><div><p className="text-xs text-slate-400">Business Unit</p><p className="font-medium">{selected.business_unit || '—'}</p></div><div><p className="text-xs text-slate-400">Function</p><p className="font-medium">{selected.function || '—'}</p></div><div><p className="text-xs text-slate-400">Submission Date</p><p className="font-medium">{formatDate(selected.timestamp)}</p></div><div><p className="text-xs text-slate-400">Status</p><p className="font-medium">{selected.status || '—'}</p></div></div>{selected.issues && <p className="mt-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"><b>Issues:</b> {selected.issues}</p>}<div className="mt-5"><h3 className="font-semibold">Supporting Documents</h3>{documents.length ? <div className="mt-2 space-y-2">{documents.map((doc) => <a key={doc.document_id} href={doc.drive_url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm hover:bg-slate-50"><span>{doc.file_name || 'Document'} <span className="text-xs text-slate-400">· {doc.mime_type || 'unknown type'} · {formatDate(doc.uploaded_at || '')}</span></span><ExternalLink className="h-4 w-4 text-blue-600" /></a>)}</div> : <p className="mt-2 text-sm text-slate-400">Tidak ada supporting document.</p>}</div></section>}
    </main>
  </div>;
};
