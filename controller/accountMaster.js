const ACCOUNTMASTER = require("../model/accountMaster");
const axios = require("axios");
const STAFF = require("../model/staff");
const PUBLICLEAD = require("../model/publicLead");
const ExcelJS = require("exceljs");
const {
  generateSampleExcel,
  generateExportExcel,
  parseImportExcel,
} = require("../utils/excelHelper");
const {
  validateEmail,
  validatePhone,
  validateWebsite,
  validateRequiredField,
} = require("../utils/validation");
const sendMailasync = require("../utils/mailing");

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

    // Validation - Only Company Name and Mobile are required
    if (!validateRequiredField(companyName)) {
      throw new Error("Company name is required");
    }
    if (!validatePhone(mobile)) {
      throw new Error(
        "Mobile number must be exactly 12 digits (91 + 10 digits)",
      );
    }

    // Optional field validations
    if (email && !validateEmail(email)) {
      throw new Error("Invalid email address");
    }
    if (website && !validateWebsite(website)) {
      throw new Error("Invalid website URL");
    }

    // Check for duplicate mobile
    const verify = await ACCOUNTMASTER.findOne({
      mobile,
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    });

    if (verify)
      throw new Error("Account already exists with this mobile number");

    // Prepare data - convert empty strings to null for ObjectId fields
    const accountData = {
      companyName,
      clientName: clientName || null,
      address,
      mobile,
      email: email || null,
      website: website || null,
      sourcebyTypeOfClient: sourcebyTypeOfClient || null,
      sourceFrom: sourceFrom || null,
      assignBy: assignBy || null,
      remark: remark || null,
    };

    const account = await ACCOUNTMASTER.create(accountData);

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
            { mobile: { $regex: search } },
            { email: { $regex: search, $options: "i" } },
            { website: { $regex: search, $options: "i" } },
          ],
        },
      ],
    };

    // Filter by assignBy if view_own
    if (req.accountMasterViewType === "view_own") {
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
        const leadCount = await LEAD.countDocuments({
          accountMaster: account._id,
        });
        return {
          ...account.toObject(),
          leadCount,
        };
      }),
    );

    let filteredAccounts = accountsWithLeadCount;
    if (noLeadsOnly) {
      filteredAccounts = accountsWithLeadCount.filter(
        (acc) => acc.leadCount === 0,
      );
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
    const { email, mobile, website } = req.body;

    // Validation
    if (email && !validateEmail(email)) {
      throw new Error("Invalid email address");
    }
    if (mobile && !validatePhone(mobile)) {
      throw new Error(
        "Mobile number must be exactly 12 digits (91 + 10 digits)",
      );
    }
    if (website && !validateWebsite(website)) {
      throw new Error("Invalid website URL");
    }

    const oldAccount = await ACCOUNTMASTER.findById(id);
    if (!oldAccount) throw new Error("Account Master not found");

    // Check for duplicate email/mobile if changed
    if (email && email !== oldAccount.email) {
      const existingEmail = await ACCOUNTMASTER.findOne({
        email,
        isDeleted: false,
        _id: { $ne: id },
      });
      if (existingEmail) throw new Error("Email already exists");
    }
    if (mobile && mobile !== oldAccount.mobile) {
      const existingMobile = await ACCOUNTMASTER.findOne({
        mobile,
        isDeleted: false,
        _id: { $ne: id },
      });
      if (existingMobile) throw new Error("Mobile number already exists");
    }

    const updatedAccount = await ACCOUNTMASTER.findByIdAndUpdate(id, req.body, {
      new: true,
    })
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
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=AccountMaster_Sample.xlsx",
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

exports.exportAccountMaster = async (req, res) => {
  try {
    const noLeadsOnly = req.query.noLeadsOnly === "true";

    const accounts = await ACCOUNTMASTER.find({ isDeleted: false })
      .populate("assignBy")
      .populate("sourcebyTypeOfClient")
      .populate("sourceFrom")
      .sort({ createdAt: -1 });

    let filteredAccounts = accounts;
    if (noLeadsOnly) {
      const LEAD = require("../model/lead");
      const accountsWithLeadCount = await Promise.all(
        accounts.map(async (account) => {
          const leadCount = await LEAD.countDocuments({
            accountMaster: account._id,
          });
          return { account, leadCount };
        }),
      );
      filteredAccounts = accountsWithLeadCount
        .filter((item) => item.leadCount === 0)
        .map((item) => item.account);
    }

    const workbook = await generateExportExcel(filteredAccounts);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=AccountMaster_Export.xlsx",
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

exports.importAccountMaster = async (req, res) => {
  try {
    if (!req.file) throw new Error("No file uploaded");

    const { accounts, errors: parseErrors } = await parseImportExcel(
      req.file.buffer,
    );

    const results = {
      success: 0,
      failed: parseErrors.length,
      errors: [...parseErrors],
      failedRecords: parseErrors.map((err) => ({ issue: err })),
    };

    for (let i = 0; i < accounts.length; i++) {
      try {
        const accountData = accounts[i];

        // Mobile validation
        if (!validatePhone(accountData.mobile)) {
          throw new Error(
            "Mobile number must be exactly 12 digits (91 + 10 digits)",
          );
        }

        // Check for duplicate mobile
        const verify = await ACCOUNTMASTER.findOne({
          mobile: accountData.mobile,
          $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
        });

        if (verify)
          throw new Error("Account already exists with this mobile number");

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
          remark: accountData.remark,
        });

        results.success++;
      } catch (err) {
        results.failed++;
        const errorMsg = err.message;
        const rowNum = accounts[i].rowNumber || i + 2;
        results.errors.push(`Row ${rowNum}: ${errorMsg}`);
        results.failedRecords.push({
          ...accounts[i],
          issue: errorMsg,
        });
      }
    }

    // Generate error Excel if there are failed records
    if (results.failedRecords.length > 0) {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Failed Records");

      sheet.columns = [
        { header: "Row Number", key: "rowNumber", width: 12 },
        { header: "Company Name", key: "companyName", width: 25 },
        { header: "Client Name", key: "clientName", width: 20 },
        { header: "Mobile", key: "mobile", width: 15 },
        { header: "Email", key: "email", width: 25 },
        { header: "Error", key: "issue", width: 50 },
      ];

      results.failedRecords.forEach((record) => {
        sheet.addRow({
          rowNumber: record.rowNumber,
          companyName: record.companyName,
          clientName: record.clientName,
          mobile: record.mobile,
          email: record.email,
          issue: record.issue,
        });
      });

      sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      sheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFF0000" },
      };

      const buffer = await workbook.xlsx.writeBuffer();
      results.errorFile = buffer.toString("base64");
    }

    return res.status(200).json({
      status: "Success",
      message: `Import completed. Success: ${results.success}, Failed: ${results.failed}`,
      data: results,
    });
  } catch (error) {
    return res.status(500).json({ status: "Fail", message: error.message });
  }
};

