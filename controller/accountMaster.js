const ACCOUNTMASTER = require("../model/accountMaster");
const STAFF = require("../model/staff");
const { generateSampleExcel, generateExportExcel, parseImportExcel } = require("../utils/excelHelper");

exports.createAccountMaster = async (req, res) => {
  try {
    const {
      companyName,
      clientName,
      address,
      mobile,
      email,
      website,
      sourcebyTypeOfClient,
      sourceFrom,
      assignBy,
      remark,
    } = req.body;

    const verify = await ACCOUNTMASTER.findOne({
      $and: [
        { $or: [{ email }, { mobile }] },
        { $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] },
      ],
    });

    if (verify) throw new Error("Account already exists with this email or mobile");

    const account = await ACCOUNTMASTER.create({
      companyName,
      clientName,
      address,
      mobile,
      email,
      website,
      sourcebyTypeOfClient,
      sourceFrom,
      assignBy,
      remark,
    });

    const populatedAccount = await ACCOUNTMASTER.findById(account._id)
      .populate("assignBy")
      .populate("sourcebyTypeOfClient")
      .populate("sourceFrom");

    return res.status(201).json({
      status: "Success",
      message: "Account Master created successfully",
      data: populatedAccount,
    });
  } catch (error) {
    return res.status(400).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.fetchAllAccountMaster = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search || "";
    const noLeadsOnly = req.query.noLeadsOnly === "true";

    const query = {
      $and: [
        { $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] },
        {
          $or: [
            { companyName: { $regex: search, $options: "i" } },
            { clientName: { $regex: search, $options: "i" } },
            { mobile: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { website: { $regex: search, $options: "i" } },
          ],
        },
      ],
    };

    // Filter by assignBy if view_own
    if (req.accountMasterViewType === 'view_own') {
      query.$and.push({ assignBy: req.user._id });
    }

    const totalRecords = await ACCOUNTMASTER.countDocuments(query);

    const accounts = await ACCOUNTMASTER.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate("assignBy")
      .populate("sourcebyTypeOfClient")
      .populate("sourceFrom");

    const LEAD = require("../model/lead");
    const accountsWithLeadCount = await Promise.all(
      accounts.map(async (account) => {
        const leadCount = await LEAD.countDocuments({ accountMaster: account._id });
        return {
          ...account.toObject(),
          leadCount,
        };
      })
    );

    let filteredAccounts = accountsWithLeadCount;
    if (noLeadsOnly) {
      filteredAccounts = accountsWithLeadCount.filter(acc => acc.leadCount === 0);
    }

    return res.status(200).json({
      status: "Success",
      message: "Account Master data fetched successfully",
      pagination: {
        totalRecords,
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit),
        limit,
      },
      data: filteredAccounts,
    });
  } catch (error) {
    return res.status(500).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.fetchAccountMasterById = async (req, res) => {
  try {
    const id = req.params.id;

    const account = await ACCOUNTMASTER.findById(id)
      .populate("assignBy")
      .populate("sourcebyTypeOfClient")
      .populate("sourceFrom");

    if (!account) throw new Error("Account Master not found");

    return res.status(200).json({
      status: "Success",
      message: "Account Master fetched successfully",
      data: account,
    });
  } catch (error) {
    return res.status(404).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.updateAccountMaster = async (req, res) => {
  try {
    const id = req.params.id;

    const oldAccount = await ACCOUNTMASTER.findById(id);
    if (!oldAccount) throw new Error("Account Master not found");

    const updatedAccount = await ACCOUNTMASTER.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    )
      .populate("assignBy")
      .populate("sourcebyTypeOfClient")
      .populate("sourceFrom");

    return res.status(200).json({
      status: "Success",
      message: "Account Master updated successfully",
      data: updatedAccount,
    });
  } catch (error) {
    return res.status(404).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.deleteAccountMaster = async (req, res) => {
  try {
    const id = req.params.id;

    const oldAccount = await ACCOUNTMASTER.findById(id);
    if (!oldAccount) throw new Error("Account Master not found");

    await ACCOUNTMASTER.findByIdAndUpdate(id, { isDeleted: true });

    return res.status(200).json({
      status: "Success",
      message: "Account Master deleted successfully",
    });
  } catch (error) {
    return res.status(404).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.downloadSampleExcel = async (req, res) => {
  try {
    const workbook = await generateSampleExcel();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=AccountMaster_Sample.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

exports.exportAccountMaster = async (req, res) => {
  try {
    const accounts = await ACCOUNTMASTER.find({ isDeleted: false })
      .populate('assignBy')
      .populate('sourcebyTypeOfClient')
      .populate('sourceFrom')
      .sort({ createdAt: -1 });
    const workbook = await generateExportExcel(accounts);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=AccountMaster_Export.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

exports.importAccountMaster = async (req, res) => {
  try {
    if (!req.file) throw new Error("No file uploaded");

    const { accounts, errors: parseErrors } = await parseImportExcel(req.file.buffer);

    if (parseErrors.length > 0) {
      return res.status(400).json({ status: "Fail", message: "Validation errors", errors: parseErrors });
    }

    const results = { success: 0, failed: 0, errors: [], failedRecords: [] };

    for (let i = 0; i < accounts.length; i++) {
      try {
        const accountData = accounts[i];
        
        // Check duplicate
        const existing = await ACCOUNTMASTER.findOne({
          $and: [
            { $or: [{ email: accountData.email }, { mobile: accountData.mobile }] },
            { isDeleted: false }
          ]
        });

        if (existing) {
          results.failed++;
          const errorMsg = "Duplicate email or mobile";
          results.errors.push(`Row ${i + 2}: ${errorMsg}`);
          results.failedRecords.push({
            rowNumber: i + 2,
            ...accountData,
            issue: errorMsg
          });
          continue;
        }

        let assignBy = null;
        if (accountData.assignBy) {
          assignBy = accountData.assignBy;
        }

        await ACCOUNTMASTER.create({
          companyName: accountData.companyName,
          clientName: accountData.clientName,
          address: accountData.address,
          mobile: accountData.mobile,
          email: accountData.email,
          website: accountData.website,
          sourcebyTypeOfClient: accountData.sourcebyTypeOfClient,
          sourceFrom: accountData.sourceFrom,
          assignBy: assignBy,
          remark: accountData.remark
        });

        results.success++;
      } catch (err) {
        results.failed++;
        const errorMsg = err.message;
        results.errors.push(`Row ${i + 2}: ${errorMsg}`);
        results.failedRecords.push({
          rowNumber: i + 2,
          ...accounts[i],
          issue: errorMsg
        });
      }
    }

    return res.status(200).json({
      status: "Success",
      message: `Import completed. Success: ${results.success}, Failed: ${results.failed}`,
      data: results
    });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};
