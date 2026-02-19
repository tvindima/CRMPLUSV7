'use client';

import { useEffect, useMemo, useState } from 'react';
import { BackofficeLayout } from '@/components/BackofficeLayout';

type Provider = {
  key: string;
  label: string;
  supports_feed: boolean;
  supports_api: boolean;
};

type Account = {
  id: number;
  provider: string;
  mode: 'feed' | 'api';
  is_active: boolean;
  has_feed_token?: boolean;
  feed_endpoint?: string | null;
  credentials_json?: Record<string, unknown> | null;
  settings_json?: Record<string, unknown> | null;
  updated_at?: string | null;
};

type Job = {
  id: number;
  property_id: number;
  provider: string;
  action: string;
  status: string;
  attempt_count: number;
  last_error?: string | null;
  created_at: string;
};

type Listing = {
  id: number;
  property_id: number;
  provider: string;
  status: string;
  external_listing_id?: string | null;
  last_error?: string | null;
  updated_at?: string | null;
};

const defaultProviders = ['imovirtual', 'idealista', 'olx', 'casasapo'];

export default function PortalsPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>('');

  const [propertyId, setPropertyId] = useState('');
  const [action, setAction] = useState<'publish' | 'unpublish' | 'refresh'>('publish');
  const [selectedProviders, setSelectedProviders] = useState<string[]>(['imovirtual', 'idealista']);

  const providerKeys = useMemo(() => {
    if (providers.length > 0) return providers.map((p) => p.key);
    return defaultProviders;
  }, [providers]);

  async function safeJson(res: Response) {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { error: text || 'Erro inesperado' };
    }
  }

  async function loadAll() {
    const [pRes, aRes, jRes, lRes] = await Promise.all([
      fetch('/api/portals/providers', { credentials: 'include' }),
      fetch('/api/portals/accounts', { credentials: 'include' }),
      fetch('/api/portals/jobs?limit=30', { credentials: 'include' }),
      fetch('/api/portals/listings', { credentials: 'include' }),
    ]);

    if (pRes.ok) setProviders(await pRes.json());
    if (aRes.ok) setAccounts(await aRes.json());
    if (jRes.ok) setJobs(await jRes.json());
    if (lRes.ok) setListings(await lRes.json());
  }

  useEffect(() => {
    loadAll().catch(() => setMessage('Falha ao carregar modulo de portais'));
  }, []);

  async function saveAccount(provider: string, mode: 'feed' | 'api', isActive: boolean) {
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch(`/api/portals/accounts/${provider}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ provider, mode, is_active: isActive, credentials_json: null, settings_json: null }),
      });
      const body = await safeJson(res);
      if (!res.ok) throw new Error(body?.error || 'Falha ao guardar conta do portal');
      setMessage(`Conta ${provider} atualizada`);
      await loadAll();
    } catch (err: any) {
      setMessage(err?.message || 'Erro ao guardar conta');
    } finally {
      setBusy(false);
    }
  }

  async function rotateToken(provider: string) {
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch(`/api/portals/accounts/${provider}/rotate-token`, {
        method: 'POST',
        credentials: 'include',
      });
      const body = await safeJson(res);
      if (!res.ok) throw new Error(body?.error || 'Falha ao rodar token');
      setMessage(`Token rodado para ${provider}. URL de feed (uma vez): ${body?.feed_url_once || '-'}`);
      await loadAll();
    } catch (err: any) {
      setMessage(err?.message || 'Erro ao rodar token');
    } finally {
      setBusy(false);
    }
  }

  async function queueSync() {
    const id = Number(propertyId);
    if (!id) {
      setMessage('Indica um Property ID valido');
      return;
    }

    setBusy(true);
    setMessage('');
    try {
      const res = await fetch(`/api/portals/properties/${id}/queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ providers: selectedProviders, action }),
      });
      const body = await safeJson(res);
      if (!res.ok) throw new Error(body?.error || 'Falha ao enfileirar sincronizacao');
      setMessage(`Jobs enfileirados: ${body?.queued_jobs ?? 0}`);
      await loadAll();
    } catch (err: any) {
      setMessage(err?.message || 'Erro ao enfileirar');
    } finally {
      setBusy(false);
    }
  }

  async function runPending() {
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch('/api/portals/jobs/run-pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ limit: 30 }),
      });
      const body = await safeJson(res);
      if (!res.ok) throw new Error(body?.error || 'Falha ao executar jobs pendentes');
      setMessage(`Processados ${body?.attempted ?? 0} jobs`);
      await loadAll();
    } catch (err: any) {
      setMessage(err?.message || 'Erro ao executar jobs');
    } finally {
      setBusy(false);
    }
  }

  function accountByProvider(provider: string) {
    return accounts.find((a) => a.provider === provider);
  }

  return (
    <BackofficeLayout title="Portais Imobiliarios">
      <div className="space-y-6">
        <div className="rounded-xl border border-[#23232B] bg-[#0F0F12] p-4">
          <h2 className="text-lg font-semibold text-white">Configuracao por portal</h2>
          <p className="mt-1 text-sm text-[#999]">Ativa feed por tenant sem quebrar o fluxo atual. API direta fica reservada para conector dedicado.</p>
          {message && <p className="mt-2 text-sm text-[#E10600]">{message}</p>}

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {providerKeys.map((provider) => {
              const acc = accountByProvider(provider);
              const mode = (acc?.mode || 'feed') as 'feed' | 'api';
              const isActive = Boolean(acc?.is_active);

              return (
                <div key={provider} className="rounded-lg border border-[#2A2A2E] bg-[#101013] p-3">
                  <p className="text-sm font-semibold text-white">{provider}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <select
                      defaultValue={mode}
                      onChange={(e) => saveAccount(provider, e.target.value as 'feed' | 'api', isActive)}
                      className="rounded border border-[#333] bg-[#17171A] px-2 py-1 text-sm text-white"
                    >
                      <option value="feed">feed</option>
                      <option value="api">api</option>
                    </select>
                    <button
                      disabled={busy}
                      onClick={() => saveAccount(provider, mode, !isActive)}
                      className="rounded border border-[#333] px-2 py-1 text-xs text-white hover:bg-[#1C1C20] disabled:opacity-50"
                    >
                      {isActive ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => rotateToken(provider)}
                      className="rounded border border-[#333] px-2 py-1 text-xs text-white hover:bg-[#1C1C20] disabled:opacity-50"
                    >
                      Rodar token
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-[#C5C5C5]">
                    Endpoint: {acc?.feed_endpoint || `/portals/feeds/${provider}.xml`} | Token: {acc?.has_feed_token ? 'configurado' : 'nao configurado'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-[#23232B] bg-[#0F0F12] p-4">
          <h2 className="text-lg font-semibold text-white">Publicacao manual</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            <input
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              placeholder="Property ID"
              className="rounded border border-[#333] bg-[#17171A] px-3 py-2 text-sm text-white"
            />
            <select
              value={action}
              onChange={(e) => setAction(e.target.value as 'publish' | 'unpublish' | 'refresh')}
              className="rounded border border-[#333] bg-[#17171A] px-3 py-2 text-sm text-white"
            >
              <option value="publish">publish</option>
              <option value="refresh">refresh</option>
              <option value="unpublish">unpublish</option>
            </select>
            <div className="col-span-2 flex flex-wrap gap-2">
              {providerKeys.map((provider) => {
                const checked = selectedProviders.includes(provider);
                return (
                  <label key={provider} className="flex items-center gap-1 rounded border border-[#333] px-2 py-1 text-xs text-white">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setSelectedProviders((prev) =>
                          prev.includes(provider) ? prev.filter((x) => x !== provider) : [...prev, provider]
                        );
                      }}
                    />
                    {provider}
                  </label>
                );
              })}
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              disabled={busy}
              onClick={queueSync}
              className="rounded bg-[#E10600] px-4 py-2 text-sm font-semibold text-white hover:bg-[#c00500] disabled:opacity-50"
            >
              Enfileirar
            </button>
            <button
              disabled={busy}
              onClick={runPending}
              className="rounded border border-[#333] px-4 py-2 text-sm text-white hover:bg-[#1C1C20] disabled:opacity-50"
            >
              Executar pendentes
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-[#23232B] bg-[#0F0F12] p-4">
            <h3 className="text-base font-semibold text-white">Ultimos Jobs</h3>
            <div className="mt-3 max-h-80 overflow-auto">
              <table className="w-full text-left text-xs text-[#C5C5C5]">
                <thead>
                  <tr className="text-[#999]">
                    <th className="py-1">ID</th>
                    <th>Imovel</th>
                    <th>Portal</th>
                    <th>Acao</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-t border-[#1f1f22]">
                      <td className="py-1">{job.id}</td>
                      <td>{job.property_id}</td>
                      <td>{job.provider}</td>
                      <td>{job.action}</td>
                      <td>{job.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-[#23232B] bg-[#0F0F12] p-4">
            <h3 className="text-base font-semibold text-white">Estado por listing</h3>
            <div className="mt-3 max-h-80 overflow-auto">
              <table className="w-full text-left text-xs text-[#C5C5C5]">
                <thead>
                  <tr className="text-[#999]">
                    <th className="py-1">Imovel</th>
                    <th>Portal</th>
                    <th>Status</th>
                    <th>External ID</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map((listing) => (
                    <tr key={listing.id} className="border-t border-[#1f1f22]">
                      <td className="py-1">{listing.property_id}</td>
                      <td>{listing.provider}</td>
                      <td>{listing.status}</td>
                      <td>{listing.external_listing_id || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </BackofficeLayout>
  );
}
