import { Sale } from "../../models/sale";
import { Vehicle } from "../../models/vehicle";

export interface SaleRepository {
  createSale(sale: Sale): Promise<void>;
  getAllVehicleSales(sortByPrice?: "asc" | "desc"): Promise<Vehicle[]>;
  findSaleByVin(vin: string): Promise<Sale | undefined>;
}
