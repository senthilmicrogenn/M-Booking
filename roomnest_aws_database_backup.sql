--
-- PostgreSQL database dump
--

\restrict XpdYZ5bagICMMbTfKYzCYFKLQQrAVMvt4CatrWdrt2C5UgSlogH5HWX0gobsi3C

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: account_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.account_type AS ENUM (
    'asset',
    'liability',
    'equity',
    'income',
    'expense'
);


--
-- Name: enhanced_booking_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enhanced_booking_status AS ENUM (
    'pending',
    'confirmed',
    'cancelled',
    'completed',
    'no_show'
);


--
-- Name: normal_balance; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.normal_balance AS ENUM (
    'debit',
    'credit'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log (
    id integer NOT NULL,
    table_name text NOT NULL,
    record_id text NOT NULL,
    action text NOT NULL,
    user_id integer,
    user_email text,
    user_name text,
    user_role text,
    old_values json,
    new_values json,
    changed_fields text[],
    ip_address text,
    user_agent text,
    session_id text,
    property_id integer,
    description text,
    metadata json,
    severity text DEFAULT 'info'::text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.audit_log ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.audit_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: booking_guest_details; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_guest_details (
    id integer NOT NULL,
    booking_id integer NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    guest_master_id integer,
    guest_detail_id integer,
    title character varying(16) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: booking_guest_details_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.booking_guest_details ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.booking_guest_details_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id integer NOT NULL,
    user_id integer NOT NULL,
    property_id integer NOT NULL,
    room_type_id integer,
    booking_type text NOT NULL,
    check_in_date timestamp without time zone NOT NULL,
    check_out_date timestamp without time zone NOT NULL,
    check_in_time text,
    check_out_time text,
    guests integer NOT NULL,
    number_of_rooms integer DEFAULT 1,
    total_amount numeric(10,2) NOT NULL,
    discount_amount numeric(10,2) DEFAULT '0'::numeric,
    tax_amount numeric(10,2) DEFAULT '0'::numeric,
    final_amount numeric(10,2) NOT NULL,
    status text DEFAULT 'confirmed'::text NOT NULL,
    payment_status text DEFAULT 'paid'::text NOT NULL,
    payment_method text,
    booking_reference text,
    room_number text,
    guest_details json,
    special_requests text,
    promo_code text,
    is_refreshment_stay boolean DEFAULT false,
    refreshment_slot text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    coupon_code text,
    coupon_type text,
    coupon_discount_amount numeric(10,2) DEFAULT '0'::numeric,
    booking_id text
);


--
-- Name: bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.bookings ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.bookings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: currency_master; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.currency_master (
    id integer NOT NULL,
    currency_name character varying(100) NOT NULL,
    short_name character varying(10) NOT NULL,
    conversion_price numeric(15,6) NOT NULL,
    as_on_date date NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    symbol character varying(10) NOT NULL,
    country character varying(100),
    is_base_currency boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: currency_master_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.currency_master ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.currency_master_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: customer_review_ratings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_review_ratings (
    id integer NOT NULL,
    rating_range text NOT NULL,
    rating_label text NOT NULL,
    min_rating numeric(3,2) NOT NULL,
    max_rating numeric(3,2) NOT NULL,
    description text,
    color text,
    icon text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: customer_review_ratings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.customer_review_ratings ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.customer_review_ratings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: enhanced_bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enhanced_bookings (
    id integer NOT NULL,
    booking_reference character varying(20) NOT NULL,
    guest_name character varying(100) NOT NULL,
    guest_email character varying(255) NOT NULL,
    guest_phone character varying(20) NOT NULL,
    guest_address text,
    property_id integer NOT NULL,
    room_type_id integer NOT NULL,
    plan_master_id integer,
    check_in date NOT NULL,
    check_out date NOT NULL,
    nights integer NOT NULL,
    adults integer DEFAULT 1 NOT NULL,
    children integer DEFAULT 0 NOT NULL,
    infants integer DEFAULT 0 NOT NULL,
    rooms integer DEFAULT 1 NOT NULL,
    base_amount numeric(10,2) NOT NULL,
    tax_amount numeric(10,2) DEFAULT 0.00,
    extra_charges numeric(10,2) DEFAULT 0.00,
    discount_amount numeric(10,2) DEFAULT 0.00,
    total_amount numeric(10,2) NOT NULL,
    currency_id integer NOT NULL,
    special_requests text,
    dietary_restrictions text,
    accessibility_needs text,
    status public.enhanced_booking_status DEFAULT 'pending'::public.enhanced_booking_status,
    booked_at timestamp without time zone DEFAULT now() NOT NULL,
    confirmed_at timestamp without time zone,
    cancelled_at timestamp without time zone,
    cancellation_reason text,
    payment_status character varying(20) DEFAULT 'pending'::character varying,
    payment_method character varying(50),
    transaction_id character varying(100),
    source_channel character varying(50) DEFAULT 'web'::character varying,
    user_agent text,
    ip_address character varying(45),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: enhanced_bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.enhanced_bookings ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.enhanced_bookings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: franchise_inquiries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.franchise_inquiries (
    id integer NOT NULL,
    full_name text NOT NULL,
    contact_number text NOT NULL,
    email text NOT NULL,
    location_preference text NOT NULL,
    budget_range text NOT NULL,
    has_existing_business boolean DEFAULT false,
    status text DEFAULT 'pending'::text,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: franchise_inquiries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.franchise_inquiries ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.franchise_inquiries_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: general_ledger_master; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.general_ledger_master (
    id integer NOT NULL,
    account_name character varying(100) NOT NULL,
    short_name character varying(20) NOT NULL,
    account_code character varying(10),
    account_type public.account_type NOT NULL,
    normal_balance public.normal_balance NOT NULL,
    parent_account_id integer,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    is_system_account boolean DEFAULT false,
    current_balance numeric(15,2) DEFAULT 0.00,
    last_transaction_date date,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by character varying(50),
    updated_by character varying(50)
);


--
-- Name: general_ledger_master_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.general_ledger_master ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.general_ledger_master_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: guest_details; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guest_details (
    id integer NOT NULL,
    guest_master_id integer NOT NULL,
    title character varying(16) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    relationship character varying(40),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: guest_details_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.guest_details ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.guest_details_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: guest_master; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guest_master (
    id integer NOT NULL,
    guest_code character varying(20) NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text,
    phone_number text NOT NULL,
    alternate_phone_number text,
    date_of_birth timestamp without time zone,
    gender text,
    nationality text,
    id_proof_type text,
    id_proof_number text,
    permanent_address text,
    current_address text,
    city text,
    state text,
    country text,
    pincode text,
    preferred_room_type text,
    preferred_language text,
    dietary_requirements text,
    special_requests text,
    smoking_preference boolean DEFAULT false,
    guest_category text DEFAULT 'regular'::text NOT NULL,
    loyalty_tier text DEFAULT 'bronze'::text,
    credit_limit numeric(10,2) DEFAULT 0.00,
    emergency_contact_name text,
    emergency_contact_number text,
    emergency_contact_relation text,
    company_name text,
    company_address text,
    gst_number text,
    designation text,
    total_bookings integer DEFAULT 0,
    total_amount_spent numeric(15,2) DEFAULT 0.00,
    last_booking_date timestamp without time zone,
    average_stay_duration numeric(5,2) DEFAULT 1.00,
    is_active boolean DEFAULT true NOT NULL,
    is_blacklisted boolean DEFAULT false,
    blacklist_reason text,
    is_verified boolean DEFAULT false,
    profile_photo text,
    notes text,
    tags text[],
    source text DEFAULT 'direct'::text,
    referred_by text,
    created_by integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: guest_master_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.guest_master ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.guest_master_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: hotel_star_ratings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hotel_star_ratings (
    id integer NOT NULL,
    star_rating integer NOT NULL,
    rating_name text NOT NULL,
    description text,
    icon text,
    amenities_included text[],
    service_level text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hotel_star_ratings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.hotel_star_ratings ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.hotel_star_ratings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: loyalty_program; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loyalty_program (
    id integer NOT NULL,
    user_id integer NOT NULL,
    completed_bookings integer DEFAULT 0,
    available_refreshment_stays integer DEFAULT 0,
    is_first_time_user boolean DEFAULT true,
    first_refreshment_claimed boolean DEFAULT false,
    last_refreshment_earned timestamp without time zone,
    refreshment_expiry_date timestamp without time zone,
    total_points_earned integer DEFAULT 0,
    current_points integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: loyalty_program_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.loyalty_program ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.loyalty_program_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: meal_inclusion_master; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meal_inclusion_master (
    id integer NOT NULL,
    meal_code character varying(10) NOT NULL,
    meal_name character varying(100) NOT NULL,
    meal_description text,
    meal_category character varying(50) NOT NULL,
    display_order integer DEFAULT 1,
    meal_icon character varying(50),
    meal_color character varying(7) DEFAULT '#6B7280'::character varying,
    is_active boolean DEFAULT true NOT NULL,
    is_popular boolean DEFAULT false,
    has_additional_cost boolean DEFAULT false,
    additional_cost_percentage numeric(5,2) DEFAULT 0.00,
    serving_times text,
    dietary text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: meal_inclusion_master_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.meal_inclusion_master ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.meal_inclusion_master_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL,
    is_read boolean DEFAULT false,
    action_url text,
    metadata json,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.notifications ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: plan_master; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plan_master (
    id integer NOT NULL,
    plan_code character varying(10) NOT NULL,
    plan_name character varying(100) NOT NULL,
    plan_description text,
    plan_type character varying(50) NOT NULL,
    has_standard_pricing boolean DEFAULT false,
    base_price numeric(10,2) DEFAULT 0.00,
    child_price numeric(10,2) DEFAULT 0.00,
    infant_price numeric(10,2) DEFAULT 0.00,
    child_age_from integer DEFAULT 2,
    child_age_upto integer DEFAULT 12,
    infant_age_from integer DEFAULT 0,
    infant_age_upto integer DEFAULT 2,
    is_active boolean DEFAULT true NOT NULL,
    is_popular boolean DEFAULT false,
    sort_order integer DEFAULT 1,
    minimum_stay integer DEFAULT 1,
    maximum_stay integer,
    advance_booking_days integer DEFAULT 0,
    plan_icon character varying(50),
    plan_color character varying(7) DEFAULT '#6B7280'::character varying,
    terms_and_conditions text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: plan_master_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.plan_master ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.plan_master_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: plan_meal_inclusions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plan_meal_inclusions (
    id integer NOT NULL,
    plan_id integer NOT NULL,
    meal_inclusion_id integer NOT NULL,
    is_included boolean DEFAULT true,
    additional_cost numeric(10,2) DEFAULT 0.00,
    quantity integer DEFAULT 1,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: plan_meal_inclusions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.plan_meal_inclusions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.plan_meal_inclusions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: plan_property_pricing; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plan_property_pricing (
    id integer NOT NULL,
    plan_id integer NOT NULL,
    property_id integer NOT NULL,
    base_price numeric(10,2) NOT NULL,
    child_price numeric(10,2) DEFAULT 0.00,
    infant_price numeric(10,2) DEFAULT 0.00,
    season_name character varying(50),
    valid_from date,
    valid_until date,
    weekday_discount numeric(5,2) DEFAULT 0.00,
    weekend_surcharge numeric(5,2) DEFAULT 0.00,
    is_active boolean DEFAULT true NOT NULL,
    minimum_occupancy integer DEFAULT 1,
    maximum_occupancy integer DEFAULT 4,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: plan_property_pricing_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.plan_property_pricing ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.plan_property_pricing_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: policy_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.policy_templates (
    id integer NOT NULL,
    policy_type text NOT NULL,
    policy_title text NOT NULL,
    policy_content text NOT NULL,
    template_format text DEFAULT 'html'::text,
    applicable_for text[],
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true NOT NULL,
    version text DEFAULT '1.0'::text,
    effective_date timestamp without time zone DEFAULT now() NOT NULL,
    expiry_date timestamp without time zone,
    created_by text,
    approved_by text,
    approval_status text DEFAULT 'draft'::text,
    metadata json,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: policy_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.policy_templates ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.policy_templates_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: promotions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promotions (
    id integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    code text,
    discount_type text NOT NULL,
    discount_value numeric(10,2) NOT NULL,
    min_amount numeric(10,2),
    max_discount numeric(10,2),
    valid_from timestamp without time zone NOT NULL,
    valid_until timestamp without time zone NOT NULL,
    usage_limit integer,
    used_count integer DEFAULT 0,
    is_active boolean DEFAULT true NOT NULL,
    applicable_for text[],
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: promotions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.promotions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.promotions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: properties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.properties (
    id integer NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    location text NOT NULL,
    address text NOT NULL,
    city text NOT NULL,
    area text,
    pincode text,
    description text,
    amenities text[],
    images text[],
    hourly_rate numeric(10,2),
    rating numeric(3,2) DEFAULT '0'::numeric,
    review_count integer DEFAULT 0,
    availability boolean DEFAULT true,
    capacity integer,
    distance_from_landmarks json,
    house_rules text[],
    cancellation_policy json,
    coordinates json,
    departure_location text,
    arrival_location text,
    departure_time timestamp without time zone,
    arrival_time timestamp without time zone,
    duration text,
    operator_name text,
    vehicle_number text,
    vehicle_type text,
    seat_types json,
    total_seats integer,
    available_seats integer,
    stops json,
    baggage_info json,
    operator_logo text,
    taxi_type text,
    driver_name text,
    driver_phone text,
    vehicle_model text,
    license_plate text,
    rate_per_km numeric(10,2),
    base_fare numeric(10,2),
    currency_id integer,
    hotel_star_rating_id integer,
    customer_review_rating_id integer,
    property_area_id integer,
    room_amenity_ids integer[],
    hotel_amenity_ids integer[],
    room_type_ids integer[],
    room_type_counts json,
    policy_template_ids integer[],
    approval_status text DEFAULT 'pending'::text NOT NULL,
    approved_by integer,
    approved_at timestamp without time zone,
    rejection_reason text,
    metadata json,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    category_id integer,
    owner_email text,
    owner_phone text,
    owner_name text
);


--
-- Name: properties_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.properties ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.properties_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: property_amenities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.property_amenities (
    id integer NOT NULL,
    amenity_type text NOT NULL,
    amenity_name text NOT NULL,
    description text,
    icon text,
    category text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    pictures text[],
    videos text[]
);


--
-- Name: property_amenities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.property_amenities ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.property_amenities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: property_areas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.property_areas (
    id integer NOT NULL,
    city_name text NOT NULL,
    area_name text NOT NULL,
    pincode text,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: property_areas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.property_areas ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.property_areas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: property_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.property_categories (
    id integer NOT NULL,
    property_type text NOT NULL,
    category_name text NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: property_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.property_categories ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.property_categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: rate_master; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rate_master (
    id integer NOT NULL,
    property_id integer,
    property_ids integer[],
    room_type_id integer NOT NULL,
    rate_name character varying(100) NOT NULL,
    from_date date NOT NULL,
    to_date date NOT NULL,
    single_occupancy_rate numeric(10,2) NOT NULL,
    double_occupancy_rate numeric(10,2) NOT NULL,
    triple_occupancy_rate numeric(10,2) NOT NULL,
    quadruple_occupancy_rate numeric(10,2) NOT NULL,
    extra_person_charge numeric(10,2) DEFAULT 0.00,
    pet_charge numeric(10,2) DEFAULT 0.00,
    child_charge numeric(10,2) DEFAULT 0.00,
    infant_charge numeric(10,2) DEFAULT 0.00,
    weekend_surcharge numeric(10,2) DEFAULT 0.00,
    festival_surcharge numeric(10,2) DEFAULT 0.00,
    currency_id integer NOT NULL,
    excluded_days json,
    weekend_days json DEFAULT '["friday","saturday","sunday"]'::json,
    is_active boolean DEFAULT true NOT NULL,
    priority integer DEFAULT 1,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: rate_master_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.rate_master ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.rate_master_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id integer NOT NULL,
    user_id integer NOT NULL,
    property_id integer NOT NULL,
    booking_id integer NOT NULL,
    rating integer NOT NULL,
    review_text text,
    is_recommended boolean DEFAULT true,
    images text[],
    response text,
    is_verified boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.reviews ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.reviews_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: role_master; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_master (
    id integer NOT NULL,
    role_name character varying(50) NOT NULL,
    role_code character varying(20) NOT NULL,
    description text,
    level integer DEFAULT 1 NOT NULL,
    permissions json DEFAULT '[]'::json NOT NULL,
    can_access_admin_panel boolean DEFAULT false,
    can_manage_users boolean DEFAULT false,
    can_manage_properties boolean DEFAULT false,
    can_manage_rates boolean DEFAULT false,
    can_manage_bookings boolean DEFAULT false,
    can_manage_finance boolean DEFAULT false,
    can_manage_reports boolean DEFAULT false,
    can_manage_master_data boolean DEFAULT false,
    can_manage_roles boolean DEFAULT false,
    can_view_audit_logs boolean DEFAULT false,
    default_property_permissions json DEFAULT '["read"]'::json,
    is_active boolean DEFAULT true NOT NULL,
    is_system_role boolean DEFAULT false,
    max_properties integer,
    color character varying(7) DEFAULT '#3B82F6'::character varying,
    icon character varying(50) DEFAULT 'user'::character varying,
    notes text,
    created_by integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: role_master_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.role_master ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.role_master_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: room_inventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.room_inventory (
    id integer NOT NULL,
    property_id integer NOT NULL,
    room_type_id integer NOT NULL,
    date date NOT NULL,
    total_rooms integer NOT NULL,
    available_rooms integer NOT NULL,
    booked_rooms integer DEFAULT 0 NOT NULL,
    blocked_rooms integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_updated timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: room_inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.room_inventory ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.room_inventory_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: room_photos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.room_photos (
    id integer NOT NULL,
    room_type_id integer NOT NULL,
    photo_group text NOT NULL,
    photo_name text NOT NULL,
    photo_url text NOT NULL,
    photo_path text NOT NULL,
    original_resolution text,
    compressed_resolution text,
    resolution_percentage integer DEFAULT 100,
    original_file_size integer,
    compressed_file_size integer,
    compression_ratio numeric(5,3),
    compression_quality integer DEFAULT 85,
    mime_type text,
    thumbnail_url text,
    is_compressed boolean DEFAULT true,
    is_main_photo boolean DEFAULT false,
    display_order integer DEFAULT 1,
    alt_text text,
    uploaded_by text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    media_type text DEFAULT 'photo'::text NOT NULL,
    duration integer
);


--
-- Name: room_photos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.room_photos ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.room_photos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: room_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.room_types (
    id integer NOT NULL,
    room_type_name text NOT NULL,
    room_size_square_meters integer NOT NULL,
    room_view_id integer,
    room_count integer DEFAULT 1 NOT NULL,
    max_occupancy integer NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    property_id integer
);


--
-- Name: room_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.room_types ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.room_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: room_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.room_views (
    id integer NOT NULL,
    view_name text NOT NULL,
    view_type text NOT NULL,
    description text,
    icon text DEFAULT '🏞️'::text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: room_views_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.room_views ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.room_views_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: subledger_master; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subledger_master (
    id integer NOT NULL,
    subledger_name character varying(100) NOT NULL,
    short_name character varying(20) NOT NULL,
    subledger_code character varying(15),
    general_ledger_account_id integer,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    is_default_ledger boolean DEFAULT false,
    tax_percentage numeric(5,2) DEFAULT 0.00,
    current_balance numeric(15,2) DEFAULT 0.00,
    last_transaction_date date,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by character varying(50),
    updated_by character varying(50)
);


--
-- Name: subledger_master_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.subledger_master ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.subledger_master_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: tariff_setup_master; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tariff_setup_master (
    id integer NOT NULL,
    from_amount numeric(15,2) NOT NULL,
    to_amount numeric(15,2) NOT NULL,
    cgst_percentage numeric(5,2) NOT NULL,
    sgst_percentage numeric(5,2) NOT NULL,
    valid_from_date date NOT NULL,
    valid_to_date date NOT NULL,
    subledger_id integer NOT NULL,
    grace_hour integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by character varying(50),
    updated_by character varying(50),
    cgst_subledger_id integer,
    sgst_subledger_id integer
);


--
-- Name: tariff_setup_master_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.tariff_setup_master ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.tariff_setup_master_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: trans_booking_det; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trans_booking_det (
    id integer NOT NULL,
    mas_billing_id integer NOT NULL,
    property_id integer NOT NULL,
    room_type_id integer NOT NULL,
    number_of_rooms integer DEFAULT 1 NOT NULL,
    number_of_nights integer DEFAULT 1 NOT NULL,
    rate_per_night numeric(10,2) NOT NULL,
    discount numeric(10,2) DEFAULT 0.00,
    taxable_amount numeric(10,2) NOT NULL,
    gst numeric(10,2) NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: trans_booking_det_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.trans_booking_det ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.trans_booking_det_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: trans_booking_detaildatewise; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trans_booking_detaildatewise (
    id integer NOT NULL,
    mas_billing_id integer NOT NULL,
    booking_date timestamp without time zone NOT NULL,
    property_id integer NOT NULL,
    room_type_id integer NOT NULL,
    room_count integer DEFAULT 1 NOT NULL,
    balance_room_count integer NOT NULL,
    check_in_time character varying(5) DEFAULT '00:00'::character varying NOT NULL,
    check_out_time character varying(5) DEFAULT '23:59'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: trans_booking_detaildatewise_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.trans_booking_detaildatewise ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.trans_booking_detaildatewise_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: trans_booking_mas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trans_booking_mas (
    mas_billing_id integer NOT NULL,
    booking_id text NOT NULL,
    property_id integer NOT NULL,
    guest_id integer,
    total_amount numeric(10,2) NOT NULL,
    gst_amount numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: trans_booking_mas_mas_billing_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.trans_booking_mas ALTER COLUMN mas_billing_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.trans_booking_mas_mas_billing_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: universal_photos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.universal_photos (
    id integer NOT NULL,
    entity_type text NOT NULL,
    entity_id integer,
    photo_category text NOT NULL,
    photo_name text NOT NULL,
    photo_url text NOT NULL,
    photo_path text NOT NULL,
    original_resolution text,
    compressed_resolution text,
    resolution_percentage integer NOT NULL,
    original_file_size integer,
    compressed_file_size integer,
    compression_ratio numeric(5,3),
    compression_quality integer DEFAULT 85,
    mime_type text,
    thumbnail_url text,
    is_compressed boolean DEFAULT true,
    is_main_photo boolean DEFAULT false,
    display_order integer DEFAULT 1,
    alt_text text,
    tags text,
    uploaded_by text,
    is_active boolean DEFAULT true,
    metadata text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    compressed_url_data text,
    compressed_tags text,
    compressed_metadata text,
    media_type text DEFAULT 'photo'::text NOT NULL,
    duration integer
);


--
-- Name: universal_photos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.universal_photos ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.universal_photos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: user_property_access; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_property_access (
    id integer NOT NULL,
    user_id integer NOT NULL,
    property_id integer NOT NULL,
    role text DEFAULT 'manager'::text NOT NULL,
    permissions json DEFAULT '["read", "write"]'::json,
    is_active boolean DEFAULT true NOT NULL,
    assigned_by integer,
    assigned_at timestamp without time zone DEFAULT now() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: user_property_access_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.user_property_access ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.user_property_access_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text,
    phone_number text NOT NULL,
    password text,
    name text NOT NULL,
    gender text,
    date_of_birth timestamp without time zone,
    company_name text,
    gst_number text,
    permanent_address text,
    billing_address text,
    preferred_room_type text,
    preferred_language text,
    special_requests text,
    notification_preferences json,
    social_accounts json,
    referral_code text,
    emergency_contact_name text,
    emergency_contact_number text,
    profile_photo text,
    role text DEFAULT 'guest'::text NOT NULL,
    role_id integer,
    is_verified boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.users ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: wallet_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wallet_transactions (
    id integer NOT NULL,
    wallet_id integer NOT NULL,
    type text NOT NULL,
    amount numeric(10,2) NOT NULL,
    description text NOT NULL,
    reference_id text,
    status text DEFAULT 'completed'::text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: wallet_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.wallet_transactions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.wallet_transactions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: wallets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wallets (
    id integer NOT NULL,
    user_id integer NOT NULL,
    balance numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: wallets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.wallets ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.wallets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: wishlists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wishlists (
    id integer NOT NULL,
    user_id integer NOT NULL,
    property_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: wishlists_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.wishlists ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.wishlists_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_log (id, table_name, record_id, action, user_id, user_email, user_name, user_role, old_values, new_values, changed_fields, ip_address, user_agent, session_id, property_id, description, metadata, severity, created_at) FROM stdin;
\.


--
-- Data for Name: booking_guest_details; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.booking_guest_details (id, booking_id, is_primary, guest_master_id, guest_detail_id, title, first_name, last_name, created_at) FROM stdin;
1	44	t	\N	\N	Mr	senthil	nayagam k	2025-09-30 09:12:46.126463
2	45	t	\N	\N	Mr	senthil	nayagam k	2025-09-30 09:22:17.019682
3	46	t	\N	\N	Mr	senthil	nayagam k	2025-09-30 15:47:38.547744
4	47	t	\N	\N	Mr	senthil	nayagam k	2025-09-30 15:59:47.86811
5	48	t	\N	\N	Mr	senthil	nayagam k	2025-09-30 16:04:01.634486
6	49	t	\N	\N	Mr	senthil	nayagam k	2025-09-30 16:07:02.467633
7	50	t	\N	\N	Mr	senthil	nayagam k	2025-10-02 10:47:01.299868
8	51	t	\N	\N	Mr	senthil	nayagam k	2025-10-05 07:17:04.113915
9	52	t	\N	\N	Mr	Nirmala	NAYAGAM	2025-10-28 13:21:05.334523
10	53	t	\N	\N	Mr	Dhanush	P	2025-10-30 06:05:41.78746
\.


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bookings (id, user_id, property_id, room_type_id, booking_type, check_in_date, check_out_date, check_in_time, check_out_time, guests, number_of_rooms, total_amount, discount_amount, tax_amount, final_amount, status, payment_status, payment_method, booking_reference, room_number, guest_details, special_requests, promo_code, is_refreshment_stay, refreshment_slot, created_at, updated_at, coupon_code, coupon_type, coupon_discount_amount, booking_id) FROM stdin;
2	12	6	22	hotel	2025-09-29 00:00:00	2025-09-30 00:00:00	\N	\N	2	4	NaN	0.00	500.00	NaN	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-28 02:08:21.972862	2025-09-28 02:08:21.972862	\N	\N	0.00	\N
3	12	6	22	hotel	2025-09-29 00:00:00	2025-09-30 00:00:00	\N	\N	2	2	5000.00	500.00	225.00	4725.00	confirmed	paid	\N	\N	\N	{"name":"John Smith","email":"guest@example.com","phone":"9876543210"}	\N	\N	f	\N	2025-09-28 02:10:37.645413	2025-09-28 02:10:37.645413	\N	\N	0.00	\N
4	12	6	22	hotel	2025-09-29 00:00:00	2025-09-30 00:00:00	\N	\N	2	2	5000.00	500.00	225.00	4725.00	confirmed	paid	\N	\N	\N	{"name":"John Smith","email":"guest@example.com","phone":"9876543210"}	\N	\N	f	\N	2025-09-28 02:11:12.909044	2025-09-28 02:11:12.909044	\N	\N	0.00	\N
5	12	6	22	hotel	2025-09-29 00:00:00	2025-09-30 00:00:00	\N	\N	2	4	NaN	0.00	500.00	NaN	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-28 02:11:45.809445	2025-09-28 02:11:45.809445	\N	\N	0.00	\N
6	12	6	22	hotel	2025-09-29 00:00:00	2025-09-30 00:00:00	\N	\N	2	4	NaN	0.00	500.00	NaN	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-28 02:22:37.887029	2025-09-28 02:22:37.887029	\N	\N	0.00	\N
7	12	6	22	hotel	2025-09-29 00:00:00	2025-09-30 00:00:00	\N	\N	2	4	NaN	NaN	450.00	NaN	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-28 07:05:47.583606	2025-09-28 07:05:47.583606	\N	\N	0.00	\N
8	12	6	23	hotel	2025-09-29 00:00:00	2025-09-30 00:00:00	\N	\N	2	3	NaN	0.00	375.00	NaN	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-28 07:17:31.216778	2025-09-28 07:17:31.216778	\N	\N	0.00	\N
9	12	6	23	hotel	2025-09-29 00:00:00	2025-09-30 00:00:00	\N	\N	2	2	NaN	0.00	250.00	NaN	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-28 07:27:26.912565	2025-09-28 07:27:26.912565	\N	\N	0.00	\N
10	12	6	23	hotel	2025-09-30 00:00:00	2025-10-01 00:00:00	\N	\N	2	1	2500.00	0.00	125.00	2625.00	confirmed	paid	\N	\N	\N	{"name":"Test User","email":"test@example.com","phone":"1234567890"}	Test booking for confirmation page	\N	f	\N	2025-09-28 07:29:39.314213	2025-09-28 07:29:39.314213	\N	\N	0.00	\N
11	12	6	23	hotel	2025-09-29 00:00:00	2025-09-30 00:00:00	\N	\N	2	1	NaN	0.00	125.00	NaN	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-28 07:32:14.482783	2025-09-28 07:32:14.482783	\N	\N	0.00	\N
12	12	6	23	hotel	2025-09-29 00:00:00	2025-09-30 00:00:00	\N	\N	2	1	NaN	0.00	125.00	NaN	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-28 08:03:11.034943	2025-09-28 08:03:11.034943	\N	\N	0.00	\N
13	12	6	23	hotel	2025-09-29 00:00:00	2025-09-30 00:00:00	\N	\N	2	1	NaN	0.00	125.00	NaN	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-28 08:40:58.50836	2025-09-28 08:40:58.50836	\N	\N	0.00	\N
14	12	6	23	hotel	2025-09-29 00:00:00	2025-09-30 00:00:00	\N	\N	2	1	NaN	0.00	125.00	NaN	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-28 08:44:02.679792	2025-09-28 08:44:02.679792	\N	\N	0.00	\N
15	12	6	23	hotel	2025-09-29 00:00:00	2025-09-30 00:00:00	\N	\N	2	1	NaN	0.00	125.00	NaN	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-28 08:48:40.973923	2025-09-28 08:48:40.973923	\N	\N	0.00	\N
16	12	6	23	hotel	2025-09-29 00:00:00	2025-09-30 00:00:00	\N	\N	2	1	NaN	0.00	125.00	NaN	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-28 09:38:59.260299	2025-09-28 09:38:59.260299	\N	\N	0.00	\N
17	12	6	23	hotel	2025-09-29 00:00:00	2025-09-30 00:00:00	\N	\N	2	1	NaN	0.00	125.00	NaN	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-28 09:42:31.051066	2025-09-28 09:42:31.051066	\N	\N	0.00	\N
18	12	6	23	hotel	2025-09-29 00:00:00	2025-09-30 00:00:00	\N	\N	2	1	NaN	0.00	125.00	NaN	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-28 10:21:36.554283	2025-09-28 10:21:36.554283	\N	\N	0.00	\N
19	12	6	22	hotel	2025-09-30 00:00:00	2025-10-01 00:00:00	\N	\N	2	3	NaN	0.00	375.00	NaN	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"accounts@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-29 05:49:02.831047	2025-09-29 05:49:02.831047	\N	\N	0.00	\N
20	12	6	22	hotel	2025-09-30 00:00:00	2025-10-01 00:00:00	\N	\N	2	4	NaN	0.00	500.00	NaN	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"accounts@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-29 06:03:30.422102	2025-09-29 06:03:30.422102	\N	\N	0.00	\N
21	12	6	22	hotel	2025-09-30 00:00:00	2025-10-01 00:00:00	\N	\N	2	3	NaN	0.00	375.00	NaN	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-29 06:08:58.650025	2025-09-29 06:08:58.650025	\N	\N	0.00	\N
22	12	6	22	hotel	2025-09-30 00:00:00	2025-10-01 00:00:00	\N	\N	2	4	NaN	NaN	450.00	NaN	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-29 06:24:21.654274	2025-09-29 06:24:21.654274	\N	\N	0.00	\N
23	12	6	22	hotel	2025-09-30 00:00:00	2025-10-01 00:00:00	\N	\N	2	2	NaN	NaN	225.00	NaN	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-29 06:39:56.842939	2025-09-29 06:39:56.842939	\N	\N	0.00	\N
24	12	6	22	hotel	2025-09-30 00:00:00	2025-10-01 00:00:00	\N	\N	2	3	NaN	NaN	337.50	NaN	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-29 07:06:04.987491	2025-09-29 07:06:04.987491	\N	\N	0.00	\N
25	12	6	22	hotel	2025-10-01 00:00:00	2025-10-04 00:00:00	\N	\N	2	4	NaN	NaN	1350.00	NaN	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-29 07:13:20.967366	2025-09-29 07:13:20.967366	\N	\N	0.00	\N
26	12	6	22	hotel	2025-10-01 00:00:00	2025-10-04 00:00:00	\N	\N	2	2	NaN	0.00	750.00	NaN	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-29 07:16:21.494476	2025-09-29 07:16:21.494476	\N	\N	0.00	\N
27	12	6	22	hotel	2025-09-30 00:00:00	2025-10-01 00:00:00	\N	\N	2	3	NaN	0.00	375.00	NaN	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-29 07:28:15.575799	2025-09-29 07:28:15.575799	\N	\N	0.00	\N
28	12	6	23	hotel	2025-09-30 00:00:00	2025-10-01 00:00:00	\N	\N	2	1	NaN	NaN	112.50	NaN	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-29 07:37:19.461039	2025-09-29 07:37:19.461039	SAVE10	percentage	NaN	\N
29	12	6	23	hotel	2025-09-30 00:00:00	2025-10-01 00:00:00	\N	\N	2	2	4500.00	500.00	225.00	4500.00	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-29 09:42:41.371226	2025-09-29 09:42:41.371226	SAVE10	percentage	500.00	\N
30	12	6	23	hotel	2025-09-30 00:00:00	2025-10-01 00:00:00	\N	\N	2	2	4500.00	500.00	225.00	4500.00	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-29 09:46:46.630885	2025-09-29 09:46:46.630885	SAVE10	percentage	500.00	\N
31	12	6	23	hotel	2025-09-30 00:00:00	2025-10-01 00:00:00	\N	\N	2	2	NaN	500.00	225.00	4500.00	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-29 09:49:03.659556	2025-09-29 09:49:03.659556	SAVE10	percentage	500.00	\N
32	12	6	23	hotel	2025-09-30 00:00:00	2025-10-01 00:00:00	\N	\N	2	1	NaN	250.00	112.50	2250.00	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-29 09:53:28.970115	2025-09-29 09:53:28.970115	SAVE10	percentage	250.00	\N
33	12	6	23	hotel	2025-09-30 00:00:00	2025-10-01 00:00:00	\N	\N	2	2	NaN	500.00	225.00	4500.00	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-29 09:56:10.286816	2025-09-29 09:56:10.286816	SAVE10	percentage	500.00	\N
34	12	6	23	hotel	2025-09-30 00:00:00	2025-10-01 00:00:00	\N	\N	2	1	NaN	250.00	112.50	2250.00	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-29 10:03:38.981897	2025-09-29 10:03:38.981897	SAVE10	percentage	250.00	\N
35	12	6	23	hotel	2025-09-30 00:00:00	2025-10-01 00:00:00	\N	\N	2	1	NaN	250.00	112.50	2250.00	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-29 10:05:06.779871	2025-09-29 10:05:06.779871	SAVE10	percentage	250.00	\N
36	12	6	23	hotel	2025-09-30 00:00:00	2025-10-01 00:00:00	\N	\N	2	1	NaN	250.00	112.50	2250.00	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-29 10:07:32.341409	2025-09-29 10:07:32.341409	SAVE10	percentage	250.00	\N
37	12	6	23	hotel	2025-09-30 00:00:00	2025-10-01 00:00:00	\N	\N	2	2	NaN	500.00	225.00	4500.00	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-29 10:14:59.174711	2025-09-29 10:14:59.174711	SAVE10	percentage	500.00	\N
38	12	6	23	hotel	2025-09-30 00:00:00	2025-10-01 00:00:00	\N	\N	2	1	NaN	250.00	112.50	2250.00	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-29 10:22:36.251758	2025-09-29 10:22:36.251758	SAVE10	percentage	250.00	\N
39	12	6	23	hotel	2025-09-30 00:00:00	2025-10-01 00:00:00	\N	\N	2	1	NaN	250.00	125.00	2250.00	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-29 10:26:17.722863	2025-09-29 10:26:17.722863	SAVE10	percentage	250.00	\N
40	12	6	23	hotel	2025-09-30 00:00:00	2025-10-01 00:00:00	\N	\N	2	1	NaN	250.00	112.50	2250.00	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-29 13:38:52.08105	2025-09-29 13:38:52.08105	SAVE10	percentage	250.00	\N
41	12	6	23	hotel	2025-09-30 00:00:00	2025-10-01 00:00:00	\N	\N	2	1	NaN	250.00	112.50	2250.00	confirmed	paid	\N	\N	\N	{"name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"09952511119"}	\N	\N	f	\N	2025-09-29 13:55:08.621235	2025-09-29 13:55:08.621235	SAVE10	percentage	250.00	\N
42	12	6	23	hotel	2025-10-01 00:00:00	2025-10-02 00:00:00	\N	\N	2	2	NaN	0.00	250.00	5000.00	confirmed	paid	\N	\N	\N	{"name":"vijaya Bhaskar","email":"ssvijaybasker@gmail.com","phone":"09363150105"}	\N	\N	f	\N	2025-09-30 08:11:03.115169	2025-09-30 08:11:03.115169	\N	\N	0.00	\N
43	12	6	22	hotel	2025-10-01 00:00:00	2025-10-02 00:00:00	\N	\N	2	2	NaN	0.00	250.00	5000.00	confirmed	paid	\N	\N	\N	{"title":"Mr","name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"+91 09952511119","state":"Kerala"}	\N	\N	f	\N	2025-09-30 08:56:54.979501	2025-09-30 08:56:54.979501	\N	\N	0.00	\N
44	12	6	23	hotel	2025-10-01 00:00:00	2025-10-02 00:00:00	\N	\N	2	1	NaN	0.00	125.00	2500.00	confirmed	paid	\N	\N	\N	{"title":"Mr","name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"+91 09952511119","state":"Tamil Nadu","additionalGuests":[]}	\N	\N	f	\N	2025-09-30 09:12:46.024574	2025-09-30 09:12:46.024574	\N	\N	0.00	\N
45	12	6	23	hotel	2025-10-01 00:00:00	2025-10-02 00:00:00	\N	\N	2	1	NaN	0.00	125.00	2500.00	confirmed	paid	\N	\N	\N	{"title":"Mr","name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"+91 09952511119","state":"Tamil Nadu","additionalGuests":[]}	\N	\N	f	\N	2025-09-30 09:22:16.858877	2025-09-30 09:22:16.858877	\N	\N	0.00	\N
46	12	6	23	hotel	2025-10-01 00:00:00	2025-10-02 00:00:00	\N	\N	2	1	NaN	0.00	125.00	2500.00	confirmed	paid	\N	\N	\N	{"title":"Mr","name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"+91 09952511119","state":"Tamil Nadu","additionalGuests":[]}	\N	\N	f	\N	2025-09-30 15:47:38.452857	2025-09-30 15:47:38.452857	\N	\N	0.00	\N
47	12	6	23	hotel	2025-10-01 00:00:00	2025-10-02 00:00:00	\N	\N	2	1	NaN	0.00	125.00	2500.00	confirmed	paid	\N	\N	\N	{"title":"Mr","name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"+91 09952511119","state":"Tamil Nadu","additionalGuests":[]}	\N	\N	f	\N	2025-09-30 15:59:47.773321	2025-09-30 15:59:47.773321	\N	\N	0.00	\N
48	12	6	23	hotel	2025-10-01 00:00:00	2025-10-02 00:00:00	\N	\N	2	1	NaN	0.00	125.00	2500.00	confirmed	paid	\N	\N	\N	{"title":"Mr","name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"+91 09952511119","state":"Tamil Nadu","additionalGuests":[]}	\N	\N	f	\N	2025-09-30 16:04:01.537961	2025-09-30 16:04:01.537961	\N	\N	0.00	\N
49	12	6	23	hotel	2025-10-01 00:00:00	2025-10-02 00:00:00	\N	\N	2	1	NaN	0.00	125.00	2500.00	confirmed	paid	\N	\N	\N	{"title":"Mr","name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"+91 09952511119","state":"Tamil Nadu","additionalGuests":[]}	\N	\N	f	\N	2025-09-30 16:07:02.373707	2025-09-30 16:07:02.373707	\N	\N	0.00	\N
50	12	6	23	hotel	2025-10-03 00:00:00	2025-10-04 00:00:00	\N	\N	2	2	NaN	500.00	225.00	4500.00	confirmed	paid	\N	\N	\N	{"title":"Mr","name":"senthil nayagam k","email":"senthil@microgenn.com","phone":"+91 09952511119","state":"Tamil Nadu","additionalGuests":[]}	\N	\N	f	\N	2025-10-02 10:47:01.205174	2025-10-02 10:47:01.205174	SAVE10	percentage	500.00	SH9ZTV44P3OW895Z
51	12	6	22	hotel	2025-10-06 00:00:00	2025-10-07 00:00:00	\N	\N	2	2	NaN	500.00	225.00	4500.00	confirmed	paid	\N	\N	\N	{"title":"Mr","name":"senthil nayagam k","email":"mhnraj15@gmail.com","phone":"+91 09952511119","state":"Tamil Nadu","additionalGuests":[]}	\N	\N	f	\N	2025-10-05 07:17:04.001038	2025-10-05 07:17:04.001038	SAVE10	percentage	500.00	Z8EONNT8V0WX10AH
52	12	6	22	hotel	2025-10-29 00:00:00	2025-10-30 00:00:00	\N	\N	2	1	NaN	0.00	125.00	2500.00	confirmed	paid	\N	\N	\N	{"title":"Mr","name":"Nirmala NAYAGAM","email":"prakashgrandplaza@gmail.com","phone":"+91 9952511119","state":"Tamil Nadu","additionalGuests":[]}	\N	\N	f	\N	2025-10-28 13:21:05.156496	2025-10-28 13:21:05.156496	\N	\N	0.00	GSR8B73XIREE3ZJ9
53	12	6	22	hotel	2025-10-31 00:00:00	2025-11-01 00:00:00	\N	\N	2	2	NaN	0.00	250.00	5000.00	confirmed	paid	\N	\N	\N	{"title":"Mr","name":"Dhanush P","email":"danushkartik01@gmail.com","phone":"+91 9944710111","state":"Tamil Nadu","additionalGuests":[]}	\N	\N	f	\N	2025-10-30 06:05:41.700672	2025-10-30 06:05:41.700672	\N	\N	0.00	SM0GPZ32RZP04WS8
\.


--
-- Data for Name: currency_master; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.currency_master (id, currency_name, short_name, conversion_price, as_on_date, is_active, symbol, country, is_base_currency, created_at, updated_at) FROM stdin;
16	Indian Rupee	INR	1.000000	2025-01-03	t	₹	India	t	2025-09-06 07:20:01.965851	2025-09-06 07:20:01.965851
17	US Dollar	USD	84.200000	2025-01-03	t	$	United States	f	2025-09-06 07:20:01.965851	2025-09-06 07:20:01.965851
18	Euro	EUR	87.500000	2025-01-03	t	€	Europe	f	2025-09-06 07:20:01.965851	2025-09-06 07:20:01.965851
\.


--
-- Data for Name: customer_review_ratings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customer_review_ratings (id, rating_range, rating_label, min_rating, max_rating, description, color, icon, is_active, created_at, updated_at) FROM stdin;
26	4.5-5.0	Excellent	4.50	5.00	Outstanding reviews	#16A34A	\N	t	2025-09-06 07:20:02.105898	2025-09-06 07:20:02.105898
27	4.0-4.4	Very Good	4.00	4.40	Great customer feedback	#22C55E	\N	t	2025-09-06 07:20:02.105898	2025-09-06 07:20:02.105898
28	3.5-3.9	Good	3.50	3.90	Positive reviews	#84CC16	\N	t	2025-09-06 07:20:02.105898	2025-09-06 07:20:02.105898
29	3.0-3.4	Average	3.00	3.40	Moderate reviews	#F59E0B	\N	t	2025-09-06 07:20:02.105898	2025-09-06 07:20:02.105898
30	0.0-2.9	Below Average	0.00	2.90	Needs improvement	#EF4444	\N	t	2025-09-06 07:20:02.105898	2025-09-06 07:20:02.105898
\.


--
-- Data for Name: enhanced_bookings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.enhanced_bookings (id, booking_reference, guest_name, guest_email, guest_phone, guest_address, property_id, room_type_id, plan_master_id, check_in, check_out, nights, adults, children, infants, rooms, base_amount, tax_amount, extra_charges, discount_amount, total_amount, currency_id, special_requests, dietary_restrictions, accessibility_needs, status, booked_at, confirmed_at, cancelled_at, cancellation_reason, payment_status, payment_method, transaction_id, source_channel, user_agent, ip_address, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: franchise_inquiries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.franchise_inquiries (id, full_name, contact_number, email, location_preference, budget_range, has_existing_business, status, notes, created_at) FROM stdin;
\.


--
-- Data for Name: general_ledger_master; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.general_ledger_master (id, account_name, short_name, account_code, account_type, normal_balance, parent_account_id, description, is_active, is_system_account, current_balance, last_transaction_date, created_at, updated_at, created_by, updated_by) FROM stdin;
1	GST Input Tax Credit	GST_ITC	GL001	asset	debit	\N	Goods and Services Tax Input Tax Credit account for tax recoveries	t	t	0.00	\N	2025-09-24 05:24:22.331471	2025-09-24 05:24:22.331471	\N	\N
2	GST Output Tax	GST_OUT	GL002	liability	credit	\N	Goods and Services Tax Output Tax account for tax collections	t	t	0.00	\N	2025-09-24 05:24:22.331471	2025-09-24 05:24:22.331471	\N	\N
3	Room Revenue	ROOM_REV	GL003	income	credit	\N	Revenue from room bookings and accommodations	t	f	0.00	\N	2025-09-24 05:24:22.331471	2025-09-24 05:24:22.331471	\N	\N
\.


--
-- Data for Name: guest_details; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.guest_details (id, guest_master_id, title, first_name, last_name, relationship, created_at) FROM stdin;
\.


--
-- Data for Name: guest_master; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.guest_master (id, guest_code, first_name, last_name, email, phone_number, alternate_phone_number, date_of_birth, gender, nationality, id_proof_type, id_proof_number, permanent_address, current_address, city, state, country, pincode, preferred_room_type, preferred_language, dietary_requirements, special_requests, smoking_preference, guest_category, loyalty_tier, credit_limit, emergency_contact_name, emergency_contact_number, emergency_contact_relation, company_name, company_address, gst_number, designation, total_bookings, total_amount_spent, last_booking_date, average_stay_duration, is_active, is_blacklisted, blacklist_reason, is_verified, profile_photo, notes, tags, source, referred_by, created_by, created_at, updated_at) FROM stdin;
1	GUEST_0012	John	Smith	guest@example.com	+91-9876543212	\N	\N	male	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	English	\N	\N	f	regular	bronze	0.00	\N	\N	\N	\N	\N	\N	\N	3	10000.00	2025-09-30 09:22:17.207	0.00	t	f	\N	t	\N	\N	\N	booking_portal	\N	\N	2025-09-30 08:56:55.340864	2025-09-30 09:22:17.207
\.


--
-- Data for Name: hotel_star_ratings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hotel_star_ratings (id, star_rating, rating_name, description, icon, amenities_included, service_level, is_active, created_at, updated_at) FROM stdin;
26	1	Budget	Basic accommodation	\N	\N	Basic	t	2025-09-06 07:20:02.038623	2025-09-06 07:20:02.038623
27	2	Economy	Comfortable stay	\N	\N	Standard	t	2025-09-06 07:20:02.038623	2025-09-06 07:20:02.038623
28	3	Standard	Good quality hotel	\N	\N	Good	t	2025-09-06 07:20:02.038623	2025-09-06 07:20:02.038623
29	4	Premium	High-end accommodation	\N	\N	Excellent	t	2025-09-06 07:20:02.038623	2025-09-06 07:20:02.038623
30	5	Luxury	Ultra-luxury experience	\N	\N	Exceptional	t	2025-09-06 07:20:02.038623	2025-09-06 07:20:02.038623
\.


--
-- Data for Name: loyalty_program; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.loyalty_program (id, user_id, completed_bookings, available_refreshment_stays, is_first_time_user, first_refreshment_claimed, last_refreshment_earned, refreshment_expiry_date, total_points_earned, current_points, created_at, updated_at) FROM stdin;
2	10	5	1	t	f	\N	\N	100	50	2025-09-29 14:26:45.694074	2025-09-29 14:26:45.694074
\.


--
-- Data for Name: meal_inclusion_master; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.meal_inclusion_master (id, meal_code, meal_name, meal_description, meal_category, display_order, meal_icon, meal_color, is_active, is_popular, has_additional_cost, additional_cost_percentage, serving_times, dietary, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, title, message, type, is_read, action_url, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: plan_master; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.plan_master (id, plan_code, plan_name, plan_description, plan_type, has_standard_pricing, base_price, child_price, infant_price, child_age_from, child_age_upto, infant_age_from, infant_age_upto, is_active, is_popular, sort_order, minimum_stay, maximum_stay, advance_booking_days, plan_icon, plan_color, terms_and_conditions, created_at, updated_at) FROM stdin;
3	MAP	Modified American Plan	Half board including breakfast and dinner	meal_plan	t	1800.00	900.00	300.00	5	12	0	5	t	t	3	1	21	3	coffee	#F59E0B	Breakfast and dinner included. Lunch available at additional cost.	2025-09-06 12:37:10.37402	2025-09-06 12:37:10.37402
4	AI	All-Inclusive Plan	Complete package with all meals, beverages, and select activities	package_plan	t	4500.00	2250.00	750.00	5	12	0	5	t	t	1	2	14	14	star	#7C3AED	Includes all meals, local beverages, selected activities, and spa access. Premium alcohol and excursions at additional cost.	2025-09-06 12:37:14.577616	2025-09-06 12:37:14.577616
5	E01		\N	meal_plan	t	100.00	0.00	0.00	2	12	0	2	t	f	1	1	\N	0	bed	#6B7280		2025-09-06 12:46:18.499206	2025-09-06 12:46:18.499206
6	BB	Bed & Breakfast	Accommodation with breakfast included	meal_plan	t	1200.00	600.00	200.00	5	12	0	5	t	f	4	1	14	1	coffee	#16A34A	Continental breakfast included. Served from 7:00 AM to 10:00 AM.	2025-09-06 12:47:25.230522	2025-09-06 12:47:25.230522
7	CP	Continental Plan	Room accommodation with continental breakfast	meal_plan	t	1500.00	750.00	250.00	5	12	0	5	t	t	5	1	10	2	coffee	#059669	Continental breakfast served from 7:00 AM to 10:00 AM. Includes coffee, tea, pastries, and fresh fruits.	2025-09-06 12:51:55.616198	2025-09-06 12:51:55.616198
1	EP	European Plan	Room accommodation only	meal_plan	f	0.00	0.00	0.00	2	12	0	2	t	f	1	1	\N	0	bed	#6B7280		2025-09-06 12:34:03.250267	2025-09-06 12:34:03.250267
2	AP	American Plan	Full board including breakfast, lunch, and dinner	meal_plan	t	2500.00	1250.00	500.00	5	12	0	5	t	t	2	1	30	7	utensils	#DC2626	All meals included. Special dietary requirements must be informed 24 hours in advance.	2025-09-06 12:37:06.825768	2025-09-06 12:37:06.825768
\.


--
-- Data for Name: plan_meal_inclusions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.plan_meal_inclusions (id, plan_id, meal_inclusion_id, is_included, additional_cost, quantity, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: plan_property_pricing; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.plan_property_pricing (id, plan_id, property_id, base_price, child_price, infant_price, season_name, valid_from, valid_until, weekday_discount, weekend_surcharge, is_active, minimum_occupancy, maximum_occupancy, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: policy_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.policy_templates (id, policy_type, policy_title, policy_content, template_format, applicable_for, is_default, is_active, version, effective_date, expiry_date, created_by, approved_by, approval_status, metadata, created_at, updated_at) FROM stdin;
15	cancellation	Standard Cancellation Policy	Free cancellation up to 24 hours before check-in. After that, 1 night charge applies.	html	\N	f	t	1.0	2025-09-06 07:20:02.519206	\N	\N	\N	draft	\N	2025-09-06 07:20:02.519206	2025-09-06 07:20:02.519206
16	cancellation	Strict Cancellation Policy	Non-refundable booking. No cancellation allowed.	html	\N	f	t	1.0	2025-09-06 07:20:02.519206	\N	\N	\N	draft	\N	2025-09-06 07:20:02.519206	2025-09-06 07:20:02.519206
17	checkin	Standard Check-in Policy	Check-in: 2:00 PM onwards. Check-out: 11:00 AM. Early check-in subject to availability.	html	\N	f	t	1.0	2025-09-06 07:20:02.519206	\N	\N	\N	draft	\N	2025-09-06 07:20:02.519206	2025-09-06 07:20:02.519206
18	amenity	Swimming Pool Policy	Pool hours: 6:00 AM to 10:00 PM. Children under 12 must be supervised.	html	\N	f	t	1.0	2025-09-06 07:20:02.519206	\N	\N	\N	draft	\N	2025-09-06 07:20:02.519206	2025-09-06 07:20:02.519206
\.


--
-- Data for Name: promotions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.promotions (id, title, description, code, discount_type, discount_value, min_amount, max_discount, valid_from, valid_until, usage_limit, used_count, is_active, applicable_for, created_at) FROM stdin;
\.


--
-- Data for Name: properties; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.properties (id, name, type, location, address, city, area, pincode, description, amenities, images, hourly_rate, rating, review_count, availability, capacity, distance_from_landmarks, house_rules, cancellation_policy, coordinates, departure_location, arrival_location, departure_time, arrival_time, duration, operator_name, vehicle_number, vehicle_type, seat_types, total_seats, available_seats, stops, baggage_info, operator_logo, taxi_type, driver_name, driver_phone, vehicle_model, license_plate, rate_per_km, base_fare, currency_id, hotel_star_rating_id, customer_review_rating_id, property_area_id, room_amenity_ids, hotel_amenity_ids, room_type_ids, room_type_counts, policy_template_ids, approval_status, approved_by, approved_at, rejection_reason, metadata, created_at, updated_at, category_id, owner_email, owner_phone, owner_name) FROM stdin;
6	Hotel Grand Plaza	hotel	Railway Station	Railway station cbe	Coimbatore		641009		\N	\N	\N	0.00	0	t	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16	28	27	61	{71,72,73}	{77,78,79}	{21,22,23}	{"21":1,"22":1,"23":1}	{15,16,17}	approved	10	2025-09-24 07:33:44.211	\N	\N	2025-09-06 09:05:11.896143	2025-09-06 09:05:11.896143	52	\N	\N	\N
2	Py Olliv Grand	hotel	Rspuram	123 Business Park	Coimbatore	\N	641009	Premium business hotel	\N	\N	\N	0.00	0	t	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16	27	27	60	{71,72,73,74}	{}	{21,22,23}	{"21":1,"22":1,"23":1}	{16,17,18}	approved	10	2025-09-24 07:34:24.976	\N	\N	2025-09-06 07:30:40.293254	2025-09-06 07:30:40.293254	51	\N	\N	\N
3	FIELD TEST: Boutique Urban Hotel	hotel	Downtown Urban Center	123 Test Address	Test City	Test Area	641009	Testing all master data relationships and arrays	{"Free WiFi",Restaurant,AC,TV,Parking,Laundry,"Room Service"}	\N	\N	4.65	0	t	120	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16	26	26	51	{71,72,73}	{71,72,73,74}	{21,22,23}	\N	{15,16,17}	approved	10	2025-09-24 07:34:06.577	\N	\N	2025-09-06 07:36:01.165177	2025-09-06 08:27:01.48	51	\N	\N	\N
7	Hotel K R Grand	hotel	Railway station	Railway station cbe	Coimbatore		641009	Description	\N	\N	\N	0.00	0	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16	28	27	60	{71,72,73}	{77,78}	{21,22,23}	{"21":1,"22":1,"23":1}	{15,17}	approved	10	2025-09-24 07:34:09.257	\N	\N	2025-09-06 09:07:14.475	2025-09-06 09:07:14.475	52	\N	\N	\N
1	Hotel RR Grand 	hotel	Gandhipuram	123 Test Street	Coimbatore	\N	641009	Final test update	\N	\N	\N	0.00	0	t	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16	28	27	63	{71,73,74,72}	{77}	{21,23,22}	{"21":1,"22":1,"23":1}	{15,18}	approved	10	2025-09-24 07:34:13.523	\N	\N	2025-09-06 07:30:21.857192	2025-09-06 08:27:17.215	52	\N	\N	\N
8	Hotel Vinayak	hotel	Railway Station	Hotel Vinayak, Railwaystation Road, Coimbatore	Coimbatore	Central Mumbai	641009	Budget-friendly hotel with modern amenities in Mumbai Central	{AC,WiFi,TV,"Room Service"}	\N	\N	0.00	0	t	2	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16	27	27	61	{71,72,73}	{}	{22,23,21,24}	{"21":1,"22":20,"23":8,"24":10}	{15,16}	approved	10	2025-09-24 07:34:23.718	\N	\N	2025-09-06 09:28:02.323146	2025-09-06 09:28:02.323146	51	\N	\N	\N
4	SIMPLE TEST: Premium Business Hotel	hotel	Business District Premium	Ramnagar Main Road	Coimbatore	Ramnagar	\N	Testing core fields with professional amenities	{"Free WiFi","Swimming Pool",Gym,Restaurant,Parking}	\N	\N	4.85	0	t	200	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	26	\N	\N	{71,72,73,74}	{71,72,73}	{21,22}	{}	{15,16}	approved	10	2025-09-24 07:34:19.403	\N	\N	2025-09-06 07:36:02.865998	2025-09-06 08:27:13.721	51	\N	\N	\N
9	Hotel Hari Krishna Park	hotel	Gandhipuram	Hotel Hari Krishna Park   Park Road, New Sidhapudur Cbe	Coimbatore	Business District	641009	Premium business hotel with luxury amenities in the heart of Mumbai business district	{AC,WiFi,Pool,Gym,Spa,Restaurant,"Room Service","Business Center"}	\N	\N	0.00	0	t	4	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16	26	26	62	{71,72,73}	{77,78,84}	{21,22,23}	{"21":25,"22":35,"23":15}	{15,16}	approved	\N	2025-09-24 07:26:59.913531	\N	\N	2025-09-06 09:41:44.749323	2025-09-06 09:41:44.749323	52	\N	\N	\N
5	RR Grand 	hotel	Gandhipuram	Test Address	Coimbatore	\N	641009	All timestamp errors permanently resolved	{"Free WiFi",AC,TV}	\N	\N	5.00	0	t	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	16	27	27	63	{71,72,73,74}	{77,78,79}	{21,22,23,24}	{"21":10,"22":10,"23":10,"24":10}	{15,16,17}	approved	10	2025-09-24 07:34:11.575	\N	\N	2025-09-06 07:39:28.223307	2025-09-06 08:27:15.851	52	\N	\N	\N
\.


--
-- Data for Name: property_amenities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.property_amenities (id, amenity_type, amenity_name, description, icon, category, is_active, created_at, updated_at, pictures, videos) FROM stdin;
71	room_amenity	Air Conditioning	Climate control	🌡️	Comfort	t	2025-09-06 07:20:02.318736	2025-09-06 07:20:02.318736	{}	{}
72	room_amenity	Free WiFi	High-speed internet	📶	Technology	t	2025-09-06 07:20:02.318736	2025-09-06 07:20:02.318736	{}	{}
73	room_amenity	LED TV	Modern entertainment	📺	Entertainment	t	2025-09-06 07:20:02.318736	2025-09-06 07:20:02.318736	{}	{}
74	room_amenity	Mini Fridge	In-room refrigerator	🧊	Comfort	t	2025-09-06 07:20:02.318736	2025-09-06 07:20:02.318736	{}	{}
75	room_amenity	Room Service	24/7 room service	🍽️	Service	t	2025-09-06 07:20:02.318736	2025-09-06 07:20:02.318736	{}	{}
76	room_amenity	Safe	Electronic safe	🔒	Security	t	2025-09-06 07:20:02.318736	2025-09-06 07:20:02.318736	{}	{}
77	hotel_amenity	Swimming Pool	Outdoor pool	🏊	Recreation	t	2025-09-06 07:20:02.318736	2025-09-06 07:20:02.318736	{}	{}
78	hotel_amenity	Gym	Fitness center	💪	Fitness	t	2025-09-06 07:20:02.318736	2025-09-06 07:20:02.318736	{}	{}
79	hotel_amenity	Spa	Wellness and spa services	💆	Wellness	t	2025-09-06 07:20:02.318736	2025-09-06 07:20:02.318736	{}	{}
80	hotel_amenity	Restaurant	On-site dining	🍽️	Dining	t	2025-09-06 07:20:02.318736	2025-09-06 07:20:02.318736	{}	{}
81	hotel_amenity	Parking	Free parking	🚗	Convenience	t	2025-09-06 07:20:02.318736	2025-09-06 07:20:02.318736	{}	{}
82	hotel_amenity	Business Center	Meeting rooms	💼	Business	t	2025-09-06 07:20:02.318736	2025-09-06 07:20:02.318736	{}	{}
83	hotel_amenity	Concierge	Guest services	🛎️	Service	t	2025-09-06 07:20:02.318736	2025-09-06 07:20:02.318736	{}	{}
84	hotel_amenity	Airport Shuttle	Free airport transfer	🚌	Transport	t	2025-09-06 07:20:02.318736	2025-09-06 07:20:02.318736	{}	{}
\.


--
-- Data for Name: property_areas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.property_areas (id, city_name, area_name, pincode, description, is_active, created_at, updated_at) FROM stdin;
51	Mumbai	Andheri East	400069	Business district near airport	t	2025-09-06 07:20:02.180631	2025-09-06 07:20:02.180631
52	Mumbai	Bandra West	400050	Upscale residential and commercial area	t	2025-09-06 07:20:02.180631	2025-09-06 07:20:02.180631
53	Mumbai	Juhu	400049	Beachside area with luxury hotels	t	2025-09-06 07:20:02.180631	2025-09-06 07:20:02.180631
54	Delhi	Connaught Place	110001	Central business district	t	2025-09-06 07:20:02.180631	2025-09-06 07:20:02.180631
55	Delhi	Karol Bagh	110005	Shopping and business hub	t	2025-09-06 07:20:02.180631	2025-09-06 07:20:02.180631
56	Bangalore	Koramangala	560034	IT hub with modern amenities	t	2025-09-06 07:20:02.180631	2025-09-06 07:20:02.180631
57	Bangalore	Whitefield	560066	Major IT corridor	t	2025-09-06 07:20:02.180631	2025-09-06 07:20:02.180631
58	Chennai	T. Nagar	600017	Commercial and shopping center	t	2025-09-06 07:20:02.180631	2025-09-06 07:20:02.180631
59	Pune	Hinjewadi	411057	IT park area	t	2025-09-06 07:20:02.180631	2025-09-06 07:20:02.180631
60	Coimbatore	RS Puram	641002	Central business area	t	2025-09-06 07:20:02.180631	2025-09-06 07:20:02.180631
61	Coimbatore	Railway Station		Created from search: Railway Station, Coimbatore	t	2025-09-06 07:25:59.773352	2025-09-06 07:25:59.773352
62	Coimbatore	Sidhapudur		Created from search: Sidhapudur, Coimbatore	t	2025-09-24 07:35:13.941666	2025-09-24 07:35:13.941666
63	Coimbatore	Gandhipuram		Created from search: Gandhipuram, Coimbatore	t	2025-09-25 06:45:32.119565	2025-09-25 06:45:32.119565
\.


--
-- Data for Name: property_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.property_categories (id, property_type, category_name, description, is_active, created_at, updated_at) FROM stdin;
51	hotel	Budget Hotel	Affordable accommodation	t	2025-09-06 07:20:02.251755	2025-09-06 07:20:02.251755
52	hotel	Business Hotel	Corporate-friendly hotels	t	2025-09-06 07:20:02.251755	2025-09-06 07:20:02.251755
53	hotel	Luxury Resort	Premium resort experience	t	2025-09-06 07:20:02.251755	2025-09-06 07:20:02.251755
54	hotel	Boutique Hotel	Unique themed properties	t	2025-09-06 07:20:02.251755	2025-09-06 07:20:02.251755
55	conference_room	Corporate Meeting Room	Professional meeting spaces	t	2025-09-06 07:20:02.251755	2025-09-06 07:20:02.251755
56	conference_room	Event Hall	Large event venues	t	2025-09-06 07:20:02.251755	2025-09-06 07:20:02.251755
57	flight	Domestic Flight	Within country flights	t	2025-09-06 07:20:02.251755	2025-09-06 07:20:02.251755
58	flight	International Flight	Cross-border flights	t	2025-09-06 07:20:02.251755	2025-09-06 07:20:02.251755
59	train	Express Train	Fast intercity trains	t	2025-09-06 07:20:02.251755	2025-09-06 07:20:02.251755
60	bus	Luxury Bus	Premium bus services	t	2025-09-06 07:20:02.251755	2025-09-06 07:20:02.251755
\.


--
-- Data for Name: rate_master; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rate_master (id, property_id, property_ids, room_type_id, rate_name, from_date, to_date, single_occupancy_rate, double_occupancy_rate, triple_occupancy_rate, quadruple_occupancy_rate, extra_person_charge, pet_charge, child_charge, infant_charge, weekend_surcharge, festival_surcharge, currency_id, excluded_days, weekend_days, is_active, priority, notes, created_at, updated_at) FROM stdin;
101	6	\N	21	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	999.00	999.00	999.00	999.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:33.438936	2025-09-06 14:18:33.438936
127	6	\N	23	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:42.063846	2025-09-06 14:18:42.063846
140	6	\N	24	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:46.395038	2025-09-06 14:18:46.395038
114	6	\N	22	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	250.00	250.00	250.00	250.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:37.852441	2025-09-06 14:18:37.852441
123	6	\N	22	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:40.803145	2025-09-08 12:43:40.737523
122	6	\N	22	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:40.478801	2025-09-08 12:43:40.605023
112	6	\N	21	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:37.246079	2025-09-08 12:43:39.009245
115	6	\N	22	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:38.160267	2025-09-08 12:43:39.540405
111	6	\N	21	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:36.934447	2025-09-08 12:43:38.87823
125	6	\N	22	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:41.427884	2025-09-08 12:43:41.002558
137	6	\N	23	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:45.422108	2025-09-08 12:43:42.891105
110	6	\N	21	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:36.621185	2025-09-08 12:43:38.745089
113	6	\N	21	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:37.552225	2025-09-08 12:43:39.140654
116	6	\N	22	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:38.472811	2025-09-08 12:43:39.673548
117	6	\N	22	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:38.780983	2025-09-08 12:43:39.806224
119	6	\N	22	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:39.451527	2025-09-08 12:43:40.071626
106	6	\N	21	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:35.316461	2025-09-08 12:43:38.073652
120	6	\N	22	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:39.840661	2025-09-08 12:43:40.204592
121	6	\N	22	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:40.16154	2025-09-08 12:43:40.471942
124	6	\N	22	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:41.118325	2025-09-08 12:43:40.870454
126	6	\N	22	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:41.747934	2025-09-08 12:43:41.134794
128	6	\N	23	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:42.389619	2025-09-08 12:43:41.532528
129	6	\N	23	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:42.71946	2025-09-08 12:43:41.664839
130	6	\N	23	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:43.037504	2025-09-08 12:43:41.800646
132	6	\N	23	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:43.764226	2025-09-08 12:43:42.077693
131	6	\N	23	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:43.423002	2025-09-08 12:43:41.933389
134	6	\N	23	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:44.431925	2025-09-08 12:43:42.475005
135	6	\N	23	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:44.760926	2025-09-08 12:43:42.611384
136	6	\N	23	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:45.09945	2025-09-08 12:43:42.748598
138	6	\N	23	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:45.749787	2025-09-08 12:43:43.023398
139	6	\N	23	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:46.07311	2025-09-08 12:43:43.156438
104	6	\N	21	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:34.673583	2025-09-08 12:43:37.808386
103	6	\N	21	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:34.361797	2025-09-08 12:43:37.675615
118	6	\N	22	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:39.114228	2025-09-08 12:43:39.939532
107	6	\N	21	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:35.641267	2025-09-08 12:43:38.209534
108	6	\N	21	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:35.978986	2025-09-08 12:43:38.478432
109	6	\N	21	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:36.297741	2025-09-08 12:43:38.611327
146	6	\N	24	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:48.410064	2025-09-08 12:43:44.221711
148	6	\N	24	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:49.074806	2025-09-08 12:43:44.619814
150	6	\N	24	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:49.731428	2025-09-08 12:43:44.884819
141	6	\N	24	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:46.732275	2025-09-08 12:43:43.554843
143	6	\N	24	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:47.402132	2025-09-08 12:43:43.820973
153	8	\N	21	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:30.536045	2025-09-06 14:24:30.536045
154	8	\N	21	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:30.54043	2025-09-06 14:24:30.54043
156	8	\N	21	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:30.555233	2025-09-06 14:24:30.555233
155	8	\N	21	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:30.54494	2025-09-06 14:24:30.54494
157	8	\N	21	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:30.868414	2025-09-06 14:24:30.868414
166	8	\N	22	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:31.313655	2025-09-06 14:24:31.313655
167	8	\N	22	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:31.425179	2025-09-06 14:24:31.425179
168	8	\N	22	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:31.42878	2025-09-06 14:24:31.42878
169	8	\N	22	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:31.431819	2025-09-06 14:24:31.431819
170	8	\N	22	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:31.464394	2025-09-06 14:24:31.464394
179	8	\N	23	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:31.981683	2025-09-06 14:24:31.981683
180	8	\N	23	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:31.989145	2025-09-06 14:24:31.989145
181	8	\N	23	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:31.994143	2025-09-06 14:24:31.994143
182	8	\N	23	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:32.034636	2025-09-06 14:24:32.034636
183	8	\N	23	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:32.174247	2025-09-06 14:24:32.174247
151	6	\N	24	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:50.053868	2025-09-08 12:43:45.016541
144	6	\N	24	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:47.72966	2025-09-08 12:43:43.957081
145	6	\N	24	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:48.066911	2025-09-08 12:43:44.090259
147	6	\N	24	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:48.752345	2025-09-08 12:43:44.486864
149	6	\N	24	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:49.407671	2025-09-08 12:43:44.752447
152	6	\N	24	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:50.376613	2025-09-08 12:43:45.148769
161	8	\N	21	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:31.145103	2025-09-13 05:22:20.514666
162	8	\N	21	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:31.149811	2025-09-13 05:22:20.645754
163	8	\N	21	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:31.153582	2025-09-13 05:22:20.77778
164	8	\N	21	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:31.176726	2025-09-13 05:22:20.909469
173	8	\N	22	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:31.706215	2025-09-13 05:22:21.706823
171	8	\N	22	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:31.601461	2025-09-12 11:00:12.27476
165	8	\N	21	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	2300.00	2300.00	2300.00	2300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:31.312236	2025-09-12 07:06:26.591423
174	8	\N	22	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:31.710636	2025-09-13 05:22:21.83891
172	8	\N	22	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	2300.00	2300.00	2300.00	2300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:31.602805	2025-09-12 07:06:27.654802
175	8	\N	22	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:31.714281	2025-09-13 05:22:21.970381
176	8	\N	22	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:31.74894	2025-09-13 05:22:22.101892
178	8	\N	22	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:31.887432	2025-09-13 05:22:22.232722
159	8	\N	21	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:30.873723	2025-09-13 05:22:57.700421
160	8	\N	21	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:30.880211	2025-09-13 05:22:20.372752
177	8	\N	22	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	2300.00	2300.00	2300.00	2300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:31.886909	2025-09-12 07:06:28.586514
158	8	\N	21	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:30.869819	2025-09-12 11:00:10.786005
192	8	\N	24	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:32.543088	2025-09-06 14:24:32.543088
194	8	\N	24	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:32.613392	2025-09-06 14:24:32.613392
195	8	\N	24	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:32.751717	2025-09-06 14:24:32.751717
185	8	\N	23	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	2300.00	2300.00	2300.00	2300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:32.258514	2025-09-12 07:06:29.686293
204	8	\N	24	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	2300.00	2300.00	2300.00	2300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:33.111408	2025-09-12 07:06:32.591338
184	8	\N	23	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:32.174751	2025-09-12 11:00:13.724272
188	8	\N	23	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:32.325605	2025-09-12 11:00:14.124386
189	8	\N	23	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:32.460011	2025-09-12 11:00:14.255949
199	8	\N	24	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:32.831237	2025-09-12 11:00:15.312417
200	8	\N	24	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:32.902644	2025-09-12 11:00:15.444156
201	8	\N	24	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:33.037314	2025-09-12 11:00:15.579227
193	8	\N	24	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:32.548374	2025-09-06 14:24:32.548374
196	8	\N	24	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:32.752291	2025-09-06 14:24:32.752291
198	8	\N	24	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	2300.00	2300.00	2300.00	2300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:32.827886	2025-09-12 07:06:31.668195
186	8	\N	23	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:32.267127	2025-09-12 11:00:13.857784
202	8	\N	24	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:33.038548	2025-09-12 11:00:15.716022
206	8	\N	21	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:27.360688	2025-09-06 14:30:27.360688
205	8	\N	21	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:27.359276	2025-09-06 14:30:27.359276
208	8	\N	21	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:27.362921	2025-09-06 14:30:27.362921
209	8	\N	21	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:27.360565	2025-09-06 14:30:27.360565
207	8	\N	21	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:27.370147	2025-09-06 14:30:27.370147
210	8	\N	21	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:27.716193	2025-09-06 14:30:27.716193
211	8	\N	21	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:27.718875	2025-09-06 14:30:27.718875
212	8	\N	21	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:27.719381	2025-09-06 14:30:27.719381
213	8	\N	21	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:27.723292	2025-09-06 14:30:27.723292
214	8	\N	21	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:27.726932	2025-09-06 14:30:27.726932
215	8	\N	22	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:28.002824	2025-09-06 14:30:28.002824
216	8	\N	22	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:28.005677	2025-09-06 14:30:28.005677
217	8	\N	22	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:28.009805	2025-09-06 14:30:28.009805
218	8	\N	22	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:28.011971	2025-09-06 14:30:28.011971
219	8	\N	22	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:28.015033	2025-09-06 14:30:28.015033
220	8	\N	22	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:28.116142	2025-09-06 14:30:28.116142
221	8	\N	22	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:28.27991	2025-09-06 14:30:28.27991
222	8	\N	22	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:28.291887	2025-09-06 14:30:28.291887
223	8	\N	22	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:28.295919	2025-09-06 14:30:28.295919
224	8	\N	22	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:28.303458	2025-09-06 14:30:28.303458
225	8	\N	23	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:28.304356	2025-09-06 14:30:28.304356
226	8	\N	23	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:28.400041	2025-09-06 14:30:28.400041
227	8	\N	23	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:28.564459	2025-09-06 14:30:28.564459
228	8	\N	23	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:28.571781	2025-09-06 14:30:28.571781
229	8	\N	23	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:28.582482	2025-09-06 14:30:28.582482
230	8	\N	23	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:28.588849	2025-09-06 14:30:28.588849
232	8	\N	23	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:28.682619	2025-09-06 14:30:28.682619
233	8	\N	23	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:28.842861	2025-09-06 14:30:28.842861
235	8	\N	24	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:28.875306	2025-09-06 14:30:28.875306
236	8	\N	24	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:28.881494	2025-09-06 14:30:28.881494
237	8	\N	24	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:28.889574	2025-09-06 14:30:28.889574
190	8	\N	23	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	2300.00	2300.00	2300.00	2300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:32.461416	2025-09-12 07:06:30.478582
191	8	\N	23	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	2300.00	2300.00	2300.00	2300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:32.533829	2025-09-12 07:06:30.609812
203	8	\N	24	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:33.0917	2025-09-12 11:00:15.848011
231	8	\N	23	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:28.591103	2025-09-12 11:00:13.992254
234	8	\N	23	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:28.853216	2025-09-12 11:00:14.388142
197	8	\N	24	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:32.813691	2025-09-12 11:00:15.180886
238	8	\N	24	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:28.972345	2025-09-06 14:30:28.972345
239	8	\N	24	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:29.140197	2025-09-06 14:30:29.140197
240	8	\N	24	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:29.148904	2025-09-06 14:30:29.148904
241	8	\N	24	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:29.162914	2025-09-06 14:30:29.162914
242	8	\N	24	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:29.167994	2025-09-06 14:30:29.167994
243	8	\N	24	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:29.173738	2025-09-06 14:30:29.173738
244	8	\N	24	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:30:29.253328	2025-09-06 14:30:29.253328
246	6	\N	21	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:32.128123	2025-09-06 14:35:32.128123
249	6	\N	21	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:32.118769	2025-09-06 14:35:32.118769
245	6	\N	21	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:32.132253	2025-09-06 14:35:32.132253
250	6	\N	21	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:32.179139	2025-09-06 14:35:32.179139
251	6	\N	21	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:32.479169	2025-09-06 14:35:32.479169
252	6	\N	21	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:32.488531	2025-09-06 14:35:32.488531
253	6	\N	21	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:32.490159	2025-09-06 14:35:32.490159
254	6	\N	21	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:32.492133	2025-09-06 14:35:32.492133
255	6	\N	22	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:32.494262	2025-09-06 14:35:32.494262
256	6	\N	22	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:32.493694	2025-09-06 14:35:32.493694
257	6	\N	22	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:32.791261	2025-09-06 14:35:32.791261
258	6	\N	22	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:32.824766	2025-09-06 14:35:32.824766
259	6	\N	22	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:32.825617	2025-09-06 14:35:32.825617
260	6	\N	22	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:32.831655	2025-09-06 14:35:32.831655
261	6	\N	22	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:32.832352	2025-09-06 14:35:32.832352
262	6	\N	22	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:32.843899	2025-09-06 14:35:32.843899
263	6	\N	22	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:33.109086	2025-09-06 14:35:33.109086
264	6	\N	22	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:33.113254	2025-09-06 14:35:33.113254
265	6	\N	23	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:33.11907	2025-09-06 14:35:33.11907
266	6	\N	23	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:33.1206	2025-09-06 14:35:33.1206
267	6	\N	23	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:33.124946	2025-09-06 14:35:33.124946
268	6	\N	23	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:33.127025	2025-09-06 14:35:33.127025
269	6	\N	23	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:33.387678	2025-09-06 14:35:33.387678
270	6	\N	23	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:33.39477	2025-09-06 14:35:33.39477
271	6	\N	23	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:33.421123	2025-09-06 14:35:33.421123
272	6	\N	23	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:33.422607	2025-09-06 14:35:33.422607
273	6	\N	23	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:33.424702	2025-09-06 14:35:33.424702
274	6	\N	23	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:33.425516	2025-09-06 14:35:33.425516
275	6	\N	24	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:34.051367	2025-09-06 14:35:34.051367
277	6	\N	24	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:34.062031	2025-09-06 14:35:34.062031
278	6	\N	24	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:34.063562	2025-09-06 14:35:34.063562
279	6	\N	24	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:34.064945	2025-09-06 14:35:34.064945
280	6	\N	24	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:34.065431	2025-09-06 14:35:34.065431
248	6	\N	21	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:32.125348	2025-09-08 12:43:37.93851
276	6	\N	24	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:34.058572	2025-09-08 12:43:43.688393
281	6	\N	24	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:34.330028	2025-09-06 14:35:34.330028
282	6	\N	24	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:34.344114	2025-09-06 14:35:34.344114
283	6	\N	24	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:34.355312	2025-09-06 14:35:34.355312
284	6	\N	24	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:34.361985	2025-09-06 14:35:34.361985
285	6	\N	21	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:09.039997	2025-09-06 16:17:09.039997
288	6	\N	21	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:09.038875	2025-09-06 16:17:09.038875
286	6	\N	21	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:09.043278	2025-09-06 16:17:09.043278
289	6	\N	21	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:09.318958	2025-09-06 16:17:09.318958
290	6	\N	21	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:09.389687	2025-09-06 16:17:09.389687
291	6	\N	21	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:09.392883	2025-09-06 16:17:09.392883
292	6	\N	21	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:09.394633	2025-09-06 16:17:09.394633
293	6	\N	21	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:09.395293	2025-09-06 16:17:09.395293
294	6	\N	21	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:09.640301	2025-09-06 16:17:09.640301
295	6	\N	21	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:09.669392	2025-09-06 16:17:09.669392
296	6	\N	21	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:09.678696	2025-09-06 16:17:09.678696
297	6	\N	22	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:09.692063	2025-09-06 16:17:09.692063
298	6	\N	21	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:09.692656	2025-09-06 16:17:09.692656
299	6	\N	22	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:09.905662	2025-09-06 16:17:09.905662
300	6	\N	22	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:09.930898	2025-09-06 16:17:09.930898
301	6	\N	22	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:09.969216	2025-09-06 16:17:09.969216
302	6	\N	22	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:09.974438	2025-09-06 16:17:09.974438
303	6	\N	22	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:09.978544	2025-09-06 16:17:09.978544
304	6	\N	22	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:09.98058	2025-09-06 16:17:09.98058
305	6	\N	22	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:10.18808	2025-09-06 16:17:10.18808
306	6	\N	22	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:10.216088	2025-09-06 16:17:10.216088
307	6	\N	22	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:10.25474	2025-09-06 16:17:10.25474
308	6	\N	22	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:10.255944	2025-09-06 16:17:10.255944
309	6	\N	22	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:10.270617	2025-09-06 16:17:10.270617
310	6	\N	22	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:10.271162	2025-09-06 16:17:10.271162
311	6	\N	23	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:10.473115	2025-09-06 16:17:10.473115
312	6	\N	23	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:10.537079	2025-09-06 16:17:10.537079
313	6	\N	23	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:10.541731	2025-09-06 16:17:10.541731
314	6	\N	23	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:10.542356	2025-09-06 16:17:10.542356
315	6	\N	23	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:10.669695	2025-09-06 16:17:10.669695
316	6	\N	23	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:10.671422	2025-09-06 16:17:10.671422
318	6	\N	23	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:10.83458	2025-09-06 16:17:10.83458
319	6	\N	23	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:10.83759	2025-09-06 16:17:10.83759
320	6	\N	23	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:10.838173	2025-09-06 16:17:10.838173
321	6	\N	23	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:11.068959	2025-09-06 16:17:11.068959
317	6	\N	23	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:10.768366	2025-09-08 12:43:42.210495
322	6	\N	23	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:11.069454	2025-09-06 16:17:11.069454
329	6	\N	24	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:11.387575	2025-09-06 16:17:11.387575
331	6	\N	24	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:11.460171	2025-09-06 16:17:11.460171
334	6	\N	24	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:11.691521	2025-09-06 16:17:11.691521
323	6	\N	23	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:11.069996	2025-09-06 16:17:11.069996
324	6	\N	24	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:11.128003	2025-09-06 16:17:11.128003
328	6	\N	24	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:11.386522	2025-09-06 16:17:11.386522
330	6	\N	24	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:11.459654	2025-09-06 16:17:11.459654
332	6	\N	24	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:11.622161	2025-09-06 16:17:11.622161
333	6	\N	24	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:11.690725	2025-09-06 16:17:11.690725
325	6	\N	24	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:11.128769	2025-09-06 16:17:11.128769
326	6	\N	24	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:11.335537	2025-09-06 16:17:11.335537
327	6	\N	24	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:11.386039	2025-09-06 16:17:11.386039
335	6	\N	24	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:11.692314	2025-09-06 16:17:11.692314
336	6	\N	24	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:11.784834	2025-09-06 16:17:11.784834
339	6	\N	21	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:49.665153	2025-09-06 16:22:49.665153
337	6	\N	21	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:49.642021	2025-09-06 16:22:49.642021
340	6	\N	21	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:49.91018	2025-09-06 16:22:49.91018
341	6	\N	21	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:49.919381	2025-09-06 16:22:49.919381
342	6	\N	21	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:49.922845	2025-09-06 16:22:49.922845
343	6	\N	21	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:50.020744	2025-09-06 16:22:50.020744
344	6	\N	21	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:50.021302	2025-09-06 16:22:50.021302
345	6	\N	21	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:50.023746	2025-09-06 16:22:50.023746
346	6	\N	21	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:50.334459	2025-09-06 16:22:50.334459
347	6	\N	21	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:50.340604	2025-09-06 16:22:50.340604
348	6	\N	22	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:50.343582	2025-09-06 16:22:50.343582
349	6	\N	21	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:50.345861	2025-09-06 16:22:50.345861
350	6	\N	21	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:50.346666	2025-09-06 16:22:50.346666
351	6	\N	22	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:50.347665	2025-09-06 16:22:50.347665
352	6	\N	22	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:50.630345	2025-09-06 16:22:50.630345
353	6	\N	22	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:50.6315	2025-09-06 16:22:50.6315
354	6	\N	22	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:50.633403	2025-09-06 16:22:50.633403
355	6	\N	22	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:50.645615	2025-09-06 16:22:50.645615
356	6	\N	22	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:50.647148	2025-09-06 16:22:50.647148
357	6	\N	22	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:50.648251	2025-09-06 16:22:50.648251
358	6	\N	22	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:50.942152	2025-09-06 16:22:50.942152
359	6	\N	22	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:50.943786	2025-09-06 16:22:50.943786
360	6	\N	22	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:50.946327	2025-09-06 16:22:50.946327
361	6	\N	22	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:50.948073	2025-09-06 16:22:50.948073
362	6	\N	23	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:50.954912	2025-09-06 16:22:50.954912
363	6	\N	22	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:50.955536	2025-09-06 16:22:50.955536
364	6	\N	23	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:51.283015	2025-09-06 16:22:51.283015
365	6	\N	23	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:51.290318	2025-09-06 16:22:51.290318
366	6	\N	23	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:51.292389	2025-09-06 16:22:51.292389
367	6	\N	23	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:51.292999	2025-09-06 16:22:51.292999
368	6	\N	23	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:51.294115	2025-09-06 16:22:51.294115
369	6	\N	23	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:51.298843	2025-09-06 16:22:51.298843
370	6	\N	23	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:51.573759	2025-09-06 16:22:51.573759
380	6	\N	24	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:51.928992	2025-09-06 16:22:51.928992
383	6	\N	24	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:52.276561	2025-09-06 16:22:52.276561
371	6	\N	23	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:51.579824	2025-09-06 16:22:51.579824
378	6	\N	24	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:51.913877	2025-09-06 16:22:51.913877
385	6	\N	24	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:52.278235	2025-09-06 16:22:52.278235
372	6	\N	23	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:51.593798	2025-09-06 16:22:51.593798
379	6	\N	24	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:51.915033	2025-09-06 16:22:51.915033
384	6	\N	24	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:52.277313	2025-09-06 16:22:52.277313
373	6	\N	23	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:51.594207	2025-09-06 16:22:51.594207
376	6	\N	24	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:51.907768	2025-09-06 16:22:51.907768
387	6	\N	24	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:52.284468	2025-09-06 16:22:52.284468
388	6	\N	24	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:52.578466	2025-09-06 16:22:52.578466
374	6	\N	23	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:51.599303	2025-09-06 16:22:51.599303
377	6	\N	24	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:51.909636	2025-09-06 16:22:51.909636
386	6	\N	24	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:52.280033	2025-09-06 16:22:52.280033
375	6	\N	23	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:51.599655	2025-09-06 16:22:51.599655
381	6	\N	24	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:51.93018	2025-09-06 16:22:51.93018
382	6	\N	24	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:52.275978	2025-09-06 16:22:52.275978
105	6	\N	21	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:34.999953	2025-09-06 14:18:34.999953
392	6	\N	22	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:30:20.855527	2025-09-06 16:30:20.855527
390	6	\N	22	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:30:20.84354	2025-09-06 16:30:20.84354
389	6	\N	21	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:30:20.843142	2025-09-06 16:30:20.843142
391	6	\N	22	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:30:20.841992	2025-09-06 16:30:20.841992
393	6	\N	22	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:30:21.20322	2025-09-06 16:30:21.20322
394	6	\N	22	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:30:21.211346	2025-09-06 16:30:21.211346
395	6	\N	22	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:30:21.215246	2025-09-06 16:30:21.215246
396	6	\N	22	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:30:21.225271	2025-09-06 16:30:21.225271
397	6	\N	22	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:30:21.500855	2025-09-06 16:30:21.500855
398	6	\N	22	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:30:21.505853	2025-09-06 16:30:21.505853
399	6	\N	22	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:30:21.518237	2025-09-06 16:30:21.518237
400	6	\N	22	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:30:21.518777	2025-09-06 16:30:21.518777
401	6	\N	21	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:30:21.575027	2025-09-06 16:30:21.575027
402	6	\N	21	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:30:21.820084	2025-09-06 16:30:21.820084
403	6	\N	21	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:30:21.821735	2025-09-06 16:30:21.821735
404	6	\N	21	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:30:21.832875	2025-09-06 16:30:21.832875
405	6	\N	21	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:30:21.848372	2025-09-06 16:30:21.848372
406	6	\N	21	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:30:22.078665	2025-09-06 16:30:22.078665
407	6	\N	21	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:30:22.132186	2025-09-06 16:30:22.132186
408	6	\N	22	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:30:22.132839	2025-09-06 16:30:22.132839
409	6	\N	22	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:30:22.149563	2025-09-06 16:30:22.149563
410	6	\N	21	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:30:22.173586	2025-09-06 16:30:22.173586
411	6	\N	21	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:30:22.415959	2025-09-06 16:30:22.415959
412	6	\N	21	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:30:22.436419	2025-09-06 16:30:22.436419
413	6	\N	21	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:30:22.436926	2025-09-06 16:30:22.436926
419	6	\N	21	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:39.073247	2025-09-06 16:34:39.073247
417	6	\N	21	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:39.072128	2025-09-06 16:34:39.072128
415	6	\N	21	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:39.053469	2025-09-06 16:34:39.053469
418	6	\N	21	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:39.078033	2025-09-06 16:34:39.078033
420	6	\N	21	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:39.457858	2025-09-06 16:34:39.457858
421	6	\N	21	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:39.463146	2025-09-06 16:34:39.463146
422	6	\N	21	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:39.475209	2025-09-06 16:34:39.475209
416	6	\N	21	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:39.075816	2025-09-08 12:43:37.542354
423	6	\N	21	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:39.475962	2025-09-06 16:34:39.475962
426	6	\N	21	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:39.769751	2025-09-06 16:34:39.769751
424	6	\N	21	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:39.476747	2025-09-06 16:34:39.476747
425	6	\N	21	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:39.763519	2025-09-06 16:34:39.763519
427	6	\N	23	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:39.786551	2025-09-06 16:34:39.786551
433	6	\N	23	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:40.087931	2025-09-06 16:34:40.087931
439	6	\N	23	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:40.380258	2025-09-06 16:34:40.380258
440	6	\N	24	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:40.480382	2025-09-06 16:34:40.480382
443	6	\N	24	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:40.679381	2025-09-06 16:34:40.679381
450	6	\N	24	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:40.991671	2025-09-06 16:34:40.991671
453	6	\N	24	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:41.105018	2025-09-06 16:34:41.105018
428	6	\N	23	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:39.793047	2025-09-06 16:34:39.793047
431	6	\N	23	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:40.061282	2025-09-06 16:34:40.061282
435	6	\N	23	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:40.135105	2025-09-06 16:34:40.135105
436	6	\N	23	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:40.376955	2025-09-06 16:34:40.376955
445	6	\N	24	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:40.685732	2025-09-06 16:34:40.685732
446	6	\N	24	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:40.782877	2025-09-06 16:34:40.782877
449	6	\N	24	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:40.984441	2025-09-06 16:34:40.984441
429	6	\N	21	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:39.79357	2025-09-06 16:34:39.79357
430	6	\N	23	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:40.033066	2025-09-06 16:34:40.033066
432	6	\N	23	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:40.062913	2025-09-06 16:34:40.062913
434	6	\N	23	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:40.131248	2025-09-06 16:34:40.131248
437	6	\N	23	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:40.37836	2025-09-06 16:34:40.37836
438	6	\N	23	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:40.379557	2025-09-06 16:34:40.379557
441	6	\N	23	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:40.482826	2025-09-06 16:34:40.482826
442	6	\N	24	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:40.678678	2025-09-06 16:34:40.678678
444	6	\N	24	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:40.681077	2025-09-06 16:34:40.681077
447	6	\N	24	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:40.788054	2025-09-06 16:34:40.788054
448	6	\N	24	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:40.98165	2025-09-06 16:34:40.98165
451	6	\N	24	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:40.994416	2025-09-06 16:34:40.994416
452	6	\N	24	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:34:41.103011	2025-09-06 16:34:41.103011
454	6	\N	21	Base Rate - Standard Single	2025-01-06	2025-01-12	1500.00	1500.00	1500.00	1500.00	200.00	300.00	500.00	0.00	300.00	500.00	16	\N	["friday","saturday","sunday"]	t	1	Test rates for matrix functionality	2025-09-06 16:38:33.305415	2025-09-06 16:38:33.305415
455	6	\N	21	Premium Rate - Standard Single	2025-01-15	2025-01-20	2200.00	2200.00	2200.00	2200.00	200.00	300.00	500.00	0.00	300.00	500.00	16	\N	["friday","saturday","sunday"]	t	1	Premium test rates	2025-09-06 16:38:33.305415	2025-09-06 16:38:33.305415
456	6	\N	22	Base Rate - Standard Double	2025-01-08	2025-01-14	2000.00	2000.00	2000.00	2000.00	200.00	300.00	500.00	0.00	300.00	500.00	16	\N	["friday","saturday","sunday"]	t	1	Test rates for matrix functionality	2025-09-06 16:38:33.305415	2025-09-06 16:38:33.305415
457	6	\N	22	Premium Rate - Standard Double	2025-01-16	2025-01-20	2800.00	2800.00	2800.00	2800.00	200.00	300.00	500.00	0.00	300.00	500.00	16	\N	["friday","saturday","sunday"]	t	1	Premium test rates	2025-09-06 16:38:33.305415	2025-09-06 16:38:33.305415
458	6	\N	23	Base Rate - Deluxe Suite	2025-01-10	2025-01-16	3500.00	3500.00	3500.00	3500.00	200.00	300.00	500.00	0.00	300.00	500.00	16	\N	["friday","saturday","sunday"]	t	1	Test rates for matrix functionality	2025-09-06 16:38:33.305415	2025-09-06 16:38:33.305415
459	6	\N	24	Weekend Special - Executive Suite	2025-01-18	2025-01-20	5000.00	5000.00	5000.00	5000.00	200.00	300.00	500.00	0.00	300.00	500.00	16	\N	["friday","saturday","sunday"]	t	1	Weekend special rates	2025-09-06 16:38:33.305415	2025-09-06 16:38:33.305415
460	6	\N	21	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:33.591327	2025-09-06 16:41:33.591327
461	6	\N	21	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:33.592753	2025-09-06 16:41:33.592753
462	6	\N	21	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:33.595861	2025-09-06 16:41:33.595861
463	6	\N	21	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:33.6005	2025-09-06 16:41:33.6005
464	6	\N	21	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:33.60534	2025-09-06 16:41:33.60534
465	6	\N	21	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:33.881392	2025-09-06 16:41:33.881392
466	6	\N	21	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:33.888786	2025-09-06 16:41:33.888786
467	6	\N	21	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:33.895922	2025-09-06 16:41:33.895922
468	6	\N	21	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:33.902017	2025-09-06 16:41:33.902017
469	6	\N	21	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:33.905257	2025-09-06 16:41:33.905257
470	6	\N	21	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:34.165122	2025-09-06 16:41:34.165122
471	6	\N	21	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:34.173188	2025-09-06 16:41:34.173188
472	6	\N	22	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:34.200392	2025-09-06 16:41:34.200392
473	6	\N	21	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:34.204298	2025-09-06 16:41:34.204298
474	6	\N	22	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:34.205804	2025-09-06 16:41:34.205804
475	6	\N	22	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:34.348311	2025-09-06 16:41:34.348311
476	6	\N	22	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:34.451463	2025-09-06 16:41:34.451463
477	6	\N	22	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:34.466788	2025-09-06 16:41:34.466788
478	6	\N	22	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:34.490262	2025-09-06 16:41:34.490262
479	6	\N	22	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:34.491856	2025-09-06 16:41:34.491856
483	6	\N	22	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:34.752259	2025-09-06 16:41:34.752259
491	6	\N	23	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:35.079189	2025-09-06 16:41:35.079189
495	6	\N	23	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:35.334439	2025-09-06 16:41:35.334439
510	6	\N	24	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:35.984143	2025-09-06 16:41:35.984143
511	6	\N	24	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:36.106066	2025-09-06 16:41:36.106066
480	6	\N	22	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:34.49464	2025-09-06 16:41:34.49464
481	6	\N	22	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:34.64124	2025-09-06 16:41:34.64124
482	6	\N	22	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:34.729558	2025-09-06 16:41:34.729558
492	6	\N	23	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:35.081727	2025-09-06 16:41:35.081727
493	6	\N	23	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:35.22119	2025-09-06 16:41:35.22119
494	6	\N	23	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:35.306521	2025-09-06 16:41:35.306521
498	6	\N	23	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:35.377908	2025-09-06 16:41:35.377908
499	6	\N	24	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:35.526777	2025-09-06 16:41:35.526777
501	6	\N	24	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:35.620418	2025-09-06 16:41:35.620418
504	6	\N	24	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:35.694797	2025-09-06 16:41:35.694797
505	6	\N	24	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:35.817785	2025-09-06 16:41:35.817785
507	6	\N	24	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:35.922207	2025-09-06 16:41:35.922207
484	6	\N	22	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:34.777575	2025-09-06 16:41:34.777575
490	6	\N	23	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:35.072082	2025-09-06 16:41:35.072082
496	6	\N	23	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:35.373258	2025-09-06 16:41:35.373258
503	6	\N	24	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:35.666531	2025-09-06 16:41:35.666531
506	6	\N	24	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:35.871314	2025-09-06 16:41:35.871314
508	6	\N	24	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:35.951402	2025-09-06 16:41:35.951402
485	6	\N	22	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:34.787032	2025-09-06 16:41:34.787032
489	6	\N	23	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:35.047015	2025-09-06 16:41:35.047015
497	6	\N	23	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:35.3738	2025-09-06 16:41:35.3738
500	6	\N	24	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:35.587431	2025-09-06 16:41:35.587431
502	6	\N	24	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:35.659483	2025-09-06 16:41:35.659483
509	6	\N	24	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:35.974141	2025-09-06 16:41:35.974141
486	6	\N	23	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:34.788116	2025-09-06 16:41:34.788116
487	6	\N	23	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:34.936066	2025-09-06 16:41:34.936066
488	6	\N	23	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:41:35.015117	2025-09-06 16:41:35.015117
512	6	\N	21	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:42:30.001968	2025-09-06 16:42:30.001968
513	6	\N	21	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:42:30.013504	2025-09-06 16:42:30.013504
514	6	\N	21	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:42:30.016193	2025-09-06 16:42:30.016193
515	6	\N	21	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:42:30.018716	2025-09-06 16:42:30.018716
516	6	\N	21	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:42:30.022234	2025-09-06 16:42:30.022234
517	6	\N	21	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:42:30.293535	2025-09-06 16:42:30.293535
518	6	\N	21	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:42:30.310456	2025-09-06 16:42:30.310456
519	6	\N	21	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:42:30.313667	2025-09-06 16:42:30.313667
520	6	\N	21	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:42:30.321802	2025-09-06 16:42:30.321802
521	6	\N	21	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:42:30.321546	2025-09-06 16:42:30.321546
522	6	\N	21	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:42:30.612704	2025-09-06 16:42:30.612704
523	6	\N	21	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:42:30.614192	2025-09-06 16:42:30.614192
524	6	\N	21	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:42:30.619954	2025-09-06 16:42:30.619954
525	6	\N	23	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:42:30.634143	2025-09-06 16:42:30.634143
526	6	\N	23	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:42:30.635061	2025-09-06 16:42:30.635061
527	6	\N	23	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:42:30.900473	2025-09-06 16:42:30.900473
528	6	\N	23	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:42:30.912346	2025-09-06 16:42:30.912346
529	6	\N	23	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:42:30.913751	2025-09-06 16:42:30.913751
530	6	\N	23	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:42:30.915908	2025-09-06 16:42:30.915908
531	6	\N	23	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:42:30.932578	2025-09-06 16:42:30.932578
532	6	\N	23	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:42:31.135628	2025-09-06 16:42:31.135628
533	6	\N	23	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:42:31.186844	2025-09-06 16:42:31.186844
534	6	\N	23	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:42:31.260702	2025-09-06 16:42:31.260702
535	6	\N	23	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:42:31.266104	2025-09-06 16:42:31.266104
536	6	\N	23	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:42:31.267143	2025-09-06 16:42:31.267143
537	6	\N	23	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:42:31.270738	2025-09-06 16:42:31.270738
538	6	\N	21	Bulk Rate - Jan 11, 2025	2025-01-11	2025-01-11	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:40.918551	2025-09-06 16:46:40.918551
539	6	\N	21	Bulk Rate - Jan 12, 2025	2025-01-12	2025-01-12	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:40.991513	2025-09-06 16:46:40.991513
540	6	\N	21	Bulk Rate - Jan 13, 2025	2025-01-13	2025-01-13	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.067143	2025-09-06 16:46:41.067143
541	6	\N	21	Bulk Rate - Jan 06, 2025	2025-01-06	2025-01-06	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.07739	2025-09-06 16:46:41.07739
542	6	\N	21	Bulk Rate - Jan 07, 2025	2025-01-07	2025-01-07	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.085352	2025-09-06 16:46:41.085352
543	6	\N	21	Bulk Rate - Jan 10, 2025	2025-01-10	2025-01-10	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.093036	2025-09-06 16:46:41.093036
544	6	\N	21	Bulk Rate - Jan 08, 2025	2025-01-08	2025-01-08	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.092354	2025-09-06 16:46:41.092354
545	6	\N	21	Bulk Rate - Jan 09, 2025	2025-01-09	2025-01-09	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.101021	2025-09-06 16:46:41.101021
546	6	\N	21	Bulk Rate - Jan 14, 2025	2025-01-14	2025-01-14	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.136877	2025-09-06 16:46:41.136877
547	6	\N	21	Bulk Rate - Jan 15, 2025	2025-01-15	2025-01-15	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.156538	2025-09-06 16:46:41.156538
553	6	\N	22	Bulk Rate - Jan 06, 2025	2025-01-06	2025-01-06	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.229594	2025-09-06 16:46:41.229594
559	6	\N	22	Bulk Rate - Jan 12, 2025	2025-01-12	2025-01-12	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.308299	2025-09-06 16:46:41.308299
565	6	\N	22	Bulk Rate - Jan 18, 2025	2025-01-18	2025-01-18	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.383053	2025-09-06 16:46:41.383053
570	6	\N	23	Bulk Rate - Jan 07, 2025	2025-01-07	2025-01-07	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.451836	2025-09-06 16:46:41.451836
575	6	\N	23	Bulk Rate - Jan 13, 2025	2025-01-13	2025-01-13	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.528298	2025-09-06 16:46:41.528298
581	6	\N	23	Bulk Rate - Jan 20, 2025	2025-01-20	2025-01-20	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.610051	2025-09-06 16:46:41.610051
588	6	\N	24	Bulk Rate - Jan 11, 2025	2025-01-11	2025-01-11	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.691584	2025-09-06 16:46:41.691584
593	6	\N	24	Bulk Rate - Jan 16, 2025	2025-01-16	2025-01-16	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.766644	2025-09-06 16:46:41.766644
548	6	\N	21	Bulk Rate - Jan 17, 2025	2025-01-17	2025-01-17	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.196567	2025-09-06 16:46:41.196567
558	6	\N	22	Bulk Rate - Jan 11, 2025	2025-01-11	2025-01-11	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.287451	2025-09-06 16:46:41.287451
561	6	\N	22	Bulk Rate - Jan 14, 2025	2025-01-14	2025-01-14	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.364927	2025-09-06 16:46:41.364927
569	6	\N	23	Bulk Rate - Jan 06, 2025	2025-01-06	2025-01-06	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.450447	2025-09-06 16:46:41.450447
576	6	\N	23	Bulk Rate - Jan 14, 2025	2025-01-14	2025-01-14	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.530004	2025-09-06 16:46:41.530004
580	6	\N	23	Bulk Rate - Jan 18, 2025	2025-01-18	2025-01-18	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.609561	2025-09-06 16:46:41.609561
586	6	\N	24	Bulk Rate - Jan 09, 2025	2025-01-09	2025-01-09	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.689246	2025-09-06 16:46:41.689246
594	6	\N	24	Bulk Rate - Jan 15, 2025	2025-01-15	2025-01-15	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.76979	2025-09-06 16:46:41.76979
549	6	\N	21	Bulk Rate - Jan 16, 2025	2025-01-16	2025-01-16	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.200998	2025-09-06 16:46:41.200998
557	6	\N	22	Bulk Rate - Jan 10, 2025	2025-01-10	2025-01-10	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.282756	2025-09-06 16:46:41.282756
562	6	\N	22	Bulk Rate - Jan 15, 2025	2025-01-15	2025-01-15	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.3655	2025-09-06 16:46:41.3655
571	6	\N	23	Bulk Rate - Jan 09, 2025	2025-01-09	2025-01-09	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.456281	2025-09-06 16:46:41.456281
574	6	\N	23	Bulk Rate - Jan 12, 2025	2025-01-12	2025-01-12	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.527709	2025-09-06 16:46:41.527709
582	6	\N	24	Bulk Rate - Jan 06, 2025	2025-01-06	2025-01-06	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.610511	2025-09-06 16:46:41.610511
589	6	\N	24	Bulk Rate - Jan 12, 2025	2025-01-12	2025-01-12	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.692127	2025-09-06 16:46:41.692127
592	6	\N	24	Bulk Rate - Jan 18, 2025	2025-01-18	2025-01-18	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.765934	2025-09-06 16:46:41.765934
550	6	\N	21	Bulk Rate - Jan 19, 2025	2025-01-19	2025-01-19	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.203324	2025-09-06 16:46:41.203324
556	6	\N	22	Bulk Rate - Jan 09, 2025	2025-01-09	2025-01-09	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.280751	2025-09-06 16:46:41.280751
563	6	\N	22	Bulk Rate - Jan 17, 2025	2025-01-17	2025-01-17	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.366131	2025-09-06 16:46:41.366131
568	6	\N	23	Bulk Rate - Jan 08, 2025	2025-01-08	2025-01-08	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.449672	2025-09-06 16:46:41.449672
577	6	\N	23	Bulk Rate - Jan 15, 2025	2025-01-15	2025-01-15	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.530549	2025-09-06 16:46:41.530549
583	6	\N	23	Bulk Rate - Jan 19, 2025	2025-01-19	2025-01-19	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.60372	2025-09-06 16:46:41.60372
587	6	\N	24	Bulk Rate - Jan 10, 2025	2025-01-10	2025-01-10	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.689817	2025-09-06 16:46:41.689817
596	6	\N	24	Bulk Rate - Jan 19, 2025	2025-01-19	2025-01-19	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.773419	2025-09-06 16:46:41.773419
551	6	\N	21	Bulk Rate - Jan 18, 2025	2025-01-18	2025-01-18	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.204114	2025-09-06 16:46:41.204114
554	6	\N	22	Bulk Rate - Jan 07, 2025	2025-01-07	2025-01-07	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.270156	2025-09-06 16:46:41.270156
560	6	\N	22	Bulk Rate - Jan 13, 2025	2025-01-13	2025-01-13	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.344203	2025-09-06 16:46:41.344203
566	6	\N	22	Bulk Rate - Jan 19, 2025	2025-01-19	2025-01-19	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.414886	2025-09-06 16:46:41.414886
572	6	\N	23	Bulk Rate - Jan 10, 2025	2025-01-10	2025-01-10	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.483887	2025-09-06 16:46:41.483887
578	6	\N	23	Bulk Rate - Jan 16, 2025	2025-01-16	2025-01-16	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.554122	2025-09-06 16:46:41.554122
584	6	\N	24	Bulk Rate - Jan 07, 2025	2025-01-07	2025-01-07	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.628002	2025-09-06 16:46:41.628002
590	6	\N	24	Bulk Rate - Jan 13, 2025	2025-01-13	2025-01-13	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.703101	2025-09-06 16:46:41.703101
595	6	\N	24	Bulk Rate - Jan 17, 2025	2025-01-17	2025-01-17	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.770146	2025-09-06 16:46:41.770146
552	6	\N	21	Bulk Rate - Jan 20, 2025	2025-01-20	2025-01-20	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.210483	2025-09-06 16:46:41.210483
555	6	\N	22	Bulk Rate - Jan 08, 2025	2025-01-08	2025-01-08	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.27827	2025-09-06 16:46:41.27827
564	6	\N	22	Bulk Rate - Jan 16, 2025	2025-01-16	2025-01-16	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.369154	2025-09-06 16:46:41.369154
567	6	\N	22	Bulk Rate - Jan 20, 2025	2025-01-20	2025-01-20	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.436055	2025-09-06 16:46:41.436055
573	6	\N	23	Bulk Rate - Jan 11, 2025	2025-01-11	2025-01-11	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.507707	2025-09-06 16:46:41.507707
579	6	\N	23	Bulk Rate - Jan 17, 2025	2025-01-17	2025-01-17	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.578461	2025-09-06 16:46:41.578461
585	6	\N	24	Bulk Rate - Jan 08, 2025	2025-01-08	2025-01-08	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.65558	2025-09-06 16:46:41.65558
591	6	\N	24	Bulk Rate - Jan 14, 2025	2025-01-14	2025-01-14	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.727666	2025-09-06 16:46:41.727666
597	6	\N	24	Bulk Rate - Jan 20, 2025	2025-01-20	2025-01-20	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:41.801775	2025-09-06 16:46:41.801775
598	6	\N	21	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:57.99167	2025-09-06 16:46:57.99167
599	6	\N	21	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:57.998928	2025-09-06 16:46:57.998928
600	6	\N	21	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:58.001283	2025-09-06 16:46:58.001283
601	6	\N	21	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:58.007501	2025-09-06 16:46:58.007501
602	6	\N	21	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:58.009937	2025-09-06 16:46:58.009937
603	6	\N	21	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:58.393104	2025-09-06 16:46:58.393104
604	6	\N	21	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:58.394524	2025-09-06 16:46:58.394524
605	6	\N	21	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:58.394314	2025-09-06 16:46:58.394314
606	6	\N	21	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:58.396716	2025-09-06 16:46:58.396716
607	6	\N	21	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:58.396629	2025-09-06 16:46:58.396629
608	6	\N	21	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:58.613819	2025-09-06 16:46:58.613819
609	6	\N	21	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:58.691387	2025-09-06 16:46:58.691387
610	6	\N	23	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:58.696537	2025-09-06 16:46:58.696537
611	6	\N	23	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:58.69625	2025-09-06 16:46:58.69625
612	6	\N	21	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:58.698598	2025-09-06 16:46:58.698598
613	6	\N	23	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:58.701566	2025-09-06 16:46:58.701566
614	6	\N	23	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:58.895031	2025-09-06 16:46:58.895031
615	6	\N	23	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:59.083284	2025-09-06 16:46:59.083284
616	6	\N	23	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:59.084741	2025-09-06 16:46:59.084741
617	6	\N	23	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:59.08549	2025-09-06 16:46:59.08549
618	6	\N	23	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:59.086808	2025-09-06 16:46:59.086808
619	6	\N	23	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:59.095129	2025-09-06 16:46:59.095129
620	6	\N	23	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:59.182628	2025-09-06 16:46:59.182628
621	6	\N	23	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:59.373322	2025-09-06 16:46:59.373322
622	6	\N	23	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:59.374794	2025-09-06 16:46:59.374794
623	6	\N	23	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:46:59.378965	2025-09-06 16:46:59.378965
625	6	\N	21	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:54:05.660931	2025-09-06 16:54:05.660931
624	6	\N	23	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:54:05.672993	2025-09-06 16:54:05.672993
626	6	\N	23	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:54:05.68215	2025-09-06 16:54:05.68215
627	6	\N	23	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:54:05.695769	2025-09-06 16:54:05.695769
628	6	\N	23	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:54:05.710451	2025-09-06 16:54:05.710451
629	6	\N	23	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:54:05.996188	2025-09-06 16:54:05.996188
630	6	\N	21	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:54:05.996802	2025-09-06 16:54:05.996802
637	6	\N	23	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:54:06.330806	2025-09-06 16:54:06.330806
638	6	\N	21	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:54:06.360765	2025-09-06 16:54:06.360765
639	6	\N	23	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:54:06.464358	2025-09-06 16:54:06.464358
640	6	\N	21	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:54:06.621238	2025-09-06 16:54:06.621238
641	6	\N	23	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:54:06.624096	2025-09-06 16:54:06.624096
649	6	\N	23	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:54:06.936844	2025-09-06 16:54:06.936844
631	6	\N	21	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:54:06.006754	2025-09-06 16:54:06.006754
636	6	\N	21	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:54:06.329328	2025-09-06 16:54:06.329328
642	6	\N	23	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:54:06.634039	2025-09-06 16:54:06.634039
648	6	\N	23	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:54:06.935417	2025-09-06 16:54:06.935417
632	6	\N	21	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:54:06.01054	2025-09-06 16:54:06.01054
635	6	\N	21	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:54:06.327531	2025-09-06 16:54:06.327531
643	6	\N	21	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:54:06.635515	2025-09-06 16:54:06.635515
647	6	\N	21	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:54:06.91328	2025-09-06 16:54:06.91328
633	6	\N	21	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:54:06.015898	2025-09-06 16:54:06.015898
634	6	\N	23	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:54:06.324744	2025-09-06 16:54:06.324744
644	6	\N	23	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:54:06.666	2025-09-06 16:54:06.666
645	6	\N	21	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:54:06.77385	2025-09-06 16:54:06.77385
646	6	\N	21	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:54:06.909048	2025-09-06 16:54:06.909048
650	6	\N	21	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:53.789352	2025-09-06 17:00:53.789352
651	6	\N	21	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:54.000223	2025-09-06 17:00:54.000223
652	6	\N	21	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:53.999981	2025-09-06 17:00:53.999981
653	6	\N	21	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:54.132508	2025-09-06 17:00:54.132508
654	6	\N	21	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:54.371302	2025-09-06 17:00:54.371302
655	6	\N	21	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:54.378106	2025-09-06 17:00:54.378106
656	6	\N	21	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:54.481139	2025-09-06 17:00:54.481139
657	6	\N	21	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:54.695237	2025-09-06 17:00:54.695237
658	6	\N	21	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:54.700229	2025-09-06 17:00:54.700229
659	6	\N	21	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:54.711111	2025-09-06 17:00:54.711111
660	6	\N	21	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:54.883852	2025-09-06 17:00:54.883852
661	6	\N	21	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:54.91604	2025-09-06 17:00:54.91604
662	6	\N	21	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:54.915382	2025-09-06 17:00:54.915382
663	6	\N	22	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:54.987503	2025-09-06 17:00:54.987503
664	6	\N	22	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:54.989602	2025-09-06 17:00:54.989602
665	6	\N	22	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:55.005035	2025-09-06 17:00:55.005035
666	6	\N	22	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:55.186411	2025-09-06 17:00:55.186411
667	6	\N	22	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:55.204685	2025-09-06 17:00:55.204685
668	6	\N	22	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:55.205395	2025-09-06 17:00:55.205395
669	6	\N	22	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:55.402099	2025-09-06 17:00:55.402099
670	6	\N	22	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:55.408044	2025-09-06 17:00:55.408044
671	6	\N	22	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:55.418836	2025-09-06 17:00:55.418836
672	6	\N	22	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:55.478038	2025-09-06 17:00:55.478038
673	6	\N	22	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:55.490847	2025-09-06 17:00:55.490847
674	6	\N	22	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:55.491403	2025-09-06 17:00:55.491403
675	6	\N	23	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:55.703737	2025-09-06 17:00:55.703737
676	6	\N	22	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:55.705809	2025-09-06 17:00:55.705809
677	6	\N	23	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:55.718658	2025-09-06 17:00:55.718658
678	6	\N	23	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:55.767452	2025-09-06 17:00:55.767452
679	6	\N	23	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:55.786326	2025-09-06 17:00:55.786326
680	6	\N	23	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:55.787725	2025-09-06 17:00:55.787725
681	6	\N	23	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:56.018423	2025-09-06 17:00:56.018423
682	6	\N	23	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:56.019896	2025-09-06 17:00:56.019896
683	6	\N	23	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:56.021562	2025-09-06 17:00:56.021562
684	6	\N	23	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:56.07982	2025-09-06 17:00:56.07982
689	6	\N	24	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:56.324774	2025-09-06 17:00:56.324774
690	6	\N	24	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:56.433085	2025-09-06 17:00:56.433085
695	6	\N	24	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:56.638625	2025-09-06 17:00:56.638625
696	6	\N	24	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:56.743488	2025-09-06 17:00:56.743488
701	6	\N	24	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:56.935369	2025-09-06 17:00:56.935369
685	6	\N	23	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:56.083722	2025-09-06 17:00:56.083722
688	6	\N	23	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:56.31917	2025-09-06 17:00:56.31917
691	6	\N	24	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:56.434905	2025-09-06 17:00:56.434905
694	6	\N	24	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:56.632077	2025-09-06 17:00:56.632077
697	6	\N	24	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:56.74798	2025-09-06 17:00:56.74798
700	6	\N	24	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:56.915692	2025-09-06 17:00:56.915692
686	6	\N	23	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:56.088545	2025-09-06 17:00:56.088545
687	6	\N	23	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:56.318592	2025-09-06 17:00:56.318592
692	6	\N	24	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:56.437761	2025-09-06 17:00:56.437761
693	6	\N	24	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:56.622599	2025-09-06 17:00:56.622599
698	6	\N	24	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:56.748838	2025-09-06 17:00:56.748838
699	6	\N	24	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:00:56.914237	2025-09-06 17:00:56.914237
702	6	\N	21	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:30.870103	2025-09-06 17:03:30.870103
703	6	\N	21	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:30.87114	2025-09-06 17:03:30.87114
704	6	\N	21	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:30.889412	2025-09-06 17:03:30.889412
705	6	\N	21	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:30.899716	2025-09-06 17:03:30.899716
706	6	\N	21	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:31.159248	2025-09-06 17:03:31.159248
707	6	\N	21	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:31.162982	2025-09-06 17:03:31.162982
708	6	\N	21	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:31.175869	2025-09-06 17:03:31.175869
709	6	\N	21	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:31.191365	2025-09-06 17:03:31.191365
710	6	\N	21	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:31.450818	2025-09-06 17:03:31.450818
711	6	\N	21	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:31.456009	2025-09-06 17:03:31.456009
712	6	\N	21	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:31.462687	2025-09-06 17:03:31.462687
713	6	\N	21	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:31.528641	2025-09-06 17:03:31.528641
714	6	\N	21	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:31.666391	2025-09-06 17:03:31.666391
715	6	\N	22	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:31.758342	2025-09-06 17:03:31.758342
716	6	\N	22	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:31.761119	2025-09-06 17:03:31.761119
717	6	\N	22	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:31.763648	2025-09-06 17:03:31.763648
718	6	\N	22	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:31.869291	2025-09-06 17:03:31.869291
719	6	\N	22	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:31.964537	2025-09-06 17:03:31.964537
720	6	\N	22	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:32.066319	2025-09-06 17:03:32.066319
721	6	\N	22	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:32.068413	2025-09-06 17:03:32.068413
722	6	\N	22	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:32.072734	2025-09-06 17:03:32.072734
723	6	\N	22	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:32.279574	2025-09-06 17:03:32.279574
724	6	\N	22	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:32.280628	2025-09-06 17:03:32.280628
725	6	\N	22	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:32.392816	2025-09-06 17:03:32.392816
726	6	\N	22	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:32.396552	2025-09-06 17:03:32.396552
727	6	\N	22	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:32.397746	2025-09-06 17:03:32.397746
728	6	\N	23	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:32.580668	2025-09-06 17:03:32.580668
729	6	\N	23	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:32.585813	2025-09-06 17:03:32.585813
730	6	\N	23	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:32.784069	2025-09-06 17:03:32.784069
731	6	\N	23	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:32.787578	2025-09-06 17:03:32.787578
732	6	\N	23	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:32.796598	2025-09-06 17:03:32.796598
733	6	\N	23	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:32.889593	2025-09-06 17:03:32.889593
734	6	\N	23	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:32.893818	2025-09-06 17:03:32.893818
735	6	\N	23	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:33.09092	2025-09-06 17:03:33.09092
744	6	\N	24	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:33.405742	2025-09-06 17:03:33.405742
745	6	\N	24	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:33.506283	2025-09-06 17:03:33.506283
748	6	\N	24	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:33.712475	2025-09-06 17:03:33.712475
736	6	\N	23	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:33.093862	2025-09-06 17:03:33.093862
743	6	\N	24	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:33.404151	2025-09-06 17:03:33.404151
746	6	\N	24	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:33.510458	2025-09-06 17:03:33.510458
747	6	\N	24	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:33.711468	2025-09-06 17:03:33.711468
753	6	\N	24	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:34.014905	2025-09-06 17:03:34.014905
737	6	\N	23	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:33.094417	2025-09-06 17:03:33.094417
740	6	\N	23	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:33.179003	2025-09-06 17:03:33.179003
741	6	\N	24	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:33.398176	2025-09-06 17:03:33.398176
750	6	\N	24	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:33.719853	2025-09-06 17:03:33.719853
751	6	\N	24	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:33.913339	2025-09-06 17:03:33.913339
738	6	\N	23	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:33.09774	2025-09-06 17:03:33.09774
739	6	\N	23	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:33.174155	2025-09-06 17:03:33.174155
742	6	\N	24	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:33.399443	2025-09-06 17:03:33.399443
749	6	\N	24	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:33.713819	2025-09-06 17:03:33.713819
752	6	\N	24	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:03:33.916646	2025-09-06 17:03:33.916646
754	6	\N	21	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:51.147546	2025-09-06 17:05:51.147546
755	6	\N	21	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:51.15799	2025-09-06 17:05:51.15799
756	6	\N	21	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:51.163412	2025-09-06 17:05:51.163412
757	6	\N	21	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:51.16517	2025-09-06 17:05:51.16517
758	6	\N	21	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:51.173061	2025-09-06 17:05:51.173061
759	6	\N	21	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:51.435714	2025-09-06 17:05:51.435714
760	6	\N	21	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:51.454203	2025-09-06 17:05:51.454203
761	6	\N	21	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:51.457133	2025-09-06 17:05:51.457133
762	6	\N	21	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:51.459642	2025-09-06 17:05:51.459642
763	6	\N	21	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:51.461648	2025-09-06 17:05:51.461648
764	6	\N	21	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:51.738694	2025-09-06 17:05:51.738694
765	6	\N	21	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:51.752471	2025-09-06 17:05:51.752471
766	6	\N	22	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:51.75298	2025-09-06 17:05:51.75298
767	6	\N	21	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:51.753642	2025-09-06 17:05:51.753642
768	6	\N	22	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:51.754808	2025-09-06 17:05:51.754808
769	6	\N	22	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:51.944459	2025-09-06 17:05:51.944459
770	6	\N	22	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:52.04548	2025-09-06 17:05:52.04548
771	6	\N	22	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:52.053248	2025-09-06 17:05:52.053248
772	6	\N	22	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:52.053844	2025-09-06 17:05:52.053844
773	6	\N	22	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:52.055413	2025-09-06 17:05:52.055413
774	6	\N	22	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:52.059441	2025-09-06 17:05:52.059441
775	6	\N	22	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:52.255961	2025-09-06 17:05:52.255961
776	6	\N	22	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:52.453322	2025-09-06 17:05:52.453322
777	6	\N	22	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:52.457028	2025-09-06 17:05:52.457028
778	6	\N	22	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:52.462976	2025-09-06 17:05:52.462976
779	6	\N	22	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:52.463772	2025-09-06 17:05:52.463772
780	6	\N	23	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:52.465213	2025-09-06 17:05:52.465213
781	6	\N	23	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:52.558856	2025-09-06 17:05:52.558856
782	6	\N	23	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:52.759847	2025-09-06 17:05:52.759847
783	6	\N	23	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:52.764178	2025-09-06 17:05:52.764178
784	6	\N	23	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:52.781802	2025-09-06 17:05:52.781802
785	6	\N	23	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:52.782402	2025-09-06 17:05:52.782402
786	6	\N	23	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:52.782806	2025-09-06 17:05:52.782806
787	6	\N	23	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:52.872813	2025-09-06 17:05:52.872813
788	6	\N	23	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:53.068988	2025-09-06 17:05:53.068988
798	6	\N	24	Bulk Rate - Sep 11, 2025	2025-09-11	2025-09-11	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:53.391457	2025-09-06 17:05:53.391457
799	6	\N	24	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:53.687444	2025-09-06 17:05:53.687444
789	6	\N	23	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:53.074517	2025-09-06 17:05:53.074517
797	6	\N	24	Bulk Rate - Sep 12, 2025	2025-09-12	2025-09-12	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:53.390269	2025-09-06 17:05:53.390269
800	6	\N	24	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:53.689739	2025-09-06 17:05:53.689739
790	6	\N	23	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:53.076488	2025-09-06 17:05:53.076488
796	6	\N	24	Bulk Rate - Sep 10, 2025	2025-09-10	2025-09-10	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:53.389557	2025-09-06 17:05:53.389557
802	6	\N	24	Bulk Rate - Sep 17, 2025	2025-09-17	2025-09-17	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:53.694464	2025-09-06 17:05:53.694464
791	6	\N	23	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:53.079045	2025-09-06 17:05:53.079045
795	6	\N	24	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:53.388961	2025-09-06 17:05:53.388961
801	6	\N	24	Bulk Rate - Sep 15, 2025	2025-09-15	2025-09-15	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:53.69037	2025-09-06 17:05:53.69037
792	6	\N	23	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:53.082733	2025-09-06 17:05:53.082733
793	6	\N	24	Bulk Rate - Sep 06, 2025	2025-09-06	2025-09-06	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:53.309158	2025-09-06 17:05:53.309158
794	6	\N	24	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:53.384509	2025-09-06 17:05:53.384509
803	6	\N	24	Bulk Rate - Sep 18, 2025	2025-09-18	2025-09-18	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:53.699011	2025-09-06 17:05:53.699011
804	6	\N	24	Bulk Rate - Sep 19, 2025	2025-09-19	2025-09-19	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:53.898982	2025-09-06 17:05:53.898982
805	6	\N	24	Bulk Rate - Sep 20, 2025	2025-09-20	2025-09-20	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 17:05:53.98807	2025-09-06 17:05:53.98807
102	6	\N	21	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:33.791379	2025-09-06 14:18:33.791379
807	6	\N	22	Test Rate - Standard Double Jan 10	2025-01-10	2025-01-10	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-08 07:01:23.543709	2025-09-08 07:01:23.543709
808	6	\N	21	Test Rate - Standard Single Jan 11	2025-01-11	2025-01-11	1600.00	1600.00	1600.00	1600.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-08 07:01:25.880398	2025-09-08 07:01:25.880398
806	6	\N	21	Test Rate - Standard Single Jan 10	2025-01-10	2025-01-10	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-08 07:01:21.537608	2025-09-08 07:01:21.537608
809	2	\N	21	Test Rate	2024-01-01	2024-01-01	100.00	150.00	200.00	250.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-08 07:29:09.39845	2025-09-08 07:29:09.39845
810	2	\N	21	Test Rate 2	2024-01-02	2024-01-02	120.00	160.00	200.00	240.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-08 07:34:48.308884	2025-09-08 07:34:48.308884
811	2	\N	21	Debug Test	2024-01-03	2024-01-03	150.00	200.00	250.00	300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-08 07:38:54.112781	2025-09-08 07:38:54.112781
247	6	\N	21	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:35:32.119706	2025-09-06 14:35:32.119706
287	6	\N	21	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	3333.00	3333.00	3333.00	3333.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:17:09.039348	2025-09-06 16:17:09.039348
338	6	\N	21	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	4444.00	4444.00	4444.00	4444.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:22:49.645369	2025-09-06 16:22:49.645369
414	6	\N	21	Bulk Rate - Sep 08, 2025	2025-09-08	2025-09-08	5555.00	5555.00	5555.00	5555.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 16:30:22.442777	2025-09-06 16:30:22.442777
133	6	\N	23	Bulk Rate - Sep 13, 2025	2025-09-13	2025-09-13	4000.00	4000.00	4000.00	4000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:44.086417	2025-09-08 12:20:23.951261
142	6	\N	24	Bulk Rate - Sep 09, 2025	2025-09-09	2025-09-09	4000.00	4000.00	4000.00	4000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:18:47.069675	2025-09-08 12:20:25.151316
825	8	\N	21	Matrix Rate - 2025-09-21	2025-09-21	2025-09-21	2300.00	2300.00	2300.00	2300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-12 07:06:26.724708	2025-09-12 07:06:26.724708
816	6	\N	21	Matrix Rate - 2025-09-14	2025-09-14	2025-09-14	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-08 12:25:59.455862	2025-09-08 12:43:38.345656
819	6	\N	22	Matrix Rate - 2025-09-21	2025-09-21	2025-09-21	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-08 12:26:01.985625	2025-09-08 12:43:41.266757
813	6	\N	22	Matrix Rate - 2025-09-22	2025-09-22	2025-09-22	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-08 12:20:23.15611	2025-09-08 12:43:41.399709
817	6	\N	21	Matrix Rate - 2025-09-21	2025-09-21	2025-09-21	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-08 12:26:00.404921	2025-09-08 12:43:39.276127
812	6	\N	21	Matrix Rate - 2025-09-22	2025-09-22	2025-09-22	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-08 12:20:21.411379	2025-09-08 12:43:39.407701
818	6	\N	22	Matrix Rate - 2025-09-14	2025-09-14	2025-09-14	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-08 12:26:01.2018	2025-09-08 12:43:40.339059
820	6	\N	23	Matrix Rate - 2025-09-14	2025-09-14	2025-09-14	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-08 12:26:02.773451	2025-09-08 12:43:42.341614
821	6	\N	23	Matrix Rate - 2025-09-21	2025-09-21	2025-09-21	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-08 12:26:03.564347	2025-09-08 12:43:43.2887
814	6	\N	23	Matrix Rate - 2025-09-22	2025-09-22	2025-09-22	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-08 12:20:24.885821	2025-09-08 12:43:43.421214
822	6	\N	24	Matrix Rate - 2025-09-14	2025-09-14	2025-09-14	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-08 12:26:04.361879	2025-09-08 12:43:44.353754
823	6	\N	24	Matrix Rate - 2025-09-21	2025-09-21	2025-09-21	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-08 12:26:05.146744	2025-09-08 12:43:45.280744
815	6	\N	24	Matrix Rate - 2025-09-22	2025-09-22	2025-09-22	1300.00	1300.00	1300.00	1300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-08 12:20:26.613137	2025-09-08 12:43:45.41286
831	8	\N	22	Matrix Rate - 2025-09-14	2025-09-14	2025-09-14	2300.00	2300.00	2300.00	2300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-12 07:06:27.787807	2025-09-12 07:06:27.787807
832	8	\N	22	Matrix Rate - 2025-09-21	2025-09-21	2025-09-21	2300.00	2300.00	2300.00	2300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-12 07:06:28.718356	2025-09-12 07:06:28.718356
829	8	\N	21	Matrix Rate - 2025-09-25	2025-09-25	2025-09-25	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-12 07:06:27.254713	2025-09-24 05:14:04.73536
830	8	\N	21	Matrix Rate - 2025-09-26	2025-09-26	2025-09-26	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-12 07:06:27.391017	2025-09-24 05:14:04.866742
833	8	\N	22	Matrix Rate - 2025-09-22	2025-09-22	2025-09-22	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-12 07:06:28.850831	2025-09-13 05:22:22.384584
834	8	\N	22	Matrix Rate - 2025-09-23	2025-09-23	2025-09-23	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-12 07:06:28.983618	2025-09-13 05:22:22.516218
824	8	\N	21	Matrix Rate - 2025-09-14	2025-09-14	2025-09-14	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-12 07:06:25.756742	2025-09-13 05:22:57.569615
827	8	\N	21	Matrix Rate - 2025-09-23	2025-09-23	2025-09-23	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-12 07:06:26.990185	2025-09-13 05:22:21.177177
828	8	\N	21	Matrix Rate - 2025-09-24	2025-09-24	2025-09-24	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-12 07:06:27.122117	2025-09-24 05:14:04.590965
838	8	\N	23	Matrix Rate - 2025-09-14	2025-09-14	2025-09-14	2300.00	2300.00	2300.00	2300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-12 07:06:29.818056	2025-09-12 07:06:29.818056
187	8	\N	23	Bulk Rate - Sep 16, 2025	2025-09-16	2025-09-16	2300.00	2300.00	2300.00	2300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	Applied via bulk rate operation	2025-09-06 14:24:32.271134	2025-09-12 07:06:30.081722
839	8	\N	23	Matrix Rate - 2025-09-21	2025-09-21	2025-09-21	2300.00	2300.00	2300.00	2300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-12 07:06:30.740311	2025-09-12 07:06:30.740311
845	8	\N	24	Matrix Rate - 2025-09-14	2025-09-14	2025-09-14	2300.00	2300.00	2300.00	2300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-12 07:06:31.800712	2025-09-12 07:06:31.800712
846	8	\N	24	Matrix Rate - 2025-09-21	2025-09-21	2025-09-21	2300.00	2300.00	2300.00	2300.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-12 07:06:32.725259	2025-09-12 07:06:32.725259
857	8	\N	21	Matrix Rate - 2025-10-03	2025-10-03	2025-10-03	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:05.668882	2025-09-24 05:14:05.668882
858	8	\N	21	Matrix Rate - 2025-10-04	2025-10-04	2025-10-04	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:05.798063	2025-09-24 05:14:05.798063
859	8	\N	21	Matrix Rate - 2025-10-06	2025-10-06	2025-10-06	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:05.928042	2025-09-24 05:14:05.928042
840	8	\N	23	Matrix Rate - 2025-09-22	2025-09-22	2025-09-22	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-12 07:06:30.871323	2025-09-12 11:00:14.52014
841	8	\N	23	Matrix Rate - 2025-09-23	2025-09-23	2025-09-23	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-12 07:06:31.00725	2025-09-12 11:00:14.651706
844	8	\N	23	Matrix Rate - 2025-09-26	2025-09-26	2025-09-26	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-12 07:06:31.40323	2025-09-24 05:14:08.263188
872	8	\N	23	Matrix Rate - 2025-09-27	2025-09-27	2025-09-27	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:08.392899	2025-09-24 05:14:08.392899
873	8	\N	23	Matrix Rate - 2025-09-29	2025-09-29	2025-09-29	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:08.521723	2025-09-24 05:14:08.521723
847	8	\N	24	Matrix Rate - 2025-09-22	2025-09-22	2025-09-22	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-12 07:06:32.858131	2025-09-12 11:00:15.978977
848	8	\N	24	Matrix Rate - 2025-09-23	2025-09-23	2025-09-23	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-12 07:06:32.992093	2025-09-12 11:00:16.110885
850	8	\N	24	Matrix Rate - 2025-09-25	2025-09-25	2025-09-25	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-12 07:06:33.25661	2025-09-24 05:14:09.824958
851	8	\N	24	Matrix Rate - 2025-09-26	2025-09-26	2025-09-26	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-12 07:06:33.388349	2025-09-24 05:14:09.953763
826	8	\N	21	Matrix Rate - 2025-09-22	2025-09-22	2025-09-22	1500.00	1500.00	1500.00	1500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-12 07:06:26.85714	2025-09-13 05:22:21.043934
871	8	\N	22	Matrix Rate - 2025-10-08	2025-10-08	2025-10-08	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:07.873298	2025-09-24 05:14:07.873298
842	8	\N	23	Matrix Rate - 2025-09-24	2025-09-24	2025-09-24	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-12 07:06:31.139696	2025-09-24 05:14:08.003116
843	8	\N	23	Matrix Rate - 2025-09-25	2025-09-25	2025-09-25	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-12 07:06:31.271073	2025-09-24 05:14:08.133688
852	8	\N	21	Matrix Rate - 2025-09-27	2025-09-27	2025-09-27	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:04.999058	2025-09-24 05:14:04.999058
853	8	\N	21	Matrix Rate - 2025-09-29	2025-09-29	2025-09-29	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:05.150722	2025-09-24 05:14:05.150722
854	8	\N	21	Matrix Rate - 2025-09-30	2025-09-30	2025-09-30	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:05.279888	2025-09-24 05:14:05.279888
855	8	\N	21	Matrix Rate - 2025-10-01	2025-10-01	2025-10-01	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:05.410429	2025-09-24 05:14:05.410429
856	8	\N	21	Matrix Rate - 2025-10-02	2025-10-02	2025-10-02	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:05.54006	2025-09-24 05:14:05.54006
860	8	\N	21	Matrix Rate - 2025-10-07	2025-10-07	2025-10-07	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:06.057662	2025-09-24 05:14:06.057662
861	8	\N	21	Matrix Rate - 2025-10-08	2025-10-08	2025-10-08	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:06.187927	2025-09-24 05:14:06.187927
835	8	\N	22	Matrix Rate - 2025-09-24	2025-09-24	2025-09-24	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-12 07:06:29.117249	2025-09-24 05:14:06.316297
836	8	\N	22	Matrix Rate - 2025-09-25	2025-09-25	2025-09-25	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-12 07:06:29.285594	2025-09-24 05:14:06.445298
837	8	\N	22	Matrix Rate - 2025-09-26	2025-09-26	2025-09-26	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-12 07:06:29.418923	2025-09-24 05:14:06.577133
862	8	\N	22	Matrix Rate - 2025-09-27	2025-09-27	2025-09-27	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:06.70849	2025-09-24 05:14:06.70849
863	8	\N	22	Matrix Rate - 2025-09-29	2025-09-29	2025-09-29	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:06.837823	2025-09-24 05:14:06.837823
864	8	\N	22	Matrix Rate - 2025-09-30	2025-09-30	2025-09-30	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:06.967427	2025-09-24 05:14:06.967427
865	8	\N	22	Matrix Rate - 2025-10-01	2025-10-01	2025-10-01	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:07.097351	2025-09-24 05:14:07.097351
866	8	\N	22	Matrix Rate - 2025-10-02	2025-10-02	2025-10-02	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:07.226417	2025-09-24 05:14:07.226417
867	8	\N	22	Matrix Rate - 2025-10-03	2025-10-03	2025-10-03	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:07.354983	2025-09-24 05:14:07.354983
868	8	\N	22	Matrix Rate - 2025-10-04	2025-10-04	2025-10-04	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:07.484093	2025-09-24 05:14:07.484093
869	8	\N	22	Matrix Rate - 2025-10-06	2025-10-06	2025-10-06	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:07.614555	2025-09-24 05:14:07.614555
870	8	\N	22	Matrix Rate - 2025-10-07	2025-10-07	2025-10-07	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:07.744151	2025-09-24 05:14:07.744151
874	8	\N	23	Matrix Rate - 2025-09-30	2025-09-30	2025-09-30	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:08.65073	2025-09-24 05:14:08.65073
875	8	\N	23	Matrix Rate - 2025-10-01	2025-10-01	2025-10-01	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:08.779967	2025-09-24 05:14:08.779967
876	8	\N	23	Matrix Rate - 2025-10-02	2025-10-02	2025-10-02	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:08.910346	2025-09-24 05:14:08.910346
877	8	\N	23	Matrix Rate - 2025-10-03	2025-10-03	2025-10-03	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:09.042481	2025-09-24 05:14:09.042481
878	8	\N	23	Matrix Rate - 2025-10-04	2025-10-04	2025-10-04	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:09.173218	2025-09-24 05:14:09.173218
879	8	\N	23	Matrix Rate - 2025-10-06	2025-10-06	2025-10-06	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:09.302597	2025-09-24 05:14:09.302597
880	8	\N	23	Matrix Rate - 2025-10-07	2025-10-07	2025-10-07	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:09.431698	2025-09-24 05:14:09.431698
881	8	\N	23	Matrix Rate - 2025-10-08	2025-10-08	2025-10-08	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:09.561244	2025-09-24 05:14:09.561244
849	8	\N	24	Matrix Rate - 2025-09-24	2025-09-24	2025-09-24	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-12 07:06:33.124751	2025-09-24 05:14:09.693233
882	8	\N	24	Matrix Rate - 2025-09-27	2025-09-27	2025-09-27	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:10.082857	2025-09-24 05:14:10.082857
883	8	\N	24	Matrix Rate - 2025-09-29	2025-09-29	2025-09-29	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:10.211692	2025-09-24 05:14:10.211692
884	8	\N	24	Matrix Rate - 2025-09-30	2025-09-30	2025-09-30	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:10.340734	2025-09-24 05:14:10.340734
885	8	\N	24	Matrix Rate - 2025-10-01	2025-10-01	2025-10-01	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:10.469691	2025-09-24 05:14:10.469691
886	8	\N	24	Matrix Rate - 2025-10-02	2025-10-02	2025-10-02	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:10.598539	2025-09-24 05:14:10.598539
887	8	\N	24	Matrix Rate - 2025-10-03	2025-10-03	2025-10-03	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:10.726716	2025-09-24 05:14:10.726716
888	8	\N	24	Matrix Rate - 2025-10-04	2025-10-04	2025-10-04	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:10.856143	2025-09-24 05:14:10.856143
889	8	\N	24	Matrix Rate - 2025-10-06	2025-10-06	2025-10-06	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:10.985745	2025-09-24 05:14:10.985745
890	8	\N	24	Matrix Rate - 2025-10-07	2025-10-07	2025-10-07	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:11.113925	2025-09-24 05:14:11.113925
891	8	\N	24	Matrix Rate - 2025-10-08	2025-10-08	2025-10-08	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 05:14:11.243599	2025-09-24 05:14:11.243599
892	6	\N	21	Matrix Rate - 2025-09-24	2025-09-24	2025-09-24	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:43.755763	2025-09-24 08:24:43.755763
893	6	\N	21	Matrix Rate - 2025-09-25	2025-09-25	2025-09-25	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:43.897405	2025-09-24 08:24:43.897405
894	6	\N	21	Matrix Rate - 2025-09-26	2025-09-26	2025-09-26	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:44.026823	2025-09-24 08:24:44.026823
895	6	\N	21	Matrix Rate - 2025-09-27	2025-09-27	2025-09-27	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:44.155097	2025-09-24 08:24:44.155097
896	6	\N	21	Matrix Rate - 2025-09-28	2025-09-28	2025-09-28	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:44.2841	2025-09-24 08:24:44.2841
897	6	\N	21	Matrix Rate - 2025-09-29	2025-09-29	2025-09-29	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:44.413546	2025-09-24 08:24:44.413546
916	6	\N	21	Matrix Rate - 2025-10-18	2025-10-18	2025-10-18	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:46.894643	2025-09-24 08:24:46.894643
917	6	\N	21	Matrix Rate - 2025-10-19	2025-10-19	2025-10-19	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:47.024294	2025-09-24 08:24:47.024294
918	6	\N	21	Matrix Rate - 2025-10-20	2025-10-20	2025-10-20	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:47.156718	2025-09-24 08:24:47.156718
919	6	\N	21	Matrix Rate - 2025-10-21	2025-10-21	2025-10-21	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:47.287612	2025-09-24 08:24:47.287612
920	6	\N	21	Matrix Rate - 2025-10-22	2025-10-22	2025-10-22	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:47.417333	2025-09-24 08:24:47.417333
899	6	\N	21	Matrix Rate - 2025-10-01	2025-10-01	2025-10-01	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:44.680176	2025-09-30 06:17:44.926152
900	6	\N	21	Matrix Rate - 2025-10-02	2025-10-02	2025-10-02	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:44.810121	2025-09-30 06:17:45.057291
901	6	\N	21	Matrix Rate - 2025-10-03	2025-10-03	2025-10-03	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:44.947314	2025-09-30 06:17:45.188839
902	6	\N	21	Matrix Rate - 2025-10-04	2025-10-04	2025-10-04	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:45.078245	2025-09-30 06:17:45.319371
903	6	\N	21	Matrix Rate - 2025-10-05	2025-10-05	2025-10-05	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:45.207213	2025-09-30 06:17:45.453409
905	6	\N	21	Matrix Rate - 2025-10-07	2025-10-07	2025-10-07	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:45.466663	2025-10-05 07:31:53.406114
906	6	\N	21	Matrix Rate - 2025-10-08	2025-10-08	2025-10-08	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:45.595983	2025-10-05 07:31:53.562246
907	6	\N	21	Matrix Rate - 2025-10-09	2025-10-09	2025-10-09	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:45.726878	2025-10-05 07:31:53.69693
908	6	\N	21	Matrix Rate - 2025-10-10	2025-10-10	2025-10-10	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:45.855128	2025-10-05 07:31:53.82861
911	6	\N	21	Matrix Rate - 2025-10-13	2025-10-13	2025-10-13	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:46.246688	2025-10-05 07:31:53.962875
909	6	\N	21	Matrix Rate - 2025-10-11	2025-10-11	2025-10-11	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:45.9852	2025-09-30 06:17:46.2457
910	6	\N	21	Matrix Rate - 2025-10-12	2025-10-12	2025-10-12	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:46.114775	2025-09-30 06:17:46.381392
912	6	\N	21	Matrix Rate - 2025-10-14	2025-10-14	2025-10-14	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:46.375503	2025-10-05 07:31:54.096036
913	6	\N	21	Matrix Rate - 2025-10-15	2025-10-15	2025-10-15	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:46.506097	2025-10-05 07:31:54.228613
904	6	\N	21	Matrix Rate - 2025-10-06	2025-10-06	2025-10-06	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:45.33682	2025-10-05 07:31:53.27185
914	6	\N	21	Matrix Rate - 2025-10-16	2025-10-16	2025-10-16	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:46.636227	2025-10-05 07:31:54.360848
915	6	\N	21	Matrix Rate - 2025-10-17	2025-10-17	2025-10-17	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:46.766391	2025-10-05 07:31:54.492645
921	6	\N	21	Matrix Rate - 2025-10-23	2025-10-23	2025-10-23	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:47.54666	2025-09-24 08:24:47.54666
922	6	\N	21	Matrix Rate - 2025-10-24	2025-10-24	2025-10-24	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:47.679682	2025-09-24 08:24:47.679682
923	6	\N	22	Matrix Rate - 2025-09-24	2025-09-24	2025-09-24	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:47.809977	2025-09-24 08:24:47.809977
924	6	\N	22	Matrix Rate - 2025-09-25	2025-09-25	2025-09-25	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:47.938942	2025-09-24 08:24:47.938942
925	6	\N	22	Matrix Rate - 2025-09-26	2025-09-26	2025-09-26	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:48.068843	2025-09-24 08:24:48.068843
926	6	\N	22	Matrix Rate - 2025-09-27	2025-09-27	2025-09-27	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:48.199179	2025-09-24 08:24:48.199179
927	6	\N	22	Matrix Rate - 2025-09-28	2025-09-28	2025-09-28	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:48.332717	2025-09-24 08:24:48.332717
928	6	\N	22	Matrix Rate - 2025-09-29	2025-09-29	2025-09-29	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:48.462055	2025-09-24 08:24:48.462055
947	6	\N	22	Matrix Rate - 2025-10-18	2025-10-18	2025-10-18	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:50.936571	2025-09-24 08:24:50.936571
948	6	\N	22	Matrix Rate - 2025-10-19	2025-10-19	2025-10-19	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:51.065617	2025-09-24 08:24:51.065617
949	6	\N	22	Matrix Rate - 2025-10-20	2025-10-20	2025-10-20	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:51.194669	2025-09-24 08:24:51.194669
950	6	\N	22	Matrix Rate - 2025-10-21	2025-10-21	2025-10-21	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:51.323803	2025-09-24 08:24:51.323803
951	6	\N	22	Matrix Rate - 2025-10-22	2025-10-22	2025-10-22	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:51.454552	2025-09-24 08:24:51.454552
952	6	\N	22	Matrix Rate - 2025-10-23	2025-10-23	2025-10-23	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:51.586763	2025-09-24 08:24:51.586763
953	6	\N	22	Matrix Rate - 2025-10-24	2025-10-24	2025-10-24	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:51.71545	2025-09-24 08:24:51.71545
954	6	\N	23	Matrix Rate - 2025-09-24	2025-09-24	2025-09-24	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:51.844323	2025-09-24 08:24:51.844323
955	6	\N	23	Matrix Rate - 2025-09-25	2025-09-25	2025-09-25	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:51.988277	2025-09-24 08:24:51.988277
956	6	\N	23	Matrix Rate - 2025-09-26	2025-09-26	2025-09-26	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:52.116125	2025-09-24 08:24:52.116125
957	6	\N	23	Matrix Rate - 2025-09-27	2025-09-27	2025-09-27	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:52.246686	2025-09-24 08:24:52.246686
958	6	\N	23	Matrix Rate - 2025-09-28	2025-09-28	2025-09-28	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:52.37655	2025-09-24 08:24:52.37655
959	6	\N	23	Matrix Rate - 2025-09-29	2025-09-29	2025-09-29	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:52.507608	2025-09-24 08:24:52.507608
961	6	\N	23	Matrix Rate - 2025-10-01	2025-10-01	2025-10-01	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:52.767397	2025-09-30 06:17:40.946187
962	6	\N	23	Matrix Rate - 2025-10-02	2025-10-02	2025-10-02	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:52.897112	2025-09-30 06:17:41.079204
963	6	\N	23	Matrix Rate - 2025-10-03	2025-10-03	2025-10-03	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:53.029064	2025-09-30 06:17:41.211638
964	6	\N	23	Matrix Rate - 2025-10-04	2025-10-04	2025-10-04	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:53.158898	2025-09-30 06:17:41.343287
935	6	\N	22	Matrix Rate - 2025-10-06	2025-10-06	2025-10-06	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:49.378822	2025-10-05 07:31:54.636534
929	6	\N	22	Matrix Rate - 2025-09-30	2025-09-30	2025-09-30	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:48.598263	2025-09-30 06:17:46.779324
930	6	\N	22	Matrix Rate - 2025-10-01	2025-10-01	2025-10-01	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:48.727346	2025-09-30 06:17:46.910346
931	6	\N	22	Matrix Rate - 2025-10-02	2025-10-02	2025-10-02	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:48.859645	2025-09-30 06:17:47.041617
932	6	\N	22	Matrix Rate - 2025-10-03	2025-10-03	2025-10-03	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:48.988827	2025-09-30 06:17:47.173264
933	6	\N	22	Matrix Rate - 2025-10-04	2025-10-04	2025-10-04	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:49.117873	2025-09-30 06:17:47.306388
934	6	\N	22	Matrix Rate - 2025-10-05	2025-10-05	2025-10-05	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:49.247271	2025-09-30 06:17:47.440043
936	6	\N	22	Matrix Rate - 2025-10-07	2025-10-07	2025-10-07	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:49.508358	2025-10-05 07:31:54.768359
937	6	\N	22	Matrix Rate - 2025-10-08	2025-10-08	2025-10-08	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:49.638229	2025-10-05 07:31:54.900681
938	6	\N	22	Matrix Rate - 2025-10-09	2025-10-09	2025-10-09	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:49.7676	2025-10-05 07:31:55.03264
939	6	\N	22	Matrix Rate - 2025-10-10	2025-10-10	2025-10-10	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:49.896404	2025-10-05 07:31:55.163963
942	6	\N	22	Matrix Rate - 2025-10-13	2025-10-13	2025-10-13	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:50.288559	2025-10-05 07:31:55.324876
940	6	\N	22	Matrix Rate - 2025-10-11	2025-10-11	2025-10-11	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:50.025923	2025-09-30 06:17:48.228921
943	6	\N	22	Matrix Rate - 2025-10-14	2025-10-14	2025-10-14	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:50.418296	2025-10-05 07:31:55.456987
944	6	\N	22	Matrix Rate - 2025-10-15	2025-10-15	2025-10-15	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:50.547652	2025-10-05 07:31:55.588887
965	6	\N	23	Matrix Rate - 2025-10-05	2025-10-05	2025-10-05	4000.00	4000.00	4000.00	4000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:53.288123	2025-10-05 07:31:09.231326
945	6	\N	22	Matrix Rate - 2025-10-16	2025-10-16	2025-10-16	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:50.676989	2025-10-05 07:31:55.728382
946	6	\N	22	Matrix Rate - 2025-10-17	2025-10-17	2025-10-17	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:50.807239	2025-10-05 07:31:55.86282
978	6	\N	23	Matrix Rate - 2025-10-18	2025-10-18	2025-10-18	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:54.978358	2025-09-24 08:24:54.978358
979	6	\N	23	Matrix Rate - 2025-10-19	2025-10-19	2025-10-19	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:55.109852	2025-09-24 08:24:55.109852
980	6	\N	23	Matrix Rate - 2025-10-20	2025-10-20	2025-10-20	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:55.238551	2025-09-24 08:24:55.238551
981	6	\N	23	Matrix Rate - 2025-10-21	2025-10-21	2025-10-21	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:55.367961	2025-09-24 08:24:55.367961
982	6	\N	23	Matrix Rate - 2025-10-22	2025-10-22	2025-10-22	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:55.497758	2025-09-24 08:24:55.497758
983	6	\N	23	Matrix Rate - 2025-10-23	2025-10-23	2025-10-23	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:55.625872	2025-09-24 08:24:55.625872
984	6	\N	23	Matrix Rate - 2025-10-24	2025-10-24	2025-10-24	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:55.758572	2025-09-24 08:24:55.758572
985	6	\N	24	Matrix Rate - 2025-09-24	2025-09-24	2025-09-24	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:55.891725	2025-09-24 08:24:55.891725
986	6	\N	24	Matrix Rate - 2025-09-25	2025-09-25	2025-09-25	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:56.020716	2025-09-24 08:24:56.020716
987	6	\N	24	Matrix Rate - 2025-09-26	2025-09-26	2025-09-26	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:56.152132	2025-09-24 08:24:56.152132
988	6	\N	24	Matrix Rate - 2025-09-27	2025-09-27	2025-09-27	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:56.281889	2025-09-24 08:24:56.281889
989	6	\N	24	Matrix Rate - 2025-09-28	2025-09-28	2025-09-28	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:56.411143	2025-09-24 08:24:56.411143
990	6	\N	24	Matrix Rate - 2025-09-29	2025-09-29	2025-09-29	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:56.543454	2025-09-24 08:24:56.543454
1009	6	\N	24	Matrix Rate - 2025-10-18	2025-10-18	2025-10-18	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:59.014319	2025-09-24 08:24:59.014319
1010	6	\N	24	Matrix Rate - 2025-10-19	2025-10-19	2025-10-19	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:59.144164	2025-09-24 08:24:59.144164
968	6	\N	23	Matrix Rate - 2025-10-08	2025-10-08	2025-10-08	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:53.677218	2025-10-05 07:31:50.877241
969	6	\N	23	Matrix Rate - 2025-10-09	2025-10-09	2025-10-09	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:53.80881	2025-10-05 07:31:51.009801
970	6	\N	23	Matrix Rate - 2025-10-10	2025-10-10	2025-10-10	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:53.938848	2025-10-05 07:31:51.14148
973	6	\N	23	Matrix Rate - 2025-10-13	2025-10-13	2025-10-13	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:54.329866	2025-10-05 07:31:51.273196
971	6	\N	23	Matrix Rate - 2025-10-11	2025-10-11	2025-10-11	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:54.068757	2025-09-30 06:17:42.275452
972	6	\N	23	Matrix Rate - 2025-10-12	2025-10-12	2025-10-12	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:54.200099	2025-09-30 06:17:42.408429
974	6	\N	23	Matrix Rate - 2025-10-14	2025-10-14	2025-10-14	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:54.459172	2025-10-05 07:31:51.405154
975	6	\N	23	Matrix Rate - 2025-10-15	2025-10-15	2025-10-15	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:54.587768	2025-10-05 07:31:51.537033
991	6	\N	24	Matrix Rate - 2025-09-30	2025-09-30	2025-09-30	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:56.675793	2025-09-30 06:17:42.802691
992	6	\N	24	Matrix Rate - 2025-10-01	2025-10-01	2025-10-01	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:56.805961	2025-09-30 06:17:42.944519
993	6	\N	24	Matrix Rate - 2025-10-02	2025-10-02	2025-10-02	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:56.933973	2025-09-30 06:17:43.077837
994	6	\N	24	Matrix Rate - 2025-10-03	2025-10-03	2025-10-03	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:57.062823	2025-09-30 06:17:43.211014
995	6	\N	24	Matrix Rate - 2025-10-04	2025-10-04	2025-10-04	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:57.19178	2025-09-30 06:17:43.343088
996	6	\N	24	Matrix Rate - 2025-10-05	2025-10-05	2025-10-05	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:57.321052	2025-09-30 06:17:43.479427
998	6	\N	24	Matrix Rate - 2025-10-07	2025-10-07	2025-10-07	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:57.580353	2025-10-05 07:31:52.080625
999	6	\N	24	Matrix Rate - 2025-10-08	2025-10-08	2025-10-08	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:57.713646	2025-10-05 07:31:52.213685
1001	6	\N	24	Matrix Rate - 2025-10-10	2025-10-10	2025-10-10	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:57.973339	2025-10-05 07:31:52.47898
1004	6	\N	24	Matrix Rate - 2025-10-13	2025-10-13	2025-10-13	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:58.368862	2025-10-05 07:31:52.611981
1002	6	\N	24	Matrix Rate - 2025-10-11	2025-10-11	2025-10-11	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:58.104642	2025-09-30 06:17:44.268299
1003	6	\N	24	Matrix Rate - 2025-10-12	2025-10-12	2025-10-12	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:58.234184	2025-09-30 06:17:44.400852
1005	6	\N	24	Matrix Rate - 2025-10-14	2025-10-14	2025-10-14	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:58.496709	2025-10-05 07:31:52.745036
1006	6	\N	24	Matrix Rate - 2025-10-15	2025-10-15	2025-10-15	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:58.626047	2025-10-05 07:31:52.877006
967	6	\N	23	Matrix Rate - 2025-10-07	2025-10-07	2025-10-07	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:53.547187	2025-10-05 07:31:50.744638
976	6	\N	23	Matrix Rate - 2025-10-16	2025-10-16	2025-10-16	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:54.718089	2025-10-05 07:31:51.670413
977	6	\N	23	Matrix Rate - 2025-10-17	2025-10-17	2025-10-17	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:54.84909	2025-10-05 07:31:51.807957
997	6	\N	24	Matrix Rate - 2025-10-06	2025-10-06	2025-10-06	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:57.450577	2025-10-05 07:31:51.948326
1007	6	\N	24	Matrix Rate - 2025-10-16	2025-10-16	2025-10-16	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:58.754088	2025-10-05 07:31:53.009707
1008	6	\N	24	Matrix Rate - 2025-10-17	2025-10-17	2025-10-17	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:58.884482	2025-10-05 07:31:53.140325
1011	6	\N	24	Matrix Rate - 2025-10-20	2025-10-20	2025-10-20	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:59.287738	2025-09-24 08:24:59.287738
1012	6	\N	24	Matrix Rate - 2025-10-21	2025-10-21	2025-10-21	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:59.419759	2025-09-24 08:24:59.419759
1013	6	\N	24	Matrix Rate - 2025-10-22	2025-10-22	2025-10-22	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:59.54958	2025-09-24 08:24:59.54958
1014	6	\N	24	Matrix Rate - 2025-10-23	2025-10-23	2025-10-23	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:59.678996	2025-09-24 08:24:59.678996
1015	6	\N	24	Matrix Rate - 2025-10-24	2025-10-24	2025-10-24	2500.00	2500.00	2500.00	2500.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:59.809177	2025-09-24 08:24:59.809177
1016	7	\N	21	Matrix Rate - 2025-09-24	2025-09-24	2025-09-24	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:43.751168	2025-09-24 08:25:43.751168
1017	7	\N	21	Matrix Rate - 2025-09-25	2025-09-25	2025-09-25	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:43.882115	2025-09-24 08:25:43.882115
1018	7	\N	21	Matrix Rate - 2025-09-26	2025-09-26	2025-09-26	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:44.010772	2025-09-24 08:25:44.010772
1019	7	\N	21	Matrix Rate - 2025-09-27	2025-09-27	2025-09-27	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:44.140789	2025-09-24 08:25:44.140789
1020	7	\N	21	Matrix Rate - 2025-09-28	2025-09-28	2025-09-28	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:44.270746	2025-09-24 08:25:44.270746
1021	7	\N	21	Matrix Rate - 2025-09-29	2025-09-29	2025-09-29	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:44.401367	2025-09-24 08:25:44.401367
1022	7	\N	21	Matrix Rate - 2025-09-30	2025-09-30	2025-09-30	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:44.533613	2025-09-24 08:25:44.533613
1023	7	\N	21	Matrix Rate - 2025-10-01	2025-10-01	2025-10-01	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:44.66425	2025-09-24 08:25:44.66425
1024	7	\N	21	Matrix Rate - 2025-10-02	2025-10-02	2025-10-02	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:44.794752	2025-09-24 08:25:44.794752
1025	7	\N	21	Matrix Rate - 2025-10-03	2025-10-03	2025-10-03	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:44.925251	2025-09-24 08:25:44.925251
1026	7	\N	21	Matrix Rate - 2025-10-04	2025-10-04	2025-10-04	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:45.054905	2025-09-24 08:25:45.054905
1027	7	\N	21	Matrix Rate - 2025-10-05	2025-10-05	2025-10-05	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:45.18467	2025-09-24 08:25:45.18467
1028	7	\N	21	Matrix Rate - 2025-10-06	2025-10-06	2025-10-06	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:45.315349	2025-09-24 08:25:45.315349
1029	7	\N	21	Matrix Rate - 2025-10-07	2025-10-07	2025-10-07	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:45.446278	2025-09-24 08:25:45.446278
1030	7	\N	21	Matrix Rate - 2025-10-08	2025-10-08	2025-10-08	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:45.578479	2025-09-24 08:25:45.578479
1031	7	\N	21	Matrix Rate - 2025-10-09	2025-10-09	2025-10-09	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:45.708568	2025-09-24 08:25:45.708568
1032	7	\N	21	Matrix Rate - 2025-10-10	2025-10-10	2025-10-10	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:45.837697	2025-09-24 08:25:45.837697
1033	7	\N	21	Matrix Rate - 2025-10-11	2025-10-11	2025-10-11	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:45.968293	2025-09-24 08:25:45.968293
1034	7	\N	21	Matrix Rate - 2025-10-12	2025-10-12	2025-10-12	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:46.098303	2025-09-24 08:25:46.098303
1035	7	\N	21	Matrix Rate - 2025-10-13	2025-10-13	2025-10-13	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:46.228528	2025-09-24 08:25:46.228528
1036	7	\N	21	Matrix Rate - 2025-10-14	2025-10-14	2025-10-14	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:46.35846	2025-09-24 08:25:46.35846
1037	7	\N	21	Matrix Rate - 2025-10-15	2025-10-15	2025-10-15	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:46.488539	2025-09-24 08:25:46.488539
1038	7	\N	21	Matrix Rate - 2025-10-16	2025-10-16	2025-10-16	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:46.618248	2025-09-24 08:25:46.618248
1039	7	\N	21	Matrix Rate - 2025-10-17	2025-10-17	2025-10-17	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:46.74879	2025-09-24 08:25:46.74879
1040	7	\N	21	Matrix Rate - 2025-10-18	2025-10-18	2025-10-18	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:46.878775	2025-09-24 08:25:46.878775
1041	7	\N	21	Matrix Rate - 2025-10-19	2025-10-19	2025-10-19	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:47.008963	2025-09-24 08:25:47.008963
1042	7	\N	21	Matrix Rate - 2025-10-20	2025-10-20	2025-10-20	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:47.138757	2025-09-24 08:25:47.138757
1043	7	\N	21	Matrix Rate - 2025-10-21	2025-10-21	2025-10-21	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:47.268003	2025-09-24 08:25:47.268003
1044	7	\N	21	Matrix Rate - 2025-10-22	2025-10-22	2025-10-22	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:47.399714	2025-09-24 08:25:47.399714
1045	7	\N	21	Matrix Rate - 2025-10-23	2025-10-23	2025-10-23	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:47.529164	2025-09-24 08:25:47.529164
1046	7	\N	21	Matrix Rate - 2025-10-24	2025-10-24	2025-10-24	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:47.659812	2025-09-24 08:25:47.659812
1047	7	\N	22	Matrix Rate - 2025-09-24	2025-09-24	2025-09-24	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:47.790565	2025-09-24 08:25:47.790565
1048	7	\N	22	Matrix Rate - 2025-09-25	2025-09-25	2025-09-25	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:47.919681	2025-09-24 08:25:47.919681
1049	7	\N	22	Matrix Rate - 2025-09-26	2025-09-26	2025-09-26	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:48.051546	2025-09-24 08:25:48.051546
1050	7	\N	22	Matrix Rate - 2025-09-27	2025-09-27	2025-09-27	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:48.181559	2025-09-24 08:25:48.181559
1051	7	\N	22	Matrix Rate - 2025-09-28	2025-09-28	2025-09-28	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:48.313084	2025-09-24 08:25:48.313084
1052	7	\N	22	Matrix Rate - 2025-09-29	2025-09-29	2025-09-29	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:48.450325	2025-09-24 08:25:48.450325
1053	7	\N	22	Matrix Rate - 2025-09-30	2025-09-30	2025-09-30	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:48.580031	2025-09-24 08:25:48.580031
1054	7	\N	22	Matrix Rate - 2025-10-01	2025-10-01	2025-10-01	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:48.71073	2025-09-24 08:25:48.71073
1055	7	\N	22	Matrix Rate - 2025-10-02	2025-10-02	2025-10-02	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:48.84253	2025-09-24 08:25:48.84253
1056	7	\N	22	Matrix Rate - 2025-10-03	2025-10-03	2025-10-03	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:48.972935	2025-09-24 08:25:48.972935
1057	7	\N	22	Matrix Rate - 2025-10-04	2025-10-04	2025-10-04	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:49.103149	2025-09-24 08:25:49.103149
1058	7	\N	22	Matrix Rate - 2025-10-05	2025-10-05	2025-10-05	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:49.233045	2025-09-24 08:25:49.233045
1059	7	\N	22	Matrix Rate - 2025-10-06	2025-10-06	2025-10-06	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:49.364309	2025-09-24 08:25:49.364309
1060	7	\N	22	Matrix Rate - 2025-10-07	2025-10-07	2025-10-07	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:49.494704	2025-09-24 08:25:49.494704
1061	7	\N	22	Matrix Rate - 2025-10-08	2025-10-08	2025-10-08	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:49.623199	2025-09-24 08:25:49.623199
1062	7	\N	22	Matrix Rate - 2025-10-09	2025-10-09	2025-10-09	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:49.757674	2025-09-24 08:25:49.757674
1063	7	\N	22	Matrix Rate - 2025-10-10	2025-10-10	2025-10-10	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:49.892721	2025-09-24 08:25:49.892721
1064	7	\N	22	Matrix Rate - 2025-10-11	2025-10-11	2025-10-11	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:50.023887	2025-09-24 08:25:50.023887
1065	7	\N	22	Matrix Rate - 2025-10-12	2025-10-12	2025-10-12	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:50.15251	2025-09-24 08:25:50.15251
1066	7	\N	22	Matrix Rate - 2025-10-13	2025-10-13	2025-10-13	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:50.284387	2025-09-24 08:25:50.284387
1067	7	\N	22	Matrix Rate - 2025-10-14	2025-10-14	2025-10-14	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:50.415128	2025-09-24 08:25:50.415128
1068	7	\N	22	Matrix Rate - 2025-10-15	2025-10-15	2025-10-15	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:50.545219	2025-09-24 08:25:50.545219
1069	7	\N	22	Matrix Rate - 2025-10-16	2025-10-16	2025-10-16	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:50.675007	2025-09-24 08:25:50.675007
1070	7	\N	22	Matrix Rate - 2025-10-17	2025-10-17	2025-10-17	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:50.805075	2025-09-24 08:25:50.805075
1071	7	\N	22	Matrix Rate - 2025-10-18	2025-10-18	2025-10-18	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:50.935162	2025-09-24 08:25:50.935162
1072	7	\N	22	Matrix Rate - 2025-10-19	2025-10-19	2025-10-19	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:51.065653	2025-09-24 08:25:51.065653
1073	7	\N	22	Matrix Rate - 2025-10-20	2025-10-20	2025-10-20	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:51.194768	2025-09-24 08:25:51.194768
1074	7	\N	22	Matrix Rate - 2025-10-21	2025-10-21	2025-10-21	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:51.326506	2025-09-24 08:25:51.326506
1075	7	\N	22	Matrix Rate - 2025-10-22	2025-10-22	2025-10-22	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:51.456401	2025-09-24 08:25:51.456401
1076	7	\N	22	Matrix Rate - 2025-10-23	2025-10-23	2025-10-23	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:51.586379	2025-09-24 08:25:51.586379
1077	7	\N	22	Matrix Rate - 2025-10-24	2025-10-24	2025-10-24	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:51.719298	2025-09-24 08:25:51.719298
1078	7	\N	23	Matrix Rate - 2025-09-24	2025-09-24	2025-09-24	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:51.848658	2025-09-24 08:25:51.848658
1079	7	\N	23	Matrix Rate - 2025-09-25	2025-09-25	2025-09-25	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:51.982278	2025-09-24 08:25:51.982278
1080	7	\N	23	Matrix Rate - 2025-09-26	2025-09-26	2025-09-26	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:52.113001	2025-09-24 08:25:52.113001
1081	7	\N	23	Matrix Rate - 2025-09-27	2025-09-27	2025-09-27	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:52.243276	2025-09-24 08:25:52.243276
1082	7	\N	23	Matrix Rate - 2025-09-28	2025-09-28	2025-09-28	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:52.374476	2025-09-24 08:25:52.374476
1083	7	\N	23	Matrix Rate - 2025-09-29	2025-09-29	2025-09-29	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:52.502775	2025-09-24 08:25:52.502775
1084	7	\N	23	Matrix Rate - 2025-09-30	2025-09-30	2025-09-30	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:52.632373	2025-09-24 08:25:52.632373
1085	7	\N	23	Matrix Rate - 2025-10-01	2025-10-01	2025-10-01	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:52.762101	2025-09-24 08:25:52.762101
1086	7	\N	23	Matrix Rate - 2025-10-02	2025-10-02	2025-10-02	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:52.891006	2025-09-24 08:25:52.891006
1087	7	\N	23	Matrix Rate - 2025-10-03	2025-10-03	2025-10-03	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:53.022385	2025-09-24 08:25:53.022385
1088	7	\N	23	Matrix Rate - 2025-10-04	2025-10-04	2025-10-04	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:53.22196	2025-09-24 08:25:53.22196
1089	7	\N	23	Matrix Rate - 2025-10-05	2025-10-05	2025-10-05	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:53.351415	2025-09-24 08:25:53.351415
1090	7	\N	23	Matrix Rate - 2025-10-06	2025-10-06	2025-10-06	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:53.481828	2025-09-24 08:25:53.481828
1091	7	\N	23	Matrix Rate - 2025-10-07	2025-10-07	2025-10-07	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:53.6112	2025-09-24 08:25:53.6112
1092	7	\N	23	Matrix Rate - 2025-10-08	2025-10-08	2025-10-08	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:53.741535	2025-09-24 08:25:53.741535
1093	7	\N	23	Matrix Rate - 2025-10-09	2025-10-09	2025-10-09	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:53.871922	2025-09-24 08:25:53.871922
1094	7	\N	23	Matrix Rate - 2025-10-10	2025-10-10	2025-10-10	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:54.001285	2025-09-24 08:25:54.001285
1095	7	\N	23	Matrix Rate - 2025-10-11	2025-10-11	2025-10-11	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:54.131309	2025-09-24 08:25:54.131309
1096	7	\N	23	Matrix Rate - 2025-10-12	2025-10-12	2025-10-12	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:54.261639	2025-09-24 08:25:54.261639
1097	7	\N	23	Matrix Rate - 2025-10-13	2025-10-13	2025-10-13	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:54.390619	2025-09-24 08:25:54.390619
1098	7	\N	23	Matrix Rate - 2025-10-14	2025-10-14	2025-10-14	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:54.519702	2025-09-24 08:25:54.519702
1099	7	\N	23	Matrix Rate - 2025-10-15	2025-10-15	2025-10-15	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:54.648978	2025-09-24 08:25:54.648978
1100	7	\N	23	Matrix Rate - 2025-10-16	2025-10-16	2025-10-16	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:54.778715	2025-09-24 08:25:54.778715
1101	7	\N	23	Matrix Rate - 2025-10-17	2025-10-17	2025-10-17	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:54.908684	2025-09-24 08:25:54.908684
1102	7	\N	23	Matrix Rate - 2025-10-18	2025-10-18	2025-10-18	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:55.038469	2025-09-24 08:25:55.038469
1103	7	\N	23	Matrix Rate - 2025-10-19	2025-10-19	2025-10-19	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:55.169634	2025-09-24 08:25:55.169634
1104	7	\N	23	Matrix Rate - 2025-10-20	2025-10-20	2025-10-20	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:55.301088	2025-09-24 08:25:55.301088
1105	7	\N	23	Matrix Rate - 2025-10-21	2025-10-21	2025-10-21	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:55.431286	2025-09-24 08:25:55.431286
1106	7	\N	23	Matrix Rate - 2025-10-22	2025-10-22	2025-10-22	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:55.561142	2025-09-24 08:25:55.561142
1107	7	\N	23	Matrix Rate - 2025-10-23	2025-10-23	2025-10-23	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:55.692173	2025-09-24 08:25:55.692173
1108	7	\N	23	Matrix Rate - 2025-10-24	2025-10-24	2025-10-24	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:55.822072	2025-09-24 08:25:55.822072
1109	7	\N	24	Matrix Rate - 2025-09-24	2025-09-24	2025-09-24	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:55.951121	2025-09-24 08:25:55.951121
1110	7	\N	24	Matrix Rate - 2025-09-25	2025-09-25	2025-09-25	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:56.080791	2025-09-24 08:25:56.080791
1111	7	\N	24	Matrix Rate - 2025-09-26	2025-09-26	2025-09-26	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:56.216546	2025-09-24 08:25:56.216546
1112	7	\N	24	Matrix Rate - 2025-09-27	2025-09-27	2025-09-27	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:56.346087	2025-09-24 08:25:56.346087
1113	7	\N	24	Matrix Rate - 2025-09-28	2025-09-28	2025-09-28	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:56.476378	2025-09-24 08:25:56.476378
1114	7	\N	24	Matrix Rate - 2025-09-29	2025-09-29	2025-09-29	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:56.606416	2025-09-24 08:25:56.606416
1130	7	\N	24	Matrix Rate - 2025-10-15	2025-10-15	2025-10-15	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:58.693853	2025-09-24 08:25:58.693853
1131	7	\N	24	Matrix Rate - 2025-10-16	2025-10-16	2025-10-16	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:58.830695	2025-09-24 08:25:58.830695
1132	7	\N	24	Matrix Rate - 2025-10-17	2025-10-17	2025-10-17	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:58.963491	2025-09-24 08:25:58.963491
1133	7	\N	24	Matrix Rate - 2025-10-18	2025-10-18	2025-10-18	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:59.097476	2025-09-24 08:25:59.097476
1134	7	\N	24	Matrix Rate - 2025-10-19	2025-10-19	2025-10-19	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:59.227895	2025-09-24 08:25:59.227895
1135	7	\N	24	Matrix Rate - 2025-10-20	2025-10-20	2025-10-20	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:59.358644	2025-09-24 08:25:59.358644
1136	7	\N	24	Matrix Rate - 2025-10-21	2025-10-21	2025-10-21	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:59.488812	2025-09-24 08:25:59.488812
1137	7	\N	24	Matrix Rate - 2025-10-22	2025-10-22	2025-10-22	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:59.618925	2025-09-24 08:25:59.618925
1138	7	\N	24	Matrix Rate - 2025-10-23	2025-10-23	2025-10-23	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:59.748861	2025-09-24 08:25:59.748861
1139	7	\N	24	Matrix Rate - 2025-10-24	2025-10-24	2025-10-24	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:59.87862	2025-09-24 08:25:59.87862
960	6	\N	23	Matrix Rate - 2025-09-30	2025-09-30	2025-09-30	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:52.637701	2025-09-30 06:17:40.795349
898	6	\N	21	Matrix Rate - 2025-09-30	2025-09-30	2025-09-30	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:44.550387	2025-09-30 06:17:44.794991
941	6	\N	22	Matrix Rate - 2025-10-12	2025-10-12	2025-10-12	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:50.158532	2025-09-30 06:17:48.36123
1140	1	\N	23	Matrix Rate - 2025-09-30	2025-09-30	2025-09-30	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:31:55.838002	2025-09-30 06:31:55.838002
966	6	\N	23	Matrix Rate - 2025-10-06	2025-10-06	2025-10-06	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:53.418148	2025-10-05 07:31:50.607978
1117	7	\N	24	Matrix Rate - 2025-10-02	2025-10-02	2025-10-02	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:57.000518	2025-09-30 06:50:37.46199
1118	7	\N	24	Matrix Rate - 2025-10-03	2025-10-03	2025-10-03	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:57.130092	2025-09-30 06:50:37.591806
1119	7	\N	24	Matrix Rate - 2025-10-04	2025-10-04	2025-10-04	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:57.259724	2025-09-30 06:50:37.721091
1120	7	\N	24	Matrix Rate - 2025-10-05	2025-10-05	2025-10-05	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:57.389668	2025-09-30 06:50:37.852524
1121	7	\N	24	Matrix Rate - 2025-10-06	2025-10-06	2025-10-06	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:57.520955	2025-09-30 06:50:37.98337
1122	7	\N	24	Matrix Rate - 2025-10-07	2025-10-07	2025-10-07	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:57.649778	2025-09-30 06:50:38.11317
1123	7	\N	24	Matrix Rate - 2025-10-08	2025-10-08	2025-10-08	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:57.783223	2025-09-30 06:50:38.242412
1124	7	\N	24	Matrix Rate - 2025-10-09	2025-10-09	2025-10-09	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:57.91313	2025-09-30 06:50:38.371862
1125	7	\N	24	Matrix Rate - 2025-10-10	2025-10-10	2025-10-10	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:58.043112	2025-09-30 06:50:38.500849
1126	7	\N	24	Matrix Rate - 2025-10-11	2025-10-11	2025-10-11	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:58.17329	2025-09-30 06:50:38.633108
1127	7	\N	24	Matrix Rate - 2025-10-12	2025-10-12	2025-10-12	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:58.302608	2025-09-30 06:50:38.762562
1128	7	\N	24	Matrix Rate - 2025-10-13	2025-10-13	2025-10-13	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:58.432305	2025-09-30 06:50:38.891757
1129	7	\N	24	Matrix Rate - 2025-10-14	2025-10-14	2025-10-14	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:58.560781	2025-09-30 06:50:39.02415
1116	7	\N	24	Matrix Rate - 2025-10-01	2025-10-01	2025-10-01	4000.00	4000.00	4000.00	4000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:56.86992	2025-09-30 06:51:10.664277
1000	6	\N	24	Matrix Rate - 2025-10-09	2025-10-09	2025-10-09	1000.00	1000.00	1000.00	1000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:24:57.842914	2025-10-05 07:31:52.346647
1141	1	\N	23	Matrix Rate - 2025-10-01	2025-10-01	2025-10-01	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:31:56.014402	2025-09-30 06:31:56.014402
1142	1	\N	23	Matrix Rate - 2025-10-02	2025-10-02	2025-10-02	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:31:56.147323	2025-09-30 06:31:56.147323
1143	1	\N	23	Matrix Rate - 2025-10-03	2025-10-03	2025-10-03	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:31:56.278126	2025-09-30 06:31:56.278126
1144	1	\N	23	Matrix Rate - 2025-10-04	2025-10-04	2025-10-04	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:31:56.41081	2025-09-30 06:31:56.41081
1145	1	\N	23	Matrix Rate - 2025-10-05	2025-10-05	2025-10-05	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:31:56.54334	2025-09-30 06:31:56.54334
1146	1	\N	23	Matrix Rate - 2025-10-06	2025-10-06	2025-10-06	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:31:56.675445	2025-09-30 06:31:56.675445
1147	1	\N	23	Matrix Rate - 2025-10-07	2025-10-07	2025-10-07	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:31:56.806908	2025-09-30 06:31:56.806908
1148	1	\N	23	Matrix Rate - 2025-10-08	2025-10-08	2025-10-08	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:31:56.940863	2025-09-30 06:31:56.940863
1149	1	\N	23	Matrix Rate - 2025-10-09	2025-10-09	2025-10-09	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:31:57.073141	2025-09-30 06:31:57.073141
1150	1	\N	23	Matrix Rate - 2025-10-10	2025-10-10	2025-10-10	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:31:57.20446	2025-09-30 06:31:57.20446
1151	1	\N	23	Matrix Rate - 2025-10-11	2025-10-11	2025-10-11	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:31:57.336799	2025-09-30 06:31:57.336799
1152	1	\N	23	Matrix Rate - 2025-10-12	2025-10-12	2025-10-12	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:31:57.472818	2025-09-30 06:31:57.472818
1153	1	\N	23	Matrix Rate - 2025-10-13	2025-10-13	2025-10-13	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:31:57.604199	2025-09-30 06:31:57.604199
1154	1	\N	23	Matrix Rate - 2025-10-14	2025-10-14	2025-10-14	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:31:57.735525	2025-09-30 06:31:57.735525
1155	1	\N	24	Matrix Rate - 2025-09-30	2025-09-30	2025-09-30	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:31:57.867279	2025-09-30 06:31:57.867279
1156	1	\N	24	Matrix Rate - 2025-10-01	2025-10-01	2025-10-01	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:31:58.001808	2025-09-30 06:31:58.001808
1157	1	\N	24	Matrix Rate - 2025-10-02	2025-10-02	2025-10-02	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:31:58.13453	2025-09-30 06:31:58.13453
1158	1	\N	24	Matrix Rate - 2025-10-03	2025-10-03	2025-10-03	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:31:58.266847	2025-09-30 06:31:58.266847
1159	1	\N	24	Matrix Rate - 2025-10-04	2025-10-04	2025-10-04	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:31:58.398329	2025-09-30 06:31:58.398329
1160	1	\N	24	Matrix Rate - 2025-10-05	2025-10-05	2025-10-05	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:31:58.529854	2025-09-30 06:31:58.529854
1161	1	\N	24	Matrix Rate - 2025-10-06	2025-10-06	2025-10-06	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:31:58.662628	2025-09-30 06:31:58.662628
1162	1	\N	24	Matrix Rate - 2025-10-07	2025-10-07	2025-10-07	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:31:58.79408	2025-09-30 06:31:58.79408
1163	1	\N	24	Matrix Rate - 2025-10-08	2025-10-08	2025-10-08	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:31:58.925938	2025-09-30 06:31:58.925938
1164	1	\N	24	Matrix Rate - 2025-10-09	2025-10-09	2025-10-09	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:31:59.058312	2025-09-30 06:31:59.058312
1165	1	\N	24	Matrix Rate - 2025-10-10	2025-10-10	2025-10-10	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:31:59.190586	2025-09-30 06:31:59.190586
1166	1	\N	24	Matrix Rate - 2025-10-11	2025-10-11	2025-10-11	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:31:59.322737	2025-09-30 06:31:59.322737
1167	1	\N	24	Matrix Rate - 2025-10-12	2025-10-12	2025-10-12	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:31:59.45968	2025-09-30 06:31:59.45968
1168	1	\N	24	Matrix Rate - 2025-10-13	2025-10-13	2025-10-13	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:31:59.591061	2025-09-30 06:31:59.591061
1169	1	\N	24	Matrix Rate - 2025-10-14	2025-10-14	2025-10-14	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:31:59.721063	2025-09-30 06:31:59.721063
1170	1	\N	21	Matrix Rate - 2025-09-30	2025-09-30	2025-09-30	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:31:59.855048	2025-09-30 06:31:59.855048
1171	1	\N	21	Matrix Rate - 2025-10-01	2025-10-01	2025-10-01	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:31:59.986808	2025-09-30 06:31:59.986808
1172	1	\N	21	Matrix Rate - 2025-10-02	2025-10-02	2025-10-02	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:32:00.117534	2025-09-30 06:32:00.117534
1173	1	\N	21	Matrix Rate - 2025-10-03	2025-10-03	2025-10-03	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:32:00.25242	2025-09-30 06:32:00.25242
1174	1	\N	21	Matrix Rate - 2025-10-04	2025-10-04	2025-10-04	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:32:00.384538	2025-09-30 06:32:00.384538
1175	1	\N	21	Matrix Rate - 2025-10-05	2025-10-05	2025-10-05	2000.00	2000.00	2000.00	2000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-30 06:32:00.514389	2025-09-30 06:32:00.514389
1115	7	\N	24	Matrix Rate - 2025-09-30	2025-09-30	2025-09-30	4000.00	4000.00	4000.00	4000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-09-24 08:25:56.735691	2025-09-30 06:51:10.533428
1176	6	\N	23	Matrix Rate - 2025-10-28	2025-10-28	2025-10-28	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-10-28 13:30:24.66029	2025-10-28 13:31:29.269753
1177	6	\N	23	Matrix Rate - 2025-10-29	2025-10-29	2025-10-29	3000.00	3000.00	3000.00	3000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-10-28 13:31:29.417999	2025-10-28 13:31:29.417999
1179	6	\N	23	Matrix Rate - 2025-10-31	2025-10-31	2025-10-31	4000.00	4000.00	4000.00	4000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-10-28 13:31:29.684553	2025-10-30 06:02:23.341715
1180	6	\N	23	Matrix Rate - 2025-11-03	2025-11-03	2025-11-03	4000.00	4000.00	4000.00	4000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-10-28 13:31:29.81491	2025-10-30 06:02:23.472066
1181	6	\N	23	Matrix Rate - 2025-11-04	2025-11-04	2025-11-04	4000.00	4000.00	4000.00	4000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-10-28 13:31:29.946999	2025-10-30 06:02:23.603385
1182	6	\N	23	Matrix Rate - 2025-11-05	2025-11-05	2025-11-05	4000.00	4000.00	4000.00	4000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-10-28 13:31:30.078433	2025-10-30 06:02:23.734279
1183	6	\N	23	Matrix Rate - 2025-11-06	2025-11-06	2025-11-06	4000.00	4000.00	4000.00	4000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-10-28 13:31:30.210837	2025-10-30 06:02:23.863981
1184	6	\N	23	Matrix Rate - 2025-11-07	2025-11-07	2025-11-07	4000.00	4000.00	4000.00	4000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-10-28 13:31:30.342788	2025-10-30 06:02:23.994399
1178	6	\N	23	Matrix Rate - 2025-10-30	2025-10-30	2025-10-30	4000.00	4000.00	4000.00	4000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-10-28 13:31:29.551574	2025-10-30 06:02:23.195764
1185	6	\N	23	Matrix Rate - 2025-11-10	2025-11-10	2025-11-10	4000.00	4000.00	4000.00	4000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-10-28 13:31:30.47813	2025-10-30 06:02:24.126451
1186	6	\N	23	Matrix Rate - 2025-11-11	2025-11-11	2025-11-11	4000.00	4000.00	4000.00	4000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-10-28 13:31:30.61188	2025-10-30 06:02:24.257469
1187	6	\N	23	Matrix Rate - 2025-11-12	2025-11-12	2025-11-12	4000.00	4000.00	4000.00	4000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-10-30 06:02:24.388623	2025-10-30 06:02:24.388623
1188	6	\N	23	Matrix Rate - 2025-11-13	2025-11-13	2025-11-13	4000.00	4000.00	4000.00	4000.00	0.00	0.00	0.00	0.00	0.00	0.00	16	\N	["friday","saturday","sunday"]	t	1	\N	2025-10-30 06:02:24.601505	2025-10-30 06:02:24.601505
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reviews (id, user_id, property_id, booking_id, rating, review_text, is_recommended, images, response, is_verified, created_at) FROM stdin;
\.


--
-- Data for Name: role_master; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_master (id, role_name, role_code, description, level, permissions, can_access_admin_panel, can_manage_users, can_manage_properties, can_manage_rates, can_manage_bookings, can_manage_finance, can_manage_reports, can_manage_master_data, can_manage_roles, can_view_audit_logs, default_property_permissions, is_active, is_system_role, max_properties, color, icon, notes, created_by, created_at, updated_at) FROM stdin;
1	Super Admin	001	It is super admin for us	1	[]	f	f	f	f	f	f	f	f	f	f	["read"]	t	f	\N	#3B82F6	user		\N	2025-09-30 06:59:19.086392	2025-09-30 06:59:19.086392
2	Hotel Owner	002	Description	1	["system.admin"]	f	f	f	f	f	f	f	f	f	f	["read"]	t	f	\N	#3bf7bf	building		\N	2025-09-30 07:06:24.408158	2025-09-30 07:06:24.408158
\.


--
-- Data for Name: room_inventory; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.room_inventory (id, property_id, room_type_id, date, total_rooms, available_rooms, booked_rooms, blocked_rooms, is_active, last_updated) FROM stdin;
1	8	21	2025-01-05	15	15	0	0	t	2025-09-06 10:05:14.538
2	8	21	2025-01-06	15	15	0	0	t	2025-09-06 10:05:14.673
3	8	21	2025-01-07	15	15	0	0	t	2025-09-06 10:05:14.803
4	8	21	2025-01-08	15	15	0	0	t	2025-09-06 10:05:14.934
5	8	21	2025-01-09	15	15	0	0	t	2025-09-06 10:05:15.064
6	8	21	2025-01-10	15	15	0	0	t	2025-09-06 10:05:15.211
7	8	21	2025-01-11	15	15	0	0	t	2025-09-06 10:05:15.345
9	8	21	2025-01-13	45	45	0	0	t	2025-09-06 12:18:28.292
10	8	21	2025-01-14	45	45	0	0	t	2025-09-06 12:18:28.422
11	8	21	2025-01-15	45	45	0	0	t	2025-09-06 12:18:28.552
12	8	21	2025-01-16	45	45	0	0	t	2025-09-06 12:18:28.683
21	8	21	2025-01-25	0	0	0	0	t	2025-09-06 10:13:52.435
13	8	21	2025-01-17	45	45	0	0	t	2025-09-06 12:18:28.814
14	8	21	2025-01-18	45	45	0	0	t	2025-09-06 12:18:28.944
39	6	22	2025-09-05	7	7	0	0	t	2025-09-06 12:27:11.883
40	6	22	2025-09-07	7	7	0	0	t	2025-09-06 12:27:12.048
41	6	22	2025-09-08	7	7	0	0	t	2025-09-06 12:27:12.18
42	6	22	2025-09-09	7	7	0	0	t	2025-09-06 12:27:12.313
43	6	22	2025-09-10	7	7	0	0	t	2025-09-06 12:27:12.447
44	6	22	2025-09-11	7	7	0	0	t	2025-09-06 12:27:12.58
45	6	22	2025-09-12	7	7	0	0	t	2025-09-06 12:27:12.713
46	6	22	2025-09-14	7	7	0	0	t	2025-09-06 12:27:12.844
47	6	22	2025-09-15	7	7	0	0	t	2025-09-06 12:27:12.978
48	6	22	2025-09-16	7	7	0	0	t	2025-09-06 12:27:13.113
49	6	22	2025-09-17	7	7	0	0	t	2025-09-06 12:27:13.245
16	8	21	2025-01-20	40	40	0	0	t	2025-09-06 12:06:06.456
17	8	21	2025-01-21	40	40	0	0	t	2025-09-06 12:06:06.597
18	8	21	2025-01-22	40	40	0	0	t	2025-09-06 12:06:06.733
19	8	21	2025-01-23	40	40	0	0	t	2025-09-06 12:06:06.874
20	8	21	2025-01-24	40	40	0	0	t	2025-09-06 12:06:07.007
22	8	21	2025-01-27	35	35	0	0	t	2025-09-06 12:06:08.09
23	8	21	2025-01-29	35	35	0	0	t	2025-09-06 12:06:08.256
24	8	21	2025-01-31	35	35	0	0	t	2025-09-06 12:06:08.389
25	8	21	2025-02-01	35	35	0	0	t	2025-09-06 12:06:08.521
26	8	21	2025-02-02	35	35	0	0	t	2025-09-06 12:06:08.655
27	8	21	2025-02-04	45	45	0	0	t	2025-09-06 12:06:12.442
28	8	21	2025-02-05	45	45	0	0	t	2025-09-06 12:06:12.575
29	8	21	2025-02-06	45	45	0	0	t	2025-09-06 12:06:12.708
30	8	21	2025-02-07	45	45	0	0	t	2025-09-06 12:06:12.841
31	8	21	2025-02-08	45	45	0	0	t	2025-09-06 12:06:12.974
32	8	21	2025-02-09	45	45	0	0	t	2025-09-06 12:06:13.108
33	8	21	2025-02-10	50	50	0	0	t	2025-09-06 12:06:16.45
34	8	21	2025-02-11	50	50	0	0	t	2025-09-06 12:06:16.581
35	8	21	2025-02-12	50	50	0	0	t	2025-09-06 12:06:16.714
36	8	21	2025-02-13	50	50	0	0	t	2025-09-06 12:06:16.846
37	8	21	2025-02-14	50	50	0	0	t	2025-09-06 12:06:16.979
38	8	21	2025-02-15	50	50	0	0	t	2025-09-06 12:06:17.112
50	6	22	2025-09-18	7	7	0	0	t	2025-09-06 12:27:13.38
51	6	22	2025-09-19	7	7	0	0	t	2025-09-06 12:27:13.512
15	8	21	2025-01-19	10	10	0	0	t	2025-09-06 12:27:55.36
52	6	21	2025-01-06	15	12	2	1	t	2025-09-06 16:39:03.045676
53	6	21	2025-01-07	15	10	3	2	t	2025-09-06 16:39:03.045676
54	6	21	2025-01-08	15	15	0	0	t	2025-09-06 16:39:03.045676
55	6	21	2025-01-09	15	8	5	2	t	2025-09-06 16:39:03.045676
56	6	21	2025-01-10	15	14	1	0	t	2025-09-06 16:39:03.045676
57	6	22	2025-01-06	25	20	3	2	t	2025-09-06 16:39:03.045676
58	6	22	2025-01-07	25	18	5	2	t	2025-09-06 16:39:03.045676
59	6	22	2025-01-08	25	22	2	1	t	2025-09-06 16:39:03.045676
60	6	22	2025-01-09	25	15	8	2	t	2025-09-06 16:39:03.045676
61	6	22	2025-01-10	25	25	0	0	t	2025-09-06 16:39:03.045676
62	6	23	2025-01-08	8	6	1	1	t	2025-09-06 16:39:03.045676
63	6	23	2025-01-09	8	5	2	1	t	2025-09-06 16:39:03.045676
64	6	23	2025-01-10	8	8	0	0	t	2025-09-06 16:39:03.045676
65	6	24	2025-01-18	4	3	0	1	t	2025-09-06 16:39:03.045676
66	6	24	2025-01-19	4	2	1	1	t	2025-09-06 16:39:03.045676
67	6	24	2025-01-20	4	4	0	0	t	2025-09-06 16:39:03.045676
68	8	22	2025-09-11	5	5	0	0	t	2025-09-12 10:59:04.407
69	8	22	2025-09-12	5	5	0	0	t	2025-09-12 10:59:04.563
70	8	22	2025-09-13	0	0	0	0	t	2025-09-12 10:59:04.694
71	8	22	2025-09-14	5	5	0	0	t	2025-09-12 10:59:04.826
72	8	22	2025-09-15	5	5	0	0	t	2025-09-12 10:59:04.958
73	8	22	2025-09-16	5	5	0	0	t	2025-09-12 10:59:05.091
8	8	21	2025-01-12	0	0	0	0	t	2025-09-06 12:18:13.564
74	8	22	2025-09-17	5	5	0	0	t	2025-09-12 10:59:05.223
75	8	22	2025-09-18	5	5	0	0	t	2025-09-12 10:59:05.357
76	8	22	2025-09-19	5	5	0	0	t	2025-09-12 10:59:05.49
77	8	22	2025-09-20	0	0	0	0	t	2025-09-12 10:59:05.62
78	8	22	2025-09-21	5	5	0	0	t	2025-09-12 10:59:05.751
79	8	22	2025-09-22	5	5	0	0	t	2025-09-12 10:59:05.888
80	8	22	2025-09-23	5	5	0	0	t	2025-09-12 10:59:06.019
81	8	22	2025-09-24	5	5	0	0	t	2025-09-12 10:59:06.15
82	8	22	2025-09-25	5	5	0	0	t	2025-09-12 10:59:06.282
83	8	22	2025-09-26	5	5	0	0	t	2025-09-12 10:59:06.413
84	8	22	2025-09-27	0	0	0	0	t	2025-09-12 10:59:06.546
85	8	22	2025-09-28	5	5	0	0	t	2025-09-12 10:59:06.679
86	8	22	2025-09-29	5	5	0	0	t	2025-09-12 10:59:06.81
87	8	22	2025-08-31	12	12	0	0	t	2025-09-24 07:22:33.997
89	6	22	2025-09-24	20	20	0	0	t	2025-09-24 08:21:37.081
90	6	22	2025-09-25	20	20	0	0	t	2025-09-24 08:21:37.213
91	6	22	2025-09-26	20	20	0	0	t	2025-09-24 08:21:37.345
92	6	22	2025-09-27	20	20	0	0	t	2025-09-24 08:21:37.477
101	6	22	2025-10-06	20	18	2	0	t	2025-10-05 07:17:04.757
99	6	22	2025-10-04	20	20	0	0	t	2025-09-29 17:24:41.119
93	6	22	2025-09-28	20	20	0	0	t	2025-09-29 17:24:40.32
94	6	22	2025-09-29	20	0	20	0	t	2025-09-29 17:24:40.45
100	6	22	2025-10-05	20	20	0	0	t	2025-09-29 17:24:41.248
102	6	22	2025-10-07	20	20	0	0	t	2025-09-29 17:24:41.508
103	6	22	2025-10-08	20	20	0	0	t	2025-09-29 17:24:41.637
104	6	22	2025-10-09	20	20	0	0	t	2025-09-29 17:24:41.768
105	6	22	2025-10-10	20	20	0	0	t	2025-09-29 17:24:41.898
106	6	22	2025-10-11	20	20	0	0	t	2025-09-29 17:24:42.028
107	6	22	2025-10-12	20	20	0	0	t	2025-09-24 08:20:50.823
108	6	22	2025-10-13	20	20	0	0	t	2025-09-24 08:20:50.955
109	6	22	2025-10-14	20	20	0	0	t	2025-09-24 08:20:51.085
110	6	22	2025-10-15	20	20	0	0	t	2025-09-24 08:20:51.216
111	6	22	2025-10-16	20	20	0	0	t	2025-09-24 08:20:51.346
112	6	22	2025-10-17	20	20	0	0	t	2025-09-24 08:20:51.476
113	6	22	2025-10-18	20	20	0	0	t	2025-09-24 08:20:51.606
114	6	22	2025-10-19	20	20	0	0	t	2025-09-24 08:20:51.738
115	6	22	2025-10-20	20	20	0	0	t	2025-09-24 08:20:51.869
116	6	22	2025-10-21	20	20	0	0	t	2025-09-24 08:20:51.999
117	6	22	2025-10-22	20	20	0	0	t	2025-09-24 08:20:52.129
118	6	22	2025-10-23	20	20	0	0	t	2025-09-24 08:20:52.259
119	6	22	2025-10-24	20	20	0	0	t	2025-09-24 08:20:52.389
120	6	22	2025-10-25	20	20	0	0	t	2025-09-24 08:20:52.521
121	6	22	2025-10-26	20	20	0	0	t	2025-09-24 08:20:52.652
122	6	22	2025-10-27	20	20	0	0	t	2025-09-24 08:20:52.783
123	6	22	2025-10-28	20	20	0	0	t	2025-09-24 08:20:52.915
88	6	22	2025-09-23	20	20	0	0	t	2025-09-24 08:21:36.949
126	6	23	2025-09-23	20	20	0	0	t	2025-09-24 08:22:19.4
127	6	23	2025-09-24	20	20	0	0	t	2025-09-24 08:22:19.529
128	6	23	2025-09-25	20	20	0	0	t	2025-09-24 08:22:19.66
129	6	23	2025-09-26	20	20	0	0	t	2025-09-24 08:22:19.788
130	6	23	2025-09-27	20	20	0	0	t	2025-09-24 08:22:19.918
131	6	23	2025-09-28	20	20	0	0	t	2025-09-24 08:22:20.046
135	6	23	2025-10-02	20	20	0	0	t	2025-09-24 08:22:20.563
137	6	23	2025-10-04	20	20	0	0	t	2025-09-24 08:22:20.822
138	6	23	2025-10-05	20	20	0	0	t	2025-09-24 08:22:20.951
139	6	23	2025-10-06	20	20	0	0	t	2025-09-24 08:22:21.079
140	6	23	2025-10-07	20	20	0	0	t	2025-09-24 08:22:21.208
141	6	23	2025-10-08	20	20	0	0	t	2025-09-24 08:22:21.337
142	6	23	2025-10-09	20	20	0	0	t	2025-09-24 08:22:21.466
143	6	23	2025-10-10	20	20	0	0	t	2025-09-24 08:22:21.604
144	6	23	2025-10-11	20	20	0	0	t	2025-09-24 08:22:21.733
145	6	23	2025-10-12	20	20	0	0	t	2025-09-24 08:22:21.862
146	6	23	2025-10-13	20	20	0	0	t	2025-09-24 08:22:21.991
147	6	23	2025-10-14	20	20	0	0	t	2025-09-24 08:22:22.122
148	6	23	2025-10-15	20	20	0	0	t	2025-09-24 08:22:22.25
149	6	23	2025-10-16	20	20	0	0	t	2025-09-24 08:22:22.38
150	6	23	2025-10-17	20	20	0	0	t	2025-09-24 08:22:22.508
151	6	23	2025-10-18	20	20	0	0	t	2025-09-24 08:22:22.645
152	6	23	2025-10-19	20	20	0	0	t	2025-09-24 08:22:22.777
153	6	23	2025-10-20	20	20	0	0	t	2025-09-24 08:22:22.906
154	6	23	2025-10-21	20	20	0	0	t	2025-09-24 08:22:23.036
155	6	23	2025-10-22	20	20	0	0	t	2025-09-24 08:22:23.166
156	6	23	2025-10-23	20	20	0	0	t	2025-09-24 08:22:23.294
157	7	22	2025-09-23	20	20	0	0	t	2025-09-24 08:23:01.787
158	7	22	2025-09-24	20	20	0	0	t	2025-09-24 08:23:01.92
159	7	22	2025-09-25	20	20	0	0	t	2025-09-24 08:23:02.052
160	7	22	2025-09-26	20	20	0	0	t	2025-09-24 08:23:02.184
161	7	22	2025-09-27	20	20	0	0	t	2025-09-24 08:23:02.316
162	7	22	2025-09-28	20	20	0	0	t	2025-09-24 08:23:02.453
163	7	22	2025-09-29	20	20	0	0	t	2025-09-24 08:23:02.584
164	7	22	2025-09-30	20	20	0	0	t	2025-09-24 08:23:02.715
165	7	22	2025-10-01	20	20	0	0	t	2025-09-24 08:23:02.848
166	7	22	2025-10-02	20	20	0	0	t	2025-09-24 08:23:02.979
167	7	22	2025-10-03	20	20	0	0	t	2025-09-24 08:23:03.111
168	7	22	2025-10-04	20	20	0	0	t	2025-09-24 08:23:03.24
169	7	22	2025-10-05	20	20	0	0	t	2025-09-24 08:23:03.373
170	7	22	2025-10-06	20	20	0	0	t	2025-09-24 08:23:03.504
171	7	22	2025-10-07	20	20	0	0	t	2025-09-24 08:23:03.636
172	7	22	2025-10-08	20	20	0	0	t	2025-09-24 08:23:03.767
173	7	22	2025-10-09	20	20	0	0	t	2025-09-24 08:23:03.898
174	7	22	2025-10-10	20	20	0	0	t	2025-09-24 08:23:04.03
175	7	22	2025-10-11	20	20	0	0	t	2025-09-24 08:23:04.161
176	7	22	2025-10-12	20	20	0	0	t	2025-09-24 08:23:04.292
177	7	22	2025-10-13	20	20	0	0	t	2025-09-24 08:23:04.424
178	7	22	2025-10-14	20	20	0	0	t	2025-09-24 08:23:04.556
179	7	22	2025-10-15	20	20	0	0	t	2025-09-24 08:23:04.688
180	7	22	2025-10-16	20	20	0	0	t	2025-09-24 08:23:04.819
181	7	22	2025-10-17	20	20	0	0	t	2025-09-24 08:23:04.95
182	7	22	2025-10-18	20	20	0	0	t	2025-09-24 08:23:05.081
183	7	22	2025-10-19	20	20	0	0	t	2025-09-24 08:23:05.213
184	7	22	2025-10-20	20	20	0	0	t	2025-09-24 08:23:05.344
185	7	22	2025-10-21	20	20	0	0	t	2025-09-24 08:23:05.477
186	7	22	2025-10-22	20	20	0	0	t	2025-09-24 08:23:05.608
187	7	22	2025-10-23	20	20	0	0	t	2025-09-24 08:23:05.739
190	6	23	2025-10-29	20	20	0	0	t	2025-10-30 06:01:41.043
191	6	23	2025-10-30	20	20	0	0	t	2025-10-30 06:01:41.183
192	6	23	2025-10-31	20	20	0	0	t	2025-10-30 06:01:41.314
134	6	23	2025-10-01	20	12	8	0	t	2025-09-30 16:07:05.092
136	6	23	2025-10-03	20	18	2	0	t	2025-10-02 10:47:01.908
95	6	22	2025-09-30	20	-2	22	0	t	2025-09-29 17:24:40.579
98	6	22	2025-10-03	20	14	6	0	t	2025-09-29 17:24:40.968
96	6	22	2025-10-01	20	12	8	0	t	2025-09-30 08:56:55.452
97	6	22	2025-10-02	20	14	6	0	t	2025-09-29 17:24:40.838
132	6	23	2025-09-29	20	7	13	0	t	2025-09-28 10:21:36.687
133	6	23	2025-09-30	20	0	20	0	t	2025-09-29 13:55:08.754
193	6	23	2025-11-01	20	20	0	0	t	2025-10-30 06:01:41.454
125	6	22	2025-10-30	30	30	0	0	t	2025-10-30 06:03:51.817
188	6	23	2025-10-27	30	30	0	0	t	2025-10-28 13:29:17.066
194	6	23	2025-11-02	20	20	0	0	t	2025-10-30 06:01:41.586
189	6	23	2025-10-28	30	30	0	0	t	2025-10-28 13:29:17.226
195	6	23	2025-11-03	20	20	0	0	t	2025-10-30 06:01:41.717
196	6	23	2025-11-04	20	20	0	0	t	2025-10-30 06:01:41.848
197	6	23	2025-11-05	20	20	0	0	t	2025-10-30 06:01:41.98
198	6	23	2025-11-06	20	20	0	0	t	2025-10-30 06:01:42.111
199	6	23	2025-11-07	20	20	0	0	t	2025-10-30 06:01:42.248
200	6	23	2025-11-08	20	20	0	0	t	2025-10-30 06:01:42.379
201	6	23	2025-11-09	20	20	0	0	t	2025-10-30 06:01:42.512
202	6	23	2025-11-10	20	20	0	0	t	2025-10-30 06:01:42.643
203	6	23	2025-11-11	20	20	0	0	t	2025-10-30 06:01:42.773
204	6	23	2025-11-12	20	20	0	0	t	2025-10-30 06:01:42.904
205	6	23	2025-11-13	20	20	0	0	t	2025-10-30 06:01:43.034
206	6	23	2025-11-14	20	20	0	0	t	2025-10-30 06:01:43.167
207	6	23	2025-11-15	20	20	0	0	t	2025-10-30 06:01:43.298
208	6	23	2025-11-16	20	20	0	0	t	2025-10-30 06:01:43.429
209	6	23	2025-11-17	20	20	0	0	t	2025-10-30 06:01:43.56
210	6	23	2025-11-18	20	20	0	0	t	2025-10-30 06:01:43.692
211	6	23	2025-11-19	20	20	0	0	t	2025-10-30 06:01:43.822
124	6	22	2025-10-29	30	30	1	0	t	2025-10-30 06:03:51.687
213	6	22	2025-11-01	30	30	0	0	t	2025-10-30 06:03:52.08
214	6	22	2025-11-02	30	30	0	0	t	2025-10-30 06:03:52.21
215	6	22	2025-11-03	30	30	0	0	t	2025-10-30 06:03:52.34
216	6	22	2025-11-04	30	30	0	0	t	2025-10-30 06:03:52.47
217	6	22	2025-11-05	30	30	0	0	t	2025-10-30 06:03:52.601
218	6	22	2025-11-06	30	30	0	0	t	2025-10-30 06:03:52.731
219	6	22	2025-11-07	30	30	0	0	t	2025-10-30 06:03:52.861
220	6	22	2025-11-08	30	30	0	0	t	2025-10-30 06:03:52.99
221	6	22	2025-11-09	30	30	0	0	t	2025-10-30 06:03:53.12
222	6	22	2025-11-10	30	30	0	0	t	2025-10-30 06:03:53.252
223	6	22	2025-11-11	30	30	0	0	t	2025-10-30 06:03:53.382
224	6	22	2025-11-12	30	30	0	0	t	2025-10-30 06:03:53.513
225	6	22	2025-11-13	30	30	0	0	t	2025-10-30 06:03:53.642
226	6	22	2025-11-14	30	30	0	0	t	2025-10-30 06:03:53.771
227	6	22	2025-11-15	30	30	0	0	t	2025-10-30 06:03:53.902
228	6	22	2025-11-16	30	30	0	0	t	2025-10-30 06:03:54.037
229	6	22	2025-11-17	30	30	0	0	t	2025-10-30 06:03:54.167
230	6	22	2025-11-18	30	30	0	0	t	2025-10-30 06:03:54.298
231	6	22	2025-11-19	30	30	0	0	t	2025-10-30 06:03:54.429
212	6	22	2025-10-31	30	28	2	0	t	2025-10-30 06:05:42.407
\.


--
-- Data for Name: room_photos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.room_photos (id, room_type_id, photo_group, photo_name, photo_url, photo_path, original_resolution, compressed_resolution, resolution_percentage, original_file_size, compressed_file_size, compression_ratio, compression_quality, mime_type, thumbnail_url, is_compressed, is_main_photo, display_order, alt_text, uploaded_by, is_active, created_at, updated_at, media_type, duration) FROM stdin;
11	23	bedroom	IMG_20230117_085814	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/room-media/64335c39-c927-44bd-9ee3-2ec2e3765bc9	/room-photos/64335c39-c927-44bd-9ee3-2ec2e3765bc9	1800x4000	1800x4000	95	2294067	\N	\N	85	image/jpeg	\N	t	f	1	\N	admin	t	2025-09-29 16:26:45.031303	2025-09-29 16:26:45.031303	photo	\N
12	23	bedroom	IMG_20230117_093221	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/room-media/c5b0c89a-5a20-46fc-96ac-4ff8d1076175	/room-photos/c5b0c89a-5a20-46fc-96ac-4ff8d1076175	1001x1780	1001x1780	95	749160	\N	\N	85	image/jpeg	\N	t	f	1	\N	admin	t	2025-09-29 16:26:49.340249	2025-09-29 16:26:49.340249	photo	\N
13	23	bedroom	IMG_20230117_093258	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/room-media/07b5dc81-4625-4854-80a9-ad25f5c17492	/room-photos/07b5dc81-4625-4854-80a9-ad25f5c17492	1012x1800	1012x1800	95	942728	\N	\N	85	image/jpeg	\N	t	f	1	\N	admin	t	2025-09-29 16:26:53.750996	2025-09-29 16:26:53.750996	photo	\N
14	23	bedroom	IMG_20230117_093319	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/room-media/ddfb98cd-f9c5-4a42-a74a-956ff3c8473b	/room-photos/ddfb98cd-f9c5-4a42-a74a-956ff3c8473b	1013x1800	1013x1800	95	685599	\N	\N	85	image/jpeg	\N	t	f	1	\N	admin	t	2025-09-29 16:26:58.041517	2025-09-29 16:26:58.041517	photo	\N
15	23	view	Photo_1620569691654	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/room-media/05a6774b-fb1f-41bc-ae3b-d68a148bfe7f	/room-photos/05a6774b-fb1f-41bc-ae3b-d68a148bfe7f	1080x1080	1080x1080	95	558575	\N	\N	85	image/png	\N	t	f	1	\N	admin	t	2025-09-29 16:27:46.403341	2025-09-29 16:27:46.403341	photo	\N
16	23	view	checkin	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/room-media/7a7a5010-ea75-48d2-a270-baa6c196b556	/room-photos/7a7a5010-ea75-48d2-a270-baa6c196b556	1531x862	1531x862	95	98057	\N	\N	85	image/png	\N	t	f	1	\N	admin	t	2025-09-29 16:29:05.451918	2025-09-29 16:29:05.451918	photo	\N
57	24	view	IMG_20230116_161314	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/room-media/abe40f76-552c-494e-ba39-ec36c6344dc8	/room-photos/abe40f76-552c-494e-ba39-ec36c6344dc8	4000x1800	4000x1800	95	3276001	\N	\N	85	image/jpeg	\N	t	f	1	\N	admin	t	2025-09-29 17:15:55.310758	2025-09-29 17:15:55.310758	photo	\N
58	24	view	IMG_20230116_161324	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/room-media/be4c43d4-41ed-4f63-a7cc-c0925bb99060	/room-photos/be4c43d4-41ed-4f63-a7cc-c0925bb99060	4000x1800	4000x1800	95	2172121	\N	\N	85	image/jpeg	\N	t	f	1	\N	admin	t	2025-09-29 17:16:00.852656	2025-09-29 17:16:00.852656	photo	\N
59	24	view	IMG_20230116_161428	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/room-media/700c1312-287b-4ab1-9a1b-43177dac319e	/room-photos/700c1312-287b-4ab1-9a1b-43177dac319e	4608x3456	4608x3456	95	6520914	\N	\N	85	image/jpeg	\N	t	f	1	\N	admin	t	2025-09-29 17:16:06.354667	2025-09-29 17:16:06.354667	photo	\N
60	24	view	IMG_20230116_161604	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/room-media/d34a47c6-0f44-4b1a-9e55-2aa01dfcf597	/room-photos/d34a47c6-0f44-4b1a-9e55-2aa01dfcf597	4000x1800	4000x1800	95	4440832	\N	\N	85	image/jpeg	\N	t	f	1	\N	admin	t	2025-09-29 17:16:12.795852	2025-09-29 17:16:12.795852	photo	\N
61	24	view	IMG_20230116_161947	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/room-media/3426c30a-ba89-41be-8379-6d867b1c0502	/room-photos/3426c30a-ba89-41be-8379-6d867b1c0502	2160x3840	2160x3840	95	1957539	\N	\N	85	image/jpeg	\N	t	f	1	\N	admin	t	2025-09-29 17:16:17.456915	2025-09-29 17:16:17.456915	photo	\N
53	21	bedroom	Deluxe Bedroom View	https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600	/test-room-photos/bedroom1	1920x1080	800x600	95	2500000	800000	0.320	85	image/jpeg	\N	t	t	1	Modern deluxe bedroom with king bed	admin	t	2025-09-29 17:14:35.371867	2025-09-29 17:14:35.371867	photo	\N
54	21	washroom	Luxury Bathroom	https://images.unsplash.com/photo-1620626011761-996317b8d101?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600	/test-room-photos/washroom1	1920x1080	800x600	90	2200000	850000	0.390	85	image/jpeg	\N	f	f	2	Marble bathroom with modern fixtures	admin	t	2025-09-29 17:14:35.371867	2025-09-29 17:14:35.371867	photo	\N
55	22	bedroom	Executive Suite Bedroom	https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600	/test-room-photos/executive-bedroom	1920x1080	800x600	92	2300000	780000	0.340	85	image/jpeg	\N	t	f	1	Executive suite with premium bedding	admin	t	2025-09-29 17:14:35.371867	2025-09-29 17:14:35.371867	photo	\N
56	22	view	City View from Window	https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600	/test-room-photos/city-view	1920x1080	800x600	88	2100000	900000	0.430	85	image/jpeg	\N	f	f	3	Beautiful city skyline view	admin	t	2025-09-29 17:14:35.371867	2025-09-29 17:14:35.371867	photo	\N
62	23	view	IMG_20230116_154624	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/room-media/50d39433-7af6-42d4-b28b-3667d46f6c92	/room-photos/50d39433-7af6-42d4-b28b-3667d46f6c92	4000x1800	4000x1800	95	4336341	\N	\N	85	image/jpeg	\N	t	f	1	\N	admin	t	2025-09-30 04:23:35.358087	2025-09-30 04:23:35.358087	photo	\N
63	23	view	IMG_20230116_154632	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/room-media/7a464c9d-21f8-45a6-88d6-55416a3b5c5a	/room-photos/7a464c9d-21f8-45a6-88d6-55416a3b5c5a	4000x1800	4000x1800	95	4678882	\N	\N	85	image/jpeg	\N	t	f	1	\N	admin	t	2025-09-30 04:23:47.730749	2025-09-30 04:23:47.730749	photo	\N
64	23	view	IMG_20230116_154633	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/room-media/f1dde6e5-7245-4db4-8a69-b2d0ff4810e5	/room-photos/f1dde6e5-7245-4db4-8a69-b2d0ff4810e5	4000x1800	4000x1800	95	3615558	\N	\N	85	image/jpeg	\N	t	f	1	\N	admin	t	2025-09-30 04:23:55.31311	2025-09-30 04:23:55.31311	photo	\N
65	23	view	IMG_20230116_154624	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/room-media/2a0976be-402c-4709-97c2-420c8e590909	/room-photos/2a0976be-402c-4709-97c2-420c8e590909	4000x1800	4000x1800	95	4336341	\N	\N	85	image/jpeg	\N	t	f	1	\N	admin	t	2025-09-30 04:25:04.747805	2025-09-30 04:25:04.747805	photo	\N
66	23	view	IMG_20230116_154632	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/room-media/5e3bfaaf-acb8-4ea4-be9f-a7a10e0a7322	/room-photos/5e3bfaaf-acb8-4ea4-be9f-a7a10e0a7322	4000x1800	4000x1800	95	4678882	\N	\N	85	image/jpeg	\N	t	f	1	\N	admin	t	2025-09-30 04:25:39.228011	2025-09-30 04:25:39.228011	photo	\N
67	23	view	IMG_20230116_154633	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/room-media/8c9d724d-332f-42c4-b75c-8b5e28bb37bd	/room-photos/8c9d724d-332f-42c4-b75c-8b5e28bb37bd	4000x1800	4000x1800	95	3615558	\N	\N	85	image/jpeg	\N	t	f	1	\N	admin	t	2025-09-30 04:25:49.949611	2025-09-30 04:25:49.949611	photo	\N
68	24	bedroom	IMG_20230116_155406	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/room-media/d2610ba4-39fb-4a25-b5aa-91ee12c86cfb	/room-photos/d2610ba4-39fb-4a25-b5aa-91ee12c86cfb	4000x1800	4000x1800	95	4826141	\N	\N	85	image/jpeg	\N	t	f	1	\N	admin	t	2025-10-02 12:49:34.812528	2025-10-02 12:49:34.812528	photo	\N
69	24	bedroom	IMG_20230116_155423	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/room-media/fe233f4c-6a06-4c9f-a022-1c4001c172ff	/room-photos/fe233f4c-6a06-4c9f-a022-1c4001c172ff	4000x1800	4000x1800	95	5110659	\N	\N	85	image/jpeg	\N	t	f	1	\N	admin	t	2025-10-02 12:49:39.906279	2025-10-02 12:49:39.906279	photo	\N
70	24	bedroom	IMG_20230116_155430	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/room-media/85b007b4-1944-4549-9cda-a9e93c28fb48	/room-photos/85b007b4-1944-4549-9cda-a9e93c28fb48	4000x1800	4000x1800	95	5315146	\N	\N	85	image/jpeg	\N	t	f	1	\N	admin	t	2025-10-02 12:49:45.012137	2025-10-02 12:49:45.012137	photo	\N
71	24	view	IMG_20230116_154733	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/room-media/6952dc60-b364-42e1-b330-5e912dca09d1	/room-photos/6952dc60-b364-42e1-b330-5e912dca09d1	4000x1800	4000x1800	95	4986514	\N	\N	85	image/jpeg	\N	t	f	1	\N	admin	t	2025-10-02 12:50:20.39954	2025-10-02 12:50:20.39954	photo	\N
72	24	view	IMG_20230116_155256	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/room-media/15253d58-7e96-4c34-8a35-995153319a9a	/room-photos/15253d58-7e96-4c34-8a35-995153319a9a	4000x1800	4000x1800	95	5061876	\N	\N	85	image/jpeg	\N	t	f	1	\N	admin	t	2025-10-02 12:50:25.54539	2025-10-02 12:50:25.54539	photo	\N
\.


--
-- Data for Name: room_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.room_types (id, room_type_name, room_size_square_meters, room_view_id, room_count, max_occupancy, description, is_active, created_at, updated_at, property_id) FROM stdin;
23	Deluxe Suite	55	\N	20	3	Luxury suite with separate living area	t	2025-09-06 07:20:02.451467	2025-09-06 07:20:02.451467	\N
24	Executive Suite	75	\N	10	4	Premium executive accommodation	t	2025-09-06 07:20:02.451467	2025-09-06 07:20:02.451467	\N
21	Standard Single	25	\N	50	1	Comfortable single occupancy room	t	2025-09-06 07:20:02.451467	2025-09-06 07:20:02.451467	6
22	Standard Double	35	\N	40	2	Spacious double occupancy room	t	2025-09-06 07:20:02.451467	2025-09-06 07:20:02.451467	6
\.


--
-- Data for Name: room_views; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.room_views (id, view_name, view_type, description, icon, is_active, created_at, updated_at) FROM stdin;
31	Pool View	recreational	Overlooks swimming pool area	🏞️	t	2025-09-06 07:20:02.385064	2025-09-06 07:20:02.385064
32	City View	urban	Panoramic city skyline	🏞️	t	2025-09-06 07:20:02.385064	2025-09-06 07:20:02.385064
33	Garden View	nature	Lush garden landscape	🏞️	t	2025-09-06 07:20:02.385064	2025-09-06 07:20:02.385064
34	Sea View	nature	Ocean or sea views	🏞️	t	2025-09-06 07:20:02.385064	2025-09-06 07:20:02.385064
35	Mountain View	nature	Scenic mountain vistas	🏞️	t	2025-09-06 07:20:02.385064	2025-09-06 07:20:02.385064
36	Courtyard View	recreational	Internal courtyard views	🏞️	t	2025-09-06 07:20:02.385064	2025-09-06 07:20:02.385064
\.


--
-- Data for Name: subledger_master; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subledger_master (id, subledger_name, short_name, subledger_code, general_ledger_account_id, description, is_active, is_default_ledger, tax_percentage, current_balance, last_transaction_date, created_at, updated_at, created_by, updated_by) FROM stdin;
1	Central GST (CGST)	CGST	SL001	1	Central Goods and Services Tax for room rent calculations	t	t	2.50	0.00	\N	2025-09-24 05:24:25.400115	2025-09-24 05:24:25.400115	\N	\N
2	State GST (SGST)	SGST	SL002	2	State Goods and Services Tax for room rent calculations	t	f	2.50	0.00	\N	2025-09-24 05:24:25.400115	2025-09-24 05:24:25.400115	\N	\N
3	Room Revenue - Standard	ROOM_STD	SL003	3	Standard room revenue tracking	t	t	2.50	0.00	\N	2025-09-24 05:24:25.400115	2025-09-24 05:24:25.400115	\N	\N
\.


--
-- Data for Name: tariff_setup_master; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tariff_setup_master (id, from_amount, to_amount, cgst_percentage, sgst_percentage, valid_from_date, valid_to_date, subledger_id, grace_hour, is_active, description, created_at, updated_at, created_by, updated_by, cgst_subledger_id, sgst_subledger_id) FROM stdin;
4	1.00	7499.00	2.50	2.50	2025-09-24	2025-09-25	3	1	t	Budget range tariff - Low season rates	2025-09-24 06:27:36.111392	2025-09-24 06:27:36.111392	\N	\N	1	2
3	1.00	7499.00	2.50	2.50	2025-09-26	2025-09-30	3	3	t	Updated test tariff setup - higher rates	2025-09-24 06:26:52.358515	2025-09-24 06:26:52.358515	\N	\N	1	2
\.


--
-- Data for Name: trans_booking_det; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trans_booking_det (id, mas_billing_id, property_id, room_type_id, number_of_rooms, number_of_nights, rate_per_night, discount, taxable_amount, gst, total_amount, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: trans_booking_detaildatewise; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trans_booking_detaildatewise (id, mas_billing_id, booking_date, property_id, room_type_id, room_count, balance_room_count, check_in_time, check_out_time, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: trans_booking_mas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trans_booking_mas (mas_billing_id, booking_id, property_id, guest_id, total_amount, gst_amount, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: universal_photos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.universal_photos (id, entity_type, entity_id, photo_category, photo_name, photo_url, photo_path, original_resolution, compressed_resolution, resolution_percentage, original_file_size, compressed_file_size, compression_ratio, compression_quality, mime_type, thumbnail_url, is_compressed, is_main_photo, display_order, alt_text, tags, uploaded_by, is_active, metadata, created_at, updated_at, compressed_url_data, compressed_tags, compressed_metadata, media_type, duration) FROM stdin;
37	property	1	elevation	Hotel RR Grand Main View	https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600	universal-photos/property-1-main.jpg	\N	\N	100	\N	\N	\N	85	\N	https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300	t	t	1	Luxury hotel exterior view	\N	\N	t	\N	2025-09-28 08:46:58.0143	2025-09-28 08:46:58.0143	\N	\N	\N	photo	\N
38	property	1	lobby	Hotel RR Grand Lobby	https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600	universal-photos/property-1-lobby.jpg	\N	\N	100	\N	\N	\N	85	\N	https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300	t	f	2	Modern hotel lobby	\N	\N	t	\N	2025-09-28 08:46:58.0143	2025-09-28 08:46:58.0143	\N	\N	\N	photo	\N
39	property	1	amenities	Hotel RR Grand Pool	https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600	universal-photos/property-1-pool.jpg	\N	\N	100	\N	\N	\N	85	\N	https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300	t	f	3	Swimming pool area	\N	\N	t	\N	2025-09-28 08:46:58.0143	2025-09-28 08:46:58.0143	\N	\N	\N	photo	\N
40	property	2	elevation	Seaside Resort Main View	https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600	universal-photos/property-2-main.jpg	\N	\N	100	\N	\N	\N	85	\N	https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300	t	t	1	Beautiful seaside resort	\N	\N	t	\N	2025-09-28 08:47:16.988824	2025-09-28 08:47:16.988824	\N	\N	\N	photo	\N
41	property	3	elevation	City Hotel Main View	https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600	universal-photos/property-3-main.jpg	\N	\N	100	\N	\N	\N	85	\N	https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300	t	t	1	Modern city hotel	\N	\N	t	\N	2025-09-28 08:47:16.988824	2025-09-28 08:47:16.988824	\N	\N	\N	photo	\N
42	property	4	elevation	Mountain Lodge Main View	https://images.unsplash.com/photo-1549294413-26f195200c16?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600	universal-photos/property-4-main.jpg	\N	\N	100	\N	\N	\N	85	\N	https://images.unsplash.com/photo-1549294413-26f195200c16?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300	t	t	1	Cozy mountain lodge	\N	\N	t	\N	2025-09-28 08:47:16.988824	2025-09-28 08:47:16.988824	\N	\N	\N	photo	\N
43	property	5	elevation	Beach Resort Main View	https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600	universal-photos/property-5-main.jpg	\N	\N	100	\N	\N	\N	85	\N	https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300	t	t	1	Tropical beach resort	\N	\N	t	\N	2025-09-28 08:47:16.988824	2025-09-28 08:47:16.988824	\N	\N	\N	photo	\N
45	property	7	elevation	Hotel K R Grand Main View	https://images.unsplash.com/photo-1455587734955-081b22074882?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600	universal-photos/property-7-main.jpg	\N	\N	100	\N	\N	\N	85	\N	https://images.unsplash.com/photo-1455587734955-081b22074882?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300	t	t	1	Elegant hotel architecture	\N	\N	t	\N	2025-09-28 08:47:30.250852	2025-09-28 08:47:30.250852	\N	\N	\N	photo	\N
46	property	8	elevation	Hotel Vinayak Main View	https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600	universal-photos/property-8-main.jpg	\N	\N	100	\N	\N	\N	85	\N	https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300	t	t	1	Classic hotel design	\N	\N	t	\N	2025-09-28 08:47:30.250852	2025-09-28 08:47:30.250852	\N	\N	\N	photo	\N
47	property	9	elevation	Hotel Hari Krishna Park Main View	https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600	universal-photos/property-9-main.jpg	\N	\N	100	\N	\N	\N	85	\N	https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300	t	t	1	Luxury hotel with park view	\N	\N	t	\N	2025-09-28 08:47:30.250852	2025-09-28 08:47:30.250852	\N	\N	\N	photo	\N
57	property	8	elevation	IMG_20230116_155750	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/universal-photos/7d95a1c6-8b24-4e54-b2c8-b4591f6f1953	/universal-photos/7d95a1c6-8b24-4e54-b2c8-b4591f6f1953	1800x4000	1800x4000	95	4185271	\N	\N	85	image/jpeg	\N	t	f	1	\N	\N	admin	t	\N	2025-09-30 04:22:52.778149	2025-09-30 04:22:52.778149	H4sIAAAAAAAAA52PSxKDIBAF78I6I4Lg7xTZ5AAziEoKAwXoJpW75+MNsn/V3e/J4hpKuCXPRraWEvPIeS4h4WKrJYTFW4wuVyZsPNnoXYFA9+/AgmlEowVJEGgJ1CRrGBBnwEmTEnKuqe94FZM7sFi+P9xhU0YPP2Pm3TRoFKaFnqQCZbUCkqYHUnoQczuLQTfscvZdsayfwL8hZd03eqDz51H2egM312jZ+AAAAA==	\N	\N	photo	\N
58	property	6	elevation	IMG_20230116_155406	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/universal-photos/318cdef6-9f71-413a-abe4-109474895d56	/universal-photos/318cdef6-9f71-413a-abe4-109474895d56	4000x1800	4000x1800	95	4826141	\N	\N	85	image/jpeg	\N	t	f	1	\N	\N	admin	t	\N	2025-10-02 12:16:25.465921	2025-10-02 12:16:25.465921	H4sIAAAAAAAAA52PSxKDIBAF78I6IyL4PUU2OcCgg5DCQAG6SeXu+XiD7F9193uyaEMJt+TZxGwpMU+c5xISrlStIayeMLpczWHjiaJ3BYK+fwcEsxSyFboBgaRBLU0NI6IBXFqtRGNqPfS8iskdWIjvD3dQyujhZ8xcimFeyHQwml6AEhIBNSkQ9ah6NYzt0nbscvZdsdhP4N+QYvdNP9D58yh7vQEFUhf5+AAAAA==	\N	\N	photo	\N
59	property	6	entrance	IMG_20230116_154632	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/universal-photos/4a47651a-b455-4f00-9361-b886273df5aa	/universal-photos/4a47651a-b455-4f00-9361-b886273df5aa	4000x1800	4000x1800	95	4678882	\N	\N	85	image/jpeg	\N	t	f	1	\N	\N	admin	t	\N	2025-10-02 12:16:51.032654	2025-10-02 12:16:51.032654	H4sIAAAAAAAAA52PSxKDIBBE78I6I/JT4ymyyQEGBSGFgQJ0k8rdY+INsu/u9/pFkos13nMgI3G1pjJSWmrMuJhmiXEJBpMvzRRXmk0KvkLUj2/AwCSYUExzYGg0yJm3cEW0gLPSknHb6qGnTcp+x2ro9vS7yQUD/IiFSpR9pxiClkqBtO1RFx0DPQwd78VsFSK5nH43rO4Q/Hukum3VT/ThPEreHybI8SH4AAAA	\N	\N	photo	\N
60	property	6	entrance	IMG_20230116_154633	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/universal-photos/e4d41a6f-775c-4e1b-a582-230c614826dc	/universal-photos/e4d41a6f-775c-4e1b-a582-230c614826dc	4000x1800	4000x1800	95	3615558	\N	\N	85	image/jpeg	\N	t	f	1	\N	\N	admin	t	\N	2025-10-02 12:16:55.923906	2025-10-02 12:16:55.923906	H4sIAAAAAAAAA52PSxKDIBAF78I6I4KgxlNkkwMMOCopFArQTSp3z8cbZP+qu9+TxSWUcE+eDWwpJeaB81xCwpmqOYTZE0aXKxtWnih6VyCYx3dAYBvRaGEkCCQDapQ1XBEnwFEbJeRUm77jVUzuwEJ839xBKaOHnzFzUqMS2E7QddqCImEAdS9BNrVtheplO1p2OftuWJZP4N+Qsuyr2dD58yh7vQGoEyZP+AAAAA==	\N	\N	photo	\N
61	property	8	elevation	IMG_20230116_154624	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/universal-photos/71996d64-dd90-4539-986d-028641e4b7a9	/universal-photos/71996d64-dd90-4539-986d-028641e4b7a9	4000x1800	4000x1800	95	4336341	\N	\N	85	image/jpeg	\N	t	f	1	\N	\N	admin	t	\N	2025-10-02 12:48:39.137909	2025-10-02 12:48:39.137909	H4sIAAAAAAAAA52PSRKDIBQF78I6XwYRxVNkkwN8BJUUBgrQTSp3z+ANsn/V3e9J0hprvOVARrLWmspIaakx4+KaJcYlOEy+NFPcaHYp+ArR3L8DB1PL244bARydAWkFA404A9rOSC5mZoaeNin7A6uj+8MfLhcM8DMW2nOtlVUSrNUMZNdq0IOywMSgJHfS9KjJ5ey7Yl0/gX9D6rpv5oE+nEfJ6w1CcFrX+AAAAA==	\N	\N	photo	\N
62	property	8	elevation	IMG_20230116_154632	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/universal-photos/04c1e107-0dc1-40e2-8108-f8a4b6363af6	/universal-photos/04c1e107-0dc1-40e2-8108-f8a4b6363af6	4000x1800	4000x1800	95	4678882	\N	\N	85	image/jpeg	\N	t	f	1	\N	\N	admin	t	\N	2025-10-02 12:48:44.148976	2025-10-02 12:48:44.148976	H4sIAAAAAAAAA52PSxKDIBAF78I6I6D4iafIJgcYcFBSKBSgm1Tuno83yP5Vd78ni0so4Z48G9lSSswj57mEhDNVcwizJ4wuVyasPFH0rkDQj++AwDSyaaWuQSJpUFMt4IpoAadWK1lboYeeVzG5AwvxfXMHpYwefsbMhTKSpOhBTEaCElTDIMUAdkClu6Zr0HbscvbdsCyfwL8hZdlXvaHz51H2egNt2AQN+AAAAA==	\N	\N	photo	\N
63	property	8	elevation	IMG_20230116_154633	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/universal-photos/5f8c6185-5869-426b-b87e-9404055471d3	/universal-photos/5f8c6185-5869-426b-b87e-9404055471d3	4000x1800	4000x1800	95	3615558	\N	\N	85	image/jpeg	\N	t	f	1	\N	\N	admin	t	\N	2025-10-02 12:48:49.046096	2025-10-02 12:48:49.046096	H4sIAAAAAAAAA52PSRKDIBRE78I6XwbB6RTZ5AAfRSGFQgG6SeXuMfEG2Xf3e/0i0YYSHsmTgdhSYh4ozSUkXEy1hLB4g9HlagwrTSZ6VyDo5zdgYKx5rbgWwNFokJNg0CPOgJPSkouZ6a6lVUzuwGLovrnDpIwefsRM1dyNDe8UqK7pQYpGw1kw0EsmmVKy5VNNbpffHYs9Bf8eKXZf9YbOX0fJ+wOSYCta+AAAAA==	\N	\N	photo	\N
64	property	6	exterior_views	IMG_20230116_154624	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/universal-photos/523cdba7-e3c2-4395-8467-8bb724ad2de6	/universal-photos/523cdba7-e3c2-4395-8467-8bb724ad2de6	4000x1800	4000x1800	95	4336341	\N	\N	85	image/jpeg	\N	t	f	1	\N	\N	admin	t	\N	2025-10-02 13:40:21.256844	2025-10-02 13:40:21.256844	H4sIAAAAAAAAA52PSxKDIBAF78I6IxEwGk+RTQ4wI6OSQqEA3aRy93y8Qfavuvs9RZxDCffkRS/mUmLupcwlJJy4mkKYPGN0uRrCIhNH7woEenwHDIOudVOTghqZwFh1hiviCGgbMrUaz9S1sorJ7VhYbqvbOWX08DNm2Sg9WMIWWA8KjL420JlLCx1RqwxaZfkiTkffDcv8CfwbUuZtoRWdP46K1xs/2kyP+AAAAA==	\N	\N	photo	\N
65	property	6	exterior_views	IMG_20230116_154632	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/universal-photos/a8006ded-787b-4e73-bb3a-8e1d6b6cdb19	/universal-photos/a8006ded-787b-4e73-bb3a-8e1d6b6cdb19	4000x1800	4000x1800	95	4678882	\N	\N	85	image/jpeg	\N	t	f	1	\N	\N	admin	t	\N	2025-10-02 13:40:27.08766	2025-10-02 13:40:27.08766	H4sIAAAAAAAAA52PSxKDIBBE78I6I+JfT5FNDjAjo5JCoQDdpHL3mHiD7Lv7vX4Jv7jkHsGKQSwp+ThIGZMLOHM2OzdbRm9iNrpVBvbWJHD0/AYYxlKVtaICFDJBpYscesQJUNdUqWLKqWtl5oM5MLHcN3NwiGjhR4wSuzxvNGtou/asc1sCUYnQsdINNaMm1Yvb5XfHtJyCf4+kZV9pQ2Ovo+L9Af9+eYv4AAAA	\N	\N	photo	\N
66	property	6	exterior_views	IMG_20230116_154633	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/universal-photos/196bf03a-5456-4ef6-9886-8818a0c034f5	/universal-photos/196bf03a-5456-4ef6-9886-8818a0c034f5	4000x1800	4000x1800	95	3615558	\N	\N	85	image/jpeg	\N	t	f	1	\N	\N	admin	t	\N	2025-10-02 13:40:32.947957	2025-10-02 13:40:32.947957	H4sIAAAAAAAAA52PSxKDIBAF78I6IyBg0FNkkwMMCkoKhQJ0k8rd8/EG2b/q7vckaYk13nMgA1lqTWWgtNSYcbbNHOMcLCZfmjGuNNsUfIVoHt+BhVFwobhpgaM1IKeWQY/oACdlJG8dM/pKm5T9gdXSffOHzQUD/IyF8r4zjgkEJVUH0roOeq070JprZCMT0ilyOftuWJdP4N+Quuyr2dCH8yh5vQFSlh16+AAAAA==	\N	\N	photo	\N
67	property	6	exterior_views	IMG_20230116_154733	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/universal-photos/23c8f9f5-90ba-429b-95c4-725ad845ad4a	/universal-photos/23c8f9f5-90ba-429b-95c4-725ad845ad4a	4000x1800	4000x1800	95	4986514	\N	\N	85	image/jpeg	\N	t	f	1	\N	\N	admin	t	\N	2025-10-02 13:40:38.852564	2025-10-02 13:40:38.852564	H4sIAAAAAAAAA52PQQ6DIBRE78K6XxQhiqfopgf4IAgNCgF00/TutfUG3cxqMu/NiyQXa3zkQCbiak1lorTUmHExzRLjEgwmXxodV5pNCr5CVM9vwYDuu150ikGHRgGfWQsS0QLOQvGO2VaNA21S9gdWQ/fNHyYXDPAjFsp6PVppBchWIXAmFUihOQxM4DzyMziS2+V3x+pOwb9HqttXtaEP11Hy/gCD+DLi+AAAAA==	\N	\N	photo	\N
68	property	6	exterior_views	IMG_20230116_155256	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/universal-photos/45217999-13ff-4231-a43d-05efbc7bee7a	/universal-photos/45217999-13ff-4231-a43d-05efbc7bee7a	4000x1800	4000x1800	95	5061876	\N	\N	85	image/jpeg	\N	t	f	1	\N	\N	admin	t	\N	2025-10-02 13:40:44.324961	2025-10-02 13:40:44.324961	H4sIAAAAAAAAA52PSxKDIBAF78I6I/Iro6fIJgcYdFBSKBSgm1Tuno83yP5Vd78nS0us8Z4DG9hSayoD56XGjDM1c4xzIEy+NGNceaYUfIVoH98BwaiEMsJKEEgW9CRb6BEd4GSsFtK19trxJmV/YCW+b/6gXDDAz1i4NlJ0fd+DUM6BlkoAajVBa8jZsbNEHbLL2XfDunwC/4bUZV/thj6cR9nrDZK2bbX4AAAA	\N	\N	photo	\N
69	property	6	exterior_views	IMG_20230116_155406	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/universal-photos/5829a567-761e-4198-8c3e-ef9f37913917	/universal-photos/5829a567-761e-4198-8c3e-ef9f37913917	4000x1800	4000x1800	95	4826141	\N	\N	85	image/jpeg	\N	t	f	1	\N	\N	admin	t	\N	2025-10-02 13:40:50.21715	2025-10-02 13:40:50.21715	H4sIAAAAAAAAA52PSxKDIBAF78I6IwIq4imyyQEGHZUUBgrQTSp3z8cbZP+qu9+TxTWUcEueDWwtJeaB81xCwoWqJYTFE0aXqzFsPFH0rkCw9++AYFRCtcJKEEgWmknWYBBnwKm1jZBzbXvNq5jcgYX4/nAHpYwefsbM214abDsNuhMEjTA99KMioNnMShuhjNDscvZdsayfwL8hZd03+0Dnz6Ps9QZx5qmc+AAAAA==	\N	\N	photo	\N
70	property	6	exterior_views	IMG_20230116_155423	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/universal-photos/73713485-1784-4d2d-a23f-f185f9910794	/universal-photos/73713485-1784-4d2d-a23f-f185f9910794	4000x1800	4000x1800	95	5110659	\N	\N	85	image/jpeg	\N	t	f	1	\N	\N	admin	t	\N	2025-10-02 13:40:56.213765	2025-10-02 13:40:56.213765	H4sIAAAAAAAAA52PwRGDIBREe+GcLyI4oFXkkgI+CkIGhQH0kknvibGD3Hf3vX2R5GKNjxzISFytqYyUlhozLqZZYlyCweRLM8WVZpOCrxD18wwYmDjjPdMdMDQaxNy1MCBawLnXgnW21UrSJmV/YDV03/xhcsEAP2KhkkvGheqBSSXO+gzYcQuWqd4OA2vlIMjt8rtjdV/Bv0eq21e9oQ/XUfL+AJS8sWD4AAAA	\N	\N	photo	\N
71	property	6	exterior_views	IMG_20230116_155430	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/universal-photos/485e71f8-33f1-475f-a965-76e18d8988d3	/universal-photos/485e71f8-33f1-475f-a965-76e18d8988d3	4000x1800	4000x1800	95	5315146	\N	\N	85	image/jpeg	\N	t	f	1	\N	\N	admin	t	\N	2025-10-02 13:41:01.795215	2025-10-02 13:41:01.795215	H4sIAAAAAAAAA52PQRKDIBAE/8I5KyKi6CtyyQMWXZUUCgXoJZW/x8Qf5D4z3fNiYfHZP6JjPVtyDqnnPGUfcaZi9n52hMGmYvArjxSczeDN8xsgGKSQSpgKBJKBeqxK6BAnwFGZWlRTaXTLixDtgZn4vtmDYkIHP2LitVbUikmDlJOAulVns2sUtA0JPepO61Gy2+V3x7ycgn+P5GVfzYbWXUfZ+wMGwVEr+AAAAA==	\N	\N	photo	\N
72	property	6	exterior_views	IMG_20230116_155516	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/universal-photos/a9fe8b5b-2f16-420a-8ed7-8ad0db4507cd	/universal-photos/a9fe8b5b-2f16-420a-8ed7-8ad0db4507cd	4000x1800	4000x1800	95	4984304	\N	\N	85	image/jpeg	\N	t	f	1	\N	\N	admin	t	\N	2025-10-02 13:41:07.235015	2025-10-02 13:41:07.235015	H4sIAAAAAAAAA52PSxKCMBAF75K1Qz6AIKdw4wFmyACxgkklgY3l3f1wA/evuvs9RVxCCbfkxSCWUmIepMwlJJy5mkOYPWN0uRrDKhNH7woEun8HDGOt61aTAY1M0Fij4II4AdqWGm0mRX0nq5jcjoXl9nA7p4wefsYs8TJxTy2BmfQZGqMQerYd9GiVpaZV3WjF6ei7Ylk+gX9DyrKt9EDnj6Pi9QY73WgX+AAAAA==	\N	\N	photo	\N
73	property	6	exterior_views	IMG_20230116_155750	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/universal-photos/ec3badda-f952-4561-906f-13d329ec92ea	/universal-photos/ec3badda-f952-4561-906f-13d329ec92ea	1800x4000	1800x4000	95	4185271	\N	\N	85	image/jpeg	\N	t	f	1	\N	\N	admin	t	\N	2025-10-02 13:41:12.797301	2025-10-02 13:41:12.797301	H4sIAAAAAAAAA52PSxKDIBAF78I6IwJqgqfIJgcYYFRSGChAN6ncPR9vkP2r7n5PlpZY4y0HNrKl1lRGzkuNGWdq5hjnQJh8aWxceaYUfIVo7t8BgVVC9cJIEEgGOidb0IgToOtNJ+TUmsuZNyn7HSvx7eF3ygUD/IyFk1UGnUOYdC+h6wcBuh0mEMopqclqSchOR98V6/IJ/BtSl201D/ThOMpeb4SSxfv4AAAA	\N	\N	photo	\N
74	property	6	exterior_views	IMG_20230116_155910	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/universal-photos/67613969-ff09-4df6-932a-30e9805c86fe	/universal-photos/67613969-ff09-4df6-932a-30e9805c86fe	4000x1800	4000x1800	95	4965154	\N	\N	85	image/jpeg	\N	t	f	1	\N	\N	admin	t	\N	2025-10-02 13:41:18.191794	2025-10-02 13:41:18.191794	H4sIAAAAAAAAA52PQRaCIBRF98K4LyCK0iqatICPfpQOBQfISae9Z7mD5u+9e9+LpTXWeM2BndlaaypnzkuNGRdqlhiXQJh8aaZ455lS8BWivX0DBJOSqpe2BYlkoZtbAQbRAc697WTrhB0H3qTsN6zEnw+/US4Y4EcsXA9aKqMNOCfMXncajGoRlCAzin4atSN2OvwuWNdd8O+Ruj7v9oE+HEfZ+wOfukhM+AAAAA==	\N	\N	photo	\N
75	property	6	exterior_views	IMG_20230116_160151	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/universal-photos/998a843e-9678-4635-8bb8-0cb99b2eacc0	/universal-photos/998a843e-9678-4635-8bb8-0cb99b2eacc0	2160x3840	2160x3840	95	3534676	\N	\N	85	image/jpeg	\N	t	f	1	\N	\N	admin	t	\N	2025-10-02 13:41:23.609042	2025-10-02 13:41:23.609042	H4sIAAAAAAAAA52PSxKDIBAF78I6I/4FT5FNDjCDo5LCQAG6SeXu+XiD7F9193uKsPrsb9GJUaw5hzRKmbKPuHCxeL84xmBTYfwmIwdnM3i6fwcMpqmarqIaKmSCdqpL0Igz4NRRW9VzSWqQRYj2wMxyf9iDY0IHP2OSWitUbcOg+0FB2zcdKCIFpSGtqWY0phSXs++Kef0E/g3J677RA607j4rXG/gpwIn4AAAA	\N	\N	photo	\N
76	property	6	exterior_views	IMG_20230116_160152	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/universal-photos/dae910a5-3c67-4e16-83a6-8dbf6ecdd935	/universal-photos/dae910a5-3c67-4e16-83a6-8dbf6ecdd935	2160x3840	2160x3840	95	3247829	\N	\N	85	image/jpeg	\N	t	f	1	\N	\N	admin	t	\N	2025-10-02 13:41:28.965294	2025-10-02 13:41:28.965294	H4sIAAAAAAAAA52PSxKDIBBE78I6IyL+T5FNDjDAqKRQKEA3qdw9Jt4gm1519Xv9YmHx2T+iYyNbcg5p5DxlH3GmYvZ+doTBpkL7lUcKzmbw6vktEGgpZCNUBQJJQW2qEgbECdA0qhbVVKq+40WI9sBMfN/sQTGhgx8xcYM0iBIbkLrtoCbRQi/xDKOmlrQxg2zY7fK7Y15Owb9H8rKvakPrrqPs/QEtz5Jm+AAAAA==	\N	\N	photo	\N
77	property	6	exterior_views	IMG_20230116_160156	https://storage.googleapis.com/replit-objstore-c31351b2-1aeb-4d20-9aaf-ad5b412f0b87/.private/universal-photos/e8fe55e0-8be5-468d-844c-40414dc7d920	/universal-photos/e8fe55e0-8be5-468d-844c-40414dc7d920	2160x3840	2160x3840	95	2512785	\N	\N	85	image/jpeg	\N	t	f	1	\N	\N	admin	t	\N	2025-10-02 13:41:34.174199	2025-10-02 13:41:34.174199	H4sIAAAAAAAAA52PSxLCIBAF78LaCZ+AkpzCjQcYwiTBwkABurG8u5/cwP2r7n5PltfU0qVENrK1tVxHzmtLBRfqlpSWSJhD7aZ044VyDA2Su34HBFMveyOdAonkQHslYECcAb1xWqpZOHviXS7hgY34fQsPKhUj/IyVk53JGBJgHRnQR+vBaj2BFlpqP538oAQ77H1nbOsn8G9IW+83t2GI+1H2egMXSuDD+AAAAA==	\N	\N	photo	\N
\.


--
-- Data for Name: user_property_access; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_property_access (id, user_id, property_id, role, permissions, is_active, assigned_by, assigned_at, created_at, updated_at) FROM stdin;
1	14	2	owner	["read", "write"]	t	\N	2025-09-30 08:19:43.950001	2025-09-30 08:19:43.950001	2025-09-30 08:19:43.950001
2	14	6	owner	["read", "write"]	t	\N	2025-09-30 08:19:43.949339	2025-09-30 08:19:43.949339	2025-09-30 08:19:43.949339
3	14	3	manager	["read", "write"]	t	\N	2025-09-30 08:27:09.553503	2025-09-30 08:27:09.553503	2025-09-30 08:27:09.553503
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, phone_number, password, name, gender, date_of_birth, company_name, gst_number, permanent_address, billing_address, preferred_room_type, preferred_language, special_requests, notification_preferences, social_accounts, referral_code, emergency_contact_name, emergency_contact_number, profile_photo, role, role_id, is_verified, created_at, updated_at) FROM stdin;
10	admin@pyolliv.com	+91-9876543210	\N	Py Olliv Admin	male	\N	Py Olliv Hotels	\N	\N	\N	\N	English	\N	\N	\N	\N	\N	\N	\N	admin	\N	t	2025-09-06 07:20:02.588422	2025-09-06 07:20:02.588422
11	manager@pyolliv.com	+91-9876543211	\N	Hotel Manager	female	\N	\N	\N	\N	\N	\N	English	\N	\N	\N	\N	\N	\N	\N	manager	\N	t	2025-09-06 07:20:02.588422	2025-09-06 07:20:02.588422
12	guest@example.com	+91-9876543212	\N	John Smith	male	\N	\N	\N	\N	\N	\N	English	\N	\N	\N	\N	\N	\N	\N	guest	\N	t	2025-09-06 07:20:02.588422	2025-09-06 07:20:02.588422
13	admin@system.com	9999999999	\N	System Admin	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	admin	\N	f	2025-09-24 07:32:23.24453	2025-09-24 07:32:23.24453
14	accounts@microgenn.com	+919363150105	abc12345	senthil	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	guest	\N	t	2025-09-30 07:46:19.275216	2025-09-30 07:46:19.275216
\.


--
-- Data for Name: wallet_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.wallet_transactions (id, wallet_id, type, amount, description, reference_id, status, created_at) FROM stdin;
\.


--
-- Data for Name: wallets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.wallets (id, user_id, balance, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: wishlists; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.wishlists (id, user_id, property_id, created_at) FROM stdin;
\.


--
-- Name: audit_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_log_id_seq', 1, false);


--
-- Name: booking_guest_details_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.booking_guest_details_id_seq', 10, true);


--
-- Name: bookings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.bookings_id_seq', 53, true);


--
-- Name: currency_master_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.currency_master_id_seq', 18, true);


--
-- Name: customer_review_ratings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.customer_review_ratings_id_seq', 30, true);


--
-- Name: enhanced_bookings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.enhanced_bookings_id_seq', 1, false);


--
-- Name: franchise_inquiries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.franchise_inquiries_id_seq', 1, false);


--
-- Name: general_ledger_master_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.general_ledger_master_id_seq', 3, true);


--
-- Name: guest_details_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.guest_details_id_seq', 1, false);


--
-- Name: guest_master_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.guest_master_id_seq', 9, true);


--
-- Name: hotel_star_ratings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.hotel_star_ratings_id_seq', 30, true);


--
-- Name: loyalty_program_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.loyalty_program_id_seq', 2, true);


--
-- Name: meal_inclusion_master_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.meal_inclusion_master_id_seq', 1, false);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- Name: plan_master_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.plan_master_id_seq', 7, true);


--
-- Name: plan_meal_inclusions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.plan_meal_inclusions_id_seq', 1, false);


--
-- Name: plan_property_pricing_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.plan_property_pricing_id_seq', 1, false);


--
-- Name: policy_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.policy_templates_id_seq', 18, true);


--
-- Name: promotions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.promotions_id_seq', 1, false);


--
-- Name: properties_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.properties_id_seq', 9, true);


--
-- Name: property_amenities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.property_amenities_id_seq', 84, true);


--
-- Name: property_areas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.property_areas_id_seq', 63, true);


--
-- Name: property_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.property_categories_id_seq', 60, true);


--
-- Name: rate_master_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.rate_master_id_seq', 1188, true);


--
-- Name: reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reviews_id_seq', 1, false);


--
-- Name: role_master_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.role_master_id_seq', 2, true);


--
-- Name: room_inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.room_inventory_id_seq', 231, true);


--
-- Name: room_photos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.room_photos_id_seq', 72, true);


--
-- Name: room_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.room_types_id_seq', 24, true);


--
-- Name: room_views_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.room_views_id_seq', 36, true);


--
-- Name: subledger_master_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.subledger_master_id_seq', 3, true);


--
-- Name: tariff_setup_master_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tariff_setup_master_id_seq', 8, true);


--
-- Name: trans_booking_det_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.trans_booking_det_id_seq', 1, false);


--
-- Name: trans_booking_detaildatewise_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.trans_booking_detaildatewise_id_seq', 1, false);


--
-- Name: trans_booking_mas_mas_billing_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.trans_booking_mas_mas_billing_id_seq', 1, false);


--
-- Name: universal_photos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.universal_photos_id_seq', 77, true);


--
-- Name: user_property_access_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_property_access_id_seq', 3, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 14, true);


--
-- Name: wallet_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.wallet_transactions_id_seq', 1, false);


--
-- Name: wallets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.wallets_id_seq', 1, false);


--
-- Name: wishlists_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.wishlists_id_seq', 1, false);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: booking_guest_details booking_guest_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_guest_details
    ADD CONSTRAINT booking_guest_details_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_booking_reference_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_booking_reference_unique UNIQUE (booking_reference);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: currency_master currency_master_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currency_master
    ADD CONSTRAINT currency_master_pkey PRIMARY KEY (id);


--
-- Name: currency_master currency_master_short_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currency_master
    ADD CONSTRAINT currency_master_short_name_unique UNIQUE (short_name);


--
-- Name: customer_review_ratings customer_review_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_review_ratings
    ADD CONSTRAINT customer_review_ratings_pkey PRIMARY KEY (id);


--
-- Name: enhanced_bookings enhanced_bookings_booking_reference_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enhanced_bookings
    ADD CONSTRAINT enhanced_bookings_booking_reference_unique UNIQUE (booking_reference);


--
-- Name: enhanced_bookings enhanced_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enhanced_bookings
    ADD CONSTRAINT enhanced_bookings_pkey PRIMARY KEY (id);


--
-- Name: franchise_inquiries franchise_inquiries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.franchise_inquiries
    ADD CONSTRAINT franchise_inquiries_pkey PRIMARY KEY (id);


--
-- Name: general_ledger_master general_ledger_master_account_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.general_ledger_master
    ADD CONSTRAINT general_ledger_master_account_code_unique UNIQUE (account_code);


--
-- Name: general_ledger_master general_ledger_master_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.general_ledger_master
    ADD CONSTRAINT general_ledger_master_pkey PRIMARY KEY (id);


--
-- Name: general_ledger_master general_ledger_master_short_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.general_ledger_master
    ADD CONSTRAINT general_ledger_master_short_name_unique UNIQUE (short_name);


--
-- Name: guest_details guest_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_details
    ADD CONSTRAINT guest_details_pkey PRIMARY KEY (id);


--
-- Name: guest_master guest_master_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_master
    ADD CONSTRAINT guest_master_email_unique UNIQUE (email);


--
-- Name: guest_master guest_master_guest_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_master
    ADD CONSTRAINT guest_master_guest_code_unique UNIQUE (guest_code);


--
-- Name: guest_master guest_master_phone_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_master
    ADD CONSTRAINT guest_master_phone_number_unique UNIQUE (phone_number);


--
-- Name: guest_master guest_master_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_master
    ADD CONSTRAINT guest_master_pkey PRIMARY KEY (id);


--
-- Name: hotel_star_ratings hotel_star_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hotel_star_ratings
    ADD CONSTRAINT hotel_star_ratings_pkey PRIMARY KEY (id);


--
-- Name: loyalty_program loyalty_program_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_program
    ADD CONSTRAINT loyalty_program_pkey PRIMARY KEY (id);


--
-- Name: meal_inclusion_master meal_inclusion_master_meal_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meal_inclusion_master
    ADD CONSTRAINT meal_inclusion_master_meal_code_unique UNIQUE (meal_code);


--
-- Name: meal_inclusion_master meal_inclusion_master_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meal_inclusion_master
    ADD CONSTRAINT meal_inclusion_master_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: plan_master plan_master_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_master
    ADD CONSTRAINT plan_master_pkey PRIMARY KEY (id);


--
-- Name: plan_master plan_master_plan_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_master
    ADD CONSTRAINT plan_master_plan_code_unique UNIQUE (plan_code);


--
-- Name: plan_meal_inclusions plan_meal_inclusions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_meal_inclusions
    ADD CONSTRAINT plan_meal_inclusions_pkey PRIMARY KEY (id);


--
-- Name: plan_property_pricing plan_property_pricing_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_property_pricing
    ADD CONSTRAINT plan_property_pricing_pkey PRIMARY KEY (id);


--
-- Name: policy_templates policy_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policy_templates
    ADD CONSTRAINT policy_templates_pkey PRIMARY KEY (id);


--
-- Name: promotions promotions_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_code_unique UNIQUE (code);


--
-- Name: promotions promotions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_pkey PRIMARY KEY (id);


--
-- Name: properties properties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_pkey PRIMARY KEY (id);


--
-- Name: property_amenities property_amenities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_amenities
    ADD CONSTRAINT property_amenities_pkey PRIMARY KEY (id);


--
-- Name: property_areas property_areas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_areas
    ADD CONSTRAINT property_areas_pkey PRIMARY KEY (id);


--
-- Name: property_categories property_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property_categories
    ADD CONSTRAINT property_categories_pkey PRIMARY KEY (id);


--
-- Name: rate_master rate_master_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_master
    ADD CONSTRAINT rate_master_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: role_master role_master_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_master
    ADD CONSTRAINT role_master_pkey PRIMARY KEY (id);


--
-- Name: role_master role_master_role_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_master
    ADD CONSTRAINT role_master_role_code_unique UNIQUE (role_code);


--
-- Name: role_master role_master_role_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_master
    ADD CONSTRAINT role_master_role_name_unique UNIQUE (role_name);


--
-- Name: room_inventory room_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_inventory
    ADD CONSTRAINT room_inventory_pkey PRIMARY KEY (id);


--
-- Name: room_photos room_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_photos
    ADD CONSTRAINT room_photos_pkey PRIMARY KEY (id);


--
-- Name: room_types room_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_types
    ADD CONSTRAINT room_types_pkey PRIMARY KEY (id);


--
-- Name: room_views room_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_views
    ADD CONSTRAINT room_views_pkey PRIMARY KEY (id);


--
-- Name: subledger_master subledger_master_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subledger_master
    ADD CONSTRAINT subledger_master_pkey PRIMARY KEY (id);


--
-- Name: subledger_master subledger_master_short_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subledger_master
    ADD CONSTRAINT subledger_master_short_name_unique UNIQUE (short_name);


--
-- Name: subledger_master subledger_master_subledger_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subledger_master
    ADD CONSTRAINT subledger_master_subledger_code_unique UNIQUE (subledger_code);


--
-- Name: tariff_setup_master tariff_setup_master_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tariff_setup_master
    ADD CONSTRAINT tariff_setup_master_pkey PRIMARY KEY (id);


--
-- Name: trans_booking_det trans_booking_det_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trans_booking_det
    ADD CONSTRAINT trans_booking_det_pkey PRIMARY KEY (id);


--
-- Name: trans_booking_detaildatewise trans_booking_detaildatewise_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trans_booking_detaildatewise
    ADD CONSTRAINT trans_booking_detaildatewise_pkey PRIMARY KEY (id);


--
-- Name: trans_booking_mas trans_booking_mas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trans_booking_mas
    ADD CONSTRAINT trans_booking_mas_pkey PRIMARY KEY (mas_billing_id);


--
-- Name: universal_photos universal_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.universal_photos
    ADD CONSTRAINT universal_photos_pkey PRIMARY KEY (id);


--
-- Name: user_property_access user_property_access_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_property_access
    ADD CONSTRAINT user_property_access_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_phone_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_number_unique UNIQUE (phone_number);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wallet_transactions wallet_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id);


--
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);


--
-- Name: wishlists wishlists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_property_id_properties_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id);


--
-- Name: audit_log audit_log_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: booking_guest_details booking_guest_details_booking_id_bookings_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_guest_details
    ADD CONSTRAINT booking_guest_details_booking_id_bookings_id_fk FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: booking_guest_details booking_guest_details_guest_detail_id_guest_details_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_guest_details
    ADD CONSTRAINT booking_guest_details_guest_detail_id_guest_details_id_fk FOREIGN KEY (guest_detail_id) REFERENCES public.guest_details(id) ON DELETE SET NULL;


--
-- Name: booking_guest_details booking_guest_details_guest_master_id_guest_master_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_guest_details
    ADD CONSTRAINT booking_guest_details_guest_master_id_guest_master_id_fk FOREIGN KEY (guest_master_id) REFERENCES public.guest_master(id) ON DELETE SET NULL;


--
-- Name: bookings bookings_property_id_properties_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id);


--
-- Name: bookings bookings_room_type_id_room_types_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_room_type_id_room_types_id_fk FOREIGN KEY (room_type_id) REFERENCES public.room_types(id);


--
-- Name: bookings bookings_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: enhanced_bookings enhanced_bookings_currency_id_currency_master_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enhanced_bookings
    ADD CONSTRAINT enhanced_bookings_currency_id_currency_master_id_fk FOREIGN KEY (currency_id) REFERENCES public.currency_master(id);


--
-- Name: enhanced_bookings enhanced_bookings_plan_master_id_plan_master_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enhanced_bookings
    ADD CONSTRAINT enhanced_bookings_plan_master_id_plan_master_id_fk FOREIGN KEY (plan_master_id) REFERENCES public.plan_master(id);


--
-- Name: enhanced_bookings enhanced_bookings_property_id_properties_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enhanced_bookings
    ADD CONSTRAINT enhanced_bookings_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id);


--
-- Name: enhanced_bookings enhanced_bookings_room_type_id_room_types_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enhanced_bookings
    ADD CONSTRAINT enhanced_bookings_room_type_id_room_types_id_fk FOREIGN KEY (room_type_id) REFERENCES public.room_types(id);


--
-- Name: guest_details guest_details_guest_master_id_guest_master_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_details
    ADD CONSTRAINT guest_details_guest_master_id_guest_master_id_fk FOREIGN KEY (guest_master_id) REFERENCES public.guest_master(id) ON DELETE CASCADE;


--
-- Name: guest_master guest_master_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guest_master
    ADD CONSTRAINT guest_master_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: loyalty_program loyalty_program_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_program
    ADD CONSTRAINT loyalty_program_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: notifications notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: plan_meal_inclusions plan_meal_inclusions_meal_inclusion_id_meal_inclusion_master_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_meal_inclusions
    ADD CONSTRAINT plan_meal_inclusions_meal_inclusion_id_meal_inclusion_master_id FOREIGN KEY (meal_inclusion_id) REFERENCES public.meal_inclusion_master(id) ON DELETE CASCADE;


--
-- Name: plan_meal_inclusions plan_meal_inclusions_plan_id_plan_master_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_meal_inclusions
    ADD CONSTRAINT plan_meal_inclusions_plan_id_plan_master_id_fk FOREIGN KEY (plan_id) REFERENCES public.plan_master(id) ON DELETE CASCADE;


--
-- Name: plan_property_pricing plan_property_pricing_plan_id_plan_master_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_property_pricing
    ADD CONSTRAINT plan_property_pricing_plan_id_plan_master_id_fk FOREIGN KEY (plan_id) REFERENCES public.plan_master(id) ON DELETE CASCADE;


--
-- Name: plan_property_pricing plan_property_pricing_property_id_properties_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_property_pricing
    ADD CONSTRAINT plan_property_pricing_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: properties properties_approved_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_approved_by_users_id_fk FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: properties properties_category_id_property_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_category_id_property_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.property_categories(id);


--
-- Name: properties properties_currency_id_currency_master_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_currency_id_currency_master_id_fk FOREIGN KEY (currency_id) REFERENCES public.currency_master(id);


--
-- Name: properties properties_customer_review_rating_id_customer_review_ratings_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_customer_review_rating_id_customer_review_ratings_id FOREIGN KEY (customer_review_rating_id) REFERENCES public.customer_review_ratings(id);


--
-- Name: properties properties_hotel_star_rating_id_hotel_star_ratings_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_hotel_star_rating_id_hotel_star_ratings_id_fk FOREIGN KEY (hotel_star_rating_id) REFERENCES public.hotel_star_ratings(id);


--
-- Name: properties properties_property_area_id_property_areas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_property_area_id_property_areas_id_fk FOREIGN KEY (property_area_id) REFERENCES public.property_areas(id);


--
-- Name: rate_master rate_master_currency_id_currency_master_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_master
    ADD CONSTRAINT rate_master_currency_id_currency_master_id_fk FOREIGN KEY (currency_id) REFERENCES public.currency_master(id);


--
-- Name: rate_master rate_master_property_id_properties_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_master
    ADD CONSTRAINT rate_master_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: rate_master rate_master_room_type_id_room_types_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_master
    ADD CONSTRAINT rate_master_room_type_id_room_types_id_fk FOREIGN KEY (room_type_id) REFERENCES public.room_types(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_booking_id_bookings_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_booking_id_bookings_id_fk FOREIGN KEY (booking_id) REFERENCES public.bookings(id);


--
-- Name: reviews reviews_property_id_properties_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id);


--
-- Name: reviews reviews_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: role_master role_master_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_master
    ADD CONSTRAINT role_master_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: room_inventory room_inventory_property_id_properties_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_inventory
    ADD CONSTRAINT room_inventory_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id);


--
-- Name: room_inventory room_inventory_room_type_id_room_types_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_inventory
    ADD CONSTRAINT room_inventory_room_type_id_room_types_id_fk FOREIGN KEY (room_type_id) REFERENCES public.room_types(id);


--
-- Name: room_photos room_photos_room_type_id_room_types_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_photos
    ADD CONSTRAINT room_photos_room_type_id_room_types_id_fk FOREIGN KEY (room_type_id) REFERENCES public.room_types(id);


--
-- Name: room_types room_types_property_id_properties_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_types
    ADD CONSTRAINT room_types_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id);


--
-- Name: room_types room_types_room_view_id_room_views_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_types
    ADD CONSTRAINT room_types_room_view_id_room_views_id_fk FOREIGN KEY (room_view_id) REFERENCES public.room_views(id);


--
-- Name: tariff_setup_master tariff_setup_master_cgst_subledger_id_subledger_master_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tariff_setup_master
    ADD CONSTRAINT tariff_setup_master_cgst_subledger_id_subledger_master_id_fk FOREIGN KEY (cgst_subledger_id) REFERENCES public.subledger_master(id);


--
-- Name: tariff_setup_master tariff_setup_master_sgst_subledger_id_subledger_master_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tariff_setup_master
    ADD CONSTRAINT tariff_setup_master_sgst_subledger_id_subledger_master_id_fk FOREIGN KEY (sgst_subledger_id) REFERENCES public.subledger_master(id);


--
-- Name: tariff_setup_master tariff_setup_master_subledger_id_subledger_master_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tariff_setup_master
    ADD CONSTRAINT tariff_setup_master_subledger_id_subledger_master_id_fk FOREIGN KEY (subledger_id) REFERENCES public.subledger_master(id);


--
-- Name: trans_booking_det trans_booking_det_mas_billing_id_trans_booking_mas_mas_billing_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trans_booking_det
    ADD CONSTRAINT trans_booking_det_mas_billing_id_trans_booking_mas_mas_billing_ FOREIGN KEY (mas_billing_id) REFERENCES public.trans_booking_mas(mas_billing_id) ON DELETE CASCADE;


--
-- Name: trans_booking_det trans_booking_det_property_id_properties_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trans_booking_det
    ADD CONSTRAINT trans_booking_det_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id);


--
-- Name: trans_booking_det trans_booking_det_room_type_id_room_types_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trans_booking_det
    ADD CONSTRAINT trans_booking_det_room_type_id_room_types_id_fk FOREIGN KEY (room_type_id) REFERENCES public.room_types(id);


--
-- Name: trans_booking_detaildatewise trans_booking_detaildatewise_mas_billing_id_trans_booking_mas_m; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trans_booking_detaildatewise
    ADD CONSTRAINT trans_booking_detaildatewise_mas_billing_id_trans_booking_mas_m FOREIGN KEY (mas_billing_id) REFERENCES public.trans_booking_mas(mas_billing_id) ON DELETE CASCADE;


--
-- Name: trans_booking_detaildatewise trans_booking_detaildatewise_property_id_properties_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trans_booking_detaildatewise
    ADD CONSTRAINT trans_booking_detaildatewise_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id);


--
-- Name: trans_booking_detaildatewise trans_booking_detaildatewise_room_type_id_room_types_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trans_booking_detaildatewise
    ADD CONSTRAINT trans_booking_detaildatewise_room_type_id_room_types_id_fk FOREIGN KEY (room_type_id) REFERENCES public.room_types(id);


--
-- Name: trans_booking_mas trans_booking_mas_guest_id_guest_master_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trans_booking_mas
    ADD CONSTRAINT trans_booking_mas_guest_id_guest_master_id_fk FOREIGN KEY (guest_id) REFERENCES public.guest_master(id);


--
-- Name: trans_booking_mas trans_booking_mas_property_id_properties_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trans_booking_mas
    ADD CONSTRAINT trans_booking_mas_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id);


--
-- Name: user_property_access user_property_access_assigned_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_property_access
    ADD CONSTRAINT user_property_access_assigned_by_users_id_fk FOREIGN KEY (assigned_by) REFERENCES public.users(id);


--
-- Name: user_property_access user_property_access_property_id_properties_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_property_access
    ADD CONSTRAINT user_property_access_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;


--
-- Name: user_property_access user_property_access_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_property_access
    ADD CONSTRAINT user_property_access_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: wallet_transactions wallet_transactions_wallet_id_wallets_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_wallet_id_wallets_id_fk FOREIGN KEY (wallet_id) REFERENCES public.wallets(id);


--
-- Name: wallets wallets_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: wishlists wishlists_property_id_properties_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id);


--
-- Name: wishlists wishlists_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict XpdYZ5bagICMMbTfKYzCYFKLQQrAVMvt4CatrWdrt2C5UgSlogH5HWX0gobsi3C

