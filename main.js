import { setupDatabase } from "./tools/database.js";
import { app } from "./server.js";
const port = 8000;
//initialise the database tables
setupDatabase();
console.log(`🚀 UniConnect Deno Server is running on http://localhost:${port}`);
await app.listen({ port });
