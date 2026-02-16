const ExcelJS = require('exceljs');
const STAFF = require('../model/staff');

exports.generateSampleExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Account Master');
  
  // Headers
  sheet.columns = [
    { header: 'Company Name*', key: 'companyName', width: 25 },
    { header: 'Client Name*', key: 'clientName', width: 20 },
    { header: 'Address Line 1', key: 'line1', width: 30 },
    { header: 'Address Line 2', key: 'line2', width: 30 },
    { header: 'City', key: 'cityName', width: 15 },
    { header: 'State', key: 'stateName', width: 15 },
    { header: 'Country', key: 'countryName', width: 15 },
    { header: 'Mobile*', key: 'mobile', width: 15 },
    { header: 'Email*', key: 'email', width: 25 },
    { header: 'Website*', key: 'website', width: 25 },
    { header: 'Source Type*', key: 'sourcebyTypeOfClient', width: 20 },
    { header: 'Source From', key: 'sourceFrom', width: 20 },
    { header: 'Assign By (Staff Email)', key: 'assignByEmail', width: 25 },
    { header: 'Remark', key: 'remark', width: 30 }
  ];

  // Sample data
  sheet.addRow({
    companyName: 'ABC Corporation',
    clientName: 'Rajesh Kumar',
    line1: '123 MG Road',
    line2: 'Sector 5',
    cityName: 'Mumbai',
    stateName: 'Maharashtra',
    countryName: 'India',
    mobile: '9876543210',
    email: 'contact@abc.com',
    website: 'www.abc.com',
    sourcebyTypeOfClient: 'B to B Vendor',
    sourceFrom: 'Website',
    assignByEmail: 'admin@company.com',
    remark: 'High priority client'
  });

  sheet.addRow({
    companyName: 'XYZ Industries',
    clientName: 'Priya Sharma',
    line1: '456 Park Street',
    line2: 'Block A',
    cityName: 'Delhi',
    stateName: 'Delhi',
    countryName: 'India',
    mobile: '9876543211',
    email: 'info@xyz.com',
    website: 'www.xyz.com',
    sourcebyTypeOfClient: 'Direct Com',
    sourceFrom: 'Referral',
    assignByEmail: '',
    remark: ''
  });

  // Style header
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };

  // Add Staff List Sheet
  const staffSheet = workbook.addWorksheet('Staff List');
  const staffList = await STAFF.find({ isDeleted: false }).populate('role').select('fullName email role');
  
  staffSheet.columns = [
    { header: 'Staff Name', key: 'fullName', width: 25 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Role', key: 'role', width: 20 }
  ];

  staffList.forEach(staff => {
    staffSheet.addRow({
      fullName: staff.fullName,
      email: staff.email,
      role: staff.role?.roleName || 'N/A'
    });
  });

  staffSheet.getRow(1).font = { bold: true };
  staffSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };

  // Add Instructions Sheet
  const instructionSheet = workbook.addWorksheet('Instructions');
  instructionSheet.columns = [{ header: 'Instructions', key: 'instruction', width: 80 }];
  
  const instructions = [
    '1. Fields marked with * are mandatory',
    '2. Source Type must be one of: B to B Vendor, Direct Com, Networking Group, EndUser Retail, O.E.M',
    '3. Use Staff Email from "Staff List" sheet for Assign By field',
    '4. Mobile should be 10 digits',
    '5. Email should be valid format',
    '6. Do not modify header row',
    '7. Delete sample data rows before importing your data'
  ];

  instructions.forEach(inst => instructionSheet.addRow({ instruction: inst }));
  instructionSheet.getRow(1).font = { bold: true, size: 14 };

  return workbook;
};

exports.generateExportExcel = async (accounts) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Account Master');
  
  sheet.columns = [
    { header: 'Company Name', key: 'companyName', width: 25 },
    { header: 'Client Name', key: 'clientName', width: 20 },
    { header: 'Address Line 1', key: 'line1', width: 30 },
    { header: 'Address Line 2', key: 'line2', width: 30 },
    { header: 'City', key: 'cityName', width: 15 },
    { header: 'State', key: 'stateName', width: 15 },
    { header: 'Country', key: 'countryName', width: 15 },
    { header: 'Mobile', key: 'mobile', width: 15 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Website', key: 'website', width: 25 },
    { header: 'Source Type', key: 'sourcebyTypeOfClient', width: 20 },
    { header: 'Source From', key: 'sourceFrom', width: 20 },
    { header: 'Assigned To', key: 'assignBy', width: 25 },
    { header: 'Remark', key: 'remark', width: 30 },
    { header: 'Is Converted', key: 'isConverted', width: 15 },
    { header: 'Created At', key: 'createdAt', width: 20 }
  ];

  accounts.forEach(account => {
    sheet.addRow({
      companyName: account.companyName,
      clientName: account.clientName,
      line1: account.address?.line1 || '',
      line2: account.address?.line2 || '',
      cityName: account.address?.cityName || '',
      stateName: account.address?.stateName || '',
      countryName: account.address?.countryName || '',
      mobile: account.mobile,
      email: account.email,
      website: account.website,
      sourcebyTypeOfClient: account.sourcebyTypeOfClient,
      sourceFrom: account.sourceFrom || '',
      assignBy: account.assignBy?.fullName || '',
      remark: account.remark || '',
      isConverted: account.isConverted ? 'Yes' : 'No',
      createdAt: account.createdAt?.toLocaleDateString() || ''
    });
  });

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };

  return workbook;
};

exports.parseImportExcel = async (buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  
  const sheet = workbook.getWorksheet('Account Master');
  const accounts = [];
  const errors = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header

    const rowData = {
      companyName: row.getCell(1).value,
      clientName: row.getCell(2).value,
      address: {
        line1: row.getCell(3).value || '',
        line2: row.getCell(4).value || '',
        cityName: row.getCell(5).value || '',
        stateName: row.getCell(6).value || '',
        countryName: row.getCell(7).value || ''
      },
      mobile: row.getCell(8).value?.toString(),
      email: row.getCell(9).value,
      website: row.getCell(10).value,
      sourcebyTypeOfClient: row.getCell(11).value,
      sourceFrom: row.getCell(12).value || '',
      assignByEmail: row.getCell(13).value,
      remark: row.getCell(14).value || ''
    };

    // Validation
    if (!rowData.companyName || !rowData.clientName || !rowData.mobile || !rowData.email || !rowData.website || !rowData.sourcebyTypeOfClient) {
      errors.push(`Row ${rowNumber}: Missing required fields`);
      return;
    }

    const validSourceTypes = ['B to B Vendor', 'Direct Com', 'Networking Group', 'EndUser Retail', 'O.E.M'];
    if (!validSourceTypes.includes(rowData.sourcebyTypeOfClient)) {
      errors.push(`Row ${rowNumber}: Invalid Source Type`);
      return;
    }

    accounts.push(rowData);
  });

  return { accounts, errors };
};
