import { Department, ProjectMock } from '../types';

export const MOCK_PROJECTS: ProjectMock[] = [
  {
    code: '6200M157260100',
    name: 'NDT SERVICES',
    client: 'MOODY TECHNICAL SERVICES',
    businessUnit: 'BU AIS',
  },
  {
    code: '32100P206261710',
    name: 'Refinery Expansion & Petrochemical Hub',
    client: 'PETROGAS (BASIN) LTD',
    businessUnit: 'BU OMES',
  },
  {
    code: '0600L002240100',
    name: 'Penyediaan 1 (satu) Set Alat Keruk Untuk Pekerjaan Project Dredging di Wilayah PT Pertamina Hulu Mahakam',
    client: 'LIS INTERNASIONAL',
    businessUnit: 'BU OFS',
  },
  {
    code: '6808P318220200',
    name: 'Jasa-Jasa Penyediaan dan Perawatan Terintegrasi - Sistem Transmisi & Distribusi - PGT',
    client: 'PERTAMINA HULU ROKAN',
    businessUnit: 'BU OMES',
  },
];

export const BUSINESS_UNITS: string[] = [
  'BU AIS',
  'BU OMES',
  'BU OFS',
];

export const DEPARTMENTS: Department[] = [
  'Project Management',
  'Operation',
  'Finance',
  'Procurement',
  'Asset Management & Warehouse',
  'Human Resources',
  'QSHE',
  'Legal Operation',
  'Tender Proposal/Business Development',
];
