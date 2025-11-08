import { Elysia } from "elysia";
import { VehicleService } from "./application/service/vehicleService";
import { VehicleRepositoryAdapter } from "./infrastructure/adapters/vehicleRepositoryAdapter";

const vehicleRepository = new VehicleRepositoryAdapter();
const vehicleService = new VehicleService(vehicleRepository);

const app = new Elysia({ prefix: "/vehicles" })
  .post("/:vehicleId", () => {
    return "Vehicle created";
  })
  .get("/available", async () => {
    try {
      const vehicles = await vehicleService.getAllAvailableVehicles();
      return {
        data: vehicles,
      };
    } catch (error) {
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

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
