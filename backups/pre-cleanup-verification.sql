--
-- PostgreSQL database dump
--

\restrict ZRcCCiUm3iQgccKdbJelOQiw6gOoTLch647uiPercEWmEgnzTQgYb7ezj6Piqhv

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
249cf99b-de3d-49c7-af87-66ca4c9dfea7	a1833d80-09ac-4553-993a-7f3bd760eb17	123.456.789-00	1985-05-15 00:00:00	Engenheiro Civil	Rua das Flores, 123	São Paulo	SP	04567-890	{"Obras Públicas",Tecnologia,Educação}	t	2025-10-23 02:31:00.384	2025-10-23 02:31:00.386	2025-10-23 02:31:00.386
ce8b79f4-09c7-4776-b370-af86a52362a5	5b3ee9f7-5be5-4989-b4ac-914d34e493c6	987.654.321-00	1990-08-20 00:00:00	Advogada	Av. Brasil, 456	Rio de Janeiro	RJ	20040-020	{"Direito Público",Transparência,Contratos}	t	2025-10-23 02:31:00.424	2025-10-23 02:31:00.425	2025-10-23 02:31:00.425
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
1d8a263d-c5ea-4ecc-ae3a-ed2ec2761d5d	de0c02b5-c42f-470f-b774-3cd00036e429	Prefeitura Municipal de São Paulo	46.395.000/0001-39	Municipal	Rua Libero Badaró, 425	São Paulo	SP	01009-000	(11) 3113-9000	https://www.prefeitura.sp.gov.br	t	2025-10-23 02:31:00.339	2025-10-23 02:31:00.341	2025-10-23 02:31:00.341	\N	\N	\N	\N
7a317eab-4839-4d1b-9344-db3cb1a09c1f	1ca4f871-563d-4c9c-8739-9e94996584e2	Governo do Estado do Rio de Janeiro	42.498.733/0001-48	Estadual	Rua da Assembleia, 10	Rio de Janeiro	RJ	20011-000	(21) 2334-1000	https://www.rj.gov.br	t	2025-10-23 02:31:00.415	2025-10-23 02:31:00.416	2025-10-23 02:31:00.416	\N	\N	\N	\N
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
3de96e47-0fb3-4559-8437-4e74c7ed5407	73b6696a-c5f2-4de1-894d-4b524d4caddc	Empresa de Tecnologia LTDA	TechSolutions	12.345.678/0001-90	123456789	987654321	Av. Paulista, 1000	São Paulo	SP	01310-100	https://www.techsolutions.com.br	Empresa especializada em soluções tecnológicas para o setor público	t	2025-10-23 02:31:00.372	2025-10-23 02:31:00.373	2025-10-23 02:31:00.373
0967478f-6d97-4d4c-9bad-8495a6fdf3ae	8e76417e-018a-451b-8ce9-c395d20a7976	Construções e Reformas S.A.	ConstrutoraPro	98.765.432/0001-10	987654321	123456789	Rua dos Construtores, 500	São Paulo	SP	05678-901	https://www.construtorapro.com.br	Empresa especializada em construção civil e reformas	t	2025-10-23 02:31:00.405	2025-10-23 02:31:00.406	2025-10-23 02:31:00.406
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
f6a8d702-7ed3-4eb4-8f47-7a34e1da080e	73b6696a-c5f2-4de1-894d-4b524d4caddc	READ_PUBLIC_DATA	\N	2025-10-23 02:31:00.624	\N	t	2025-10-23 02:31:00.624	2025-10-23 02:31:00.624
77df6299-66d8-4340-9980-159d060fc956	73b6696a-c5f2-4de1-894d-4b524d4caddc	CREATE_PROPOSAL	\N	2025-10-23 02:31:00.629	\N	t	2025-10-23 02:31:00.629	2025-10-23 02:31:00.629
3ef230e0-df69-43e7-98e2-c951625943d0	73b6696a-c5f2-4de1-894d-4b524d4caddc	EDIT_PROPOSAL	\N	2025-10-23 02:31:00.634	\N	t	2025-10-23 02:31:00.634	2025-10-23 02:31:00.634
2deb650a-943d-4e9f-8a42-8d59f5fad8db	73b6696a-c5f2-4de1-894d-4b524d4caddc	DELETE_PROPOSAL	\N	2025-10-23 02:31:00.638	\N	t	2025-10-23 02:31:00.638	2025-10-23 02:31:00.638
c99015c6-c4e2-40d9-8caf-35c7670cd893	73b6696a-c5f2-4de1-894d-4b524d4caddc	SUBMIT_PROPOSAL	\N	2025-10-23 02:31:00.642	\N	t	2025-10-23 02:31:00.642	2025-10-23 02:31:00.642
66fe4fc2-b386-4a30-9c73-457e1192e0d5	73b6696a-c5f2-4de1-894d-4b524d4caddc	GENERATE_REPORTS	\N	2025-10-23 02:31:00.646	\N	t	2025-10-23 02:31:00.646	2025-10-23 02:31:00.646
33dd0905-bed0-4494-8385-7b26bb208511	8e76417e-018a-451b-8ce9-c395d20a7976	READ_PUBLIC_DATA	\N	2025-10-23 02:31:00.65	\N	t	2025-10-23 02:31:00.65	2025-10-23 02:31:00.65
6ead20c1-068e-4b43-89e0-802a4a569740	8e76417e-018a-451b-8ce9-c395d20a7976	CREATE_PROPOSAL	\N	2025-10-23 02:31:00.655	\N	t	2025-10-23 02:31:00.655	2025-10-23 02:31:00.655
171a212b-89c1-42d5-9f8c-8816eae0497e	8e76417e-018a-451b-8ce9-c395d20a7976	EDIT_PROPOSAL	\N	2025-10-23 02:31:00.663	\N	t	2025-10-23 02:31:00.663	2025-10-23 02:31:00.663
7788f356-05cb-4462-89d5-2240613ac6df	8e76417e-018a-451b-8ce9-c395d20a7976	DELETE_PROPOSAL	\N	2025-10-23 02:31:00.688	\N	t	2025-10-23 02:31:00.688	2025-10-23 02:31:00.688
00fec6d5-c78d-453a-8cbf-f3dcc8a5bd03	8e76417e-018a-451b-8ce9-c395d20a7976	SUBMIT_PROPOSAL	\N	2025-10-23 02:31:00.717	\N	t	2025-10-23 02:31:00.717	2025-10-23 02:31:00.717
993d5ae9-8b7d-4d03-86ba-1640fbab5a48	8e76417e-018a-451b-8ce9-c395d20a7976	GENERATE_REPORTS	\N	2025-10-23 02:31:00.738	\N	t	2025-10-23 02:31:00.738	2025-10-23 02:31:00.738
f02c5bfa-0956-4e5f-9f51-21a394ecbc57	de0c02b5-c42f-470f-b774-3cd00036e429	READ_PUBLIC_DATA	\N	2025-10-23 02:31:00.757	\N	t	2025-10-23 02:31:00.757	2025-10-23 02:31:00.757
44bf8688-ffb7-4cc8-ab55-c6821d165154	de0c02b5-c42f-470f-b774-3cd00036e429	READ_PRIVATE_DATA	\N	2025-10-23 02:31:00.778	\N	t	2025-10-23 02:31:00.778	2025-10-23 02:31:00.778
34ffd53e-9b2d-4e54-b06a-e7ca963d76ba	de0c02b5-c42f-470f-b774-3cd00036e429	WRITE_DATA	\N	2025-10-23 02:31:00.782	\N	t	2025-10-23 02:31:00.782	2025-10-23 02:31:00.782
cc8e9b6f-31ba-4b03-85bd-164e076a3c5c	de0c02b5-c42f-470f-b774-3cd00036e429	CREATE_BIDDING	\N	2025-10-23 02:31:00.808	\N	t	2025-10-23 02:31:00.808	2025-10-23 02:31:00.808
e01caa39-c55f-4dd1-b999-7c6e784dd49b	de0c02b5-c42f-470f-b774-3cd00036e429	EDIT_BIDDING	\N	2025-10-23 02:31:00.827	\N	t	2025-10-23 02:31:00.827	2025-10-23 02:31:00.827
30f377ec-b95b-418a-95c3-b7318c42cb59	de0c02b5-c42f-470f-b774-3cd00036e429	DELETE_BIDDING	\N	2025-10-23 02:31:00.831	\N	t	2025-10-23 02:31:00.831	2025-10-23 02:31:00.831
ed3e1b5a-1996-4cba-acf6-7916857ee35d	de0c02b5-c42f-470f-b774-3cd00036e429	PUBLISH_BIDDING	\N	2025-10-23 02:31:00.835	\N	t	2025-10-23 02:31:00.835	2025-10-23 02:31:00.835
ccbfab31-d475-4daa-a132-b339ceb699eb	de0c02b5-c42f-470f-b774-3cd00036e429	CANCEL_BIDDING	\N	2025-10-23 02:31:00.838	\N	t	2025-10-23 02:31:00.838	2025-10-23 02:31:00.838
3105a232-17c5-4734-a8bf-0fec0b170b40	de0c02b5-c42f-470f-b774-3cd00036e429	CREATE_CONTRACT	\N	2025-10-23 02:31:00.842	\N	t	2025-10-23 02:31:00.842	2025-10-23 02:31:00.842
c828621e-77a3-4cec-b2a7-ba73d02350c4	de0c02b5-c42f-470f-b774-3cd00036e429	EDIT_CONTRACT	\N	2025-10-23 02:31:00.863	\N	t	2025-10-23 02:31:00.863	2025-10-23 02:31:00.863
d3baf85c-59cd-4654-93e6-1d4ea7ae306f	de0c02b5-c42f-470f-b774-3cd00036e429	SIGN_CONTRACT	\N	2025-10-23 02:31:00.866	\N	t	2025-10-23 02:31:00.866	2025-10-23 02:31:00.866
757e3986-a882-466e-845f-290a19c49ced	de0c02b5-c42f-470f-b774-3cd00036e429	TERMINATE_CONTRACT	\N	2025-10-23 02:31:00.87	\N	t	2025-10-23 02:31:00.87	2025-10-23 02:31:00.87
9ba294e2-9d5c-4459-a84a-8bc6d022c6b1	de0c02b5-c42f-470f-b774-3cd00036e429	GENERATE_REPORTS	\N	2025-10-23 02:31:00.873	\N	t	2025-10-23 02:31:00.873	2025-10-23 02:31:00.873
31d7928b-0987-486e-b5c1-d80fa9ddb070	de0c02b5-c42f-470f-b774-3cd00036e429	EXPORT_DATA	\N	2025-10-23 02:31:00.877	\N	t	2025-10-23 02:31:00.877	2025-10-23 02:31:00.877
a2debdb2-4933-49fe-b394-221225815260	1ca4f871-563d-4c9c-8739-9e94996584e2	READ_PUBLIC_DATA	\N	2025-10-23 02:31:00.881	\N	t	2025-10-23 02:31:00.881	2025-10-23 02:31:00.881
639d636d-bf2e-4b0d-b3d9-2224293fc30e	1ca4f871-563d-4c9c-8739-9e94996584e2	READ_PRIVATE_DATA	\N	2025-10-23 02:31:00.884	\N	t	2025-10-23 02:31:00.884	2025-10-23 02:31:00.884
1d7a5a4e-bcab-4d35-a79b-4cd8c6d6674c	1ca4f871-563d-4c9c-8739-9e94996584e2	WRITE_DATA	\N	2025-10-23 02:31:00.888	\N	t	2025-10-23 02:31:00.888	2025-10-23 02:31:00.888
f2b83fc3-52d3-400c-9e1e-247f0be10316	1ca4f871-563d-4c9c-8739-9e94996584e2	CREATE_BIDDING	\N	2025-10-23 02:31:00.892	\N	t	2025-10-23 02:31:00.892	2025-10-23 02:31:00.892
df203d85-fbae-42d3-b05a-0415b68df849	1ca4f871-563d-4c9c-8739-9e94996584e2	EDIT_BIDDING	\N	2025-10-23 02:31:00.895	\N	t	2025-10-23 02:31:00.895	2025-10-23 02:31:00.895
0c9958f2-0437-4f0c-9cf8-f2a5baf6eef6	1ca4f871-563d-4c9c-8739-9e94996584e2	DELETE_BIDDING	\N	2025-10-23 02:31:00.899	\N	t	2025-10-23 02:31:00.899	2025-10-23 02:31:00.899
21a7fa66-2027-428f-ae0a-ab2a23cceb43	1ca4f871-563d-4c9c-8739-9e94996584e2	PUBLISH_BIDDING	\N	2025-10-23 02:31:00.922	\N	t	2025-10-23 02:31:00.922	2025-10-23 02:31:00.922
629bafd2-6549-45bc-87ad-4a3838d1976d	1ca4f871-563d-4c9c-8739-9e94996584e2	CANCEL_BIDDING	\N	2025-10-23 02:31:00.947	\N	t	2025-10-23 02:31:00.947	2025-10-23 02:31:00.947
5dcc9787-861e-461b-97e3-f869b4e93817	1ca4f871-563d-4c9c-8739-9e94996584e2	CREATE_CONTRACT	\N	2025-10-23 02:31:00.973	\N	t	2025-10-23 02:31:00.973	2025-10-23 02:31:00.973
bbd54f3a-bd0d-4086-ab51-95e4401f5c0d	1ca4f871-563d-4c9c-8739-9e94996584e2	EDIT_CONTRACT	\N	2025-10-23 02:31:00.995	\N	t	2025-10-23 02:31:00.995	2025-10-23 02:31:00.995
26a37cf0-ade2-4f04-9adb-4b64edd8907c	1ca4f871-563d-4c9c-8739-9e94996584e2	SIGN_CONTRACT	\N	2025-10-23 02:31:01.013	\N	t	2025-10-23 02:31:01.013	2025-10-23 02:31:01.013
7b2ddf69-7c4a-47ec-bf65-62fee3a9d9d1	1ca4f871-563d-4c9c-8739-9e94996584e2	TERMINATE_CONTRACT	\N	2025-10-23 02:31:01.032	\N	t	2025-10-23 02:31:01.032	2025-10-23 02:31:01.032
010ed148-c66d-474a-849f-dc5a40f99909	1ca4f871-563d-4c9c-8739-9e94996584e2	GENERATE_REPORTS	\N	2025-10-23 02:31:01.043	\N	t	2025-10-23 02:31:01.043	2025-10-23 02:31:01.043
a856a1c0-0f1e-46c9-ba65-f0ab54202676	1ca4f871-563d-4c9c-8739-9e94996584e2	EXPORT_DATA	\N	2025-10-23 02:31:01.065	\N	t	2025-10-23 02:31:01.065	2025-10-23 02:31:01.065
dfe23587-0a6a-4183-a75d-f29785666780	1b679fb6-0b1e-47a0-8573-9f2b02256a79	READ_PUBLIC_DATA	\N	2025-10-23 02:31:01.096	\N	t	2025-10-23 02:31:01.096	2025-10-23 02:31:01.096
689abf99-4c53-405c-ad0e-129aaa22d4f1	1b679fb6-0b1e-47a0-8573-9f2b02256a79	READ_PRIVATE_DATA	\N	2025-10-23 02:31:01.124	\N	t	2025-10-23 02:31:01.124	2025-10-23 02:31:01.124
1d4c06a9-59aa-4eb1-b0bd-947cf25e1d08	1b679fb6-0b1e-47a0-8573-9f2b02256a79	VIEW_AUDIT_LOGS	\N	2025-10-23 02:31:01.15	\N	t	2025-10-23 02:31:01.15	2025-10-23 02:31:01.15
b9db8e21-f756-404c-b083-39b073e04542	1b679fb6-0b1e-47a0-8573-9f2b02256a79	GENERATE_REPORTS	\N	2025-10-23 02:31:01.173	\N	t	2025-10-23 02:31:01.173	2025-10-23 02:31:01.173
cafea18a-c35f-4f6b-a396-137ed4e4312d	1b679fb6-0b1e-47a0-8573-9f2b02256a79	EXPORT_DATA	\N	2025-10-23 02:31:01.596	\N	t	2025-10-23 02:31:01.596	2025-10-23 02:31:01.596
7473d944-5f61-4992-bf31-b5aecd5467d5	a1833d80-09ac-4553-993a-7f3bd760eb17	READ_PUBLIC_DATA	\N	2025-10-23 02:31:01.724	\N	t	2025-10-23 02:31:01.724	2025-10-23 02:31:01.724
6d9e92a1-1639-4d8a-b22e-f88f8dea06ee	5b3ee9f7-5be5-4989-b4ac-914d34e493c6	READ_PUBLIC_DATA	\N	2025-10-23 02:31:01.755	\N	t	2025-10-23 02:31:01.755	2025-10-23 02:31:01.755
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
0fe5ba6b-bff8-46b5-ae44-5921cfe27e0f	de0c02b5-c42f-470f-b774-3cd00036e429	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZTBjMDJiNS1jNDJmLTQ3MGYtYjc3NC0zY2QwMDAzNmU0MjkiLCJlbWFpbCI6ImNvbXByYWRvckBwcmVmZWl0dXJhLnNwLmdvdi5iciIsInJvbGUiOiJQVUJMSUNfRU5USVRZIiwic2Vzc2lvbklkIjoiMGZlNWJhNmItYmZmOC00NmI1LWFlNDQtNTkyMWNmZTI3ZTBmIiwiaWF0IjoxNzYxMTg2NzMwLCJleHAiOjE3NjE3OTE1MzB9.nZRGT_a3evDidE0yHlrlhPmW2gQT7U6-9HaqnmvaOKc	::ffff:172.18.0.5	curl/7.81.0	2025-10-30 02:32:10.145	2025-10-23 02:32:10.147	2025-10-23 02:32:10.147
aa6c8d51-a9b5-482e-8c61-f8d4fde0c954	de0c02b5-c42f-470f-b774-3cd00036e429	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZTBjMDJiNS1jNDJmLTQ3MGYtYjc3NC0zY2QwMDAzNmU0MjkiLCJlbWFpbCI6ImNvbXByYWRvckBwcmVmZWl0dXJhLnNwLmdvdi5iciIsInJvbGUiOiJQVUJMSUNfRU5USVRZIiwic2Vzc2lvbklkIjoiYWE2YzhkNTEtYTliNS00ODJlLThjNjEtZjhkNGZkZTBjOTU0IiwiaWF0IjoxNzYxMTg2NzQ2LCJleHAiOjE3NjE3OTE1NDZ9.A2H30aPYOGKVPqJlSE4D4uOR3xeeNzevM94bA1ihnp4	::ffff:172.18.0.5	curl/7.81.0	2025-10-30 02:32:26.958	2025-10-23 02:32:26.959	2025-10-23 02:32:26.959
1858fa09-c025-4eb6-90bd-356a32015d57	1ca4f871-563d-4c9c-8739-9e94996584e2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxY2E0Zjg3MS01NjNkLTRjOWMtODczOS05ZTk0OTk2NTg0ZTIiLCJlbWFpbCI6ImNvbXByYWRvckBnb3Zlcm5vLnJqLmdvdi5iciIsInJvbGUiOiJQVUJMSUNfRU5USVRZIiwic2Vzc2lvbklkIjoiMTg1OGZhMDktYzAyNS00ZWI2LTkwYmQtMzU2YTMyMDE1ZDU3IiwiaWF0IjoxNzYxMTg2NzYwLCJleHAiOjE3NjE3OTE1NjB9.6oYjIouRXIQcHapUUYzsGknyBxw4DLetnZf3NZtM7-4	::ffff:172.18.0.5	curl/7.81.0	2025-10-30 02:32:40.455	2025-10-23 02:32:40.456	2025-10-23 02:32:40.456
65901b32-6009-4c6b-9f6e-c43b8afc3745	1ca4f871-563d-4c9c-8739-9e94996584e2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxY2E0Zjg3MS01NjNkLTRjOWMtODczOS05ZTk0OTk2NTg0ZTIiLCJlbWFpbCI6ImNvbXByYWRvckBnb3Zlcm5vLnJqLmdvdi5iciIsInJvbGUiOiJQVUJMSUNfRU5USVRZIiwic2Vzc2lvbklkIjoiNjU5MDFiMzItNjAwOS00YzZiLTlmNmUtYzQzYjhhZmMzNzQ1IiwiaWF0IjoxNzYxMTg2Nzc1LCJleHAiOjE3NjE3OTE1NzV9.iDJXbQHQ_UWd3STabV0e4mRHWekHRTJCz4CvOmJKeh4	::ffff:172.18.0.5	curl/7.81.0	2025-10-30 02:32:55.904	2025-10-23 02:32:55.905	2025-10-23 02:32:55.905
e7834f91-9b19-489e-81c6-8dad3ae79e98	73b6696a-c5f2-4de1-894d-4b524d4caddc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3M2I2Njk2YS1jNWYyLTRkZTEtODk0ZC00YjUyNGQ0Y2FkZGMiLCJlbWFpbCI6ImZvcm5lY2Vkb3JAZW1wcmVzYS5jb20uYnIiLCJyb2xlIjoiU1VQUExJRVIiLCJzZXNzaW9uSWQiOiJlNzgzNGY5MS05YjE5LTQ4OWUtODFjNi04ZGFkM2FlNzllOTgiLCJpYXQiOjE3NjExODY3ODgsImV4cCI6MTc2MTc5MTU4OH0.9uCfltf5wTwSQbmfaShe7LR0oofxOQolQoqBu7L6YIo	::ffff:172.18.0.5	curl/7.81.0	2025-10-30 02:33:08.503	2025-10-23 02:33:08.504	2025-10-23 02:33:08.504
fc1d9fdd-1bb1-4962-9f47-eeb0cb3204c6	73b6696a-c5f2-4de1-894d-4b524d4caddc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3M2I2Njk2YS1jNWYyLTRkZTEtODk0ZC00YjUyNGQ0Y2FkZGMiLCJlbWFpbCI6ImZvcm5lY2Vkb3JAZW1wcmVzYS5jb20uYnIiLCJyb2xlIjoiU1VQUExJRVIiLCJzZXNzaW9uSWQiOiJmYzFkOWZkZC0xYmIxLTQ5NjItOWY0Ny1lZWIwY2IzMjA0YzYiLCJpYXQiOjE3NjExODY4MDQsImV4cCI6MTc2MTc5MTYwNH0.LvHL5YdlN1EVjAmVSrSmkqQEYXOzNBwKYFyUBTe2lng	::ffff:172.18.0.5	curl/7.81.0	2025-10-30 02:33:24.951	2025-10-23 02:33:24.953	2025-10-23 02:33:24.953
8fb30b15-7168-4bc7-abee-1b7b147114f2	8e76417e-018a-451b-8ce9-c395d20a7976	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4ZTc2NDE3ZS0wMThhLTQ1MWItOGNlOS1jMzk1ZDIwYTc5NzYiLCJlbWFpbCI6ImZvcm5lY2Vkb3IyQGNvbnN0cnVjb2VzLmNvbS5iciIsInJvbGUiOiJTVVBQTElFUiIsInNlc3Npb25JZCI6IjhmYjMwYjE1LTcxNjgtNGJjNy1hYmVlLTFiN2IxNDcxMTRmMiIsImlhdCI6MTc2MTE4NjgxOCwiZXhwIjoxNzYxNzkxNjE4fQ.S4VvJQOIxCQuMd5wG2_AJVjZkXT-Etyz7_xPEPVAqcI	::ffff:172.18.0.5	curl/7.81.0	2025-10-30 02:33:38.087	2025-10-23 02:33:38.088	2025-10-23 02:33:38.088
da55b4e0-9048-48fd-9d29-451f11c56461	8e76417e-018a-451b-8ce9-c395d20a7976	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4ZTc2NDE3ZS0wMThhLTQ1MWItOGNlOS1jMzk1ZDIwYTc5NzYiLCJlbWFpbCI6ImZvcm5lY2Vkb3IyQGNvbnN0cnVjb2VzLmNvbS5iciIsInJvbGUiOiJTVVBQTElFUiIsInNlc3Npb25JZCI6ImRhNTViNGUwLTkwNDgtNDhmZC05ZDI5LTQ1MWYxMWM1NjQ2MSIsImlhdCI6MTc2MTE4NjgzNiwiZXhwIjoxNzYxNzkxNjM2fQ.sPv93C1Sp9mQ2IJ9-lZi9zEooK_46MSo5oGxIiUXKvI	::ffff:172.18.0.5	curl/7.81.0	2025-10-30 02:33:56.107	2025-10-23 02:33:56.109	2025-10-23 02:33:56.109
bbd6774e-3177-4b7c-8ad7-79a207c70fbd	a1833d80-09ac-4553-993a-7f3bd760eb17	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMTgzM2Q4MC0wOWFjLTQ1NTMtOTkzYS03ZjNiZDc2MGViMTciLCJlbWFpbCI6ImNpZGFkYW9AZW1haWwuY29tIiwicm9sZSI6IkNJVElaRU4iLCJzZXNzaW9uSWQiOiJiYmQ2Nzc0ZS0zMTc3LTRiN2MtOGFkNy03OWEyMDdjNzBmYmQiLCJpYXQiOjE3NjExODY4NDgsImV4cCI6MTc2MTc5MTY0OH0.s6lO75qbUKD8c9Zpav5rPxFp9ZIu9qPY8svLJua6-rc	::ffff:172.18.0.5	curl/7.81.0	2025-10-30 02:34:08.623	2025-10-23 02:34:08.624	2025-10-23 02:34:08.624
dae0c111-1037-4d8d-a35c-e01df6f12728	a1833d80-09ac-4553-993a-7f3bd760eb17	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMTgzM2Q4MC0wOWFjLTQ1NTMtOTkzYS03ZjNiZDc2MGViMTciLCJlbWFpbCI6ImNpZGFkYW9AZW1haWwuY29tIiwicm9sZSI6IkNJVElaRU4iLCJzZXNzaW9uSWQiOiJkYWUwYzExMS0xMDM3LTRkOGQtYTM1Yy1lMDFkZjZmMTI3MjgiLCJpYXQiOjE3NjExODY4NjUsImV4cCI6MTc2MTc5MTY2NX0.4auSRq1iF5A0XhdRzfZN2WI8unR6YSvH1fM8qeCgj54	::ffff:172.18.0.5	curl/7.81.0	2025-10-30 02:34:25.979	2025-10-23 02:34:25.98	2025-10-23 02:34:25.98
166bd9be-a9e1-4e8f-b778-191cacd46d07	5b3ee9f7-5be5-4989-b4ac-914d34e493c6	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1YjNlZTlmNy01YmU1LTQ5ODktYjRhYy05MTRkMzRlNDkzYzYiLCJlbWFpbCI6ImNpZGFkYW8yQGVtYWlsLmNvbSIsInJvbGUiOiJDSVRJWkVOIiwic2Vzc2lvbklkIjoiMTY2YmQ5YmUtYTllMS00ZThmLWI3NzgtMTkxY2FjZDQ2ZDA3IiwiaWF0IjoxNzYxMTg2ODc3LCJleHAiOjE3NjE3OTE2Nzd9.vaCkL6UW7sWqsfS3Rvlnc3U2XshCSQa-a4hd6VOBtdw	::ffff:172.18.0.5	curl/7.81.0	2025-10-30 02:34:37.577	2025-10-23 02:34:37.578	2025-10-23 02:34:37.578
f95dc4ae-960f-4775-b791-5f4f507610fe	5b3ee9f7-5be5-4989-b4ac-914d34e493c6	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1YjNlZTlmNy01YmU1LTQ5ODktYjRhYy05MTRkMzRlNDkzYzYiLCJlbWFpbCI6ImNpZGFkYW8yQGVtYWlsLmNvbSIsInJvbGUiOiJDSVRJWkVOIiwic2Vzc2lvbklkIjoiZjk1ZGM0YWUtOTYwZi00Nzc1LWI3OTEtNWY0ZjUwNzYxMGZlIiwiaWF0IjoxNzYxMTg2ODk2LCJleHAiOjE3NjE3OTE2OTZ9.rJbm2GjSi8dxJAsRGusl5JuwemPIfO2FV0opeDjjimg	::ffff:172.18.0.5	curl/7.81.0	2025-10-30 02:34:56.985	2025-10-23 02:34:56.986	2025-10-23 02:34:56.986
3c0a33e5-070d-44db-98ce-02519ff74b9a	1b679fb6-0b1e-47a0-8573-9f2b02256a79	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxYjY3OWZiNi0wYjFlLTQ3YTAtODU3My05ZjJiMDIyNTZhNzkiLCJlbWFpbCI6ImF1ZGl0b3JAdGN1Lmdvdi5iciIsInJvbGUiOiJBVURJVE9SIiwic2Vzc2lvbklkIjoiM2MwYTMzZTUtMDcwZC00NGRiLTk4Y2UtMDI1MTlmZjc0YjlhIiwiaWF0IjoxNzYxMTg2OTA4LCJleHAiOjE3NjE3OTE3MDh9.YzJ7zVEQE-EQrQ7jqA2wAVFKDLvBU-jiftdZhNvHClw	::ffff:172.18.0.5	curl/7.81.0	2025-10-30 02:35:08.964	2025-10-23 02:35:08.966	2025-10-23 02:35:08.966
5a38428a-507e-4fa5-add6-2e8da6d16095	1b679fb6-0b1e-47a0-8573-9f2b02256a79	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxYjY3OWZiNi0wYjFlLTQ3YTAtODU3My05ZjJiMDIyNTZhNzkiLCJlbWFpbCI6ImF1ZGl0b3JAdGN1Lmdvdi5iciIsInJvbGUiOiJBVURJVE9SIiwic2Vzc2lvbklkIjoiNWEzODQyOGEtNTA3ZS00ZmE1LWFkZDYtMmU4ZGE2ZDE2MDk1IiwiaWF0IjoxNzYxMTg2OTI2LCJleHAiOjE3NjE3OTE3MjZ9.spEMUqwa31MYMkDk_V_GaAHRpn4rG9fELg_KyRTWzLg	::ffff:172.18.0.5	curl/7.81.0	2025-10-30 02:35:26.994	2025-10-23 02:35:26.995	2025-10-23 02:35:26.995
3fef53fb-35bf-4bed-985c-a7c1c99f6772	e28f5b1d-55ca-4488-9301-e9b91ba84702	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMjhmNWIxZC01NWNhLTQ0ODgtOTMwMS1lOWI5MWJhODQ3MDIiLCJlbWFpbCI6ImFkbWluQGxpY2l0YWJyYXNpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiIzZmVmNTNmYi0zNWJmLTRiZWQtOTg1Yy1hN2MxYzk5ZjY3NzIiLCJpYXQiOjE3NjExODY5NDIsImV4cCI6MTc2MTc5MTc0Mn0.RdcMC8kpWFgC2w7Bya9odwgjbwTYy-UIV66VldcP0jE	::ffff:172.18.0.5	curl/7.81.0	2025-10-30 02:35:42.087	2025-10-23 02:35:42.088	2025-10-23 02:35:42.088
f4f30212-8fca-4b42-a002-d2b2cf0be34f	e28f5b1d-55ca-4488-9301-e9b91ba84702	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMjhmNWIxZC01NWNhLTQ0ODgtOTMwMS1lOWI5MWJhODQ3MDIiLCJlbWFpbCI6ImFkbWluQGxpY2l0YWJyYXNpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiJmNGYzMDIxMi04ZmNhLTRiNDItYTAwMi1kMmIyY2YwYmUzNGYiLCJpYXQiOjE3NjExODY5NTgsImV4cCI6MTc2MTc5MTc1OH0.dVbtB2x98JLP5rCi_4m7ybVUbhM17ldEfzP_YNzdmv4	::ffff:172.18.0.5	curl/7.81.0	2025-10-30 02:35:58.78	2025-10-23 02:35:58.781	2025-10-23 02:35:58.781
4059f094-3cde-445b-acbd-76218ebf42b3	de0c02b5-c42f-470f-b774-3cd00036e429	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZTBjMDJiNS1jNDJmLTQ3MGYtYjc3NC0zY2QwMDAzNmU0MjkiLCJlbWFpbCI6ImNvbXByYWRvckBwcmVmZWl0dXJhLnNwLmdvdi5iciIsInJvbGUiOiJQVUJMSUNfRU5USVRZIiwic2Vzc2lvbklkIjoiNDA1OWYwOTQtM2NkZS00NDViLWFjYmQtNzYyMThlYmY0MmIzIiwiaWF0IjoxNzYxMTg3MzEwLCJleHAiOjE3NjE3OTIxMTB9.re39X3Fk7iPnKIm1rcJTZh0LpLW4P1XFDtEEb6YKclI	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	2025-10-30 02:41:50.956	2025-10-23 02:41:50.957	2025-10-23 02:41:50.957
75358300-a4f0-432d-9956-6c37212fe0ef	de0c02b5-c42f-470f-b774-3cd00036e429	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZTBjMDJiNS1jNDJmLTQ3MGYtYjc3NC0zY2QwMDAzNmU0MjkiLCJlbWFpbCI6ImNvbXByYWRvckBwcmVmZWl0dXJhLnNwLmdvdi5iciIsInJvbGUiOiJQVUJMSUNfRU5USVRZIiwic2Vzc2lvbklkIjoiNzUzNTgzMDAtYTRmMC00MzJkLTk5NTYtNmMzNzIxMmZlMGVmIiwiaWF0IjoxNzYxMTg3MzMyLCJleHAiOjE3NjE3OTIxMzJ9.NjFiFF_Z29r3Iqq4evzWg0suKuOQEfgCy55qRjeRcRs	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	2025-10-30 02:42:12.062	2025-10-23 02:42:12.063	2025-10-23 02:42:12.063
6c0dabfa-fe6f-4a7a-9731-3435d033e045	e28f5b1d-55ca-4488-9301-e9b91ba84702	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMjhmNWIxZC01NWNhLTQ0ODgtOTMwMS1lOWI5MWJhODQ3MDIiLCJlbWFpbCI6ImFkbWluQGxpY2l0YWJyYXNpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiI2YzBkYWJmYS1mZTZmLTRhN2EtOTczMS0zNDM1ZDAzM2UwNDUiLCJpYXQiOjE3NjExODczNjQsImV4cCI6MTc2MTc5MjE2NH0.JyymHsbfjW96Pw5GatpmeqzVZ0dYORxVrH3xXLEv3I0	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	2025-10-30 02:42:44.83	2025-10-23 02:42:44.831	2025-10-23 02:42:44.831
514551c5-1de2-4ec7-9c93-88064c817e47	de0c02b5-c42f-470f-b774-3cd00036e429	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZTBjMDJiNS1jNDJmLTQ3MGYtYjc3NC0zY2QwMDAzNmU0MjkiLCJlbWFpbCI6ImNvbXByYWRvckBwcmVmZWl0dXJhLnNwLmdvdi5iciIsInJvbGUiOiJQVUJMSUNfRU5USVRZIiwic2Vzc2lvbklkIjoiNTE0NTUxYzUtMWRlMi00ZWM3LTljOTMtODgwNjRjODE3ZTQ3IiwiaWF0IjoxNzYxMTg3NTI2LCJleHAiOjE3NjE3OTIzMjZ9.48nJTE6hiopKfDagcuCIp-jg8uOO9i1GIUSWlcQqe28	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	2025-10-30 02:45:26.124	2025-10-23 02:45:26.125	2025-10-23 02:45:26.125
a4e0474e-b225-4abd-a350-b6c75851338d	e28f5b1d-55ca-4488-9301-e9b91ba84702	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMjhmNWIxZC01NWNhLTQ0ODgtOTMwMS1lOWI5MWJhODQ3MDIiLCJlbWFpbCI6ImFkbWluQGxpY2l0YWJyYXNpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJzZXNzaW9uSWQiOiJhNGUwNDc0ZS1iMjI1LTRhYmQtYTM1MC1iNmM3NTg1MTMzOGQiLCJpYXQiOjE3NjExODc2MTIsImV4cCI6MTc2MTc5MjQxMn0.QIm3DEfxj4NXHuzhj_2dK3RVZT7RH2TACuk64YIohUo	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	2025-10-30 02:46:52.398	2025-10-23 02:46:52.399	2025-10-23 02:46:52.399
36cb9eec-2a19-42c0-acbd-140949b3a968	305c94f2-c37d-4f9a-8074-62a14cd99436	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzMDVjOTRmMi1jMzdkLTRmOWEtODA3NC02MmExNGNkOTk0MzYiLCJlbWFpbCI6ImZsc2FudG9zMDMwNUBnbWFpbC5jb20iLCJyb2xlIjoiU1VQUExJRVIiLCJzZXNzaW9uSWQiOiIzNmNiOWVlYy0yYTE5LTQyYzAtYWNiZC0xNDA5NDliM2E5NjgiLCJpYXQiOjE3NjExODc2MzMsImV4cCI6MTc2MTc5MjQzM30.37rK2eavEX7Qyf1cWAGZjRVTl9nbDiiD6n1moja-OSY	::ffff:172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	2025-10-30 02:47:13.068	2025-10-23 02:47:13.069	2025-10-23 02:47:13.069
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: licitabrasil
--

