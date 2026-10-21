/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const fs = require('fs');
const path = require('path');

// State FIPS prefixes
const STATE_INFO = {
  AL: { name: 'Alabama', fips: '01', zipPrefix: '35', zipLen: '35000' },
  AK: { name: 'Alaska', fips: '02', zipPrefix: '99', zipLen: '99500' },
  AZ: { name: 'Arizona', fips: '04', zipPrefix: '85', zipLen: '85000' },
  AR: { name: 'Arkansas', fips: '05', zipPrefix: '72', zipLen: '72000' },
  CA: { name: 'California', fips: '06', zipPrefix: '90', zipLen: '90000' },
  CO: { name: 'Colorado', fips: '08', zipPrefix: '80', zipLen: '80000' },
  CT: { name: 'Connecticut', fips: '09', zipPrefix: '06', zipLen: '06000' },
  DE: { name: 'Delaware', fips: '10', zipPrefix: '19', zipLen: '19700' },
  DC: { name: 'District of Columbia', fips: '11', zipPrefix: '20', zipLen: '20001' },
  FL: { name: 'Florida', fips: '12', zipPrefix: '32', zipLen: '32000' },
  GA: { name: 'Georgia', fips: '13', zipPrefix: '30', zipLen: '30000' },
  HI: { name: 'Hawaii', fips: '15', zipPrefix: '96', zipLen: '96700' },
  ID: { name: 'Idaho', fips: '16', zipPrefix: '83', zipLen: '83200' },
  IL: { name: 'Illinois', fips: '17', zipPrefix: '60', zipLen: '60000' },
  IN: { name: 'Indiana', fips: '18', zipPrefix: '46', zipLen: '46000' },
  IA: { name: 'Iowa', fips: '19', zipPrefix: '50', zipLen: '50000' },
  KS: { name: 'Kansas', fips: '20', zipPrefix: '66', zipLen: '66000' },
  KY: { name: 'Kentucky', fips: '21', zipPrefix: '40', zipLen: '40000' },
  LA: { name: 'Louisiana', fips: '22', zipPrefix: '70', zipLen: '70000' },
  ME: { name: 'Maine', fips: '23', zipPrefix: '04', zipLen: '04000' },
  MD: { name: 'Maryland', fips: '24', zipPrefix: '21', zipLen: '21000' },
  MA: { name: 'Massachusetts', fips: '25', zipPrefix: '01', zipLen: '01000' },
  MI: { name: 'Michigan', fips: '26', zipPrefix: '48', zipLen: '48000' },
  MN: { name: 'Minnesota', fips: '27', zipPrefix: '55', zipLen: '55000' },
  MS: { name: 'Mississippi', fips: '28', zipPrefix: '39', zipLen: '39000' },
  MO: { name: 'Missouri', fips: '29', zipPrefix: '63', zipLen: '63000' },
  MT: { name: 'Montana', fips: '30', zipPrefix: '59', zipLen: '59000' },
  NE: { name: 'Nebraska', fips: '31', zipPrefix: '68', zipLen: '68000' },
  NV: { name: 'Nevada', fips: '32', zipPrefix: '89', zipLen: '89000' },
  NH: { name: 'New Hampshire', fips: '33', zipPrefix: '03', zipLen: '03000' },
  NJ: { name: 'New Jersey', fips: '34', zipPrefix: '07', zipLen: '07000' },
  NM: { name: 'New Mexico', fips: '35', zipPrefix: '87', zipLen: '87000' },
  NY: { name: 'New York', fips: '36', zipPrefix: '10', zipLen: '10000' },
  NC: { name: 'North Carolina', fips: '37', zipPrefix: '27', zipLen: '27000' },
  ND: { name: 'North Dakota', fips: '38', zipPrefix: '58', zipLen: '58000' },
  OH: { name: 'Ohio', fips: '39', zipPrefix: '43', zipLen: '43000' },
  OK: { name: 'Oklahoma', fips: '40', zipPrefix: '73', zipLen: '73000' },
  OR: { name: 'Oregon', fips: '41', zipPrefix: '97', zipLen: '97000' },
  PA: { name: 'Pennsylvania', fips: '42', zipPrefix: '15', zipLen: '15000' },
  RI: { name: 'Rhode Island', fips: '44', zipPrefix: '02', zipLen: '02800' },
  SC: { name: 'South Carolina', fips: '45', zipPrefix: '29', zipLen: '29000' },
  SD: { name: 'South Dakota', fips: '46', zipPrefix: '57', zipLen: '57000' },
  TN: { name: 'Tennessee', fips: '47', zipPrefix: '37', zipLen: '37000' },
  TX: { name: 'Texas', fips: '48', zipPrefix: '75', zipLen: '75000' },
  UT: { name: 'Utah', fips: '49', zipPrefix: '84', zipLen: '84000' },
  VT: { name: 'Vermont', fips: '50', zipPrefix: '05', zipLen: '05000' },
  VA: { name: 'Virginia', fips: '51', zipPrefix: '22', zipLen: '22000' },
  WA: { name: 'Washington', fips: '53', zipPrefix: '98', zipLen: '98000' },
  WV: { name: 'West Virginia', fips: '54', zipPrefix: '25', zipLen: '25000' },
  WI: { name: 'Wisconsin', fips: '55', zipPrefix: '53', zipLen: '53000' },
  WY: { name: 'Wyoming', fips: '56', zipPrefix: '82', zipLen: '82000' }
};

console.log('Total states defined:', Object.keys(STATE_INFO).length);
