import { Elysia } from "elysia";
import { VehicleService } from "./application/service/vehicleService";
import { VehicleRepositoryAdapter } from "./infrastructure/adapters/vehicleRepositoryAdapter";
import { logger } from "./config/logger";

const vehicleRepository = new VehicleRepositoryAdapter();
const vehicleService = new VehicleService(vehicleRepository);

const app = new Elysia({ prefix: "/vehicles" })
  .post("/:vehicleId", () => {
    return "Vehicle created";
  })
  .get("/available", async () => {
    try {
      logger.info("Requisição recebida para buscar veículos disponíveis");
      const vehicles = await vehicleService.getAllAvailableVehicles();
      logger.info({ count: vehicles.length }, "Veículos retornados com sucesso");
      return {
        data: vehicles,
      };
    } catch (error) {
      logger.error({ error }, "Erro ao processar requisição de veículos");
      return {
        error: error instanceof Error ? error.message : "Erro ao buscar veículos",
      };
    }
  })
  .get("/sold", () => {
    return `Details of vehicle with ID:`;
  })
  .get("/", () => "Hello Elysia")
  .listen(3001);

logger.info(
  { host: app.server?.hostname, port: app.server?.port },
  "Servidor Elysia iniciado"
);