COPY public.users (id, email, password, role, status, "firstName", "lastName", phone, avatar, "lastLoginAt", "createdAt", "updatedAt") FROM stdin;
e28f5b1d-55ca-4488-9301-e9b91ba84702	admin@licitabrasil.com	$2a$12$BHHjWxGoTuLO9ANrnDBr5uFZQhX3VYWOL/lGsbDYqj4nbuXxWX55u	ADMIN	ACTIVE	Admin	Sistema	\N	\N	2025-10-23 02:47:01.835	2025-10-23 01:49:19.78	2025-10-23 02:47:01.836
305c94f2-c37d-4f9a-8074-62a14cd99436	flsantos0305@gmail.com	$2a$12$LKm6YkEY5lIWmkENpDLt/.5fR25xHmlLE/FnY.9rS8fYUs0O7U4D.	SUPPLIER	ACTIVE	Fábio	Luiz dos Santos	(31) 9 8266-7628	\N	2025-10-23 02:47:13.072	2025-10-23 02:45:58.391	2025-10-23 02:47:13.073
1ca4f871-563d-4c9c-8739-9e94996584e2	comprador@governo.rj.gov.br	$2a$12$xETNYDaGTgbiurJ6NREpyOploY/zxTYj/R0hyquFrLZ7Sf/N4hrWK	PUBLIC_ENTITY	ACTIVE	Roberto	Ferreira	(21) 2334-5678	\N	2025-10-23 02:32:55.907	2025-10-23 02:31:00.411	2025-10-23 02:32:55.908
73b6696a-c5f2-4de1-894d-4b524d4caddc	fornecedor@empresa.com.br	$2a$12$xETNYDaGTgbiurJ6NREpyOploY/zxTYj/R0hyquFrLZ7Sf/N4hrWK	SUPPLIER	ACTIVE	Maria	Santos	(11) 2222-3333	\N	2025-10-23 02:33:24.954	2025-10-23 02:31:00.368	2025-10-23 02:33:24.955
8e76417e-018a-451b-8ce9-c395d20a7976	fornecedor2@construcoes.com.br	$2a$12$xETNYDaGTgbiurJ6NREpyOploY/zxTYj/R0hyquFrLZ7Sf/N4hrWK	SUPPLIER	ACTIVE	Pedro	Almeida	(11) 5555-6666	\N	2025-10-23 02:33:56.111	2025-10-23 02:31:00.401	2025-10-23 02:33:56.112
a1833d80-09ac-4553-993a-7f3bd760eb17	cidadao@email.com	$2a$12$xETNYDaGTgbiurJ6NREpyOploY/zxTYj/R0hyquFrLZ7Sf/N4hrWK	CITIZEN	ACTIVE	Carlos	Oliveira	(11) 9 1111-2222	\N	2025-10-23 02:34:25.981	2025-10-23 02:31:00.381	2025-10-23 02:34:25.982
5b3ee9f7-5be5-4989-b4ac-914d34e493c6	cidadao2@email.com	$2a$12$xETNYDaGTgbiurJ6NREpyOploY/zxTYj/R0hyquFrLZ7Sf/N4hrWK	CITIZEN	ACTIVE	Fernanda	Lima	(11) 7777-8888	\N	2025-10-23 02:34:56.988	2025-10-23 02:31:00.421	2025-10-23 02:34:56.989
1b679fb6-0b1e-47a0-8573-9f2b02256a79	auditor@tcu.gov.br	$2a$12$xETNYDaGTgbiurJ6NREpyOploY/zxTYj/R0hyquFrLZ7Sf/N4hrWK	AUDITOR	ACTIVE	Ana	Costa	(61) 3316-5000	\N	2025-10-23 02:35:26.997	2025-10-23 02:31:00.397	2025-10-23 02:35:26.998
de0c02b5-c42f-470f-b774-3cd00036e429	comprador@prefeitura.sp.gov.br	$2a$12$QBzoSzHgQGFNrwft/b6xcu2kxwmpybNQ.RQ3PWPFj0eLxLIeeLAdW	PUBLIC_ENTITY	ACTIVE	João	Silva	(11) 3333-4444	\N	2025-10-23 02:45:26.132	2025-10-23 02:30:03.415	2025-10-23 02:45:26.133
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

\unrestrict ZRcCCiUm3iQgccKdbJelOQiw6gOoTLch647uiPercEWmEgnzTQgYb7ezj6Piqhv

