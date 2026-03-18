import { setupDatabase } from "./tools/database.ts";
import { app } from "./server.ts";
const port = 8000;
//initialise the database tables
setupDatabase();
console.log(`🚀 UniConnect Deno Server is running on http://localhost:${port}`);
await app.listen({ port });
