/**
 * Standalone AppDeploy API. No Google AI Studio, Firebase, Firestore, or Gemini runtime.
 * User-specific territory edits live in per-user AppDeploy database tables.
 * Public CMS NPPES data is queried directly; a geographic search link is NOT verification.
 */
import { createHash, randomUUID } from 'node:crypto';
import { ai, db, error, json, requireAuth, router } from '@appdeploy/sdk';

type Note = { id: string; date: string; notes: string; repName: string; meetingType: string; nextAction: string; dueDate: string };
type Overlay = {
  id?: string;
  agencyId: string;
  isBookmarked?: boolean;
  inDayRoute?: boolean;
  salesStage?: string;
  fieldNotes?: Note[];
  lastContactDate?: string;
  revision: string;
  updatedAt: string;
};

const tableFor = (userId: string) =>
  'territory_' + createHash('sha256').update(userId).digest('hex').slice(0, 40);
const customTableFor = (userId: string) =>
  'custom_' + createHash('sha256').update(userId).digest('hex').slice(0, 40);
const keyFor = (agencyId: string) =>
  createHash('sha256').update(agencyId).digest('hex');
const clean = (input: unknown, max = 160) =>
  typeof input === 'string' ? input.trim().slice(0, max) : '';
const normalizeName = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\b(inc|llc|the|corporation)\b/g, '').trim().replace(/\s+/g, ' ');

const userRoutes = {
  'GET /api/agency-state': [
    requireAuth(),
    async ({ user, query }: { user?: { userId: string }; query: Record<string, string> }) => {
      const table = tableFor(user!.userId);
      const nextToken = clean(query.nextToken, 4096);
      const page = await db.list<Overlay>(table, {
        limit: 100,
        ...(nextToken ? { nextToken } : {})
      });
      return json({
        records: page.items.map(({ id: _physicalId, ...record }) => record),
        nextToken: page.nextToken || null
      });
    }
  ],
  'PUT /api/agency-state': [
    requireAuth(),
    async ({ user, body }: { user?: { userId: string }; body: unknown }) => {
      const b = (body || {}) as Record<string, unknown>;
      const agencyId = clean(b.agencyId, 200);
      if (!agencyId || typeof b.agencyId !== 'string' || b.agencyId.length > 200) {
        return error('A valid provider ID is required', 400);
      }
      const table = tableFor(user!.userId);
      const id = keyFor(agencyId);
      const [existing] = await db.get<Overlay>(table, [id], { consistent: true });
      if (existing && existing.agencyId !== agencyId) return error('Provider ID conflict', 409);
      const changes: Partial<Overlay> = {};
      if (typeof b.isBookmarked === 'boolean') changes.isBookmarked = b.isBookmarked;
      if (typeof b.inDayRoute === 'boolean') changes.inDayRoute = b.inDayRoute;
      if (typeof b.salesStage === 'string') changes.salesStage = clean(b.salesStage, 90);
      if (typeof b.lastContactDate === 'string') changes.lastContactDate = clean(b.lastContactDate, 50);
      const rawNote = b.appendNote && typeof b.appendNote === 'object'
        ? b.appendNote as Record<string, unknown> : null;
      if (rawNote) {
        const noteId = clean(rawNote.id, 100);
        const text = clean(rawNote.notes || rawNote.content || rawNote.text, 2500);
        if (!noteId || !text) return error('A field note needs an ID and text', 400);
        const note: Note = { id: noteId, date: clean(rawNote.date, 50), notes: text,
          repName: clean(rawNote.repName, 120), meetingType: clean(rawNote.meetingType, 90),
          nextAction: clean(rawNote.nextAction, 1000), dueDate: clean(rawNote.dueDate, 50) };
        const already = existing?.fieldNotes || [];
        changes.fieldNotes = [note, ...already.filter(n => n.id !== noteId)].slice(0, 40);
        changes.lastContactDate = note.date || changes.lastContactDate;
      }
      if (!Object.keys(changes).length) return error('No supported changes supplied', 400);
      const next: Overlay = {
        ...existing,
        ...changes,
        agencyId,
        revision: randomUUID(),
        updatedAt: new Date().toISOString(),
      };
      if (!existing) {
        const [created] = await db.tx.add(table, [{ id, ...next }]);
        if (!created) return error('Concurrent update: reload this provider and retry', 409);
      } else {
        const [updated] = await db.tx.update(table, [{
          id,
          record: next,
          if: { revision: existing.revision }
        }], { patch: true });
        if (!updated) return error('Concurrent update: reload this provider and retry', 409);
      }
      return json({ saved: true, record: next });
    }
  ],
  'GET /api/custom-agencies': [
    requireAuth(),
    async ({ user, query }: { user?: { userId: string }; query: Record<string, string> }) => {
      const token = clean(query.nextToken, 4096);
      const result = await db.list<{ agencyId: string; agency: Record<string, unknown> }>(
        customTableFor(user!.userId), { limit: 80, ...(token ? { nextToken: token } : {}) });
      return json({ records: result.items.map(x => x.agency), nextToken: result.nextToken || null });
    }
  ],
  'POST /api/custom-agencies': [
    requireAuth(),
    async ({ user, body }: { user?: { userId: string }; body: unknown }) => {
      const obj = (body || {}) as Record<string, unknown>;
      const agency = obj.agency;
      if (!agency || typeof agency !== 'object' || Array.isArray(agency)) return error('Agency object required', 400);
      const a = agency as Record<string, unknown>;
      const agencyId = clean(a.id, 200);
      const name = clean(a.name, 180);
      const stateCode = clean(a.stateCode, 2).toUpperCase();
      if (!agencyId || !name || !/^[A-Z]{2}$/.test(stateCode)) return error('Valid agency ID, name and state required', 400);
      const safeAgency = JSON.parse(JSON.stringify(a));
      if (JSON.stringify(safeAgency).length > 100_000) return error('Agency record too large', 413);
      const table = customTableFor(user!.userId);
      const id = keyFor(agencyId);
      const [existing] = await db.get<{agencyId: string}>(table, [id], {consistent: true});
      if (existing) return error('Agency already exists. Edit its fields instead.', 409);
      const [created] = await db.tx.add(table, [{ id, agencyId, agency: safeAgency, createdAt: new Date().toISOString() }]);
      if (!created) return error('Concurrent agency creation. Reload first.', 409);
      return json({ saved: true, agencyId });
    }
  ]
};

