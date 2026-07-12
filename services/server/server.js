
import { createServer } from "node:http";
import { createRestApp } from "./src/rest.js";
import { handleMcpRequest } from "./src/mcp.js";

const port = Number(process.env.PORT ?? 8787);
const app = createRestApp();

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  if (url.pathname === "/mcp") {
    await handleMcpRequest(req, res);
    return;
  }
  app(req, res);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Dava OS API: http://localhost:${port}`);
  console.log(`Dava OS MCP: http://localhost:${port}/mcp`);
});
