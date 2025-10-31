import { createApp } from "./app";
import { logger } from "./services/logger.service";

async function main() {
  const app = await createApp();
  const port = process.env.PORT || 3001;
  
  app.listen(port, () => {
    logger.info("API server started", {
      port,
      swaggerDocs: `http://localhost:${port}/api/docs`,
      metricsEndpoint: `http://localhost:${port}/api/metrics`,
      healthEndpoint: `http://localhost:${port}/api/health`,
    });
  });
}

main().catch((error) => {
  logger.error("Failed to start API server", error);
  process.exit(1);
});
