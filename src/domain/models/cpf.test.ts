import { describe, expect, test } from "bun:test";
import { CPF } from "./cpf";

describe("CPF Value Object", () => {
  test("should create a valid CPF with formatted input", () => {
    const cpf = new CPF("123.456.789-09");

    expect(cpf.getValue()).toBe("12345678909");
    expect(cpf.getFormatted()).toBe("123.456.789-09");
  });

  test("should create a valid CPF with unformatted input", () => {
    const cpf = new CPF("12345678909");

    expect(cpf.getValue()).toBe("12345678909");
    expect(cpf.getFormatted()).toBe("123.456.789-09");
  });

  test("should throw error for CPF with less than 11 digits", () => {
    expect(() => new CPF("123.456.789")).toThrow("CPF must have 11 digits");
  });

  test("should throw error for CPF with more than 11 digits", () => {
    expect(() => new CPF("123.456.789-099")).toThrow("CPF must have 11 digits");
  });

  test("should throw error for CPF with all same digits", () => {
    expect(() => new CPF("111.111.111-11")).toThrow("Invalid CPF");
    expect(() => new CPF("000.000.000-00")).toThrow("Invalid CPF");
    expect(() => new CPF("999.999.999-99")).toThrow("Invalid CPF");
  });

  test("should throw error for CPF with invalid check digits", () => {
    expect(() => new CPF("123.456.789-00")).toThrow("Invalid CPF");
    expect(() => new CPF("123.456.789-99")).toThrow("Invalid CPF");
  });

  test("should validate a known valid CPF", () => {
    const cpf = new CPF("123.456.789-09");

    expect(cpf.getValue()).toBe("12345678909");
    expect(cpf.getFormatted()).toBe("123.456.789-09");
  });

  test("should compare CPFs using equals method", () => {
    const cpf1 = new CPF("123.456.789-09");
    const cpf2 = new CPF("12345678909");
    const cpf3 = new CPF("529.982.247-25");

    expect(cpf1.equals(cpf2)).toBe(true);
    expect(cpf1.equals(cpf3)).toBe(false);
  });

  test("should return formatted CPF with toString", () => {
    const cpf = new CPF("12345678909");

    expect(cpf.toString()).toBe("123.456.789-09");
  });

  test("should return formatted CPF with toJSON", () => {
    const cpf = new CPF("12345678909");

    expect(cpf.toJSON()).toBe("123.456.789-09");
  });

  test("should handle CPF with spaces and special characters", () => {
    const cpf = new CPF(" 123.456.789-09 ");

    expect(cpf.getValue()).toBe("12345678909");
    expect(cpf.getFormatted()).toBe("123.456.789-09");
  });

  test("should throw error for empty CPF", () => {
    expect(() => new CPF("")).toThrow("CPF must have 11 digits");
  });

  test("should throw error for null or undefined CPF", () => {
    expect(() => new CPF(null as any)).toThrow();
    expect(() => new CPF(undefined as any)).toThrow();
  });
});
