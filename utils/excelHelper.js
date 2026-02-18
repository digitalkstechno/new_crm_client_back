const ExcelJS = require('exceljs');
const STAFF = require('../model/staff');
const CLIENTTYPE = require('../model/clientType');
const SOURCEFROM = require('../model/sourceFrom');

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
    { header: 'Source Type* (See dropdown)', key: 'sourcebyTypeOfClient', width: 30 },
    { header: 'Source From (See dropdown)', key: 'sourceFrom', width: 30 },
    { header: 'Assign By (See dropdown)', key: 'assignBy', width: 30 },
    { header: 'Remark', key: 'remark', width: 30 }
  ];

  // Fetch dropdown data
  const [clientTypes, sourceFroms, allStaff] = await Promise.all([
    CLIENTTYPE.find({ isDeleted: false }).select('name'),
    SOURCEFROM.find({ isDeleted: false }).select('name'),
    STAFF.find({ isDeleted: false }).populate('role').select('fullName email role')
  ]);

  // Filter staff with canAccessAccountMaster permission
  const staffList = allStaff.filter(staff => staff.role?.canAccessAccountMaster === true);

  // Add sample data
  if (clientTypes.length > 0 && staffList.length > 0) {
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
      sourcebyTypeOfClient: clientTypes[0].name,
      sourceFrom: sourceFroms.length > 0 ? sourceFroms[0].name : '',
      assignBy: staffList[0].fullName,
      remark: 'High priority client'
    });
  }

  // Style header
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };

  // Add dropdowns for Source Type (Column K - 11)
  const clientTypeNames = clientTypes.map(ct => ct.name);
  for (let i = 2; i <= 100; i++) {
    sheet.getCell(`K${i}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: [`"${clientTypeNames.join(',')}"`],
      showErrorMessage: true,
      errorTitle: 'Invalid Source Type',
      error: 'Please select from dropdown'
    };
  }

  // Add dropdowns for Source From (Column L - 12)
  const sourceFromNames = sourceFroms.map(sf => sf.name);
  if (sourceFromNames.length > 0) {
    for (let i = 2; i <= 100; i++) {
      sheet.getCell(`L${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${sourceFromNames.join(',')}"`]
      };
    }
  }

  // Add dropdowns for Assign By (Column M - 13)
  const staffNames = staffList.map(s => s.fullName);
  if (staffNames.length > 0) {
    for (let i = 2; i <= 100; i++) {
      sheet.getCell(`M${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${staffNames.join(',')}"`]
      };
    }
  }

  // Add Reference Sheets
  const clientTypeSheet = workbook.addWorksheet('Client Types');
  clientTypeSheet.columns = [
    { header: 'Client Type Name', key: 'name', width: 30 }
  ];
  clientTypes.forEach(ct => clientTypeSheet.addRow({ name: ct.name }));
  clientTypeSheet.getRow(1).font = { bold: true };
  clientTypeSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };

  const sourceFromSheet = workbook.addWorksheet('Source From');
  sourceFromSheet.columns = [
    { header: 'Source From Name', key: 'name', width: 30 }
  ];
  sourceFroms.forEach(sf => sourceFromSheet.addRow({ name: sf.name }));
  sourceFromSheet.getRow(1).font = { bold: true };
  sourceFromSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };

  const staffSheet = workbook.addWorksheet('Staff List');
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
    '2. Use dropdowns for Source Type, Source From, and Assign By fields',
    '3. Source Type, Source From, and Staff names are available in separate sheets for reference',
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

  // Fetch all reference data
  const [clientTypes, sourceFroms, allStaff] = await Promise.all([
    CLIENTTYPE.find({ isDeleted: false }).select('_id name'),
    SOURCEFROM.find({ isDeleted: false }).select('_id name'),
    STAFF.find({ isDeleted: false }).populate('role').select('_id fullName role')
  ]);

  // Filter staff with canAccessAccountMaster permission
  const staffList = allStaff.filter(staff => staff.role?.canAccessAccountMaster === true);

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header

    const sourceTypeName = row.getCell(11).value;
    const sourceFromName = row.getCell(12).value;
    const assignByName = row.getCell(13).value;

    // Find IDs from names
    const clientType = clientTypes.find(ct => ct.name === sourceTypeName);
    const sourceFrom = sourceFroms.find(sf => sf.name === sourceFromName);
    const staff = staffList.find(s => s.fullName === assignByName);

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
      sourcebyTypeOfClient: clientType?._id,
      sourceFrom: sourceFrom?._id,
      assignBy: staff?._id,
      remark: row.getCell(14).value || ''
    };

    // Validation
    if (!rowData.companyName || !rowData.clientName || !rowData.mobile || !rowData.email || !rowData.website) {
      errors.push(`Row ${rowNumber}: Missing required fields`);
      return;
    }

    if (!rowData.sourcebyTypeOfClient) {
      errors.push(`Row ${rowNumber}: Invalid Source Type`);
      return;
    }

    accounts.push(rowData);
  });

  return { accounts, errors };
};
