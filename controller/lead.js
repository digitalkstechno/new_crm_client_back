const LEAD = require("../model/lead");

/* =========================
   CREATE LEAD
========================= */

exports.createLead = async (req, res) => {
  try {
    const {
      leadDate,
      clientType,
      deliveryDate,
      shippingCharges,
      budget,
      accountMaster,
      leadStatus,
      items,
      remarks,
      paymentHistory,
      totalAmount,
    } = req.body;

    const lead = await LEAD.create({
      leadDate,
      clientType,
      deliveryDate,
      shippingCharges,
      budget,
      accountMaster,
      leadStatus,
      items,
      remarks,
      paymentHistory,
      totalAmount,
    });

    return res.status(201).json({
      status: "Success",
      message: "Lead created successfully",
      data: lead,
    });
  } catch (error) {
    return res.status(400).json({
      status: "Fail",
      message: error.message,
    });
  }
};

/* =========================
   FETCH ALL LEADS (Pagination + Search)
========================= */

exports.fetchAllLeads = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    let query = {
      $and: [
        { $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] },
        { leadStatus: { $in: req.permissions } },
      ],
    };

    if (search) {
      query.$and.push({
        $or: [
          { leadStatus: { $regex: search, $options: "i" } },
          { clientType: { $regex: search, $options: "i" } },
        ],
      });
    }

    const totalRecords = await LEAD.countDocuments(query);

    const leads = await LEAD.find(query)
      .populate({ path: "accountMaster", populate: { path: "assignBy" } })
      .populate("items.inquiryCategory")
      .populate("items.modelSuggestion")
      .populate("items.customizationType")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      status: "Success",
      message: "Leads fetched successfully",
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

/* =========================
   FETCH LEAD BY ID
========================= */

exports.fetchLeadById = async (req, res) => {
  try {
    const id = req.params.id;

    const lead = await LEAD.findById(id)
      .populate({ path: "accountMaster", populate: { path: "assignBy" } })
      .populate("items.inquiryCategory")
      .populate("items.modelSuggestion")
      .populate("items.customizationType");

    if (!lead) throw new Error("Lead not found");

    return res.status(200).json({
      status: "Success",
      message: "Lead fetched successfully",
      data: lead,
    });
  } catch (error) {
    return res.status(404).json({
      status: "Fail",
      message: error.message,
    });
  }
};

/* =========================
   UPDATE LEAD
========================= */

exports.updateLead = async (req, res) => {
  try {
    const id = req.params.id;

    const oldLead = await LEAD.findById(id);
    if (!oldLead) throw new Error("Lead not found");

    const updatedLead = await LEAD.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    return res.status(200).json({
      status: "Success",
      message: "Lead updated successfully",
      data: updatedLead,
    });
  } catch (error) {
    return res.status(404).json({
      status: "Fail",
      message: error.message,
    });
  }
};

/* =========================
   DELETE LEAD
========================= */

exports.deleteLead = async (req, res) => {
  try {
    const id = req.params.id;

    const lead = await LEAD.findById(id);
    if (!lead) throw new Error("Lead not found");

    await LEAD.findByIdAndUpdate(id, { isDeleted: true });

    return res.status(200).json({
      status: "Success",
      message: "Lead deleted successfully",
    });
  } catch (error) {
    return res.status(404).json({
      status: "Fail",
      message: error.message,
    });
  }
};

/* =========================
   FETCH LEADS BY STATUS
========================= */

exports.fetchLeadsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!req.permissions.includes(status)) {
      return res.status(403).json({
        status: "Fail",
        message: "You don't have permission to view this status",
      });
    }

    const query = { 
      leadStatus: status, 
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] 
    };

    const totalRecords = await LEAD.countDocuments(query);

    const leads = await LEAD.find(query)
      .populate({ path: "accountMaster", populate: { path: "assignBy" } })
      .populate("items.inquiryCategory")
      .populate("items.modelSuggestion")
      .populate("items.customizationType")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      status: "Success",
      message: "Leads fetched successfully",
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