exports.createPublicAccountMaster = async (req, res) => {
  try {
    const { companyName, clientName, mobile, email, website, address } =
      req.body;

    if (!companyName || !clientName || !mobile) {
      throw new Error("Company Name, Client Name, and Mobile are required");
    }

    if (!validatePhone(mobile)) {
      throw new Error(
        "Mobile number must be exactly 12 digits (91 + 10 digits)",
      );
    }

    if (email && !validateEmail(email)) {
      throw new Error("Invalid email address");
    }

    if (website && !validateWebsite(website)) {
      throw new Error("Invalid website URL");
    }

    const verify = await ACCOUNTMASTER.findOne({
      $and: [
        { $or: [{ email }, { mobile }] },
        { $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] },
      ],
    });

    if (verify)
      throw new Error("Account already exists with this email or mobile");

    const account = await ACCOUNTMASTER.create({
      companyName,
      clientName,
      address,
      mobile,
      email,
      website,
    });

    return res.status(201).json({
      status: "Success",
      message: "Form submitted successfully",
      data: account,
    });
  } catch (error) {
    return res.status(400).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.createPublicLead = async (req, res) => {
  try {
    const { name, companyName, email, whatsappNumber, notes } = req.body;

    if (!whatsappNumber) {
      throw new Error(
        "WhatsApp Number is required",
      );
    }

    if (email && !validateEmail(email)) {
      throw new Error("Invalid email address");
    }

    if (whatsappNumber && !validatePhone(whatsappNumber)) {
      throw new Error(
        "WhatsApp number must be exactly 12 digits (91 + 10 digits)",
      );
    }

    // Check for duplicate public lead (optional, but good practice)

    const body = { name, companyName, email, whatsappNumber, notes };
    if (req.files?.length > 0) {
      body.attachments = req.files.map((file) => file.filename);
    }

    const lead = await PUBLICLEAD.create(body);

    // Send success response immediately so the user doesn't wait
    res.status(201).json({
      status: "Success",
      message: "Lead submitted successfully",
      data: lead,
    });

    // Send notifications in the background
    (async () => {
      const profilePdfUrl = "https://service.digitalks.co.in/s3docs/mozu_doc/pdffile/4b4a54315f7c4dae8b7999568b17b403.pdf";

      // Send WhatsApp message
      try {
        const waResponse = await axios.post("https://app.11za.in/apis/template/sendTemplate", {
          authToken: "U2FsdGVkX1/Y2AKCS/OFEpTatzmyelG8HyzOK43peOoCadFHc1egIws3V1cdJNhbDtazfsR5EVfebTtq9hC1HueSpb9jMegs6ZqVpSd9Z9VCLmzi7zNKKF/RLD7Bj2YaXlEFgOYSP4v6SDZqDZzybxbsvZkg692Z44/XTtPJpYXyiEhNwKF5WtX1P1bYbjkD",
          name: name,
          sendto: whatsappNumber,
          originWebsite: "https://www.mozudesign.com/",
          templateName: "expo_msg",
          language: "en",
          myfile: profilePdfUrl,
          myfileName: "Mozu Catalogue 2026.pdf",
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Cookie': 'connect.sid=s%3AOjpBg4Q2xQNOtQTSTi6Ac7c27b6IyV7x.zJBnTie8yN9hqKUBGQBwSftIg9LPEUYK%2BQ%2FGaWcqEcs'
          }
        });
        console.log("WhatsApp message sent successfully:", waResponse.data);
      } catch (waError) {
        console.error("Error sending WhatsApp message in background:", waError.response?.data || waError.message);
      }

      // Send thank you email to customer if email is provided
      if (email) {
        try {
          const subject = "Connect with Mozu - Abhishek Poddar";
          const html = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
              <div style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Mozu Design</h1>
              </div>
              <div style="padding: 40px 30px; background-color: white; line-height: 1.6;">
                <p style="font-size: 16px;">Hello,</p>
                <p style="font-size: 16px;">I’m <strong>Abhishek Poddar</strong>, Co-Founder at brand <strong>Mozu</strong>.</p>
                
                <p style="font-size: 16px;">We are Manufacturer specializing in high-quality <strong>Powerbanks, Wireless Earbuds, Bluetooth Speakers</strong>, and other trending electronic accessories.</p>
                
                <p style="font-size: 16px;">Our in-house brand <strong>MOZU</strong> stands for performance, innovation, and trust — tailored for today’s smart users.</p>
                
                <p style="font-size: 16px;">We also cater extensively to the <strong>Corporate Gifting</strong> segment, offering fully customized tech solutions for events, promotions, and enterprise needs.</p>
                
                <p style="font-size: 16px;">If you're looking for quality products, or branded gifting ideas — feel free to connect. Would love to share more about how we can work together.</p>
                
                <div style="margin-top: 30px; padding: 20px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #0f172a;">
                  <p style="margin: 0; font-style: italic; color: #64748b;">Please find our product profile attached with this email.</p>
                </div>
              </div>
              <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; color: #94a3b8; font-size: 14px;">© ${new Date().getFullYear()} Mozu Design. All rights reserved.</p>
              </div>
            </div>
          `;

          const attachments = [
            {
              filename: 'Mozu_Profile.pdf',
              path: profilePdfUrl
            }
          ];

          await sendMailasync(email, subject, html, attachments);
          console.log("Email sent successfully to:", email);
        } catch (mailError) {
          console.error("Error sending thank you email in background:", mailError);
        }
      }
    })();
  } catch (error) {
    return res.status(400).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.fetchAllPublicLeads = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const query = {
      $and: [
        { $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] },

        search
          ? {
              $or: [
                { name: { $regex: search, $options: "i" } },
                { companyName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { whatsappNumber: { $regex: search } },
              ],
            }
          : {},
      ],
    };

    const totalRecords = await PUBLICLEAD.countDocuments(query);
    const leads = await PUBLICLEAD.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      status: "Success",
      message: "Public leads fetched successfully",
      pagination: {
        totalRecords,
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit),
        limit,
      },
      data: leads,
    });
  } catch (error) {
    return res.status(500).json({
      status: "Fail",
      message: error.message,
    });
  }
};
