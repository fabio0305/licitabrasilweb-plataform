--
-- PostgreSQL database dump
--

\restrict n6rHlREOAxaxKHoGcEuGNkcU3WdfcALMsVR5TLWhWSdzEjjIfKI6bcQyu6Rxoxz

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

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
-- Name: BiddingStatus; Type: TYPE; Schema: public; Owner: licitabrasil
--

CREATE TYPE public."BiddingStatus" AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'OPEN',
    'CLOSED',
    'CANCELLED',
    'AWARDED'
);


ALTER TYPE public."BiddingStatus" OWNER TO licitabrasil;

--
-- Name: BiddingType; Type: TYPE; Schema: public; Owner: licitabrasil
--

CREATE TYPE public."BiddingType" AS ENUM (
    'PREGAO_ELETRONICO',
    'CONCORRENCIA',
    'TOMADA_PRECOS',
    'CONVITE',
    'CONCURSO',
    'LEILAO'
);


ALTER TYPE public."BiddingType" OWNER TO licitabrasil;

--
-- Name: ContractStatus; Type: TYPE; Schema: public; Owner: licitabrasil
--

CREATE TYPE public."ContractStatus" AS ENUM (
    'DRAFT',
    'ACTIVE',
    'SUSPENDED',
    'TERMINATED',
    'COMPLETED'
);


ALTER TYPE public."ContractStatus" OWNER TO licitabrasil;

--
-- Name: DocumentType; Type: TYPE; Schema: public; Owner: licitabrasil
--

CREATE TYPE public."DocumentType" AS ENUM (
    'EDITAL',
    'PROPOSAL',
    'CONTRACT',
    'CERTIFICATE',
    'REPORT',
    'OTHER'
);


ALTER TYPE public."DocumentType" OWNER TO licitabrasil;

--
-- Name: Permission; Type: TYPE; Schema: public; Owner: licitabrasil
--

CREATE TYPE public."Permission" AS ENUM (
    'READ_PUBLIC_DATA',
    'READ_PRIVATE_DATA',
    'WRITE_DATA',
    'DELETE_DATA',
    'CREATE_BIDDING',
    'EDIT_BIDDING',
    'DELETE_BIDDING',
    'PUBLISH_BIDDING',
    'CANCEL_BIDDING',
    'CREATE_PROPOSAL',
    'EDIT_PROPOSAL',
    'DELETE_PROPOSAL',
    'SUBMIT_PROPOSAL',
    'CREATE_CONTRACT',
    'EDIT_CONTRACT',
    'SIGN_CONTRACT',
    'TERMINATE_CONTRACT',
    'MANAGE_USERS',
    'MANAGE_SYSTEM',
    'VIEW_AUDIT_LOGS',
    'MANAGE_CATEGORIES',
    'GENERATE_REPORTS',
    'EXPORT_DATA'
);


ALTER TYPE public."Permission" OWNER TO licitabrasil;

--
-- Name: ProposalStatus; Type: TYPE; Schema: public; Owner: licitabrasil
--

CREATE TYPE public."ProposalStatus" AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'UNDER_REVIEW',
    'ACCEPTED',
    'REJECTED',
    'WITHDRAWN'
);


ALTER TYPE public."ProposalStatus" OWNER TO licitabrasil;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: licitabrasil
--

CREATE TYPE public."UserRole" AS ENUM (
    'ADMIN',
    'SUPPLIER',
    'PUBLIC_ENTITY',
    'AUDITOR',
    'CITIZEN'
);


ALTER TYPE public."UserRole" OWNER TO licitabrasil;

--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: licitabrasil
--

CREATE TYPE public."UserStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'PENDING',
    'SUSPENDED'
);


ALTER TYPE public."UserStatus" OWNER TO licitabrasil;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: licitabrasil
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO licitabrasil;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: licitabrasil
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    "userId" text NOT NULL,
    action text NOT NULL,
    resource text NOT NULL,
    "resourceId" text,
    "oldValues" jsonb,
    "newValues" jsonb,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO licitabrasil;

--
-- Name: bidding_categories; Type: TABLE; Schema: public; Owner: licitabrasil
--

