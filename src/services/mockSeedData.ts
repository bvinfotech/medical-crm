import { 
  Lead, Dealer, Tender, Quotation, EmdPbgRecord, Product, 
  StockMovement, Employee, AttendanceRecord, PayrollRecord,
  QualityInspection, CalibrationCertificate, ComplianceDocument,
  Invoice, DispatchChallan, ServiceTicket, AmcContract, AuditLog
} from '../types/crm';

export const SEED_LEADS: Lead[] = [
  {
    id: 'lead-1',
    leadCode: 'LEAD-2026-081',
    companyName: 'All India Institute of Medical Sciences (AIIMS)',
    contactPerson: 'Dr. R. K. Sharma (Head of Critical Care)',
    phone: '+91 98110 44231',
    email: 'criticalcare@aiims.edu',
    address: 'Ansari Nagar East',
    city: 'New Delhi',
    state: 'Delhi',
    source: 'GeM',
    productInterest: ['B-Vent Pro 5000 ICU Ventilator', 'CardioPulse Multi-Para Patient Monitor MP-12'],
    assignedEmployee: 'Amitabh Sen (Senior Sales Lead)',
    expectedValue: 7800000,
    nextFollowUpDate: '2026-10-22',
    status: 'Negotiation',
    notes: 'Technical committee approved specifications; awaiting final procurement sanction letter.',
    createdAt: '2026-09-12T10:00:00Z',
    updatedAt: '2026-10-14T15:30:00Z'
  },
  {
    id: 'lead-2',
    leadCode: 'LEAD-2026-082',
    companyName: 'Safdarjung Hospital & VMMC',
    contactPerson: 'Er. Sandeep Verma (Biomedical Department)',
    phone: '+91 98712 39011',
    email: 'biomedical.sjh@nic.in',
    address: 'Ring Road, Opposite AIIMS',
    city: 'New Delhi',
    state: 'Delhi',
    source: 'Direct Tender',
    productInterest: ['Syringe Infusion Pump SP-900', 'Biphasic Defibrillator DF-300 with AED'],
    assignedEmployee: 'Pooja Nair (Govt Key Accounts)',
    expectedValue: 4200000,
    nextFollowUpDate: '2026-10-19',
    status: 'Quotation Sent',
    notes: 'Quote sent with 3-year standard warranty + 2 years CMC proposal.',
    createdAt: '2026-09-25T11:20:00Z',
    updatedAt: '2026-10-11T09:40:00Z'
  },
  {
    id: 'lead-3',
    leadCode: 'LEAD-2026-083',
    companyName: 'Apollo Speciality Hospitals',
    contactPerson: 'Dr. Meenakshi Sunderam',
    phone: '+91 94440 18273',
    email: 'procurement.south@apollohospitals.com',
    address: 'Greams Lane',
    city: 'Chennai',
    state: 'Tamil Nadu',
    source: 'Hospital Visit',
    productInterest: ['CardioPulse Multi-Para Patient Monitor MP-12'],
    assignedEmployee: 'Vikas Rao (South Regional Mgr)',
    expectedValue: 3100000,
    nextFollowUpDate: '2026-10-25',
    status: 'Qualified',
    notes: 'Demo arranged in CCU unit next Monday. Highly impressed with neonatal mode.',
    createdAt: '2026-10-01T14:15:00Z',
    updatedAt: '2026-10-12T16:00:00Z'
  },
  {
    id: 'lead-4',
    leadCode: 'LEAD-2026-084',
    companyName: 'Fortis Memorial Research Institute',
    contactPerson: 'Col. (Retd) H. S. Chahal',
    phone: '+91 98101 92834',
    email: 'ops.fmri@fortishealthcare.com',
    address: 'Sector 44',
    city: 'Gurugram',
    state: 'Haryana',
    source: 'Dealer Referral',
    productInterest: ['Smart ICU Bed Electric 5-Function', 'Hospital Medical Grade Oxygen Concentrator 10LPM'],
    assignedEmployee: 'Amitabh Sen (Senior Sales Lead)',
    expectedValue: 5400000,
    nextFollowUpDate: '2026-10-28',
    status: 'Contacted',
    notes: 'Requested brochure and live demo video for hospital board review.',
    createdAt: '2026-10-08T09:30:00Z',
    updatedAt: '2026-10-09T11:00:00Z'
  },
  {
    id: 'lead-5',
    leadCode: 'LEAD-2026-085',
    companyName: 'Government Medical College & Hospital (GMCH)',
    contactPerson: 'Dr. Ashok Bansal (MS)',
    phone: '+91 98140 55129',
    email: 'msoffice@gmch.gov.in',
    address: 'Sector 32',
    city: 'Chandigarh',
    state: 'Punjab & Chandigarh',
    source: 'GeM',
    productInterest: ['B-Vent Pro 5000 ICU Ventilator'],
    assignedEmployee: 'Pooja Nair (Govt Key Accounts)',
    expectedValue: 9200000,
    nextFollowUpDate: '2026-10-20',
    status: 'Won',
    notes: 'GeM direct contract sanction issued. Converted to Order #SO-2026-104.',
    createdAt: '2026-08-15T08:00:00Z',
    updatedAt: '2026-10-05T14:30:00Z'
  }
];

