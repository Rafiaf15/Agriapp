import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, Fields, Files } from 'formidable';
import fs from 'fs';

const BACKEND_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://157.66.34.203/agriapp/api/web/v1';

function buildTargetUrl(pathSegments: string[] | string, query: any) {
  const path = Array.isArray(pathSegments) ? pathSegments.join('/') : String(pathSegments || '');
  const url = new URL(`${BACKEND_BASE}/${path}`);
  for (const key of Object.keys(query || {})) {
    if (key === 'path') continue;
    const val = query[key];
    if (Array.isArray(val)) {
      val.forEach((v) => url.searchParams.append(key, String(v)));
    } else if (val != null) {
      url.searchParams.append(key, String(val));
    }
  }
  return url.toString();
}

// Read raw body from request stream (used for non-multipart)
function getRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Parse multipart form with formidable
function parseForm(req: NextApiRequest): Promise<{ fields: Fields; files: Files }> {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ keepExtensions: true, multiples: true });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const pathArr = req.query.path || [];
    const target = buildTargetUrl(pathArr as string[] | string, req.query);

    console.log(`🔥 PROXY [${req.method}] ${req.url} → ${target}`);

    const contentType = (req.headers['content-type'] || '').toString();
    const isMultipart = contentType.includes('multipart/form-data');

    // ── Build forward headers ──────────────────────────────────────
    const forwardHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers)) {
      const key = k.toLowerCase();
      if (!v) continue;
      if (['host', 'origin', 'referer', 'connection', 'content-length'].includes(key)) continue;
      // Skip content-type for multipart (fetch will set it with boundary)
      if (isMultipart && key === 'content-type') continue;
      forwardHeaders[key] = Array.isArray(v) ? v.join(',') : String(v);
    }

    // ── Build body ─────────────────────────────────────────────────
    let fetchBody: any = undefined;

    if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
      if (isMultipart) {
        // Parse multipart and rebuild as FormData
        const { fields, files } = await parseForm(req);
        const fd = new (globalThis as any).FormData();

        for (const [key, val] of Object.entries(fields)) {
          const vals = Array.isArray(val) ? val : [val];
          for (const v of vals) {
            if (v != null) fd.append(key, v);
          }
        }

        for (const [key, fileArr] of Object.entries(files)) {
          const fileList = Array.isArray(fileArr) ? fileArr : [fileArr];
          for (const f of fileList) {
            if (!f) continue;
            const fileBuffer = fs.readFileSync(f.filepath);
            const blob = new Blob([fileBuffer], { type: f.mimetype || 'application/octet-stream' });
            fd.append(key, blob, f.originalFilename || 'file');
            try { fs.unlinkSync(f.filepath); } catch {}
          }
        }

        fetchBody = fd;
      } else {
        // For JSON, urlencoded, etc: forward raw body as-is
        const rawBody = await getRawBody(req);
        fetchBody = rawBody.length > 0 ? rawBody : undefined;
      }
    }

    // ── Forward to backend ─────────────────────────────────────────
    const resp = await fetch(target, {
      method: req.method,
      headers: forwardHeaders,
      body: fetchBody,
      cache: "no-store", // Prevent Next.js from caching API responses
    });

    // ── Return response ────────────────────────────────────────────
    const buffer = Buffer.from(await resp.arrayBuffer());
    
    // Log response for POST requests (useful for debugging saves)
    if (req.method === 'POST') {
      console.log(`✅ PROXY RESPONSE [${resp.status}]: ${buffer.toString('utf8').substring(0, 300)}`);
    }

    res.status(resp.status);
    const respCT = resp.headers.get('content-type');
    if (respCT) res.setHeader('content-type', respCT);

    res.send(buffer);
  } catch (err: any) {
    console.error('proxy error', err);
    res.status(500).json({ ok: false, message: err?.message || 'Proxy error' });
  }
}

export const config = {
  api: {
    // Disable Next.js body parsing so we can handle raw streams & multipart
    bodyParser: false,
  },
};
