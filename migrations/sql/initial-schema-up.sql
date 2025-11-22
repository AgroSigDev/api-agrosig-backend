--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

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
-- Name: tiger; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA tiger;


ALTER SCHEMA tiger OWNER TO postgres;

--
-- Name: tiger_data; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA tiger_data;


ALTER SCHEMA tiger_data OWNER TO postgres;

--
-- Name: topology; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA topology;


ALTER SCHEMA topology OWNER TO postgres;

--
-- Name: SCHEMA topology; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA topology IS 'PostGIS Topology schema';


--
-- Name: address_standardizer; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS address_standardizer WITH SCHEMA public;


--
-- Name: EXTENSION address_standardizer; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION address_standardizer IS 'Used to parse an address into constituent elements. Generally used to support geocoding address normalization step.';


--
-- Name: address_standardizer_data_us; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS address_standardizer_data_us WITH SCHEMA public;


--
-- Name: EXTENSION address_standardizer_data_us; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION address_standardizer_data_us IS 'Address Standardizer US dataset example';


--
-- Name: fuzzystrmatch; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA public;


--
-- Name: EXTENSION fuzzystrmatch; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION fuzzystrmatch IS 'determine similarities and distance between strings';


--
-- Name: h3; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS h3 WITH SCHEMA public;


--
-- Name: EXTENSION h3; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION h3 IS 'H3 bindings for PostgreSQL';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: postgis_raster; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_raster WITH SCHEMA public;


--
-- Name: EXTENSION postgis_raster; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_raster IS 'PostGIS raster types and functions';


--
-- Name: h3_postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS h3_postgis WITH SCHEMA public;


--
-- Name: EXTENSION h3_postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION h3_postgis IS 'H3 PostGIS integration';


--
-- Name: ogr_fdw; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS ogr_fdw WITH SCHEMA public;


--
-- Name: EXTENSION ogr_fdw; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION ogr_fdw IS 'foreign-data wrapper for GIS data access';


--
-- Name: pgrouting; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgrouting WITH SCHEMA public;


--
-- Name: EXTENSION pgrouting; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgrouting IS 'pgRouting Extension';


--
-- Name: pointcloud; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pointcloud WITH SCHEMA public;


--
-- Name: EXTENSION pointcloud; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pointcloud IS 'data type for lidar point clouds';


--
-- Name: pointcloud_postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pointcloud_postgis WITH SCHEMA public;


--
-- Name: EXTENSION pointcloud_postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pointcloud_postgis IS 'integration for pointcloud LIDAR data and PostGIS geometry data';


--
-- Name: postgis_sfcgal; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_sfcgal WITH SCHEMA public;


--
-- Name: EXTENSION postgis_sfcgal; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_sfcgal IS 'PostGIS SFCGAL functions';


--
-- Name: postgis_tiger_geocoder; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder WITH SCHEMA tiger;


--
-- Name: EXTENSION postgis_tiger_geocoder; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_tiger_geocoder IS 'PostGIS tiger geocoder and reverse geocoder';


--
-- Name: postgis_topology; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_topology WITH SCHEMA topology;


--
-- Name: EXTENSION postgis_topology; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_topology IS 'PostGIS topology spatial types and functions';


--
-- Name: register_user_plot(integer, character varying, text, numeric, text); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.register_user_plot(IN p_user_id integer, IN p_plot_name character varying, IN p_location text, IN p_area numeric, IN p_coordinates text)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_lat DOUBLE PRECISION;
    v_long DOUBLE PRECISION;
    v_lat_str TEXT;
    v_long_str TEXT;
    v_user_exists BOOLEAN;
