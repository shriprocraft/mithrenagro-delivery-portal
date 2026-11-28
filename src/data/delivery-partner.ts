import type { DeliveryPartnerProfile } from "@/types/delivery";

// Fictional fixtures kept for the job screens' local helpers. They are never signed in: demo sign-in has
// been removed, and every partner signs in on the backend.

export const demoDeliveryPartners: DeliveryPartnerProfile[] = [
  {
    id: "partner-001",
    name: "Arjun Kumar",
    phone: "+91 90000 11111",
    vehicle_type: "Two-wheeler",
    availability_status: "available",
  },
  {
    id: "partner-002",
    name: "Divya Rajan",
    phone: "+91 90000 22222",
    vehicle_type: "Two-wheeler",
    availability_status: "unavailable",
  },
];
