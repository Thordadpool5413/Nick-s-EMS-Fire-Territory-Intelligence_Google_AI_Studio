import React, { useEffect, useState } from 'react';
import { api, auth } from '@appdeploy/client';
import { Activity, AlertTriangle, CheckCircle2, CloudOff, Cloud, RefreshCw, ShieldCheck } from 'lucide-react';
import type { Agency } from '../types';

type Props = {
  agencies: Agency[];
  onRestoreAgencies: (records: Agency[]) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
};
type Status = {
  checkedAt: string;
  serviceHealthy: boolean;
  signedIn: boolean;
  remoteSavedRecords: number | null;
  message: string;
};

export const TerritoryDataHealthView: React.FC<Props> = ({ agencies, showToast }) => {
  const [working, setWorking] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const refresh = async () => {
    setWorking(true);
    const signedIn = auth.isSignedIn();
    try {
      const health = await api.get('/api/health');
      if (!health.data?.ok) throw new Error('AppDeploy backend did not pass health check');
      let count: number | null = null;
      let nextToken: string | null = null;
      if (signedIn) {
        count = 0;
        for (let i = 0; i < 10; i++) {
          const r = await api.get('/api/agency-state' +
            (nextToken ? '?nextToken=' + encodeURIComponent(nextToken) : ''));
          if (!Array.isArray(r.data.records)) throw new Error('Invalid cloud records response');
          count += r.data.records.length;
          nextToken = r.data.nextToken || null;
          if (!nextToken) break;
        }
        if (nextToken) throw new Error('More than ten pages of cloud changes; count incomplete');
      }
      setStatus({
        checkedAt: new Date().toLocaleString(),
        serviceHealthy: true,
        signedIn,
        remoteSavedRecords: count,
        message: signedIn ? 'Backend available. Saved change records were read from your authenticated account.' :
          'Backend available. Sign in to verify your saved changes.'
      });
    } catch (e) {
      setStatus({
        checkedAt: new Date().toLocaleString(),
        serviceHealthy: false,
        signedIn,
        remoteSavedRecords: null,
        message: e instanceof Error ? e.message : 'Health verification failed'
      });
      showToast('Cloud storage verification failed. No backup claims were made.', 'error');
    } finally {
      setWorking(false);
    }
  };
  useEffect(() => { void refresh(); }, []);

  const recognized = agencies.filter(a => a.isVerifiedRecord === true).length;
  const unverified = agencies.length - recognized;
  return (
    <section className="space-y-5 max-w-5xl mx-auto" aria-label="Territory data health">
      <header className="bg-slate-950 text-white rounded-2xl p-6">
        <p className="text-blue-300 text-xs font-bold uppercase tracking-widest">Data integrity console</p>
        <h1 className="text-2xl font-bold mt-2">What is actually saved and verified?</h1>
        <p className="text-slate-300 mt-2 text-sm">Source transparency replaces synthetic cloud-backup demonstrations. This screen checks live AppDeploy APIs and never reports a backup unless one truly exists.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5">
          <div className="text-slate-500 text-xs uppercase font-bold flex items-center gap-2"><Activity size={15} /> Visible accounts</div>
          <div className="text-3xl font-bold mt-3 text-slate-950 dark:text-white">{agencies.length.toLocaleString()}</div>
          <p className="text-xs text-slate-500 mt-2">Local account directory, not evidence of validated national completeness</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5">
          <div className="text-slate-500 text-xs uppercase font-bold flex items-center gap-2"><ShieldCheck size={15} /> Identity check flags</div>
          <div className="text-3xl font-bold mt-3 text-emerald-700">{recognized.toLocaleString()}</div>
          <p className="text-xs text-slate-500 mt-2">{unverified.toLocaleString()} accounts lack an identity-level verification flag. Even matched identities do not establish equipment, grants or outcomes.</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5">
          <div className="text-slate-500 text-xs uppercase font-bold flex items-center gap-2">{status?.serviceHealthy ? <Cloud size={15} /> : <CloudOff size={15} />} Saved change records</div>
          <div className="text-3xl font-bold mt-3 text-slate-950 dark:text-white">{status?.remoteSavedRecords ?? 'Not verified'}</div>
          <p className="text-xs text-slate-500 mt-2">AppDeploy account-specific changes successfully read, not a fabricated snapshot</p>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
        <div className="flex gap-3 justify-between items-center flex-wrap">
          <h2 className="font-semibold flex items-center gap-2">{status?.serviceHealthy ? <CheckCircle2 className="text-emerald-600" /> : <AlertTriangle className="text-amber-600" />} Live backend check</h2>
          <button type="button" disabled={working} onClick={() => { void refresh(); }} className="px-4 py-2 rounded-lg bg-slate-950 text-white text-sm font-semibold disabled:opacity-60 flex gap-2 items-center">
            <RefreshCw size={16} className={working ? 'animate-spin' : ''} /> Refresh verification
          </button>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-3">{status?.message || 'Checking AppDeploy...'}</p>
        {status && <p className="text-xs text-slate-500 mt-1">Last checked: {status.checkedAt}</p>}
      </div>
      <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-5">
        <h2 className="font-bold text-amber-950 dark:text-amber-200 flex gap-2"><AlertTriangle size={18} /> A provider directory is not a source audit</h2>
        <p className="mt-2 text-sm text-amber-950 dark:text-amber-200">
          The imported Google AI Studio source mixes registry entries, planning assumptions and generated account fields. Do not treat an unverified fleet, equipment age, grant, clinical outcome, staff name or hospital reference as established fact. Use source-specific evidence before contacting accounts.
        </p>
      </div>
    </section>
  );
};
