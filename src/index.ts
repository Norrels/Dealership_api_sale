import { Elysia, t } from "elysia";
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

const app = new Elysia()
  .use(openapiConfig)
  .get("/health", () => "ok", {
    detail: {
      tags: ["Health"],
      summary: "Health check",
      description: "Returns 'ok' if the service is running",
    },
  })
  .group("/api/v1/sales", (app) =>
    app
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
        async ({ query }) => {
          try {
            logger.info("Requisição recebida para buscar veículos disponíveis");
            const sortByPrice = query.sortByPrice as "asc" | "desc" | undefined;
            const vehicles = await vehicleService.getAllAvailableVehicles(sortByPrice);
            logger.info(
              { count: vehicles.length, sortByPrice },
              "Veículos retornados com sucesso"
            );
            return {
              data: vehicles,
            };
          } catch (error) {
            logger.error({ error }, "Erro ao processar requisição de veículos");
            return {
              error:
                error instanceof Error
                  ? error.message
                  : "Erro ao buscar veículos",
            };
          }
        },
        {
          query: t.Object({
            sortByPrice: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
          }),
          detail: {
            tags: ["Vehicles"],
            summary: "Get all available vehicles",
            description: "Returns a list of all available vehicles for sale. Use sortByPrice=asc for cheapest first or sortByPrice=desc for most expensive first.",
          },
        }
      )
      .get(
        "/sold",
        async ({ query }) => {
          const sortByPrice = query.sortByPrice as "asc" | "desc" | undefined;
          return await saleService.getAllVehiclesSold(sortByPrice);
        },
        {
          query: t.Object({
            sortByPrice: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
          }),
          detail: {
            tags: ["Vehicles"],
            summary: "Get all sold vehicles",
            description: "Returns a list of all sold vehicles. Use sortByPrice=asc for cheapest first or sortByPrice=desc for most expensive first.",
          },
        }
      )
  )
  .listen(3001);

logger.info(
  { host: app.server?.hostname, port: app.server?.port },
  "Servidor Elysia iniciado"
);
