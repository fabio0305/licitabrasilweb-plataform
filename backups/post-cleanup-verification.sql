--
-- PostgreSQL database dump
--

\restrict CdTVKkMclh8y9oOiL3b3ecQXqrOkYrrsle5GVQePunn7AGz254nVL2EaNzN3UfW

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
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "legalRepresentativeCpf" text,
    "legalRepresentativeName" text,
    "legalRepresentativePosition" text,
    sphere text
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
b06f11f6-05a4-4c59-9083-6c13fc7fd421	8dc365fd124cb0a73a2e6539fee381652fcb3cfee30765a12cbb35bf00313e79	2025-10-23 01:09:55.176616+00	20250917204809_init	\N	\N	2025-10-23 01:09:54.89855+00	1
1ecec2e3-8244-4db2-b25a-6a8b5a9f8d60	20c66bee421541d018fa8ed5c3a3b1d9192608926705fdb0a4170b4d86d94a6c	2025-10-23 01:09:55.217752+00	20250929223634_add_citizen_profile_and_permissions	\N	\N	2025-10-23 01:09:55.178109+00	1
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
fc84a983-2da8-4b77-a4fe-99b43f873517	Tecnologia da Informação	Equipamentos, software e serviços de TI	TI	\N	t	2025-10-23 02:30:02.689	2025-10-23 02:30:02.689
60c29a3b-08e8-4442-8d51-9792fe618499	Construção Civil	Obras, reformas e construções	CONST	\N	t	2025-10-23 02:30:02.833	2025-10-23 02:30:02.833
c73c8835-1acc-4a5c-a174-6a0472fce7b4	Serviços Gerais	Serviços diversos para administração pública	SERV	\N	t	2025-10-23 02:30:02.838	2025-10-23 02:30:02.838
1ff61159-4688-4f10-83c0-955b732bf759	Material de Escritório	Materiais e equipamentos de escritório	ESC	\N	t	2025-10-23 02:30:02.842	2025-10-23 02:30:02.842
efa8717d-1cfd-4b36-b2db-02d02224f0bf	Veículos e Transporte	Veículos, combustível e serviços de transporte	TRANSP	\N	t	2025-10-23 02:30:02.846	2025-10-23 02:30:02.846
59556243-2ee3-4020-a48b-95515e61eaf0	Saúde	Equipamentos médicos, medicamentos e serviços de saúde	SAUDE	\N	t	2025-10-23 02:30:02.85	2025-10-23 02:30:02.85
6a58c187-4481-4384-99d0-ba56971428e0	Educação	Material didático, equipamentos e serviços educacionais	EDU	\N	t	2025-10-23 02:30:02.855	2025-10-23 02:30:02.855
620d02f9-189b-4a0a-b7be-85a096fa761e	Segurança	Equipamentos e serviços de segurança	SEG	\N	t	2025-10-23 02:30:02.859	2025-10-23 02:30:02.859
a36490c6-4bf0-4eff-9fe9-27d8439ba47d	Alimentação	Gêneros alimentícios e serviços de alimentação	ALIM	\N	t	2025-10-23 02:30:02.863	2025-10-23 02:30:02.863
e0ddbf4e-bbb5-49ba-a22a-2cdb13180d9d	Limpeza e Conservação	Produtos de limpeza e serviços de conservação	LIMP	\N	t	2025-10-23 02:30:02.866	2025-10-23 02:30:02.866
b9d5ccc3-ca6f-4a32-88b1-037f47cbd73d	Hardware	Computadores, servidores, equipamentos de rede	TI-HW	fc84a983-2da8-4b77-a4fe-99b43f873517	t	2025-10-23 02:30:02.872	2025-10-23 02:30:02.872
156d80dc-b314-497c-bd99-3f167b0a9a71	Software	Licenças de software, sistemas, aplicativos	TI-SW	fc84a983-2da8-4b77-a4fe-99b43f873517	t	2025-10-23 02:30:02.877	2025-10-23 02:30:02.877
644f0dcb-d3ec-45f3-b28e-67b5322cfff4	Serviços de TI	Desenvolvimento, manutenção, consultoria em TI	TI-SERV	fc84a983-2da8-4b77-a4fe-99b43f873517	t	2025-10-23 02:30:02.881	2025-10-23 02:30:02.881
a92d0832-2faf-45e2-8534-234540189919	Obras Públicas	Construção de prédios públicos, estradas, pontes	CONST-OBRAS	60c29a3b-08e8-4442-8d51-9792fe618499	t	2025-10-23 02:30:02.886	2025-10-23 02:30:02.886
28fb7191-cda3-4f04-92dd-d793877777fe	Reformas	Reformas e manutenção de edificações	CONST-REF	60c29a3b-08e8-4442-8d51-9792fe618499	t	2025-10-23 02:30:02.89	2025-10-23 02:30:02.89
82b5aa5f-217f-42ec-a716-bd31de830dcf	Material de Construção	Cimento, ferro, materiais de construção	CONST-MAT	60c29a3b-08e8-4442-8d51-9792fe618499	t	2025-10-23 02:30:02.894	2025-10-23 02:30:02.894
2f775f38-3d4f-4af7-b234-d21dcc47b79b	Equipamentos Médicos	Equipamentos hospitalares e médicos	SAUDE-EQUIP	59556243-2ee3-4020-a48b-95515e61eaf0	t	2025-10-23 02:30:02.899	2025-10-23 02:30:02.899
14d85965-80df-4611-aca0-a99f6acda1bf	Medicamentos	Medicamentos e produtos farmacêuticos	SAUDE-MED	59556243-2ee3-4020-a48b-95515e61eaf0	t	2025-10-23 02:30:02.902	2025-10-23 02:30:02.902
65cb5da8-8b79-4185-b6c7-e22faf620758	Serviços de Saúde	Serviços médicos e hospitalares	SAUDE-SERV	59556243-2ee3-4020-a48b-95515e61eaf0	t	2025-10-23 02:30:02.906	2025-10-23 02:30:02.906
\.


