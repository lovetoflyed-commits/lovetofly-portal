--
-- PostgreSQL database dump
--

\restrict JVovzqMiBBzQYKUGjEvsOhgC4eelJa0rykpWcPTAPEFzAwTu5qkAdWaA1nB7IcL

-- Dumped from database version 17.7 (e429a59)
-- Dumped by pg_dump version 18.1 (Postgres.app)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: neon_auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA neon_auth;


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.account (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" uuid NOT NULL,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamp with time zone,
    "refreshTokenExpiresAt" timestamp with time zone,
    scope text,
    password text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: invitation; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.invitation (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "organizationId" uuid NOT NULL,
    email text NOT NULL,
    role text,
    status text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "inviterId" uuid NOT NULL
);


--
-- Name: jwks; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.jwks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "publicKey" text NOT NULL,
    "privateKey" text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "expiresAt" timestamp with time zone
);


--
-- Name: member; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.member (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "organizationId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    role text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL
);


--
-- Name: organization; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.organization (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    logo text,
    "createdAt" timestamp with time zone NOT NULL,
    metadata text
);


--
-- Name: project_config; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.project_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    endpoint_id text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    trusted_origins jsonb NOT NULL,
    social_providers jsonb NOT NULL,
    email_provider jsonb,
    email_and_password jsonb,
    allow_localhost boolean NOT NULL
);


--
-- Name: session; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.session (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    token text NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "userId" uuid NOT NULL,
    "impersonatedBy" text,
    "activeOrganizationId" text
);


--
-- Name: user; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth."user" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "emailVerified" boolean NOT NULL,
    image text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    role text,
    banned boolean,
    "banReason" text,
    "banExpires" timestamp with time zone
);


