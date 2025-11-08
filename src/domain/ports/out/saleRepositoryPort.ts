import { Sale } from "../../models/sale";

export interface SaleRepository {
  createSale(sale: Sale): Promise<Sale>;
}