async function npiLookup(params: URLSearchParams) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8500);
  try {
    const resp = await fetch('https://npiregistry.cms.hhs.gov/api/?' + params.toString(), {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });
    if (!resp.ok) throw new Error('CMS NPI registry did not respond');
    const data = await resp.json() as { results?: Array<Record<string, unknown>> };
    return Array.isArray(data.results) ? data.results : [];
  } finally {
    clearTimeout(timeout);
  }
}

const publicRoutes = {
  'GET /api/health': [async () => json({ ok: true, service: 'EMS & Fire Territory Intelligence', provider: 'AppDeploy' })],
  'POST /api/providers/verify-live': [async ({ body }: { body: unknown }) => {
    const b = (body || {}) as Record<string, unknown>;
    const agencyName = clean(b.agencyName);
    const city = clean(b.city, 80);
    const state = clean(b.stateCode, 2).toUpperCase();
    const zip = clean(b.zipCode, 5);
    if (!agencyName || !/^[A-Z]{2}$/.test(state)) return error('Agency name and state are required', 400);
    const params = new URLSearchParams({ version: '2.1', limit: '60', state });
    if (city) params.set('city', city);
    params.set('organization_name', '*' + agencyName.slice(0, 40) + '*');
    try {
      const results = await npiLookup(params);
      const exact = results.find(r => {
        const basic = r.basic as Record<string, unknown> | undefined;
        const name = clean(basic?.organization_name, 200);
        return Boolean(name) && normalizeName(name) === normalizeName(agencyName) && (!city || ((r.addresses as Array<Record<string, unknown>> | undefined) || []).some(a => clean(a.city).toLowerCase() === city.toLowerCase()));
      });
      const matches = results.slice(0, 10).map(r => ({
        npi: String(r.number || ''),
        name: clean((r.basic as Record<string, unknown> | undefined)?.organization_name, 200)
      }));
      if (!exact) return json({
        verified: false,
        verificationSource: 'No exact organization-name match in the federal NPPES result',
        allCityNpiProviders: matches,
        authorizedOfficial: null
      });
      const basic = (exact.basic || {}) as Record<string, unknown>;
      const addresses = (exact.addresses || []) as Array<Record<string, unknown>>;
      const addr = addresses.find(a => a.address_purpose === 'LOCATION') || addresses[0] || {};
      const fullAddress = [addr.address_1, addr.address_2, addr.city, addr.state, addr.postal_code]
        .filter(Boolean).map(String).join(', ');
      const officialName = [basic.authorized_official_first_name, basic.authorized_official_last_name].filter(Boolean).join(' ');
      const npi = String(exact.number || '');
      return json({
        verified: true,
        verificationSource: 'CMS NPPES API v2.1, exact organization-name match',
        legalOrganizationName: basic.organization_name || '',
        npiNumber: npi,
        nppesRegistryUrl: 'https://npiregistry.cms.hhs.gov/provider-view/' + encodeURIComponent(npi),
        address: fullAddress,
        zipCode: clean(addr.postal_code, 5) || zip,
        headquartersPhone: '',
        officialWebsite: '',
        googleMapsUri: 'https://www.openstreetmap.org/search?query=' + encodeURIComponent(fullAddress || agencyName),
        nppesOfficialName: officialName,
        nppesOfficialTitle: clean(basic.authorized_official_title_or_position, 120),
        authorizedOfficial: officialName ? {
          name: officialName, title: clean(basic.authorized_official_title_or_position, 120),
          phone: '', email: '', isVerifiedOfficial: true,
          verificationSource: 'CMS NPPES NPI #' + npi
        } : null,
        allCityNpiProviders: matches
      });
    } catch {
      return error('CMS NPPES lookup unavailable; no identity verification was performed', 503);
    }
  }],
  'POST /api/assistant/places': [async ({ body }: { body: unknown }) => {
    const b = (body || {}) as Record<string, unknown>;
    const location = [clean(b.city, 90), clean(b.state, 2)].filter(Boolean).join(', ');
    const query = clean(b.query, 140);
    const terms = [
      'Emergency hospitals and cardiac catheterization labs',
      'Fire station and headquarters',
      'Ambulance station and emergency medical services',
    ];
    return json({
      text: 'These are OpenStreetMap search links, not verified facilities. Check official health, fire and EMS registries before using them for account decisions.',
      mapsLinks: terms.map(t => ({ title: t, uri: 'https://www.openstreetmap.org/search?query=' +
        encodeURIComponent([query || t, location].filter(Boolean).join(', ')) })),
      verified: false
    });
  }]
};

