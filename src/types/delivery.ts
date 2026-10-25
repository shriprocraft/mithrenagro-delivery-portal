// Frontend demo models for the Delivery Partner Portal — not a finalized backend schema.
// Status vocabulary and field set follow ORGANIC_MARKETPLACE_DELIVERY_APP_SCOPE.md.
// OTP/proof and earnings fields are intentionally omitted this phase (see docs/ASSUMPTIONS.md).

export type DeliveryStatus =
  | "assigned"
  | "accepted"
  | "arrived_at_pickup"
  | "picked_up"
  | "out_for_delivery"
  | "delivered"
  | "failed"
  | "returned";

export interface DeliveryStatusEvent {
  status: DeliveryStatus;
  at: string; // ISO timestamp, simulated locally
  // Present only on "failed" entries — preserves each failure's reason permanently in
  // the timeline, even across later reattempts.
  reason?: string;
}

export interface DeliveryPartnerProfile {
  id: string;
  name: string;
  phone?: string;
  vehicle_type?: string;
  availability_status: "available" | "unavailable";
}

export interface DeliveryJob {
  id: string;
  delivery_partner_id: string;
  order_reference: string;
  status: DeliveryStatus;
  pickup: {
    label: string;
    address: string;
    contact_name?: string;
    contact_phone?: string;
  };
  dropoff: {
    address: string;
    contact_name?: string;
    contact_phone?: string;
  };
  assigned_at: string;
  delivery_slot_label?: string;
  status_history: DeliveryStatusEvent[];
  // Reflects only the current failure (present while status === "failed"); cleared on
  // reattempt or return. The full reason history lives in status_history entries.
  failed_reason?: string;
  reattempt_count: number;
}