--
-- Data for Name: citizens; Type: TABLE DATA; Schema: public; Owner: licitabrasil
--

COPY public.citizens (id, "userId", cpf, "dateOfBirth", profession, address, city, state, "zipCode", interests, "isActive", "verifiedAt", "createdAt", "updatedAt") FROM stdin;
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

COPY public.public_entities (id, "userId", name, cnpj, "entityType", address, city, state, "zipCode", phone, website, "isActive", "verifiedAt", "createdAt", "updatedAt", "legalRepresentativeCpf", "legalRepresentativeName", "legalRepresentativePosition", sphere) FROM stdin;
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
ea4033c1-c72f-4368-a50e-b8651083306a	e28f5b1d-55ca-4488-9301-e9b91ba84702	READ_PUBLIC_DATA	e28f5b1d-55ca-4488-9301-e9b91ba84702	2025-10-23 02:31:00.517	\N	t	2025-10-23 02:31:00.517	2025-10-23 02:31:00.517
37d97995-6a6e-4211-a539-be33631fe33d	e28f5b1d-55ca-4488-9301-e9b91ba84702	READ_PRIVATE_DATA	e28f5b1d-55ca-4488-9301-e9b91ba84702	2025-10-23 02:31:00.526	\N	t	2025-10-23 02:31:00.526	2025-10-23 02:31:00.526
f61ab5c9-7286-47cb-a0d2-f601a404fcfd	e28f5b1d-55ca-4488-9301-e9b91ba84702	WRITE_DATA	e28f5b1d-55ca-4488-9301-e9b91ba84702	2025-10-23 02:31:00.53	\N	t	2025-10-23 02:31:00.53	2025-10-23 02:31:00.53
f22b4506-34f0-4a97-8cc6-70172f8ccd29	e28f5b1d-55ca-4488-9301-e9b91ba84702	DELETE_DATA	e28f5b1d-55ca-4488-9301-e9b91ba84702	2025-10-23 02:31:00.535	\N	t	2025-10-23 02:31:00.535	2025-10-23 02:31:00.535
9996a152-8cb9-40d8-b5a1-6766857e0849	e28f5b1d-55ca-4488-9301-e9b91ba84702	CREATE_BIDDING	e28f5b1d-55ca-4488-9301-e9b91ba84702	2025-10-23 02:31:00.539	\N	t	2025-10-23 02:31:00.539	2025-10-23 02:31:00.539
5779422e-4d81-45fa-a62d-9df305b00d14	e28f5b1d-55ca-4488-9301-e9b91ba84702	EDIT_BIDDING	e28f5b1d-55ca-4488-9301-e9b91ba84702	2025-10-23 02:31:00.544	\N	t	2025-10-23 02:31:00.544	2025-10-23 02:31:00.544
2536175d-0517-47e6-993b-615e0dbc799c	e28f5b1d-55ca-4488-9301-e9b91ba84702	DELETE_BIDDING	e28f5b1d-55ca-4488-9301-e9b91ba84702	2025-10-23 02:31:00.548	\N	t	2025-10-23 02:31:00.548	2025-10-23 02:31:00.548
9f26e547-5588-4ce7-ada2-6a32498cb19f	e28f5b1d-55ca-4488-9301-e9b91ba84702	PUBLISH_BIDDING	e28f5b1d-55ca-4488-9301-e9b91ba84702	2025-10-23 02:31:00.553	\N	t	2025-10-23 02:31:00.553	2025-10-23 02:31:00.553
2035956f-eb52-4d4b-9c8b-535df4577073	e28f5b1d-55ca-4488-9301-e9b91ba84702	CANCEL_BIDDING	e28f5b1d-55ca-4488-9301-e9b91ba84702	2025-10-23 02:31:00.558	\N	t	2025-10-23 02:31:00.558	2025-10-23 02:31:00.558
229b25a2-b558-4290-822f-16f27ceca9e9	e28f5b1d-55ca-4488-9301-e9b91ba84702	CREATE_PROPOSAL	e28f5b1d-55ca-4488-9301-e9b91ba84702	2025-10-23 02:31:00.562	\N	t	2025-10-23 02:31:00.562	2025-10-23 02:31:00.562
18b15f4a-6219-4dda-8ef3-d305dcb8fee9	e28f5b1d-55ca-4488-9301-e9b91ba84702	EDIT_PROPOSAL	e28f5b1d-55ca-4488-9301-e9b91ba84702	2025-10-23 02:31:00.566	\N	t	2025-10-23 02:31:00.566	2025-10-23 02:31:00.566
e0f7a4c8-623a-4461-a769-7162b6f04f99	e28f5b1d-55ca-4488-9301-e9b91ba84702	DELETE_PROPOSAL	e28f5b1d-55ca-4488-9301-e9b91ba84702	2025-10-23 02:31:00.57	\N	t	2025-10-23 02:31:00.57	2025-10-23 02:31:00.57
65dae89e-787d-425d-9c28-0551618e47b0	e28f5b1d-55ca-4488-9301-e9b91ba84702	SUBMIT_PROPOSAL	e28f5b1d-55ca-4488-9301-e9b91ba84702	2025-10-23 02:31:00.576	\N	t	2025-10-23 02:31:00.576	2025-10-23 02:31:00.576
fc707545-b422-4ed6-9271-4aad44c4fe15	e28f5b1d-55ca-4488-9301-e9b91ba84702	CREATE_CONTRACT	e28f5b1d-55ca-4488-9301-e9b91ba84702	2025-10-23 02:31:00.58	\N	t	2025-10-23 02:31:00.58	2025-10-23 02:31:00.58
c2ece8ac-6e67-42d6-8672-bba90767ca51	e28f5b1d-55ca-4488-9301-e9b91ba84702	EDIT_CONTRACT	e28f5b1d-55ca-4488-9301-e9b91ba84702	2025-10-23 02:31:00.584	\N	t	2025-10-23 02:31:00.584	2025-10-23 02:31:00.584
c95c4657-b4aa-4214-8f83-3f72e418e6e8	e28f5b1d-55ca-4488-9301-e9b91ba84702	SIGN_CONTRACT	e28f5b1d-55ca-4488-9301-e9b91ba84702	2025-10-23 02:31:00.589	\N	t	2025-10-23 02:31:00.589	2025-10-23 02:31:00.589
ddd29e98-7817-4f6b-a8d0-bbe5fdc544fd	e28f5b1d-55ca-4488-9301-e9b91ba84702	TERMINATE_CONTRACT	e28f5b1d-55ca-4488-9301-e9b91ba84702	2025-10-23 02:31:00.593	\N	t	2025-10-23 02:31:00.593	2025-10-23 02:31:00.593
ddab07ad-9b60-4043-b1f0-f833d64411f1	e28f5b1d-55ca-4488-9301-e9b91ba84702	MANAGE_USERS	e28f5b1d-55ca-4488-9301-e9b91ba84702	2025-10-23 02:31:00.598	\N	t	2025-10-23 02:31:00.598	2025-10-23 02:31:00.598
1dc5051e-2685-4418-98a7-172bb038b824	e28f5b1d-55ca-4488-9301-e9b91ba84702	MANAGE_SYSTEM	e28f5b1d-55ca-4488-9301-e9b91ba84702	2025-10-23 02:31:00.602	\N	t	2025-10-23 02:31:00.602	2025-10-23 02:31:00.602
b47b916c-51fd-43d4-a29a-884289ab82d8	e28f5b1d-55ca-4488-9301-e9b91ba84702	VIEW_AUDIT_LOGS	e28f5b1d-55ca-4488-9301-e9b91ba84702	2025-10-23 02:31:00.606	\N	t	2025-10-23 02:31:00.606	2025-10-23 02:31:00.606
b075ac15-d114-45b4-897c-68cab554a5e6	e28f5b1d-55ca-4488-9301-e9b91ba84702	MANAGE_CATEGORIES	e28f5b1d-55ca-4488-9301-e9b91ba84702	2025-10-23 02:31:00.61	\N	t	2025-10-23 02:31:00.61	2025-10-23 02:31:00.61
5533ddb4-5d21-4bfd-89d5-940839e5dfa0	e28f5b1d-55ca-4488-9301-e9b91ba84702	GENERATE_REPORTS	e28f5b1d-55ca-4488-9301-e9b91ba84702	2025-10-23 02:31:00.615	\N	t	2025-10-23 02:31:00.615	2025-10-23 02:31:00.615
2f525753-6a7d-41c3-bd9b-d591bd0cb3a1	e28f5b1d-55ca-4488-9301-e9b91ba84702	EXPORT_DATA	e28f5b1d-55ca-4488-9301-e9b91ba84702	2025-10-23 02:31:00.619	\N	t	2025-10-23 02:31:00.619	2025-10-23 02:31:00.619
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: licitabrasil
--

