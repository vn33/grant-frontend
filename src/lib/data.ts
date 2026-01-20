
export interface Program {
  id: string;
  name: string;
  slug: string;
  provider: string; // e.g. "Investissement Québec", "NRC-IRAP"
  level: "Provincial" | "Federal" | "Municipal" | "Private";
  category: "Grant" | "Loan" | "Tax Credit";
  description: string;
  fundingMax: number;
  fundingPercentage: number;
  status: "Open" | "Paused" | "Closed";
  tags: string[];
  matchReason?: string[];
  eligibility: string[];
}

export const PROGRAMS: Program[] = [
  {
    id: "1",
    name: "ESSOR - Component 1",
    slug: "essor-component-1",
    provider: "Investissement Québec",
    level: "Provincial",
    category: "Loan",
    description: "Support for investment projects in Québec (feasibility studies, digital diagnostics).",
    fundingMax: 100000,
    fundingPercentage: 50,
    status: "Open",
    tags: ["Feasibility", "Digital Diagnostic", "SME"],
    matchReason: ["Supports feasibility studies", "Match for Québec SMEs"],
    eligibility: ["For-profit businesses in Québec", "Project cost > $20k"],
  },
  {
    id: "2",
    name: "CDAP - Boost Your Business Technology",
    slug: "cdap-boost",
    provider: "ISED (Federal)",
    level: "Federal",
    category: "Grant",
    description: "Get a grant to cover up to 90% of the cost of hiring a digital advisor to develop a digital adoption plan.",
    fundingMax: 15000,
    fundingPercentage: 90,
    status: "Open",
    tags: ["Digital Plan", "Advisory", "Small Business"],
    matchReason: ["High coverage (90%)", "Ideal for initial planning"],
    eligibility: ["Canadian-owned SME", "1-499 employees", "$500k+ revenue"],
  },
  {
    id: "3",
    name: "C3i - Investment and Innovation Tax Credit",
    slug: "c3i-tax-credit",
    provider: "Revenu Québec",
    level: "Provincial",
    category: "Tax Credit",
    description: "Tax credit for the acquisition of manufacturing and processing equipment, computer equipment, and management software packages.",
    fundingMax: 0, // No cap per se, depends on expenses
    fundingPercentage: 20, // varies by region
    status: "Open",
    tags: ["Hardware", "Software", "Manufacturing"],
    matchReason: ["Applies to hardware & software", "Refundable tax credit"],
    eligibility: ["Establishment in Québec", "Eligible equipment expenses > $5k"],
  },
  {
    id: "4",
    name: "Productivité innovation",
    slug: "productivite-innovation",
    provider: "Investissement Québec",
    level: "Provincial",
    category: "Loan",
    description: "Term loan to support innovative projects and purchase of high-tech equipment to increase productivity.",
    fundingMax: 5000000,
    fundingPercentage: 100,
    status: "Open",
    tags: ["Productivity", "Equipment", "Innovation"],
    matchReason: ["Large funding capacity", "Supports equipment purchase"],
    eligibility: ["Profitable SME", "Project aims to increase productivity"],
  },
  {
    id: "5",
    name: "CanExport SMEs",
    slug: "canexport-smes",
    provider: "Trade Commissioner Service",
    level: "Federal",
    category: "Grant",
    description: "Funding to help Canadian SMEs break into new international markets.",
    fundingMax: 50000,
    fundingPercentage: 50,
    status: "Paused",
    tags: ["Export", "International", "Marketing"],
    matchReason: ["Supports international expansion", "Digital marketing covered"],
    eligibility: ["SME", "Expanding to new market"],
  },
];

export const MOCK_TESTIMONIALS = [
  {
    quote: "We identified $45k in grants we didn't know existed for our ERP implementation.",
    author: "Sarah L.",
    role: "CFO, Montreal Manufacturing Co.",
  },
  {
    quote: "Simple, fast, and surprisingly accurate. Gave us a clear roadmap for financing our automation.",
    author: "Jean-Marc D.",
    role: "Owner, Logistics Solution Inc.",
  },
];
