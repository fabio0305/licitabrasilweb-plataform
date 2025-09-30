--
-- PostgreSQL database dump
--

\restrict NjJdcxjBJ1OehA8lz5NZv1hmueLeOU2JbSC8ecPxfUMtOaMcwcQxS3FC1B0MfWs

-- Dumped from database version 14.19 (Ubuntu 14.19-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 14.19 (Ubuntu 14.19-0ubuntu0.22.04.1)

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
-- Name: BiddingStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."BiddingStatus" AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'OPEN',
    'CLOSED',
    'CANCELLED',
    'AWARDED'
);


--
-- Name: BiddingType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."BiddingType" AS ENUM (
    'PREGAO_ELETRONICO',
    'CONCORRENCIA',
    'TOMADA_PRECOS',
    'CONVITE',
    'CONCURSO',
    'LEILAO'
);


--
-- Name: ContractStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ContractStatus" AS ENUM (
    'DRAFT',
    'ACTIVE',
    'SUSPENDED',
    'TERMINATED',
    'COMPLETED'
);


--
-- Name: DocumentType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DocumentType" AS ENUM (
    'EDITAL',
    'PROPOSAL',
    'CONTRACT',
    'CERTIFICATE',
    'REPORT',
    'OTHER'
);


--
-- Name: Permission; Type: TYPE; Schema: public; Owner: -
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


--
-- Name: ProposalStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ProposalStatus" AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'UNDER_REVIEW',
    'ACCEPTED',
    'REJECTED',
    'WITHDRAWN'
);


--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserRole" AS ENUM (
    'ADMIN',
    'SUPPLIER',
    'PUBLIC_ENTITY',
    'AUDITOR',
    'CITIZEN'
);


--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'PENDING',
    'SUSPENDED'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: bidding_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bidding_categories (
    id text NOT NULL,
    "biddingId" text NOT NULL,
    "categoryId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: biddings; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: citizens; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: contracts; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: documents; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: proposal_items; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: proposals; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: public_entities; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: supplier_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supplier_categories (
    id text NOT NULL,
    "supplierId" text NOT NULL,
    "categoryId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: system_configs; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: user_permissions; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
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


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
ca5857cd-6505-4f63-b35e-f810aa5f870e	8dc365fd124cb0a73a2e6539fee381652fcb3cfee30765a12cbb35bf00313e79	2025-09-17 20:48:10.135048+00	20250917204809_init	\N	\N	2025-09-17 20:48:09.836748+00	1
b3cf0aa6-70d0-43f3-ad68-1c82000d9ff5	20c66bee421541d018fa8ed5c3a3b1d9192608926705fdb0a4170b4d86d94a6c	2025-09-29 22:36:34.814724+00	20250929223634_add_citizen_profile_and_permissions	\N	\N	2025-09-29 22:36:34.744914+00	1
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, "userId", action, resource, "resourceId", "oldValues", "newValues", "ipAddress", "userAgent", "createdAt") FROM stdin;
\.


--
-- Data for Name: bidding_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bidding_categories (id, "biddingId", "categoryId", "createdAt") FROM stdin;
\.


