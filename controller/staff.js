const STAFF = require("../model/staff");
const ROLE = require("../model/role");
const { encryptData, decryptData } = require("../utils/crypto");
const jwt = require("jsonwebtoken");

exports.createStaff = async (req, res) => {
  try {
    const { fullName, email, phone, password, role } = req.body;

    let staffFindWithEmail = await STAFF.findOne({ email, $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] });
    if (staffFindWithEmail) throw new Error("Email already exists");
    let staffFindWithPhone = await STAFF.findOne({ phone, $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] });
    if (staffFindWithPhone) throw new Error("Phone number already exists");

    const roleExists = await ROLE.findById(role);
    if (!roleExists) throw new Error("Role not found");

    const encryptedPassword = encryptData(password);

    const staffData = {
      fullName,
      email,
      phone,
      password: encryptedPassword,
      role,
    };

    const staffDetails = await STAFF.create(staffData);
    const populatedStaff = await STAFF.findById(staffDetails._id).populate("role");

    return res.status(201).json({
      status: "Success",
      message: "Staff created successfully",
      data: populatedStaff,
    });
  } catch (error) {
    return res.status(400).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.loginStaff = async (req, res) => {
  try {
    const { email, password } = req.body;
    let staffverify = await STAFF.findOne({ email }).populate("role");
    if (!staffverify) {
      throw new Error("Staff not found");
    }
    let decryptedPassword = decryptData(staffverify.password);

    if (String(decryptedPassword) !== password) {
      throw new Error("Invalid password");
    }
    let token = jwt.sign({ id: staffverify._id }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
    let refreshToken = jwt.sign({ id: staffverify._id }, process.env.JWT_REFRESH_SECRET_KEY, { expiresIn: '7d' });
    
    return res.status(200).json({
      status: "Success",
      message: "Staff logged in successfully",
      data: staffverify,
      token,
      refreshToken,
      permissions: staffverify.role.allowedStatuses,
      canAccessSettings: staffverify.role.canAccessSettings,
    });
  } catch (error) {
    return res.status(400).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw new Error("Refresh token is required");
    }
    
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET_KEY);
    const staff = await STAFF.findById(decoded.id).populate("role");
    
    if (!staff) {
      throw new Error("Staff not found");
    }
    
    const newToken = jwt.sign({ id: staff._id }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
    const newRefreshToken = jwt.sign({ id: staff._id }, process.env.JWT_REFRESH_SECRET_KEY, { expiresIn: '7d' });
    
    return res.status(200).json({
      status: "Success",
      message: "Token refreshed successfully",
      token: newToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    return res.status(401).json({
      status: "Fail",
      message: error.message || "Invalid refresh token",
    });
  }
};

exports.fetchAllStaffs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search || "";

    const query = {
      $and: [
        { $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] },
        {
          $or: [
            { fullName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
          ],
        },
      ],
    };

    const totalStaff = await STAFF.countDocuments(query);
    const staffsData = await STAFF.find(query)
      .populate("role")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })

    return res.status(200).json({
      status: "Success",
      message: "Staffs fetched successfully",
      pagination: {
        totalRecords: totalStaff,
        currentPage: page,
        totalPages: Math.ceil(totalStaff / limit),
        limit,
      },
      data: staffsData,
    });
  } catch (error) {
    return res.status(500).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.fetchAllStaffsForDropdown = async (req, res) => {
  try {
    const query = {
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    };

    const staffsData = await STAFF.find(query)
      .populate('role', 'canAccessAccountMaster')
      .select('_id fullName role')
      .sort({ fullName: 1 });

    return res.status(200).json({
      status: "Success",
      message: "Staffs fetched successfully",
      data: staffsData,
    });
  } catch (error) {
    return res.status(500).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.fetchStaffById = async (req, res) => {
  try {
    let staffId = req.params.id;
    let staffData = await STAFF.findById(staffId).populate("role");
    if (!staffData) {
      throw new Error("Staff not found");
    }
    return res.status(200).json({
      status: "Success",
      message: "Staff fetched successfully",
      data: staffData,
    });
  } catch (error) {
    return res.status(404).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.staffUpdate = async (req, res) => {
  try {
    let staffId = req.params.id;
    let oldStaff = await STAFF.findById(staffId);

    if (!oldStaff) {
      throw new Error("Staff not found");
    }
    if (req.body.password) {
      req.body.password = encryptData(req.body.password);
    }
    let updatedStaff = await STAFF.findByIdAndUpdate(staffId, req.body, {
      new: true,
    }).populate("role");
    return res.status(200).json({
      status: "Success",
      message: "Staff updated successfully",
      data: updatedStaff,
    });
  } catch (error) {
    return res.status(404).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.staffDelete = async (req, res) => {
  try {
    let staffId = req.params.id;
    let oldStaff = await STAFF.findById(staffId);

    if (!oldStaff) {
      throw new Error("Staff not found");
    }
    
    await STAFF.findByIdAndUpdate(staffId, { isDeleted: true });

    return res.status(200).json({
      status: "Success",
      message: "Staff deleted successfully",
    });
  } catch (error) {
    return res.status(404).json({
      status: "Fail",
      message: error.message,
    });
  }
};
