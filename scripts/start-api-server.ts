import { createApp } from "./app";

async function main() {
  const app = await createApp();
  const port = process.env.PORT || 3001;

  app.listen(port, () => {
    console.log(`API server running on http://localhost:${port}`);
    console.log(`Swagger docs: http://localhost:${port}/api/docs`);
  });
}

main().catch(console.error);
