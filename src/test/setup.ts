import { beforeAll } from "bun:test";
import { config } from "../config/env";

beforeAll(() => {
  config.LOG_LEVEL = "silent";

  if (!config.DATABASE_URL) {
    console.warn(
      "DATABASE_URL não configurada. Testes de integração podem falhar."
    );
    console.warn(
      "Configure DATABASE_URL ou use um banco de teste (ex: PostgreSQL no Docker)"
    );
  }
});
