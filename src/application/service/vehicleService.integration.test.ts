import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { VehicleService } from "./vehicleService";
import { VehicleRepositoryAdapter } from "../../infrastructure/adapters/vehicleRepositoryAdapter";
import { VehicleResponse } from "../../domain/models/vehicle";

describe("VehicleService - Integration Tests", () => {
  let vehicleService: VehicleService;
  let vehicleRepository: VehicleRepositoryAdapter;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    vehicleRepository = new VehicleRepositoryAdapter();
    vehicleService = new VehicleService(vehicleRepository);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vehicleRepository.clearCache();
  });

  describe("getAllAvailableVehicles", () => {
    test("deve retornar todos os veículos disponíveis", async () => {
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
        {
          id: "vehicle-2",
          make: "Honda",
          model: "Civic",
          year: 2024,
          vin: "2HGFC1F59NH123456",
          price: "28000.00",
          color: "Blue",
          status: "available",
        },
      ];

      global.fetch = (async () => ({
        ok: true,
        json: async () => mockVehicles,
      })) as any;

      const result = await vehicleService.getAllAvailableVehicles();

      expect(result).toHaveLength(2);
      expect(result[0].make).toBe("Toyota");
      expect(result[1].make).toBe("Honda");
    });

    test("deve retornar array vazio quando não há veículos", async () => {
      global.fetch = (async () => ({
        ok: true,
        json: async () => [],
      })) as any;

      const result = await vehicleService.getAllAvailableVehicles();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    test("deve lidar com erro da API", async () => {
      global.fetch = (async () => ({
        ok: false,
        status: 500,
      })) as any;

      expect(vehicleService.getAllAvailableVehicles()).rejects.toThrow();
    });

    test("deve usar cache do repositório", async () => {
      const mockVehicles: VehicleResponse[] = [
        {
          id: "vehicle-cache",
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

      await vehicleService.getAllAvailableVehicles();
      expect(fetchCallCount).toBe(1);

      const result = await vehicleService.getAllAvailableVehicles();
      expect(fetchCallCount).toBe(1);
      expect(result).toHaveLength(1);
    });
  });

  describe("getVehicleById", () => {
    test("deve retornar veículo quando encontrado", async () => {
      const mockVehicle: VehicleResponse = {
        id: "vehicle-123",
        make: "Tesla",
        model: "Model 3",
        year: 2024,
        vin: "5YJ3E1EA9NF123456",
        price: "50000.00",
        color: "White",
        status: "available",
      };

      global.fetch = (async (url: string) => {
        if (url.includes("vehicle-123")) {
          return {
            ok: true,
            json: async () => mockVehicle,
          } as Response;
        }
        return { ok: false, status: 404 } as Response;
      }) as any;

      const result = await vehicleService.getVehicleById("vehicle-123");

      expect(result).toBeDefined();
      expect(result?.make).toBe("Tesla");
      expect(result?.model).toBe("Model 3");
    });

    test("deve retornar undefined quando veículo não encontrado", async () => {
      global.fetch = (async () => ({
        ok: false,
        status: 404,
      })) as any;

      const result = await vehicleService.getVehicleById("vehicle-999");

      expect(result).toBeUndefined();
    });

    test("deve lançar erro para falhas na API", async () => {
      global.fetch = (async () => ({
        ok: false,
        status: 500,
      })) as any;

      expect(vehicleService.getVehicleById("vehicle-error")).rejects.toThrow(
        "HTTP error! status: 500"
      );
    });

    test("deve buscar múltiplos veículos diferentes", async () => {
      const vehicles = [
        {
          id: "vehicle-1",
          make: "BMW",
          model: "X5",
          year: 2024,
          vin: "5UXCR6C08L9D12345",
          price: "65000.00",
          color: "Black",
          status: "available",
        },
        {
          id: "vehicle-2",
          make: "Audi",
          model: "A4",
          year: 2023,
          vin: "WAUFFAFL9DN123456",
          price: "48000.00",
          color: "Blue",
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
        return { ok: false, status: 404 } as Response;
      }) as any;

      const result1 = await vehicleService.getVehicleById("vehicle-1");
      const result2 = await vehicleService.getVehicleById("vehicle-2");

      expect(result1?.make).toBe("BMW");
      expect(result2?.make).toBe("Audi");
    });

    test("deve lidar com erro de rede", async () => {
      global.fetch = (async () => {
        throw new Error("Network timeout");
      }) as any;

      expect(
        vehicleService.getVehicleById("vehicle-net-error")
      ).rejects.toThrow("Network timeout");
    });
  });

  describe("Ordenação por preço", () => {
    test("deve ordenar veículos por preço crescente (asc)", async () => {
      const mockVehicles: VehicleResponse[] = [
        {
          id: "vehicle-1",
          make: "Toyota",
          model: "Corolla",
          year: 2023,
          vin: "VIN1",
          price: "50000.00",
          color: "Silver",
          status: "available",
        },
        {
          id: "vehicle-2",
          make: "Honda",
          model: "Civic",
          year: 2024,
          vin: "VIN2",
          price: "30000.00",
          color: "Blue",
          status: "available",
        },
        {
          id: "vehicle-3",
          make: "Ford",
          model: "Focus",
          year: 2024,
          vin: "VIN3",
          price: "40000.00",
          color: "Red",
          status: "available",
        },
      ];

      global.fetch = (async () => ({
        ok: true,
        json: async () => mockVehicles,
      })) as any;

      const result = await vehicleService.getAllAvailableVehicles("asc");

      expect(result).toHaveLength(3);
      expect(result[0].price).toBe("30000.00"); // Honda
      expect(result[1].price).toBe("40000.00"); // Ford
      expect(result[2].price).toBe("50000.00"); // Toyota
      expect(result[0].make).toBe("Honda");
      expect(result[2].make).toBe("Toyota");
    });

    test("deve ordenar veículos por preço decrescente (desc)", async () => {
      const mockVehicles: VehicleResponse[] = [
        {
          id: "vehicle-1",
          make: "Toyota",
          model: "Corolla",
          year: 2023,
          vin: "VIN1",
          price: "30000.00",
          color: "Silver",
          status: "available",
        },
        {
          id: "vehicle-2",
          make: "Honda",
          model: "Civic",
          year: 2024,
          vin: "VIN2",
          price: "50000.00",
          color: "Blue",
          status: "available",
        },
        {
          id: "vehicle-3",
          make: "Ford",
          model: "Focus",
          year: 2024,
          vin: "VIN3",
          price: "40000.00",
          color: "Red",
          status: "available",
        },
      ];

      global.fetch = (async () => ({
        ok: true,
        json: async () => mockVehicles,
      })) as any;

      const result = await vehicleService.getAllAvailableVehicles("desc");

      expect(result).toHaveLength(3);
      expect(result[0].price).toBe("50000.00"); // Honda
      expect(result[1].price).toBe("40000.00"); // Ford
      expect(result[2].price).toBe("30000.00"); // Toyota
      expect(result[0].make).toBe("Honda");
      expect(result[2].make).toBe("Toyota");
    });

    test("deve retornar veículos sem ordenação quando sortByPrice não for fornecido", async () => {
      const mockVehicles: VehicleResponse[] = [
        {
          id: "vehicle-1",
          make: "Toyota",
          model: "Corolla",
          year: 2023,
          vin: "VIN1",
          price: "50000.00",
          color: "Silver",
          status: "available",
        },
        {
          id: "vehicle-2",
          make: "Honda",
          model: "Civic",
          year: 2024,
          vin: "VIN2",
          price: "30000.00",
          color: "Blue",
          status: "available",
        },
      ];

      global.fetch = (async () => ({
        ok: true,
        json: async () => mockVehicles,
      })) as any;

      const result = await vehicleService.getAllAvailableVehicles();

      expect(result).toHaveLength(2);
      // Deve manter ordem original
      expect(result[0].make).toBe("Toyota");
      expect(result[1].make).toBe("Honda");
    });
  });

  describe("Integração completa", () => {
    test("deve funcionar em cenário real com múltiplas operações", async () => {
      const availableVehicles: VehicleResponse[] = [
        {
          id: "vehicle-real-1",
          make: "Toyota",
          model: "Camry",
          year: 2023,
          vin: "VIN1",
          price: "30000.00",
          color: "Silver",
          status: "available",
        },
        {
          id: "vehicle-real-2",
          make: "Honda",
          model: "Accord",
          year: 2024,
          vin: "VIN2",
          price: "32000.00",
          color: "Black",
          status: "available",
        },
      ];

      global.fetch = (async (url: string) => {
        if (url.includes("status=available")) {
          return {
            ok: true,
            json: async () => availableVehicles,
          } as Response;
        }
        if (url.includes("vehicle-real-1")) {
          return {
            ok: true,
            json: async () => availableVehicles[0],
          } as Response;
        }
        if (url.includes("vehicle-real-2")) {
          return {
            ok: true,
            json: async () => availableVehicles[1],
          } as Response;
        }
        return { ok: false, status: 404 } as Response;
      }) as any;

      const allVehicles = await vehicleService.getAllAvailableVehicles();
      expect(allVehicles).toHaveLength(2);

      const vehicle1 = await vehicleService.getVehicleById("vehicle-real-1");
      expect(vehicle1?.make).toBe("Toyota");

      const vehicle2 = await vehicleService.getVehicleById("vehicle-real-2");
      expect(vehicle2?.make).toBe("Honda");

      const nonExistent = await vehicleService.getVehicleById("vehicle-999");
      expect(nonExistent).toBeUndefined();
    });
  });
});
