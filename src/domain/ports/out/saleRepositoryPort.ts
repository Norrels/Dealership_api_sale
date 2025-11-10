import { Sale } from "../../models/sale";
import { Vehicle } from "../../models/vehicle";

export interface SaleRepository {
  createSale(sale: Sale): Promise<void>;
  getAllVehicleSales(): Promise<Vehicle[]>;
  findSaleByVin(vin: string): Promise<Sale | undefined>;
}
