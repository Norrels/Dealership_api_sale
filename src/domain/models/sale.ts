export interface Sale {
  id: string;
  vehicleId: string;
  customerName: string;
  customerCPF: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  color: string;
  saleDate: Date;
  salePrice: string;
}
