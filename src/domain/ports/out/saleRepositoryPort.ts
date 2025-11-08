import { Sale } from "../../models/sale";
import { Vehicle } from "../../models/vehicle";

export interface SaleRepository {
  createSale(sale: Sale): Promise<Sale>;
  getAllVehicleSales(): Promise<Omit<Vehicle, "status">[]>;
}
