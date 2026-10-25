import type { DeliveryPartnerProfile } from "@/types/delivery";

// The active demo partner is whichever account signs in on /delivery (see
// src/data/demo-partner-accounts.ts). A second fictional partner exists to prove
// job/history isolation — their jobs must never appear for another partner.

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