export const SEED_DEALERS: Dealer[] = [
  {
    id: 'dealer-1',
    dealerCode: 'DLR-ND-001',
    companyName: 'Apex Medicare Solutions Pvt Ltd',
    contactPerson: 'Sunil Manchanda',
    phone: '+91 98112 00451',
    email: 'sunil@apexmedicare.in',
    territory: 'Delhi NCR & Western UP',
    gstin: '07AAACA2345N1Z5',
    address: '302 Vikas Surya Tower, Rohini Sec 9, New Delhi',
    products: ['Ventilators', 'Patient Monitors', 'Infusion Pumps'],
    creditLimit: 5000000,
    outstandingBalance: 1240000,
    status: 'Active',
    createdAt: '2024-03-15T10:00:00Z'
  },
  {
    id: 'dealer-2',
    dealerCode: 'DLR-MH-002',
    companyName: 'Sahyadri Meditech Distributorship',
    contactPerson: 'Prashant Patil',
    phone: '+91 98220 89120',
    email: 'prashant@sahyadrimedi.com',
    territory: 'Maharashtra & Goa',
    gstin: '27AABCS6789P1ZM',
    address: 'Plot 44, Hadapsar Industrial Estate, Pune',
    products: ['Defibrillators', 'ICU Beds', 'Ventilators'],
    creditLimit: 7500000,
    outstandingBalance: 3150000,
    status: 'Active',
    createdAt: '2024-05-10T11:00:00Z'
  },
  {
    id: 'dealer-3',
    dealerCode: 'DLR-KA-003',
    companyName: 'Deccan Hospital Systems',
    contactPerson: 'K. Venkatesh',
    phone: '+91 98450 77123',
    email: 'kvenkat@deccanhospital.co.in',
    territory: 'Karnataka & Kerala',
    gstin: '29AABCD1122K1Z9',
    address: '14/2 Cunningham Road, Vasanth Nagar, Bengaluru',
    products: ['Patient Monitors', 'Infusion Pumps', 'Sterilizers'],
    creditLimit: 4000000,
    outstandingBalance: 450000,
    status: 'Active',
    createdAt: '2024-07-22T09:30:00Z'
  },
  {
    id: 'dealer-4',
    dealerCode: 'DLR-WB-004',
    companyName: 'Purba Health Equipments',
    contactPerson: 'Subrata Mukherjee',
    phone: '+91 98300 23411',
    email: 'purba.health@rediffmail.com',
    territory: 'West Bengal & North East',
    gstin: '19AAECP8877L1Z2',
    address: '88 Chittaranjan Avenue, Bowbazar, Kolkata',
    products: ['All Equipment'],
    creditLimit: 2500000,
    outstandingBalance: 0,
    status: 'Inactive',
    createdAt: '2024-09-01T12:00:00Z'
  }
];

