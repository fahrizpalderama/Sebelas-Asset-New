export type UserRole = "Superadmin" | "Admin" | "Teknis" | "Report";

export interface User {
  uid: string;
  name: string;
  email: string;
  type: UserRole;
}

export interface Asset {
  id?: string | number;
  name: string;
  code: string;
  condition: "Baru" | "Bekas";
  placement: string;
  outlet: string;
  date: string;
  verifier: string;
  photo: string;
  description?: string;
  price: number;
  category?: string;
  ownership?: string;
  priority?: string;
  status?: "Normal" | "Emergency" | "Maintenance";
}

export interface Vendor {
  id: string;
  name: string;
  companyName: string;
  whatsapp: string;
  socialMedia: string;
  category: string;
  type: "Service" | "Procurement";
  description?: string;
}

export interface Report {
  id?: string | number;
  outlet: string;
  placement: string;
  name: string;
  code: string;
  issue: string;
  desc: string;
  photo: string;
  reporter: string;
  timestamp: string;
  category: string;
  priority?: string;
  status: "pending" | "resolved";
  solverInfo?: {
    verifier: string;
    desc: string;
    photo: string;
    resolvedAt: string;
  };
}

export interface AssetActivity {
  id?: string;
  assetCode: string;
  type: "Created" | "Emergency" | "Resolved";
  description: string;
  user: string;
  timestamp: string;
  reportId?: string;
}

export interface ProcurementRecord {
  id?: string;
  itemName: string;
  quantity: number;
  unit: string;
  description: string;
  category: string;
  pricePerUnit: number;
  outlet: string;
  procurementVia: string;
  totalPrice: number;
  timestamp: string;
  createdBy: string;
  photo?: string;
}

export interface CategoryVendor {
  id: string;
  name: string;
}
