import { Sale } from "../../domain/models/sale";
import { Vehicle } from "../../domain/models/vehicle";
import { SaleRepository } from "../../domain/ports/out/saleRepositoryPort";
import { db } from "../database";
import { saleSchema } from "../database/schemas/sale";

export class SaleRepositoryAdapter implements SaleRepository {
  createSale(saleData: any): Promise<Sale> {
    throw new Error("Method not implemented.");
  }

  async getAllVehicleSales(): Promise<Omit<Vehicle, "status">[]> {
    return await db
      .select({
        id: saleSchema.id,
        vehicleId: saleSchema.vehicleId,
        customerName: saleSchema.customerName,
        customerCPF: saleSchema.customerCPF,
        make: saleSchema.make,
        model: saleSchema.model,
        year: saleSchema.year,
        vin: saleSchema.vin,
        color: saleSchema.color,
        price: saleSchema.salePrice,
      })
      .from(saleSchema);
  }
}
