import { VehicleRepositoryPort } from "../../domain/ports/out/vehicleRepositoryPort";
import { Vehicle, VehicleResponse } from "../../domain/models/vehicle";
import { logger } from "../../config/logger";
import { config } from "../../config/env";

export class VehicleRepositoryAdapter implements VehicleRepositoryPort {
  private cache: Map<string, VehicleResponse> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000;
  private readonly API_URL = config.VEHICLE_SERVICE_URL + "?isSold=false";

  async getAllAvailableVehicles(): Promise<VehicleResponse[]> {
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

  async getVehicleById(id: string): Promise<VehicleResponse | undefined> {
    logger.info(
      { vehicleId: id },
      "Buscando veículo da API para evitar conflitos"
    );

    try {
      const response = await fetch(`http://localhost:3000/vehicles/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          logger.warn({ vehicleId: id }, "Veículo não encontrado na API");
          return undefined;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const vehicle: VehicleResponse = await response.json();
      logger.info({ vehicleId: id }, "Veículo encontrado na API");

      return vehicle;
    } catch (error) {
      logger.error({ error, vehicleId: id }, "Erro ao buscar veículo da API");
      throw error;
    }
  }

  async refreshCache(): Promise<void> {
    try {
      logger.info({ url: this.API_URL }, "Buscando veículos do endpoint");
      const response = await fetch(this.API_URL);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const vehicles: VehicleResponse[] = await response.json();

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
