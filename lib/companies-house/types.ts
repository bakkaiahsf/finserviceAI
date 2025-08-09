// Companies House API Types
export interface CompanySearchResult {
  company_number: string;
  company_status: string;
  company_type: string;
  date_of_cessation?: string;
  date_of_creation: string;
  description: string;
  description_identifier?: string[];
  external_registration_number?: string;
  kind: string;
  links: {
    self: string;
    company_profile?: string;
  };
  matches?: {
    address_snippet?: string[];
    snippet?: string[];
    title?: string[];
  };
  title: string;
  address?: {
    address_line_1?: string;
    address_line_2?: string;
    country?: string;
    locality?: string;
    postal_code?: string;
    premises?: string;
    region?: string;
  };
}

export interface CompanySearchResponse {
  etag: string;
  items: CompanySearchResult[];
  items_per_page: number;
  kind: string;
  page_number: number;
  start_index: number;
  total_results: number;
}

export interface CompanyProfile {
  accounts?: {
    accounting_reference_date?: {
      day: string;
      month: string;
    };
    last_accounts?: {
      made_up_to: string;
      period_end_on: string;
      period_start_on: string;
      type: string;
    };
    next_accounts?: {
      due_on: string;
      overdue: boolean;
      period_end_on: string;
      period_start_on: string;
    };
    next_due: string;
    next_made_up_to: string;
    overdue: boolean;
  };
  annual_return?: {
    last_made_up_to: string;
    next_due: string;
    next_made_up_to: string;
    overdue: boolean;
  };
  branch_company_details?: {
    business_activity: string;
    parent_company_name: string;
    parent_company_number: string;
  };
  can_file: boolean;
  company_name: string;
  company_number: string;
  company_status: string;
  company_status_detail?: string;
  confirmation_statement?: {
    last_made_up_to: string;
    next_due: string;
    next_made_up_to: string;
    overdue: boolean;
  };
  date_of_cessation?: string;
  date_of_creation: string;
  etag: string;
  external_registration_number?: string;
  foreign_company_details?: {
    accounting_requirement?: {
      foreign_account_type: string;
      terms_of_account_publication: string;
    };
    accounts?: {
      account_period_from?: {
        day: number;
        month: number;
      };
      account_period_to?: {
        day: number;
        month: number;
      };
      must_file_within?: {
        months: number;
      };
    };
    business_activity: string;
    company_type: string;
    governed_by: string;
    is_a_credit_finance_institution: boolean;
    originating_registry?: {
      country: string;
      name: string;
    };
    registration_number: string;
  };
  has_been_liquidated?: boolean;
  has_charges?: boolean;
  has_insolvency_history?: boolean;
  is_community_interest_company?: boolean;
  jurisdiction: string;
  kind: string;
  last_full_members_list_date?: string;
  links: {
    filing_history?: string;
    officers?: string;
    persons_with_significant_control?: string;
    registers?: string;
    self: string;
  };
  previous_company_names?: Array<{
    ceased_on: string;
    effective_from: string;
    name: string;
  }>;
  registered_office_address: {
    address_line_1?: string;
    address_line_2?: string;
    care_of?: string;
    country?: string;
    locality?: string;
    po_box?: string;
    postal_code?: string;
    premises?: string;
    region?: string;
  };
  registered_office_is_in_dispute?: boolean;
  sic_codes?: string[];
  type: string;
  undeliverable_registered_office_address?: boolean;
}

export interface Officer {
  address?: {
    address_line_1?: string;
    address_line_2?: string;
    care_of?: string;
    country?: string;
    locality?: string;
    postal_code?: string;
    premises?: string;
    region?: string;
  };
  appointed_on: string;
  country_of_residence?: string;
  date_of_birth?: {
    month: number;
    year: number;
  };
  former_names?: Array<{
    forenames?: string;
    surname?: string;
  }>;
  identification?: {
    identification_type: string;
    legal_authority: string;
    legal_form: string;
    place_registered?: string;
    registration_number?: string;
  };
  kind: string;
  links: {
    officer: {
      appointments: string;
    };
    self: string;
  };
  name: string;
  nationality?: string;
  occupation?: string;
  officer_role: string;
  resigned_on?: string;
}

export interface OfficersResponse {
  etag: string;
  items: Officer[];
  items_per_page: number;
  kind: string;
  links: {
    self: string;
  };
  resigned_count: number;
  start_index: number;
  total_results: number;
}

export interface PersonWithSignificantControl {
  address?: {
    address_line_1?: string;
    address_line_2?: string;
    care_of?: string;
    country?: string;
    locality?: string;
    postal_code?: string;
    premises?: string;
    region?: string;
  };
  ceased_on?: string;
  country_of_residence?: string;
  date_of_birth?: {
    month: number;
    year: number;
  };
  etag: string;
  identification?: {
    country_registered?: string;
    legal_authority: string;
    legal_form: string;
    place_registered?: string;
    registration_number?: string;
  };
  kind: string;
  links: {
    self: string;
    statement?: string;
  };
  name: string;
  name_elements?: {
    forename?: string;
    middle_name?: string;
    surname?: string;
    title?: string;
  };
  nationality?: string;
  natures_of_control?: string[];
  notified_on: string;
}

export interface PSCResponse {
  active_count: number;
  ceased_count: number;
  etag: string;
  items: PersonWithSignificantControl[];
  items_per_page: number;
  kind: string;
  links: {
    self: string;
  };
  start_index: number;
  total_results: number;
}

export interface RateLimitInfo {
  requests: number;
  resetTime: number;
  remaining: number;
  limit: number;
}

export interface CompaniesHouseError {
  error: string;
  type: string;
  message?: string;
}

export type CompanyStatus = 
  | 'active'
  | 'dissolved'
  | 'liquidation'
  | 'receivership'
  | 'administration'
  | 'voluntary-arrangement'
  | 'converted-closed'
  | 'insolvency-proceedings';

export type CompanyType = 
  | 'private-unlimited'
  | 'ltd'
  | 'plc'
  | 'old-public-company'
  | 'private-limited-guarant-nsc-limited-exemption'
  | 'private-limited-guarant-nsc'
  | 'private-limited-shares-section-30-exemption'
  | 'protected-cell-company'
  | 'assurance-company'
  | 'overseas-company'
  | 'eeig'
  | 'icvc-securities'
  | 'icvc-warrant'
  | 'icvc-umbrella'
  | 'industrial-and-provident-society'
  | 'northern-ireland'
  | 'credit-union'
  | 'charitable-incorporated-organisation'
  | 'co-operative'
  | 'community-interest-company'
  | 'a-vehicle'
  | 'other-company-type';

export type OfficerRole = 
  | 'director'
  | 'secretary'
  | 'llp-member'
  | 'llp-designated-member'
  | 'corporate-director'
  | 'corporate-secretary'
  | 'judicial-factor'
  | 'receiver-manager'
  | 'administrator'
  | 'corporate-llp-member'
  | 'corporate-llp-designated-member'
  | 'nominee-director'
  | 'nominee-secretary';