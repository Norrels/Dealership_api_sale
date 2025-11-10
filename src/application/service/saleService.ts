import { SaleRepository } from "../../domain/ports/out/saleRepositoryPort";
import { VehicleRepositoryPort } from "../../domain/ports/out/vehicleRepositoryPort";
import { WebhookPort } from "../../domain/ports/out/webhookPort";
import { Sale } from "../../domain/models/sale";
import { CreateSaleInput } from "../dto/saleDTO";
import { CPF } from "../../domain/models/cpf";
import { logger } from "../../config/logger";
import { createId } from "@paralleldrive/cuid2";
import { Vehicle } from "../../domain/models/vehicle";

export class SaleService {
  constructor(
    private saleRepository: SaleRepository,
    private vehicleRepository: VehicleRepositoryPort,
    private webhookPort: WebhookPort
  ) {}

  async createSale(createSaleDTO: CreateSaleInput): Promise<void> {
    logger.info(
      { vehicleId: createSaleDTO.vehicleId },
      "Iniciando criação de venda"
    );

    let cpf: CPF;
    try {
      cpf = new CPF(createSaleDTO.customerCPF);
      logger.info({ cpf: cpf.getFormatted() }, "CPF validado com sucesso");
    } catch (error) {
      logger.error({ error, cpf: createSaleDTO.customerCPF }, "CPF inválido");
      throw new Error("CPF inválido");
    }

    const vehicle = await this.vehicleRepository.getVehicleById(
      createSaleDTO.vehicleId
    );

    if (!vehicle) {
      logger.error(
        { vehicleId: createSaleDTO.vehicleId },
        "Veículo não encontrado"
      );
      throw new Error("Veículo não encontrado");
    }

    logger.info(
      { vehicleId: vehicle.id, make: vehicle.make, model: vehicle.model },
      "Veículo encontrado"
    );

    if (vehicle.status !== "available") {
      logger.warn(
        { vehicleId: vehicle.id, status: vehicle.status },
        "Veículo não está disponível para venda"
      );
      throw new Error("Veículo não está disponível para venda");
    }

    const existingSale = await this.saleRepository.findSaleByVin(vehicle.vin);
    if (existingSale) {
      logger.warn(
        { vin: vehicle.vin, vehicleId: vehicle.id, existingSaleId: existingSale.id },
        "Veículo já possui uma venda registrada"
      );
      throw new Error("Este veículo já foi vendido anteriormente");
    }

    const sale: Sale = {
      id: createId(),
      vehicleId: vehicle.id,
      customerName: createSaleDTO.customerName,
      customerCPF: new CPF(cpf.getValue()),
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      status: "completed",
      vin: vehicle.vin,
      color: vehicle.color,
      saleDate: new Date(),
      price: createSaleDTO.salePrice,
    };

    await this.saleRepository.createSale(sale);

    logger.info("Venda criada com sucesso");

    await this.webhookPort.notifyVehicleStatusChange(vehicle.id, "sold");
  }

  async getAllVehiclesSold(): Promise<Vehicle[]> {
    return await this.saleRepository.getAllVehicleSales();
  }
}
