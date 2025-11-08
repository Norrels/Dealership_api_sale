import { VehicleRepository } from "../../domain/ports/out/vehicleRepositoryPort";
import { Vehicle } from "../../domain/models/vehicle";

export class VehicleRepositoryAdapter implements VehicleRepository {
  private cache: Vehicle[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000;
  private readonly API_URL = "http://localhost:3000/vehicles";

  async getAllAvailableVehicles(): Promise<Vehicle[]> {
    const now = Date.now();

    if (this.cache && now - this.cacheTimestamp < this.CACHE_TTL) {
      console.log("Retornando veículos do cache local");
      return this.cache;
    }

    try {
      console.log("Buscando veículos do endpoint:", this.API_URL);
      const response = await fetch(this.API_URL);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const vehicles: Vehicle[] = await response.json();

      this.cache = vehicles;
      this.cacheTimestamp = now;

      console.log(`Cache atualizado com ${vehicles.length} veículos`);
      return vehicles;
    } catch (error) {
      console.error("Erro ao buscar veículos:", error);

      if (this.cache) {
        console.log("Retornando cache expirado devido a erro na API");
        return this.cache;
      }

      throw error;
    }
  }

  clearCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
    console.log("Cache limpo");
  }
}
