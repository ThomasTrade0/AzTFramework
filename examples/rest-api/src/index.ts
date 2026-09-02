import { buildApp } from "./app.js";

const { server, env, logger } = buildApp();

server.listen(env.PORT, () => {
  logger.info(`rest-api-example listening on http://localhost:${env.PORT}`);
});
