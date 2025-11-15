import { describe, expect, test, beforeAll, afterAll, beforeEach, afterEach } from "bun:test";
import { SaleService } from "./saleService";
import { SaleRepositoryAdapter } from "../../infrastructure/adapters/saleRepositoryAdapter";
import { VehicleRepositoryAdapter } from "../../infrastructure/adapters/vehicleRepositoryAdapter";
import { WebhookAdapter } from "../../infrastructure/adapters/webhookAdapter";
import { CreateSaleInput } from "../dto/saleDTO";
import { db } from "../../infrastructure/database";
import { saleSchema } from "../../infrastructure/database/schemas/sale";

describe("SaleService - Integration Tests", () => {
  let saleService: SaleService;
  let saleRepository: SaleRepositoryAdapter;
  let vehicleRepository: VehicleRepositoryAdapter;
  let webhookAdapter: WebhookAdapter;
  let originalFetch: typeof global.fetch;

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  beforeEach(async () => {
    await db.delete(saleSchema);

    saleRepository = new SaleRepositoryAdapter();
    vehicleRepository = new VehicleRepositoryAdapter();
    webhookAdapter = new WebhookAdapter();

    saleService = new SaleService(
      saleRepository,
      vehicleRepository,
      webhookAdapter
    );
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vehicleRepository.clearCache();
  });

  afterAll(async () => {
    await db.delete(saleSchema);
  });

  describe("Fluxo completo de venda", () => {
    test("deve criar uma venda com sucesso usando todas as camadas reais", async () => {
      global.fetch = (async (url: string) => {
        if (url.includes("vehicles/vehicle-1")) {
          return {
            ok: true,
            json: async () => ({
              id: "vehicle-1",
              make: "Toyota",
              model: "Corolla",
              year: 2023,
              vin: "1HGBH41JXMN109186",
              price: "25000.00",
              color: "Silver",
              status: "available",
            }),
          } as Response;
        }
        if (url.includes("vehicles/webhook")) {
          return { ok: true } as Response;
        }
        return { ok: false, status: 404 } as Response;
      }) as any;

      const createSaleInput: CreateSaleInput = {
        vehicleId: "vehicle-1",
        customerName: "João da Silva",
        customerCPF: "123.456.789-09",
        salePrice: "25000.00",
      };

      await saleService.createSale(createSaleInput);

      const sales = await saleRepository.getAllSales();
      expect(sales).toHaveLength(1);
      expect(sales[0].make).toBe("Toyota");
      expect(sales[0].model).toBe("Corolla");
    });

    test("deve impedir venda de veículo não disponível", async () => {
      global.fetch = (async (url: string) => {
        if (url.includes("vehicles/vehicle-sold")) {
          return {
            ok: true,
            json: async () => ({
              id: "vehicle-sold",
              make: "Honda",
              model: "Civic",
              year: 2024,
              vin: "2HGFC1F59NH123456",
              price: "28000.00",
              color: "Blue",
              status: "sold",
            }),
          } as Response;
        }
        return { ok: false, status: 404 } as Response;
      }) as any;

      const createSaleInput: CreateSaleInput = {
        vehicleId: "vehicle-sold",
        customerName: "Maria Oliveira",
        customerCPF: "123.456.789-09",
        salePrice: "28000.00",
      };

      expect(saleService.createSale(createSaleInput)).rejects.toThrow(
        "Veículo não está disponível para venda"
      );

      const sales = await saleRepository.getAllSales();
      expect(sales).toHaveLength(0);
    });

    test("deve impedir venda de veículo inexistente", async () => {
      global.fetch = (async () => ({
        ok: false,
        status: 404,
      })) as any;

      const createSaleInput: CreateSaleInput = {
        vehicleId: "vehicle-nonexistent",
        customerName: "Pedro Santos",
        customerCPF: "123.456.789-09",
        salePrice: "30000.00",
      };

      expect(saleService.createSale(createSaleInput)).rejects.toThrow(
        "Veículo não encontrado"
      );

      const sales = await saleRepository.getAllSales();
      expect(sales).toHaveLength(0);
    });

    test("deve validar CPF antes de criar venda", async () => {
      global.fetch = (async (url: string) => {
        if (url.includes("vehicles/vehicle-2")) {
          return {
            ok: true,
            json: async () => ({
              id: "vehicle-2",
              make: "Ford",
              model: "Mustang",
              year: 2023,
              vin: "1FA6P8CF5L5123456",
              price: "45000.00",
              color: "Red",
              status: "available",
            }),
          } as Response;
        }
        return { ok: false, status: 404 } as Response;
      }) as any;

      const createSaleInput: CreateSaleInput = {
        vehicleId: "vehicle-2",
        customerName: "Ana Paula",
        customerCPF: "000.000.000-00",
        salePrice: "45000.00",
      };

      expect(saleService.createSale(createSaleInput)).rejects.toThrow(
        "CPF inválido"
      );

      const sales = await saleRepository.getAllSales();
      expect(sales).toHaveLength(0);
    });

    test("deve impedir venda duplicada do mesmo VIN", async () => {
      global.fetch = (async (url: string) => {
        if (url.includes("vehicles/vehicle-vin-test")) {
          return {
            ok: true,
            json: async () => ({
              id: "vehicle-vin-test",
              make: "Chevrolet",
              model: "Onix",
              year: 2023,
              vin: "9BWSU45Z08P123456",
              price: "18000.00",
              color: "White",
              status: "available",
            }),
          } as Response;
        }
        if (url.includes("vehicles/webhook")) {
          return { ok: true } as Response;
        }
        return { ok: false, status: 404 } as Response;
      }) as any;

      const firstSale: CreateSaleInput = {
        vehicleId: "vehicle-vin-test",
        customerName: "Cliente 1",
        customerCPF: "123.456.789-09",
        salePrice: "18000.00",
      };

      // Primeira venda deve funcionar
      await saleService.createSale(firstSale);

      // Tenta vender um veículo com o mesmo VIN
      const secondSale: CreateSaleInput = {
        vehicleId: "vehicle-vin-test",
        customerName: "Cliente 2",
        customerCPF: "987.654.321-00",
        salePrice: "18000.00",
      };

      expect(saleService.createSale(secondSale)).rejects.toThrow(
        "Este veículo já foi vendido anteriormente"
      );

      const sales = await saleRepository.getAllSales();
      expect(sales).toHaveLength(1);
      expect(sales[0].make).toBe("Chevrolet");
    });
  });

  describe("Múltiplas vendas sequenciais", () => {
    test("deve processar múltiplas vendas em sequência", async () => {
      const vehicles = [
        {
          id: "vehicle-seq-1",
          make: "BMW",
          model: "X5",
          year: 2024,
          vin: "5UXCR6C08L9D12345",
          price: "65000.00",
          color: "Black",
          status: "available",
        },
        {
          id: "vehicle-seq-2",
          make: "Audi",
          model: "A4",
          year: 2023,
          vin: "WAUFFAFL9DN123456",
          price: "48000.00",
          color: "Blue",
          status: "available",
        },
        {
          id: "vehicle-seq-3",
          make: "Mercedes-Benz",
          model: "C-Class",
          year: 2024,
          vin: "WDDWF8EB5NR123456",
          price: "55000.00",
          color: "Silver",
          status: "available",
        },
      ];

      global.fetch = (async (url: string) => {
        const vehicle = vehicles.find((v) => url.includes(v.id));
        if (vehicle) {
          return {
            ok: true,
            json: async () => vehicle,
          } as Response;
        }
        if (url.includes("vehicles/webhook")) {
          return { ok: true } as Response;
        }
        return { ok: false, status: 404 } as Response;
      }) as any;

      for (const vehicle of vehicles) {
        const createSaleInput: CreateSaleInput = {
          vehicleId: vehicle.id,
          customerName: `Cliente ${vehicle.id}`,
          customerCPF: "123.456.789-09",
          salePrice: vehicle.price,
        };

        await saleService.createSale(createSaleInput);
      }

      const sales = await saleRepository.getAllSales();
      expect(sales).toHaveLength(3);
      expect(sales.map((s) => s.make)).toContain("BMW");
      expect(sales.map((s) => s.make)).toContain("Audi");
      expect(sales.map((s) => s.make)).toContain("Mercedes-Benz");
    });
  });

  describe("Formatos de CPF", () => {
    test("deve aceitar diferentes formatos de CPF válido", async () => {
      global.fetch = (async (url: string) => {
        if (url.includes("vehicles/vehicle-cpf")) {
          return {
            ok: true,
            json: async () => ({
              id: "vehicle-cpf",
              make: "Volkswagen",
              model: "Jetta",
              year: 2023,
              vin: "3VW2B7AJ5KM123456",
              price: "22000.00",
              color: "Gray",
              status: "available",
            }),
          } as Response;
        }
        if (url.includes("vehicles/webhook")) {
          return { ok: true } as Response;
        }
        return { ok: false, status: 404 } as Response;
      }) as any;

      const validCPFs = [
        "123.456.789-09",
        "12345678909",
        "123 456 789 09",
      ];

      for (const cpf of validCPFs) {
        await db.delete(saleSchema);

        const createSaleInput: CreateSaleInput = {
          vehicleId: "vehicle-cpf",
          customerName: "Cliente Teste",
          customerCPF: cpf,
          salePrice: "22000.00",
        };

        await saleService.createSale(createSaleInput);

        const sales = await saleRepository.getAllSales();
        expect(sales).toHaveLength(1);
      }
    });
  });

  describe("Recuperação de vendas", () => {
    test("deve retornar todas as vendas salvas", async () => {
      global.fetch = (async (url: string) => {
        if (url.includes("vehicles/vehicle-get-1")) {
          return {
            ok: true,
            json: async () => ({
              id: "vehicle-get-1",
              make: "Tesla",
              model: "Model 3",
              year: 2024,
              vin: "5YJ3E1EA9NF123456",
              price: "50000.00",
              color: "White",
              status: "available",
            }),
          } as Response;
        }
        if (url.includes("vehicles/vehicle-get-2")) {
          return {
            ok: true,
            json: async () => ({
              id: "vehicle-get-2",
              make: "Nissan",
              model: "Altima",
              year: 2023,
              vin: "1N4BL4BV3NC123456",
              price: "27000.00",
              color: "Red",
              status: "available",
            }),
          } as Response;
        }
        if (url.includes("vehicles/webhook")) {
          return { ok: true } as Response;
        }
        return { ok: false, status: 404 } as Response;
      }) as any;

      const sale1: CreateSaleInput = {
        vehicleId: "vehicle-get-1",
        customerName: "Cliente A",
        customerCPF: "123.456.789-09",
        salePrice: "50000.00",
      };

      const sale2: CreateSaleInput = {
        vehicleId: "vehicle-get-2",
        customerName: "Cliente B",
        customerCPF: "987.654.321-00",
        salePrice: "27000.00",
      };

      await saleService.createSale(sale1);
      await saleService.createSale(sale2);

      // Buscar IDs das vendas criadas
      const allSalesCreated = await saleRepository.getAllSales();
      expect(allSalesCreated).toHaveLength(2);

      // Processar pagamentos para marcar como completed
      await saleService.processPayment(allSalesCreated[0].id, "approved");
      await saleService.processPayment(allSalesCreated[1].id, "approved");

      // Agora deve retornar apenas vendas completed
      const allSales = await saleService.getAllVehiclesSold();
      expect(allSales).toHaveLength(2);
      expect(allSales.find((s) => s.make === "Tesla")).toBeDefined();
      expect(allSales.find((s) => s.make === "Nissan")).toBeDefined();
    });

    test("deve retornar array vazio quando não há vendas", async () => {
      const sales = await saleService.getAllVehiclesSold();
      expect(sales).toHaveLength(0);
      expect(Array.isArray(sales)).toBe(true);
    });
  });

  describe("Edge Cases e Cenários Especiais", () => {
    test("deve lidar com nomes especiais de clientes", async () => {
      global.fetch = (async (url: string) => {
        if (url.includes("vehicles/vehicle-name")) {
          return {
            ok: true,
            json: async () => ({
              id: "vehicle-name",
              make: "Chevrolet",
              model: "Cruze",
              year: 2023,
              vin: "1G1BC5SM0E7123456",
              price: "24000.00",
              color: "Silver",
              status: "available",
            }),
          } as Response;
        }
        if (url.includes("vehicles/webhook")) {
          return { ok: true } as Response;
        }
        return { ok: false, status: 404 } as Response;
      }) as any;

      const specialNames = [
        "José da Silva",
        "María José O'Connor",
        "François D'Souza",
        "Klaus-Peter Müller",
      ];

      for (const name of specialNames) {
        await db.delete(saleSchema);

        const createSaleInput: CreateSaleInput = {
          vehicleId: "vehicle-name",
          customerName: name,
          customerCPF: "123.456.789-09",
          salePrice: "24000.00",
        };

        await saleService.createSale(createSaleInput);

        const sales = await saleRepository.getAllSales();
        expect(sales).toHaveLength(1);
        expect(sales[0].make).toBe("Chevrolet");
      }
    });

    test("deve falhar graciosamente com erro de rede na API de veículos", async () => {
      global.fetch = (async () => {
        throw new Error("Network timeout");
      }) as any;

      const createSaleInput: CreateSaleInput = {
        vehicleId: "vehicle-error",
        customerName: "Cliente Erro",
        customerCPF: "123.456.789-09",
        salePrice: "30000.00",
      };

      expect(saleService.createSale(createSaleInput)).rejects.toThrow();

      const sales = await saleRepository.getAllSales();
      expect(sales).toHaveLength(0);
    });

    test("deve criar venda com status pending e não chamar webhook imediatamente", async () => {
      let webhookCallCount = 0;

      global.fetch = (async (url: string) => {
        if (url.includes("vehicles/vehicle-webhook-fail")) {
          return {
            ok: true,
            json: async () => ({
              id: "vehicle-webhook-fail",
              make: "Hyundai",
              model: "Elantra",
              year: 2023,
              vin: "KMHD84LF3PU123456",
              price: "21000.00",
              color: "Gray",
              status: "available",
            }),
          } as Response;
        }
        if (url.includes("vehicles/webhook")) {
          webhookCallCount++;
          return { ok: false, status: 500 } as Response;
        }
        return { ok: false, status: 404 } as Response;
      }) as any;

      const createSaleInput: CreateSaleInput = {
        vehicleId: "vehicle-webhook-fail",
        customerName: "Cliente Webhook",
        customerCPF: "123.456.789-09",
        salePrice: "21000.00",
      };

      await saleService.createSale(createSaleInput);

      // Venda deve ter sido criada com status pending
      const sales = await saleRepository.getAllSales();
      expect(sales).toHaveLength(1);
      expect(sales[0].make).toBe("Hyundai");

      // Webhook não deve ser chamado imediatamente
      expect(webhookCallCount).toBe(0);

      // Buscar venda criada para verificar status
      const sale = await saleRepository.findSaleByVin("KMHD84LF3PU123456");
      expect(sale).toBeDefined();
      expect(sale?.status).toBe("pending");
    });
  });

  describe("Busca de vendas por CPF", () => {
    test("deve buscar vendas por CPF formatado", async () => {
      global.fetch = (async (url: string) => {
        if (url.includes("vehicle-cpf-1")) {
          return {
            ok: true,
            json: async () => ({
              id: "vehicle-cpf-1",
              make: "Toyota",
              model: "Corolla",
              year: 2024,
              vin: "VIN-CPF-1",
              price: "85000.00",
              color: "Black",
              status: "available",
            }),
          } as Response;
        }
        if (url.includes("vehicles/webhook")) {
          return { ok: true } as Response;
        }
        return { ok: false, status: 404 } as Response;
      }) as any;

      const createSaleInput: CreateSaleInput = {
        vehicleId: "vehicle-cpf-1",
        customerName: "João Silva",
        customerCPF: "123.456.789-09",
        salePrice: "85000.00",
      };

      await saleService.createSale(createSaleInput);

      const sales = await saleService.getSalesByCPF("123.456.789-09");

      expect(sales).toHaveLength(1);
      expect(sales[0].customerName).toBe("João Silva");
      expect(sales[0].customerCPF.getFormatted()).toBe("123.456.789-09");
      expect(sales[0].make).toBe("Toyota");
    });

    test("deve buscar vendas por CPF sem formatação", async () => {
      global.fetch = (async (url: string) => {
        if (url.includes("vehicle-cpf-2")) {
          return {
            ok: true,
            json: async () => ({
              id: "vehicle-cpf-2",
              make: "Honda",
              model: "Civic",
              year: 2024,
              vin: "VIN-CPF-2",
              price: "90000.00",
              color: "White",
              status: "available",
            }),
          } as Response;
        }
        if (url.includes("vehicles/webhook")) {
          return { ok: true } as Response;
        }
        return { ok: false, status: 404 } as Response;
      }) as any;

      const createSaleInput: CreateSaleInput = {
        vehicleId: "vehicle-cpf-2",
        customerName: "Maria Santos",
        customerCPF: "98765432100",
        salePrice: "90000.00",
      };

      await saleService.createSale(createSaleInput);

      const sales = await saleService.getSalesByCPF("98765432100");

      expect(sales).toHaveLength(1);
      expect(sales[0].customerName).toBe("Maria Santos");
      expect(sales[0].make).toBe("Honda");
    });

    test("deve buscar múltiplas vendas do mesmo CPF", async () => {
      global.fetch = (async (url: string) => {
        if (url.includes("vehicle-multi-1")) {
          return {
            ok: true,
            json: async () => ({
              id: "vehicle-multi-1",
              make: "Ford",
              model: "Mustang",
              year: 2024,
              vin: "VIN-MULTI-1",
              price: "150000.00",
              color: "Red",
              status: "available",
            }),
          } as Response;
        }
        if (url.includes("vehicle-multi-2")) {
          return {
            ok: true,
            json: async () => ({
              id: "vehicle-multi-2",
              make: "Ford",
              model: "F-150",
              year: 2023,
              vin: "VIN-MULTI-2",
              price: "120000.00",
              color: "Blue",
              status: "available",
            }),
          } as Response;
        }
        if (url.includes("vehicles/webhook")) {
          return { ok: true } as Response;
        }
        return { ok: false, status: 404 } as Response;
      }) as any;

      const sale1: CreateSaleInput = {
        vehicleId: "vehicle-multi-1",
        customerName: "Pedro Costa",
        customerCPF: "123.456.789-09",
        salePrice: "150000.00",
      };

      const sale2: CreateSaleInput = {
        vehicleId: "vehicle-multi-2",
        customerName: "Pedro Costa",
        customerCPF: "123.456.789-09",
        salePrice: "120000.00",
      };

      await saleService.createSale(sale1);
      await saleService.createSale(sale2);

      const sales = await saleService.getSalesByCPF("123.456.789-09");

      expect(sales).toHaveLength(2);
      expect(sales[0].customerName).toBe("Pedro Costa");
      expect(sales[1].customerName).toBe("Pedro Costa");
      expect(sales.find(s => s.make === "Ford" && s.model === "Mustang")).toBeDefined();
      expect(sales.find(s => s.make === "Ford" && s.model === "F-150")).toBeDefined();
    });

    test("deve retornar array vazio quando CPF não tem vendas", async () => {
      const sales = await saleService.getSalesByCPF("987.654.321-00");
      expect(sales).toEqual([]);
      expect(sales).toHaveLength(0);
    });

    test("deve lançar erro para CPF inválido", async () => {
      expect(saleService.getSalesByCPF("123.456.789-00")).rejects.toThrow("CPF inválido");
      expect(saleService.getSalesByCPF("000.000.000-00")).rejects.toThrow("CPF inválido");
      expect(saleService.getSalesByCPF("invalid-cpf")).rejects.toThrow("CPF inválido");
    });

    test("deve normalizar CPF com formatação antes de buscar", async () => {
      global.fetch = (async (url: string) => {
        if (url.includes("vehicle-norm")) {
          return {
            ok: true,
            json: async () => ({
              id: "vehicle-norm",
              make: "Tesla",
              model: "Model 3",
              year: 2024,
              vin: "VIN-NORM",
              price: "200000.00",
              color: "White",
              status: "available",
            }),
          } as Response;
        }
        if (url.includes("vehicles/webhook")) {
          return { ok: true } as Response;
        }
        return { ok: false, status: 404 } as Response;
      }) as any;

      const createSaleInput: CreateSaleInput = {
        vehicleId: "vehicle-norm",
        customerName: "Ana Paula",
        customerCPF: "111.444.777-35",
        salePrice: "200000.00",
      };

      await saleService.createSale(createSaleInput);

      // Buscar com formatação diferente
      const salesWithDots = await saleService.getSalesByCPF("111.444.777-35");
      const salesWithoutDots = await saleService.getSalesByCPF("11144477735");

      expect(salesWithDots).toHaveLength(1);
      expect(salesWithoutDots).toHaveLength(1);
      expect(salesWithDots[0].customerName).toBe("Ana Paula");
      expect(salesWithoutDots[0].customerName).toBe("Ana Paula");
    });
  });
});
