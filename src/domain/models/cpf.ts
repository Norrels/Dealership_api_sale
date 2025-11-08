export class CPF {
  private readonly value: string;

  constructor(cpf: string) {
    const cleanedCpf = this.clean(cpf);
    this.validate(cleanedCpf);
    this.value = cleanedCpf;
  }

  private clean(cpf: string): string {
    return cpf.replace(/[^\d]/g, '');
  }

  private validate(cpf: string): void {
    if (!cpf || cpf.length !== 11) {
      throw new Error('CPF must have 11 digits');
    }

    if (/^(\d)\1{10}$/.test(cpf)) {
      throw new Error('Invalid CPF');
    }

    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) {
      remainder = 0;
    }
    if (remainder !== parseInt(cpf.substring(9, 10))) {
      throw new Error('Invalid CPF');
    }

    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) {
      remainder = 0;
    }
    if (remainder !== parseInt(cpf.substring(10, 11))) {
      throw new Error('Invalid CPF');
    }
  }

  public getValue(): string {
    return this.value;
  }

  public getFormatted(): string {
    return `${this.value.substring(0, 3)}.${this.value.substring(3, 6)}.${this.value.substring(6, 9)}-${this.value.substring(9, 11)}`;
  }

  public equals(other: CPF): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.getFormatted();
  }

  public toJSON(): string {
    return this.getFormatted();
  }
}
