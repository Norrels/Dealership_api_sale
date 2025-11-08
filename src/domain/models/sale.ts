import { CPF } from "./cpf";

export interface Sale {
  id: string;
  vehicleId: string;
  customerName: string;
  customerCPF: CPF;
  make: string;
  model: string;
  year: number;
  vin: string;
  color: string;
  saleDate: Date;
  price: string;
  status: "completed" | "pending" | "canceled";
}
