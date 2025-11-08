import { VehicleRepository } from "../../domain/ports/out/vehicleRepositoryPort";
import { Vehicle } from "../../domain/models/vehicle";
import { logger } from "../../config/logger";

export class VehicleRepositoryAdapter implements VehicleRepository {
  private cache: Map<string, Vehicle> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000;
  private readonly API_URL = "http://localhost:3000/vehicles?isSold=false";

  async getAllAvailableVehicles(): Promise<Vehicle[]> {
    const now = Date.now();

    if (this.cache.size > 0 && now - this.cacheTimestamp < this.CACHE_TTL) {
      logger.info(
        { cacheSize: this.cache.size },
        "Retornando veículos do cache local"
      );
      return Array.from(this.cache.values());
    }

    await this.refreshCache();
    return Array.from(this.cache.values());
  }

  async getVehicleById(id: string): Promise<Vehicle | undefined> {
    const now = Date.now();

    if (this.cache.size === 0 || now - this.cacheTimestamp >= this.CACHE_TTL) {
      await this.refreshCache();
    }

    const vehicle = this.cache.get(id);

    if (vehicle) {
      logger.info({ vehicleId: id }, "Veículo encontrado no cache");
    } else {
      logger.warn({ vehicleId: id }, "Veículo não encontrado no cache");
    }

    return vehicle;
  }

  async refreshCache(): Promise<void> {
    try {
      logger.info({ url: this.API_URL }, "Buscando veículos do endpoint");
      const response = await fetch(this.API_URL);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const vehicles: Vehicle[] = await response.json();

      this.cache.clear();
      vehicles.forEach((vehicle) => {
        this.cache.set(vehicle.id, vehicle);
      });

      this.cacheTimestamp = Date.now();

      logger.info({ count: vehicles.length }, "Cache atualizado com sucesso");
    } catch (error) {
      logger.error({ error, url: this.API_URL }, "Erro ao buscar veículos");

      if (this.cache.size > 0) {
        logger.warn("Mantendo cache expirado devido a erro na API");
      } else {
        throw error;
      }
    }
  }

  clearCache(): void {
    this.cache.clear();
    this.cacheTimestamp = 0;
    logger.info("Cache limpo manualmente");
  }
}