export const SEED_TENDERS: Tender[] = [
  {
    id: 'tender-1',
    tenderNumber: 'GEM/2026/B/8940122',
    tenderTitle: 'Supply, Installation & Commissioning of 40 Units High-End ICU Ventilators for COVID/Swine Flu Wards',
    governmentDepartment: 'All India Institute of Medical Sciences (AIIMS) New Delhi',
    buyerName: 'Senior Stores Officer (Hospital Store), AIIMS',
    portalName: 'GeM',
    gemReference: 'GEM-2026-ICU-VENT-40',
    publicationDate: '2026-09-28',
    submissionDeadline: '2026-10-24T15:00',
    estimatedValue: 24000000,
    emdAmount: 480000,
    tenderFee: 0,
    technicalBidStatus: 'Compliant',
    financialBidStatus: 'Pending',
    l1Status: 'Awaited',
    awardStatus: 'Awaited',
    assignedEmployee: 'Rahul Kapoor (Tender Lead)',
    stage: 'Bid Submitted',
    documents: [
      { id: 'doc-1', title: 'GeM Bid Document copy', category: 'Compliance Matrix', fileName: 'GeM_Bid_8940122.pdf', status: 'Verified', uploadedAt: '2026-09-30' },
      { id: 'doc-2', title: 'Technical Compliance Sheet & Datasheet', category: 'Technical Bid', fileName: 'B-Vent_Pro_Tech_Compliance.pdf', status: 'Verified', uploadedAt: '2026-10-02' },
      { id: 'doc-3', title: 'Bank Guarantee for EMD (SBI)', category: 'EMD Receipt', fileName: 'EMD_BG_SBI_4.8L.pdf', status: 'Verified', uploadedAt: '2026-10-04' }
    ],
    notes: 'Pre-bid meeting completed. Clarification on humidifiers incorporated in Addendum 1.',
    createdAt: '2026-09-29T10:00:00Z',
    updatedAt: '2026-10-15T12:00:00Z'
  },
  {
    id: 'tender-2',
    tenderNumber: 'CPPP/2026/DGHS/7721',
    tenderTitle: 'Procurement of 120 Multi-Para Patient Monitors with Central Nursing Station software for State Medical Colleges',
    governmentDepartment: 'Directorate General of Health Services (DGHS), MoHFW',
    buyerName: 'Director General of Health Services',
    portalName: 'CPPP',
    gemReference: 'CPP-DGHS-2026-MPM',
    publicationDate: '2026-10-02',
    submissionDeadline: '2026-10-20T17:00',
    estimatedValue: 18500000,
    emdAmount: 370000,
    tenderFee: 5000,
    technicalBidStatus: 'Pending',
    financialBidStatus: 'Pending',
    l1Status: 'Awaited',
    awardStatus: 'Awaited',
    assignedEmployee: 'Rahul Kapoor (Tender Lead)',
    stage: 'Documents Pending',
    documents: [
      { id: 'doc-4', title: 'Tender NIT document', category: 'Other', fileName: 'NIT_DGHS_7721.pdf', status: 'Verified', uploadedAt: '2026-10-03' },
      { id: 'doc-5', title: 'EMD Demand Draft from HDFC', category: 'EMD Receipt', fileName: 'DD_Receipt_3.7L.pdf', status: 'Pending' }
    ],
    notes: 'Need CA net worth certificate and past performance proof for previous 3 financial years.',
    createdAt: '2026-10-03T11:00:00Z',
    updatedAt: '2026-10-14T09:00:00Z'
  },
  {
    id: 'tender-3',
    tenderNumber: 'GEM/2026/B/7611094',
    tenderTitle: 'Procurement of 25 Units Biphasic Defibrillators for Emergency & Trauma Centre',
    governmentDepartment: 'Post Graduate Institute of Medical Education and Research (PGIMER) Chandigarh',
    buyerName: 'Stores & Purchase Officer, PGIMER',
    portalName: 'GeM',
    gemReference: 'GEM-2026-DEFIB-25',
    publicationDate: '2026-08-20',
    submissionDeadline: '2026-09-15T14:00',
    estimatedValue: 6250000,
    emdAmount: 125000,
    tenderFee: 0,
    technicalBidStatus: 'Compliant',
    financialBidStatus: 'Opened',
    l1Status: 'Yes',
    awardStatus: 'Won',
    purchaseOrderNumber: 'PO-PGIMER-2026-982',
    assignedEmployee: 'Pooja Nair (Govt Key Accounts)',
    stage: 'Awarded',
    documents: [
      { id: 'doc-6', title: 'GeM Contract Agreement', category: 'Financial Bid', fileName: 'GeM_Contract_Order_982.pdf', status: 'Verified', uploadedAt: '2026-09-22' },
      { id: 'doc-7', title: 'PBG Submission Receipt (3% value)', category: 'Other', fileName: 'PBG_PGIMER_187500.pdf', status: 'Verified', uploadedAt: '2026-09-28' }
    ],
    notes: 'PBG submitted. Initial dispatch of 10 units completed on Oct 10.',
    createdAt: '2026-08-21T09:00:00Z',
    updatedAt: '2026-10-10T16:00:00Z'
  },
  {
    id: 'tender-4',
    tenderNumber: 'MES/MED/2026/102',
    tenderTitle: 'Rate Contract for Syringe Infusion Pumps for Military Hospitals Western Command',
    governmentDepartment: 'Military Engineer Services / AFMS',
    buyerName: 'Senior Executive Officer (Procurement)',
    portalName: 'Defence/MES',
    publicationDate: '2026-10-05',
    submissionDeadline: '2026-11-02T13:00',
    estimatedValue: 4800000,
    emdAmount: 96000,
    tenderFee: 1000,
    technicalBidStatus: 'Pending',
    financialBidStatus: 'Pending',
    l1Status: 'Awaited',
    awardStatus: 'Awaited',
    assignedEmployee: 'Rahul Kapoor (Tender Lead)',
    stage: 'Under Review',
    documents: [],
    notes: 'Security clearance form and Make in India local content declaration required (>50% local content).',
    createdAt: '2026-10-06T14:00:00Z',
    updatedAt: '2026-10-12T10:00:00Z'
  }
];

