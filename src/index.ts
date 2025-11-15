import { Elysia, t } from "elysia";
import { VehicleService } from "./application/service/vehicleService";
import { VehicleRepositoryAdapter } from "./infrastructure/adapters/vehicleRepositoryAdapter";
import { WebhookAdapter } from "./infrastructure/adapters/webhookAdapter";
import { logger } from "./config/logger";
import { CreateSaleDTO } from "./application/dto/saleDTO";
import { PaymentWebhookDTO } from "./application/dto/paymentWebhookDTO";
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
      .get(
        "/",
        async ({ query }) => {
          try {
            if (!query.cpf) {
              return {
                error: "CPF parameter is required",
              };
            }

            const sales = await saleService.getSalesByCPF(query.cpf);
            return {
              data: sales.map(sale => ({
                id: sale.id,
                vehicleId: sale.vehicleId,
                customerName: sale.customerName,
                customerCPF: sale.customerCPF.getFormatted(),
                make: sale.make,
                model: sale.model,
                year: sale.year,
                vin: sale.vin,
                color: sale.color,
                saleDate: sale.saleDate,
                price: sale.price,
                status: sale.status,
              })),
            };
          } catch (error) {
            logger.error({ error }, "Erro ao buscar vendas por CPF");
            return {
              error: error instanceof Error ? error.message : "Erro ao buscar vendas",
            };
          }
        },
        {
          query: t.Object({
            cpf: t.String({
              minLength: 11,
              description: "Customer CPF (with or without formatting)",
            }),
          }),
          detail: {
            tags: ["Sales"],
            summary: "Get sales by customer CPF",
            description: "Returns all sales for a specific customer CPF. Accepts CPF with or without formatting (e.g., '12345678909' or '123.456.789-09').",
          },
        }
      )
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
            description: "Returns a list of all sold vehicles with status 'completed' (payment approved). Excludes pending and canceled sales. Use sortByPrice=asc for cheapest first or sortByPrice=desc for most expensive first.",
          },
        }
      )
      .post(
        "/payment-webhook",
        async ({ body }) => {
          try {
            logger.info(
              { saleId: body.saleId, paymentStatus: body.paymentStatus },
              "Webhook de pagamento recebido"
            );
            await saleService.processPayment(body.saleId, body.paymentStatus);
            return {
              message: "Pagamento processado com sucesso",
              saleId: body.saleId,
              status: body.paymentStatus === "approved" ? "completed" : "canceled"
            };
          } catch (error) {
            logger.error({ error, body }, "Erro ao processar webhook de pagamento");
            throw error;
          }
        },
        {
          body: PaymentWebhookDTO,
          detail: {
            tags: ["Sales"],
            summary: "Payment webhook",
            description: "Receives payment status updates for sales. Updates sale status and notifies vehicle service when payment is approved.",
          },
        }
      )
  )
  .listen(3001);

logger.info(
  { host: app.server?.hostname, port: app.server?.port },
  "Servidor Elysia iniciado"
);
