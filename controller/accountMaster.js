const ACCOUNTMASTER = require("../model/accountMaster");

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
      assignBy,
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
      assignBy,
    });

    return res.status(201).json({
      status: "Success",
      message: "Account Master created successfully",
      data: account,
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
            { sourcebyTypeOfClient: { $regex: search, $options: "i" } },
          ],
        },
      ],
    };

    const totalRecords = await ACCOUNTMASTER.countDocuments(query);

    const accounts = await ACCOUNTMASTER.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate("assignBy");

    return res.status(200).json({
      status: "Success",
      message: "Account Master data fetched successfully",
      pagination: {
        totalRecords,
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit),
        limit,
      },
      data: accounts,
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

    const account = await ACCOUNTMASTER.findById(id).populate("assignBy");

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
    );

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