COPY public.user_sessions (id, "userId", token, "ipAddress", "userAgent", "expiresAt", "createdAt", "updatedAt") FROM stdin;
b134048c-2955-4c23-996b-8199c27d7c87	e28f5b1d-55ca-4488-9301-e9b91ba84702	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMjhmNWIxZC01NWNhLTQ0ODgtOTMwMS1lOWI5MWJhODQ3MDIiLCJlbWFpbCI6ImFkbWluQGxpY2l0YWJyYXNpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiJiMTM0MDQ4Yy0yOTU1LTRjMjMtOTk2Yi04MTk5YzI3ZDdjODciLCJpYXQiOjE3NjExODQyMDUsImV4cCI6MTc2MTc4OTAwNX0.XDHWRJ2715JXR1DrVo1XUvjGqEO_PP4ngdo3T66Z6Fc	::ffff:172.18.0.1	curl/7.81.0	2025-10-30 01:50:05.783	2025-10-23 01:50:05.784	2025-10-23 01:50:05.784
9c194de6-b719-4586-9978-6e4511bc0e1e	e28f5b1d-55ca-4488-9301-e9b91ba84702	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMjhmNWIxZC01NWNhLTQ0ODgtOTMwMS1lOWI5MWJhODQ3MDIiLCJlbWFpbCI6ImFkbWluQGxpY2l0YWJyYXNpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiI5YzE5NGRlNi1iNzE5LTQ1ODYtOTk3OC02ZTQ1MTFiYzBlMWUiLCJpYXQiOjE3NjExODQyMjYsImV4cCI6MTc2MTc4OTAyNn0.Mr-9Q72A8QBvnkMwk43gGG3e9n20eyEl1myXbpdgWwo	::ffff:172.18.0.1	curl/7.81.0	2025-10-30 01:50:26.223	2025-10-23 01:50:26.224	2025-10-23 01:50:26.224
2ea1b72a-73ca-4cd7-aebd-60e7d3e9fa58	e28f5b1d-55ca-4488-9301-e9b91ba84702	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMjhmNWIxZC01NWNhLTQ0ODgtOTMwMS1lOWI5MWJhODQ3MDIiLCJlbWFpbCI6ImFkbWluQGxpY2l0YWJyYXNpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiIyZWExYjcyYS03M2NhLTRjZDctYWViZC02MGU3ZDNlOWZhNTgiLCJpYXQiOjE3NjExODQyNTQsImV4cCI6MTc2MTc4OTA1NH0.cVPiqSFlLXxWNKVsxw4cw319Hh7i4css_pnyYL2TFuw	::ffff:172.18.0.5	curl/7.81.0	2025-10-30 01:50:54.353	2025-10-23 01:50:54.354	2025-10-23 01:50:54.354
d1126e43-ca0b-4625-85c9-a6a8ade37704	e28f5b1d-55ca-4488-9301-e9b91ba84702	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMjhmNWIxZC01NWNhLTQ0ODgtOTMwMS1lOWI5MWJhODQ3MDIiLCJlbWFpbCI6ImFkbWluQGxpY2l0YWJyYXNpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiJkMTEyNmU0My1jYTBiLTQ2MjUtODVjOS1hNmE4YWRlMzc3MDQiLCJpYXQiOjE3NjExODUxNzIsImV4cCI6MTc2MTc4OTk3Mn0.8Gva7ESbC4yJWNuJ4yiKpBiVz5_veXrSlMj1_UPrnwg	::ffff:172.18.0.5	curl/7.81.0	2025-10-30 02:06:13.389	2025-10-23 02:06:13.391	2025-10-23 02:06:13.391
1d3e807a-d181-4fba-85f0-db8b74f6bda6	e28f5b1d-55ca-4488-9301-e9b91ba84702	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMjhmNWIxZC01NWNhLTQ0ODgtOTMwMS1lOWI5MWJhODQ3MDIiLCJlbWFpbCI6ImFkbWluQGxpY2l0YWJyYXNpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiIxZDNlODA3YS1kMTgxLTRmYmEtODVmMC1kYjhiNzRmNmJkYTYiLCJpYXQiOjE3NjExODUyNjgsImV4cCI6MTc2MTc5MDA2OH0.cm3tHLSppmpk9OlhvaAodtsL60YkUwls6h0qjBoCeNE	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	2025-10-30 02:07:48.323	2025-10-23 02:07:48.324	2025-10-23 02:07:48.324
5dec95bf-bb48-426b-8b5a-8e6e7f167179	e28f5b1d-55ca-4488-9301-e9b91ba84702	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMjhmNWIxZC01NWNhLTQ0ODgtOTMwMS1lOWI5MWJhODQ3MDIiLCJlbWFpbCI6ImFkbWluQGxpY2l0YWJyYXNpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiI1ZGVjOTViZi1iYjQ4LTQyNmItOGI1YS04ZTZlN2YxNjcxNzkiLCJpYXQiOjE3NjExODUyOTQsImV4cCI6MTc2MTc5MDA5NH0.6vQYqKjLu-RkglJEVbqFzv7WIvYnbEVmfhmserjYF0Q	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	2025-10-30 02:08:14.353	2025-10-23 02:08:14.355	2025-10-23 02:08:14.355
d834f0b5-a65a-4a5b-bb62-17a5827be98a	e28f5b1d-55ca-4488-9301-e9b91ba84702	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMjhmNWIxZC01NWNhLTQ0ODgtOTMwMS1lOWI5MWJhODQ3MDIiLCJlbWFpbCI6ImFkbWluQGxpY2l0YWJyYXNpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiJkODM0ZjBiNS1hNjVhLTRhNWItYmI2Mi0xN2E1ODI3YmU5OGEiLCJpYXQiOjE3NjExODUzNTAsImV4cCI6MTc2MTc5MDE1MH0._sx23UH-7I30REt9F71QU64bCaQhi2OZKscpjMX8-E4	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	2025-10-30 02:09:11.002	2025-10-23 02:09:11.004	2025-10-23 02:09:11.004
63854d05-06f5-4f12-be5a-dbd00749ab20	e28f5b1d-55ca-4488-9301-e9b91ba84702	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMjhmNWIxZC01NWNhLTQ0ODgtOTMwMS1lOWI5MWJhODQ3MDIiLCJlbWFpbCI6ImFkbWluQGxpY2l0YWJyYXNpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiI2Mzg1NGQwNS0wNmY1LTRmMTItYmU1YS1kYmQwMDc0OWFiMjAiLCJpYXQiOjE3NjExODU4ODgsImV4cCI6MTc2MTc5MDY4OH0.WyLDta01tm7nHkFXnxS74P6jJ0_h7z1z6S_d8c8MreM	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	2025-10-30 02:18:08.796	2025-10-23 02:18:08.798	2025-10-23 02:18:08.798
78fdddc8-c38f-4bf2-b879-ff15020eb282	e28f5b1d-55ca-4488-9301-e9b91ba84702	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMjhmNWIxZC01NWNhLTQ0ODgtOTMwMS1lOWI5MWJhODQ3MDIiLCJlbWFpbCI6ImFkbWluQGxpY2l0YWJyYXNpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiI3OGZkZGRjOC1jMzhmLTRiZjItYjg3OS1mZjE1MDIwZWIyODIiLCJpYXQiOjE3NjExODYwNDAsImV4cCI6MTc2MTc5MDg0MH0.aePjYl3u2j_C63_oLqUnJPUF-rOndapmBl0ArUa5YuY	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	2025-10-30 02:20:40.286	2025-10-23 02:20:40.287	2025-10-23 02:20:40.287
c47dc552-da19-429f-a127-8d636e1df81d	e28f5b1d-55ca-4488-9301-e9b91ba84702	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMjhmNWIxZC01NWNhLTQ0ODgtOTMwMS1lOWI5MWJhODQ3MDIiLCJlbWFpbCI6ImFkbWluQGxpY2l0YWJyYXNpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiJjNDdkYzU1Mi1kYTE5LTQyOWYtYTEyNy04ZDYzNmUxZGY4MWQiLCJpYXQiOjE3NjExODY2ODgsImV4cCI6MTc2MTc5MTQ4OH0.Y0nls6b-LlMxgGhF-TfToe7krPGekURHOl71Ks5Wd_s	::ffff:172.18.0.5	curl/7.81.0	2025-10-30 02:31:28.898	2025-10-23 02:31:28.899	2025-10-23 02:31:28.899
a97570bd-e1ba-4d37-8f1a-4ede3205b2ea	e28f5b1d-55ca-4488-9301-e9b91ba84702	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMjhmNWIxZC01NWNhLTQ0ODgtOTMwMS1lOWI5MWJhODQ3MDIiLCJlbWFpbCI6ImFkbWluQGxpY2l0YWJyYXNpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiJhOTc1NzBiZC1lMWJhLTRkMzctOGYxYS00ZWRlMzIwNWIyZWEiLCJpYXQiOjE3NjExODY3MDUsImV4cCI6MTc2MTc5MTUwNX0.WVRFYLHlzOZLYa-7NOQVyApZQElIuG-ZTkQrYMWU0lQ	::ffff:172.18.0.5	curl/7.81.0	2025-10-30 02:31:45.249	2025-10-23 02:31:45.25	2025-10-23 02:31:45.25
b65fdb8d-fa54-4641-a853-9f24d657fcef	e28f5b1d-55ca-4488-9301-e9b91ba84702	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMjhmNWIxZC01NWNhLTQ0ODgtOTMwMS1lOWI5MWJhODQ3MDIiLCJlbWFpbCI6ImFkbWluQGxpY2l0YWJyYXNpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiJiNjVmZGI4ZC1mYTU0LTQ2NDEtYTg1My05ZjI0ZDY1N2ZjZWYiLCJpYXQiOjE3NjExODY3MTcsImV4cCI6MTc2MTc5MTUxN30.r4hs3I4q697zozYpupfxq8qhu3yRpTnkor2dEiQnzio	::ffff:172.18.0.5	curl/7.81.0	2025-10-30 02:31:57.334	2025-10-23 02:31:57.335	2025-10-23 02:31:57.335
3fef53fb-35bf-4bed-985c-a7c1c99f6772	e28f5b1d-55ca-4488-9301-e9b91ba84702	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMjhmNWIxZC01NWNhLTQ0ODgtOTMwMS1lOWI5MWJhODQ3MDIiLCJlbWFpbCI6ImFkbWluQGxpY2l0YWJyYXNpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiIzZmVmNTNmYi0zNWJmLTRiZWQtOTg1Yy1hN2MxYzk5ZjY3NzIiLCJpYXQiOjE3NjExODY5NDIsImV4cCI6MTc2MTc5MTc0Mn0.RdcMC8kpWFgC2w7Bya9odwgjbwTYy-UIV66VldcP0jE	::ffff:172.18.0.5	curl/7.81.0	2025-10-30 02:35:42.087	2025-10-23 02:35:42.088	2025-10-23 02:35:42.088
f4f30212-8fca-4b42-a002-d2b2cf0be34f	e28f5b1d-55ca-4488-9301-e9b91ba84702	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMjhmNWIxZC01NWNhLTQ0ODgtOTMwMS1lOWI5MWJhODQ3MDIiLCJlbWFpbCI6ImFkbWluQGxpY2l0YWJyYXNpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiJmNGYzMDIxMi04ZmNhLTRiNDItYTAwMi1kMmIyY2YwYmUzNGYiLCJpYXQiOjE3NjExODY5NTgsImV4cCI6MTc2MTc5MTc1OH0.dVbtB2x98JLP5rCi_4m7ybVUbhM17ldEfzP_YNzdmv4	::ffff:172.18.0.5	curl/7.81.0	2025-10-30 02:35:58.78	2025-10-23 02:35:58.781	2025-10-23 02:35:58.781
6c0dabfa-fe6f-4a7a-9731-3435d033e045	e28f5b1d-55ca-4488-9301-e9b91ba84702	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMjhmNWIxZC01NWNhLTQ0ODgtOTMwMS1lOWI5MWJhODQ3MDIiLCJlbWFpbCI6ImFkbWluQGxpY2l0YWJyYXNpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiI2YzBkYWJmYS1mZTZmLTRhN2EtOTczMS0zNDM1ZDAzM2UwNDUiLCJpYXQiOjE3NjExODczNjQsImV4cCI6MTc2MTc5MjE2NH0.JyymHsbfjW96Pw5GatpmeqzVZ0dYORxVrH3xXLEv3I0	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	2025-10-30 02:42:44.83	2025-10-23 02:42:44.831	2025-10-23 02:42:44.831
a4e0474e-b225-4abd-a350-b6c75851338d	e28f5b1d-55ca-4488-9301-e9b91ba84702	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMjhmNWIxZC01NWNhLTQ0ODgtOTMwMS1lOWI5MWJhODQ3MDIiLCJlbWFpbCI6ImFkbWluQGxpY2l0YWJyYXNpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiJhNGUwNDc0ZS1iMjI1LTRhYmQtYTM1MC1iNmM3NTg1MTMzOGQiLCJpYXQiOjE3NjExODc2MTIsImV4cCI6MTc2MTc5MjQxMn0.QIm3DEfxj4NXHuzhj_2dK3RVZT7RH2TACuk64YIohUo	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	2025-10-30 02:46:52.398	2025-10-23 02:46:52.399	2025-10-23 02:46:52.399
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: licitabrasil
--

COPY public.users (id, email, password, role, status, "firstName", "lastName", phone, avatar, "lastLoginAt", "createdAt", "updatedAt") FROM stdin;
e28f5b1d-55ca-4488-9301-e9b91ba84702	admin@licitabrasil.com	$2a$12$BHHjWxGoTuLO9ANrnDBr5uFZQhX3VYWOL/lGsbDYqj4nbuXxWX55u	ADMIN	ACTIVE	Admin	Sistema	\N	\N	2025-10-23 02:47:01.835	2025-10-23 01:49:19.78	2025-10-23 02:47:01.836
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

\unrestrict CdTVKkMclh8y9oOiL3b3ecQXqrOkYrrsle5GVQePunn7AGz254nVL2EaNzN3UfW

