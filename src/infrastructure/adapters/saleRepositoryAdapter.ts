import { CreateSaleInput } from "../../application/dto/saleDTO";
import { Sale } from "../../domain/models/sale";
import { Vehicle } from "../../domain/models/vehicle";
import { SaleRepository } from "../../domain/ports/out/saleRepositoryPort";
import { db } from "../database";
import { saleSchema } from "../database/schemas/sale";

export class SaleRepositoryAdapter implements SaleRepository {
  async createSale(saleData: Sale): Promise<void> {
    await db.insert(saleSchema).values({
      ...saleData,
      customerCPF: saleData.customerCPF.getValue(),
    });
  }

  async getAllVehicleSales(): Promise<Vehicle[]> {
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
        price: saleSchema.price,
      })
      .from(saleSchema);
  }
}
