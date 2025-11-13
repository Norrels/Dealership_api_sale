import { Elysia } from "elysia";
import { VehicleService } from "../application/service/vehicleService";
import { VehicleRepositoryAdapter } from "../infrastructure/adapters/vehicleRepositoryAdapter";
import { SaleRepositoryAdapter } from "../infrastructure/adapters/saleRepositoryAdapter";
import { WebhookAdapter } from "../infrastructure/adapters/webhookAdapter";
import { SaleService } from "../application/service/saleService";
import { CreateSaleDTO } from "../application/dto/saleDTO";


export function createTestApp() {
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
    .post(
      "/api/v1/sales/",
      async ({ body }) => {
        await saleService.createSale(body);
        return { message: "ok" };
      },
      {
        body: CreateSaleDTO,
      }
    )
    .get("/api/v1/sales/available", async () => {
      const vehicles = await vehicleService.getAllAvailableVehicles();
      return {
        data: vehicles,
      };
    })
    .get("/api/v1/sales/sold", async () => {
      return await saleService.getAllVehiclesSold();
    })
    .get("/api/v1/sales/health", () => "ok");

  return { app, saleService, vehicleService, vehicleRepository };
}


export async function makeRequest(
  app: Elysia,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: any
) {
  const request = new Request(`http://localhost${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return app.handle(request);
}


export function createMockVehicleServer(vehicles: any[] = []) {
  const app = new Elysia()
    .get("/vehicles", () => vehicles)
    .get("/vehicles/:id", ({ params }) => {
      const vehicle = vehicles.find((v) => v.id === params.id);
      if (!vehicle) {
        return new Response("Not Found", { status: 404 });
      }
      return vehicle;
    })
    .post("/vehicles/webhook", () => ({ message: "ok" }));

  return app;
}
