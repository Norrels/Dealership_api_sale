import { Vehicle, VehicleResponse } from "../../models/vehicle";

export interface VehicleRepositoryPort {
  getAllAvailableVehicles(): Promise<VehicleResponse[]>;
  getVehicleById(id: string): Promise<VehicleResponse | undefined>;
  refreshCache(): Promise<void>;
}