export const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    productCode: 'MED-VENT-5000',
    name: 'B-Vent Pro 5000 ICU Ventilator',
    category: 'ICU Equipment',
    modelNumber: 'B-VENT-5K',
    hsnCode: '90192000',
    type: 'Finished Equipment',
    warehouse: 'Main Assembly Plant - Manesar (Bay A)',
    quantity: 28,
    unit: 'Units',
    purchaseCost: 310000,
    sellingPrice: 580000,
    minStockLevel: 10,
    currentBatchNumber: 'BATCH-2026-V09',
    cdscoClassification: 'Class C',
    status: 'In Stock',
    lastRestocked: '2026-10-05'
  },
  {
    id: 'prod-2',
    productCode: 'MED-MON-12',
    name: 'CardioPulse Multi-Para Patient Monitor MP-12',
    category: 'Patient Monitoring',
    modelNumber: 'CP-MP12',
    hsnCode: '90181990',
    type: 'Finished Equipment',
    warehouse: 'Main Assembly Plant - Manesar (Bay B)',
    quantity: 45,
    unit: 'Units',
    purchaseCost: 65000,
    sellingPrice: 135000,
    minStockLevel: 15,
    currentBatchNumber: 'BATCH-2026-M14',
    cdscoClassification: 'Class B',
    status: 'In Stock',
    lastRestocked: '2026-10-08'
  },
  {
    id: 'prod-3',
    productCode: 'MED-PUMP-900',
    name: 'Syringe Infusion Pump SP-900',
    category: 'ICU Equipment',
    modelNumber: 'SP-900-DUO',
    hsnCode: '90189099',
    type: 'Finished Equipment',
    warehouse: 'Gurugram Finished Goods Depot',
    quantity: 6,
    unit: 'Units',
    purchaseCost: 22000,
    sellingPrice: 48000,
    minStockLevel: 12,
    currentBatchNumber: 'BATCH-2026-P03',
    cdscoClassification: 'Class B',
    status: 'Low Stock',
    lastRestocked: '2026-09-18'
  },
  {
    id: 'prod-4',
    productCode: 'MED-DEFIB-300',
    name: 'Biphasic Defibrillator DF-300 with AED',
    category: 'Operation Theatre',
    modelNumber: 'DF-300-PRO',
    hsnCode: '90189099',
    type: 'Finished Equipment',
    warehouse: 'Gurugram Finished Goods Depot',
    quantity: 14,
    unit: 'Units',
    purchaseCost: 110000,
    sellingPrice: 245000,
    minStockLevel: 8,
    currentBatchNumber: 'BATCH-2026-D07',
    cdscoClassification: 'Class C',
    status: 'In Stock',
    lastRestocked: '2026-09-29'
  },
  {
    id: 'prod-5',
    productCode: 'MED-OXY-10L',
    name: 'Hospital Medical Grade Oxygen Concentrator 10LPM',
    category: 'Respiratory Care',
    modelNumber: 'OXY-FLOW-10',
    hsnCode: '90192000',
    type: 'Finished Equipment',
    warehouse: 'Main Assembly Plant - Manesar (Bay C)',
    quantity: 3,
    unit: 'Units',
    purchaseCost: 45000,
    sellingPrice: 85000,
    minStockLevel: 8,
    currentBatchNumber: 'BATCH-2026-O02',
    cdscoClassification: 'Class B',
    status: 'Low Stock',
    lastRestocked: '2026-09-12'
  },
  {
    id: 'prod-6',
    productCode: 'RAW-O2-SENS',
    name: 'Galvanic Oxygen Fuel Cell Sensor (Medical Grade)',
    category: 'Raw Material',
    modelNumber: 'O2-CELL-M01',
    hsnCode: '90279090',
    type: 'Raw Material',
    warehouse: 'Raw Material Stores, Manesar',
    quantity: 120,
    unit: 'Pieces',
    purchaseCost: 7500,
    sellingPrice: 12000,
    minStockLevel: 30,
    expiryDate: '2027-08-31',
    status: 'In Stock',
    lastRestocked: '2026-10-02'
  }
];

export const SEED_STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: 'sm-1',
    productId: 'prod-1',
    productCode: 'MED-VENT-5000',
    productName: 'B-Vent Pro 5000 ICU Ventilator',
    type: 'Inward (GRN)',
    quantity: 12,
    unit: 'Units',
    batchNumber: 'BATCH-2026-V09',
    serialNumbers: ['BV5K-26101', 'BV5K-26102', 'BV5K-26103', 'BV5K-26104'],
    fromLocation: 'Final Assembly & Calibration Line',
    toLocation: 'Main Assembly Plant - Manesar (Bay A)',
    referenceNumber: 'GRN-2026-1402',
    performedBy: 'Dinesh Kumar (Inventory Mgr)',
    date: '2026-10-05T14:00:00Z',
    reason: 'QC pass received on 12 production units'
  },
  {
    id: 'sm-2',
    productId: 'prod-4',
    productCode: 'MED-DEFIB-300',
    productName: 'Biphasic Defibrillator DF-300 with AED',
    type: 'Outward (Dispatch)',
    quantity: 10,
    unit: 'Units',
    batchNumber: 'BATCH-2026-D07',
    serialNumbers: ['DF300-8801', 'DF300-8802', 'DF300-8803'],
    fromLocation: 'Gurugram Finished Goods Depot',
    toLocation: 'PGIMER Chandigarh, Emergency Ward',
    referenceNumber: 'DC-2026-781',
    performedBy: 'Dinesh Kumar (Inventory Mgr)',
    date: '2026-10-10T11:30:00Z',
    reason: 'Dispatch against PGIMER GeM Contract PO-PGIMER-2026-982'
  }
];

