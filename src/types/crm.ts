export type UserRole = 
  | 'Admin'
  | 'Sales'
  | 'Tender Manager'
  | 'Inventory Manager'
  | 'HR'
  | 'Accounts'
  | 'Service';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  department?: string;
  avatarUrl?: string;
  createdAt: string;
  lastLogin?: string;
}

export type LeadStatus = 
  | 'New'
  | 'Contacted'
  | 'Qualified'
  | 'Quotation Sent'
  | 'Negotiation'
  | 'Won'
  | 'Lost';

export interface Lead {
  id: string;
  leadCode: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  source: 'GeM' | 'Hospital Visit' | 'Dealer Referral' | 'Direct Tender' | 'Website' | 'Exhibition';
  productInterest: string[];
  assignedEmployee: string;
  expectedValue: number;
  nextFollowUpDate: string;
  status: LeadStatus;
  notes: string;
  activityHistory?: {
    date: string;
    action: string;
    performedBy: string;
    notes?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface Dealer {
  id: string;
  dealerCode: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  territory: string;
  gstin: string;
  address: string;
  products: string[];
  creditLimit: number;
  outstandingBalance: number;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export type TenderStage = 
  | 'Identified'
  | 'Under Review'
  | 'Documents Pending'
  | 'Bid Submitted'
  | 'Technical Qualified'
  | 'Financial Evaluation'
  | 'L1'
  | 'Awarded'
  | 'Lost'
  | 'Cancelled';

export interface TenderDocument {
  id: string;
  title: string;
  category: 'Technical Bid' | 'Financial Bid' | 'EMD Receipt' | 'Compliance Matrix' | 'Authorization' | 'Other';
  fileName: string;
  status: 'Pending' | 'Uploaded' | 'Verified';
  uploadedAt?: string;
}

export interface Tender {
  id: string;
  tenderNumber: string;
  tenderTitle: string;
  governmentDepartment: string; // e.g. AIIMS New Delhi, Safdarjung, DGHS, Army Medical Corps
  buyerName: string;
  portalName: 'GeM' | 'CPPP' | 'State e-Procurement' | 'Defence/MES' | 'Railways' | 'Other';
  gemReference?: string;
  publicationDate: string;
  submissionDeadline: string;
  estimatedValue: number;
  emdAmount: number;
  tenderFee: number;
  technicalBidStatus: 'Pending' | 'Compliant' | 'Non-Compliant' | 'Disqualified';
  financialBidStatus: 'Pending' | 'Opened' | 'Under Review';
  l1Status: 'Yes' | 'No' | 'Awaited';
  awardStatus: 'Awaited' | 'Won' | 'Lost' | 'Cancelled';
  purchaseOrderNumber?: string;
  assignedEmployee: string;
  stage: TenderStage;
  documents: TenderDocument[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationItem {
  id: string;
  productId: string;
  productName: string;
  model: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  gstRate: number; // typically 12% or 18% for medical equipment
  discountPercent: number;
  lineTotal: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  revision: number;
  date: string;
  validUntil: string;
  clientType: 'Hospital' | 'Government' | 'Dealer' | 'Private Clinic';
  clientName: string;
  contactPerson: string;
  clientGstin?: string;
  billingAddress: string;
  shippingAddress: string;
  tenderReference?: string;
  leadId?: string;
  items: QuotationItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  status: 'Draft' | 'Sent' | 'Approved' | 'Rejected' | 'Converted to PO';
  termsAndConditions: string;
  preparedBy: string;
  createdAt: string;
  updatedAt: string;
}

export type InstrumentType = 'Bank Guarantee' | 'Fixed Deposit Receipt' | 'Demand Draft' | 'GeM e-PBG' | 'Online Transfer';
export type EmdPbgCategory = 'EMD' | 'PBG';
export type EmdPbgStatus = 'Active' | 'Expiring Soon' | 'Refund Requested' | 'Refunded' | 'Released' | 'Forfeited';

export interface EmdPbgRecord {
  id: string;
  category: EmdPbgCategory;
  tenderReference: string;
  tenderTitle: string;
  beneficiary: string; // e.g. Director AIIMS Delhi
  instrumentType: InstrumentType;
  amount: number;
  bankName: string;
  branch: string;
  instrumentNumber: string;
  issueDate: string;
  expiryDate: string;
  claimExpiryDate?: string;
  refundRequestedDate?: string;
  refundReceivedDate?: string;
  status: EmdPbgStatus;
  remarks: string;
  createdAt: string;
}

export type ProductCategory = 'ICU Equipment' | 'Operation Theatre' | 'Diagnostic' | 'Patient Monitoring' | 'Respiratory Care' | 'Raw Material' | 'Spares';

export interface Product {
  id: string;
  productCode: string;
  name: string;
  category: ProductCategory;
  modelNumber: string;
  hsnCode: string;
  type: 'Finished Equipment' | 'Sub-Assembly' | 'Raw Material' | 'Spare Part';
  warehouse: string;
  quantity: number;
  unit: 'Units' | 'Pieces' | 'Sets' | 'Meters' | 'Kg';
  purchaseCost: number;
  sellingPrice: number;
  minStockLevel: number;
  currentBatchNumber?: string;
  expiryDate?: string;
  cdscoClassification?: 'Class A' | 'Class B' | 'Class C' | 'Class D';
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  lastRestocked?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  type: 'Inward (GRN)' | 'Outward (Dispatch)' | 'Internal Transfer' | 'Adjustment';
  quantity: number;
  unit: string;
  batchNumber?: string;
  serialNumbers?: string[];
  fromLocation: string;
  toLocation: string;
  referenceNumber: string; // PO / Invoice / Job Card / GRN No.
  performedBy: string;
  date: string;
  reason?: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  designation: string;
  department: 'Production' | 'R&D' | 'Quality Control' | 'Sales & Tenders' | 'Service Engineering' | 'Accounts' | 'HR' | 'Warehouse';
  email: string;
  phone: string;
  dateOfJoining: string;
  status: 'Active' | 'On Leave' | 'Resigned';
  salary: {
    basic: number;
    hra: number;
    medicalAllowance: number;
    conveyance: number;
    pfDeduction: number;
    esiDeduction: number;
    tds: number;
  };
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  status: 'Present' | 'Absent' | 'Half-Day' | 'On-Duty' | 'Leave';
  checkIn?: string;
  checkOut?: string;
  hoursWorked?: number;
  remarks?: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  monthYear: string; // e.g. "October 2026"
  workingDays: number;
  daysPresent: number;
  grossSalary: number;
  totalDeductions: number;
  netPay: number;
  paymentStatus: 'Pending' | 'Processed' | 'Paid';
  paymentDate?: string;
}

export interface QualityInspection {
  id: string;
  reportNumber: string;
  productId: string;
  productName: string;
  batchNumber: string;
  quantityInspected: number;
  passedQuantity: number;
  failedQuantity: number;
  inspectorName: string;
  date: string;
  standardsChecked: string[]; // e.g. ["ISO 13485:2016", "IEC 60601-1 Medical Electrical Safety", "Biocompatibility ISO 10993"]
  result: 'Accepted' | 'Rejected' | 'Rework Required';
  ncrNumber?: string; // Non-Conformance Report
  notes: string;
}

export interface CalibrationCertificate {
  id: string;
  certificateNumber: string;
  equipmentName: string; // e.g. "Fluke Patient Simulator", "Electrical Safety Analyzer", "Digital Manometer"
  serialNumber: string;
  calibratedBy: string; // NABL accredited lab
  calibrationDate: string;
  expiryDate: string;
  status: 'Valid' | 'Expiring Soon' | 'Expired';
  standardReference: string;
}

export interface ComplianceDocument {
  id: string;
  title: string;
  regulatoryBody: 'CDSCO' | 'ISO' | 'CE' | 'BIS' | 'AERB' | 'Factory License';
  certificateNumber: string;
  issueDate: string;
  validUntil: string;
  status: 'Active' | 'Renewal Pending' | 'Expired';
  scope: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  clientName: string;
  clientGstin: string;
  orderReference: string;
  tenderReference?: string;
  items: {
    name: string;
    hsn: string;
    qty: number;
    rate: number;
    gstRate: number;
    amount: number;
  }[];
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: 'Paid' | 'Partially Paid' | 'Unpaid' | 'Overdue';
  dispatchChallanNo?: string;
}

export interface DispatchChallan {
  id: string;
  challanNumber: string;
  invoiceNumber?: string;
  date: string;
  consigneeName: string;
  shippingAddress: string;
  vehicleNumber: string;
  transporterName: string;
  lrNumber?: string; // Lorry Receipt
  packagesCount: number;
  itemsSummary: string;
  status: 'Dispatched' | 'In Transit' | 'Delivered' | 'Returned';
  receivedDate?: string;
}

export interface ServiceTicket {
  id: string;
  ticketNumber: string;
  customerName: string;
  hospitalName: string;
  contactPhone: string;
  city: string;
  productName: string;
  model: string;
  serialNumber: string;
  warrantyStatus: 'Under Warranty' | 'Under AMC/CMC' | 'Out of Warranty';
  complaintDetails: string;
  priority: 'Critical (ICU/OT)' | 'High' | 'Medium' | 'Low';
  assignedTechnician: string;
  stage: 'Open' | 'Assigned' | 'In Progress' | 'Parts Awaited' | 'Resolved' | 'Closed';
  dateReported: string;
  resolvedDate?: string;
  resolutionNotes?: string;
}

export interface AmcContract {
  id: string;
  contractNumber: string;
  customerName: string;
  productName: string;
  serialNumber: string;
  contractType: 'Comprehensive (CMC)' | 'Non-Comprehensive (AMC)';
  startDate: string;
  endDate: string;
  contractValue: number;
  preventiveMaintenanceVisitsPerYear: number;
  visitsCompleted: number;
  status: 'Active' | 'Expiring Soon' | 'Expired';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'Tender' | 'EMD/PBG' | 'Stock' | 'Service' | 'Payment' | 'Compliance';
  severity: 'info' | 'warning' | 'danger' | 'success';
  timestamp: string;
  read: boolean;
  linkModule?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  module: string;
  details: string;
}

export interface FirebaseConnectionConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
}
