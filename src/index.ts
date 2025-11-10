import { Elysia } from "elysia";
import { VehicleService } from "./application/service/vehicleService";
import { VehicleRepositoryAdapter } from "./infrastructure/adapters/vehicleRepositoryAdapter";
import { WebhookAdapter } from "./infrastructure/adapters/webhookAdapter";
import { logger } from "./config/logger";
import { CreateSaleDTO } from "./application/dto/saleDTO";
import { SaleRepositoryAdapter } from "./infrastructure/adapters/saleRepositoryAdapter";
import { SaleService } from "./application/service/saleService";
import { openapiConfig } from "./config/openapi";

const vehicleRepository = new VehicleRepositoryAdapter();
const vehicleService = new VehicleService(vehicleRepository);

const saleRepository = new SaleRepositoryAdapter();
const webhookAdapter = new WebhookAdapter();
const saleService = new SaleService(
  saleRepository,
  vehicleRepository,
  webhookAdapter
);

const app = new Elysia({ prefix: "/api/v1/sales" })
  .use(openapiConfig)
  .post(
    "/",
    async ({ body }) => {
      await saleService.createSale(body);
      return { message: "ok" };
    },
    {
      body: CreateSaleDTO,
      detail: {
        tags: ["Sales"],
        summary: "Create a new vehicle sale",
        description: "Returns 'ok' if the service is running",
      },
    }
  )
  .get(
    "/available",
    async () => {
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
    },
    {
      detail: {
        tags: ["Vehicles"],
        summary: "Get all available vehicles",
        description: "Returns a list of all available vehicles for sale",
      },
    }
  )
  .get(
    "/sold",
    async () => {
      return await saleService.getAllVehiclesSold();
    },
    {
      detail: {
        tags: ["Sales"],
        summary: "Get all sold vehicles",
        description: "Returns a list of all sold vehicles",
      },
    }
  )
  .get("/health", () => "ok", {
    detail: {
      tags: ["Health"],
      summary: "Health check",
      description: "Returns 'ok' if the service is running",
    },
  })
  .listen(3001);

logger.info(
  { host: app.server?.hostname, port: app.server?.port },
  "Servidor Elysia iniciado"
);