--
-- Data for Name: biddings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.biddings (id, "publicEntityId", title, description, "biddingNumber", type, status, "estimatedValue", "openingDate", "closingDate", "deliveryLocation", "deliveryDeadline", requirements, "evaluationCriteria", "isPublic", "publishedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, name, description, code, "parentId", "isActive", "createdAt", "updatedAt") FROM stdin;
68e21428-33a2-475c-a1c7-7d7dfdc9c07a	Tecnologia da Informação	Equipamentos, software e serviços de TI	TI	\N	t	2025-09-29 22:45:01.367	2025-09-29 22:45:01.367
567c5414-8931-4809-931a-08d9cf70f03f	Construção Civil	Obras, reformas e construções	CONST	\N	t	2025-09-29 22:45:01.375	2025-09-29 22:45:01.375
e80d2658-27d2-4000-8efa-077f1a3baa69	Serviços Gerais	Serviços diversos para administração pública	SERV	\N	t	2025-09-29 22:45:01.378	2025-09-29 22:45:01.378
6f31e8e1-e96a-4e7c-85b3-a8e97d298635	Material de Escritório	Materiais e equipamentos de escritório	ESC	\N	t	2025-09-29 22:45:01.382	2025-09-29 22:45:01.382
47286bd5-7d28-43cc-8530-d9aa8f8b702e	Veículos e Transporte	Veículos, combustível e serviços de transporte	TRANSP	\N	t	2025-09-29 22:45:01.384	2025-09-29 22:45:01.384
fb70215f-4e78-469b-9434-5f0ee1457d75	Saúde	Equipamentos médicos, medicamentos e serviços de saúde	SAUDE	\N	t	2025-09-29 22:45:01.388	2025-09-29 22:45:01.388
bf2c439e-9683-4901-888b-73d68edcff63	Educação	Material didático, equipamentos e serviços educacionais	EDU	\N	t	2025-09-29 22:45:01.391	2025-09-29 22:45:01.391
9e35bfc3-d2e0-4eb5-ae43-d517f4635db2	Segurança	Equipamentos e serviços de segurança	SEG	\N	t	2025-09-29 22:45:01.394	2025-09-29 22:45:01.394
829a4473-923a-4a10-87cd-2ba8a990e832	Alimentação	Gêneros alimentícios e serviços de alimentação	ALIM	\N	t	2025-09-29 22:45:01.397	2025-09-29 22:45:01.397
19cce31a-21f2-4f73-aa55-62940a6b2ecd	Limpeza e Conservação	Produtos de limpeza e serviços de conservação	LIMP	\N	t	2025-09-29 22:45:01.4	2025-09-29 22:45:01.4
f43f8393-6d4f-4cac-b3a1-6b5642dcf8a8	Hardware	Computadores, servidores, equipamentos de rede	TI-HW	68e21428-33a2-475c-a1c7-7d7dfdc9c07a	t	2025-09-29 22:45:01.405	2025-09-29 22:45:01.405
1e56f96a-3837-4383-a803-610a3cc8b26e	Software	Licenças de software, sistemas, aplicativos	TI-SW	68e21428-33a2-475c-a1c7-7d7dfdc9c07a	t	2025-09-29 22:45:01.409	2025-09-29 22:45:01.409
224f4378-6851-498b-92f7-3b23beb2f826	Serviços de TI	Desenvolvimento, manutenção, consultoria em TI	TI-SERV	68e21428-33a2-475c-a1c7-7d7dfdc9c07a	t	2025-09-29 22:45:01.412	2025-09-29 22:45:01.412
af420b3c-1af3-46a0-9cec-7c9db9d975d1	Obras Públicas	Construção de prédios públicos, estradas, pontes	CONST-OBRAS	567c5414-8931-4809-931a-08d9cf70f03f	t	2025-09-29 22:45:01.417	2025-09-29 22:45:01.417
5396c400-a852-496d-b018-297d667f4794	Reformas	Reformas e manutenção de edificações	CONST-REF	567c5414-8931-4809-931a-08d9cf70f03f	t	2025-09-29 22:45:01.42	2025-09-29 22:45:01.42
58faaa0b-a491-40cf-b544-870f0358d169	Material de Construção	Cimento, ferro, materiais de construção	CONST-MAT	567c5414-8931-4809-931a-08d9cf70f03f	t	2025-09-29 22:45:01.423	2025-09-29 22:45:01.423
ef0f040d-d33c-43dc-abd3-f7dbdd1b53af	Equipamentos Médicos	Equipamentos hospitalares e médicos	SAUDE-EQUIP	fb70215f-4e78-469b-9434-5f0ee1457d75	t	2025-09-29 22:45:01.429	2025-09-29 22:45:01.429
7dea29c9-510a-4382-8d6a-9bad903e0f3f	Medicamentos	Medicamentos e produtos farmacêuticos	SAUDE-MED	fb70215f-4e78-469b-9434-5f0ee1457d75	t	2025-09-29 22:45:01.432	2025-09-29 22:45:01.432
6eec63db-b3c5-4652-9c06-32025f63fcbc	Serviços de Saúde	Serviços médicos e hospitalares	SAUDE-SERV	fb70215f-4e78-469b-9434-5f0ee1457d75	t	2025-09-29 22:45:01.435	2025-09-29 22:45:01.435
\.


--
-- Data for Name: citizens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.citizens (id, "userId", cpf, "dateOfBirth", profession, address, city, state, "zipCode", interests, "isActive", "verifiedAt", "createdAt", "updatedAt") FROM stdin;
cb068f11-78e6-4b45-9806-f274968d20a0	37ec7840-d75f-4bf6-982c-e5350bbdcbc3	123.456.789-00	1985-05-15 00:00:00	Engenheiro Civil	Rua das Flores, 123	São Paulo	SP	04567-890	{"Obras Públicas",Tecnologia,Educação}	t	2025-09-29 22:45:02.012	2025-09-29 22:45:02.013	2025-09-29 22:45:02.013
e8f589f0-ecdb-4fa9-9979-75943e4cb4b1	4038d184-6080-4f12-aee5-51f86de476cb	987.654.321-00	1990-08-20 00:00:00	Advogada	Av. Brasil, 456	Rio de Janeiro	RJ	20040-020	{"Direito Público",Transparência,Contratos}	t	2025-09-29 22:45:02.125	2025-09-29 22:45:02.126	2025-09-29 22:45:02.126
\.


--
-- Data for Name: contracts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contracts (id, "biddingId", "proposalId", "publicEntityId", "supplierId", "contractNumber", title, description, "totalValue", "startDate", "endDate", status, "signedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.documents (id, filename, "originalName", "mimeType", size, path, type, description, "isPublic", "uploadedBy", "createdAt", "updatedAt", "biddingId", "proposalId", "contractId", "supplierId", "publicEntityId") FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, "userId", title, message, type, "isRead", data, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: proposal_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proposal_items (id, "proposalId", description, quantity, "unitPrice", "totalPrice", brand, model, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: proposals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proposals (id, "biddingId", "supplierId", "totalValue", description, status, "submittedAt", "validUntil", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: public_entities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.public_entities (id, "userId", name, cnpj, "entityType", address, city, state, "zipCode", phone, website, "isActive", "verifiedAt", "createdAt", "updatedAt") FROM stdin;
94af0510-d929-4eb6-9a92-5d0572b967b1	7d4ac355-71b4-4078-a319-90df4504c055	Prefeitura Municipal de São Paulo	46.395.000/0001-39	Municipal	Rua Libero Badaró, 425	São Paulo	SP	01009-000	(11) 3113-9000	https://www.prefeitura.sp.gov.br	t	2025-09-29 22:45:01.962	2025-09-29 22:45:01.963	2025-09-29 22:45:01.963
c2072b24-a028-40b3-96e4-50f3ec47cc30	054eb2ac-027f-42b3-b849-45438644a8a9	Governo do Estado do Rio de Janeiro	42.498.733/0001-48	Estadual	Rua da Assembleia, 10	Rio de Janeiro	RJ	20011-000	(21) 2334-1000	https://www.rj.gov.br	t	2025-09-29 22:45:02.098	2025-09-29 22:45:02.098	2025-09-29 22:45:02.098
\.


--
-- Data for Name: supplier_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.supplier_categories (id, "supplierId", "categoryId", "createdAt") FROM stdin;
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.suppliers (id, "userId", "companyName", "tradeName", cnpj, "stateRegistration", "municipalRegistration", address, city, state, "zipCode", website, description, "isActive", "verifiedAt", "createdAt", "updatedAt") FROM stdin;
7aeacce0-a020-4ef5-99b9-eb238c282845	34b79190-79f1-4734-b30b-a793d6c11bdd	Empresa de Tecnologia LTDA	TechSolutions	12.345.678/0001-90	123456789	987654321	Av. Paulista, 1000	São Paulo	SP	01310-100	https://www.techsolutions.com.br	Empresa especializada em soluções tecnológicas para o setor público	t	2025-09-29 22:45:02.004	2025-09-29 22:45:02.004	2025-09-29 22:45:02.004
c04a8463-aa66-45c3-8a9a-8660186849df	84ad0932-3e5c-4e80-8657-1d8b8e986ff6	Construções e Reformas S.A.	ConstrutoraPro	98.765.432/0001-10	987654321	123456789	Rua dos Construtores, 500	São Paulo	SP	05678-901	https://www.construtorapro.com.br	Empresa especializada em construção civil e reformas	t	2025-09-29 22:45:02.062	2025-09-29 22:45:02.063	2025-09-29 22:45:02.063
\.


--
-- Data for Name: system_configs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_configs (id, key, value, type, description, "isPublic", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: user_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_permissions (id, "userId", permission, "grantedBy", "grantedAt", "expiresAt", "isActive", "createdAt", "updatedAt") FROM stdin;
acfdc823-f854-4627-a31b-ed41d60b01ac	af9d1d83-a17d-40a9-bbd3-a939e587b483	READ_PUBLIC_DATA	af9d1d83-a17d-40a9-bbd3-a939e587b483	2025-09-29 22:45:02.228	\N	t	2025-09-29 22:45:02.228	2025-09-29 22:45:02.228
5079ce31-cfa0-4c2f-a06b-4e145e5e9392	af9d1d83-a17d-40a9-bbd3-a939e587b483	READ_PRIVATE_DATA	af9d1d83-a17d-40a9-bbd3-a939e587b483	2025-09-29 22:45:02.244	\N	t	2025-09-29 22:45:02.244	2025-09-29 22:45:02.244
7ce29c2a-a91f-49af-a2d3-30024336bc7f	af9d1d83-a17d-40a9-bbd3-a939e587b483	WRITE_DATA	af9d1d83-a17d-40a9-bbd3-a939e587b483	2025-09-29 22:45:02.26	\N	t	2025-09-29 22:45:02.26	2025-09-29 22:45:02.26
8862c000-d04d-4173-ae12-798c21bd085f	af9d1d83-a17d-40a9-bbd3-a939e587b483	DELETE_DATA	af9d1d83-a17d-40a9-bbd3-a939e587b483	2025-09-29 22:45:02.267	\N	t	2025-09-29 22:45:02.267	2025-09-29 22:45:02.267
e9c80d39-c0cd-487a-a301-e54c04997acc	af9d1d83-a17d-40a9-bbd3-a939e587b483	CREATE_BIDDING	af9d1d83-a17d-40a9-bbd3-a939e587b483	2025-09-29 22:45:02.27	\N	t	2025-09-29 22:45:02.27	2025-09-29 22:45:02.27
614974f1-62e8-494b-ade6-bc5d1d4b3bdf	af9d1d83-a17d-40a9-bbd3-a939e587b483	EDIT_BIDDING	af9d1d83-a17d-40a9-bbd3-a939e587b483	2025-09-29 22:45:02.273	\N	t	2025-09-29 22:45:02.273	2025-09-29 22:45:02.273
adeb772e-28fd-448d-9ebf-80f310fd5cbf	af9d1d83-a17d-40a9-bbd3-a939e587b483	DELETE_BIDDING	af9d1d83-a17d-40a9-bbd3-a939e587b483	2025-09-29 22:45:02.288	\N	t	2025-09-29 22:45:02.288	2025-09-29 22:45:02.288
bb340cdf-c723-4b3e-a889-1c107ab8af43	af9d1d83-a17d-40a9-bbd3-a939e587b483	PUBLISH_BIDDING	af9d1d83-a17d-40a9-bbd3-a939e587b483	2025-09-29 22:45:02.303	\N	t	2025-09-29 22:45:02.303	2025-09-29 22:45:02.303
a045598b-9bb2-434a-a873-9f8e484a99db	af9d1d83-a17d-40a9-bbd3-a939e587b483	CANCEL_BIDDING	af9d1d83-a17d-40a9-bbd3-a939e587b483	2025-09-29 22:45:02.315	\N	t	2025-09-29 22:45:02.315	2025-09-29 22:45:02.315
3612f8ca-4171-4160-a340-ac45066cf9aa	af9d1d83-a17d-40a9-bbd3-a939e587b483	CREATE_PROPOSAL	af9d1d83-a17d-40a9-bbd3-a939e587b483	2025-09-29 22:45:02.326	\N	t	2025-09-29 22:45:02.326	2025-09-29 22:45:02.326
4e20422b-51a1-40df-a12d-8c70c51d349d	af9d1d83-a17d-40a9-bbd3-a939e587b483	EDIT_PROPOSAL	af9d1d83-a17d-40a9-bbd3-a939e587b483	2025-09-29 22:45:02.344	\N	t	2025-09-29 22:45:02.344	2025-09-29 22:45:02.344
7551250c-c40b-4a7d-a3f9-2dc5361215a6	af9d1d83-a17d-40a9-bbd3-a939e587b483	DELETE_PROPOSAL	af9d1d83-a17d-40a9-bbd3-a939e587b483	2025-09-29 22:45:02.35	\N	t	2025-09-29 22:45:02.35	2025-09-29 22:45:02.35
d97a96f1-7f8c-494f-ab23-2159cabbe8ef	af9d1d83-a17d-40a9-bbd3-a939e587b483	SUBMIT_PROPOSAL	af9d1d83-a17d-40a9-bbd3-a939e587b483	2025-09-29 22:45:02.358	\N	t	2025-09-29 22:45:02.358	2025-09-29 22:45:02.358
8212e886-f2e0-4941-a1c2-8d33c0d3811b	af9d1d83-a17d-40a9-bbd3-a939e587b483	CREATE_CONTRACT	af9d1d83-a17d-40a9-bbd3-a939e587b483	2025-09-29 22:45:02.369	\N	t	2025-09-29 22:45:02.369	2025-09-29 22:45:02.369
ae131b19-9dbc-4c9a-a813-7ffa70c503b5	af9d1d83-a17d-40a9-bbd3-a939e587b483	EDIT_CONTRACT	af9d1d83-a17d-40a9-bbd3-a939e587b483	2025-09-29 22:45:02.386	\N	t	2025-09-29 22:45:02.386	2025-09-29 22:45:02.386
0c7e8065-75fd-4db0-8e58-660a19c5827e	af9d1d83-a17d-40a9-bbd3-a939e587b483	SIGN_CONTRACT	af9d1d83-a17d-40a9-bbd3-a939e587b483	2025-09-29 22:45:02.403	\N	t	2025-09-29 22:45:02.403	2025-09-29 22:45:02.403
71f1d308-cdeb-4e6a-922b-2c81a3cbbaff	af9d1d83-a17d-40a9-bbd3-a939e587b483	TERMINATE_CONTRACT	af9d1d83-a17d-40a9-bbd3-a939e587b483	2025-09-29 22:45:02.413	\N	t	2025-09-29 22:45:02.413	2025-09-29 22:45:02.413
8056cebe-723d-4abd-bf35-e0d27f44b6ea	af9d1d83-a17d-40a9-bbd3-a939e587b483	MANAGE_USERS	af9d1d83-a17d-40a9-bbd3-a939e587b483	2025-09-29 22:45:02.421	\N	t	2025-09-29 22:45:02.421	2025-09-29 22:45:02.421
2168c2d3-c417-48fb-bb54-cc006fb249ad	af9d1d83-a17d-40a9-bbd3-a939e587b483	MANAGE_SYSTEM	af9d1d83-a17d-40a9-bbd3-a939e587b483	2025-09-29 22:45:02.428	\N	t	2025-09-29 22:45:02.428	2025-09-29 22:45:02.428
ac4b8c3b-a009-47fa-acc9-07153b81f1fe	af9d1d83-a17d-40a9-bbd3-a939e587b483	VIEW_AUDIT_LOGS	af9d1d83-a17d-40a9-bbd3-a939e587b483	2025-09-29 22:45:02.438	\N	t	2025-09-29 22:45:02.438	2025-09-29 22:45:02.438
a32491e7-0ecf-4bc8-8652-37e7064ee620	af9d1d83-a17d-40a9-bbd3-a939e587b483	MANAGE_CATEGORIES	af9d1d83-a17d-40a9-bbd3-a939e587b483	2025-09-29 22:45:02.455	\N	t	2025-09-29 22:45:02.455	2025-09-29 22:45:02.455
7ad58134-e18c-489e-afb6-c72a5fd3f392	af9d1d83-a17d-40a9-bbd3-a939e587b483	GENERATE_REPORTS	af9d1d83-a17d-40a9-bbd3-a939e587b483	2025-09-29 22:45:02.462	\N	t	2025-09-29 22:45:02.462	2025-09-29 22:45:02.462
2ba91154-cff3-4bd2-b6e6-922d8edfb1f4	af9d1d83-a17d-40a9-bbd3-a939e587b483	EXPORT_DATA	af9d1d83-a17d-40a9-bbd3-a939e587b483	2025-09-29 22:45:02.473	\N	t	2025-09-29 22:45:02.473	2025-09-29 22:45:02.473
f2ef7f70-2338-4b10-b52b-cf1b854a9b79	a6215238-a54d-4537-bcfe-73d34cc6a6ce	READ_PUBLIC_DATA	\N	2025-09-29 22:45:02.481	\N	t	2025-09-29 22:45:02.481	2025-09-29 22:45:02.481
1ac28722-a035-46b8-acbb-eac3c27c6208	a6215238-a54d-4537-bcfe-73d34cc6a6ce	CREATE_PROPOSAL	\N	2025-09-29 22:45:02.485	\N	t	2025-09-29 22:45:02.485	2025-09-29 22:45:02.485
dd6e9804-2b4c-4122-8ff8-5470c24e9fc9	a6215238-a54d-4537-bcfe-73d34cc6a6ce	EDIT_PROPOSAL	\N	2025-09-29 22:45:02.492	\N	t	2025-09-29 22:45:02.492	2025-09-29 22:45:02.492
a954bdc0-da90-481f-861e-1402ff58578c	a6215238-a54d-4537-bcfe-73d34cc6a6ce	DELETE_PROPOSAL	\N	2025-09-29 22:45:02.505	\N	t	2025-09-29 22:45:02.505	2025-09-29 22:45:02.505
aec45222-0251-4fa0-8ba4-099297a1417d	a6215238-a54d-4537-bcfe-73d34cc6a6ce	SUBMIT_PROPOSAL	\N	2025-09-29 22:45:02.513	\N	t	2025-09-29 22:45:02.513	2025-09-29 22:45:02.513
7107968d-4a73-4ae6-b127-828669ecfeb3	a6215238-a54d-4537-bcfe-73d34cc6a6ce	GENERATE_REPORTS	\N	2025-09-29 22:45:02.532	\N	t	2025-09-29 22:45:02.532	2025-09-29 22:45:02.532
74b254d1-e720-4f41-a434-e5f6d7410390	34b79190-79f1-4734-b30b-a793d6c11bdd	READ_PUBLIC_DATA	\N	2025-09-29 22:45:02.545	\N	t	2025-09-29 22:45:02.545	2025-09-29 22:45:02.545
bfa9852b-e803-4549-a617-4bd9f6b7ee3e	34b79190-79f1-4734-b30b-a793d6c11bdd	CREATE_PROPOSAL	\N	2025-09-29 22:45:02.549	\N	t	2025-09-29 22:45:02.549	2025-09-29 22:45:02.549
c9130695-ef5c-4c96-863c-d7b3f651e7da	34b79190-79f1-4734-b30b-a793d6c11bdd	EDIT_PROPOSAL	\N	2025-09-29 22:45:02.562	\N	t	2025-09-29 22:45:02.562	2025-09-29 22:45:02.562
f2dc2136-36fe-4473-9b53-dba2105d4ca8	34b79190-79f1-4734-b30b-a793d6c11bdd	DELETE_PROPOSAL	\N	2025-09-29 22:45:02.585	\N	t	2025-09-29 22:45:02.585	2025-09-29 22:45:02.585
6541ff1d-24de-4d6a-a5f8-dd0acc691a20	34b79190-79f1-4734-b30b-a793d6c11bdd	SUBMIT_PROPOSAL	\N	2025-09-29 22:45:02.6	\N	t	2025-09-29 22:45:02.6	2025-09-29 22:45:02.6
3f885e6e-d7c5-4c86-a43c-609b877646e8	34b79190-79f1-4734-b30b-a793d6c11bdd	GENERATE_REPORTS	\N	2025-09-29 22:45:02.62	\N	t	2025-09-29 22:45:02.62	2025-09-29 22:45:02.62
b626f9cf-1a51-4146-a0f3-95609b93eead	84ad0932-3e5c-4e80-8657-1d8b8e986ff6	READ_PUBLIC_DATA	\N	2025-09-29 22:45:02.64	\N	t	2025-09-29 22:45:02.64	2025-09-29 22:45:02.64
88ebd2b1-aaef-45a4-8ca4-79200b637c4c	84ad0932-3e5c-4e80-8657-1d8b8e986ff6	CREATE_PROPOSAL	\N	2025-09-29 22:45:02.664	\N	t	2025-09-29 22:45:02.664	2025-09-29 22:45:02.664
e96a56f2-5d58-44ab-bea7-6d54e0b0bd63	84ad0932-3e5c-4e80-8657-1d8b8e986ff6	EDIT_PROPOSAL	\N	2025-09-29 22:45:02.667	\N	t	2025-09-29 22:45:02.667	2025-09-29 22:45:02.667
4dbda896-bd86-42af-813e-d5dfb353575a	84ad0932-3e5c-4e80-8657-1d8b8e986ff6	DELETE_PROPOSAL	\N	2025-09-29 22:45:02.67	\N	t	2025-09-29 22:45:02.67	2025-09-29 22:45:02.67
1507074e-2086-41b6-8f59-d28083317878	84ad0932-3e5c-4e80-8657-1d8b8e986ff6	SUBMIT_PROPOSAL	\N	2025-09-29 22:45:02.673	\N	t	2025-09-29 22:45:02.673	2025-09-29 22:45:02.673
d1c1029b-a4e7-4cb9-a4e1-4f48a660b8a3	84ad0932-3e5c-4e80-8657-1d8b8e986ff6	GENERATE_REPORTS	\N	2025-09-29 22:45:02.676	\N	t	2025-09-29 22:45:02.676	2025-09-29 22:45:02.676
2c185b27-1ca3-4fd8-85bb-6d69fa8ed90d	7d4ac355-71b4-4078-a319-90df4504c055	READ_PUBLIC_DATA	\N	2025-09-29 22:45:02.679	\N	t	2025-09-29 22:45:02.679	2025-09-29 22:45:02.679
4e85fcd3-f377-46e8-98e2-4b288be9bb27	7d4ac355-71b4-4078-a319-90df4504c055	READ_PRIVATE_DATA	\N	2025-09-29 22:45:02.682	\N	t	2025-09-29 22:45:02.682	2025-09-29 22:45:02.682
b7950875-f44c-4b92-a030-406d97e2b9c8	7d4ac355-71b4-4078-a319-90df4504c055	WRITE_DATA	\N	2025-09-29 22:45:02.962	\N	t	2025-09-29 22:45:02.962	2025-09-29 22:45:02.962
44b31d6b-5acd-41d0-91c3-ee3275ce8274	7d4ac355-71b4-4078-a319-90df4504c055	CREATE_BIDDING	\N	2025-09-29 22:45:03.052	\N	t	2025-09-29 22:45:03.052	2025-09-29 22:45:03.052
4ef9e348-b76d-4c9e-839e-dff07c36ca0a	7d4ac355-71b4-4078-a319-90df4504c055	EDIT_BIDDING	\N	2025-09-29 22:45:03.063	\N	t	2025-09-29 22:45:03.063	2025-09-29 22:45:03.063
819caa91-6945-4855-9ad8-6e4a25d40ebb	7d4ac355-71b4-4078-a319-90df4504c055	DELETE_BIDDING	\N	2025-09-29 22:45:03.09	\N	t	2025-09-29 22:45:03.09	2025-09-29 22:45:03.09
ff8d7793-b7d2-483c-b823-317207d43d33	7d4ac355-71b4-4078-a319-90df4504c055	PUBLISH_BIDDING	\N	2025-09-29 22:45:03.099	\N	t	2025-09-29 22:45:03.099	2025-09-29 22:45:03.099
e4e8f1b4-7a19-494b-b397-c127e75a4dc9	7d4ac355-71b4-4078-a319-90df4504c055	CANCEL_BIDDING	\N	2025-09-29 22:45:03.125	\N	t	2025-09-29 22:45:03.125	2025-09-29 22:45:03.125
1edbe100-878c-4e32-b24a-f444dba3e061	7d4ac355-71b4-4078-a319-90df4504c055	CREATE_CONTRACT	\N	2025-09-29 22:45:03.133	\N	t	2025-09-29 22:45:03.133	2025-09-29 22:45:03.133
25a55aa2-20c3-4cc1-8bd1-0e0bbafe5341	7d4ac355-71b4-4078-a319-90df4504c055	EDIT_CONTRACT	\N	2025-09-29 22:45:03.136	\N	t	2025-09-29 22:45:03.136	2025-09-29 22:45:03.136
f5d8e531-aece-4ac8-8ab4-997f93f2bedb	7d4ac355-71b4-4078-a319-90df4504c055	SIGN_CONTRACT	\N	2025-09-29 22:45:03.139	\N	t	2025-09-29 22:45:03.139	2025-09-29 22:45:03.139
39f9c90e-1416-4019-9edf-dbb9f94f9127	7d4ac355-71b4-4078-a319-90df4504c055	TERMINATE_CONTRACT	\N	2025-09-29 22:45:03.142	\N	t	2025-09-29 22:45:03.142	2025-09-29 22:45:03.142
e31a92ac-5385-4faa-84c2-1b3ddf568237	7d4ac355-71b4-4078-a319-90df4504c055	GENERATE_REPORTS	\N	2025-09-29 22:45:03.145	\N	t	2025-09-29 22:45:03.145	2025-09-29 22:45:03.145
fa4a83a8-18db-4c6b-a611-fb63fe2c7838	7d4ac355-71b4-4078-a319-90df4504c055	EXPORT_DATA	\N	2025-09-29 22:45:03.148	\N	t	2025-09-29 22:45:03.148	2025-09-29 22:45:03.148
bd31d624-0bca-4f14-a06d-782a24a020dc	054eb2ac-027f-42b3-b849-45438644a8a9	READ_PUBLIC_DATA	\N	2025-09-29 22:45:03.151	\N	t	2025-09-29 22:45:03.151	2025-09-29 22:45:03.151
0f3a061f-5040-4ea5-bf5d-a8740ff1a70a	054eb2ac-027f-42b3-b849-45438644a8a9	READ_PRIVATE_DATA	\N	2025-09-29 22:45:03.154	\N	t	2025-09-29 22:45:03.154	2025-09-29 22:45:03.154
682db214-1e96-49bb-be1a-791d282ccc7e	054eb2ac-027f-42b3-b849-45438644a8a9	WRITE_DATA	\N	2025-09-29 22:45:03.159	\N	t	2025-09-29 22:45:03.159	2025-09-29 22:45:03.159
50e8d80d-071a-49c4-ac78-91e57ff87af8	054eb2ac-027f-42b3-b849-45438644a8a9	CREATE_BIDDING	\N	2025-09-29 22:45:03.162	\N	t	2025-09-29 22:45:03.162	2025-09-29 22:45:03.162
0f6ff149-44b8-4692-b3c8-baed02e01f14	054eb2ac-027f-42b3-b849-45438644a8a9	EDIT_BIDDING	\N	2025-09-29 22:45:03.165	\N	t	2025-09-29 22:45:03.165	2025-09-29 22:45:03.165
6af92145-265b-42cc-bf11-215c860e9c99	054eb2ac-027f-42b3-b849-45438644a8a9	DELETE_BIDDING	\N	2025-09-29 22:45:03.168	\N	t	2025-09-29 22:45:03.168	2025-09-29 22:45:03.168
94fd7729-a21c-43f5-9d03-532a32989eac	054eb2ac-027f-42b3-b849-45438644a8a9	PUBLISH_BIDDING	\N	2025-09-29 22:45:03.172	\N	t	2025-09-29 22:45:03.172	2025-09-29 22:45:03.172
b1e8b8df-b9a3-4a01-84b7-1ce21697a9aa	054eb2ac-027f-42b3-b849-45438644a8a9	CANCEL_BIDDING	\N	2025-09-29 22:45:03.176	\N	t	2025-09-29 22:45:03.176	2025-09-29 22:45:03.176
e25b1959-a61d-4d6e-b703-51adbae55c9e	054eb2ac-027f-42b3-b849-45438644a8a9	CREATE_CONTRACT	\N	2025-09-29 22:45:03.179	\N	t	2025-09-29 22:45:03.179	2025-09-29 22:45:03.179
0a76440d-e997-45e6-ab7a-ce4bf6250a9b	054eb2ac-027f-42b3-b849-45438644a8a9	EDIT_CONTRACT	\N	2025-09-29 22:45:03.182	\N	t	2025-09-29 22:45:03.182	2025-09-29 22:45:03.182
40817410-d5a5-466e-8ed7-86756e8c28e9	054eb2ac-027f-42b3-b849-45438644a8a9	SIGN_CONTRACT	\N	2025-09-29 22:45:03.186	\N	t	2025-09-29 22:45:03.186	2025-09-29 22:45:03.186
b027b5ea-72bf-4ace-a5be-eae5bf770e8b	054eb2ac-027f-42b3-b849-45438644a8a9	TERMINATE_CONTRACT	\N	2025-09-29 22:45:03.19	\N	t	2025-09-29 22:45:03.19	2025-09-29 22:45:03.19
58e4630a-488b-45a7-bd3b-998a813a2a18	054eb2ac-027f-42b3-b849-45438644a8a9	GENERATE_REPORTS	\N	2025-09-29 22:45:03.193	\N	t	2025-09-29 22:45:03.193	2025-09-29 22:45:03.193
24940d1e-ff6b-41a8-82a8-961d44abd13c	054eb2ac-027f-42b3-b849-45438644a8a9	EXPORT_DATA	\N	2025-09-29 22:45:03.196	\N	t	2025-09-29 22:45:03.196	2025-09-29 22:45:03.196
6ebcfe7a-8621-463f-b223-0be52177c624	5b4b245b-4c1b-46d0-aa45-d0f58c3ed0f5	READ_PUBLIC_DATA	\N	2025-09-29 22:45:03.2	\N	t	2025-09-29 22:45:03.2	2025-09-29 22:45:03.2
e5f9ab72-fae8-43ca-a7c7-cd1a453e3a6f	5b4b245b-4c1b-46d0-aa45-d0f58c3ed0f5	READ_PRIVATE_DATA	\N	2025-09-29 22:45:03.204	\N	t	2025-09-29 22:45:03.204	2025-09-29 22:45:03.204
3839c659-fca7-4bc7-b105-565c33fe91d9	5b4b245b-4c1b-46d0-aa45-d0f58c3ed0f5	VIEW_AUDIT_LOGS	\N	2025-09-29 22:45:03.207	\N	t	2025-09-29 22:45:03.207	2025-09-29 22:45:03.207
ad5dcf8a-1567-4138-94ce-555182252214	5b4b245b-4c1b-46d0-aa45-d0f58c3ed0f5	GENERATE_REPORTS	\N	2025-09-29 22:45:03.212	\N	t	2025-09-29 22:45:03.212	2025-09-29 22:45:03.212
ef69682f-01d0-4b1c-8476-f7407a0eb758	5b4b245b-4c1b-46d0-aa45-d0f58c3ed0f5	EXPORT_DATA	\N	2025-09-29 22:45:03.215	\N	t	2025-09-29 22:45:03.215	2025-09-29 22:45:03.215
7d7b6f91-88ac-46b8-b1b5-18232b39881d	37ec7840-d75f-4bf6-982c-e5350bbdcbc3	READ_PUBLIC_DATA	\N	2025-09-29 22:45:03.219	\N	t	2025-09-29 22:45:03.219	2025-09-29 22:45:03.219
0cdc951b-cda6-4312-b78d-5b013530de64	4038d184-6080-4f12-aee5-51f86de476cb	READ_PUBLIC_DATA	\N	2025-09-29 22:45:03.223	\N	t	2025-09-29 22:45:03.223	2025-09-29 22:45:03.223
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_sessions (id, "userId", token, "ipAddress", "userAgent", "expiresAt", "createdAt", "updatedAt") FROM stdin;
d74df3a9-695f-4d82-8d80-fb03e75a59be	af9d1d83-a17d-40a9-bbd3-a939e587b483	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZjlkMWQ4My1hMTdkLTQwYTktYmJkMy1hOTM5ZTU4N2I0ODMiLCJlbWFpbCI6ImFkbWluQGxpY2l0YWJyYXNpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiJkNzRkZjNhOS02OTVmLTRkODItOGQ4MC1mYjAzZTc1YTU5YmUiLCJpYXQiOjE3NTkxOTQwMDEsImV4cCI6MTc1OTc5ODgwMX0.w6YACATsXgyoD6Bm46_8azjd2fdXrlaX0fQmI7vrYa4	::ffff:127.0.0.1	curl/7.81.0	2025-10-07 01:00:01.887	2025-09-30 01:00:01.888	2025-09-30 01:00:01.888
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password, role, status, "firstName", "lastName", phone, avatar, "lastLoginAt", "createdAt", "updatedAt") FROM stdin;
a6215238-a54d-4537-bcfe-73d34cc6a6ce	joao@example.com	$2a$12$mtEkxSk8yXL1W65szghUXOsegj5fJSJ/IWIFQSiggNVl.a2ifXuei	SUPPLIER	PENDING	João	Silva	\N	\N	\N	2025-09-17 22:14:20.826	2025-09-17 22:14:20.826
7d4ac355-71b4-4078-a319-90df4504c055	comprador@prefeitura.sp.gov.br	$2a$12$9kh9/TLT0ks3It7CB4bEpOsp3MtWVBCrdZJKsOvvNcfQf8Vqb/Kwi	PUBLIC_ENTITY	ACTIVE	João	Silva	(11) 3333-4444	\N	\N	2025-09-29 22:45:01.959	2025-09-29 22:45:01.959
34b79190-79f1-4734-b30b-a793d6c11bdd	fornecedor@empresa.com.br	$2a$12$9kh9/TLT0ks3It7CB4bEpOsp3MtWVBCrdZJKsOvvNcfQf8Vqb/Kwi	SUPPLIER	ACTIVE	Maria	Santos	(11) 2222-3333	\N	\N	2025-09-29 22:45:01.982	2025-09-29 22:45:01.982
37ec7840-d75f-4bf6-982c-e5350bbdcbc3	cidadao@email.com	$2a$12$9kh9/TLT0ks3It7CB4bEpOsp3MtWVBCrdZJKsOvvNcfQf8Vqb/Kwi	CITIZEN	ACTIVE	Carlos	Oliveira	(11) 1111-2222	\N	\N	2025-09-29 22:45:02.01	2025-09-29 22:45:02.01
5b4b245b-4c1b-46d0-aa45-d0f58c3ed0f5	auditor@tcu.gov.br	$2a$12$9kh9/TLT0ks3It7CB4bEpOsp3MtWVBCrdZJKsOvvNcfQf8Vqb/Kwi	AUDITOR	ACTIVE	Ana	Costa	(61) 3316-5000	\N	\N	2025-09-29 22:45:02.032	2025-09-29 22:45:02.032
84ad0932-3e5c-4e80-8657-1d8b8e986ff6	fornecedor2@construcoes.com.br	$2a$12$9kh9/TLT0ks3It7CB4bEpOsp3MtWVBCrdZJKsOvvNcfQf8Vqb/Kwi	SUPPLIER	ACTIVE	Pedro	Almeida	(11) 5555-6666	\N	\N	2025-09-29 22:45:02.047	2025-09-29 22:45:02.047
054eb2ac-027f-42b3-b849-45438644a8a9	comprador@governo.rj.gov.br	$2a$12$9kh9/TLT0ks3It7CB4bEpOsp3MtWVBCrdZJKsOvvNcfQf8Vqb/Kwi	PUBLIC_ENTITY	ACTIVE	Roberto	Ferreira	(21) 2334-5678	\N	\N	2025-09-29 22:45:02.085	2025-09-29 22:45:02.085
4038d184-6080-4f12-aee5-51f86de476cb	cidadao2@email.com	$2a$12$9kh9/TLT0ks3It7CB4bEpOsp3MtWVBCrdZJKsOvvNcfQf8Vqb/Kwi	CITIZEN	ACTIVE	Fernanda	Lima	(11) 7777-8888	\N	\N	2025-09-29 22:45:02.115	2025-09-29 22:45:02.115
af9d1d83-a17d-40a9-bbd3-a939e587b483	admin@licitabrasil.com	$2a$12$9kh9/TLT0ks3It7CB4bEpOsp3MtWVBCrdZJKsOvvNcfQf8Vqb/Kwi	ADMIN	ACTIVE	Administrador	Sistema	(11) 99999-9999	\N	2025-09-30 01:02:26.432	2025-09-29 22:45:01.953	2025-09-30 01:02:26.433
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: bidding_categories bidding_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bidding_categories
    ADD CONSTRAINT bidding_categories_pkey PRIMARY KEY (id);


--
-- Name: biddings biddings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.biddings
    ADD CONSTRAINT biddings_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: citizens citizens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citizens
    ADD CONSTRAINT citizens_pkey PRIMARY KEY (id);


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: proposal_items proposal_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposal_items
    ADD CONSTRAINT proposal_items_pkey PRIMARY KEY (id);


--
-- Name: proposals proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_pkey PRIMARY KEY (id);


--
-- Name: public_entities public_entities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.public_entities
    ADD CONSTRAINT public_entities_pkey PRIMARY KEY (id);


--
-- Name: supplier_categories supplier_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_categories
    ADD CONSTRAINT supplier_categories_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: system_configs system_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_configs
    ADD CONSTRAINT system_configs_pkey PRIMARY KEY (id);


--
-- Name: user_permissions user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: bidding_categories_biddingId_categoryId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "bidding_categories_biddingId_categoryId_key" ON public.bidding_categories USING btree ("biddingId", "categoryId");


--
-- Name: biddings_biddingNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "biddings_biddingNumber_key" ON public.biddings USING btree ("biddingNumber");


--
-- Name: categories_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX categories_code_key ON public.categories USING btree (code);


--
-- Name: categories_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX categories_name_key ON public.categories USING btree (name);


--
-- Name: citizens_cpf_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX citizens_cpf_key ON public.citizens USING btree (cpf);


--
-- Name: citizens_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "citizens_userId_key" ON public.citizens USING btree ("userId");


--
-- Name: contracts_biddingId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "contracts_biddingId_key" ON public.contracts USING btree ("biddingId");


--
-- Name: contracts_contractNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "contracts_contractNumber_key" ON public.contracts USING btree ("contractNumber");


--
-- Name: contracts_proposalId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "contracts_proposalId_key" ON public.contracts USING btree ("proposalId");


--
-- Name: proposals_biddingId_supplierId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "proposals_biddingId_supplierId_key" ON public.proposals USING btree ("biddingId", "supplierId");


--
-- Name: public_entities_cnpj_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX public_entities_cnpj_key ON public.public_entities USING btree (cnpj);


--
-- Name: public_entities_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "public_entities_userId_key" ON public.public_entities USING btree ("userId");


--
-- Name: supplier_categories_supplierId_categoryId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "supplier_categories_supplierId_categoryId_key" ON public.supplier_categories USING btree ("supplierId", "categoryId");


--
-- Name: suppliers_cnpj_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX suppliers_cnpj_key ON public.suppliers USING btree (cnpj);


--
-- Name: suppliers_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "suppliers_userId_key" ON public.suppliers USING btree ("userId");


--
-- Name: system_configs_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX system_configs_key_key ON public.system_configs USING btree (key);


--
-- Name: user_permissions_userId_permission_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "user_permissions_userId_permission_key" ON public.user_permissions USING btree ("userId", permission);


--
-- Name: user_sessions_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_sessions_token_key ON public.user_sessions USING btree (token);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: audit_logs audit_logs_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: bidding_categories bidding_categories_biddingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bidding_categories
    ADD CONSTRAINT "bidding_categories_biddingId_fkey" FOREIGN KEY ("biddingId") REFERENCES public.biddings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: bidding_categories bidding_categories_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bidding_categories
    ADD CONSTRAINT "bidding_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: biddings biddings_publicEntityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.biddings
    ADD CONSTRAINT "biddings_publicEntityId_fkey" FOREIGN KEY ("publicEntityId") REFERENCES public.public_entities(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: categories categories_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: citizens citizens_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.citizens
    ADD CONSTRAINT "citizens_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: contracts contracts_biddingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT "contracts_biddingId_fkey" FOREIGN KEY ("biddingId") REFERENCES public.biddings(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: contracts contracts_proposalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT "contracts_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES public.proposals(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: contracts contracts_publicEntityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT "contracts_publicEntityId_fkey" FOREIGN KEY ("publicEntityId") REFERENCES public.public_entities(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: contracts contracts_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT "contracts_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public.suppliers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: documents documents_biddingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_biddingId_fkey" FOREIGN KEY ("biddingId") REFERENCES public.biddings(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: documents documents_contractId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES public.contracts(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: documents documents_proposalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES public.proposals(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: documents documents_publicEntityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_publicEntityId_fkey" FOREIGN KEY ("publicEntityId") REFERENCES public.public_entities(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: documents documents_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "documents_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: proposal_items proposal_items_proposalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposal_items
    ADD CONSTRAINT "proposal_items_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES public.proposals(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: proposals proposals_biddingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT "proposals_biddingId_fkey" FOREIGN KEY ("biddingId") REFERENCES public.biddings(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: proposals proposals_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT "proposals_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public.suppliers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: public_entities public_entities_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.public_entities
    ADD CONSTRAINT "public_entities_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: supplier_categories supplier_categories_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_categories
    ADD CONSTRAINT "supplier_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: supplier_categories supplier_categories_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_categories
    ADD CONSTRAINT "supplier_categories_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public.suppliers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: suppliers suppliers_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT "suppliers_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_permissions user_permissions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict NjJdcxjBJ1OehA8lz5NZv1hmueLeOU2JbSC8ecPxfUMtOaMcwcQxS3FC1B0MfWs

