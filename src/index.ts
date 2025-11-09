import { Elysia } from "elysia";
import { VehicleService } from "./application/service/vehicleService";
import { VehicleRepositoryAdapter } from "./infrastructure/adapters/vehicleRepositoryAdapter";
import { logger } from "./config/logger";
import { CreateSaleDTO } from "./application/dto/saleDTO";
import { SaleRepositoryAdapter } from "./infrastructure/adapters/saleRepositoryAdapter";
import { SaleService } from "./application/service/saleService";

const vehicleRepository = new VehicleRepositoryAdapter();
const vehicleService = new VehicleService(vehicleRepository);

const saleRepository = new SaleRepositoryAdapter();
const saleService = new SaleService(saleRepository, vehicleRepository);

const app = new Elysia({ prefix: "/api/v1/sales" })
  .post(
    "/",
    async ({ body }) => {
      await saleService.createSale(body);
    },
    {
      body: CreateSaleDTO,
    }
  )
  .get("/available", async () => {
    try {
      logger.info("Requisição recebida para buscar veículos disponíveis");
      const vehicles = await vehicleService.getAllAvailableVehicles();
      logger.info(
        { count: vehicles.length },
        "Veículos retornados com sucesso"
      );
      return {
        data: vehicles,
      };
    } catch (error) {
      logger.error({ error }, "Erro ao processar requisição de veículos");
      return {
        error:
          error instanceof Error ? error.message : "Erro ao buscar veículos",
      };
    }
  })
  .get("/sold", async () => {
    return await saleService.getAllVehiclesSold();
  })
  .get("/", () => "Hello Elysia")
  .listen(3001);

logger.info(
  { host: app.server?.hostname, port: app.server?.port },
  "Servidor Elysia iniciado"
);