CREATE TABLE public.bidding_categories (
    id text NOT NULL,
    "biddingId" text NOT NULL,
    "categoryId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.bidding_categories OWNER TO licitabrasil;

--
-- Name: biddings; Type: TABLE; Schema: public; Owner: licitabrasil
--

CREATE TABLE public.biddings (
    id text NOT NULL,
    "publicEntityId" text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    "biddingNumber" text NOT NULL,
    type public."BiddingType" NOT NULL,
    status public."BiddingStatus" DEFAULT 'DRAFT'::public."BiddingStatus" NOT NULL,
    "estimatedValue" numeric(15,2) NOT NULL,
    "openingDate" timestamp(3) without time zone NOT NULL,
    "closingDate" timestamp(3) without time zone NOT NULL,
    "deliveryLocation" text NOT NULL,
    "deliveryDeadline" timestamp(3) without time zone NOT NULL,
    requirements text NOT NULL,
    "evaluationCriteria" text NOT NULL,
    "isPublic" boolean DEFAULT true NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.biddings OWNER TO licitabrasil;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: licitabrasil
--

CREATE TABLE public.categories (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    code text NOT NULL,
    "parentId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.categories OWNER TO licitabrasil;

--
-- Name: citizens; Type: TABLE; Schema: public; Owner: licitabrasil
--

CREATE TABLE public.citizens (
    id text NOT NULL,
    "userId" text NOT NULL,
    cpf text,
    "dateOfBirth" timestamp(3) without time zone,
    profession text,
    address text,
    city text,
    state text,
    "zipCode" text,
    interests text[],
    "isActive" boolean DEFAULT true NOT NULL,
    "verifiedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.citizens OWNER TO licitabrasil;

--
-- Name: contracts; Type: TABLE; Schema: public; Owner: licitabrasil
--

CREATE TABLE public.contracts (
    id text NOT NULL,
    "biddingId" text NOT NULL,
    "proposalId" text NOT NULL,
    "publicEntityId" text NOT NULL,
    "supplierId" text NOT NULL,
    "contractNumber" text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    "totalValue" numeric(15,2) NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    status public."ContractStatus" DEFAULT 'DRAFT'::public."ContractStatus" NOT NULL,
    "signedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.contracts OWNER TO licitabrasil;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: licitabrasil
--

CREATE TABLE public.documents (
    id text NOT NULL,
    filename text NOT NULL,
    "originalName" text NOT NULL,
    "mimeType" text NOT NULL,
    size integer NOT NULL,
    path text NOT NULL,
    type public."DocumentType" NOT NULL,
    description text,
    "isPublic" boolean DEFAULT false NOT NULL,
    "uploadedBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "biddingId" text,
    "proposalId" text,
    "contractId" text,
    "supplierId" text,
    "publicEntityId" text
);


ALTER TABLE public.documents OWNER TO licitabrasil;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: licitabrasil
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    "userId" text,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info'::text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    data jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.notifications OWNER TO licitabrasil;

--
-- Name: proposal_items; Type: TABLE; Schema: public; Owner: licitabrasil
--

CREATE TABLE public.proposal_items (
    id text NOT NULL,
    "proposalId" text NOT NULL,
    description text NOT NULL,
    quantity integer NOT NULL,
    "unitPrice" numeric(10,2) NOT NULL,
    "totalPrice" numeric(15,2) NOT NULL,
    brand text,
    model text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.proposal_items OWNER TO licitabrasil;

--
-- Name: proposals; Type: TABLE; Schema: public; Owner: licitabrasil
--

CREATE TABLE public.proposals (
    id text NOT NULL,
    "biddingId" text NOT NULL,
    "supplierId" text NOT NULL,
    "totalValue" numeric(15,2) NOT NULL,
    description text NOT NULL,
    status public."ProposalStatus" DEFAULT 'DRAFT'::public."ProposalStatus" NOT NULL,
    "submittedAt" timestamp(3) without time zone,
    "validUntil" timestamp(3) without time zone NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.proposals OWNER TO licitabrasil;

--
-- Name: public_entities; Type: TABLE; Schema: public; Owner: licitabrasil
--

CREATE TABLE public.public_entities (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    cnpj text NOT NULL,
    "entityType" text NOT NULL,
    address text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    "zipCode" text NOT NULL,
    phone text NOT NULL,
    website text,
    "isActive" boolean DEFAULT true NOT NULL,
    "verifiedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.public_entities OWNER TO licitabrasil;

--
-- Name: supplier_categories; Type: TABLE; Schema: public; Owner: licitabrasil
--

CREATE TABLE public.supplier_categories (
    id text NOT NULL,
    "supplierId" text NOT NULL,
    "categoryId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.supplier_categories OWNER TO licitabrasil;

--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: licitabrasil
--

CREATE TABLE public.suppliers (
    id text NOT NULL,
    "userId" text NOT NULL,
    "companyName" text NOT NULL,
    "tradeName" text,
    cnpj text NOT NULL,
    "stateRegistration" text,
    "municipalRegistration" text,
    address text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    "zipCode" text NOT NULL,
    website text,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "verifiedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.suppliers OWNER TO licitabrasil;

--
-- Name: system_configs; Type: TABLE; Schema: public; Owner: licitabrasil
--

CREATE TABLE public.system_configs (
    id text NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    type text DEFAULT 'string'::text NOT NULL,
    description text,
    "isPublic" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.system_configs OWNER TO licitabrasil;

--
-- Name: user_permissions; Type: TABLE; Schema: public; Owner: licitabrasil
--

CREATE TABLE public.user_permissions (
    id text NOT NULL,
    "userId" text NOT NULL,
    permission public."Permission" NOT NULL,
    "grantedBy" text,
    "grantedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_permissions OWNER TO licitabrasil;

--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: licitabrasil
--

CREATE TABLE public.user_sessions (
    id text NOT NULL,
    "userId" text NOT NULL,
    token text NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_sessions OWNER TO licitabrasil;

--
-- Name: users; Type: TABLE; Schema: public; Owner: licitabrasil
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role public."UserRole" NOT NULL,
    status public."UserStatus" DEFAULT 'PENDING'::public."UserStatus" NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    phone text,
    avatar text,
    "lastLoginAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO licitabrasil;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: licitabrasil
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
6bfbc17d-0225-4cff-9fa1-5d2da094d458	8dc365fd124cb0a73a2e6539fee381652fcb3cfee30765a12cbb35bf00313e79	2025-09-30 16:21:37.301074+00	20250917204809_init	\N	\N	2025-09-30 16:21:37.001635+00	1
4c036814-9c75-4909-94e2-21c84d604640	20c66bee421541d018fa8ed5c3a3b1d9192608926705fdb0a4170b4d86d94a6c	2025-09-30 16:21:37.354677+00	20250929223634_add_citizen_profile_and_permissions	\N	\N	2025-09-30 16:21:37.303126+00	1
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: licitabrasil
--

COPY public.audit_logs (id, "userId", action, resource, "resourceId", "oldValues", "newValues", "ipAddress", "userAgent", "createdAt") FROM stdin;
\.


--
-- Data for Name: bidding_categories; Type: TABLE DATA; Schema: public; Owner: licitabrasil
--

COPY public.bidding_categories (id, "biddingId", "categoryId", "createdAt") FROM stdin;
\.


--
-- Data for Name: biddings; Type: TABLE DATA; Schema: public; Owner: licitabrasil
--

COPY public.biddings (id, "publicEntityId", title, description, "biddingNumber", type, status, "estimatedValue", "openingDate", "closingDate", "deliveryLocation", "deliveryDeadline", requirements, "evaluationCriteria", "isPublic", "publishedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: licitabrasil
--

COPY public.categories (id, name, description, code, "parentId", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: citizens; Type: TABLE DATA; Schema: public; Owner: licitabrasil
--

COPY public.citizens (id, "userId", cpf, "dateOfBirth", profession, address, city, state, "zipCode", interests, "isActive", "verifiedAt", "createdAt", "updatedAt") FROM stdin;
4c120770-6fe6-479d-b314-85695bcc7afe	2fa009ec-e14f-47a1-bfb5-85eeff3e2a3f	123.456.789-00	1985-05-15 00:00:00	Engenheiro Civil	Rua das Flores, 123	São Paulo	SP	04567-890	{"Obras Públicas",Tecnologia,Educação}	t	2025-09-30 18:02:39.477	2025-09-30 18:02:39.479	2025-09-30 18:02:39.479
\.


--
-- Data for Name: contracts; Type: TABLE DATA; Schema: public; Owner: licitabrasil
--

COPY public.contracts (id, "biddingId", "proposalId", "publicEntityId", "supplierId", "contractNumber", title, description, "totalValue", "startDate", "endDate", status, "signedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: licitabrasil
--

COPY public.documents (id, filename, "originalName", "mimeType", size, path, type, description, "isPublic", "uploadedBy", "createdAt", "updatedAt", "biddingId", "proposalId", "contractId", "supplierId", "publicEntityId") FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: licitabrasil
--

COPY public.notifications (id, "userId", title, message, type, "isRead", data, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: proposal_items; Type: TABLE DATA; Schema: public; Owner: licitabrasil
--

COPY public.proposal_items (id, "proposalId", description, quantity, "unitPrice", "totalPrice", brand, model, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: proposals; Type: TABLE DATA; Schema: public; Owner: licitabrasil
--

COPY public.proposals (id, "biddingId", "supplierId", "totalValue", description, status, "submittedAt", "validUntil", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: public_entities; Type: TABLE DATA; Schema: public; Owner: licitabrasil
--

COPY public.public_entities (id, "userId", name, cnpj, "entityType", address, city, state, "zipCode", phone, website, "isActive", "verifiedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: supplier_categories; Type: TABLE DATA; Schema: public; Owner: licitabrasil
--

COPY public.supplier_categories (id, "supplierId", "categoryId", "createdAt") FROM stdin;
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: licitabrasil
--

COPY public.suppliers (id, "userId", "companyName", "tradeName", cnpj, "stateRegistration", "municipalRegistration", address, city, state, "zipCode", website, description, "isActive", "verifiedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: system_configs; Type: TABLE DATA; Schema: public; Owner: licitabrasil
--

COPY public.system_configs (id, key, value, type, description, "isPublic", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: user_permissions; Type: TABLE DATA; Schema: public; Owner: licitabrasil
--

COPY public.user_permissions (id, "userId", permission, "grantedBy", "grantedAt", "expiresAt", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: licitabrasil
--

COPY public.user_sessions (id, "userId", token, "ipAddress", "userAgent", "expiresAt", "createdAt", "updatedAt") FROM stdin;
e1225803-9d6e-4be0-8cde-b9d8fbf89d76	adb3ab1b-5636-4791-80c4-ce6f55389fa5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZGIzYWIxYi01NjM2LTQ3OTEtODBjNC1jZTZmNTUzODlmYTUiLCJlbWFpbCI6ImFkbWluLnRlc3RlQGxpY2l0YWJyYXNpbC5jb20uYnIiLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiJlMTIyNTgwMy05ZDZlLTRiZTAtOGNkZS1iOWQ4ZmJmODlkNzYiLCJpYXQiOjE3NTkyNTUzNzAsImV4cCI6MTc1OTg2MDE3MH0.4QCOOz5O_DnfudY-myahB4rFRINIuy3IyiHDnvwO0Lw	::ffff:172.18.0.5	curl/7.81.0	2025-10-07 18:02:50.751	2025-09-30 18:02:50.752	2025-09-30 18:02:50.752
fb0de248-af42-4e32-b6aa-29f531f5bf65	adb3ab1b-5636-4791-80c4-ce6f55389fa5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZGIzYWIxYi01NjM2LTQ3OTEtODBjNC1jZTZmNTUzODlmYTUiLCJlbWFpbCI6ImFkbWluLnRlc3RlQGxpY2l0YWJyYXNpbC5jb20uYnIiLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiJmYjBkZTI0OC1hZjQyLTRlMzItYjZhYS0yOWY1MzFmNWJmNjUiLCJpYXQiOjE3NTkyNTUzODEsImV4cCI6MTc1OTg2MDE4MX0.zIpkwrKzdZKr2B7XlL6U7KhtPBobcxHH5XPxWna0qMY	::ffff:172.18.0.5	curl/7.81.0	2025-10-07 18:03:01.114	2025-09-30 18:03:01.115	2025-09-30 18:03:01.115
1b75d70c-a598-4bcd-81a2-0513e3345ac0	a99e5cb5-ee49-4512-a7f9-58edf6c5602d	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhOTllNWNiNS1lZTQ5LTQ1MTItYTdmOS01OGVkZjZjNTYwMmQiLCJlbWFpbCI6ImZvcm5lY2Vkb3IudGVzdGVAZW1wcmVzYS5jb20uYnIiLCJyb2xlIjoiU1VQUExJRVIiLCJzZXNzaW9uSWQiOiIxYjc1ZDcwYy1hNTk4LTRiY2QtODFhMi0wNTEzZTMzNDVhYzAiLCJpYXQiOjE3NTkyNTU0NDUsImV4cCI6MTc1OTg2MDI0NX0.RUeHEheCQIG6Sbp1TiO9f8Q0RpmxnIEEkAN_C6ujcAI	::ffff:172.18.0.5	curl/7.81.0	2025-10-07 18:04:05.734	2025-09-30 18:04:05.735	2025-09-30 18:04:05.735
d707eb97-2589-433a-ae9f-7603c778cce6	d697788f-78e4-41ee-8781-9e6fab486fc1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkNjk3Nzg4Zi03OGU0LTQxZWUtODc4MS05ZTZmYWI0ODZmYzEiLCJlbWFpbCI6ImNvbXByYWRvci50ZXN0ZUBwcmVmZWl0dXJhLmdvdi5iciIsInJvbGUiOiJQVUJMSUNfRU5USVRZIiwic2Vzc2lvbklkIjoiZDcwN2ViOTctMjU4OS00MzNhLWFlOWYtNzYwM2M3NzhjY2U2IiwiaWF0IjoxNzU5MjU1NDUzLCJleHAiOjE3NTk4NjAyNTN9.kwkUmlol8QMRsQEboZGfpjkNJ6oYIwxZhRUetjFoCrw	::ffff:172.18.0.5	curl/7.81.0	2025-10-07 18:04:13.409	2025-09-30 18:04:13.41	2025-09-30 18:04:13.41
d48a8325-e9c5-4a37-8835-a4378384a89a	2fa009ec-e14f-47a1-bfb5-85eeff3e2a3f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyZmEwMDllYy1lMTRmLTQ3YTEtYmZiNS04NWVlZmYzZTJhM2YiLCJlbWFpbCI6ImNpZGFkYW8udGVzdGVAZW1haWwuY29tIiwicm9sZSI6IkNJVElaRU4iLCJzZXNzaW9uSWQiOiJkNDhhODMyNS1lOWM1LTRhMzctODgzNS1hNDM3ODM4NGE4OWEiLCJpYXQiOjE3NTkyNTU0NjIsImV4cCI6MTc1OTg2MDI2Mn0.4yqGJoOYDW8IK8XYHPK-P09fOZpmAM_g5dJFKJ4xxN0	::ffff:172.18.0.5	curl/7.81.0	2025-10-07 18:04:22.213	2025-09-30 18:04:22.214	2025-09-30 18:04:22.214
8948774e-bea5-4c6a-b4d3-c33e1e1a0ab1	0d622af4-e8b7-493b-9b62-85062dcc2151	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwZDYyMmFmNC1lOGI3LTQ5M2ItOWI2Mi04NTA2MmRjYzIxNTEiLCJlbWFpbCI6ImF1ZGl0b3IudGVzdGVAdGN1Lmdvdi5iciIsInJvbGUiOiJBVURJVE9SIiwic2Vzc2lvbklkIjoiODk0ODc3NGUtYmVhNS00YzZhLWI0ZDMtYzMzZTFlMWEwYWIxIiwiaWF0IjoxNzU5MjU1NDY5LCJleHAiOjE3NTk4NjAyNjl9.it7g7x37Y7hHlYVFEU1FV0ANNICny_SqRH3iXPnSn4Y	::ffff:172.18.0.5	curl/7.81.0	2025-10-07 18:04:29.95	2025-09-30 18:04:29.952	2025-09-30 18:04:29.952
5a7b5a46-25fe-4274-9472-9271eeeb8d12	adb3ab1b-5636-4791-80c4-ce6f55389fa5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZGIzYWIxYi01NjM2LTQ3OTEtODBjNC1jZTZmNTUzODlmYTUiLCJlbWFpbCI6ImFkbWluLnRlc3RlQGxpY2l0YWJyYXNpbC5jb20uYnIiLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiI1YTdiNWE0Ni0yNWZlLTQyNzQtOTQ3Mi05MjcxZWVlYjhkMTIiLCJpYXQiOjE3NTkyNTU5MDMsImV4cCI6MTc1OTg2MDcwM30.Km_QN6thllea0e8pqba4ZYuCT3ZAX38-b2_9CneF-Bs	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-07 18:11:43.408	2025-09-30 18:11:43.409	2025-09-30 18:11:43.409
a19eeed8-4fc4-4e0e-8ec0-c08b12006467	a99e5cb5-ee49-4512-a7f9-58edf6c5602d	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhOTllNWNiNS1lZTQ5LTQ1MTItYTdmOS01OGVkZjZjNTYwMmQiLCJlbWFpbCI6ImZvcm5lY2Vkb3IudGVzdGVAZW1wcmVzYS5jb20uYnIiLCJyb2xlIjoiU1VQUExJRVIiLCJzZXNzaW9uSWQiOiJhMTllZWVkOC00ZmM0LTRlMGUtOGVjMC1jMDhiMTIwMDY0NjciLCJpYXQiOjE3NTkyNTU5MzEsImV4cCI6MTc1OTg2MDczMX0.nkXXy3qBDPAlaF988NSYhl0KK2S2LEb8pL6T2iUulE4	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-07 18:12:11.642	2025-09-30 18:12:11.644	2025-09-30 18:12:11.644
1c9f88f4-741c-4b7d-9560-fc9a63a4ff98	d697788f-78e4-41ee-8781-9e6fab486fc1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkNjk3Nzg4Zi03OGU0LTQxZWUtODc4MS05ZTZmYWI0ODZmYzEiLCJlbWFpbCI6ImNvbXByYWRvci50ZXN0ZUBwcmVmZWl0dXJhLmdvdi5iciIsInJvbGUiOiJQVUJMSUNfRU5USVRZIiwic2Vzc2lvbklkIjoiMWM5Zjg4ZjQtNzQxYy00YjdkLTk1NjAtZmM5YTYzYTRmZjk4IiwiaWF0IjoxNzU5MjU1OTU3LCJleHAiOjE3NTk4NjA3NTd9.QgrZYO_UgFVlsoXdBGab1bAkuD0xOxCZlg-yoI_IXFw	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-07 18:12:37.332	2025-09-30 18:12:37.333	2025-09-30 18:12:37.333
ae875730-2d41-4257-9b8c-f60ce9ebaa56	2fa009ec-e14f-47a1-bfb5-85eeff3e2a3f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyZmEwMDllYy1lMTRmLTQ3YTEtYmZiNS04NWVlZmYzZTJhM2YiLCJlbWFpbCI6ImNpZGFkYW8udGVzdGVAZW1haWwuY29tIiwicm9sZSI6IkNJVElaRU4iLCJzZXNzaW9uSWQiOiJhZTg3NTczMC0yZDQxLTQyNTctOWI4Yy1mNjBjZTllYmFhNTYiLCJpYXQiOjE3NTkyNTU5NzcsImV4cCI6MTc1OTg2MDc3N30.pPv3Bk4F7aDyZ3Uoc38W6HD8tPkBEhqHVrIAnZEdLzg	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-07 18:12:57.636	2025-09-30 18:12:57.638	2025-09-30 18:12:57.638
5972813a-3a74-4592-a8f2-5a5f1a089b11	0d622af4-e8b7-493b-9b62-85062dcc2151	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwZDYyMmFmNC1lOGI3LTQ5M2ItOWI2Mi04NTA2MmRjYzIxNTEiLCJlbWFpbCI6ImF1ZGl0b3IudGVzdGVAdGN1Lmdvdi5iciIsInJvbGUiOiJBVURJVE9SIiwic2Vzc2lvbklkIjoiNTk3MjgxM2EtM2E3NC00NTkyLWE4ZjItNWE1ZjFhMDg5YjExIiwiaWF0IjoxNzU5MjU2MDE4LCJleHAiOjE3NTk4NjA4MTh9.b-rTowB4XnrTpiUCPEFzxENZC5sxuGJhdowe9LDE-34	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-07 18:13:38.897	2025-09-30 18:13:38.898	2025-09-30 18:13:38.898
96405d36-7285-4fda-ab84-afc0f1d2a21b	adb3ab1b-5636-4791-80c4-ce6f55389fa5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZGIzYWIxYi01NjM2LTQ3OTEtODBjNC1jZTZmNTUzODlmYTUiLCJlbWFpbCI6ImFkbWluLnRlc3RlQGxpY2l0YWJyYXNpbC5jb20uYnIiLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiI5NjQwNWQzNi03Mjg1LTRmZGEtYWI4NC1hZmMwZjFkMmEyMWIiLCJpYXQiOjE3NTkyNTkxNDYsImV4cCI6MTc1OTg2Mzk0Nn0.1FMNFhtvCTa-R5_4fB-W9H2lGmzImPfSy-hPwLZjvUg	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-10-07 19:05:46.983	2025-09-30 19:05:46.984	2025-09-30 19:05:46.984
38e73780-96d2-4d59-bee7-226b2c81a3e6	2fa009ec-e14f-47a1-bfb5-85eeff3e2a3f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyZmEwMDllYy1lMTRmLTQ3YTEtYmZiNS04NWVlZmYzZTJhM2YiLCJlbWFpbCI6ImNpZGFkYW8udGVzdGVAZW1haWwuY29tIiwicm9sZSI6IkNJVElaRU4iLCJzZXNzaW9uSWQiOiIzOGU3Mzc4MC05NmQyLTRkNTktYmVlNy0yMjZiMmM4MWEzZTYiLCJpYXQiOjE3NjAxMjU2NDgsImV4cCI6MTc2MDczMDQ0OH0.pwDlCOcDLLN1nQVEMPHmKoQ7sfOFq3J1Nf7Snsp94hc	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	2025-10-17 19:47:28.562	2025-10-10 19:47:28.563	2025-10-10 19:47:28.563
09372fe0-ef32-40d7-a654-7660b2b9e596	2fa009ec-e14f-47a1-bfb5-85eeff3e2a3f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyZmEwMDllYy1lMTRmLTQ3YTEtYmZiNS04NWVlZmYzZTJhM2YiLCJlbWFpbCI6ImNpZGFkYW8udGVzdGVAZW1haWwuY29tIiwicm9sZSI6IkNJVElaRU4iLCJzZXNzaW9uSWQiOiIwOTM3MmZlMC1lZjMyLTQwZDctYTY1NC03NjYwYjJiOWU1OTYiLCJpYXQiOjE3NjAxMjkzNTYsImV4cCI6MTc2MDczNDE1Nn0.86XgSKkMz8TAZZs_oFIVuN5i7tGmMaSIeD8pHfrCub8	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	2025-10-17 20:49:16.31	2025-10-10 20:49:16.311	2025-10-10 20:49:16.311
aed6c3d9-94bf-459e-b5e8-36c6c4dcd0c1	2fa009ec-e14f-47a1-bfb5-85eeff3e2a3f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyZmEwMDllYy1lMTRmLTQ3YTEtYmZiNS04NWVlZmYzZTJhM2YiLCJlbWFpbCI6ImNpZGFkYW8udGVzdGVAZW1haWwuY29tIiwicm9sZSI6IkNJVElaRU4iLCJzZXNzaW9uSWQiOiJhZWQ2YzNkOS05NGJmLTQ1OWUtYjVlOC0zNmM2YzRkY2QwYzEiLCJpYXQiOjE3NjAxMjkzODQsImV4cCI6MTc2MDczNDE4NH0.Dava__bopvwhDM2IQuTL5bLnidJQX47bzXP8GOOaFIE	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	2025-10-17 20:49:44.303	2025-10-10 20:49:44.304	2025-10-10 20:49:44.304
e452a203-9881-407a-a72b-bf7f8024d0ef	2fa009ec-e14f-47a1-bfb5-85eeff3e2a3f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyZmEwMDllYy1lMTRmLTQ3YTEtYmZiNS04NWVlZmYzZTJhM2YiLCJlbWFpbCI6ImNpZGFkYW8udGVzdGVAZW1haWwuY29tIiwicm9sZSI6IkNJVElaRU4iLCJzZXNzaW9uSWQiOiJlNDUyYTIwMy05ODgxLTQwN2EtYTcyYi1iZjdmODAyNGQwZWYiLCJpYXQiOjE3NjAxMzA0NTksImV4cCI6MTc2MDczNTI1OX0.RhV0ROYbNCRtpON-s7HGnAdAGMFRROznL9youEGWq9A	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	2025-10-17 21:07:39.936	2025-10-10 21:07:39.937	2025-10-10 21:07:39.937
2a88dc54-615b-41d2-a5ca-2f84a5c7936c	adb3ab1b-5636-4791-80c4-ce6f55389fa5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZGIzYWIxYi01NjM2LTQ3OTEtODBjNC1jZTZmNTUzODlmYTUiLCJlbWFpbCI6ImFkbWluLnRlc3RlQGxpY2l0YWJyYXNpbC5jb20uYnIiLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiIyYTg4ZGM1NC02MTViLTQxZDItYTVjYS0yZjg0YTVjNzkzNmMiLCJpYXQiOjE3NjAxMzI1OTAsImV4cCI6MTc2MDczNzM5MH0.aUQc1vnuIP3aUZllzr0ZKrDiaKq9vmAE0s_Hk67g2nI	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	2025-10-17 21:43:10.812	2025-10-10 21:43:10.813	2025-10-10 21:43:10.813
d9ad32f8-fcb4-4bc0-8915-41670177c230	adb3ab1b-5636-4791-80c4-ce6f55389fa5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZGIzYWIxYi01NjM2LTQ3OTEtODBjNC1jZTZmNTUzODlmYTUiLCJlbWFpbCI6ImFkbWluLnRlc3RlQGxpY2l0YWJyYXNpbC5jb20uYnIiLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiJkOWFkMzJmOC1mY2I0LTRiYzAtODkxNS00MTY3MDE3N2MyMzAiLCJpYXQiOjE3NjA5ODI2MTAsImV4cCI6MTc2MTU4NzQxMH0.nr5MggbqqLGh1nekTxmkZKBT2Q0OcptXBrnz46oXOw8	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	2025-10-27 17:50:11.009	2025-10-20 17:50:11.01	2025-10-20 17:50:11.01
20a2e565-e646-470b-ac7c-b2c1d176f977	a99e5cb5-ee49-4512-a7f9-58edf6c5602d	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhOTllNWNiNS1lZTQ5LTQ1MTItYTdmOS01OGVkZjZjNTYwMmQiLCJlbWFpbCI6ImZvcm5lY2Vkb3IudGVzdGVAZW1wcmVzYS5jb20uYnIiLCJyb2xlIjoiU1VQUExJRVIiLCJzZXNzaW9uSWQiOiIyMGEyZTU2NS1lNjQ2LTQ3MGItYWM3Yy1iMmMxZDE3NmY5NzciLCJpYXQiOjE3NjA5ODI2MzYsImV4cCI6MTc2MTU4NzQzNn0.LLf68pFiUpUBhwvtT5i3_H0899Eb5uaovSykrI7d4c8	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	2025-10-27 17:50:36.551	2025-10-20 17:50:36.552	2025-10-20 17:50:36.552
7df67036-63d5-410d-9e02-4e0a4a06555f	d697788f-78e4-41ee-8781-9e6fab486fc1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkNjk3Nzg4Zi03OGU0LTQxZWUtODc4MS05ZTZmYWI0ODZmYzEiLCJlbWFpbCI6ImNvbXByYWRvci50ZXN0ZUBwcmVmZWl0dXJhLmdvdi5iciIsInJvbGUiOiJQVUJMSUNfRU5USVRZIiwic2Vzc2lvbklkIjoiN2RmNjcwMzYtNjNkNS00MTBkLTllMDItNGUwYTRhMDY1NTVmIiwiaWF0IjoxNzYwOTgyNjYwLCJleHAiOjE3NjE1ODc0NjB9.50_BufD86BAqJ2n0y2_etwJI8l8DArHnvrwMvt9lwhU	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	2025-10-27 17:51:00.113	2025-10-20 17:51:00.114	2025-10-20 17:51:00.114
dcba9875-f5d6-4032-a635-6ed263942cf0	2fa009ec-e14f-47a1-bfb5-85eeff3e2a3f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyZmEwMDllYy1lMTRmLTQ3YTEtYmZiNS04NWVlZmYzZTJhM2YiLCJlbWFpbCI6ImNpZGFkYW8udGVzdGVAZW1haWwuY29tIiwicm9sZSI6IkNJVElaRU4iLCJzZXNzaW9uSWQiOiJkY2JhOTg3NS1mNWQ2LTQwMzItYTYzNS02ZWQyNjM5NDJjZjAiLCJpYXQiOjE3NjA5ODI2ODEsImV4cCI6MTc2MTU4NzQ4MX0.oXAG2G2hW1-ssvJA2MiqEtQm8SXzaKsPgGuZCXpXz8c	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	2025-10-27 17:51:21.796	2025-10-20 17:51:21.797	2025-10-20 17:51:21.797
3e364d1d-2fef-44d1-a1e4-f646db6d728c	0d622af4-e8b7-493b-9b62-85062dcc2151	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwZDYyMmFmNC1lOGI3LTQ5M2ItOWI2Mi04NTA2MmRjYzIxNTEiLCJlbWFpbCI6ImF1ZGl0b3IudGVzdGVAdGN1Lmdvdi5iciIsInJvbGUiOiJBVURJVE9SIiwic2Vzc2lvbklkIjoiM2UzNjRkMWQtMmZlZi00NGQxLWExZTQtZjY0NmRiNmQ3MjhjIiwiaWF0IjoxNzYwOTgyNjk5LCJleHAiOjE3NjE1ODc0OTl9.-apkH73kE-uxvEqKQl5RwtwqXKcCjwHZ0yfb1Hb7DAI	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	2025-10-27 17:51:39.896	2025-10-20 17:51:39.898	2025-10-20 17:51:39.898
0bb56a03-88ca-40d2-a286-e4258a926bfc	d697788f-78e4-41ee-8781-9e6fab486fc1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkNjk3Nzg4Zi03OGU0LTQxZWUtODc4MS05ZTZmYWI0ODZmYzEiLCJlbWFpbCI6ImNvbXByYWRvci50ZXN0ZUBwcmVmZWl0dXJhLmdvdi5iciIsInJvbGUiOiJQVUJMSUNfRU5USVRZIiwic2Vzc2lvbklkIjoiMGJiNTZhMDMtODhjYS00MGQyLWEyODYtZTQyNThhOTI2YmZjIiwiaWF0IjoxNzYwOTgyNzM4LCJleHAiOjE3NjE1ODc1Mzh9.GwHzUqaf8tsEinImO9IDIKdkFtbyieue9n6flG0kjyE	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	2025-10-27 17:52:18.306	2025-10-20 17:52:18.307	2025-10-20 17:52:18.307
1ba94f27-c470-4ad9-b4b2-891dce9d4bb3	d697788f-78e4-41ee-8781-9e6fab486fc1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkNjk3Nzg4Zi03OGU0LTQxZWUtODc4MS05ZTZmYWI0ODZmYzEiLCJlbWFpbCI6ImNvbXByYWRvci50ZXN0ZUBwcmVmZWl0dXJhLmdvdi5iciIsInJvbGUiOiJQVUJMSUNfRU5USVRZIiwic2Vzc2lvbklkIjoiMWJhOTRmMjctYzQ3MC00YWQ5LWI0YjItODkxZGNlOWQ0YmIzIiwiaWF0IjoxNzYwOTgzODYyLCJleHAiOjE3NjE1ODg2NjJ9.KaeM79T8Q6sdQPWcvlQGP1e27ynoU7ifp_sNIe5xZxM	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	2025-10-27 18:11:02.292	2025-10-20 18:11:02.294	2025-10-20 18:11:02.294
a57f5ab6-6062-4f22-a984-81369333b516	d697788f-78e4-41ee-8781-9e6fab486fc1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkNjk3Nzg4Zi03OGU0LTQxZWUtODc4MS05ZTZmYWI0ODZmYzEiLCJlbWFpbCI6ImNvbXByYWRvci50ZXN0ZUBwcmVmZWl0dXJhLmdvdi5iciIsInJvbGUiOiJQVUJMSUNfRU5USVRZIiwic2Vzc2lvbklkIjoiYTU3ZjVhYjYtNjA2Mi00ZjIyLWE5ODQtODEzNjkzMzNiNTE2IiwiaWF0IjoxNzYwOTgzODg0LCJleHAiOjE3NjE1ODg2ODR9.4V10mLojOb547ghd_OHHBicC1IZo1siCowik5QKOr8g	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	2025-10-27 18:11:24.428	2025-10-20 18:11:24.43	2025-10-20 18:11:24.43
cc794910-b714-4ced-be55-dc05409de3dd	adb3ab1b-5636-4791-80c4-ce6f55389fa5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZGIzYWIxYi01NjM2LTQ3OTEtODBjNC1jZTZmNTUzODlmYTUiLCJlbWFpbCI6ImFkbWluLnRlc3RlQGxpY2l0YWJyYXNpbC5jb20uYnIiLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiJjYzc5NDkxMC1iNzE0LTRjZWQtYmU1NS1kYzA1NDA5ZGUzZGQiLCJpYXQiOjE3NjExNjg3NjUsImV4cCI6MTc2MTc3MzU2NX0.BXtnN5bUCs9nytMiNkTRmFTOsR78yl_VYa_2twRcaLA	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	2025-10-29 21:32:45.689	2025-10-22 21:32:45.691	2025-10-22 21:32:45.691
ded84709-74ca-48d5-aae6-b5cc01c98882	c7533038-9dc5-400a-a62d-1a0d8b37ff62	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjNzUzMzAzOC05ZGM1LTQwMGEtYTYyZC0xYTBkOGIzN2ZmNjIiLCJlbWFpbCI6ImFkbWluQGxpY2l0YWJyYXNpbHdlYi5jb20uYnIiLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiJkZWQ4NDcwOS03NGNhLTQ4ZDUtYWFlNi1iNWNjMDFjOTg4ODIiLCJpYXQiOjE3NjExNzA3NTgsImV4cCI6MTc2MTc3NTU1OH0.lKI-JpYGwRjLfuJDmm842uWHiSlBUHsFNQjLoQW15lU	::ffff:172.18.0.5	curl/7.81.0	2025-10-29 22:05:58.485	2025-10-22 22:05:58.486	2025-10-22 22:05:58.486
f23299e0-b0cc-451c-a2e6-2306f71ca0b7	c7533038-9dc5-400a-a62d-1a0d8b37ff62	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjNzUzMzAzOC05ZGM1LTQwMGEtYTYyZC0xYTBkOGIzN2ZmNjIiLCJlbWFpbCI6ImFkbWluQGxpY2l0YWJyYXNpbHdlYi5jb20uYnIiLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiJmMjMyOTllMC1iMGNjLTQ1MWMtYTJlNi0yMzA2ZjcxY2EwYjciLCJpYXQiOjE3NjExNzA3NjYsImV4cCI6MTc2MTc3NTU2Nn0.VCyGY4xcrdcGIXWglXCcRUVW0npXiGBmYGF41a2Xca4	::ffff:172.18.0.5	curl/7.81.0	2025-10-29 22:06:06.9	2025-10-22 22:06:06.902	2025-10-22 22:06:06.902
df4a5f5b-37cc-4f33-866b-e7fbccac28db	c7533038-9dc5-400a-a62d-1a0d8b37ff62	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjNzUzMzAzOC05ZGM1LTQwMGEtYTYyZC0xYTBkOGIzN2ZmNjIiLCJlbWFpbCI6ImFkbWluQGxpY2l0YWJyYXNpbHdlYi5jb20uYnIiLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiJkZjRhNWY1Yi0zN2NjLTRmMzMtODY2Yi1lN2ZiY2NhYzI4ZGIiLCJpYXQiOjE3NjExNzE3MTUsImV4cCI6MTc2MTc3NjUxNX0.DFwu9mMMy7LN9UcmCkb-rbOmiRDF3LMykmn8U5UdGCU	::ffff:172.18.0.5	curl/7.81.0	2025-10-29 22:21:55.112	2025-10-22 22:21:55.114	2025-10-22 22:21:55.114
514d2f1e-8104-494a-8624-9af2c3a33d99	c7533038-9dc5-400a-a62d-1a0d8b37ff62	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjNzUzMzAzOC05ZGM1LTQwMGEtYTYyZC0xYTBkOGIzN2ZmNjIiLCJlbWFpbCI6ImFkbWluQGxpY2l0YWJyYXNpbHdlYi5jb20uYnIiLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiI1MTRkMmYxZS04MTA0LTQ5NGEtODYyNC05YWYyYzNhMzNkOTkiLCJpYXQiOjE3NjExNzE3MjIsImV4cCI6MTc2MTc3NjUyMn0.3bXsp4Em3wPdiuGCZ_HR9L6PwM7kK4G5BK9J1wcVjv4	::ffff:172.18.0.5	curl/7.81.0	2025-10-29 22:22:02.926	2025-10-22 22:22:02.927	2025-10-22 22:22:02.927
bd192958-9290-484a-bea8-1ec77013b3fc	c7533038-9dc5-400a-a62d-1a0d8b37ff62	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjNzUzMzAzOC05ZGM1LTQwMGEtYTYyZC0xYTBkOGIzN2ZmNjIiLCJlbWFpbCI6ImFkbWluQGxpY2l0YWJyYXNpbHdlYi5jb20uYnIiLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiJiZDE5Mjk1OC05MjkwLTQ4NGEtYmVhOC0xZWM3NzAxM2IzZmMiLCJpYXQiOjE3NjExNzMwMzEsImV4cCI6MTc2MTc3NzgzMX0.ehxHtdTSCWbfChPgKyO5k-gb_-ee9z7DARf5wbcHxB0	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	2025-10-29 22:43:51.097	2025-10-22 22:43:51.098	2025-10-22 22:43:51.098
d8290366-6fe8-4939-8526-9cb45169d8eb	adb3ab1b-5636-4791-80c4-ce6f55389fa5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZGIzYWIxYi01NjM2LTQ3OTEtODBjNC1jZTZmNTUzODlmYTUiLCJlbWFpbCI6ImFkbWluLnRlc3RlQGxpY2l0YWJyYXNpbC5jb20uYnIiLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiJkODI5MDM2Ni02ZmU4LTQ5MzktODUyNi05Y2I0NTE2OWQ4ZWIiLCJpYXQiOjE3NjExNzMxMjAsImV4cCI6MTc2MTc3NzkyMH0.YNMzYdG8HmoCJwMCK7spvbIWV70P9g9Lf5g6YR6hGp4	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	2025-10-29 22:45:20.376	2025-10-22 22:45:20.377	2025-10-22 22:45:20.377
cd95bd00-1698-4260-b8fb-ea866741b5ea	d10b1bc3-e459-42ac-a49a-16f749198d10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkMTBiMWJjMy1lNDU5LTQyYWMtYTQ5YS0xNmY3NDkxOThkMTAiLCJlbWFpbCI6InRlc3RlLmRhc2hib2FyZDNAZXhhbXBsZS5jb20iLCJyb2xlIjoiQ0lUSVpFTiIsInNlc3Npb25JZCI6ImNkOTViZDAwLTE2OTgtNDI2MC1iOGZiLWVhODY2NzQxYjVlYSIsImlhdCI6MTc2MTE3MzY0NCwiZXhwIjoxNzYxNzc4NDQ0fQ.CaDNWl7Qf8VOzu5WsDFK6aKAPtIbinFEVs6JIHdsRS4	::ffff:172.18.0.1	curl/7.81.0	2025-10-29 22:54:04.599	2025-10-22 22:54:04.6	2025-10-22 22:54:04.6
1515e30c-5cf6-430e-87c9-ef5a5b504b3f	adb3ab1b-5636-4791-80c4-ce6f55389fa5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZGIzYWIxYi01NjM2LTQ3OTEtODBjNC1jZTZmNTUzODlmYTUiLCJlbWFpbCI6ImFkbWluLnRlc3RlQGxpY2l0YWJyYXNpbC5jb20uYnIiLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiIxNTE1ZTMwYy01Y2Y2LTQzMGUtODdjOS1lZjVhNWI1MDRiM2YiLCJpYXQiOjE3NjExNzM3NzIsImV4cCI6MTc2MTc3ODU3Mn0.WexXazJnDNNgQgxh-MoRdcibL2actTE-A2C-rgfh19Y	::ffff:172.18.0.1	curl/7.81.0	2025-10-29 22:56:12.152	2025-10-22 22:56:12.153	2025-10-22 22:56:12.153
150ee720-8ed7-4e0e-afa1-562e86aa2fe8	d46ec9ac-5acd-43db-9b2a-4d1e19910790	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkNDZlYzlhYy01YWNkLTQzZGItOWIyYS00ZDFlMTk5MTA3OTAiLCJlbWFpbCI6ImF1ZGl0b3IudGVzdGVAZXhhbXBsZS5jb20iLCJyb2xlIjoiQVVESVRPUiIsInNlc3Npb25JZCI6IjE1MGVlNzIwLThlZDctNGUwZS1hZmExLTU2MmU4NmFhMmZlOCIsImlhdCI6MTc2MTE3Mzc5MSwiZXhwIjoxNzYxNzc4NTkxfQ.lIs2SY0LrrFtkI2XTPy2mNgwL3d0vElNzBUtWYqdyP0	::ffff:172.18.0.1	curl/7.81.0	2025-10-29 22:56:31.226	2025-10-22 22:56:31.227	2025-10-22 22:56:31.227
084777d8-6e71-4988-8da9-b78def72ffa2	c7533038-9dc5-400a-a62d-1a0d8b37ff62	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjNzUzMzAzOC05ZGM1LTQwMGEtYTYyZC0xYTBkOGIzN2ZmNjIiLCJlbWFpbCI6ImFkbWluQGxpY2l0YWJyYXNpbHdlYi5jb20uYnIiLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiIwODQ3NzdkOC02ZTcxLTQ5ODgtOGRhOS1iNzhkZWY3MmZmYTIiLCJpYXQiOjE3NjExNzk3NjEsImV4cCI6MTc2MTc4NDU2MX0.L1RNlsKzv_TSuyZSNESph1oEjmN5EOOIfDCFD2irgN0	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	2025-10-30 00:36:01.465	2025-10-23 00:36:01.466	2025-10-23 00:36:01.466
15a0a325-2c13-4989-81cc-1768a7a93863	c7533038-9dc5-400a-a62d-1a0d8b37ff62	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjNzUzMzAzOC05ZGM1LTQwMGEtYTYyZC0xYTBkOGIzN2ZmNjIiLCJlbWFpbCI6ImFkbWluQGxpY2l0YWJyYXNpbHdlYi5jb20uYnIiLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiIxNWEwYTMyNS0yYzEzLTQ5ODktODFjYy0xNzY4YTdhOTM4NjMiLCJpYXQiOjE3NjExNzk4MDIsImV4cCI6MTc2MTc4NDYwMn0.2EMewjSIBf0HP1Mf53mCz_9cfbdwdSduyMvwXRd07vQ	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	2025-10-30 00:36:42.985	2025-10-23 00:36:42.987	2025-10-23 00:36:42.987
9c074459-5d82-4d8e-8f5e-bbf706f2fd30	adb3ab1b-5636-4791-80c4-ce6f55389fa5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZGIzYWIxYi01NjM2LTQ3OTEtODBjNC1jZTZmNTUzODlmYTUiLCJlbWFpbCI6ImFkbWluLnRlc3RlQGxpY2l0YWJyYXNpbC5jb20uYnIiLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiI5YzA3NDQ1OS01ZDgyLTRkOGUtOGY1ZS1iYmY3MDZmMmZkMzAiLCJpYXQiOjE3NjExNzk4MzEsImV4cCI6MTc2MTc4NDYzMX0.hHcn55GOlze7ndbKdbjOMRvBEvDPI1iVsOtpjtAExNc	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	2025-10-30 00:37:11.253	2025-10-23 00:37:11.256	2025-10-23 00:37:11.256
158afdff-7643-4c55-b98e-302cb584af50	adb3ab1b-5636-4791-80c4-ce6f55389fa5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZGIzYWIxYi01NjM2LTQ3OTEtODBjNC1jZTZmNTUzODlmYTUiLCJlbWFpbCI6ImFkbWluLnRlc3RlQGxpY2l0YWJyYXNpbC5jb20uYnIiLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiIxNThhZmRmZi03NjQzLTRjNTUtYjk4ZS0zMDJjYjU4NGFmNTAiLCJpYXQiOjE3NjExODAzNjIsImV4cCI6MTc2MTc4NTE2Mn0.W9fymHr6U3ccIvgByWNUqU0fBgAP7LxS1OM3Oh3A808	::ffff:172.18.0.1	curl/7.81.0	2025-10-30 00:46:02.853	2025-10-23 00:46:02.854	2025-10-23 00:46:02.854
91b020bc-b692-49c5-b889-908dc37dc762	adb3ab1b-5636-4791-80c4-ce6f55389fa5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZGIzYWIxYi01NjM2LTQ3OTEtODBjNC1jZTZmNTUzODlmYTUiLCJlbWFpbCI6ImFkbWluLnRlc3RlQGxpY2l0YWJyYXNpbC5jb20uYnIiLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiI5MWIwMjBiYy1iNjkyLTQ5YzUtYjg4OS05MDhkYzM3ZGM3NjIiLCJpYXQiOjE3NjExODAzNjksImV4cCI6MTc2MTc4NTE2OX0.O8VndiUj3iinp2s6PYU4kXaTi2pivcZy6ZAWJaF9LJE	::ffff:172.18.0.1	curl/7.81.0	2025-10-30 00:46:09.339	2025-10-23 00:46:09.34	2025-10-23 00:46:09.34
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: licitabrasil
--

COPY public.users (id, email, password, role, status, "firstName", "lastName", phone, avatar, "lastLoginAt", "createdAt", "updatedAt") FROM stdin;
d46ec9ac-5acd-43db-9b2a-4d1e19910790	auditor.teste@example.com	$2a$12$WKEngfanEr4X4QMIlCT2.OdInOvB/JF69T4IsfyIYPCYxmRLMCD1u	AUDITOR	ACTIVE	Auditor	Teste	(11) 9 8888-8888	\N	2025-10-22 22:56:31.245	2025-10-22 22:54:12.773	2025-10-22 22:56:31.246
a99e5cb5-ee49-4512-a7f9-58edf6c5602d	fornecedor.teste@empresa.com.br	$2a$12$05aIuMCMPyOZxAbkE5LN9uEJflrRsVTrhe8Mw6yUy75a/OdupJ0Ly	SUPPLIER	ACTIVE	João	Silva	(11) 99999-1111	\N	2025-10-20 17:50:36.554	2025-09-30 18:01:07.806	2025-10-20 17:50:36.554
2fa009ec-e14f-47a1-bfb5-85eeff3e2a3f	cidadao.teste@email.com	$2a$12$o/Khr9xIh/iRi7sIYwfhNu8kdslkXz1z7ML0zn1Dgj1Z7ggS4L6re	CITIZEN	ACTIVE	Carlos	Oliveira	(11) 99999-3333	\N	2025-10-20 17:51:21.799	2025-09-30 18:02:39.472	2025-10-20 17:51:21.8
0d622af4-e8b7-493b-9b62-85062dcc2151	auditor.teste@tcu.gov.br	$2a$12$o/Khr9xIh/iRi7sIYwfhNu8kdslkXz1z7ML0zn1Dgj1Z7ggS4L6re	AUDITOR	ACTIVE	Ana	Costa	(61) 3316-5000	\N	2025-10-20 17:51:39.9	2025-09-30 18:02:39.487	2025-10-20 17:51:39.901
d10b1bc3-e459-42ac-a49a-16f749198d10	teste.dashboard3@example.com	$2a$12$RawPtVkvmMIZRmlLd8VIzu4DAhD7eNfggnQI0QNyUv3NiWDda3lYW	CITIZEN	ACTIVE	Teste	Dashboard	(11) 9 9999-9999	\N	2025-10-22 22:54:04.603	2025-10-22 22:53:57.66	2025-10-22 22:54:04.604
d697788f-78e4-41ee-8781-9e6fab486fc1	comprador.teste@prefeitura.gov.br	$2a$12$Cyj7ZDdkNZjn8HDuZzXw0eTHmM3InhSv2dxCiUygshsqcpmXoo8tu	PUBLIC_ENTITY	ACTIVE	Maria	Santos	(11) 99999-2222	\N	2025-10-20 18:11:24.431	2025-09-30 18:01:18.844	2025-10-20 18:11:24.432
de34b3ee-2278-4ee0-acba-69e6df6d2dd0	teste10@exemplo.com	$2a$12$2YGVVKPiTrp.5BMhy5JZmO58lt/oLaomJSuNqhsjvlIlpkKM8kYzO	CITIZEN	ACTIVE	João	Silva	(11) 9 1234-5678	\N	\N	2025-10-21 19:00:53.167	2025-10-21 19:00:53.167
8b64c99d-dcf0-4234-b47b-b1a2e3144d92	teste_novo_usuario@exemplo.com	$2a$12$txrEpUvFFHMXi/2XlIxEPuUpGdPPmuTsTz223MmE5/fsXHxaYEGWe	CITIZEN	ACTIVE	João	Silva	(11) 9 1234-5678	\N	\N	2025-10-21 19:01:11.616	2025-10-21 19:01:11.616
6fede524-9a92-498b-83d4-8c64ff0ba25f	fornecedor_teste@exemplo.com	$2a$12$cazf2MusiWpjxgZ1siPvseV623JhFBST9zIBmsURfLS2pntPemfbq	SUPPLIER	PENDING	Maria	Santos	(21) 9 8765-4321	\N	\N	2025-10-21 19:01:21.486	2025-10-21 19:01:21.486
3daea0be-0794-4869-9242-a162add71e60	orgao_publico_teste@exemplo.com	$2a$12$vmKajYYPa.pslY87TesW1eWu3wuJXCJzHrwOW3raxDfV.RRhDIYZy	PUBLIC_ENTITY	PENDING	Carlos	Oliveira	(31) 9 5555-1234	\N	\N	2025-10-21 19:01:30.834	2025-10-21 19:01:30.834
adb3ab1b-5636-4791-80c4-ce6f55389fa5	admin.teste@licitabrasil.com.br	$2a$12$o/Khr9xIh/iRi7sIYwfhNu8kdslkXz1z7ML0zn1Dgj1Z7ggS4L6re	ADMIN	ACTIVE	Administrador	Sistema	(11) 99999-0000	\N	2025-10-23 00:48:12.081	2025-09-30 18:02:39.461	2025-10-23 00:48:12.082
61b2a9b6-bc92-4a8a-b431-5667ccfb5446	teste_final@exemplo.com	$2a$12$5x.Kq3GKdle9oWlsQSz4B.82jWwEIfqjlVscWLAOfIX.9rb8smtoG	AUDITOR	PENDING	Ana	Costa	(41) 9 7777-8888	\N	\N	2025-10-21 19:04:20.951	2025-10-21 19:04:20.951
5593452d-8822-4c1a-b49e-15663093fe2d	teste_verificacao@exemplo.com	$2a$12$Vw2x8sJIyVWRrsHSMfmGZeABKJOrDMBAP1pw2OucaejSlj6Gaf9Wm	CITIZEN	ACTIVE	Maria	Santos	(21) 9 8765-4321	\N	\N	2025-10-21 19:17:48.02	2025-10-21 19:17:48.02
6d58dc16-e0a7-41b0-87c7-67ee71196776	teste_auditor_frontend@exemplo.com	$2a$12$vZ0ghhkhbbS3fRag8fy5eOLoD0f.9TPnBhVKEQpRaZuD2J99Wf6CS	AUDITOR	PENDING	Carlos	Auditor	(11) 9 8888-7777	\N	\N	2025-10-21 19:21:22.958	2025-10-21 19:21:22.958
6160bb7d-e1d1-4303-879d-88ffb1cde657	teste_sem_confirm@exemplo.com	$2a$12$RZfYSIy16KLj0pG7rgZKHucDQMxPI7u57ubx9CR6VH4MGW4q4dDIC	CITIZEN	ACTIVE	Sem	Confirm	(11) 9 1234-5678	\N	\N	2025-10-21 19:30:56.398	2025-10-21 19:30:56.398
3eaab016-566e-4657-a20a-b9f9d708fc17	teste_aguardando@exemplo.com	$2a$12$2zGLg71MJ7IzKZ08JC62mueG6KfwAtag2/btW6w5JmY1POIgOKsdq	CITIZEN	ACTIVE	Aguardando	Teste	(11) 9 1234-5678	\N	\N	2025-10-21 19:34:02.385	2025-10-21 19:34:02.385
8b69841f-996d-424d-8435-f9c61acb0b74	teste_final_sucesso@exemplo.com	$2a$12$THg6K2mec5ZTZ6qT9t982e8A7Fq/cgURn7yfUuxrISEvUJYXW.NBm	CITIZEN	ACTIVE	Final	Sucesso	(11) 9 1234-5678	\N	\N	2025-10-21 19:37:59.048	2025-10-21 19:37:59.048
d1447fd0-918a-4637-94e3-7bd76cfaa07a	teste_auditor_sucesso@exemplo.com	$2a$12$DUUPOSshRZu/PXjPFiC1yuyjw/fZ5ly5rLBy4FZNPoaBeHbprasTi	AUDITOR	PENDING	Auditor	Sucesso	(21) 9 8765-4321	\N	\N	2025-10-21 19:38:01.311	2025-10-21 19:38:01.311
13e2f0a1-4b07-4857-b936-865061df02a7	teste_supplier_sucesso@exemplo.com	$2a$12$2JSlDjRiQyz3bxgpKmg0NujWAlJwGGP4jJrty8N16zUoqLOmdMIoK	SUPPLIER	PENDING	Supplier	Sucesso	(31) 9 5555-1234	\N	\N	2025-10-21 19:38:03.393	2025-10-21 19:38:03.393
db421148-29f2-4af4-81dd-37e5512c6fcf	fabio.santos@century.net.br	$2a$12$0.aR7LUsg4R54tcPb3ISnuDc/tU3imXtyYQv/GcOZ8HkIuJzBqUY2	SUPPLIER	PENDING	Fabio 	Santos	(31) 9 8266-7628	\N	\N	2025-10-21 19:53:06.443	2025-10-21 19:53:06.443
c7533038-9dc5-400a-a62d-1a0d8b37ff62	admin@licitabrasilweb.com.br	$2a$12$fuNhAWgssn.bEuV5gv60eOCLGcpSLsFFLIuKI3zMD69nlditllbJu	ADMIN	ACTIVE	Administrador	Sistema	\N	\N	2025-10-23 00:36:51.085	2025-10-22 22:05:18.36	2025-10-23 00:36:51.085
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: bidding_categories bidding_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.bidding_categories
    ADD CONSTRAINT bidding_categories_pkey PRIMARY KEY (id);


--
-- Name: biddings biddings_pkey; Type: CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.biddings
    ADD CONSTRAINT biddings_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: citizens citizens_pkey; Type: CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.citizens
    ADD CONSTRAINT citizens_pkey PRIMARY KEY (id);


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: proposal_items proposal_items_pkey; Type: CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.proposal_items
    ADD CONSTRAINT proposal_items_pkey PRIMARY KEY (id);


--
-- Name: proposals proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_pkey PRIMARY KEY (id);


--
-- Name: public_entities public_entities_pkey; Type: CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.public_entities
    ADD CONSTRAINT public_entities_pkey PRIMARY KEY (id);


--
-- Name: supplier_categories supplier_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.supplier_categories
    ADD CONSTRAINT supplier_categories_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: system_configs system_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.system_configs
    ADD CONSTRAINT system_configs_pkey PRIMARY KEY (id);


--
-- Name: user_permissions user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: bidding_categories_biddingId_categoryId_key; Type: INDEX; Schema: public; Owner: licitabrasil
--

CREATE UNIQUE INDEX "bidding_categories_biddingId_categoryId_key" ON public.bidding_categories USING btree ("biddingId", "categoryId");


--
-- Name: biddings_biddingNumber_key; Type: INDEX; Schema: public; Owner: licitabrasil
--

CREATE UNIQUE INDEX "biddings_biddingNumber_key" ON public.biddings USING btree ("biddingNumber");


--
-- Name: categories_code_key; Type: INDEX; Schema: public; Owner: licitabrasil
--

CREATE UNIQUE INDEX categories_code_key ON public.categories USING btree (code);


--
-- Name: categories_name_key; Type: INDEX; Schema: public; Owner: licitabrasil
--

CREATE UNIQUE INDEX categories_name_key ON public.categories USING btree (name);


--
-- Name: citizens_cpf_key; Type: INDEX; Schema: public; Owner: licitabrasil
--

CREATE UNIQUE INDEX citizens_cpf_key ON public.citizens USING btree (cpf);


--
-- Name: citizens_userId_key; Type: INDEX; Schema: public; Owner: licitabrasil
--

CREATE UNIQUE INDEX "citizens_userId_key" ON public.citizens USING btree ("userId");


--
-- Name: contracts_biddingId_key; Type: INDEX; Schema: public; Owner: licitabrasil
--

CREATE UNIQUE INDEX "contracts_biddingId_key" ON public.contracts USING btree ("biddingId");


--
-- Name: contracts_contractNumber_key; Type: INDEX; Schema: public; Owner: licitabrasil
--

CREATE UNIQUE INDEX "contracts_contractNumber_key" ON public.contracts USING btree ("contractNumber");


--
-- Name: contracts_proposalId_key; Type: INDEX; Schema: public; Owner: licitabrasil
--

CREATE UNIQUE INDEX "contracts_proposalId_key" ON public.contracts USING btree ("proposalId");


--
-- Name: proposals_biddingId_supplierId_key; Type: INDEX; Schema: public; Owner: licitabrasil
--

CREATE UNIQUE INDEX "proposals_biddingId_supplierId_key" ON public.proposals USING btree ("biddingId", "supplierId");


--
-- Name: public_entities_cnpj_key; Type: INDEX; Schema: public; Owner: licitabrasil
--

CREATE UNIQUE INDEX public_entities_cnpj_key ON public.public_entities USING btree (cnpj);


--
-- Name: public_entities_userId_key; Type: INDEX; Schema: public; Owner: licitabrasil
--

CREATE UNIQUE INDEX "public_entities_userId_key" ON public.public_entities USING btree ("userId");


--
-- Name: supplier_categories_supplierId_categoryId_key; Type: INDEX; Schema: public; Owner: licitabrasil
--

CREATE UNIQUE INDEX "supplier_categories_supplierId_categoryId_key" ON public.supplier_categories USING btree ("supplierId", "categoryId");


--
-- Name: suppliers_cnpj_key; Type: INDEX; Schema: public; Owner: licitabrasil
--

CREATE UNIQUE INDEX suppliers_cnpj_key ON public.suppliers USING btree (cnpj);


--
-- Name: suppliers_userId_key; Type: INDEX; Schema: public; Owner: licitabrasil
--

CREATE UNIQUE INDEX "suppliers_userId_key" ON public.suppliers USING btree ("userId");


--
-- Name: system_configs_key_key; Type: INDEX; Schema: public; Owner: licitabrasil
--

CREATE UNIQUE INDEX system_configs_key_key ON public.system_configs USING btree (key);


--
-- Name: user_permissions_userId_permission_key; Type: INDEX; Schema: public; Owner: licitabrasil
--

CREATE UNIQUE INDEX "user_permissions_userId_permission_key" ON public.user_permissions USING btree ("userId", permission);


--
-- Name: user_sessions_token_key; Type: INDEX; Schema: public; Owner: licitabrasil
--

CREATE UNIQUE INDEX user_sessions_token_key ON public.user_sessions USING btree (token);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: licitabrasil
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: audit_logs audit_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: bidding_categories bidding_categories_biddingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.bidding_categories
    ADD CONSTRAINT "bidding_categories_biddingId_fkey" FOREIGN KEY ("biddingId") REFERENCES public.biddings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bidding_categories bidding_categories_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.bidding_categories
    ADD CONSTRAINT "bidding_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: biddings biddings_publicEntityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.biddings
    ADD CONSTRAINT "biddings_publicEntityId_fkey" FOREIGN KEY ("publicEntityId") REFERENCES public.public_entities(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: categories categories_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: citizens citizens_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.citizens
    ADD CONSTRAINT "citizens_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: contracts contracts_biddingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT "contracts_biddingId_fkey" FOREIGN KEY ("biddingId") REFERENCES public.biddings(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: contracts contracts_proposalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT "contracts_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES public.proposals(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: contracts contracts_publicEntityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT "contracts_publicEntityId_fkey" FOREIGN KEY ("publicEntityId") REFERENCES public.public_entities(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: contracts contracts_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT "contracts_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public.suppliers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: documents documents_biddingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_biddingId_fkey" FOREIGN KEY ("biddingId") REFERENCES public.biddings(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: documents documents_contractId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES public.contracts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: documents documents_proposalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES public.proposals(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: documents documents_publicEntityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_publicEntityId_fkey" FOREIGN KEY ("publicEntityId") REFERENCES public.public_entities(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: documents documents_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: proposal_items proposal_items_proposalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.proposal_items
    ADD CONSTRAINT "proposal_items_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES public.proposals(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: proposals proposals_biddingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT "proposals_biddingId_fkey" FOREIGN KEY ("biddingId") REFERENCES public.biddings(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: proposals proposals_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT "proposals_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public.suppliers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: public_entities public_entities_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.public_entities
    ADD CONSTRAINT "public_entities_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: supplier_categories supplier_categories_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.supplier_categories
    ADD CONSTRAINT "supplier_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: supplier_categories supplier_categories_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.supplier_categories
    ADD CONSTRAINT "supplier_categories_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public.suppliers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: suppliers suppliers_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT "suppliers_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_permissions user_permissions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: licitabrasil
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict n6rHlREOAxaxKHoGcEuGNkcU3WdfcALMsVR5TLWhWSdzEjjIfKI6bcQyu6Rxoxz