export const SEED_EMD_PBG: EmdPbgRecord[] = [
  {
    id: 'emd-1',
    category: 'EMD',
    tenderReference: 'GEM/2026/B/8940122',
    tenderTitle: 'AIIMS 40 Units High-End ICU Ventilators',
    beneficiary: 'Director, All India Institute of Medical Sciences, New Delhi',
    instrumentType: 'Bank Guarantee',
    amount: 480000,
    bankName: 'State Bank of India',
    branch: 'CAG Branch, New Delhi',
    instrumentNumber: 'BG-SBI-2026-99018',
    issueDate: '2026-10-02',
    expiryDate: '2026-12-31',
    claimExpiryDate: '2027-01-31',
    status: 'Active',
    remarks: 'Valid for 90 days from tender submission deadline',
    createdAt: '2026-10-02T10:00:00Z'
  },
  {
    id: 'emd-2',
    category: 'EMD',
    tenderReference: 'CPPP/2026/DGHS/7721',
    tenderTitle: 'DGHS 120 Multi-Para Patient Monitors',
    beneficiary: 'Pay & Accounts Officer, DGHS, Nirman Bhawan',
    instrumentType: 'Demand Draft',
    amount: 370000,
    bankName: 'HDFC Bank Ltd',
    branch: 'Connaught Place, New Delhi',
    instrumentNumber: 'DD-089452',
    issueDate: '2026-10-10',
    expiryDate: '2027-01-10',
    status: 'Active',
    remarks: 'Original DD handed over in physical tender drop box',
    createdAt: '2026-10-10T11:00:00Z'
  },
  {
    id: 'emd-3',
    category: 'EMD',
    tenderReference: 'GEM/2026/B/5512099',
    tenderTitle: 'Safdarjung Hospital Emergency Beds',
    beneficiary: 'Medical Superintendent, Safdarjung Hospital',
    instrumentType: 'Fixed Deposit Receipt',
    amount: 220000,
    bankName: 'Punjab National Bank',
    branch: 'Green Park, New Delhi',
    instrumentNumber: 'FDR-PNB-667102',
    issueDate: '2026-06-15',
    expiryDate: '2026-10-15',
    refundRequestedDate: '2026-09-20',
    status: 'Expiring Soon',
    remarks: 'Tender awarded to competitor; formal refund application submitted on Sept 20. Follow-up urgent.',
    createdAt: '2026-06-15T10:00:00Z'
  },
  {
    id: 'pbg-1',
    category: 'PBG',
    tenderReference: 'GEM/2026/B/7611094',
    tenderTitle: 'PGIMER Chandigarh 25 Defibrillators',
    beneficiary: 'Director, PGIMER Chandigarh',
    instrumentType: 'GeM e-PBG',
    amount: 187500, // 3% of 62.5L
    bankName: 'State Bank of India',
    branch: 'CAG Branch, New Delhi',
    instrumentNumber: 'ePBG-SBI-GEM-2026-44',
    issueDate: '2026-09-25',
    expiryDate: '2029-09-25', // 3 year warranty period
    claimExpiryDate: '2029-11-25',
    status: 'Active',
    remarks: 'Covers 3-year comprehensive warranty obligation for PGIMER',
    createdAt: '2026-09-25T14:00:00Z'
  }
];

export const SEED_QUOTATIONS: Quotation[] = [
  {
    id: 'quote-1',
    quotationNumber: 'BMT-QT-2026-092',
    revision: 1,
    date: '2026-10-10',
    validUntil: '2026-11-09',
    clientType: 'Hospital',
    clientName: 'Safdarjung Hospital & VMMC',
    contactPerson: 'Er. Sandeep Verma (Biomedical Engg)',
    clientGstin: '07AAACS1122N1ZU',
    billingAddress: 'Biomedical Department, New Emergency Block, Safdarjung Hospital, New Delhi - 110029',
    shippingAddress: 'Central Stores, Safdarjung Hospital, New Delhi - 110029',
    items: [
      {
        id: 'qi-1',
        productId: 'prod-3',
        productName: 'Syringe Infusion Pump SP-900',
        model: 'SP-900-DUO',
        hsnCode: '90189099',
        quantity: 20,
        unitPrice: 42000,
        gstRate: 12,
        discountPercent: 5,
        lineTotal: 798000
      },
      {
        id: 'qi-2',
        productId: 'prod-4',
        productName: 'Biphasic Defibrillator DF-300 with AED',
        model: 'DF-300-PRO',
        hsnCode: '90189099',
        quantity: 6,
        unitPrice: 220000,
        gstRate: 12,
        discountPercent: 8,
        lineTotal: 1214400
      }
    ],
    subtotal: 2012400,
    totalDiscount: 147600,
    totalTax: 241488,
    grandTotal: 2253888,
    status: 'Sent',
    termsAndConditions: '1. Prices are FOR Destination including transit insurance.\n2. Delivery within 4-6 weeks from official PO.\n3. Warranty: 36 months comprehensive from date of commissioning.\n4. Payment: 90% on delivery & inspection, 10% on PBG submission.\n5. Jurisdiction: Courts of Delhi only.',
    preparedBy: 'Amitabh Sen',
    createdAt: '2026-10-10T12:00:00Z',
    updatedAt: '2026-10-10T14:30:00Z'
  }
];

