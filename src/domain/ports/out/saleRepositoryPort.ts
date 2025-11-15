import { Sale } from "../../models/sale";
import { Vehicle } from "../../models/vehicle";

export interface SaleRepository {
  createSale(sale: Sale): Promise<void>;
  getAllVehicleSales(sortByPrice?: "asc" | "desc"): Promise<Vehicle[]>;
  getAllSales(): Promise<Vehicle[]>;
  findSaleByVin(vin: string): Promise<Sale | undefined>;
  findSaleById(id: string): Promise<Sale | undefined>;
  findSalesByCPF(cpf: string): Promise<Sale[]>;
  updateSaleStatus(id: string, status: "pending" | "completed" | "canceled"): Promise<void>;
}
