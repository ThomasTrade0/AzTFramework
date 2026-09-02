import { createServer as createNodeServer, type Server } from "node:http";
import type { Router } from "./router.js";

/** Wraps a {@link Router} into a listenable Node `http.Server`. */
export function createServer(router: Router): Server {
  return createNodeServer((req, res) => {
    void router.handle(req, res);
  });
}
