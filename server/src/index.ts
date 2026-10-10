import { buildApp } from './app.js';
import { JobService } from './services/jobService.js';

const app = buildApp();
const PORT = Number(process.env.PORT) || 5000;

async function start() {
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`=======================================================`);
    console.log(` Mall Management System (MMS) API Server Running`);
    console.log(` Port: ${PORT}`);
    console.log(` REST API: http://localhost:${PORT}/api/v1`);
    console.log(` Swagger Docs: http://localhost:${PORT}/api/docs`);
    console.log(` Health Check: http://localhost:${PORT}/health`);
    console.log(`=======================================================`);

    // Run initial background checks
    try {
      const results = await JobService.runAutomatedChecks();
      console.log('Initial background checks completed:', results);
    } catch (err) {
      console.error('Failed to run initial checks:', err);
    }

    // Schedule background checks every 10 minutes
    setInterval(async () => {
      try {
        await JobService.runAutomatedChecks();
      } catch (err) {
        console.error('Automated check run error:', err);
      }
    }, 10 * 60 * 1000);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
