declare module '@/config/db' {
  import { Pool } from 'pg';
  const pool: Pool;
  export default pool;
}

declare global {
  type TrasladosRequestStatus = 'new' | 'in_review' | 'scheduled' | 'completed' | 'cancelled';

  interface TrasladosRequest {
    id: number;
    user_id: number | null;
    aircraft_model: string;
    aircraft_prefix: string;
    aircraft_category: string;
    maintenance_status: string | null;
    origin_city: string;
    origin_airport: string | null;
    destination_city: string;
    destination_airport: string | null;
    date_window_start: string;
    date_window_end: string | null;
    contact_name: string;
    contact_email: string;
    contact_phone: string | null;
    operator_name: string | null;
    notes: string | null;
    owner_authorization: boolean;
    status: TrasladosRequestStatus;
    admin_notes: string | null;
    assigned_to: number | null;
    agreement_owner_confirmed_at: string | null;
    agreement_pilot_confirmed_at: string | null;
    agreement_confirmed_at: string | null;
    created_at: string;
    updated_at: string;
  }

  type TrasladosPilotStatus = 'pending' | 'approved' | 'rejected' | 'inactive';

  interface TrasladosPilot {
    id: number;
    user_id: number | null;
    full_name: string;
    contact_email: string;
    contact_phone: string | null;
    license_type: string;
    license_number: string;
    medical_expiry: string | null;
    total_hours: number | null;
    ratings: string | null;
    categories: string | null;
    base_city: string | null;
    availability: string | null;
    status: TrasladosPilotStatus;
    notes: string | null;
    created_at: string;
    updated_at: string;
  }

  interface TrasladosPilotDocument {
    id: number;
    pilot_id: number;
    document_type: string;
    file_path: string;
    file_name: string | null;
    mime_type: string | null;
    created_at: string;
  }

  interface TrasladosOperationUpdate {
    id: number;
    request_id: number;
    created_by: number | null;
    update_type: string;
    status_label: string | null;
    message: string;
    flight_number: string | null;
    departure_airport: string | null;
    arrival_airport: string | null;
    stopover_airport: string | null;
    started_at: string | null;
    arrived_at: string | null;
    interruption_reason: string | null;
    created_at: string;
  }

  interface TrasladosMessage {
    id: number;
    request_id: number;
    sender_user_id: number | null;
    sender_role: string;
    message: string;
    has_redactions: boolean;
    created_at: string;
  }

  interface TrasladosServiceFee {
    id: number;
    request_id: number;
    payer_user_id: number | null;
    payer_role: string;
    amount_cents: number;
    base_amount_cents: number | null;
    discount_cents: number | null;
    discount_reason: string | null;
    currency: string;
    status: string;
    payment_intent_id: string | null;
    created_at: string;
    updated_at: string;
  }
}
