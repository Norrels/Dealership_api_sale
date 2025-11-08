export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  price: string;
  color: string;
}

export interface VehicleResponse {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  price: string;
  color: string;
  status: "available" | "sold";
}