BEGIN
    -- Verificar si el usuario existe
    SELECT EXISTS(SELECT 1 FROM users WHERE user_id = p_user_id) INTO v_user_exists;

    IF NOT v_user_exists THEN 
        RAISE EXCEPTION 'User with ID % does not exist', p_user_id;
    END IF;
    
    -- Verificar si el usuario ya tiene una parcela
    IF EXISTS (SELECT 1 FROM plots WHERE user_id = p_user_id) THEN
        RAISE EXCEPTION 'User already has a plot';
    END IF;
    
    -- Extraer partes de las coordenadas
    v_lat_str := SPLIT_PART(p_coordinates, ',', 1);
    v_long_str := SPLIT_PART(p_coordinates, ',', 2);
    
    -- Limpiar coordenadas (remover puntos adicionales)
    v_lat_str := REPLACE(v_lat_str, '..', '.');
    v_long_str := REPLACE(v_long_str, '..', '.');
    
    -- Convertir a números
    BEGIN
        v_lat := CAST(v_lat_str AS DOUBLE PRECISION);
        v_long := CAST(v_long_str AS DOUBLE PRECISION);
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Invalid coordinates format: %', p_coordinates;
    END;
    
    -- Validar rangos geográficos
    IF v_lat < -90 OR v_lat > 90 OR v_long < -180 OR v_long > 180 THEN
        RAISE EXCEPTION 'Coordinates out of range: Latitude (-90 to 90), Longitude (-180 to 180)';
    END IF;
    
    -- Validar que el área sea positiva
    IF p_area <= 0 THEN
        RAISE EXCEPTION 'Area must be a positive number';
    END IF;
    
    -- Insertar la parcela
    INSERT INTO plots (
        user_id, 
        plot_name, 
        location, 
        area, 
        geom, 
        is_active
    ) VALUES (
        p_user_id, 
        p_plot_name, 
        p_location, 
        p_area, 
        ST_SetSRID(ST_MakePoint(v_long, v_lat), 4326),
        TRUE
    );
    
    -- Actualizar estado del usuario
    UPDATE users SET configured_plot = TRUE WHERE user_id = p_user_id;
END;
$$;


ALTER PROCEDURE public.register_user_plot(IN p_user_id integer, IN p_plot_name character varying, IN p_location text, IN p_area numeric, IN p_coordinates text) OWNER TO postgres;

