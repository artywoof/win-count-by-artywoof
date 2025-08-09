import { serve } from "bun";
import { Database } from "bun:sqlite";

const SECRET = process.env.LICENSE_SECRET || "CHANGE_ME_SECRET";
const DB_PATH = process.env.LICENSE_DB || "server/license.db";

const db = new Database(DB_PATH);
db.exec(`
CREATE TABLE IF NOT EXISTS licenses (
  license_key TEXT PRIMARY KEY,
  machine_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
`);

async function jsonSigned(data: any): Promise<Response> {
  const body = JSON.stringify(data);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const sigHex = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return new Response(body, {
    headers: {
      "Content-Type": "application/json",
      "X-Signature": sigHex,
      "Cache-Control": "no-store",
    },
  });
}

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (req.method === "POST" && url.pathname === "/verify-license") {
    try {
      // Read raw body once and normalize
      const raw = await req.text();
      let body: any = {};
      try { body = JSON.parse(raw || '{}'); } catch {}
      if ((!body.license_key && !body.licenseKey) || (!body.machine_id && !body.machineId)) {
        const params = new URLSearchParams(raw || '');
        if (params && Array.from(params.keys()).length > 0) {
          body = Object.fromEntries(params.entries());
        }
      }
      const lk = body.license_key || body.licenseKey || body['license-key'];
      const mid = body.machine_id || body.machineId || body['machine-id'];
      if (!lk || !mid) {
        return jsonSigned({ success: false, error: "invalid_payload" });
      }
      let row: any;
      try {
        row = db
          .query("SELECT license_key, machine_id, status, expires_at FROM licenses WHERE license_key = ?")
          .get(lk);
      } catch (e) {
        return jsonSigned({ success: false, error: "db_error", detail: String(e) });
      }
      const now = Math.floor(Date.now() / 1000);
      const valid = !!row && row.machine_id === mid && row.status === "active" && row.expires_at > now;
      return jsonSigned({ success: valid, status: valid ? "valid" : (!row ? "not_found" : "mismatch_or_expired") });
    } catch (e) {
      return jsonSigned({ success: false, error: "server_error", detail: String(e) });
    }
  }

  if (req.method === "POST" && url.pathname === "/heartbeat") {
    try {
      const { license_key, machine_id, timestamp } = await req.json();
      if (!license_key || !machine_id || !timestamp) {
        return jsonSigned({ success: false, error: "invalid_payload" });
      }
      const row = db
        .query(
          "SELECT license_key, machine_id, status, expires_at FROM licenses WHERE license_key = ?"
        )
        .get(license_key) as { license_key: string; machine_id: string; status: string; expires_at: number } | undefined;

      const now = Math.floor(Date.now() / 1000);
      const valid = !!row && row.machine_id === machine_id && row.status === "active" && row.expires_at > now;
      return jsonSigned({ success: valid, status: valid ? "ok" : "expired_or_invalid" });
    } catch (e) {
      return jsonSigned({ success: false, error: "server_error" });
    }
  }

  if (req.method === "POST" && url.pathname === "/admin/create") {
    const auth = req.headers.get("Authorization");
    if (auth !== `Bearer ${SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }
    try {
      const { license_key, machine_id, duration_days = 30 } = await req.json();
      if (!license_key || !machine_id) return jsonSigned({ success: false, error: "invalid_payload" });
      const now = Math.floor(Date.now() / 1000);
      const expires = now + Math.floor(duration_days * 86400);
      db.query(
        "INSERT INTO licenses (license_key, machine_id, status, expires_at, created_at) VALUES (?, ?, 'active', ?, ?) ON CONFLICT(license_key) DO UPDATE SET machine_id = excluded.machine_id, status = 'active', expires_at = excluded.expires_at"
      ).run(license_key, machine_id, expires, now);
      return jsonSigned({ success: true });
    } catch (e) {
      return jsonSigned({ success: false, error: "server_error" });
    }
  }

  if (req.method === "GET" && url.pathname === "/debug/licenses") {
    try {
      const rows = db.query("SELECT license_key, machine_id, status, expires_at, created_at FROM licenses").all();
      return jsonSigned({ success: true, rows });
    } catch (e) {
      return jsonSigned({ success: false, error: "db_error", detail: String(e) });
    }
  }

  return new Response("Not found", { status: 404 });
}

serve({ port: 8765, fetch: handler });
console.log("🔐 License server listening on http://127.0.0.1:8765");



