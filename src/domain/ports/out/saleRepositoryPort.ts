import { Sale } from "../../models/sale";
import { Vehicle, VehicleResponse } from "../../models/vehicle";

export interface SaleRepository {
  createSale(sale: Sale): Promise<void>;
  getAllVehicleSales(): Promise<Vehicle[]>;
}
