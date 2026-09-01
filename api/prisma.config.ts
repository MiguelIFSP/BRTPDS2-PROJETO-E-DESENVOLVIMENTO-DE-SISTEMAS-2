import { definePrismaConfig } from "prisma/config";
import { env } from "process";

export default definePrismaConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env.DATABASE_URL
  },
  skills: {
    agents: ["claude", "cursor", "agents", "devin"],
  },
});