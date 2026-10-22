// Universal entrypoint shim for Render when Start Command is 'node server.js' from root
import('./backend/dist/server.js').catch((err) => {
  console.error('Failed to launch backend server from root shim:', err);
  process.exit(1);
});