--
-- Name: soft_delete_user_crop(integer, integer); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.soft_delete_user_crop(IN c_user_id integer, IN c_crop_id integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Verificar y desactivar en una sola operación
    UPDATE crop SET is_active = FALSE 
    WHERE crop_id = c_crop_id 
      AND user_id = c_user_id
      AND is_active = TRUE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'El cultivo no existe, no pertenece al usuario o ya está inactivo';
    END IF;
    
    -- NOTA: Eliminé la línea que actualizaba 'cro' porque esa tabla no existe
    -- Si necesitas actualizar algo relacionado, debería ser en 'users' o 'plots'
END;
$$;


ALTER PROCEDURE public.soft_delete_user_crop(IN c_user_id integer, IN c_crop_id integer) OWNER TO postgres;

--
-- Name: soft_delete_user_plot(integer, integer); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.soft_delete_user_plot(IN p_user_id integer, IN p_plot_id integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Verificar y desactivar en una sola operación
    UPDATE plots SET is_active = FALSE 
    WHERE plot_id = p_plot_id 
      AND user_id = p_user_id
      AND is_active = TRUE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'La parcela no existe, no pertenece al usuario o ya está inactiva';
    END IF;
    
    -- Actualizar estado del usuario
    UPDATE users SET configured_plot = FALSE WHERE user_id = p_user_id;
END;
$$;


ALTER PROCEDURE public.soft_delete_user_plot(IN p_user_id integer, IN p_plot_id integer) OWNER TO postgres;

--
-- Name: update_user_plot(integer, integer, character varying, text, numeric, text); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.update_user_plot(IN p_user_id integer, IN p_plot_id integer, IN p_plot_name character varying, IN p_location text, IN p_area numeric, IN p_coordinates text)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_lat DOUBLE PRECISION;
    v_long DOUBLE PRECISION;
    v_lat_str TEXT;
    v_long_str TEXT;
    v_plot_exists BOOLEAN;
BEGIN
    -- Verificar que el plot existe y pertenece al usuario
    SELECT EXISTS(
        SELECT 1 FROM plots 
        WHERE plot_id = p_plot_id AND user_id = p_user_id AND is_active = true
    ) INTO v_plot_exists;

    IF NOT v_plot_exists THEN
        RAISE EXCEPTION 'Plot not found, inactive, or does not belong to user';
    END IF;

    -- Extraer y limpiar coordenadas
    v_lat_str := SPLIT_PART(p_coordinates, ',', 1);
    v_long_str := SPLIT_PART(p_coordinates, ',', 2);
    
    v_lat_str := REPLACE(v_lat_str, '..', '.');
    v_long_str := REPLACE(v_long_str, '..', '.');
    
    -- Convertir a números
    BEGIN
        v_lat := CAST(v_lat_str AS DOUBLE PRECISION);
        v_long := CAST(v_long_str AS DOUBLE PRECISION);
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Invalid coordinates format: %', p_coordinates;
    END;
    
    -- Validar rangos geográficos
    IF v_lat < -90 OR v_lat > 90 THEN
        RAISE EXCEPTION 'Latitude out of range (-90 to 90): %', v_lat;
    END IF;
    
    IF v_long < -180 OR v_long > 180 THEN
        RAISE EXCEPTION 'Longitude out of range (-180 to 180): %', v_long;
    END IF;
    
    -- Validar área
    IF p_area <= 0 THEN
        RAISE EXCEPTION 'Area must be a positive number';
    END IF;
    
    -- Actualizar la parcela
    UPDATE plots SET 
        plot_name = p_plot_name,
        location = p_location,
        area = p_area,
        geom = ST_SetSRID(ST_MakePoint(v_long, v_lat), 4326),
        updated_at = CURRENT_TIMESTAMP
    WHERE plot_id = p_plot_id AND user_id = p_user_id;
    
    -- Verificar que se actualizó
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Failed to update plot';
    END IF;
END;
$$;


ALTER PROCEDURE public.update_user_plot(IN p_user_id integer, IN p_plot_id integer, IN p_plot_name character varying, IN p_location text, IN p_area numeric, IN p_coordinates text) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity (
    activity_id integer NOT NULL,
    crop_id integer NOT NULL,
    user_id integer NOT NULL,
    activity_type text NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    description text,
    cost_total numeric DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.activity OWNER TO postgres;

--
-- Name: activity_activity_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.activity_activity_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_activity_id_seq OWNER TO postgres;

--
-- Name: activity_activity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.activity_activity_id_seq OWNED BY public.activity.activity_id;


--
-- Name: activity_branch; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_branch (
    branch_id integer NOT NULL,
    production_id integer NOT NULL,
    activity_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.activity_branch OWNER TO postgres;

--
-- Name: activity_branch_branch_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.activity_branch_branch_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_branch_branch_id_seq OWNER TO postgres;

--
-- Name: activity_branch_branch_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.activity_branch_branch_id_seq OWNED BY public.activity_branch.branch_id;


--
-- Name: comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comments (
    comment_id integer NOT NULL,
    user_id integer NOT NULL,
    message text NOT NULL,
    is_edited boolean DEFAULT false,
    is_deleted boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.comments OWNER TO postgres;

--
-- Name: comments_comment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comments_comment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comments_comment_id_seq OWNER TO postgres;

--
-- Name: comments_comment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comments_comment_id_seq OWNED BY public.comments.comment_id;


--
-- Name: crop; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.crop (
    crop_id integer NOT NULL,
    user_id integer NOT NULL,
    plot_id integer NOT NULL,
    crop_type text NOT NULL,
    crop_variety text,
    planting_date date,
    harvest_date date,
    is_active boolean DEFAULT true,
    cost_total numeric DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.crop OWNER TO postgres;

--
-- Name: crop_crop_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.crop_crop_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.crop_crop_id_seq OWNER TO postgres;

--
-- Name: crop_crop_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.crop_crop_id_seq OWNED BY public.crop.crop_id;


--
-- Name: input_used; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.input_used (
    input_id integer NOT NULL,
    activity_id integer NOT NULL,
    input_name character varying(255) NOT NULL,
    unit text NOT NULL,
    quantity numeric DEFAULT 0,
    unit_cost numeric DEFAULT 0,
    cost_unit text NOT NULL,
    base_unit text NOT NULL,
    conversion_factor numeric DEFAULT 1,
    cost_total numeric GENERATED ALWAYS AS (((quantity * unit_cost) * conversion_factor)) STORED,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.input_used OWNER TO postgres;

--
-- Name: input_used_input_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.input_used_input_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.input_used_input_id_seq OWNER TO postgres;

--
-- Name: input_used_input_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.input_used_input_id_seq OWNED BY public.input_used.input_id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    notification_id integer NOT NULL,
    user_id integer NOT NULL,
    type_notification character varying(255),
    title_notification character varying(255),
    message_notification text,
    status_notification text,
    link_notification text,
    sent_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_notification_id_seq OWNER TO postgres;

--
-- Name: notifications_notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_notification_id_seq OWNED BY public.notifications.notification_id;


--
-- Name: plot_climate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plot_climate (
    climate_id integer NOT NULL,
    plot_id integer NOT NULL,
    temperature numeric,
    humidity numeric,
    description text,
    precipitation numeric,
    wind_speed numeric,
    atmospheric_pressure numeric,
    wind_direction numeric,
    min_temp numeric,
    max_temp numeric,
    city_name character varying(255),
    date date NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.plot_climate OWNER TO postgres;

--
-- Name: plot_climate_climate_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.plot_climate_climate_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.plot_climate_climate_id_seq OWNER TO postgres;

--
-- Name: plot_climate_climate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.plot_climate_climate_id_seq OWNED BY public.plot_climate.climate_id;


--
-- Name: plots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plots (
    plot_id integer NOT NULL,
    user_id integer NOT NULL,
    plot_name character varying(255),
    location text,
    area numeric,
    geom public.geometry(Point,4326),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.plots OWNER TO postgres;

--
-- Name: plots_plot_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.plots_plot_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.plots_plot_id_seq OWNER TO postgres;

--
-- Name: plots_plot_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.plots_plot_id_seq OWNED BY public.plots.plot_id;


--
-- Name: production_batch; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.production_batch (
    production_id integer NOT NULL,
    crop_id integer NOT NULL,
    name text,
    unique_code text,
    creation_date date,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.production_batch OWNER TO postgres;

--
-- Name: production_batch_production_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.production_batch_production_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.production_batch_production_id_seq OWNER TO postgres;

--
-- Name: production_batch_production_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.production_batch_production_id_seq OWNED BY public.production_batch.production_id;


--
-- Name: qr_lote; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.qr_lote (
    qr_id integer NOT NULL,
    production_id integer,
    qr_code text,
    qr_data jsonb,
    generation_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.qr_lote OWNER TO postgres;

--
-- Name: qr_lote_qr_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.qr_lote_qr_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.qr_lote_qr_id_seq OWNER TO postgres;

--
-- Name: qr_lote_qr_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.qr_lote_qr_id_seq OWNED BY public.qr_lote.qr_id;


--
-- Name: role; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role (
    role_id integer NOT NULL,
    name character varying(255),
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.role OWNER TO postgres;

--
-- Name: role_role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.role_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.role_role_id_seq OWNER TO postgres;

--
-- Name: role_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.role_role_id_seq OWNED BY public.role.role_id;


--
-- Name: tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tokens (
    token_id integer NOT NULL,
    user_id integer NOT NULL,
    refresh_token text NOT NULL,
    is_revoked boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tokens OWNER TO postgres;

--
-- Name: tokens_token_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tokens_token_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tokens_token_id_seq OWNER TO postgres;

--
-- Name: tokens_token_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tokens_token_id_seq OWNED BY public.tokens.token_id;


--
-- Name: user_fcm_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_fcm_tokens (
    token_id integer NOT NULL,
    user_id integer NOT NULL,
    fcm_token text NOT NULL,
    device_type character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_fcm_tokens OWNER TO postgres;

--
-- Name: user_fcm_tokens_token_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_fcm_tokens_token_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_fcm_tokens_token_id_seq OWNER TO postgres;

--
-- Name: user_fcm_tokens_token_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_fcm_tokens_token_id_seq OWNED BY public.user_fcm_tokens.token_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    google_id text,
    role_id integer NOT NULL,
    first_name character varying(255),
    paternal_surname character varying(255),
    maternal_surname character varying(255),
    email character varying(255) NOT NULL,
    password text NOT NULL,
    image_user text,
    configured_plot boolean DEFAULT false,
    is_active boolean,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: activity activity_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity ALTER COLUMN activity_id SET DEFAULT nextval('public.activity_activity_id_seq'::regclass);


--
-- Name: activity_branch branch_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_branch ALTER COLUMN branch_id SET DEFAULT nextval('public.activity_branch_branch_id_seq'::regclass);


--
-- Name: comments comment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments ALTER COLUMN comment_id SET DEFAULT nextval('public.comments_comment_id_seq'::regclass);


--
-- Name: crop crop_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crop ALTER COLUMN crop_id SET DEFAULT nextval('public.crop_crop_id_seq'::regclass);


--
-- Name: input_used input_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.input_used ALTER COLUMN input_id SET DEFAULT nextval('public.input_used_input_id_seq'::regclass);


--
-- Name: notifications notification_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN notification_id SET DEFAULT nextval('public.notifications_notification_id_seq'::regclass);


--
-- Name: plot_climate climate_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plot_climate ALTER COLUMN climate_id SET DEFAULT nextval('public.plot_climate_climate_id_seq'::regclass);


--
-- Name: plots plot_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plots ALTER COLUMN plot_id SET DEFAULT nextval('public.plots_plot_id_seq'::regclass);


--
-- Name: production_batch production_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.production_batch ALTER COLUMN production_id SET DEFAULT nextval('public.production_batch_production_id_seq'::regclass);


--
-- Name: qr_lote qr_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qr_lote ALTER COLUMN qr_id SET DEFAULT nextval('public.qr_lote_qr_id_seq'::regclass);


--
-- Name: role role_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role ALTER COLUMN role_id SET DEFAULT nextval('public.role_role_id_seq'::regclass);


--
-- Name: tokens token_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tokens ALTER COLUMN token_id SET DEFAULT nextval('public.tokens_token_id_seq'::regclass);


--
-- Name: user_fcm_tokens token_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_fcm_tokens ALTER COLUMN token_id SET DEFAULT nextval('public.user_fcm_tokens_token_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Data for Name: activity; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activity (activity_id, crop_id, user_id, activity_type, date, description, cost_total, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: activity_branch; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activity_branch (branch_id, production_id, activity_id, created_at) FROM stdin;
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comments (comment_id, user_id, message, is_edited, is_deleted, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: crop; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.crop (crop_id, user_id, plot_id, crop_type, crop_variety, planting_date, harvest_date, is_active, cost_total, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: input_used; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.input_used (input_id, activity_id, input_name, unit, quantity, unit_cost, cost_unit, base_unit, conversion_factor, created_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (notification_id, user_id, type_notification, title_notification, message_notification, status_notification, link_notification, sent_at, is_read, created_at) FROM stdin;
2	1	weather	🌤️ Clima en tu parcela	Hoy: nubes. Temp: -31.8°C (Max: -31.8°C, Min: -31.8°C). Humedad: 97%	sent	\N	2025-11-13 19:30:13.868285	f	2025-11-13 19:30:13.868285
3	1	weather	🌤️ Clima en tu parcela	Hoy: nubes. Temp: -31.8°C (Max: -31.8°C, Min: -31.8°C). Humedad: 97%	sent	\N	2025-11-13 19:30:31.170077	f	2025-11-13 19:30:31.170077
4	1	weather	🌤️ Clima en tu parcela	Hoy: nubes. Temp: -31.8°C (Max: -31.8°C, Min: -31.8°C). Humedad: 97%	sent	\N	2025-11-13 19:31:15.763916	f	2025-11-13 19:31:15.763916
1	1	weather	🌤️ Clima en tu parcela	Hoy: nubes. Temp: -31.8°C (Max: -31.8°C, Min: -31.8°C). Humedad: 97%	sent	\N	2025-11-13 19:30:13.39345	t	2025-11-13 19:30:13.39345
\.


--
-- Data for Name: plot_climate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.plot_climate (climate_id, plot_id, temperature, humidity, description, precipitation, wind_speed, atmospheric_pressure, wind_direction, min_temp, max_temp, city_name, date, created_at, updated_at) FROM stdin;
1	1	-31.8	97	nubes	0	4	1004	349	-31.8	-31.8		2025-11-13	2025-11-13 13:47:02.578182	2025-11-13 13:49:05.434347
5	1	13.84	92	nubes	0	1.82	1020	65	13.84	13.84	Rayón	2025-11-14	2025-11-13 19:15:20.005602	2025-11-13 19:35:24.117887
33	2	18.43	91	nubes	0	1.5	1020	77	18.43	18.43	Tapilula	2025-11-14	2025-11-13 19:55:04.856714	2025-11-13 19:55:04.856714
\.


--
-- Data for Name: plots; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.plots (plot_id, user_id, plot_name, location, area, geom, is_active, created_at, updated_at) FROM stdin;
1	1	Familia Morales	Rayon, Chiapas	20500	0101000020E61000000000104F844157C02F01C6DB6E353140	t	2025-11-13 13:46:50.759491	2025-11-13 19:17:16.100912
2	2	Parcela Morales	Quinta Nte. Pte. 28, Tapilula, Chiapas, Mexico	30500	0101000020E61000000000E8CB894157C0621DB7B9C7403140	t	2025-11-13 19:54:51.347021	2025-11-13 19:54:51.347021
\.


--
-- Data for Name: pointcloud_formats; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pointcloud_formats (pcid, srid, schema) FROM stdin;
\.


--
-- Data for Name: production_batch; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.production_batch (production_id, crop_id, name, unique_code, creation_date, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: qr_lote; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.qr_lote (qr_id, production_id, qr_code, qr_data, generation_date) FROM stdin;
\.


--
-- Data for Name: role; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role (role_id, name, description, created_at, updated_at) FROM stdin;
1	admin	Este usuario tiene permiso a todo	2025-11-13 13:38:35.18471	2025-11-13 13:38:35.18471
2	user	Este usuario tiene permisos basicos	2025-11-13 13:38:35.18471	2025-11-13 13:38:35.18471
\.


--
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- Data for Name: tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tokens (token_id, user_id, refresh_token, is_revoked, created_at) FROM stdin;
1	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJyb2xlX2lkIjoyLCJpYXQiOjE3NjMwNjI4MTIsImV4cCI6MTc2MzY2NzYxMn0.d1IelRPyNnWnfUgZ69fLLP8ASivADBqfhowx9A2omZY	f	2025-11-13 13:40:12.605152
2	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJyb2xlX2lkIjoyLCJpYXQiOjE3NjMwODI5MTQsImV4cCI6MTc2MzY4NzcxNH0.WquuY1zQ8-7W0Ljyd7GwS987GXkaW-b6Vchb9LUJuPY	f	2025-11-13 19:15:14.542084
3	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJyb2xlX2lkIjoxLCJpYXQiOjE3NjMwODM0MjEsImV4cCI6MTc2MzY4ODIyMX0.F7T8233aAtQryypWpyE0_9FhOLll3dyDfQbOP6am6V8	f	2025-11-13 19:23:41.588372
4	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJyb2xlX2lkIjoxLCJpYXQiOjE3NjMwODM0NzEsImV4cCI6MTc2MzY4ODI3MX0.-fvR2csMSUH981-UQUIFlNCbUN8d3gGmwMQz7xHbn2Q	f	2025-11-13 19:24:31.699129
5	2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJyb2xlX2lkIjoyLCJpYXQiOjE3NjMwODUyMjMsImV4cCI6MTc2MzY5MDAyM30.ColGuCABBn7XK1kwVzfqTpHOKXEjAzfjxc0A4dJI4jU	f	2025-11-13 19:53:43.28925
\.


--
-- Data for Name: us_gaz; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.us_gaz (id, seq, word, stdword, token, is_custom) FROM stdin;
\.


--
-- Data for Name: us_lex; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.us_lex (id, seq, word, stdword, token, is_custom) FROM stdin;
\.


--
-- Data for Name: us_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.us_rules (id, rule, is_custom) FROM stdin;
\.


--
-- Data for Name: user_fcm_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_fcm_tokens (token_id, user_id, fcm_token, device_type, created_at, updated_at) FROM stdin;
4	2	cMh-Z-UtSRKvaoRf_eJm0a:APA91bF4DDiis7oDqMX1gsRWKdKHT52L5APbDVFj0EQVQvH-61kULJ6hpj-hYucjXRhlGjU0blX1jsc4BJ1z5BdywpfbY6cLFcf5lv2YtPg91ARvq2ZLr0M	mobile	2025-11-13 19:53:43.417143	2025-11-13 19:53:43.417143
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, google_id, role_id, first_name, paternal_surname, maternal_surname, email, password, image_user, configured_plot, is_active, created_at, updated_at) FROM stdin;
1	\N	1	David	Morales	Hernandez	ga78goher@gmail.com	$2b$10$IMzJjVA.gzbs143IQIgsdO9TiNBd1cRkZnwiMbjYHdJTtrbRpvDmO	image-1763062795641-781413760.jpg	t	t	2025-11-13 13:39:55.793072-06	2025-11-13 13:39:55.793072-06
2	\N	2	Henry	Gonzalez	Perez	henryperez@gmail.com	$2b$10$//jfr9cKcy4LhVt/dJ..0umdtSpKlkgJR03WX4StE2j92O600gSFO	image-1763085211423-485100361.jpg	t	t	2025-11-13 19:53:31.569595-06	2025-11-13 19:53:31.569595-06
\.


--
-- Data for Name: geocode_settings; Type: TABLE DATA; Schema: tiger; Owner: postgres
--

COPY tiger.geocode_settings (name, setting, unit, category, short_desc) FROM stdin;
\.


--
-- Data for Name: pagc_gaz; Type: TABLE DATA; Schema: tiger; Owner: postgres
--

COPY tiger.pagc_gaz (id, seq, word, stdword, token, is_custom) FROM stdin;
\.


--
-- Data for Name: pagc_lex; Type: TABLE DATA; Schema: tiger; Owner: postgres
--

COPY tiger.pagc_lex (id, seq, word, stdword, token, is_custom) FROM stdin;
\.


--
-- Data for Name: pagc_rules; Type: TABLE DATA; Schema: tiger; Owner: postgres
--

COPY tiger.pagc_rules (id, rule, is_custom) FROM stdin;
\.


--
-- Data for Name: topology; Type: TABLE DATA; Schema: topology; Owner: postgres
--

COPY topology.topology (id, name, srid, "precision", hasz) FROM stdin;
\.


--
-- Data for Name: layer; Type: TABLE DATA; Schema: topology; Owner: postgres
--

COPY topology.layer (topology_id, layer_id, schema_name, table_name, feature_column, feature_type, level, child_id) FROM stdin;
\.


--
-- Name: activity_activity_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.activity_activity_id_seq', 1, false);


--
-- Name: activity_branch_branch_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.activity_branch_branch_id_seq', 1, false);


--
-- Name: comments_comment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comments_comment_id_seq', 1, false);


--
-- Name: crop_crop_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.crop_crop_id_seq', 1, false);


--
-- Name: input_used_input_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.input_used_input_id_seq', 1, false);


--
-- Name: notifications_notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_notification_id_seq', 4, true);


--
-- Name: plot_climate_climate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.plot_climate_climate_id_seq', 33, true);


--
-- Name: plots_plot_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.plots_plot_id_seq', 2, true);


--
-- Name: production_batch_production_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.production_batch_production_id_seq', 1, false);


--
-- Name: qr_lote_qr_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.qr_lote_qr_id_seq', 1, false);


--
-- Name: role_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.role_role_id_seq', 1, false);


--
-- Name: tokens_token_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tokens_token_id_seq', 5, true);


--
-- Name: user_fcm_tokens_token_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_fcm_tokens_token_id_seq', 4, true);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 2, true);


--
-- Name: topology_id_seq; Type: SEQUENCE SET; Schema: topology; Owner: postgres
--

SELECT pg_catalog.setval('topology.topology_id_seq', 1, false);


--
-- Name: activity_branch activity_branch_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_branch
    ADD CONSTRAINT activity_branch_pkey PRIMARY KEY (branch_id);


--
-- Name: activity activity_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity
    ADD CONSTRAINT activity_pkey PRIMARY KEY (activity_id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (comment_id);


--
-- Name: crop crop_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crop
    ADD CONSTRAINT crop_pkey PRIMARY KEY (crop_id);


--
-- Name: input_used input_used_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.input_used
    ADD CONSTRAINT input_used_pkey PRIMARY KEY (input_id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (notification_id);


--
-- Name: plot_climate plot_climate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plot_climate
    ADD CONSTRAINT plot_climate_pkey PRIMARY KEY (climate_id);


--
-- Name: plots plots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plots
    ADD CONSTRAINT plots_pkey PRIMARY KEY (plot_id);


--
-- Name: production_batch production_batch_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.production_batch
    ADD CONSTRAINT production_batch_pkey PRIMARY KEY (production_id);


--
-- Name: production_batch production_batch_unique_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.production_batch
    ADD CONSTRAINT production_batch_unique_code_key UNIQUE (unique_code);


--
-- Name: qr_lote qr_lote_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qr_lote
    ADD CONSTRAINT qr_lote_pkey PRIMARY KEY (qr_id);


--
-- Name: role role_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (role_id);


--
-- Name: tokens tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tokens
    ADD CONSTRAINT tokens_pkey PRIMARY KEY (token_id);


--
-- Name: plot_climate unique_plot_date; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plot_climate
    ADD CONSTRAINT unique_plot_date UNIQUE (plot_id, date);


--
-- Name: user_fcm_tokens unique_user_token; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_fcm_tokens
    ADD CONSTRAINT unique_user_token UNIQUE (user_id, fcm_token);


--
-- Name: user_fcm_tokens user_fcm_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_fcm_tokens
    ADD CONSTRAINT user_fcm_tokens_pkey PRIMARY KEY (token_id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_google_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_google_id_unique UNIQUE (google_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: activity_branch activity_branch_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_branch
    ADD CONSTRAINT activity_branch_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activity(activity_id);


--
-- Name: activity_branch activity_branch_production_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_branch
    ADD CONSTRAINT activity_branch_production_id_fkey FOREIGN KEY (production_id) REFERENCES public.production_batch(production_id);


--
-- Name: activity activity_crop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity
    ADD CONSTRAINT activity_crop_id_fkey FOREIGN KEY (crop_id) REFERENCES public.crop(crop_id) ON DELETE CASCADE;


--
-- Name: activity activity_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity
    ADD CONSTRAINT activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: comments comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: crop crop_plot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crop
    ADD CONSTRAINT crop_plot_id_fkey FOREIGN KEY (plot_id) REFERENCES public.plots(plot_id) ON DELETE CASCADE;


--
-- Name: crop crop_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crop
    ADD CONSTRAINT crop_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: input_used input_used_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.input_used
    ADD CONSTRAINT input_used_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activity(activity_id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: plot_climate plot_climate_plot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plot_climate
    ADD CONSTRAINT plot_climate_plot_id_fkey FOREIGN KEY (plot_id) REFERENCES public.plots(plot_id);


--
-- Name: plots plots_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plots
    ADD CONSTRAINT plots_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: production_batch production_batch_crop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.production_batch
    ADD CONSTRAINT production_batch_crop_id_fkey FOREIGN KEY (crop_id) REFERENCES public.crop(crop_id);


--
-- Name: qr_lote qr_lote_production_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qr_lote
    ADD CONSTRAINT qr_lote_production_id_fkey FOREIGN KEY (production_id) REFERENCES public.production_batch(production_id);


--
-- Name: tokens tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tokens
    ADD CONSTRAINT tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: user_fcm_tokens user_fcm_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_fcm_tokens
    ADD CONSTRAINT user_fcm_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

