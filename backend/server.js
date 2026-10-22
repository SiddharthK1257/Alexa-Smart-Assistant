// Universal entrypoint shim for Render when Root Directory is 'backend' and Start Command is 'node server.js'
import('./dist/server.js').catch((err) => {
  console.error('Failed to launch backend server from backend shim:', err);
  process.exit(1);
});
