import { describe, expect, test } from "bun:test";
import { CPF } from "./cpf";

describe("CPF Value Object", () => {
  test("deve criar um CPF válido com entrada formatada", () => {
    const cpf = new CPF("123.456.789-09");

    expect(cpf.getValue()).toBe("12345678909");
    expect(cpf.getFormatted()).toBe("123.456.789-09");
  });

  test("deve criar um CPF válido com entrada não formatada", () => {
    const cpf = new CPF("12345678909");

    expect(cpf.getValue()).toBe("12345678909");
    expect(cpf.getFormatted()).toBe("123.456.789-09");
  });

  test("deve lançar erro para CPF com menos de 11 dígitos", () => {
    expect(() => new CPF("123.456.789")).toThrow("CPF must have 11 digits");
  });

  test("deve lançar erro para CPF com mais de 11 dígitos", () => {
    expect(() => new CPF("123.456.789-099")).toThrow("CPF must have 11 digits");
  });

  test("deve lançar erro para CPF com todos os dígitos iguais", () => {
    expect(() => new CPF("111.111.111-11")).toThrow("Invalid CPF");
    expect(() => new CPF("000.000.000-00")).toThrow("Invalid CPF");
    expect(() => new CPF("999.999.999-99")).toThrow("Invalid CPF");
  });

  test("deve lançar erro para CPF com dígitos verificadores inválidos", () => {
    expect(() => new CPF("123.456.789-00")).toThrow("Invalid CPF");
    expect(() => new CPF("123.456.789-99")).toThrow("Invalid CPF");
  });

  test("deve validar um CPF válido conhecido", () => {
    const cpf = new CPF("123.456.789-09");

    expect(cpf.getValue()).toBe("12345678909");
    expect(cpf.getFormatted()).toBe("123.456.789-09");
  });

  test("deve comparar CPFs usando o método equals", () => {
    const cpf1 = new CPF("123.456.789-09");
    const cpf2 = new CPF("12345678909");
    const cpf3 = new CPF("529.982.247-25");

    expect(cpf1.equals(cpf2)).toBe(true);
    expect(cpf1.equals(cpf3)).toBe(false);
  });

  test("deve retornar CPF formatado com toString", () => {
    const cpf = new CPF("12345678909");

    expect(cpf.toString()).toBe("123.456.789-09");
  });

  test("deve retornar CPF formatado com toJSON", () => {
    const cpf = new CPF("12345678909");

    expect(cpf.toJSON()).toBe("123.456.789-09");
  });

  test("deve lidar com CPF com espaços e caracteres especiais", () => {
    const cpf = new CPF(" 123.456.789-09 ");

    expect(cpf.getValue()).toBe("12345678909");
    expect(cpf.getFormatted()).toBe("123.456.789-09");
  });

  test("deve lançar erro para CPF vazio", () => {
    expect(() => new CPF("")).toThrow("CPF must have 11 digits");
  });

  test("deve lançar erro para CPF null ou undefined", () => {
    expect(() => new CPF(null as any)).toThrow();
    expect(() => new CPF(undefined as any)).toThrow();
  });
});
