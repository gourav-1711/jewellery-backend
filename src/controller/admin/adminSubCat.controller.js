const SlugFunc = require("../../lib/slugFunc");
const subCategory = require("../../models/subCategory");
// Import the uploadToR2 function from lib folder
const { uploadToR2 } = require('../../lib/cloudflare');
require("dotenv").config();

// create
exports.create = async (request, response) => {
  try {
    const data = new subCategory(request.body);

    // Upload image to Cloudflare R2 if file exists
    if (request.file) {
      const uploadResult = await uploadToR2(request.file, "subcategories");
      
      if (uploadResult.success) {
        data.image = uploadResult.url;
      } else {
        throw new Error("Failed to upload image");
      }
    }

    const slug = await SlugFunc(subCategory, data.name);
    data.slug = slug;

    const ress = await data.save();


    const output = {
      _status: true,
      _message: "Data Inserted",
      _data: ress,
    };

    response.send(output);
  } catch (err) {
    const messages = [];

    // Handle validation errors
    if (err.errors) {
      for (let msg in err.errors) {
        if (err.errors[msg].message) {
          messages.push(err.errors[msg].message);
        }
      }
    } else {
      messages.push(err.message || "Something went wrong");
    }

    const output = {
      _status: false,
      _message: messages,
      _data: [],
    };

    response.send(output);
  }
};

// view
exports.view = async (request, response) => {
  try {
    let pageValue = 1;
    let limitValue = 10;
    let skipValue;

    const andCondition = [{ deleted_at: null }];
    const orCondition = [];

    let filter = {};

    if (andCondition.length > 0) {
      filter.$and = andCondition;
    } else {
      filter = {};
    }

    if (request.body != undefined) {
      pageValue = request.body.page ? request.body.page : 1;
      limitValue = request.body.limit ? request.body.limit : 10;
      skipValue = (pageValue - 1) * limitValue;

      if (request.body.name != undefined) {
        const name = new RegExp(request.body.name, "i");
        orCondition.push({ name: name });
      }

      if (request.body.parent_category_id) {
        andCondition.push({
          parent_category_ids: {
            $in: Array.isArray(request.body.parent_category_id)
              ? request.body.parent_category_id
              : [request.body.parent_category_id],
          },
        });
      }
    }

    if (orCondition.length > 0) {
      filter.$or = orCondition;
    }

    const totalRecords = await subCategory.find(filter).countDocuments();

    const ress = await subCategory
      .find(filter)
      .sort({ order: "asc", _id: "desc" })
      .limit(limitValue)
      .populate("parent_category_ids")
      .skip(skipValue);

    const output = {
      _status: ress.length > 0,
      _message: ress.length > 0 ? "Data Found" : "No Data Found",
      _data: ress.length > 0 ? ress : [],
      _total_pages: Math.ceil(totalRecords / limitValue),
      _total_records: totalRecords,
      _current_page: Number(pageValue),
      _image_url: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.dev/${process.env.CLOUDFLARE_BUCKET_NAME}/subcategories/`,
    };

    response.send(output);
  } catch (err) {
    const output = {
      _status: false,
      _message: "Something Went Wrong",
      _data: err.message || err,
    };

    response.send(output);
  }
};

// soft delete
exports.destroy = async (request, response) => {
  try {
    const result = await subCategory.updateMany(
      {
        _id: request.body.id,
      },
      {
        $set: {
          deleted_at: Date.now(),
        },
      }
    );

    const output = {
      _status: true,
      _message: "Data Deleted",
      _data: result,
    };

    response.send(output);
  } catch (err) {
    const output = {
      _status: false,
      _message: "No Data Deleted",
      _data: err.message || null,
    };

    response.send(output);
  }
};

// get details
exports.details = async (request, response) => {
  try {
    const result = await subCategory.findById({
      _id: request.body.id,
    });

    const output = {
      _status: result ? true : false,
      _message: result ? "Data Found" : "No Data Found",
      _data: result,
      _image_url: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.dev/${process.env.CLOUDFLARE_BUCKET_NAME}/subcategories/`,
    };

    response.send(output);
  } catch (err) {
    const output = {
      _status: false,
      _message: "No Data Found",
      _data: err.message || null,
    };

    response.send(output);
  }
};

// update
exports.update = async (request, response) => {
  try {
    const id = request.params.id;
    const data = { ...request.body };

    // Upload new image to Cloudflare R2 if file exists
    if (request.file) {
      const uploadResult = await uploadToR2(request.file, "subcategories");
      
      if (uploadResult.success) {
        data.image = uploadResult.url;
      } else {
        throw new Error("Failed to upload image");
      }
    }

    const slug = await SlugFunc(category, data.name);
    data.slug = slug;

    const ress = await subCategory.updateOne(
      {
        _id: id,
      },
      {
        $set: data,
      }
    );

    const output = {
      _status: true,
      _message: "Data Updated",
      _data: ress,
    };

    response.send(output);
  } catch (err) {
    const output = {
      _status: false,
      _message: "No Data Updated",
      _data: err.message || null,
    };

    response.send(output);
  }
};

// change status
exports.changeStatus = async (request, response) => {
  try {
    const result = await subCategory.updateMany(
      {
        _id: request.body.id,
      },
      [
        {
          $set: {
            status: {
              $not: "$status",
            },
          },
        },
      ]
    );

    const output = {
      _status: true,
      _message: "Status Changed",
      _data: result,
    };

    response.send(output);
  } catch (err) {
    const output = {
      _status: false,
      _message: "Status Not Changed",
      _data: err.message || null,
    };

    response.send(output);
  }
};