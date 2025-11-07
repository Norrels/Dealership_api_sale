import { describe, expect, test } from "bun:test";
import { Sale } from "./sale";

describe("Sale Entity", () => {
  test("should create a valid sale object", () => {
    const sale: Sale = {
      id: "sale-123",
      vehicleId: "vehicle-456",
      saleDate: new Date("2024-01-15"),
      make: "Toyota",
      model: "Corolla",
      year: 2023,
      vin: "1HGBH41JXMN109186",
      price: "25000.00",
      color: "Silver",
      status: "completed",
    };

    expect(sale.id).toBe("sale-123");
    expect(sale.vehicleId).toBe("vehicle-456");
    expect(sale.saleDate).toBeInstanceOf(Date);
    expect(sale.make).toBe("Toyota");
    expect(sale.model).toBe("Corolla");
    expect(sale.year).toBe(2023);
    expect(sale.vin).toBe("1HGBH41JXMN109186");
    expect(sale.price).toBe("25000.00");
    expect(sale.color).toBe("Silver");
    expect(sale.status).toBe("completed");
  });

  test("should handle different sale statuses", () => {
    const statuses = ["pending", "completed", "cancelled", "processing"];

    statuses.forEach((status) => {
      const sale: Sale = {
        id: `sale-${status}`,
        vehicleId: "vehicle-123",
        saleDate: new Date(),
        make: "Honda",
        model: "Civic",
        year: 2024,
        vin: "1HGBH41JXMN109186",
        price: "30000.00",
        color: "Blue",
        status,
      };

      expect(sale.status).toBe(status);
    });
  });

  test("should handle different vehicle makes and models", () => {
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
        saleDate: new Date(),
        make,
        model,
        year: 2024,
        vin: `VIN${index}`,
        price: "50000.00",
        color: "Black",
        status: "completed",
      };

      expect(sale.make).toBe(make);
      expect(sale.model).toBe(model);
    });
  });

  test("should handle different price formats", () => {
    const prices = ["10000.00", "25000.50", "99999.99", "0.00"];

    prices.forEach((price, index) => {
      const sale: Sale = {
        id: `sale-${index}`,
        vehicleId: "vehicle-123",
        saleDate: new Date(),
        make: "Toyota",
        model: "Camry",
        year: 2024,
        vin: "VIN123",
        price,
        color: "White",
        status: "completed",
      };

      expect(sale.price).toBe(price);
    });
  });

  test("should handle different vehicle years", () => {
    const years = [2020, 2021, 2022, 2023, 2024];

    years.forEach((year) => {
      const sale: Sale = {
        id: `sale-${year}`,
        vehicleId: "vehicle-123",
        saleDate: new Date(),
        make: "Honda",
        model: "Accord",
        year,
        vin: "VIN123",
        price: "28000.00",
        color: "Red",
        status: "completed",
      };

      expect(sale.year).toBe(year);
      expect(typeof sale.year).toBe("number");
    });
  });

  test("should handle different sale dates", () => {
    const dates = [
      new Date("2024-01-01"),
      new Date("2024-06-15"),
      new Date("2024-12-31"),
    ];

    dates.forEach((saleDate, index) => {
      const sale: Sale = {
        id: `sale-${index}`,
        vehicleId: "vehicle-123",
        saleDate,
        make: "Nissan",
        model: "Altima",
        year: 2024,
        vin: "VIN123",
        price: "27000.00",
        color: "Gray",
        status: "completed",
      };

      expect(sale.saleDate).toEqual(saleDate);
      expect(sale.saleDate).toBeInstanceOf(Date);
    });
  });

  test("should have all required properties", () => {
    const sale: Sale = {
      id: "sale-789",
      vehicleId: "vehicle-101",
      saleDate: new Date(),
      make: "Volkswagen",
      model: "Jetta",
      year: 2024,
      vin: "3VW2B7AJ5KM123456",
      price: "22000.00",
      color: "Green",
      status: "pending",
    };

    expect(sale).toHaveProperty("id");
    expect(sale).toHaveProperty("vehicleId");
    expect(sale).toHaveProperty("saleDate");
    expect(sale).toHaveProperty("make");
    expect(sale).toHaveProperty("model");
    expect(sale).toHaveProperty("year");
    expect(sale).toHaveProperty("vin");
    expect(sale).toHaveProperty("price");
    expect(sale).toHaveProperty("color");
    expect(sale).toHaveProperty("status");
  });

  test("should handle VIN format", () => {
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
        saleDate: new Date(),
        make: "Various",
        model: "Model",
        year: 2024,
        vin,
        price: "35000.00",
        color: "Blue",
        status: "completed",
      };

      expect(sale.vin).toBe(vin);
      expect(sale.vin.length).toBe(17);
    });
  });

  test("should handle different colors", () => {
    const colors = ["Red", "Blue", "Black", "White", "Silver", "Gray"];

    colors.forEach((color, index) => {
      const sale: Sale = {
        id: `sale-${index}`,
        vehicleId: "vehicle-123",
        saleDate: new Date(),
        make: "Mazda",
        model: "CX-5",
        year: 2024,
        vin: "VIN123456789012345",
        price: "32000.00",
        color,
        status: "completed",
      };

      expect(sale.color).toBe(color);
    });
  });

  test("should verify data types of all properties", () => {
    const sale: Sale = {
      id: "sale-999",
      vehicleId: "vehicle-888",
      saleDate: new Date("2024-03-20"),
      make: "Subaru",
      model: "Outback",
      year: 2024,
      vin: "JF2SJABC5LH123456",
      price: "38000.00",
      color: "Navy Blue",
      status: "completed",
    };

    expect(typeof sale.id).toBe("string");
    expect(typeof sale.vehicleId).toBe("string");
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
