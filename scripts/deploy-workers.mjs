import { spawnSync } from "node:child_process";
import process from "node:process";

const wrangler = "node_modules/wrangler/bin/wrangler.js";
const config = "dist/server/wrangler.json";

const deployments = [
  [
    "deploy",
    "--config",
    config,
    "--env=",
  ],
  [
    "deploy",
    "--config",
    config,
    "--env",
    "admin",
    "--keep-vars",
    "--var",
    "ADMIN_EMAIL:swapnil690123@gmail.com",
    "--var",
    "GOOGLE_CLIENT_ID:920464920544-eiedfl354bjk5nc4i945c9r0r0t6ch57.apps.googleusercontent.com",
    "--var",
    "OWNER_WHATSAPP:917083834078",
  ],
];

for (const args of deployments) {
  const result = spawnSync(process.execPath, [wrangler, ...args], {
    stdio: "inherit",
    env: process.env,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
