export interface ProjectLinks {
  [platform: string]: string[];
}

export interface ScfInfo {
  rounds: string[];
  total: number;
  submissions: (string | null)[];
}

export interface Audit {
  name: string;
  url: string | null;
  date: string | null;
  auditor: string | null;
}

export interface Token {
  code: string | null;
  issuer: string | null;
  decimals: number | null;
}

export interface ContractRef {
  id: string | null;
  label: string | null;
  isPool: boolean;
  tags: string[];
}

export interface SepInfo {
  domain: string;
  orgName: string | null;
  orgLogo: string | null;
  sepEndpoints: string[];
  currencyCount: number;
  currencyCodes: string[];
  validators: number;
  accounts: number;
}

export interface Project {
  slug: string;
  title: string;
  otherNames: string[];
  parent: string | null;
  description: string;
  links: ProjectLinks;
  website: string | null;
  category: string;
  tags: string[];
  regions: string[];
  basedIn: string | null;
  avatar: string | null;
  logo: string | null;
  scf: ScfInfo | null;
  audits: Audit[];
  tokens: Token[];
  contracts: ContractRef[];
  sep?: SepInfo;
}

export interface DatasetMeta {
  generatedAt: string;
  source: string;
  totals: {
    projects: number;
    scfFunded: number;
    audited: number;
    withContracts: number;
    contracts: number;
    tags: number;
  };
  categories: Record<string, number>;
}
