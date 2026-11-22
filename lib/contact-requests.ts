import {database} from './server';
import {ensureTenancy} from './tenancy';
export async function ensureContactRequests(){
 await ensureTenancy();
 await database().batch([
  database().prepare('CREATE TABLE IF NOT EXISTS contact_requests(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL,phone TEXT NOT NULL,message TEXT NOT NULL,created_at INTEGER NOT NULL,ip_hash TEXT)'),
  database().prepare('CREATE INDEX IF NOT EXISTS contact_requests_created ON contact_requests(created_at)'),
 ]);
}
