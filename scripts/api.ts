import * as dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app";

const PORT = Number(process.env.PORT || 3001);
const app = createApp();

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
