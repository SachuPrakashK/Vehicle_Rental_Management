import { app } from './app.js';
import { env } from './config/env.js';
import { pool } from './config/database.js';
const server = app.listen(env.PORT, () => {
  process.stdout.write('Fleetline API listening on port ' + env.PORT + '\n');
});
async function shutdown() {
  server.close();
  await pool.end();
}
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