export const handler = router({
  ...userRoutes,
  ...publicRoutes,
  'POST /api/assistant/chat': [
    requireAuth(),
    async ({ body }: { body: unknown }) => {
      const b = (body || {}) as Record<string, unknown>;
      const history = Array.isArray(b.messages) ? b.messages.slice(-12) : [];
      const messages = history
        .filter(x => x && typeof x === 'object')
        .map(x => ({
          role: (x.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
          content: clean(x.content, 2800)
        }))
        .filter(x => x.content);
      if (!messages.length) return error('A question is required', 400);
      const context = b.agencyContext && typeof b.agencyContext === 'object'
        ? b.agencyContext as Record<string, unknown> : {};
      const agencyText = JSON.stringify({
        name: clean(context.name), city: clean(context.city), state: clean(context.stateCode, 2),
        providerCategory: clean(context.providerCategory), npi: clean(context.npiNumber, 20)
      });
      const format = clean(b.format, 20);
      const system = `You are an EMS and fire sales research assistant. Never invent provider identities, equipment inventories, grant awards, medical outcome statistics or sourcing. Mark unknowns clearly, distinguish source-backed facts from estimates, and suggest specific follow-up research. No patient PHI. Format preference: ${format}. Agency metadata (unverified unless cited): ${agencyText}`;
      try {
        const result = await ai.generate({
          system,
          messages,
          thinkingMode: format === 'deep' ? 'DEEP' : 'FAST',
          maxTokens: format === 'short' ? 650 : 1400
        });
        return json({ content: result.text, provider: 'AppDeploy AI', verified: false });
      } catch {
        return error('Research assistant unavailable. Do not treat missing answers as evidence.', 503);
      }
    }
  ]
});
