import { VehicleRepositoryPort } from "../../domain/ports/out/vehicleRepositoryPort";
import { Vehicle } from "../../domain/models/vehicle";

export class VehicleService {
  constructor(private vehicleRepository: VehicleRepositoryPort) {}

  async getAllAvailableVehicles(sortByPrice?: "asc" | "desc"): Promise<Vehicle[]> {
    const vehicles = await this.vehicleRepository.getAllAvailableVehicles();

    if (sortByPrice) {
      return this.sortVehiclesByPrice(vehicles, sortByPrice);
    }

    return vehicles;
  }

  async getVehicleById(id: string): Promise<Vehicle | undefined> {
    return await this.vehicleRepository.getVehicleById(id);
  }

  private sortVehiclesByPrice(vehicles: Vehicle[], order: "asc" | "desc"): Vehicle[] {
    return [...vehicles].sort((a, b) => {
      const priceA = parseFloat(a.price);
      const priceB = parseFloat(b.price);

      return order === "asc" ? priceA - priceB : priceB - priceA;
    });
  }
}
