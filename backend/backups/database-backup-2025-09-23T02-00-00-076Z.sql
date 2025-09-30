--
-- PostgreSQL database dump
--

\restrict VAXOccFuXMtKfy7klm6K94fQcyaqZdSkdn5jDFdsrdN3lThvcon3BwkzeUARaj1

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
    'AUDITOR'
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
\.


--
-- Data for Name: system_configs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_configs (id, key, value, type, description, "isPublic", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_sessions (id, "userId", token, "ipAddress", "userAgent", "expiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password, role, status, "firstName", "lastName", phone, avatar, "lastLoginAt", "createdAt", "updatedAt") FROM stdin;
a6215238-a54d-4537-bcfe-73d34cc6a6ce	joao@example.com	$2a$12$mtEkxSk8yXL1W65szghUXOsegj5fJSJ/IWIFQSiggNVl.a2ifXuei	SUPPLIER	PENDING	João	Silva	\N	\N	\N	2025-09-17 22:14:20.826	2025-09-17 22:14:20.826
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
-- Name: user_sessions user_sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict VAXOccFuXMtKfy7klm6K94fQcyaqZdSkdn5jDFdsrdN3lThvcon3BwkzeUARaj1