export const SEED_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    employeeId: 'BMT-EMP-001',
    name: 'Vikramaditya Roy',
    designation: 'Managing Director & CEO',
    department: 'Sales & Tenders',
    email: 'vikram.roy@bharatmedtech.in',
    phone: '+91 98100 11223',
    dateOfJoining: '2018-01-10',
    status: 'Active',
    salary: { basic: 180000, hra: 72000, medicalAllowance: 15000, conveyance: 8000, pfDeduction: 21600, esiDeduction: 0, tds: 42000 }
  },
  {
    id: 'emp-2',
    employeeId: 'BMT-EMP-014',
    name: 'Rahul Kapoor',
    designation: 'Tender & GeM Bid Manager',
    department: 'Sales & Tenders',
    email: 'rahul.k@bharatmedtech.in',
    phone: '+91 98118 77234',
    dateOfJoining: '2021-04-15',
    status: 'Active',
    salary: { basic: 65000, hra: 26000, medicalAllowance: 5000, conveyance: 4000, pfDeduction: 7800, esiDeduction: 0, tds: 8500 }
  },
  {
    id: 'emp-3',
    employeeId: 'BMT-EMP-022',
    name: 'Dinesh Kumar',
    designation: 'Warehouse & Inventory Manager',
    department: 'Warehouse',
    email: 'dinesh.k@bharatmedtech.in',
    phone: '+91 98711 66543',
    dateOfJoining: '2022-02-01',
    status: 'Active',
    salary: { basic: 45000, hra: 18000, medicalAllowance: 3500, conveyance: 3000, pfDeduction: 5400, esiDeduction: 0, tds: 3800 }
  },
  {
    id: 'emp-4',
    employeeId: 'BMT-EMP-029',
    name: 'Dr. Neha Swaminathan',
    designation: 'Head of Quality & Regulatory Affairs',
    department: 'Quality Control',
    email: 'neha.s@bharatmedtech.in',
    phone: '+91 99102 33451',
    dateOfJoining: '2020-09-01',
    status: 'Active',
    salary: { basic: 95000, hra: 38000, medicalAllowance: 6000, conveyance: 5000, pfDeduction: 11400, esiDeduction: 0, tds: 16200 }
  },
  {
    id: 'emp-5',
    employeeId: 'BMT-EMP-035',
    name: 'Suresh Chauhan',
    designation: 'Senior Biomedical Service Engineer',
    department: 'Service Engineering',
    email: 'suresh.c@bharatmedtech.in',
    phone: '+91 98991 44882',
    dateOfJoining: '2023-01-15',
    status: 'Active',
    salary: { basic: 38000, hra: 15200, medicalAllowance: 3000, conveyance: 6000, pfDeduction: 4560, esiDeduction: 0, tds: 2100 }
  }
];

export const SEED_ATTENDANCE: AttendanceRecord[] = [
  { id: 'att-1', employeeId: 'BMT-EMP-001', employeeName: 'Vikramaditya Roy', date: '2026-10-15', status: 'Present', checkIn: '09:15', checkOut: '18:30', hoursWorked: 9.25 },
  { id: 'att-2', employeeId: 'BMT-EMP-014', employeeName: 'Rahul Kapoor', date: '2026-10-15', status: 'Present', checkIn: '09:00', checkOut: '18:10', hoursWorked: 9.16 },
  { id: 'att-3', employeeId: 'BMT-EMP-022', employeeName: 'Dinesh Kumar', date: '2026-10-15', status: 'Present', checkIn: '08:45', checkOut: '17:45', hoursWorked: 9.0 },
  { id: 'att-4', employeeId: 'BMT-EMP-029', employeeName: 'Dr. Neha Swaminathan', date: '2026-10-15', status: 'Present', checkIn: '09:30', checkOut: '18:00', hoursWorked: 8.5 },
  { id: 'att-5', employeeId: 'BMT-EMP-035', employeeName: 'Suresh Chauhan', date: '2026-10-15', status: 'On-Duty', checkIn: '08:30', checkOut: '19:00', hoursWorked: 10.5, remarks: 'Hospital on-site installation at PGIMER Chandigarh' }
];

