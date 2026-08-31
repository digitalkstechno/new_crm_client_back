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
    { header: 'Mobile', key: 'mobile', width: 15 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Website', key: 'website', width: 25 },
    { header: 'Source Type (See dropdown)', key: 'sourcebyTypeOfClient', width: 30 },
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
  if (clientTypes.length > 0) {
    const endRow = clientTypes.length + 1;
    for (let i = 2; i <= 500; i++) {
      sheet.getCell(`K${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`'Client Types'!$A$2:$A$${endRow}`]
      };
    }
  }

  // Add dropdowns for Source From (Column L - 12)
  if (sourceFroms.length > 0) {
    const endRow = sourceFroms.length + 1;
    for (let i = 2; i <= 500; i++) {
      sheet.getCell(`L${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`'Source From'!$A$2:$A$${endRow}`]
      };
    }
  }

  // Add dropdowns for Assign By (Column M - 13)
  if (staffList.length > 0) {
    const endRow = staffList.length + 1;
    for (let i = 2; i <= 500; i++) {
      sheet.getCell(`M${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`'Staff List'!$A$2:$A$${endRow}`]
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
    '4. Mobile should be 12 digits (91 + 10 digits)',
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
    // { header: 'Is Converted', key: 'isConverted', width: 15 },
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
      sourcebyTypeOfClient: account.sourcebyTypeOfClient?.name || '',
      sourceFrom: account.sourceFrom?.name || '',
      assignBy: account.assignBy?.fullName || '',
      remark: account.remark || '',
      // isConverted: account.isConverted ? 'Yes' : 'No',
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

    // Helper function to extract text from Excel cell values
    const extractText = (cellValue) => {
      if (!cellValue) return '';
      if (typeof cellValue === 'string') return cellValue;
      if (typeof cellValue === 'number') return cellValue.toString();
      if (typeof cellValue === 'object') {
        // Handle nested text.richText structure
        if (cellValue.text && typeof cellValue.text === 'object' && cellValue.text.richText) {
          return cellValue.text.richText.map(function (rt) { return rt.text; }).join('');
        }
        if (cellValue.text && typeof cellValue.text === 'string') return cellValue.text;
        if (cellValue.richText) {
          return cellValue.richText.map(function (rt) { return rt.text; }).join('');
        }
        if (cellValue.hyperlink) return cellValue.hyperlink;
      }
      return String(cellValue);
    };

    const sourceTypeName = extractText(row.getCell(11).value).trim();
    const sourceFromName = extractText(row.getCell(12).value).trim();
    const assignByName = extractText(row.getCell(13).value).trim();

    // Find IDs from names
    const clientType = clientTypes.find(ct => ct.name === sourceTypeName);
    const sourceFrom = sourceFroms.find(sf => sf.name === sourceFromName);
    const staff = staffList.find(s => s.fullName === assignByName);

    // Extract all cell values as text
    let companyName = extractText(row.getCell(1).value);
    let clientName = extractText(row.getCell(2).value);
    let email = extractText(row.getCell(9).value);
    let website = extractText(row.getCell(10).value);

    // Clean email - remove mailto: prefix
    if (email && email.startsWith('mailto:')) {
      email = email.replace('mailto:', '');
    }
    email = email ? String(email).trim() : '';
    website = website ? String(website).trim() : '';

    const rowData = {
      rowNumber: rowNumber,
      companyName: companyName || '',
      clientName: clientName || '',
      address: {
        line1: extractText(row.getCell(3).value) || '',
        line2: extractText(row.getCell(4).value) || '',
        cityName: extractText(row.getCell(5).value) || '',
        stateName: extractText(row.getCell(6).value) || '',
        countryName: extractText(row.getCell(7).value) || ''
      },
      mobile: extractText(row.getCell(8).value) || '',
      email: email || '',
      website: website || '',
      sourcebyTypeOfClient: clientType?._id || null,
      sourceFrom: sourceFrom?._id || null,
      assignBy: staff?._id || null,
      remark: extractText(row.getCell(14).value) || ''
    };

    // Validation - only company and client name required
    if (!rowData.companyName || !rowData.clientName) {
      errors.push(`Row ${rowNumber}: Company Name and Client Name are required`);
      return;
    }

    accounts.push(rowData);
  });

  return { accounts, errors };
};

exports.generateExportExcelPublicLeads = async (leads, baseUrl) => {
  const fs = require('fs');
  const path = require('path');
  const sharp = require('sharp');

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Public Leads');

  sheet.columns = [
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Company Name', key: 'companyName', width: 25 },
    { header: 'Client Type', key: 'typeofclient', width: 20 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'WhatsApp Number', key: 'whatsappNumber', width: 20 },
    { header: 'Notes', key: 'notes', width: 30 },
    { header: 'Created At', key: 'createdAt', width: 20 },
    { header: 'Documents (Click to view)', key: 'documents', width: 30 },
    { header: 'Image Preview', key: 'imagePreview', width: 20 }
  ];

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };
  sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(1).height = 25;

  let currentRow = 2;

  for (const lead of leads) {
    const docLinks = [];
    let hasImage = false;
    let imageFilename = null;

    if (lead.attachments && lead.attachments.length > 0) {
      lead.attachments.forEach((file, index) => {
        const fileUrl = `${baseUrl}/api/uploads/publicLeads/${file}`;
        docLinks.push({ text: `Doc ${index + 1}`, hyperlink: fileUrl });

        // Check if this is an image for preview
        const isImage = file.match(/\.(jpeg|jpg|png|gif)$/i);
        if (isImage && !hasImage) {
          hasImage = true;
          imageFilename = file;
        }
      });
    }

    const rowData = {
      name: lead.name || '',
      companyName: lead.companyName || '',
      typeofclient: lead.typeofclient ? lead.typeofclient.name : '',
      email: lead.email || '',
      whatsappNumber: lead.whatsappNumber || '',
      notes: lead.notes || '',
      createdAt: lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '',
      documents: docLinks.length > 0 ? docLinks.map(l => l.text).join('\n') : '-'
    };

    const row = sheet.addRow(rowData);
    row.height = 65; // Set row height to accommodate image preview nicely
    row.alignment = { vertical: 'middle', horizontal: 'left' };

    // Make the documents cell clickable with hyperlink
    if (docLinks.length === 1) {
      const cell = sheet.getCell(`H${currentRow}`);
      cell.value = {
        text: docLinks[0].text,
        hyperlink: docLinks[0].hyperlink
      };
      cell.font = { color: { argb: 'FF0000FF' }, underline: true };
    } else if (docLinks.length > 1) {
      const cell = sheet.getCell(`H${currentRow}`);
      cell.value = {
        text: `View Attachments (${docLinks.length})`,
        hyperlink: docLinks[0].hyperlink
      };
      cell.font = { color: { argb: 'FF0000FF' }, underline: true };
    }

    // Embed the actual image inside the cell if it is an image
    if (hasImage && imageFilename) {
      const localFilePath = path.join(__dirname, '..', 'public', 'uploads', 'publicLeads', imageFilename);
      if (fs.existsSync(localFilePath)) {
        try {
          const extension = imageFilename.split('.').pop().toLowerCase();
          const extMapped = extension === 'jpg' ? 'jpeg' : extension;

          if (['png', 'jpeg', 'gif', 'webp'].includes(extMapped)) {
            const compressedBuffer = await sharp(localFilePath)
              .resize(200, 200, { fit: 'inside' })
              .jpeg({ quality: 60 })
              .toBuffer();

            const imageId = workbook.addImage({
              buffer: compressedBuffer,
              extension: 'jpeg',
            });

            sheet.addImage(imageId, {
              tl: { col: 8, row: currentRow - 1 },
              br: { col: 9, row: currentRow },
              editAs: 'twoCell'
            });

            sheet.getCell(`I${currentRow}`).value = '';
          }
        } catch (imgError) {
          console.error("Error adding image to excel row:", imgError);
          sheet.getCell(`I${currentRow}`).value = 'Image Error';
        }
      } else {
        sheet.getCell(`I${currentRow}`).value = 'File Missing';
      }
    } else {
      sheet.getCell(`I${currentRow}`).value = '-';
    }

    currentRow++;
  }

  return workbook;
};
