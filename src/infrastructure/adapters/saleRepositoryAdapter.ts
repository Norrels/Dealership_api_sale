import { Sale } from "../../domain/models/sale";
import { CPF } from "../../domain/models/cpf";
import { Vehicle } from "../../domain/models/vehicle";
import { SaleRepository } from "../../domain/ports/out/saleRepositoryPort";
import { db } from "../database";
import { saleSchema } from "../database/schemas/sale";
import { eq, asc, desc } from "drizzle-orm";

export class SaleRepositoryAdapter implements SaleRepository {
  async createSale(saleData: Sale): Promise<void> {
    await db.insert(saleSchema).values({
      ...saleData,
      customerCPF: saleData.customerCPF.getValue(),
    });
  }

  async getAllVehicleSales(sortByPrice?: "asc" | "desc"): Promise<Vehicle[]> {
    let query = db
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

    if (sortByPrice === "asc") {
      query = query.orderBy(asc(saleSchema.price));
    } else if (sortByPrice === "desc") {
      query = query.orderBy(desc(saleSchema.price));
    }

    return await query;
  }

  async findSaleByVin(vin: string): Promise<Sale | undefined> {
    const results = await db
      .select()
      .from(saleSchema)
      .where(eq(saleSchema.vin, vin))
      .limit(1);

    if (results.length === 0) {
      return undefined;
    }

    const row = results[0];
    return {
      id: row.id,
      vehicleId: row.vehicleId,
      customerName: row.customerName,
      customerCPF: new CPF(row.customerCPF),
      make: row.make,
      model: row.model,
      year: row.year,
      vin: row.vin,
      color: row.color,
      saleDate: row.saleDate,
      price: row.price.toString(),
      status: "completed",
    };
  }
}