export const SEED_QUALITY_INSPECTIONS: QualityInspection[] = [
  {
    id: 'qc-1',
    reportNumber: 'QC-REP-2026-1014',
    productId: 'prod-1',
    productName: 'B-Vent Pro 5000 ICU Ventilator',
    batchNumber: 'BATCH-2026-V09',
    quantityInspected: 12,
    passedQuantity: 12,
    failedQuantity: 0,
    inspectorName: 'Dr. Neha Swaminathan',
    date: '2026-10-04',
    standardsChecked: ['ISO 13485:2016 Clause 7.5', 'IEC 60601-1-2 EMC testing', 'ISO 80601-2-12 Ventilator Performance'],
    result: 'Accepted',
    notes: 'All 12 units passed 72-hour continuous burn-in and O2 sensor linearity calibration without pressure drift.'
  },
  {
    id: 'qc-2',
    reportNumber: 'QC-REP-2026-1015',
    productId: 'prod-3',
    productName: 'Syringe Infusion Pump SP-900',
    batchNumber: 'BATCH-2026-P03',
    quantityInspected: 25,
    passedQuantity: 23,
    failedQuantity: 2,
    inspectorName: 'Harish Bisht (QC Inspector)',
    date: '2026-10-11',
    standardsChecked: ['IEC 60601-2-24 Infusion Pump Accuracy', 'Battery backup runtime test > 6 hrs'],
    result: 'Rework Required',
    ncrNumber: 'NCR-2026-018',
    notes: '2 units had occlusion sensor trigger latency (>15 sec). Returned to PCB soldering bay for sensor recalibration.'
  }
];

export const SEED_CALIBRATION_CERTS: CalibrationCertificate[] = [
  {
    id: 'cal-1',
    certificateNumber: 'NABL/CAL/2026/8911',
    equipmentName: 'Fluke VT650 Gas Flow Analyzer & Ventilator Tester',
    serialNumber: 'FLK-VT650-449102',
    calibratedBy: 'National Physical Laboratory (NPL) Accredited Cal Lab, Delhi',
    calibrationDate: '2026-03-10',
    expiryDate: '2027-03-09',
    status: 'Valid',
    standardReference: 'ISO/IEC 17025:2017 Master Flow Standard'
  },
  {
    id: 'cal-2',
    certificateNumber: 'NABL/CAL/2026/9204',
    equipmentName: 'Rigel 288+ Electrical Safety Analyzer',
    serialNumber: 'RGL-288P-99214',
    calibratedBy: 'Electronics Regional Test Laboratory (ERTL North)',
    calibrationDate: '2025-11-05',
    expiryDate: '2026-11-04',
    status: 'Expiring Soon',
    standardReference: 'IEC 62353 & IEC 60601-1 Leakage Reference'
  }
];

export const SEED_COMPLIANCE_DOCS: ComplianceDocument[] = [
  {
    id: 'comp-1',
    title: 'CDSCO Medical Device Manufacturing License (Form MD-9)',
    regulatoryBody: 'CDSCO',
    certificateNumber: 'MFG/MD/2022/000492',
    issueDate: '2022-04-01',
    validUntil: '2027-03-31',
    status: 'Active',
    scope: 'Manufacture of Class B & Class C critical care medical devices (Ventilators, Defibrillators, Monitors)'
  },
  {
    id: 'comp-2',
    title: 'ISO 13485:2016 Medical Devices Quality Management System',
    regulatoryBody: 'ISO',
    certificateNumber: 'TUV-MD-13485-2024-88',
    issueDate: '2024-06-10',
    validUntil: '2027-06-09',
    status: 'Active',
    scope: 'Design, Development, Manufacturing, and Servicing of ICU & OT Medical Electronics'
  },
  {
    id: 'comp-3',
    title: 'BIS Certification for Hospital Beds (IS 13450 / IEC 60601-2-52)',
    regulatoryBody: 'BIS',
    certificateNumber: 'CM/L-8821094',
    issueDate: '2025-01-15',
    validUntil: '2027-01-14',
    status: 'Active',
    scope: 'Electric ICU Beds and Critical Care Furniture'
  }
];

export const SEED_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'BMT-INV-2026-108',
    date: '2026-10-10',
    dueDate: '2026-11-10',
    clientName: 'Director, PGIMER Chandigarh',
    clientGstin: '04AAACP0011N1Z1',
    orderReference: 'PO-PGIMER-2026-982',
    tenderReference: 'GEM/2026/B/7611094',
    items: [
      {
        name: 'Biphasic Defibrillator DF-300 with AED (Initial Lot)',
        hsn: '90189099',
        qty: 10,
        rate: 220000,
        gstRate: 12,
        amount: 2200000
      }
    ],
    subtotal: 2200000,
    cgst: 0,
    sgst: 0,
    igst: 264000, // Interstate Haryana to Chandigarh
    totalAmount: 2464000,
    amountPaid: 0,
    balanceDue: 2464000,
    paymentStatus: 'Unpaid',
    dispatchChallanNo: 'DC-2026-781'
  },
  {
    id: 'inv-2',
    invoiceNumber: 'BMT-INV-2026-094',
    date: '2026-09-15',
    dueDate: '2026-10-15',
    clientName: 'Apex Medicare Solutions Pvt Ltd (Dealer)',
    clientGstin: '07AAACA2345N1Z5',
    orderReference: 'SO-DLR-2026-441',
    items: [
      {
        name: 'CardioPulse Multi-Para Patient Monitor MP-12',
        hsn: '90181990',
        qty: 10,
        rate: 110000,
        gstRate: 12,
        amount: 1100000
      }
    ],
    subtotal: 1100000,
    cgst: 0,
    sgst: 0,
    igst: 132000,
    totalAmount: 1232000,
    amountPaid: 500000,
    balanceDue: 732000,
    paymentStatus: 'Partially Paid',
    dispatchChallanNo: 'DC-2026-712'
  }
];

