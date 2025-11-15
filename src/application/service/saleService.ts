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
      status: "pending",
      vin: vehicle.vin,
      color: vehicle.color,
      saleDate: new Date(),
      price: createSaleDTO.salePrice,
    };

    await this.saleRepository.createSale(sale);

    logger.info(
      { saleId: sale.id, status: sale.status },
      "Venda criada com sucesso com status pendente. Aguardando confirmação de pagamento."
    );
  }

  async processPayment(saleId: string, paymentStatus: "approved" | "rejected"): Promise<void> {
    logger.info(
      { saleId, paymentStatus },
      "Processando webhook de pagamento"
    );

    const sale = await this.saleRepository.findSaleById(saleId);

    if (!sale) {
      logger.error({ saleId }, "Venda não encontrada");
      throw new Error("Venda não encontrada");
    }

    if (sale.status !== "pending") {
      logger.warn(
        { saleId, currentStatus: sale.status },
        "Venda não está com status pendente. Ignorando webhook."
      );
      throw new Error(`Venda já foi processada com status: ${sale.status}`);
    }

    if (paymentStatus === "approved") {
      await this.saleRepository.updateSaleStatus(saleId, "completed");
      logger.info({ saleId }, "Pagamento aprovado. Status atualizado para completed.");

      // Notifica o serviço de veículos que o veículo foi vendido
      await this.webhookPort.notifyVehicleStatusChange(sale.vehicleId, "sold");
      logger.info(
        { saleId, vehicleId: sale.vehicleId },
        "Webhook do serviço de veículos notificado com sucesso"
      );
    } else {
      await this.saleRepository.updateSaleStatus(saleId, "canceled");
      logger.info({ saleId }, "Pagamento rejeitado. Status atualizado para canceled.");
    }
  }

  async getAllVehiclesSold(sortByPrice?: "asc" | "desc"): Promise<Vehicle[]> {
    const vehicles = await this.saleRepository.getAllVehicleSales(sortByPrice);
    return vehicles;
  }

  async getSalesByCPF(cpf: string): Promise<Sale[]> {
    logger.info({ cpf }, "Buscando vendas por CPF");

    const normalizedCPF = cpf.replace(/[^\d]/g, "");

    try {
      new CPF(normalizedCPF);
    } catch (error) {
      logger.error({ cpf, normalizedCPF }, "CPF inválido fornecido para busca");
      throw new Error("CPF inválido");
    }

    const sales = await this.saleRepository.findSalesByCPF(normalizedCPF);
    logger.info({ cpf, count: sales.length }, "Vendas encontradas");

    return sales;
  }
}
