-- Compatibility view to satisfy legacy bookings queries
DROP VIEW IF EXISTS bookings;

CREATE VIEW bookings AS
SELECT
  hb.id,
  hb.hangar_id AS listing_id,
  hb.user_id,
  hb.check_in AS checkin,
  hb.check_out AS checkout,
  hb.subtotal,
  hb.fees,
  hb.total_price AS total,
  hb.payment_method,
  hb.status AS payment_status,
  hb.status AS booking_status,
  NULL::text AS special_requests,
  hb.stripe_payment_intent_id AS payment_intent_id,
  hb.booking_type,
  hb.refund_policy_applied,
  hb.created_at,
  hb.updated_at
FROM hangar_bookings hb;
