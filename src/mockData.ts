import { Asset, Report } from './types';

export const MOCK_ASSETS: Asset[] = [
  {
    id: 'mock-1',
    name: 'MacBook Pro M2',
    code: 'AST-001',
    category: 'Electronic',
    outlet: 'Main Office',
    placement: 'IT Room',
    price: 35000000,
    unit: 'Unit',
    quantity: 1,
    status: 'Normal',
    condition: 'Baru',
    date: '2023-01-01',
    verifier: 'Admin',
    photo: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
    createdAt: new Date().toISOString()
  },
  {
    id: 'mock-2',
    name: 'Ergonomic Chair',
    code: 'FRN-001',
    category: 'Furniture',
    outlet: 'Main Office',
    placement: 'Workspace',
    price: 2500000,
    unit: 'Unit',
    quantity: 10,
    status: 'Normal',
    condition: 'Baru',
    date: '2023-02-01',
    verifier: 'Admin',
    photo: 'https://images.unsplash.com/photo-1592078615290-033ee584e267',
    createdAt: new Date().toISOString()
  },
  {
    id: 'mock-3',
    name: 'Coffee Machine',
    code: 'APP-001',
    category: 'Appliance',
    outlet: 'Cafe 1',
    placement: 'Pantry',
    price: 15000000,
    unit: 'Unit',
    quantity: 1,
    status: 'Emergency',
    condition: 'Bekas',
    date: '2023-03-15',
    verifier: 'Admin',
    photo: 'https://images.unsplash.com/photo-1520970014086-2208007a8fc5',
    createdAt: new Date().toISOString()
  }
];

export const MOCK_REPORTS: Report[] = [
  {
    id: 'rep-1',
    name: 'Coffee Machine',
    code: 'APP-001',
    outlet: 'Cafe 1',
    placement: 'Pantry',
    issue: 'Machine not heating up',
    desc: 'Machine not heating up since morning shift.',
    reporter: 'John Doe',
    priority: 'Critical',
    status: 'pending',
    timestamp: new Date().toISOString(),
    photo: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
    category: 'Appliance'
  }
];

export const MOCK_STATS_SUMMARY = {
  totalAssets: 3,
  totalPrice: 52500000,
  pendingReports: 1,
  resolvedReports: 0,
  totalReports: 1,
  assetStatsByOutlet: [
    { name: 'Main Office', count: 2, totalPrice: 37500000 },
    { name: 'Cafe 1', count: 1, totalPrice: 15000000 }
  ],
  reportStats0: [{ name: 'Damaged', value: 1 }, { name: 'Resolved', value: 0 }],
  reportStats7: [{ name: 'Damaged', value: 1 }, { name: 'Resolved', value: 0 }],
  reportStats15: [{ name: 'Damaged', value: 1 }, { name: 'Resolved', value: 0 }],
  reportStats30: [{ name: 'Damaged', value: 1 }, { name: 'Resolved', value: 0 }],
  lastUpdated: new Date().toISOString()
};
