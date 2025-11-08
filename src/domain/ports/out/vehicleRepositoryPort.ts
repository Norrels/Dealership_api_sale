import { Vehicle } from "../../models/vehicle";

export interface VehicleRepository {
  getAllAvailableVehicles(): Promise<Vehicle[]>;
}
