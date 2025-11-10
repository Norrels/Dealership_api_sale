import { describe, expect, test } from "bun:test";
import { Sale } from "./sale";
import { CPF } from "./cpf";

describe("Sale Entity", () => {
  test("deve criar um objeto de venda válido", () => {
    const sale: Sale = {
      id: "sale-123",
      vehicleId: "vehicle-456",
      customerName: "João da Silva",
      customerCPF: new CPF("123.456.789-09"),
      saleDate: new Date("2024-01-15"),
      make: "Toyota",
      model: "Corolla",
      year: 2023,
      vin: "1HGBH41JXMN109186",
      price: "25000.00",
      color: "Prata",
      status: "completed",
    };

    expect(sale.id).toBe("sale-123");
    expect(sale.vehicleId).toBe("vehicle-456");
    expect(sale.customerName).toBe("João da Silva");
    expect(sale.customerCPF).toBeInstanceOf(CPF);
    expect(sale.customerCPF.getFormatted()).toBe("123.456.789-09");
    expect(sale.saleDate).toBeInstanceOf(Date);
    expect(sale.make).toBe("Toyota");
    expect(sale.model).toBe("Corolla");
    expect(sale.year).toBe(2023);
    expect(sale.vin).toBe("1HGBH41JXMN109186");
    expect(sale.price).toBe("25000.00");
    expect(sale.color).toBe("Prata");
    expect(sale.status).toBe("completed");
  });

  test("deve lidar com diferentes status de venda", () => {
    const statuses: Array<"completed" | "pending" | "canceled"> = [
      "pending",
      "completed",
      "canceled",
    ];

    statuses.forEach((status) => {
      const sale: Sale = {
        id: `sale-${status}`,
        vehicleId: "vehicle-123",
        customerName: "Maria Santos",
        customerCPF: new CPF("123.456.789-09"),
        saleDate: new Date(),
        make: "Honda",
        model: "Civic",
        year: 2024,
        vin: "1HGBH41JXMN109186",
        price: "30000.00",
        color: "Azul",
        status,
      };

      expect(sale.status).toBe(status);
    });
  });

  test("deve lidar com diferentes marcas e modelos de veículos", () => {
    const vehicles = [
      { make: "Ford", model: "Mustang" },
      { make: "Chevrolet", model: "Camaro" },
      { make: "Tesla", model: "Model 3" },
      { make: "BMW", model: "X5" },
    ];

    vehicles.forEach(({ make, model }, index) => {
      const sale: Sale = {
        id: `sale-${index}`,
        vehicleId: `vehicle-${index}`,
        customerName: "Ana Oliveira",
        customerCPF: new CPF("123.456.789-09"),
        saleDate: new Date(),
        make,
        model,
        year: 2024,
        vin: `VIN${index}`,
        price: "50000.00",
        color: "Preto",
        status: "completed",
      };

      expect(sale.make).toBe(make);
      expect(sale.model).toBe(model);
    });
  });

  test("deve lidar com diferentes formatos de preço", () => {
    const prices = ["10000.00", "25000.50", "99999.99", "0.00"];

    prices.forEach((price, index) => {
      const sale: Sale = {
        id: `sale-${index}`,
        vehicleId: "vehicle-123",
        customerName: "Roberto Costa",
        customerCPF: new CPF("123.456.789-09"),
        saleDate: new Date(),
        make: "Toyota",
        model: "Camry",
        year: 2024,
        vin: "VIN123",
        price,
        color: "Branco",
        status: "completed",
      };

      expect(sale.price).toBe(price);
    });
  });

  test("deve lidar com diferentes anos de veículos", () => {
    const years = [2020, 2021, 2022, 2023, 2024];

    years.forEach((year) => {
      const sale: Sale = {
        id: `sale-${year}`,
        vehicleId: "vehicle-123",
        customerName: "Carlos Pereira",
        customerCPF: new CPF("123.456.789-09"),
        saleDate: new Date(),
        make: "Honda",
        model: "Accord",
        year,
        vin: "VIN123",
        price: "28000.00",
        color: "Vermelho",
        status: "completed",
      };

      expect(sale.year).toBe(year);
      expect(typeof sale.year).toBe("number");
    });
  });

  test("deve lidar com diferentes datas de venda", () => {
    const dates = [
      new Date("2024-01-01"),
      new Date("2024-06-15"),
      new Date("2024-12-31"),
    ];

    dates.forEach((saleDate, index) => {
      const sale: Sale = {
        id: `sale-${index}`,
        vehicleId: "vehicle-123",
        customerName: "Daniela Lima",
        customerCPF: new CPF("123.456.789-09"),
        saleDate,
        make: "Nissan",
        model: "Altima",
        year: 2024,
        vin: "VIN123",
        price: "27000.00",
        color: "Cinza",
        status: "completed",
      };

      expect(sale.saleDate).toEqual(saleDate);
      expect(sale.saleDate).toBeInstanceOf(Date);
    });
  });

  test("deve ter todas as propriedades obrigatórias", () => {
    const sale: Sale = {
      id: "sale-789",
      vehicleId: "vehicle-101",
      customerName: "Eduardo Silva",
      customerCPF: new CPF("123.456.789-09"),
      saleDate: new Date(),
      make: "Volkswagen",
      model: "Jetta",
      year: 2024,
      vin: "3VW2B7AJ5KM123456",
      price: "22000.00",
      color: "Verde",
      status: "pending",
    };

    expect(sale).toHaveProperty("id");
    expect(sale).toHaveProperty("vehicleId");
    expect(sale).toHaveProperty("customerName");
    expect(sale).toHaveProperty("customerCPF");
    expect(sale.customerCPF).toBeInstanceOf(CPF);
    expect(sale).toHaveProperty("saleDate");
    expect(sale).toHaveProperty("make");
    expect(sale).toHaveProperty("model");
    expect(sale).toHaveProperty("year");
    expect(sale).toHaveProperty("vin");
    expect(sale).toHaveProperty("price");
    expect(sale).toHaveProperty("color");
    expect(sale).toHaveProperty("status");
  });

  test("deve lidar com formato VIN", () => {
    const vins = [
      "1HGBH41JXMN109186",
      "3VW2B7AJ5KM123456",
      "5YJSA1E14HF123456",
      "WAUAFAFL1DN123456",
    ];

    vins.forEach((vin, index) => {
      const sale: Sale = {
        id: `sale-${index}`,
        vehicleId: "vehicle-123",
        customerName: "Fernando Souza",
        customerCPF: new CPF("123.456.789-09"),
        saleDate: new Date(),
        make: "Diversos",
        model: "Modelo",
        year: 2024,
        vin,
        price: "35000.00",
        color: "Azul",
        status: "completed",
      };

      expect(sale.vin).toBe(vin);
      expect(sale.vin.length).toBe(17);
    });
  });

  test("deve verificar tipos de dados de todas as propriedades", () => {
    const sale: Sale = {
      id: "sale-999",
      vehicleId: "vehicle-888",
      customerName: "Gabriela Martins",
      customerCPF: new CPF("123.456.789-09"),
      saleDate: new Date("2024-03-20"),
      make: "Subaru",
      model: "Outback",
      year: 2024,
      vin: "JF2SJABC5LH123456",
      price: "38000.00",
      color: "Azul Marinho",
      status: "completed",
    };

    expect(typeof sale.id).toBe("string");
    expect(typeof sale.customerName).toBe("string");
    expect(typeof sale.vehicleId).toBe("string");
    expect(sale.customerCPF).toBeInstanceOf(CPF);
    expect(sale.saleDate).toBeInstanceOf(Date);
    expect(typeof sale.make).toBe("string");
    expect(typeof sale.model).toBe("string");
    expect(typeof sale.year).toBe("number");
    expect(typeof sale.vin).toBe("string");
    expect(typeof sale.price).toBe("string");
    expect(typeof sale.color).toBe("string");
    expect(typeof sale.status).toBe("string");
  });
});
