import {database} from './server';
import {ensureTenancy} from './tenancy';
export async function ensureHostRequests(){
 await ensureTenancy();
 await database().batch([
  database().prepare("CREATE TABLE IF NOT EXISTS host_requests(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL,whatsapp TEXT NOT NULL,property_count INTEGER NOT NULL,comments TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',created_at INTEGER NOT NULL,reviewed_at INTEGER,reviewed_by TEXT,decision_token TEXT,reason TEXT NOT NULL DEFAULT '',invitation_id TEXT,ip_hash TEXT)"),
  database().prepare("CREATE UNIQUE INDEX IF NOT EXISTS host_requests_pending_email ON host_requests(email) WHERE status='pending'"),
  database().prepare('CREATE INDEX IF NOT EXISTS host_requests_created ON host_requests(created_at)'),
 ]);
}
export type HostRequest={id:string;name:string;email:string;whatsapp:string;property_count:number;comments:string;status:string;created_at:number;reviewed_at:number|null;reason:string;invitation_id:string|null};