--
-- Name: verification; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.verification (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: admin_activity_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_activity_log (
    id integer NOT NULL,
    admin_id integer NOT NULL,
    action_type character varying(50) NOT NULL,
    target_type character varying(50) NOT NULL,
    target_id integer NOT NULL,
    old_value text,
    new_value text,
    notes text,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE admin_activity_log; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.admin_activity_log IS 'Audit trail of all administrative actions';


--
-- Name: COLUMN admin_activity_log.action_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.admin_activity_log.action_type IS 'approve, reject, edit, delete, etc.';


--
-- Name: COLUMN admin_activity_log.target_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.admin_activity_log.target_type IS 'listing, verification, booking, user';


--
-- Name: COLUMN admin_activity_log.target_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.admin_activity_log.target_id IS 'ID of the affected entity';


--
-- Name: admin_activity_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admin_activity_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admin_activity_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admin_activity_log_id_seq OWNED BY public.admin_activity_log.id;


--
-- Name: aircraft_listings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.aircraft_listings (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying(200) NOT NULL,
    manufacturer character varying(100) NOT NULL,
    model character varying(100) NOT NULL,
    year integer NOT NULL,
    registration character varying(20),
    serial_number character varying(50),
    category character varying(50) NOT NULL,
    total_time integer,
    engine_time integer,
    price numeric(12,2) NOT NULL,
    location_city character varying(100) NOT NULL,
    location_state character varying(2) NOT NULL,
    location_country character varying(2) DEFAULT '''BR'''::character varying NOT NULL,
    description text,
    avionics text,
    interior_condition character varying(20),
    exterior_condition character varying(20),
    logs_status character varying(50),
    damage_history boolean DEFAULT false,
    financing_available boolean DEFAULT false,
    partnership_available boolean DEFAULT false,
    status character varying(20) DEFAULT '''draft'''::character varying NOT NULL,
    featured boolean DEFAULT false,
    featured_until timestamp without time zone,
    views integer DEFAULT 0,
    inquiries_count integer DEFAULT 0,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: aircraft_listings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.aircraft_listings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: aircraft_listings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.aircraft_listings_id_seq OWNED BY public.aircraft_listings.id;


--
-- Name: airport_icao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.airport_icao (
    id integer NOT NULL,
    icao_code character varying(4) NOT NULL,
    iata_code character varying(3),
    airport_name character varying(255) NOT NULL,
    city character varying(100) NOT NULL,
    state character varying(100) NOT NULL,
    country character varying(100) NOT NULL,
    latitude numeric(10,8),
    longitude numeric(11,8),
    elevation_feet integer,
    is_public boolean DEFAULT false,
    has_facilities boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: airport_icao_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.airport_icao_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: airport_icao_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.airport_icao_id_seq OWNED BY public.airport_icao.id;


--
-- Name: avionics_listings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.avionics_listings (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying(200) NOT NULL,
    manufacturer character varying(100) NOT NULL,
    model character varying(100) NOT NULL,
    category character varying(50) NOT NULL,
    condition character varying(30) NOT NULL,
    software_version character varying(50),
    tso_certified boolean DEFAULT false,
    panel_mount boolean DEFAULT true,
    price numeric(10,2) NOT NULL,
    location_city character varying(100) NOT NULL,
    location_state character varying(2) NOT NULL,
    description text,
    compatible_aircraft text,
    includes_installation boolean DEFAULT false,
    warranty_remaining character varying(50),
    status character varying(20) DEFAULT '''active'''::character varying NOT NULL,
    featured boolean DEFAULT false,
    views integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: avionics_listings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.avionics_listings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: avionics_listings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.avionics_listings_id_seq OWNED BY public.avionics_listings.id;


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id integer NOT NULL,
    hangar_id integer NOT NULL,
    user_id integer NOT NULL,
    check_in date NOT NULL,
    check_out date NOT NULL,
    nights integer NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    fees numeric(10,2) NOT NULL,
    total_price numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    payment_method character varying(50),
    stripe_payment_intent_id character varying(255),
    stripe_charge_id character varying(255),
    payment_date timestamp without time zone,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bookings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bookings_id_seq OWNED BY public.bookings.id;


--
-- Name: flight_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.flight_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id integer NOT NULL,
    flight_date date NOT NULL,
    departure_aerodrome character varying(10),
    arrival_aerodrome character varying(10),
    aircraft_registration character varying(20),
    aircraft_model character varying(100),
    aircraft_type character varying(30) DEFAULT 'Avião'::character varying,
    departure_time time without time zone,
    arrival_time time without time zone,
    time_diurno interval DEFAULT '00:00:00'::interval,
    time_noturno interval DEFAULT '00:00:00'::interval,
    time_ifr_real interval DEFAULT '00:00:00'::interval,
    time_under_hood interval DEFAULT '00:00:00'::interval,
    time_simulator interval DEFAULT '00:00:00'::interval,
    function character varying(50) DEFAULT 'PIC'::character varying,
    rating character varying(10),
    day_landings integer DEFAULT 0,
    night_landings integer DEFAULT 0,
    nav_miles integer DEFAULT 0,
    remarks text,
    pilot_canac_number character varying(20),
    status character varying(20) DEFAULT 'CADASTRADO'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone
);


--
-- Name: TABLE flight_logs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.flight_logs IS 'Pilot flight logbook entries (Caderneta Individual de Voo) - ANAC CIV Digital compliant';


--
-- Name: COLUMN flight_logs.function; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.flight_logs.function IS 'Pilot function: PIC, SIC, STUDENT, INSTRUCTOR, DUAL';


--
-- Name: COLUMN flight_logs.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.flight_logs.status IS 'CADASTRADO (draft) or ENVIADO (submitted to ANAC)';


--
-- Name: hangar_bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hangar_bookings (
    id integer NOT NULL,
    hangar_id integer NOT NULL,
    user_id integer NOT NULL,
    check_in timestamp without time zone NOT NULL,
    check_out timestamp without time zone NOT NULL,
    nights integer NOT NULL,
    subtotal numeric(12,2),
    fees numeric(12,2),
    total_price numeric(12,2),
    status character varying(20) DEFAULT 'pending'::character varying,
    payment_method character varying(20),
    stripe_payment_intent_id character varying(100),
    booking_type character varying(20) DEFAULT 'overnight'::character varying,
    refund_policy_applied character varying(20),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: hangar_bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hangar_bookings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hangar_bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.hangar_bookings_id_seq OWNED BY public.hangar_bookings.id;


--
-- Name: hangar_listings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hangar_listings (
    id integer NOT NULL,
    owner_id integer NOT NULL,
    icao_code character varying(4) NOT NULL,
    aerodrome_name character varying(200),
    city character varying(100) NOT NULL,
    state character varying(100) NOT NULL,
    country character varying(100) DEFAULT 'Brasil'::character varying NOT NULL,
    hangar_number character varying(50),
    hangar_location_description text,
    hangar_size_sqm numeric(10,2),
    max_wingspan_meters numeric(6,2),
    max_length_meters numeric(6,2),
    max_height_meters numeric(6,2),
    accepted_aircraft_categories jsonb DEFAULT '[]'::jsonb,
    hourly_rate numeric(10,2),
    daily_rate numeric(10,2),
    weekly_rate numeric(10,2),
    monthly_rate numeric(10,2),
    available_from date,
    available_until date,
    is_available boolean DEFAULT true,
    operating_hours jsonb,
    services jsonb DEFAULT '[]'::jsonb,
    description text,
    special_notes text,
    accepts_online_payment boolean DEFAULT false,
    accepts_payment_on_arrival boolean DEFAULT true,
    accepts_payment_on_departure boolean DEFAULT false,
    cancellation_policy character varying(50) DEFAULT 'flexible'::character varying,
    verification_status character varying(20) DEFAULT 'pending'::character varying,
    verified_at timestamp without time zone,
    photos jsonb DEFAULT '[]'::jsonb,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    airport_icao character varying(10),
    hangar_size character varying(50),
    price_per_day numeric(10,2),
    price_per_week numeric(10,2),
    price_per_month numeric(10,2),
    dimensions_length numeric(8,2),
    dimensions_width numeric(8,2),
    dimensions_height numeric(8,2),
    door_dimensions text,
    floor_type character varying(100),
    lighting character varying(100),
    climate_control boolean DEFAULT false,
    security_features text,
    electricity boolean DEFAULT false,
    water_access boolean DEFAULT false,
    fuel_nearby boolean DEFAULT false,
    maintenance_facilities boolean DEFAULT false,
    availability_status character varying(50) DEFAULT 'available'::character varying,
    minimum_rental_period character varying(50),
    maximum_aircraft_weight numeric(10,2),
    insurance_required boolean DEFAULT false,
    special_instructions text,
    approval_status character varying(50) DEFAULT 'pending_approval'::character varying,
    approved_by integer,
    approved_at timestamp without time zone,
    rejection_reason text
);


--
-- Name: COLUMN hangar_listings.availability_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.hangar_listings.availability_status IS 'available, rented, maintenance';


--
-- Name: COLUMN hangar_listings.approval_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.hangar_listings.approval_status IS 'pending_approval, approved, rejected';


--
-- Name: hangar_listings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hangar_listings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hangar_listings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.hangar_listings_id_seq OWNED BY public.hangar_listings.id;


--
-- Name: hangar_owner_verification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hangar_owner_verification (
    id integer NOT NULL,
    owner_id integer NOT NULL,
    document_type character varying(50) NOT NULL,
    document_url text NOT NULL,
    verification_status character varying(50) DEFAULT 'pending'::character varying,
    admin_notes text,
    submitted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    reviewed_at timestamp without time zone,
    reviewed_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE hangar_owner_verification; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.hangar_owner_verification IS 'Verification documents for hangar owners (CNPJ, insurance, etc.)';


--
-- Name: COLUMN hangar_owner_verification.document_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.hangar_owner_verification.document_type IS 'cnpj, business_license, insurance_certificate, etc.';


--
-- Name: COLUMN hangar_owner_verification.verification_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.hangar_owner_verification.verification_status IS 'pending, approved, rejected';


--
-- Name: hangar_owner_verification_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hangar_owner_verification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hangar_owner_verification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.hangar_owner_verification_id_seq OWNED BY public.hangar_owner_verification.id;


--
-- Name: hangar_owners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hangar_owners (
    id integer NOT NULL,
    user_id integer,
    company_name character varying(255) NOT NULL,
    cnpj character varying(18),
    phone character varying(20),
    address text,
    website character varying(255),
    description text,
    is_verified boolean DEFAULT false,
    verification_status character varying(50) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE hangar_owners; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.hangar_owners IS 'Business information for hangar listing owners';


--
-- Name: COLUMN hangar_owners.verification_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.hangar_owners.verification_status IS 'pending, approved, rejected';


--
-- Name: hangar_owners_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hangar_owners_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hangar_owners_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.hangar_owners_id_seq OWNED BY public.hangar_owners.id;


--
-- Name: hangar_photos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hangar_photos (
    id integer NOT NULL,
    listing_id integer NOT NULL,
    photo_url text NOT NULL,
    display_order integer DEFAULT 0,
    is_primary boolean DEFAULT false,
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE hangar_photos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.hangar_photos IS 'Photos for hangar listings with ordering and primary designation';


--
-- Name: COLUMN hangar_photos.listing_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.hangar_photos.listing_id IS 'Foreign key to hangar_listings table';


--
-- Name: COLUMN hangar_photos.display_order; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.hangar_photos.display_order IS 'Order photos appear in gallery (0 = first)';


--
-- Name: COLUMN hangar_photos.is_primary; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.hangar_photos.is_primary IS 'Designates the main photo shown in listings';


--
-- Name: hangar_photos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hangar_photos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hangar_photos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.hangar_photos_id_seq OWNED BY public.hangar_photos.id;


--
-- Name: listing_inquiries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.listing_inquiries (
    id integer NOT NULL,
    listing_type character varying(20) NOT NULL,
    listing_id integer NOT NULL,
    sender_id integer NOT NULL,
    seller_id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    phone character varying(20),
    message text NOT NULL,
    status character varying(20) DEFAULT '''new'''::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: listing_inquiries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.listing_inquiries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: listing_inquiries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.listing_inquiries_id_seq OWNED BY public.listing_inquiries.id;


--
-- Name: listing_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.listing_payments (
    id integer NOT NULL,
    user_id integer NOT NULL,
    listing_type character varying(20) NOT NULL,
    listing_id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    fee_type character varying(30) NOT NULL,
    duration_days integer,
    stripe_payment_intent_id character varying(100),
    status character varying(20) DEFAULT '''pending'''::character varying NOT NULL,
    paid_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: listing_payments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.listing_payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: listing_payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.listing_payments_id_seq OWNED BY public.listing_payments.id;


--
-- Name: listing_photos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.listing_photos (
    id integer NOT NULL,
    listing_type character varying(20) NOT NULL,
    listing_id integer NOT NULL,
    url character varying(500) NOT NULL,
    thumbnail_url character varying(500),
    display_order integer DEFAULT 0,
    is_primary boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: listing_photos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.listing_photos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: listing_photos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.listing_photos_id_seq OWNED BY public.listing_photos.id;


--
-- Name: marketplace_listings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.marketplace_listings (
    id integer NOT NULL,
    user_id integer,
    title character varying(255) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    category character varying(100),
    image_url character varying(255),
    contact_info character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: marketplace_listings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.marketplace_listings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: marketplace_listings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.marketplace_listings_id_seq OWNED BY public.marketplace_listings.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    type character varying(50) DEFAULT 'info'::character varying,
    read boolean DEFAULT false,
    link character varying(500),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: parts_listings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parts_listings (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying(200) NOT NULL,
    part_number character varying(100),
    manufacturer character varying(100),
    category character varying(50) NOT NULL,
    condition character varying(30) NOT NULL,
    time_since_overhaul integer,
    price numeric(10,2) NOT NULL,
    location_city character varying(100) NOT NULL,
    location_state character varying(2) NOT NULL,
    description text,
    compatible_aircraft text,
    has_certification boolean DEFAULT false,
    has_logbook boolean DEFAULT false,
    shipping_available boolean DEFAULT true,
    return_policy character varying(100),
    status character varying(20) DEFAULT '''active'''::character varying NOT NULL,
    featured boolean DEFAULT false,
    views integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: parts_listings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.parts_listings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: parts_listings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.parts_listings_id_seq OWNED BY public.parts_listings.id;


--
-- Name: pgmigrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pgmigrations (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    run_on timestamp without time zone NOT NULL
);


--
-- Name: pgmigrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pgmigrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pgmigrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pgmigrations_id_seq OWNED BY public.pgmigrations.id;


--
-- Name: shop_products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shop_products (
    id integer NOT NULL,
    seller_id integer,
    title character varying(200) NOT NULL,
    sku character varying(50),
    brand character varying(100),
    category character varying(50) NOT NULL,
    price numeric(10,2) NOT NULL,
    compare_at_price numeric(10,2),
    description text,
    short_description character varying(500),
    stock_quantity integer DEFAULT 0,
    low_stock_threshold integer DEFAULT 5,
    weight_grams integer,
    shipping_required boolean DEFAULT true,
    featured boolean DEFAULT false,
    active boolean DEFAULT true,
    views integer DEFAULT 0,
    sales_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: shop_products_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.shop_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: shop_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.shop_products_id_seq OWNED BY public.shop_products.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100),
    birth_date date,
    cpf character varying(14),
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    mobile_phone character varying(20),
    address_street character varying(255),
    address_number character varying(20),
    address_complement character varying(100),
    address_neighborhood character varying(100),
    address_city character varying(100),
    address_state character varying(2),
    address_zip character varying(10),
    address_country character varying(50) DEFAULT 'Brasil'::character varying,
    aviation_role character varying(50),
    aviation_role_other character varying(100),
    social_media character varying(255),
    newsletter_opt_in boolean DEFAULT false,
    terms_agreed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    plan character varying(20) DEFAULT 'standard'::character varying NOT NULL,
    avatar_url text,
    badges text[],
    password_reset_code character varying(6),
    password_reset_expires timestamp without time zone,
    licencas text,
    habilitacoes text,
    curso_atual text
);


--
-- Name: COLUMN users.plan; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.plan IS 'Nível do usuário: standard, premium, pro';


--
-- Name: COLUMN users.avatar_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.avatar_url IS 'User avatar - supports URLs or data URLs (base64)';


--
-- Name: COLUMN users.licencas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.licencas IS 'Licenças do piloto/profissional (ex: PP, PC, ATP) - texto livre';


--
-- Name: COLUMN users.habilitacoes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.habilitacoes IS 'Habilitações/ratings (ex: MLTE, IFR, B737) - texto livre';


--
-- Name: COLUMN users.curso_atual; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.curso_atual IS 'Curso atual em andamento (ex: Hab. Tipo A320) - opcional';


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: admin_activity_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_activity_log ALTER COLUMN id SET DEFAULT nextval('public.admin_activity_log_id_seq'::regclass);


--
-- Name: aircraft_listings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aircraft_listings ALTER COLUMN id SET DEFAULT nextval('public.aircraft_listings_id_seq'::regclass);


--
-- Name: airport_icao id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.airport_icao ALTER COLUMN id SET DEFAULT nextval('public.airport_icao_id_seq'::regclass);


--
-- Name: avionics_listings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avionics_listings ALTER COLUMN id SET DEFAULT nextval('public.avionics_listings_id_seq'::regclass);


--
-- Name: bookings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings ALTER COLUMN id SET DEFAULT nextval('public.bookings_id_seq'::regclass);


--
-- Name: hangar_bookings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hangar_bookings ALTER COLUMN id SET DEFAULT nextval('public.hangar_bookings_id_seq'::regclass);


--
-- Name: hangar_listings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hangar_listings ALTER COLUMN id SET DEFAULT nextval('public.hangar_listings_id_seq'::regclass);


--
-- Name: hangar_owner_verification id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hangar_owner_verification ALTER COLUMN id SET DEFAULT nextval('public.hangar_owner_verification_id_seq'::regclass);


--
-- Name: hangar_owners id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hangar_owners ALTER COLUMN id SET DEFAULT nextval('public.hangar_owners_id_seq'::regclass);


--
-- Name: hangar_photos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hangar_photos ALTER COLUMN id SET DEFAULT nextval('public.hangar_photos_id_seq'::regclass);


--
-- Name: listing_inquiries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_inquiries ALTER COLUMN id SET DEFAULT nextval('public.listing_inquiries_id_seq'::regclass);


--
-- Name: listing_payments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_payments ALTER COLUMN id SET DEFAULT nextval('public.listing_payments_id_seq'::regclass);


--
-- Name: listing_photos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_photos ALTER COLUMN id SET DEFAULT nextval('public.listing_photos_id_seq'::regclass);


--
-- Name: marketplace_listings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_listings ALTER COLUMN id SET DEFAULT nextval('public.marketplace_listings_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: parts_listings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_listings ALTER COLUMN id SET DEFAULT nextval('public.parts_listings_id_seq'::regclass);


--
-- Name: pgmigrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pgmigrations ALTER COLUMN id SET DEFAULT nextval('public.pgmigrations_id_seq'::regclass);


--
-- Name: shop_products id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_products ALTER COLUMN id SET DEFAULT nextval('public.shop_products_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: account; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.account (id, "accountId", "providerId", "userId", "accessToken", "refreshToken", "idToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", scope, password, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: invitation; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.invitation (id, "organizationId", email, role, status, "expiresAt", "createdAt", "inviterId") FROM stdin;
\.


--
-- Data for Name: jwks; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.jwks (id, "publicKey", "privateKey", "createdAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: member; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.member (id, "organizationId", "userId", role, "createdAt") FROM stdin;
\.


--
-- Data for Name: organization; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.organization (id, name, slug, logo, "createdAt", metadata) FROM stdin;
\.


--
-- Data for Name: project_config; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.project_config (id, name, endpoint_id, created_at, updated_at, trusted_origins, social_providers, email_provider, email_and_password, allow_localhost) FROM stdin;
33820e00-b12e-4036-95df-13e2023366aa	lovetofly	ep-billowing-hat-accmfenf	2025-12-25 17:31:41.419+00	2025-12-25 17:31:41.419+00	[{"domain": "http://lovetofly.com.br"}]	[{"id": "google", "isShared": true}]	{"type": "shared"}	{"enabled": true, "disableSignUp": false, "emailVerificationMethod": "otp", "requireEmailVerification": false, "autoSignInAfterVerification": true, "sendVerificationEmailOnSignIn": false, "sendVerificationEmailOnSignUp": false}	t
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.session (id, "expiresAt", token, "createdAt", "updatedAt", "ipAddress", "userAgent", "userId", "impersonatedBy", "activeOrganizationId") FROM stdin;
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth."user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt", role, banned, "banReason", "banExpires") FROM stdin;
\.


--
-- Data for Name: verification; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: admin_activity_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_activity_log (id, admin_id, action_type, target_type, target_id, old_value, new_value, notes, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: aircraft_listings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.aircraft_listings (id, user_id, title, manufacturer, model, year, registration, serial_number, category, total_time, engine_time, price, location_city, location_state, location_country, description, avionics, interior_condition, exterior_condition, logs_status, damage_history, financing_available, partnership_available, status, featured, featured_until, views, inquiries_count, expires_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: airport_icao; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.airport_icao (id, icao_code, iata_code, airport_name, city, state, country, latitude, longitude, elevation_feet, is_public, has_facilities, updated_at) FROM stdin;
1	SBSP	GRU	São Paulo/Congonhas	São Paulo	SP	Brasil	\N	\N	\N	t	t	2025-12-26 17:44:38.345309
2	SBGR	GRU	São Paulo/Guarulhos	Guarulhos	SP	Brasil	\N	\N	\N	t	t	2025-12-26 17:44:38.345309
3	SBRJ	SDU	Rio de Janeiro/Santos Dumont	Rio de Janeiro	RJ	Brasil	\N	\N	\N	t	t	2025-12-26 17:44:38.345309
5	SBAM	MAO	Manaus/Eduardo Gomes	Manaus	AM	Brasil	\N	\N	\N	t	t	2025-12-26 17:44:38.345309
7	SBKT	BSB	Brasília/Presidente Juscelino Kubitschek	Brasília	DF	Brasil	\N	\N	\N	t	t	2025-12-26 17:44:38.345309
10	SBVT	VIX	Vitória/Goitacazes	Vitória	ES	Brasil	\N	\N	\N	t	t	2025-12-26 17:44:38.345309
11	SBUL	UDI	Uberlândia/Ten. Coronel Av. Cesar Bombonato	Uberlândia	MG	Brasil	\N	\N	\N	f	t	2025-12-26 17:44:38.345309
12	SBJD	JAI	Jaú/Mário Pereira Lins	Jaú	SP	Brasil	\N	\N	\N	f	f	2025-12-26 17:44:38.345309
13	SBFI	FLN	Florianópolis/Hercílio Luz	Florianópolis	SC	Brasil	\N	\N	\N	t	t	2025-12-26 17:44:38.345309
14	SBMQ	MAO	Marília/Gastão Liberal Pinheiro	Marília	SP	Brasil	\N	\N	\N	f	f	2025-12-26 17:44:38.345309
15	SBGL	GIG	Rio de Janeiro/Galeão - Antônio Carlos Jobim	Rio de Janeiro	RJ	Brasil	-22.80999900	-43.25055700	\N	t	t	2025-12-26 17:45:00.13942
16	SBBH	PLU	Belo Horizonte/Pampulha - Carlos Drummond de Andrade	Belo Horizonte	MG	Brasil	-19.85138900	-43.95055600	\N	t	t	2025-12-26 17:45:00.13942
17	SBBR	BSB	Brasília/Presidente Juscelino Kubitschek	Brasília	DF	Brasil	-15.86916700	-47.92083400	\N	t	t	2025-12-26 17:45:00.13942
18	SBGO	GYN	Goiânia/Santa Genoveva	Goiânia	GO	Brasil	-16.63194400	-49.22083300	\N	t	t	2025-12-26 17:45:00.13942
19	SBCG	CGR	Campo Grande/Internacional	Campo Grande	MS	Brasil	-20.46861100	-54.67250000	\N	t	t	2025-12-26 17:45:00.13942
25	SBKP	VCP	Viracopos/Campinas	Campinas	SP	Brasil	-23.00722200	-47.13444400	\N	t	t	2025-12-26 17:49:24.354892
9	SBCT	CWB	Curitiba/Afonso Pena	Curitiba	PR	Brasil	\N	\N	\N	t	t	2025-12-26 17:49:24.354892
8	SBPA	POA	Porto Alegre/Salgado Filho	Porto Alegre	RS	Brasil	\N	\N	\N	t	t	2025-12-26 17:49:24.354892
28	SBSV	SSA	Salvador/Dep. Luís Eduardo Magalhães	Salvador	BA	Brasil	-12.90861100	-38.33111100	\N	t	t	2025-12-26 17:49:24.354892
4	SBRF	REC	Recife/Guararapes	Recife	PE	Brasil	\N	\N	\N	t	t	2025-12-26 17:49:24.354892
30	SBRP	RAO	Ribeirão Preto/Leite Lopes	Ribeirão Preto	SP	Brasil	-21.13416700	-47.77416700	\N	t	t	2025-12-26 17:49:24.354892
31	SBJV	JOI	Joinville/Lauro Carneiro de Loyola	Joinville	SC	Brasil	-26.22444400	-48.79750000	\N	t	t	2025-12-26 17:49:24.354892
32	SBLO	LDB	Londrina/Governador José Richa	Londrina	PR	Brasil	-23.33361100	-51.13013900	\N	t	t	2025-12-26 17:49:24.354892
33	SBMG	MGF	Maringá/Sílvio Name Júnior	Maringá	PR	Brasil	-23.47916700	-52.01222200	\N	f	t	2025-12-26 17:49:24.354892
34	SBCX	CXJ	Caxias do Sul/Hugo Cantergiani	Caxias do Sul	RS	Brasil	-29.19705600	-51.18750000	\N	f	t	2025-12-26 17:49:24.354892
6	SBCF	CNF	Belo Horizonte/Confins - Tancredo Neves	Belo Horizonte	MG	Brasil	\N	\N	\N	t	t	2025-12-26 17:44:38.345309
\.


--
-- Data for Name: avionics_listings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.avionics_listings (id, user_id, title, manufacturer, model, category, condition, software_version, tso_certified, panel_mount, price, location_city, location_state, description, compatible_aircraft, includes_installation, warranty_remaining, status, featured, views, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bookings (id, hangar_id, user_id, check_in, check_out, nights, subtotal, fees, total_price, status, payment_method, stripe_payment_intent_id, stripe_charge_id, payment_date, notes, created_at, updated_at) FROM stdin;
1	6	6	2025-12-27	2025-12-28	1	250.00	12.50	262.50	pending	stripe	pi_3SiiMyKWCz68tH5B0BRr4FUk	\N	\N	\N	2025-12-26 21:16:20.962847	2025-12-26 21:16:20.962847
2	6	6	2025-12-27	2025-12-28	1	250.00	12.50	262.50	pending	stripe	pi_3SiiNFKWCz68tH5B1wCn9JVy	\N	\N	\N	2025-12-26 21:16:37.296211	2025-12-26 21:16:37.296211
3	6	6	2025-12-31	2026-01-22	22	4750.00	237.50	4987.50	pending	stripe	pi_3SiiNkKWCz68tH5B0XpN10c0	\N	\N	\N	2025-12-26 21:17:08.656426	2025-12-26 21:17:08.656426
4	6	6	2025-12-31	2026-01-22	22	4750.00	237.50	4987.50	pending	stripe	pi_3SiiNlKWCz68tH5B090grZ2X	\N	\N	\N	2025-12-26 21:17:09.290865	2025-12-26 21:17:09.290865
5	6	6	2025-12-27	2025-12-31	4	1000.00	50.00	1050.00	pending	stripe	pi_3SiiOMKWCz68tH5B1Mpfi9H3	\N	\N	\N	2025-12-26 21:17:46.326873	2025-12-26 21:17:46.326873
6	6	6	2025-12-27	2025-12-31	4	1000.00	50.00	1050.00	pending	stripe	pi_3SiiOMKWCz68tH5B0ZTP0ZRM	\N	\N	\N	2025-12-26 21:17:46.50501	2025-12-26 21:17:46.50501
7	6	6	2025-12-27	2025-12-31	4	1000.00	50.00	1050.00	pending	stripe	pi_3SijHDKWCz68tH5B1gOb8CuM	\N	\N	\N	2025-12-26 22:14:27.833962	2025-12-26 22:14:27.833962
8	6	6	2025-12-27	2025-12-31	4	1000.00	50.00	1050.00	pending	stripe	pi_3SijHPKWCz68tH5B0sKOxSst	\N	\N	\N	2025-12-26 22:14:40.218971	2025-12-26 22:14:40.218971
9	6	6	2025-12-27	2025-12-31	4	1000.00	50.00	1050.00	pending	stripe	pi_3SijKmKWCz68tH5B04Fzc6AR	\N	\N	\N	2025-12-26 22:18:08.485866	2025-12-26 22:18:08.485866
10	6	6	2025-12-27	2025-12-31	4	1000.00	50.00	1050.00	pending	stripe	pi_3SijVRKWCz68tH5B10V0nTIV	\N	\N	\N	2025-12-26 22:29:09.8322	2025-12-26 22:29:09.8322
11	6	6	2025-12-27	2025-12-31	4	1000.00	50.00	1050.00	pending	stripe	pi_3SijbvKWCz68tH5B0IxLbvB5	\N	\N	\N	2025-12-26 22:35:51.482544	2025-12-26 22:35:51.482544
12	6	6	2025-12-27	2025-12-31	4	1000.00	50.00	1050.00	pending	stripe	pi_3SijeZKWCz68tH5B1wEOuWpp	\N	\N	\N	2025-12-26 22:38:36.137592	2025-12-26 22:38:36.137592
13	6	6	2025-12-27	2025-12-31	4	1000.00	50.00	1050.00	pending	stripe	pi_3SijhJKWCz68tH5B00IyKESb	\N	\N	\N	2025-12-26 22:41:26.137309	2025-12-26 22:41:26.137309
14	6	6	2025-12-27	2025-12-31	4	1000.00	50.00	1050.00	pending	stripe	pi_3SijhvKWCz68tH5B1T4sS5p3	\N	\N	\N	2025-12-26 22:42:04.186228	2025-12-26 22:42:04.186228
15	24	6	2026-01-01	2026-01-31	30	3200.00	160.00	3360.00	pending	stripe	pi_3Sik9VKWCz68tH5B1koXQleQ	\N	\N	\N	2025-12-26 23:10:33.223794	2025-12-26 23:10:33.223794
16	24	6	2026-01-01	2026-01-31	30	3200.00	160.00	3360.00	pending	stripe	pi_3Sik9VKWCz68tH5B1ef420Ol	\N	\N	\N	2025-12-26 23:10:33.309294	2025-12-26 23:10:33.309294
17	6	6	2025-12-27	2025-12-31	4	1000.00	50.00	1050.00	pending	stripe	pi_3SikOdKWCz68tH5B0DA14S3l	\N	\N	\N	2025-12-26 23:26:11.931285	2025-12-26 23:26:11.931285
\.


--
-- Data for Name: flight_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.flight_logs (id, user_id, flight_date, departure_aerodrome, arrival_aerodrome, aircraft_registration, aircraft_model, aircraft_type, departure_time, arrival_time, time_diurno, time_noturno, time_ifr_real, time_under_hood, time_simulator, function, rating, day_landings, night_landings, nav_miles, remarks, pilot_canac_number, status, created_at, updated_at, deleted_at) FROM stdin;
87e117a2-c1a3-4a7f-a4d9-fccf87e2e246	6	2026-01-08	snpa	snpa	PPABP	c172	Avião	15:00:00	16:00:00	01:00:00	00:00:00	00:00:00	00:00:00	00:00:00	PIC	VFR	2	0	35	Voo Privado		CADASTRADO	2026-01-10 15:31:53.828872	2026-01-10 15:31:53.828872	\N
411b1a03-221f-4d93-ab8b-941b01a39aeb	6	2026-01-09	snpa	snpa	PTPOW	plz	Planador	11:00:00	12:12:00	01:12:00	00:00:00	00:00:00	00:00:00	00:00:00	PIC	VFR	1	0	0	Voo local		CADASTRADO	2026-01-10 16:41:57.802192	2026-01-10 16:41:57.802192	\N
\.


--
-- Data for Name: hangar_bookings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hangar_bookings (id, hangar_id, user_id, check_in, check_out, nights, subtotal, fees, total_price, status, payment_method, stripe_payment_intent_id, booking_type, refund_policy_applied, created_at, updated_at) FROM stdin;
1	24	6	2025-12-31 00:00:00	2026-01-02 00:00:00	2	320.00	16.00	336.00	pending	stripe	pi_3Sk7xCKWCz68tH5B06XeGuSw	non_refundable	moderate_v1	2025-12-30 18:47:35.146158	2025-12-30 18:47:35.146158
2	24	6	2025-12-31 00:00:00	2026-01-02 00:00:00	2	320.00	16.00	336.00	pending	stripe	pi_3Sk7xDKWCz68tH5B16wsYjmR	non_refundable	moderate_v1	2025-12-30 18:47:35.250789	2025-12-30 18:47:35.250789
3	24	6	2025-12-31 00:00:00	2026-01-02 00:00:00	2	320.00	16.00	336.00	pending	stripe	pi_3SkAnaKWCz68tH5B19udyM7c	non_refundable	moderate_v1	2025-12-30 21:49:50.921872	2025-12-30 21:49:50.921872
4	24	6	2025-12-31 00:00:00	2026-01-02 00:00:00	2	320.00	16.00	336.00	pending	stripe	pi_3SkAnaKWCz68tH5B1BtZ1FbP	non_refundable	moderate_v1	2025-12-30 21:49:50.942291	2025-12-30 21:49:50.942291
5	25	6	2025-12-31 00:00:00	2026-01-02 00:00:00	2	1000.00	50.00	1050.00	pending	stripe	pi_3SkBtaKWCz68tH5B0X5egKrS	non_refundable	moderate_v1	2025-12-30 23:00:06.82238	2025-12-30 23:00:06.82238
6	25	6	2025-12-31 00:00:00	2026-01-02 00:00:00	2	1000.00	50.00	1050.00	pending	stripe	pi_3SkBtaKWCz68tH5B02DBGNZB	non_refundable	moderate_v1	2025-12-30 23:00:06.951112	2025-12-30 23:00:06.951112
7	8	6	2026-01-07 00:00:00	2026-01-14 00:00:00	7	1200.00	60.00	1260.00	pending	stripe	pi_3SmQYzKWCz68tH5B0xfkArvp	refundable	moderate_v1	2026-01-06 03:04:05.178461	2026-01-06 03:04:05.178461
8	8	6	2026-01-07 00:00:00	2026-01-14 00:00:00	7	1200.00	60.00	1260.00	pending	stripe	pi_3SmQYzKWCz68tH5B0N2hxPKT	refundable	moderate_v1	2026-01-06 03:04:05.181445	2026-01-06 03:04:05.181445
9	24	6	2026-01-08 00:00:00	2026-01-11 00:00:00	3	480.00	24.00	504.00	pending	stripe	pi_3SmpH3KWCz68tH5B1IaN5QFO	non_refundable	moderate_v1	2026-01-07 05:27:13.535977	2026-01-07 05:27:13.535977
\.


--
-- Data for Name: hangar_listings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hangar_listings (id, owner_id, icao_code, aerodrome_name, city, state, country, hangar_number, hangar_location_description, hangar_size_sqm, max_wingspan_meters, max_length_meters, max_height_meters, accepted_aircraft_categories, hourly_rate, daily_rate, weekly_rate, monthly_rate, available_from, available_until, is_available, operating_hours, services, description, special_notes, accepts_online_payment, accepts_payment_on_arrival, accepts_payment_on_departure, cancellation_policy, verification_status, verified_at, photos, status, created_at, updated_at, airport_icao, hangar_size, price_per_day, price_per_week, price_per_month, dimensions_length, dimensions_width, dimensions_height, door_dimensions, floor_type, lighting, climate_control, security_features, electricity, water_access, fuel_nearby, maintenance_facilities, availability_status, minimum_rental_period, maximum_aircraft_weight, insurance_required, special_instructions, approval_status, approved_by, approved_at, rejection_reason) FROM stdin;
6	1	SBSP	São Paulo/Congonhas	São Paulo	SP	Brasil	H-12A	Hangar próximo ao pátio de aviação geral, lado oeste do aeroporto	120.00	15.00	12.00	5.50	["monomotor", "bimotor", "executive"]	\N	250.00	1500.00	5500.00	2025-12-26	2026-12-26	t	{"friday": {"open": "06:00", "close": "22:00"}, "monday": {"open": "06:00", "close": "22:00"}, "sunday": {"open": "08:00", "close": "18:00"}, "tuesday": {"open": "06:00", "close": "22:00"}, "saturday": {"open": "08:00", "close": "18:00"}, "thursday": {"open": "06:00", "close": "22:00"}, "wednesday": {"open": "06:00", "close": "22:00"}}	["eletricidade", "agua", "seguranca24h", "iluminacao", "combustivel_proximo", "manutencao_disponivel"]	Hangar moderno em excelente localização no aeroporto de Congonhas. Ideal para aeronaves executivas e monomotores. Estrutura metálica com piso reforçado.	Acesso 24h mediante agendamento prévio. Estacionamento para visitantes disponível. Próximo à área de abastecimento.	t	t	f	flexible	pending	\N	[]	active	2025-12-26 17:45:00.162444	2025-12-26 17:45:00.162444	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	f	available	\N	\N	f	\N	pending_approval	\N	\N	\N
7	1	SBGL	Rio de Janeiro/Galeão - Antônio Carlos Jobim	Rio de Janeiro	RJ	Brasil	H-7B	Hangar na área de aviação geral, taxiway Echo	180.00	18.00	15.00	6.00	["monomotor", "bimotor", "executive", "helicopter"]	\N	350.00	2100.00	7800.00	2025-12-26	2027-12-26	t	{"friday": {"open": "05:00", "close": "23:00"}, "monday": {"open": "05:00", "close": "23:00"}, "sunday": {"open": "06:00", "close": "22:00"}, "tuesday": {"open": "05:00", "close": "23:00"}, "saturday": {"open": "06:00", "close": "22:00"}, "thursday": {"open": "05:00", "close": "23:00"}, "wednesday": {"open": "05:00", "close": "23:00"}}	["eletricidade", "agua", "seguranca24h", "iluminacao", "wifi", "combustivel_proximo", "manutencao_disponivel", "limpeza"]	Hangar amplo com capacidade para até 2 aeronaves médias ou 3 pequenas. Vista para a Baía de Guanabara. Infraestrutura completa para manutenção preventiva.	FBO no local. Serviços de handling disponíveis. Área climatizada para briefing.	t	t	f	flexible	pending	\N	[]	active	2025-12-26 17:45:00.162444	2025-12-26 17:45:00.162444	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	f	available	\N	\N	f	\N	pending_approval	\N	\N	\N
8	1	SBBH	Belo Horizonte/Pampulha - Carlos Drummond de Andrade	Belo Horizonte	MG	Brasil	H-3	Hangar histórico reformado, próximo ao terminal de passageiros	100.00	14.00	11.00	4.80	["monomotor", "bimotor"]	\N	200.00	1200.00	4500.00	2025-12-26	2026-12-26	t	{"friday": {"open": "07:00", "close": "21:00"}, "monday": {"open": "07:00", "close": "21:00"}, "sunday": "closed", "tuesday": {"open": "07:00", "close": "21:00"}, "saturday": {"open": "08:00", "close": "18:00"}, "thursday": {"open": "07:00", "close": "21:00"}, "wednesday": {"open": "07:00", "close": "21:00"}}	["eletricidade", "agua", "seguranca24h", "iluminacao", "combustivel_proximo"]	Hangar com arquitetura modernista preservada, localizado no icônico aeroporto da Pampulha. Perfeito para aeronaves clássicas e monomotores.	Aeroporto histórico projetado por Oscar Niemeyer. Acesso controlado. Clube de aviação nas proximidades.	f	t	f	flexible	pending	\N	[]	active	2025-12-26 17:45:00.162444	2025-12-26 17:45:00.162444	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	f	available	\N	\N	f	\N	pending_approval	\N	\N	\N
9	1	SBBR	Brasília/Presidente Juscelino Kubitschek	Brasília	DF	Brasil	H-15	Hangar de aviação executiva, terminal privado	200.00	20.00	16.00	6.50	["monomotor", "bimotor", "executive", "jet"]	\N	450.00	2700.00	9500.00	2025-12-26	2028-12-26	t	{"friday": {"open": "00:00", "close": "23:59"}, "monday": {"open": "00:00", "close": "23:59"}, "sunday": {"open": "00:00", "close": "23:59"}, "tuesday": {"open": "00:00", "close": "23:59"}, "saturday": {"open": "00:00", "close": "23:59"}, "thursday": {"open": "00:00", "close": "23:59"}, "wednesday": {"open": "00:00", "close": "23:59"}}	["eletricidade", "agua", "seguranca24h", "iluminacao", "wifi", "ar_condicionado", "combustivel_proximo", "manutencao_disponivel", "limpeza", "sala_reuniao"]	Hangar premium no principal aeroporto do Centro-Oeste. Estrutura de alto padrão com facilidades VIP. Ideal para jatos executivos e aeronaves de grande porte.	Operação 24/7. Acesso direto à pista. Sala de reuniões executivas. Serviço de concierge disponível. Próximo ao terminal de aviação executiva.	t	t	f	flexible	pending	\N	[]	active	2025-12-26 17:45:00.162444	2025-12-26 17:45:00.162444	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	f	available	\N	\N	f	\N	pending_approval	\N	\N	\N
10	1	SBGO	Goiânia/Santa Genoveva	Goiânia	GO	Brasil	H-9	Hangar na área de aviação agrícola, fácil acesso	150.00	16.00	13.00	5.00	["monomotor", "bimotor", "agricola"]	\N	180.00	1000.00	3800.00	2025-12-26	2026-12-26	t	{"friday": {"open": "06:00", "close": "20:00"}, "monday": {"open": "06:00", "close": "20:00"}, "sunday": "closed", "tuesday": {"open": "06:00", "close": "20:00"}, "saturday": {"open": "07:00", "close": "17:00"}, "thursday": {"open": "06:00", "close": "20:00"}, "wednesday": {"open": "06:00", "close": "20:00"}}	["eletricidade", "agua", "seguranca", "iluminacao", "combustivel_proximo", "lavagem", "area_carregamento"]	Hangar robusto ideal para aviação agrícola e utilitária. Piso reforçado para suportar produtos químicos. Área ampla para manobras.	Próximo à oficina de manutenção especializada em agrícolas. Área de lavagem externa. Estacionamento para veículos de apoio.	f	t	f	flexible	pending	\N	[]	active	2025-12-26 17:45:00.162444	2025-12-26 17:45:00.162444	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	f	available	\N	\N	f	\N	pending_approval	\N	\N	\N
11	1	SBKP	Viracopos/Campinas	Campinas	SP	Brasil	H-1	Próximo ao pátio de aviação geral	80.00	12.00	10.00	4.00	["monomotor"]	\N	150.00	900.00	3200.00	2025-12-26	2026-06-26	t	{"friday": {"open": "07:00", "close": "19:00"}, "monday": {"open": "07:00", "close": "19:00"}, "sunday": "closed", "tuesday": {"open": "07:00", "close": "19:00"}, "saturday": {"open": "08:00", "close": "16:00"}, "thursday": {"open": "07:00", "close": "19:00"}, "wednesday": {"open": "07:00", "close": "19:00"}}	["eletricidade", "iluminacao", "seguranca"]	Hangar econômico ideal para estacionamento diário de monomotores pequenos. Estrutura simples mas segura.	Ideal para pernoite ou curta duração. Acesso durante horário comercial.	f	t	f	flexible	pending	\N	[]	active	2025-12-26 17:49:24.388004	2025-12-26 17:49:24.388004	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	f	available	\N	\N	f	\N	pending_approval	\N	\N	\N
12	1	SBKP	Viracopos/Campinas	Campinas	SP	Brasil	H-UL1	Área de ultraleves, lateral norte	50.00	10.00	8.00	3.50	["ultralight", "helicopter"]	25.00	180.00	1050.00	3800.00	2025-12-26	2026-12-26	t	{"friday": {"open": "06:00", "close": "22:00"}, "monday": {"open": "06:00", "close": "22:00"}, "sunday": {"open": "06:00", "close": "22:00"}, "tuesday": {"open": "06:00", "close": "22:00"}, "saturday": {"open": "06:00", "close": "22:00"}, "thursday": {"open": "06:00", "close": "22:00"}, "wednesday": {"open": "06:00", "close": "22:00"}}	["eletricidade", "seguranca24h"]	Hangar especializado para ultraleves e helicópteros. Cobrança por hora para paradas rápidas.	Perfeito para voos de instrução. Mínimo 2 horas. Desconto para pacotes de 10+ horas.	t	t	f	flexible	pending	\N	[]	active	2025-12-26 17:49:24.388004	2025-12-26 17:49:24.388004	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	f	available	\N	\N	f	\N	pending_approval	\N	\N	\N
13	1	SBCT	Curitiba/Afonso Pena	Curitiba	PR	Brasil	H-VIP	Terminal executivo, acesso direto à pista	250.00	22.00	18.00	7.00	["executive", "jet", "bimotor", "monomotor"]	80.00	600.00	3600.00	12000.00	2025-12-26	2027-12-26	t	{"friday": {"open": "00:00", "close": "23:59"}, "monday": {"open": "00:00", "close": "23:59"}, "sunday": {"open": "00:00", "close": "23:59"}, "tuesday": {"open": "00:00", "close": "23:59"}, "saturday": {"open": "00:00", "close": "23:59"}, "thursday": {"open": "00:00", "close": "23:59"}, "wednesday": {"open": "00:00", "close": "23:59"}}	["eletricidade", "agua", "seguranca24h", "iluminacao", "wifi", "ar_condicionado", "combustivel_proximo", "manutencao_disponivel", "limpeza", "sala_reuniao", "lounge_vip"]	Hangar premium de alto padrão. Capacidade para jatos executivos até médio porte. Infraestrutura VIP completa com lounge, sala de reuniões e serviço de concierge.	Operação 24/7. Valet service incluído. Desconto de 10% para contratos anuais.	t	t	f	flexible	pending	\N	[]	active	2025-12-26 17:49:24.388004	2025-12-26 17:49:24.388004	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	f	available	\N	\N	f	\N	pending_approval	\N	\N	\N
14	1	SBPA	Porto Alegre/Salgado Filho	Porto Alegre	RS	Brasil	H-BASE	Hangar de base, área privativa	140.00	16.00	14.00	5.50	["monomotor", "bimotor"]	\N	\N	\N	4200.00	2025-12-26	2028-12-26	t	{"friday": {"open": "06:00", "close": "22:00"}, "monday": {"open": "06:00", "close": "22:00"}, "sunday": {"open": "08:00", "close": "20:00"}, "tuesday": {"open": "06:00", "close": "22:00"}, "saturday": {"open": "08:00", "close": "20:00"}, "thursday": {"open": "06:00", "close": "22:00"}, "wednesday": {"open": "06:00", "close": "22:00"}}	["eletricidade", "agua", "seguranca24h", "iluminacao", "manutencao_disponivel"]	Hangar para base permanente de aeronaves. Contrato mínimo de 3 meses. Ideal para proprietários residentes.	Vaga fixa garantida. Contrato anual com desconto de 15%. Área exclusiva para manutenção.	f	t	f	flexible	pending	\N	[]	active	2025-12-26 17:49:24.388004	2025-12-26 17:49:24.388004	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	f	available	\N	\N	f	\N	pending_approval	\N	\N	\N
15	1	SBSV	Salvador/Dep. Luís Eduardo Magalhães	Salvador	BA	Brasil	H-AG1	Área agrícola, zona industrial	160.00	18.00	14.00	6.00	["agricola", "monomotor", "bimotor"]	\N	220.00	1200.00	4000.00	2025-12-26	2026-12-26	t	{"friday": {"open": "05:00", "close": "20:00"}, "monday": {"open": "05:00", "close": "20:00"}, "sunday": "closed", "tuesday": {"open": "05:00", "close": "20:00"}, "saturday": {"open": "06:00", "close": "18:00"}, "thursday": {"open": "05:00", "close": "20:00"}, "wednesday": {"open": "05:00", "close": "20:00"}}	["eletricidade", "agua", "iluminacao", "lavagem", "area_carregamento", "oficina_basica"]	Hangar robusto para aviação agrícola e utilitária. Piso químico resistente. Área externa para lavagem e carregamento.	Desconto para pacotes semanais durante safra. Oficina básica no local.	f	t	f	flexible	pending	\N	[]	active	2025-12-26 17:49:24.388004	2025-12-26 17:49:24.388004	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	f	available	\N	\N	f	\N	pending_approval	\N	\N	\N
16	1	SBRF	Recife/Guararapes	Recife	PE	Brasil	H-8	Setor alfa, próximo FBO	130.00	15.00	13.00	5.00	["monomotor", "bimotor", "executive"]	\N	280.00	1680.00	6000.00	2025-12-26	2026-12-26	t	{"friday": {"open": "06:00", "close": "22:00"}, "monday": {"open": "06:00", "close": "22:00"}, "sunday": {"open": "08:00", "close": "20:00"}, "tuesday": {"open": "06:00", "close": "22:00"}, "saturday": {"open": "07:00", "close": "21:00"}, "thursday": {"open": "06:00", "close": "22:00"}, "wednesday": {"open": "06:00", "close": "22:00"}}	["eletricidade", "agua", "seguranca24h", "iluminacao", "wifi", "combustivel_proximo"]	Hangar versátil para diversos tipos de aeronaves. Boa localização próxima a serviços.	Wi-Fi disponível. Desconto de 5% para reservas de 7+ dias.	t	t	f	flexible	pending	\N	[]	active	2025-12-26 17:49:24.388004	2025-12-26 17:49:24.388004	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	f	available	\N	\N	f	\N	pending_approval	\N	\N	\N
17	1	SBRP	Ribeirão Preto/Leite Lopes	Ribeirão Preto	SP	Brasil	H-2A	Lado oeste, acesso rápido	70.00	11.00	9.00	4.00	["monomotor"]	\N	130.00	780.00	2800.00	2025-12-26	2026-12-26	t	{"friday": {"open": "06:00", "close": "20:00"}, "monday": {"open": "06:00", "close": "20:00"}, "sunday": "closed", "tuesday": {"open": "06:00", "close": "20:00"}, "saturday": {"open": "07:00", "close": "18:00"}, "thursday": {"open": "06:00", "close": "20:00"}, "wednesday": {"open": "06:00", "close": "20:00"}}	["eletricidade", "iluminacao", "seguranca"]	Hangar compacto e econômico. Ideal para monomotores pequenos em trânsito.	Tarifa especial de pernoite: R$ 100 (18h-08h). Check-in/out flexível.	f	t	f	flexible	pending	\N	[]	active	2025-12-26 17:49:24.388004	2025-12-26 17:49:24.388004	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	f	available	\N	\N	f	\N	pending_approval	\N	\N	\N
18	1	SBJV	Joinville/Lauro Carneiro de Loyola	Joinville	SC	Brasil	H-ESC	Área de instrução	90.00	12.00	10.00	4.50	["monomotor", "ultralight"]	18.00	140.00	840.00	3000.00	2025-12-26	2027-12-26	t	{"friday": {"open": "06:00", "close": "21:00"}, "monday": {"open": "06:00", "close": "21:00"}, "sunday": {"open": "07:00", "close": "19:00"}, "tuesday": {"open": "06:00", "close": "21:00"}, "saturday": {"open": "06:00", "close": "21:00"}, "thursday": {"open": "06:00", "close": "21:00"}, "wednesday": {"open": "06:00", "close": "21:00"}}	["eletricidade", "iluminacao", "seguranca", "wifi", "sala_briefing"]	Hangar voltado para escolas de aviação e aeronaves de instrução. Pacotes especiais para escolas.	Pacote escola: 100 horas por R$ 1.500. Sala de briefing incluída.	t	t	f	flexible	pending	\N	[]	active	2025-12-26 17:49:24.388004	2025-12-26 17:49:24.388004	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	f	available	\N	\N	f	\N	pending_approval	\N	\N	\N
19	1	SBLO	Londrina/Governador José Richa	Londrina	PR	Brasil	H-EXEC	Terminal executivo	180.00	18.00	15.00	6.00	["executive", "bimotor", "jet"]	\N	380.00	2280.00	8000.00	2025-12-26	2026-12-26	t	{"friday": {"open": "00:00", "close": "23:59"}, "monday": {"open": "00:00", "close": "23:59"}, "sunday": {"open": "00:00", "close": "23:59"}, "tuesday": {"open": "00:00", "close": "23:59"}, "saturday": {"open": "00:00", "close": "23:59"}, "thursday": {"open": "00:00", "close": "23:59"}, "wednesday": {"open": "00:00", "close": "23:59"}}	["eletricidade", "agua", "seguranca24h", "iluminacao", "wifi", "ar_condicionado", "combustivel_proximo", "manutencao_disponivel", "limpeza"]	Hangar executivo com serviços premium. Operação 24 horas. Ideal para aviação corporativa.	Contrato semestral: 10% desconto. Contrato anual: 20% desconto.	t	t	f	flexible	pending	\N	[]	active	2025-12-26 17:49:24.388004	2025-12-26 17:49:24.388004	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	f	available	\N	\N	f	\N	pending_approval	\N	\N	\N
20	1	SBMG	Maringá/Sílvio Name Júnior	Maringá	PR	Brasil	H-TAXI	Base de táxi aéreo	110.00	14.00	12.00	5.00	["monomotor", "bimotor"]	30.00	200.00	1200.00	4200.00	2025-12-26	2026-12-26	t	{"friday": {"open": "00:00", "close": "23:59"}, "monday": {"open": "00:00", "close": "23:59"}, "sunday": {"open": "00:00", "close": "23:59"}, "tuesday": {"open": "00:00", "close": "23:59"}, "saturday": {"open": "00:00", "close": "23:59"}, "thursday": {"open": "00:00", "close": "23:59"}, "wednesday": {"open": "00:00", "close": "23:59"}}	["eletricidade", "agua", "seguranca24h", "iluminacao", "combustivel_proximo", "lavagem"]	Hangar para operações de táxi aéreo. Base operacional com alta rotatividade. Acesso 24/7.	Descontos progressivos: 7 dias (-5%), 15 dias (-10%), 30 dias (-15%).	t	t	f	flexible	pending	\N	[]	active	2025-12-26 17:49:24.388004	2025-12-26 17:49:24.388004	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	f	available	\N	\N	f	\N	pending_approval	\N	\N	\N
21	1	SBCX	Caxias do Sul/Hugo Cantergiani	Caxias do Sul	RS	Brasil	H-SHARE	Hangar coletivo	200.00	20.00	16.00	6.50	["monomotor", "bimotor", "executive"]	\N	\N	\N	2500.00	2025-12-26	2030-12-26	t	{"friday": {"open": "06:00", "close": "22:00"}, "monday": {"open": "06:00", "close": "22:00"}, "sunday": {"open": "08:00", "close": "20:00"}, "tuesday": {"open": "06:00", "close": "22:00"}, "saturday": {"open": "07:00", "close": "21:00"}, "thursday": {"open": "06:00", "close": "22:00"}, "wednesday": {"open": "06:00", "close": "22:00"}}	["eletricidade", "agua", "seguranca24h", "iluminacao", "wifi"]	Hangar compartilhado para até 4 aeronaves. Economia com custo rateado. Vaga garantida.	Contrato mínimo 6 meses. Anual: R$ 28.000 (economia de R$ 2.000).	t	t	f	flexible	pending	\N	[]	active	2025-12-26 17:49:24.388004	2025-12-26 17:49:24.388004	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	f	available	\N	\N	f	\N	pending_approval	\N	\N	\N
22	1	SBSP	São Paulo/Congonhas	São Paulo	SP	Brasil	H-NIGHT	Área norte, acesso 24h	100.00	13.00	11.00	4.80	["monomotor", "bimotor"]	\N	200.00	1200.00	4500.00	2025-12-26	2026-12-26	t	{"friday": {"open": "00:00", "close": "23:59"}, "monday": {"open": "00:00", "close": "23:59"}, "sunday": {"open": "00:00", "close": "23:59"}, "tuesday": {"open": "00:00", "close": "23:59"}, "saturday": {"open": "00:00", "close": "23:59"}, "thursday": {"open": "00:00", "close": "23:59"}, "wednesday": {"open": "00:00", "close": "23:59"}}	["eletricidade", "seguranca24h", "iluminacao"]	Hangar com tarifa especial para pernoite. Ideal para quem chega tarde e sai cedo.	Tarifa pernoite (18h-08h): R$ 120. Tarifa diurna (08h-18h): R$ 150. Diária completa: R$ 200.	t	t	f	flexible	pending	\N	[]	active	2025-12-26 17:49:24.388004	2025-12-26 17:49:24.388004	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	f	available	\N	\N	f	\N	pending_approval	\N	\N	\N
23	1	SBGL	Rio de Janeiro/Galeão - Antônio Carlos Jobim	Rio de Janeiro	RJ	Brasil	H-LARGE	Hangar grande porte, pista principal	300.00	25.00	22.00	8.00	["jet", "turboprop", "executive"]	120.00	800.00	4800.00	16000.00	2025-12-26	2028-12-26	t	{"friday": {"open": "00:00", "close": "23:59"}, "monday": {"open": "00:00", "close": "23:59"}, "sunday": {"open": "00:00", "close": "23:59"}, "tuesday": {"open": "00:00", "close": "23:59"}, "saturday": {"open": "00:00", "close": "23:59"}, "thursday": {"open": "00:00", "close": "23:59"}, "wednesday": {"open": "00:00", "close": "23:59"}}	["eletricidade", "agua", "seguranca24h", "iluminacao", "wifi", "ar_condicionado", "combustivel_proximo", "manutencao_disponivel", "limpeza", "sala_reuniao", "lounge_vip", "handling"]	Hangar de grande porte para jatos executivos e turbohélices. Infraestrutura completa de FBO. Serviços de handling disponíveis.	Pacote semestral: R$ 90.000 (6% off). Pacote anual: R$ 170.000 (11% off).	t	t	f	flexible	pending	\N	[]	active	2025-12-26 17:49:24.388004	2025-12-26 17:49:24.388004	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	f	available	\N	\N	f	\N	pending_approval	\N	\N	\N
24	1	SBBH	Belo Horizonte/Pampulha - Carlos Drummond de Andrade	Belo Horizonte	MG	Brasil	H-WEEKEND	Próximo ao clube	85.00	12.00	10.00	4.50	["monomotor"]	\N	160.00	900.00	3200.00	2025-12-26	2026-12-26	t	{"friday": {"open": "07:00", "close": "22:00"}, "monday": {"open": "07:00", "close": "19:00"}, "sunday": {"open": "06:00", "close": "22:00"}, "tuesday": {"open": "07:00", "close": "19:00"}, "saturday": {"open": "06:00", "close": "22:00"}, "thursday": {"open": "07:00", "close": "19:00"}, "wednesday": {"open": "07:00", "close": "19:00"}}	["eletricidade", "iluminacao", "seguranca", "wifi"]	Hangar com tarifas especiais para finais de semana. Próximo ao aeroclube com restaurante.	Tarifa fim de semana (sex-dom): R$ 250. Tarifa semanal: R$ 900. Clube de aviação ao lado.	t	t	f	flexible	pending	\N	[]	active	2025-12-26 17:49:24.388004	2025-12-26 17:49:24.388004	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	f	available	\N	\N	f	\N	pending_approval	\N	\N	\N
25	1	SBBR	Brasília/Presidente Juscelino Kubitschek	Brasília	DF	Brasil	H-CORP	Área corporativa isolada	220.00	20.00	17.00	6.50	["jet", "executive", "bimotor"]	\N	500.00	3000.00	10500.00	2025-12-26	2030-12-26	t	{"friday": {"open": "00:00", "close": "23:59"}, "monday": {"open": "00:00", "close": "23:59"}, "sunday": {"open": "00:00", "close": "23:59"}, "tuesday": {"open": "00:00", "close": "23:59"}, "saturday": {"open": "00:00", "close": "23:59"}, "thursday": {"open": "00:00", "close": "23:59"}, "wednesday": {"open": "00:00", "close": "23:59"}}	["eletricidade", "agua", "seguranca24h", "iluminacao", "wifi", "ar_condicionado", "combustivel_proximo", "manutencao_disponivel", "limpeza", "sala_reuniao", "seguranca_reforçada"]	Hangar corporativo de alto nível com segurança reforçada. Ideal para frotas governamentais e empresas. Área restrita.	Contratos corporativos personalizados. Anual: R$ 115.000 (8% desconto). Segurança 24h com câmeras.	t	t	f	flexible	pending	\N	[]	active	2025-12-26 17:49:24.388004	2025-12-26 17:49:24.388004	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	f	available	\N	\N	f	\N	pending_approval	\N	\N	\N
\.


--
-- Data for Name: hangar_owner_verification; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hangar_owner_verification (id, owner_id, document_type, document_url, verification_status, admin_notes, submitted_at, reviewed_at, reviewed_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: hangar_owners; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hangar_owners (id, user_id, company_name, cnpj, phone, address, website, description, is_verified, verification_status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: hangar_photos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hangar_photos (id, listing_id, photo_url, display_order, is_primary, uploaded_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: listing_inquiries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.listing_inquiries (id, listing_type, listing_id, sender_id, seller_id, name, email, phone, message, status, created_at) FROM stdin;
\.


--
-- Data for Name: listing_payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.listing_payments (id, user_id, listing_type, listing_id, amount, fee_type, duration_days, stripe_payment_intent_id, status, paid_at, created_at) FROM stdin;
\.


--
-- Data for Name: listing_photos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.listing_photos (id, listing_type, listing_id, url, thumbnail_url, display_order, is_primary, created_at) FROM stdin;
\.


--
-- Data for Name: marketplace_listings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.marketplace_listings (id, user_id, title, description, price, category, image_url, contact_info, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, title, message, type, read, link, created_at) FROM stdin;
\.


--
-- Data for Name: parts_listings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.parts_listings (id, user_id, title, part_number, manufacturer, category, condition, time_since_overhaul, price, location_city, location_state, description, compatible_aircraft, has_certification, has_logbook, shipping_available, return_policy, status, featured, views, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: pgmigrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pgmigrations (id, name, run_on) FROM stdin;
1	001_create_users_table	2025-12-25 16:22:32.776344
2	002_create_marketplace_table	2025-12-25 16:22:32.776344
3	003_add_user_plan_column	2025-12-25 16:22:32.776344
4	004_add_missing_user_columns	2025-12-25 16:22:32.776344
5	005_drop_anac_code_column	2025-12-25 16:22:32.776344
6	006_make_birth_date_nullable	2025-12-25 16:22:32.776344
7	007_make_cpf_nullable	2025-12-25 16:22:32.776344
8	008_make_all_new_columns_nullable	2025-12-25 16:22:32.776344
9	009_create_hangar_photos_table	2026-01-06 04:14:51.486811
10	010_create_hangar_owners_table	2026-01-06 04:14:51.486811
11	011_create_hangar_owner_verification_table	2026-01-06 04:14:51.486811
12	012_create_admin_activity_log_table	2026-01-06 04:14:51.486811
13	013_add_hangarshare_columns	2026-01-06 04:14:51.486811
37	018_extend_users_aviation_fields	2026-01-10 10:05:10.19
38	016_create_applications_table	2026-01-10 10:05:10.19
39	023_create_companies_jobs_uuid	2026-01-10 10:05:10.19
40	020_add_company_currency	2026-01-10 10:05:10.19
41	022_set_company_currency_default_brl	2026-01-10 10:05:10.19
43	021_add_job_salary_currency	2026-01-10 10:05:10.19
44	015_create_jobs_table	2026-01-10 10:05:10.19
42	017_create_reviews_table	2026-01-10 10:05:10.19
45	014_create_companies_table	2026-01-10 10:05:10.19
46	019_create_career_profiles_table	2026-01-10 10:05:10.19
47	024_classifieds_marketplace_schema	2026-01-10 10:05:10.19
49	026_extend_avatar_url_column	2026-01-10 10:05:10.19
48	025_password_reset_fields	2026-01-10 10:05:10.19
50	028_create_flight_logs_table	2026-01-10 13:06:08.36802
51	029_anac_civ_digital_compliance	2026-01-10 13:06:08.36802
52	030_add_deleted_at_to_flight_logs	2026-01-10 15:14:43.849235
\.


--
-- Data for Name: shop_products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shop_products (id, seller_id, title, sku, brand, category, price, compare_at_price, description, short_description, stock_quantity, low_stock_threshold, weight_grams, shipping_required, featured, active, views, sales_count, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, first_name, last_name, birth_date, cpf, email, password_hash, mobile_phone, address_street, address_number, address_complement, address_neighborhood, address_city, address_state, address_zip, address_country, aviation_role, aviation_role_other, social_media, newsletter_opt_in, terms_agreed, created_at, updated_at, plan, avatar_url, badges, password_reset_code, password_reset_expires, licencas, habilitacoes, curso_atual) FROM stdin;
7	Edinho	Filho	2014-01-08	07086563668	kaiser.thegoat123321@gmail.com	$2b$10$zegcJP0CpqeqBq0oS8TPLewNTdE7t3zkOI.NHf4kKKkQ4trWwg5G6	11999999999	Avenida Assis Chateaubriand	197		Floresta	Belo Horizonte	MG	30150100	Brasil	pilot	\N	\N	f	t	2025-12-26 03:13:44.613704+00	2025-12-26 04:17:07.677378+00	pro	\N	\N	\N	\N	\N	\N	\N
5	Marcela	Silva 	1984-07-16	071.914.106-04	silvaramosmarcela@gmail.com	$2b$10$tIvJQEXTv4QfVKnvRCXFMuI/lhESVVsJBqunpyuyH8Zfn3LmAvgUO	(31) 99256-4174	Avenida Assis Chateaubriand	1197	701	Floresta	BELO HORIZONTE	MG	30150-100	Brasil	Piloto		Marcella.ramos.108 	f	t	2025-12-25 12:51:26.956546+00	2025-12-26 04:17:07.751314+00	premium	\N	\N	\N	\N	\N	\N	\N
1	Hangar	Demo Owner	1980-01-01	00000000000	demo-owner@lovetofly.com.br	$2a$10$dummyHashForDemoUserOnly	11999999999	Rua Demo	123	\N	Centro	São Paulo	SP	01000-000	Brasil	owner	\N	\N	f	t	2025-12-26 17:44:50.249985+00	2025-12-26 17:44:55.763695+00	standard	\N	\N	\N	\N	\N	\N	\N
15	joao	silva	1990-01-01	12345678900	joao.silva@gamil.com	$2b$10$k9oFf.29ZxFlQqlabPEe2uJbaFJ2kDk0PEusYbEUfLvqVajhtPJRC	11111111111	Rua Professor João Martins	111		Luxemburgo	Belo Horizonte	MG	30380580	Brasil	pilot	\N	\N	f	t	2025-12-31 03:03:09.124768+00	2025-12-31 03:03:09.124768+00	free	\N	\N	\N	\N	\N	\N	\N
16	Edinei	Saraiva	1987-05-21	35468510804	saraiva.edinei@gmail.com	$2b$10$IbTMG/BmWZXIm6D9kQ7z8uYVjenIuoHJBzpb58jk2SRbnbYUaahBq	11958352054	Rua Hieronimo Gonçalves Meira 	21	Casa 01 	Recanto Pereira	Santana de Parnaíba	SP	06528110	Brasil	student	\N	\N	f	t	2026-01-03 17:09:22.040657+00	2026-01-05 23:07:19.387052+00	pro	\N	\N	\N	\N	\N	\N	\N
17	Elizete	Eustáquio 	1951-11-30	02957324660	andrezas.ramos@gmail.com	$2b$10$Oz3Zddz4jCHd5mU7UUsI3.2PSTLsrSSBEIi0ZjRCdh4YS9hViof.y	31993511606	Rua Descalvado	204		Renascença	Belo Horizonte	MG	31130610	Brasil	student	\N	\N	f	t	2026-01-05 23:03:48.935165+00	2026-01-05 23:07:19.406348+00	pro	\N	\N	\N	\N	\N	\N	\N
13	Eder	Cruz	1985-06-24	01289203350	cruzdossantoseder@gmail.com	$2b$10$sMnRDXdB4Vi3qXSPr7jBHe64GckvBxOF2u.qKHouWdHsHI0KJZPXe	99981140050	hermes da fonseca	1831		maranhão novo	Imperatriz	MA	65903160	Brasil	pilot	\N	\N	f	t	2025-12-31 02:57:13.062062+00	2026-01-05 23:08:35.127058+00	pro	\N	\N	\N	\N	\N	\N	\N
18	Andreza	Ramos	1987-01-09	07800393607	andreza.ramos87@outlook.com	$2b$10$q8qY6o.2MeZqG1zRyiYJr.JkAD.u0pRQ0C5yctIhFs9.jUrJFzOwK	31993511606	Rua Descalvado	204		Renascença	Belo Horizonte	MG	31130610	Brasil	student	\N	\N	f	t	2026-01-05 23:15:18.621287+00	2026-01-05 23:16:51.215959+00	pro	\N	\N	\N	\N	\N	\N	\N
19	Teste	Perfil	1990-01-01	12345678901	teste.perfil@lovetofly.com.br	$2b$10$E76do47eCt/Hi2TRgg.SAeGo6ZyBf3oKOCohSjfSma42SHpc1zNAy	1199999999	Rua Teste	123	\N	Centro	São Paulo	SP	01310100	Brasil	pilot	\N	\N	f	t	2026-01-05 23:34:10.090086+00	2026-01-05 23:34:10.090086+00	free	\N	\N	\N	\N	\N	\N	\N
6	Edson L. C.	Assumpção	1978-09-06	02975488670	lovetofly.ed@gmail.com	$2b$10$1vXiFsLykXHZFbC//uhxdu9aoFVgmBfZpbALDnm6yiKPq6fqm7Iv.	5531983141109	Avenida Assis Chateaubriand	197		Floresta	Belo Horizonte	MG	30150100	Brasil	Piloto Comercial (PC)	\N	\N	f	t	2025-12-25 22:38:46.509172+00	2026-01-10 18:13:07.160123+00	pro	data:image/jpeg;base64,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SaF4c8OfCPQYvGPikpPqVypNvbcFhkcHHYHPJ7fWvJribxJ8TtXfVtTfEacAZxHGg7KPQfma81tTTitI9+rPepUpKom/el0XRH//1P8AP/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACpIZZIJVniO1kIYEdiOlR0UDTOxil1Dxbqh1PXpy8a4Du54UDoPYfSr+o61NfY8PeFkcQu23C/ekPuB/KuSsftt5s0i0yfOYDaO57V7pavoPwj0x5Ljbea1cL8iDGIQf7xGef8j1rirpJrS76I9zCVZcjd7Lq+vof//V/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKANDS9SutJvk1CybZLHna3pkYr274Z/DyDxXDc+OfHNz5WnRbv3kjYLuvU5Oc47DufYV4DXb6ZqvinxHZWngKymLQGQmOEYCljk5J7/jWGIi3HR2PRy6vGM/fV10Xmf//W/wA/+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACtLSNWvdEv01HT32SpnB+oxWbRSavoxxdndH/9k=	\N	330544	2026-01-08 00:44:36.02	PC	IFRA, MLTE, MNTE	INVA
\.


--
-- Name: admin_activity_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.admin_activity_log_id_seq', 1, false);


--
-- Name: aircraft_listings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.aircraft_listings_id_seq', 1, false);


--
-- Name: airport_icao_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.airport_icao_id_seq', 34, true);


--
-- Name: avionics_listings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.avionics_listings_id_seq', 1, false);


--
-- Name: bookings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.bookings_id_seq', 17, true);


--
-- Name: hangar_bookings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.hangar_bookings_id_seq', 9, true);


--
-- Name: hangar_listings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.hangar_listings_id_seq', 25, true);


--
-- Name: hangar_owner_verification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.hangar_owner_verification_id_seq', 1, false);


--
-- Name: hangar_owners_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.hangar_owners_id_seq', 1, false);


--
-- Name: hangar_photos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.hangar_photos_id_seq', 1, false);


--
-- Name: listing_inquiries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.listing_inquiries_id_seq', 1, false);


--
-- Name: listing_payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.listing_payments_id_seq', 1, false);


--
-- Name: listing_photos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.listing_photos_id_seq', 1, false);


--
-- Name: marketplace_listings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.marketplace_listings_id_seq', 1, false);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- Name: parts_listings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.parts_listings_id_seq', 1, false);


--
-- Name: pgmigrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pgmigrations_id_seq', 52, true);


--
-- Name: shop_products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.shop_products_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 19, true);


--
-- Name: account account_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (id);


--
-- Name: invitation invitation_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT invitation_pkey PRIMARY KEY (id);


--
-- Name: jwks jwks_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.jwks
    ADD CONSTRAINT jwks_pkey PRIMARY KEY (id);


--
-- Name: member member_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT member_pkey PRIMARY KEY (id);


--
-- Name: organization organization_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.organization
    ADD CONSTRAINT organization_pkey PRIMARY KEY (id);


--
-- Name: organization organization_slug_key; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.organization
    ADD CONSTRAINT organization_slug_key UNIQUE (slug);


--
-- Name: project_config project_config_endpoint_id_key; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.project_config
    ADD CONSTRAINT project_config_endpoint_id_key UNIQUE (endpoint_id);


--
-- Name: project_config project_config_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.project_config
    ADD CONSTRAINT project_config_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (id);


--
-- Name: session session_token_key; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT session_token_key UNIQUE (token);


--
-- Name: user user_email_key; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: verification verification_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.verification
    ADD CONSTRAINT verification_pkey PRIMARY KEY (id);


--
-- Name: admin_activity_log admin_activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_activity_log
    ADD CONSTRAINT admin_activity_log_pkey PRIMARY KEY (id);


--
-- Name: aircraft_listings aircraft_listings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aircraft_listings
    ADD CONSTRAINT aircraft_listings_pkey PRIMARY KEY (id);


--
-- Name: airport_icao airport_icao_icao_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.airport_icao
    ADD CONSTRAINT airport_icao_icao_code_key UNIQUE (icao_code);


--
-- Name: airport_icao airport_icao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.airport_icao
    ADD CONSTRAINT airport_icao_pkey PRIMARY KEY (id);


--
-- Name: avionics_listings avionics_listings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avionics_listings
    ADD CONSTRAINT avionics_listings_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_stripe_payment_intent_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_stripe_payment_intent_id_key UNIQUE (stripe_payment_intent_id);


--
-- Name: flight_logs flight_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flight_logs
    ADD CONSTRAINT flight_logs_pkey PRIMARY KEY (id);


--
-- Name: hangar_bookings hangar_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hangar_bookings
    ADD CONSTRAINT hangar_bookings_pkey PRIMARY KEY (id);


--
-- Name: hangar_listings hangar_listings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hangar_listings
    ADD CONSTRAINT hangar_listings_pkey PRIMARY KEY (id);


--
-- Name: hangar_owner_verification hangar_owner_verification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hangar_owner_verification
    ADD CONSTRAINT hangar_owner_verification_pkey PRIMARY KEY (id);


--
-- Name: hangar_owners hangar_owners_cnpj_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hangar_owners
    ADD CONSTRAINT hangar_owners_cnpj_key UNIQUE (cnpj);


--
-- Name: hangar_owners hangar_owners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hangar_owners
    ADD CONSTRAINT hangar_owners_pkey PRIMARY KEY (id);


--
-- Name: hangar_photos hangar_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hangar_photos
    ADD CONSTRAINT hangar_photos_pkey PRIMARY KEY (id);


--
-- Name: listing_inquiries listing_inquiries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_inquiries
    ADD CONSTRAINT listing_inquiries_pkey PRIMARY KEY (id);


--
-- Name: listing_payments listing_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_payments
    ADD CONSTRAINT listing_payments_pkey PRIMARY KEY (id);


--
-- Name: listing_photos listing_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_photos
    ADD CONSTRAINT listing_photos_pkey PRIMARY KEY (id);


--
-- Name: marketplace_listings marketplace_listings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_listings
    ADD CONSTRAINT marketplace_listings_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: parts_listings parts_listings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_listings
    ADD CONSTRAINT parts_listings_pkey PRIMARY KEY (id);


--
-- Name: pgmigrations pgmigrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pgmigrations
    ADD CONSTRAINT pgmigrations_pkey PRIMARY KEY (id);


--
-- Name: shop_products shop_products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_products
    ADD CONSTRAINT shop_products_pkey PRIMARY KEY (id);


--
-- Name: shop_products shop_products_sku_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_products
    ADD CONSTRAINT shop_products_sku_key UNIQUE (sku);


--
-- Name: users users_cpf_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_cpf_key UNIQUE (cpf);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: account_userId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "account_userId_idx" ON neon_auth.account USING btree ("userId");


--
-- Name: invitation_email_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX invitation_email_idx ON neon_auth.invitation USING btree (email);


--
-- Name: invitation_organizationId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "invitation_organizationId_idx" ON neon_auth.invitation USING btree ("organizationId");


--
-- Name: member_organizationId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "member_organizationId_idx" ON neon_auth.member USING btree ("organizationId");


--
-- Name: member_userId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "member_userId_idx" ON neon_auth.member USING btree ("userId");


--
-- Name: organization_slug_uidx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE UNIQUE INDEX organization_slug_uidx ON neon_auth.organization USING btree (slug);


--
-- Name: session_userId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "session_userId_idx" ON neon_auth.session USING btree ("userId");


--
-- Name: verification_identifier_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX verification_identifier_idx ON neon_auth.verification USING btree (identifier);


--
-- Name: aircraft_listings_category_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX aircraft_listings_category_index ON public.aircraft_listings USING btree (category);


--
-- Name: aircraft_listings_created_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX aircraft_listings_created_at_index ON public.aircraft_listings USING btree (created_at);


--
-- Name: aircraft_listings_featured_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX aircraft_listings_featured_index ON public.aircraft_listings USING btree (featured);


--
-- Name: aircraft_listings_location_state_location_city_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX aircraft_listings_location_state_location_city_index ON public.aircraft_listings USING btree (location_state, location_city);


--
-- Name: aircraft_listings_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX aircraft_listings_status_index ON public.aircraft_listings USING btree (status);


--
-- Name: aircraft_listings_user_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX aircraft_listings_user_id_index ON public.aircraft_listings USING btree (user_id);


--
-- Name: avionics_listings_category_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX avionics_listings_category_index ON public.avionics_listings USING btree (category);


--
-- Name: avionics_listings_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX avionics_listings_status_index ON public.avionics_listings USING btree (status);


--
-- Name: avionics_listings_user_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX avionics_listings_user_id_index ON public.avionics_listings USING btree (user_id);


--
-- Name: idx_admin_log_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_log_action ON public.admin_activity_log USING btree (action_type);


--
-- Name: idx_admin_log_admin_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_log_admin_id ON public.admin_activity_log USING btree (admin_id);


--
-- Name: idx_admin_log_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_log_created ON public.admin_activity_log USING btree (created_at DESC);


--
-- Name: idx_admin_log_target; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_log_target ON public.admin_activity_log USING btree (target_type, target_id);


--
-- Name: idx_airport_city; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_airport_city ON public.airport_icao USING btree (city, state);


--
-- Name: idx_airport_icao_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_airport_icao_code ON public.airport_icao USING btree (icao_code);


--
-- Name: idx_bookings_check_in; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_check_in ON public.bookings USING btree (check_in);


--
-- Name: idx_bookings_hangar_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_hangar_id ON public.bookings USING btree (hangar_id);


--
-- Name: idx_bookings_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_status ON public.bookings USING btree (status);


--
-- Name: idx_bookings_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_user_id ON public.bookings USING btree (user_id);


--
-- Name: idx_flight_logs_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_flight_logs_date ON public.flight_logs USING btree (flight_date);


--
-- Name: idx_flight_logs_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_flight_logs_deleted_at ON public.flight_logs USING btree (deleted_at);


--
-- Name: idx_flight_logs_function; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_flight_logs_function ON public.flight_logs USING btree (function);


--
-- Name: idx_flight_logs_rating; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_flight_logs_rating ON public.flight_logs USING btree (rating);


--
-- Name: idx_flight_logs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_flight_logs_status ON public.flight_logs USING btree (status);


--
-- Name: idx_flight_logs_user_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_flight_logs_user_deleted ON public.flight_logs USING btree (user_id, deleted_at);


--
-- Name: idx_flight_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_flight_logs_user_id ON public.flight_logs USING btree (user_id);


--
-- Name: idx_hangar_bookings_hangar_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hangar_bookings_hangar_id ON public.hangar_bookings USING btree (hangar_id);


--
-- Name: idx_hangar_bookings_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hangar_bookings_status ON public.hangar_bookings USING btree (status);


--
-- Name: idx_hangar_bookings_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hangar_bookings_user_id ON public.hangar_bookings USING btree (user_id);


--
-- Name: idx_hangar_icao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hangar_icao ON public.hangar_listings USING btree (icao_code);


--
-- Name: idx_hangar_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hangar_location ON public.hangar_listings USING btree (city, state, country);


--
-- Name: idx_hangar_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hangar_owner ON public.hangar_listings USING btree (owner_id);


--
-- Name: idx_hangar_owners_cnpj; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hangar_owners_cnpj ON public.hangar_owners USING btree (cnpj);


--
-- Name: idx_hangar_owners_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hangar_owners_user_id ON public.hangar_owners USING btree (user_id);


--
-- Name: idx_hangar_owners_verification; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hangar_owners_verification ON public.hangar_owners USING btree (verification_status);


--
-- Name: idx_hangar_photos_listing_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hangar_photos_listing_id ON public.hangar_photos USING btree (listing_id);


--
-- Name: idx_hangar_photos_primary; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hangar_photos_primary ON public.hangar_photos USING btree (listing_id, is_primary);


--
-- Name: idx_hangar_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hangar_status ON public.hangar_listings USING btree (status, is_available);


--
-- Name: idx_listings_availability; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_availability ON public.hangar_listings USING btree (availability_status);


--
-- Name: idx_listings_icao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_icao ON public.hangar_listings USING btree (airport_icao);


--
-- Name: idx_listings_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_owner ON public.hangar_listings USING btree (owner_id);


--
-- Name: idx_listings_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_listings_status ON public.hangar_listings USING btree (approval_status);


--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at DESC);


--
-- Name: idx_notifications_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_read ON public.notifications USING btree (read);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_verification_doc_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_verification_doc_type ON public.hangar_owner_verification USING btree (document_type);


--
-- Name: idx_verification_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_verification_owner_id ON public.hangar_owner_verification USING btree (owner_id);


--
-- Name: idx_verification_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_verification_status ON public.hangar_owner_verification USING btree (verification_status);


--
-- Name: idx_verification_unique_doc; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_verification_unique_doc ON public.hangar_owner_verification USING btree (owner_id, document_type);


--
-- Name: listing_inquiries_listing_type_listing_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX listing_inquiries_listing_type_listing_id_index ON public.listing_inquiries USING btree (listing_type, listing_id);


--
-- Name: listing_inquiries_seller_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX listing_inquiries_seller_id_index ON public.listing_inquiries USING btree (seller_id);


--
-- Name: listing_inquiries_sender_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX listing_inquiries_sender_id_index ON public.listing_inquiries USING btree (sender_id);


--
-- Name: listing_payments_listing_type_listing_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX listing_payments_listing_type_listing_id_index ON public.listing_payments USING btree (listing_type, listing_id);


--
-- Name: listing_payments_user_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX listing_payments_user_id_index ON public.listing_payments USING btree (user_id);


--
-- Name: listing_photos_listing_type_listing_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX listing_photos_listing_type_listing_id_index ON public.listing_photos USING btree (listing_type, listing_id);


--
-- Name: parts_listings_category_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX parts_listings_category_index ON public.parts_listings USING btree (category);


--
-- Name: parts_listings_part_number_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX parts_listings_part_number_index ON public.parts_listings USING btree (part_number);


--
-- Name: parts_listings_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX parts_listings_status_index ON public.parts_listings USING btree (status);


--
-- Name: parts_listings_user_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX parts_listings_user_id_index ON public.parts_listings USING btree (user_id);


--
-- Name: shop_products_active_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX shop_products_active_index ON public.shop_products USING btree (active);


--
-- Name: shop_products_category_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX shop_products_category_index ON public.shop_products USING btree (category);


--
-- Name: shop_products_seller_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX shop_products_seller_id_index ON public.shop_products USING btree (seller_id);


--
-- Name: shop_products_sku_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX shop_products_sku_index ON public.shop_products USING btree (sku);


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: account account_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.account
    ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: invitation invitation_inviterId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: invitation invitation_organizationId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES neon_auth.organization(id) ON DELETE CASCADE;


--
-- Name: member member_organizationId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES neon_auth.organization(id) ON DELETE CASCADE;


--
-- Name: member member_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: session session_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: admin_activity_log admin_activity_log_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_activity_log
    ADD CONSTRAINT admin_activity_log_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id);


--
-- Name: aircraft_listings aircraft_listings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aircraft_listings
    ADD CONSTRAINT aircraft_listings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: avionics_listings avionics_listings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avionics_listings
    ADD CONSTRAINT avionics_listings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_hangar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_hangar_id_fkey FOREIGN KEY (hangar_id) REFERENCES public.hangar_listings(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: hangar_listings fk_listings_airport; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hangar_listings
    ADD CONSTRAINT fk_listings_airport FOREIGN KEY (airport_icao) REFERENCES public.airport_icao(icao_code);


--
-- Name: flight_logs flight_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flight_logs
    ADD CONSTRAINT flight_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: hangar_bookings hangar_bookings_hangar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hangar_bookings
    ADD CONSTRAINT hangar_bookings_hangar_id_fkey FOREIGN KEY (hangar_id) REFERENCES public.hangar_listings(id) ON DELETE CASCADE;


--
-- Name: hangar_bookings hangar_bookings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hangar_bookings
    ADD CONSTRAINT hangar_bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: hangar_listings hangar_listings_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hangar_listings
    ADD CONSTRAINT hangar_listings_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: hangar_listings hangar_listings_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hangar_listings
    ADD CONSTRAINT hangar_listings_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: hangar_owner_verification hangar_owner_verification_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hangar_owner_verification
    ADD CONSTRAINT hangar_owner_verification_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.hangar_owners(id) ON DELETE CASCADE;


--
-- Name: hangar_owner_verification hangar_owner_verification_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hangar_owner_verification
    ADD CONSTRAINT hangar_owner_verification_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: hangar_owners hangar_owners_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hangar_owners
    ADD CONSTRAINT hangar_owners_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: hangar_photos hangar_photos_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hangar_photos
    ADD CONSTRAINT hangar_photos_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.hangar_listings(id) ON DELETE CASCADE;


--
-- Name: listing_inquiries listing_inquiries_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_inquiries
    ADD CONSTRAINT listing_inquiries_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: listing_inquiries listing_inquiries_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_inquiries
    ADD CONSTRAINT listing_inquiries_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: listing_payments listing_payments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_payments
    ADD CONSTRAINT listing_payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: marketplace_listings marketplace_listings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_listings
    ADD CONSTRAINT marketplace_listings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: parts_listings parts_listings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_listings
    ADD CONSTRAINT parts_listings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: shop_products shop_products_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_products
    ADD CONSTRAINT shop_products_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict JVovzqMiBBzQYKUGjEvsOhgC4eelJa0rykpWcPTAPEFzAwTu5qkAdWaA1nB7IcL

