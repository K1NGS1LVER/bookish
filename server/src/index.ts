import { createApp } from "./app";
import { openDb } from "./db";

const PORT = Number(process.env.PORT) || 3001;

const db = openDb();
createApp(db).listen(PORT, () => {
  console.log(`Bookish API listening on http://localhost:${PORT}`);
});