export const SEED_DISPATCH_CHALLANS: DispatchChallan[] = [
  {
    id: 'dc-1',
    challanNumber: 'DC-2026-781',
    invoiceNumber: 'BMT-INV-2026-108',
    date: '2026-10-10',
    consigneeName: 'Stores Officer, PGIMER Chandigarh',
    shippingAddress: 'Emergency & Trauma Block, PGIMER, Sector 12, Chandigarh - 160012',
    vehicleNumber: 'HR-55-AN-8921',
    transporterName: 'Safexpress Medical Logistics',
    lrNumber: 'SFX-9018241',
    packagesCount: 10,
    itemsSummary: '10 Nos. Biphasic Defibrillators DF-300 with accessories',
    status: 'In Transit'
  }
];

export const SEED_SERVICE_TICKETS: ServiceTicket[] = [
  {
    id: 'srv-1',
    ticketNumber: 'TKT-2026-0419',
    customerName: 'AIIMS New Delhi',
    hospitalName: 'AIIMS - New Private Ward ICU',
    contactPhone: '+91 98110 44231',
    city: 'New Delhi',
    productName: 'B-Vent Pro 5000 ICU Ventilator',
    model: 'B-VENT-5K',
    serialNumber: 'BV5K-25088',
    warrantyStatus: 'Under Warranty',
    complaintDetails: 'Expiratory valve flow sensor warning E-04 blinking intermittently during pressure control mode.',
    priority: 'Critical (ICU/OT)',
    assignedTechnician: 'Suresh Chauhan (Sr. Engineer)',
    stage: 'In Progress',
    dateReported: '2026-10-15T08:30:00Z',
    resolutionNotes: 'Technician dispatched with replacement autoclavable flow sensor membrane kit.'
  },
  {
    id: 'srv-2',
    ticketNumber: 'TKT-2026-0412',
    customerName: 'Max Super Speciality Hospital Saket',
    hospitalName: 'Max Healthcare',
    contactPhone: '+91 98188 55421',
    city: 'New Delhi',
    productName: 'CardioPulse Multi-Para Patient Monitor MP-12',
    model: 'CP-MP12',
    serialNumber: 'CP12-24119',
    warrantyStatus: 'Under AMC/CMC',
    complaintDetails: 'SpO2 probe cable loose connection causing erratic reading.',
    priority: 'Medium',
    assignedTechnician: 'Suresh Chauhan (Sr. Engineer)',
    stage: 'Resolved',
    dateReported: '2026-10-12T10:00:00Z',
    resolvedDate: '2026-10-13T16:00:00Z',
    resolutionNotes: 'Replaced reusable SpO2 silicone finger probe (Model SP-PROBE-02). Calibration verified against simulator.'
  }
];

export const SEED_AMC_CONTRACTS: AmcContract[] = [
  {
    id: 'amc-1',
    contractNumber: 'AMC-2026-033',
    customerName: 'Max Super Speciality Hospital Saket',
    productName: 'CardioPulse Multi-Para Patient Monitor MP-12',
    serialNumber: 'CP12-24119',
    contractType: 'Comprehensive (CMC)',
    startDate: '2025-11-01',
    endDate: '2026-10-31',
    contractValue: 48000,
    preventiveMaintenanceVisitsPerYear: 4,
    visitsCompleted: 3,
    status: 'Expiring Soon'
  },
  {
    id: 'amc-2',
    contractNumber: 'AMC-2026-019',
    customerName: 'Metro Hospitals Heart Institute',
    productName: 'B-Vent Pro 5000 ICU Ventilator',
    serialNumber: 'BV5K-24012',
    contractType: 'Comprehensive (CMC)',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    contractValue: 120000,
    preventiveMaintenanceVisitsPerYear: 4,
    visitsCompleted: 3,
    status: 'Active'
  }
];

export const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-10-16T08:15:00Z',
    user: 'Rahul Kapoor',
    role: 'Tender Manager',
    action: 'Document Upload',
    module: 'Tenders',
    details: 'Uploaded SBI EMD Bank Guarantee for AIIMS GeM Bid #GEM/2026/B/8940122'
  },
  {
    id: 'log-2',
    timestamp: '2026-10-15T14:20:00Z',
    user: 'Dinesh Kumar',
    role: 'Inventory Manager',
    action: 'Stock Outward',
    module: 'Inventory',
    details: 'Dispatched 10 Defibrillators DF-300 under Challan DC-2026-781'
  },
  {
    id: 'log-3',
    timestamp: '2026-10-15T09:30:00Z',
    user: 'Dr. Neha Swaminathan',
    role: 'Quality Control',
    action: 'QC Inspection Report',
    module: 'Quality',
    details: 'Approved 12 B-Vent 5000 units (Batch BATCH-2026-V09)'
  }
];
