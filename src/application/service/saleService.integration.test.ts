import { describe, expect, test, beforeAll, afterAll, beforeEach } from "bun:test";
import { createTestApp, makeRequest } from "../../test/helpers";
import { db } from "../../infrastructure/database";
import { saleSchema } from "../../infrastructure/database/schemas/sale";
import { VehicleResponse } from "../../domain/models/vehicle";

describe("SaleService - Testes de Integração", () => {
  let originalFetch: typeof global.fetch;

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  beforeEach(async () => {
    await db.delete(saleSchema);
  });

  afterAll(async () => {
    await db.delete(saleSchema);
    global.fetch = originalFetch;
  });

  describe("POST /api/v1/sales - Criar venda", () => {
    test("deve criar uma venda com sucesso usando endpoint real", async () => {
      const { app, vehicleRepository } = createTestApp();

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
              color: "Prata",
              status: "available",
            }),
          } as Response;
        }
        if (url.includes("vehicles/webhook")) {
          return { ok: true } as Response;
        }
        return { ok: false, status: 404 } as Response;
      }) as any;

      const response = await makeRequest(app, "POST", "/api/v1/sales/", {
        vehicleId: "vehicle-1",
        customerName: "João da Silva",
        customerCPF: "123.456.789-09",
        salePrice: "25000.00",
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.message).toBe("ok");

      const sales = await app.handle(
        new Request("http://localhost/api/v1/sales/sold")
      );
      const salesData = await sales.json();
      expect(salesData).toHaveLength(1);
      expect(salesData[0].make).toBe("Toyota");

      vehicleRepository.clearCache();
    });

    test("deve retornar erro ao tentar vender veículo não disponível", async () => {
      const { app, vehicleRepository } = createTestApp();

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
              color: "Azul",
              status: "sold",
            }),
          } as Response;
        }
        return { ok: false, status: 404 } as Response;
      }) as any;

      const response = await makeRequest(app, "POST", "/api/v1/sales/", {
        vehicleId: "vehicle-sold",
        customerName: "Maria Oliveira",
        customerCPF: "123.456.789-09",
        salePrice: "28000.00",
      });

      expect(response.status).toBe(500);

      vehicleRepository.clearCache();
    });

    test("deve retornar erro ao tentar vender veículo inexistente", async () => {
      const { app, vehicleRepository } = createTestApp();

      global.fetch = (async () => ({
        ok: false,
        status: 404,
      })) as any;

      const response = await makeRequest(app, "POST", "/api/v1/sales/", {
        vehicleId: "vehicle-nonexistent",
        customerName: "Pedro Santos",
        customerCPF: "123.456.789-09",
        salePrice: "30000.00",
      });

      expect(response.status).toBe(500);

      vehicleRepository.clearCache();
    });

    test("deve retornar erro com CPF inválido", async () => {
      const { app, vehicleRepository } = createTestApp();

      const response = await makeRequest(app, "POST", "/api/v1/sales/", {
        vehicleId: "vehicle-2",
        customerName: "Ana Paula",
        customerCPF: "000.000.000-00",
        salePrice: "45000.00",
      });

      expect(response.status).toBe(500);

      vehicleRepository.clearCache();
    });

    test("deve impedir venda duplicada do mesmo VIN", async () => {
      const { app, vehicleRepository } = createTestApp();

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
              color: "Branco",
              status: "available",
            }),
          } as Response;
        }
        if (url.includes("vehicles/webhook")) {
          return { ok: true } as Response;
        }
        return { ok: false, status: 404 } as Response;
      }) as any;

      // Primeira venda deve funcionar
      const firstResponse = await makeRequest(app, "POST", "/api/v1/sales/", {
        vehicleId: "vehicle-vin-test",
        customerName: "Cliente 1",
        customerCPF: "123.456.789-09",
        salePrice: "18000.00",
      });

      expect(firstResponse.status).toBe(200);

      // Segunda venda do mesmo VIN deve falhar
      const secondResponse = await makeRequest(app, "POST", "/api/v1/sales/", {
        vehicleId: "vehicle-vin-test",
        customerName: "Cliente 2",
        customerCPF: "987.654.321-00",
        salePrice: "18000.00",
      });

      expect(secondResponse.status).toBe(500);

      vehicleRepository.clearCache();
    });
  });

  describe("GET /api/v1/sales/available - Listar veículos disponíveis", () => {
    test("deve retornar veículos disponíveis", async () => {
      const { app, vehicleRepository } = createTestApp();

      const mockVehicles: VehicleResponse[] = [
        {
          id: "vehicle-1",
          make: "Toyota",
          model: "Corolla",
          year: 2023,
          vin: "VIN1",
          price: "25000.00",
          color: "Prata",
          status: "available",
        },
        {
          id: "vehicle-2",
          make: "Honda",
          model: "Civic",
          year: 2024,
          vin: "VIN2",
          price: "28000.00",
          color: "Azul",
          status: "available",
        },
      ];

      global.fetch = (async (url: string) => {
        if (url.includes("isSold=false")) {
          return {
            ok: true,
            json: async () => mockVehicles,
          } as Response;
        }
        return { ok: false, status: 404 } as Response;
      }) as any;

      const response = await makeRequest(app, "GET", "/api/v1/sales/available");

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data).toHaveLength(2);
      expect(body.data[0].make).toBe("Toyota");
      expect(body.data[1].make).toBe("Honda");

      vehicleRepository.clearCache();
    });

    test("deve retornar array vazio quando não há veículos", async () => {
      const { app, vehicleRepository } = createTestApp();

      global.fetch = (async () => ({
        ok: true,
        json: async () => [],
      })) as any;

      const response = await makeRequest(app, "GET", "/api/v1/sales/available");

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data).toEqual([]);

      vehicleRepository.clearCache();
    });
  });

  describe("GET /api/v1/sales/sold - Listar veículos vendidos", () => {
    test("deve retornar vendas salvas no banco", async () => {
      const { app, vehicleRepository } = createTestApp();

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
              color: "Branco",
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
              color: "Vermelho",
              status: "available",
            }),
          } as Response;
        }
        if (url.includes("vehicles/webhook")) {
          return { ok: true } as Response;
        }
        return { ok: false, status: 404 } as Response;
      }) as any;

      await makeRequest(app, "POST", "/api/v1/sales/", {
        vehicleId: "vehicle-get-1",
        customerName: "Cliente A",
        customerCPF: "123.456.789-09",
        salePrice: "50000.00",
      });

      await makeRequest(app, "POST", "/api/v1/sales/", {
        vehicleId: "vehicle-get-2",
        customerName: "Cliente B",
        customerCPF: "987.654.321-00",
        salePrice: "27000.00",
      });

      const response = await makeRequest(app, "GET", "/api/v1/sales/sold");

      expect(response.status).toBe(200);
      const sales = await response.json();
      expect(sales).toHaveLength(2);
      expect(sales.find((s: any) => s.make === "Tesla")).toBeDefined();
      expect(sales.find((s: any) => s.make === "Nissan")).toBeDefined();

      vehicleRepository.clearCache();
    });

    test("deve retornar array vazio quando não há vendas", async () => {
      const { app } = createTestApp();

      const response = await makeRequest(app, "GET", "/api/v1/sales/sold");

      expect(response.status).toBe(200);
      const sales = await response.json();
      expect(sales).toHaveLength(0);
      expect(Array.isArray(sales)).toBe(true);
    });
  });

  describe("GET /api/v1/sales/health - Health check", () => {
    test("deve retornar ok no health check", async () => {
      const { app } = createTestApp();

      const response = await makeRequest(app, "GET", "/api/v1/sales/health");

      expect(response.status).toBe(200);
      const body = await response.text();
      expect(body).toBe("ok");
    });
  });

  describe("Cenários de validação do Elysia", () => {
    test("deve retornar erro de validação com body inválido", async () => {
      const { app, vehicleRepository } = createTestApp();

      const response = await makeRequest(app, "POST", "/api/v1/sales/", {
        vehicleId: "vehicle-1",
      });

      expect(response.status).toBe(422);

      vehicleRepository.clearCache();
    });

    test("deve aceitar diferentes formatos de CPF válidos", async () => {
      const { app, vehicleRepository } = createTestApp();

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
              color: "Cinza",
              status: "available",
            }),
          } as Response;
        }
        if (url.includes("vehicles/webhook")) {
          return { ok: true } as Response;
        }
        return { ok: false, status: 404 } as Response;
      }) as any;

      const validCPFs = ["123.456.789-09", "12345678909", "123 456 789 09"];

      for (const cpf of validCPFs) {
        await db.delete(saleSchema);

        const response = await makeRequest(app, "POST", "/api/v1/sales/", {
          vehicleId: "vehicle-cpf",
          customerName: "Cliente Teste",
          customerCPF: cpf,
          salePrice: "22000.00",
        });

        expect(response.status).toBe(200);
      }

      vehicleRepository.clearCache();
    });
  });
});
