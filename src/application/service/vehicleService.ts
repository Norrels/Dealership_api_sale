import { VehicleRepository } from "../../domain/ports/out/vehicleRepositoryPort";
import { Vehicle } from "../../domain/models/vehicle";

export class VehicleService {
  constructor(private vehicleRepository: VehicleRepository) {}

  async getAllAvailableVehicles(): Promise<Vehicle[]> {
    return await this.vehicleRepository.getAllAvailableVehicles();
  }
}
