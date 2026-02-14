const ROLE = require("../model/role");
const { LEAD_STATUSES } = require("../constants/leadStatus");

exports.createRole = async (req, res) => {
  try {
    const { roleName, allowedStatuses, canAccessSettings, canAccessAccountMaster, accountMasterViewType } = req.body;

    const existingRole = await ROLE.findOne({ roleName });
    if (existingRole) throw new Error("Role already exists");

    const role = await ROLE.create({ 
      roleName, 
      allowedStatuses, 
      canAccessSettings,
      canAccessAccountMaster,
      accountMasterViewType
    });

    return res.status(201).json({
      status: "Success",
      message: "Role created successfully",
      data: role,
    });
  } catch (error) {
    return res.status(400).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.fetchAllRoles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const query = search
      ? { roleName: { $regex: search, $options: "i" }, isActive: true }
      : { isActive: true };

    const totalRecords = await ROLE.countDocuments(query);
    const roles = await ROLE.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      status: "Success",
      message: "Roles fetched successfully",
      pagination: {
        totalRecords,
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit),
        limit,
      },
      data: roles,
    });
  } catch (error) {
    return res.status(500).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.fetchRoleById = async (req, res) => {
  try {
    const role = await ROLE.findById(req.params.id);
    if (!role) throw new Error("Role not found");

    return res.status(200).json({
      status: "Success",
      message: "Role fetched successfully",
      data: role,
    });
  } catch (error) {
    return res.status(404).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const role = await ROLE.findById(req.params.id);
    if (!role) throw new Error("Role not found");

    const updatedRole = await ROLE.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    return res.status(200).json({
      status: "Success",
      message: "Role updated successfully",
      data: updatedRole,
    });
  } catch (error) {
    return res.status(404).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const role = await ROLE.findById(req.params.id);
    if (!role) throw new Error("Role not found");

    await ROLE.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      status: "Success",
      message: "Role deleted successfully",
    });
  } catch (error) {
    return res.status(404).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.getAllStatuses = async (req, res) => {
  try {
    return res.status(200).json({
      status: "Success",
      message: "Statuses fetched successfully",
      data: LEAD_STATUSES,
    });
  } catch (error) {
    return res.status(500).json({
      status: "Fail",
      message: error.message,
    });
  }
};
