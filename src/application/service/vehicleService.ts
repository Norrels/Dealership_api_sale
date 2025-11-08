import { VehicleRepositoryPort } from "../../domain/ports/out/vehicleRepositoryPort";
import { Vehicle } from "../../domain/models/vehicle";

export class VehicleService {
  constructor(private vehicleRepository: VehicleRepositoryPort) {}

  async getAllAvailableVehicles(): Promise<Vehicle[]> {
    return await this.vehicleRepository.getAllAvailableVehicles();
  }

  async getVehicleById(id: string): Promise<Vehicle | undefined> {
    return await this.vehicleRepository.getVehicleById(id);
  }
}
