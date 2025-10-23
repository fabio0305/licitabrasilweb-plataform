// Enums
export enum UserRole {
  ADMIN = 'ADMIN',
  SUPPLIER = 'SUPPLIER',
  PUBLIC_ENTITY = 'PUBLIC_ENTITY',
  AUDITOR = 'AUDITOR',
  CITIZEN = 'CITIZEN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
}

export enum BiddingStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
  AWARDED = 'AWARDED',
}

export enum BiddingType {
  PREGAO_ELETRONICO = 'PREGAO_ELETRONICO',
  CONCORRENCIA = 'CONCORRENCIA',
  TOMADA_PRECOS = 'TOMADA_PRECOS',
  CONVITE = 'CONVITE',
  CONCURSO = 'CONCURSO',
  LEILAO = 'LEILAO',
}

export enum ProposalStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum ContractStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
  COMPLETED = 'COMPLETED',
}

// Interfaces principais
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  userId: string;
  companyName: string;
  tradeName?: string;
  cnpj: string;
  stateRegistration?: string;
  municipalRegistration?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  website?: string;
  description?: string;
  isActive: boolean;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface PublicEntity {
  id: string;
  userId: string;
  name: string;
  cnpj: string;
  entityType: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  website?: string;
  isActive: boolean;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  code: string;
  parentId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parent?: Category;
  children?: Category[];
}

export interface Bidding {
  id: string;
  publicEntityId: string;
  title: string;
  description: string;
  biddingNumber: string;
  type: BiddingType;
  status: BiddingStatus;
  estimatedValue: number;
  openingDate: string;
  closingDate: string;
  deliveryLocation: string;
  deliveryDeadline: string;
  requirements: string;
  evaluationCriteria: string;
  isPublic: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  publicEntity?: PublicEntity;
  proposals?: Proposal[];
  categories?: Category[];
}

export interface ProposalItem {
  id: string;
  proposalId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  brand?: string;
  model?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Proposal {
  id: string;
  biddingId: string;
  supplierId: string;
  totalValue: number;
  description: string;
  status: ProposalStatus;
  submittedAt?: string;
  validUntil: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  bidding?: Bidding;
  supplier?: Supplier;
  items?: ProposalItem[];
}

export interface Contract {
  id: string;
  biddingId: string;
  proposalId: string;
  publicEntityId: string;
  supplierId: string;
  contractNumber: string;
  title: string;
  description: string;
  totalValue: number;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  signedAt?: string;
  createdAt: string;
  updatedAt: string;
  bidding?: Bidding;
  proposal?: Proposal;
  publicEntity?: PublicEntity;
  supplier?: Supplier;
}

// Interfaces para formulários
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
}

export interface SupplierForm {
  companyName: string;
  tradeName?: string;
  cnpj: string;
  stateRegistration?: string;
  municipalRegistration?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  website?: string;
  description?: string;
}

export interface PublicEntityForm {
  name: string;
  cnpj: string;
  entityType: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  website?: string;
}

export interface BiddingForm {
  title: string;
  description: string;
  type: BiddingType;
  estimatedValue: number;
  openingDate: string;
  closingDate: string;
  deliveryLocation: string;
  deliveryDeadline: string;
  requirements: string;
  evaluationCriteria: string;
  categoryIds: string[];
}

export interface ProposalForm {
  totalValue: number;
  description: string;
  validUntil: string;
  notes?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    brand?: string;
    model?: string;
  }[];
}

// Interfaces para autenticação
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// Interfaces para paginação
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Interfaces para filtros
export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

export interface BiddingFilters extends PaginationParams, DateRangeFilter {
  status?: BiddingStatus;
  type?: BiddingType;
  publicEntityId?: string;
  categoryId?: string;
  search?: string;
}

export interface ProposalFilters extends PaginationParams, DateRangeFilter {
  status?: ProposalStatus;
  biddingId?: string;
  supplierId?: string;
}

export interface ContractFilters extends PaginationParams, DateRangeFilter {
  status?: ContractStatus;
  publicEntityId?: string;
  supplierId?: string;
}

// Interfaces para API Response
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Formulários de setup de perfil
export interface SupplierProfileSetupForm {
  companyName: string;
  tradeName?: string;
  cnpj: string;
  stateRegistration?: string;
  municipalRegistration?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  website?: string;
  description?: string;
  categories: string[];
}

export interface PublicEntityProfileSetupForm {
  name: string;
  cnpj: string;
  entityType: string;
  sphere: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  website?: string;
  legalRepresentativeName: string;
  legalRepresentativeCpf: string;
  legalRepresentativePosition: string;
}

export interface CitizenProfileSetupForm {
  cpf: string;
  dateOfBirth: string;
  profession?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  interests: string[];
}

export interface AuditorProfileSetupForm {
  cpf: string;
  institution: string;
  professionalRegistry: string;
  specialization: string;
  professionalPhone: string;
}
