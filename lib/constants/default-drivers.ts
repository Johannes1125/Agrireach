export interface DefaultDriver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  vehicle_type: "motorcycle" | "car" | "mini_truck" | "truck";
  vehicle_plate_number?: string;
  vehicle_description?: string;
}

/**
 * Default drivers available in the system
 * These are constant and cannot be changed by sellers
 * Sellers can only select which driver to assign to a delivery
 */
export const DEFAULT_DRIVERS: DefaultDriver[] = [
  {
    id: "driver_1",
    name: "Juan Dela Cruz",
    phone: "+63 912 345 6789",
    email: "juan.delacruz@agrireach.com",
    vehicle_type: "motorcycle",
    vehicle_plate_number: "ABC-1234",
    vehicle_description: "Motorcycle - Fast delivery for small packages",
  },
  {
    id: "driver_2",
    name: "Maria Santos",
    phone: "+63 923 456 7890",
    email: "maria.santos@agrireach.com",
    vehicle_type: "car",
    vehicle_plate_number: "XYZ-5678",
    vehicle_description: "Car - Reliable delivery for medium packages",
  },
  {
    id: "driver_3",
    name: "Pedro Garcia",
    phone: "+63 934 567 8901",
    email: "pedro.garcia@agrireach.com",
    vehicle_type: "mini_truck",
    vehicle_plate_number: "DEF-9012",
    vehicle_description: "Mini Truck - Ideal for bulk orders",
  },
  {
    id: "driver_4",
    name: "Ana Rodriguez",
    phone: "+63 945 678 9012",
    email: "ana.rodriguez@agrireach.com",
    vehicle_type: "truck",
    vehicle_plate_number: "GHI-3456",
    vehicle_description: "Truck - Large capacity for heavy deliveries",
  },
];

