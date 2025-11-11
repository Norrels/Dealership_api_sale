import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { VehicleRepositoryAdapter } from "./vehicleRepositoryAdapter";
import { VehicleResponse } from "../../domain/models/vehicle";

describe("VehicleRepositoryAdapter - Integration Tests", () => {
  let adapter: VehicleRepositoryAdapter;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    adapter = new VehicleRepositoryAdapter();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    adapter.clearCache();
  });

  describe("getAllAvailableVehicles com Cache", () => {
    test("deve buscar da API na primeira chamada", async () => {
      const mockVehicles: VehicleResponse[] = [
        {
          id: "vehicle-1",
          make: "Toyota",
          model: "Corolla",
          year: 2023,
          vin: "1HGBH41JXMN109186",
          price: "25000.00",
          color: "Silver",
          status: "available",
        },
      ];

      let fetchCallCount = 0;
      global.fetch = (async (url: string) => {
        fetchCallCount++;
        if (url.includes("isSold=false")) {
          return {
            ok: true,
            json: async () => mockVehicles,
          } as Response;
        }
        return { ok: false, status: 404 } as Response;
      }) as any;

      const result = await adapter.getAllAvailableVehicles();

      expect(result).toHaveLength(1);
      expect(result[0].make).toBe("Toyota");
      expect(fetchCallCount).toBe(1);
    });

    test("deve retornar do cache na segunda chamada dentro do TTL", async () => {
      const mockVehicles: VehicleResponse[] = [
        {
          id: "vehicle-cache-1",
          make: "Honda",
          model: "Civic",
          year: 2024,
          vin: "2HGFC1F59NH123456",
          price: "28000.00",
          color: "Blue",
          status: "available",
        },
      ];

      let fetchCallCount = 0;
      global.fetch = (async () => {
        fetchCallCount++;
        return {
          ok: true,
          json: async () => mockVehicles,
        } as Response;
      }) as any;

      // Primeira chamada - busca da API
      const firstResult = await adapter.getAllAvailableVehicles();
      expect(firstResult).toHaveLength(1);
      expect(fetchCallCount).toBe(1);

      // Segunda chamada - deve vir do cache
      const secondResult = await adapter.getAllAvailableVehicles();
      expect(secondResult).toHaveLength(1);
      expect(secondResult[0].make).toBe("Honda");
      expect(fetchCallCount).toBe(1); // Não deve ter feito nova chamada à API
    });

    test("deve buscar novamente da API após limpar o cache", async () => {
      const mockVehicles: VehicleResponse[] = [
        {
          id: "vehicle-clear-1",
          make: "Ford",
          model: "Mustang",
          year: 2023,
          vin: "1FA6P8CF5L5123456",
          price: "45000.00",
          color: "Red",
          status: "available",
        },
      ];

      let fetchCallCount = 0;
      global.fetch = (async () => {
        fetchCallCount++;
        return {
          ok: true,
          json: async () => mockVehicles,
        } as Response;
      }) as any;

      await adapter.getAllAvailableVehicles();
      expect(fetchCallCount).toBe(1);

      adapter.clearCache();

      await adapter.getAllAvailableVehicles();
      expect(fetchCallCount).toBe(2);
    });

    test("deve retornar array vazio quando API retorna lista vazia", async () => {
      global.fetch = (async () => ({
        ok: true,
        json: async () => [],
      })) as any;

      const result = await adapter.getAllAvailableVehicles();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe("getVehicleById - Casos de Erro", () => {
    test("deve retornar undefined quando veículo não existe (404)", async () => {
      global.fetch = (async () => ({
        ok: false,
        status: 404,
      })) as any;

      const result = await adapter.getVehicleById("vehicle-404");

      expect(result).toBeUndefined();
    });

    test("deve lançar erro para status HTTP diferente de 404", async () => {
      global.fetch = (async () => ({
        ok: false,
        status: 500,
      })) as any;

      await expect(adapter.getVehicleById("vehicle-500")).rejects.toThrow(
        "HTTP error! status: 500"
      );
    });

    test("deve lançar erro quando há falha de rede", async () => {
      global.fetch = (async () => {
        throw new Error("Network timeout");
      }) as any;

      expect(adapter.getVehicleById("vehicle-error")).rejects.toThrow(
        "Network timeout"
      );
    });

    test("deve buscar veículo com sucesso", async () => {
      const mockVehicle: VehicleResponse = {
        id: "vehicle-success",
        make: "Tesla",
        model: "Model 3",
        year: 2024,
        vin: "5YJ3E1EA9NF123456",
        price: "50000.00",
        color: "White",
        status: "available",
      };

      global.fetch = (async () => ({
        ok: true,
        json: async () => mockVehicle,
      })) as any;

      const result = await adapter.getVehicleById("vehicle-success");

      expect(result).toBeDefined();
      expect(result?.make).toBe("Tesla");
      expect(result?.model).toBe("Model 3");
    });
  });

  describe("refreshCache", () => {
    test("deve atualizar cache com sucesso", async () => {
      const initialVehicles: VehicleResponse[] = [
        {
          id: "vehicle-1",
          make: "Toyota",
          model: "Camry",
          year: 2023,
          vin: "VIN1",
          price: "30000.00",
          color: "Silver",
          status: "available",
        },
      ];

      const updatedVehicles: VehicleResponse[] = [
        {
          id: "vehicle-1",
          make: "Toyota",
          model: "Camry",
          year: 2023,
          vin: "VIN1",
          price: "30000.00",
          color: "Silver",
          status: "available",
        },
        {
          id: "vehicle-2",
          make: "Honda",
          model: "Accord",
          year: 2024,
          vin: "VIN2",
          price: "32000.00",
          color: "Black",
          status: "available",
        },
      ];

      let callCount = 0;
      global.fetch = (async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: true,
            json: async () => initialVehicles,
          } as Response;
        }
        return {
          ok: true,
          json: async () => updatedVehicles,
        } as Response;
      }) as any;

      // Primeira chamada
      await adapter.getAllAvailableVehicles();
      let result = await adapter.getAllAvailableVehicles();
      expect(result).toHaveLength(1);

      // Refresh explícito
      await adapter.refreshCache();

      // Deve retornar novos dados
      result = await adapter.getAllAvailableVehicles();
      expect(result).toHaveLength(2);
    });

    test("deve manter cache antigo quando refresh falhar", async () => {
      const initialVehicles: VehicleResponse[] = [
        {
          id: "vehicle-maintain",
          make: "Nissan",
          model: "Altima",
          year: 2023,
          vin: "VIN1",
          price: "27000.00",
          color: "Gray",
          status: "available",
        },
      ];

      let callCount = 0;
      global.fetch = (async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: true,
            json: async () => initialVehicles,
          } as Response;
        }
        // Segunda chamada falha
        return {
          ok: false,
          status: 500,
        } as Response;
      }) as any;

      await adapter.getAllAvailableVehicles();

      await adapter.refreshCache();

      // Cache antigo deve ser mantido
      const result = await adapter.getAllAvailableVehicles();
      expect(result).toHaveLength(1);
      expect(result[0].make).toBe("Nissan");
    });

    test("deve lançar erro quando refresh falhar com cache vazio", async () => {
      global.fetch = (async () => ({
        ok: false,
        status: 500,
      })) as any;

      expect(adapter.refreshCache()).rejects.toThrow(
        "HTTP error! status: 500"
      );
    });

    test("deve lançar erro quando há erro de rede e cache está vazio", async () => {
      global.fetch = (async () => {
        throw new Error("Connection refused");
      }) as any;

      expect(adapter.refreshCache()).rejects.toThrow(
        "Connection refused"
      );
    });

    test("deve manter cache expirado quando refresh falhar com erro de rede", async () => {
      const initialVehicles: VehicleResponse[] = [
        {
          id: "vehicle-network-error",
          make: "BMW",
          model: "X5",
          year: 2024,
          vin: "5UXCR6C08L9D12345",
          price: "65000.00",
          color: "Black",
          status: "available",
        },
      ];

      let callCount = 0;
      global.fetch = (async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: true,
            json: async () => initialVehicles,
          } as Response;
        }
        throw new Error("Network error");
      }) as any;

      // Primeira chamada - popula cache
      await adapter.getAllAvailableVehicles();

      await adapter.refreshCache();

      // Cache antigo deve ser mantido
      const result = await adapter.getAllAvailableVehicles();
      expect(result).toHaveLength(1);
      expect(result[0].make).toBe("BMW");
    });
  });

  describe("clearCache", () => {
    test("deve limpar cache completamente", async () => {
      const mockVehicles: VehicleResponse[] = [
        {
          id: "vehicle-clear",
          make: "Volkswagen",
          model: "Golf",
          year: 2023,
          vin: "VIN1",
          price: "25000.00",
          color: "White",
          status: "available",
        },
      ];

      let fetchCallCount = 0;
      global.fetch = (async () => {
        fetchCallCount++;
        return {
          ok: true,
          json: async () => mockVehicles,
        } as Response;
      }) as any;

      await adapter.getAllAvailableVehicles();
      expect(fetchCallCount).toBe(1);

      await adapter.getAllAvailableVehicles();
      expect(fetchCallCount).toBe(1);

      adapter.clearCache();

      await adapter.getAllAvailableVehicles();
      expect(fetchCallCount).toBe(2);
    });

    test("clearCache deve funcionar mesmo sem cache populado", () => {
      expect(() => adapter.clearCache()).not.toThrow();
    });
  });

  describe("Múltiplos veículos", () => {
    test("deve gerenciar múltiplos veículos no cache corretamente", async () => {
      const mockVehicles: VehicleResponse[] = [
        {
          id: "vehicle-multi-1",
          make: "Toyota",
          model: "Corolla",
          year: 2023,
          vin: "VIN1",
          price: "25000.00",
          color: "Silver",
          status: "available",
        },
        {
          id: "vehicle-multi-2",
          make: "Honda",
          model: "Civic",
          year: 2024,
          vin: "VIN2",
          price: "28000.00",
          color: "Blue",
          status: "available",
        },
        {
          id: "vehicle-multi-3",
          make: "Ford",
          model: "Mustang",
          year: 2023,
          vin: "VIN3",
          price: "45000.00",
          color: "Red",
          status: "available",
        },
      ];

      global.fetch = (async () => ({
        ok: true,
        json: async () => mockVehicles,
      })) as any;

      const result = await adapter.getAllAvailableVehicles();

      expect(result).toHaveLength(3);
      expect(result.find((v) => v.make === "Toyota")).toBeDefined();
      expect(result.find((v) => v.make === "Honda")).toBeDefined();
      expect(result.find((v) => v.make === "Ford")).toBeDefined();
    });

    test("deve substituir cache completamente no refresh", async () => {
      const firstBatch: VehicleResponse[] = [
        {
          id: "vehicle-batch-1",
          make: "Toyota",
          model: "Camry",
          year: 2023,
          vin: "VIN1",
          price: "30000.00",
          color: "Silver",
          status: "available",
        },
        {
          id: "vehicle-batch-2",
          make: "Honda",
          model: "Accord",
          year: 2024,
          vin: "VIN2",
          price: "32000.00",
          color: "Black",
          status: "available",
        },
      ];

      const secondBatch: VehicleResponse[] = [
        {
          id: "vehicle-batch-3",
          make: "BMW",
          model: "X5",
          year: 2024,
          vin: "VIN3",
          price: "65000.00",
          color: "White",
          status: "available",
        },
      ];

      let callCount = 0;
      global.fetch = (async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: true,
            json: async () => firstBatch,
          } as Response;
        }
        return {
          ok: true,
          json: async () => secondBatch,
        } as Response;
      }) as any;

      let result = await adapter.getAllAvailableVehicles();
      expect(result).toHaveLength(2);

      await adapter.refreshCache();

      result = await adapter.getAllAvailableVehicles();
      expect(result).toHaveLength(1);
      expect(result[0].make).toBe("BMW");
      expect(result.find((v) => v.make === "Toyota")).toBeUndefined();
      expect(result.find((v) => v.make === "Honda")).toBeUndefined();
    });
  });
});
