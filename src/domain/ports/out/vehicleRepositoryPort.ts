import { Vehicle } from "../../models/vehicle";

export interface VehicleRepositoryPort {
  getAllAvailableVehicles(): Promise<Vehicle[]>;
  getVehicleById(id: string): Promise<Vehicle | undefined>;
  refreshCache(): Promise<void>;
}
