const { ifError } = require("assert");
const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// Verify that the order does exist
function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id == orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id not found: ${orderId}`,
  });
}

// Verify that the order has correct data

function dataExists(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      next();
    }
    next({ status: 400, message: `Must include a ${propertyName}` });
  };
}

// Verify dish is an array and has atleast 1 dish

function verifyDishes(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (!dishes) {
    next({ status: 400, message: `Order must include a dish` });
  } else if (
    dishes < 1 ||
    dishes.length == 0 ||
    Array.isArray(dishes) != true
  ) {
    next({ status: 400, message: `Order must include atleast one dish` });
  }
  next();
}

//Verify that dishes have quantity
function verifyQuantity(req, res, next) {
  const {
    data: { dishes },
  } = req.body;
  const foundIndex = dishes.findIndex(
    (dish) =>
      !dish.quantity ||
      dish.quantity < 1 ||
      Number.isInteger(dish.quantity) != true
  );

  if (foundIndex != -1) {
    next({
      status: 400,
      message: `Dish ${foundIndex} must have a quantity that is an integer greater than 0`,
    });
  }
  next();
}

//Verify correct dishId is being updated
function validUpdate(req, res, next) {
  const {
    data: { id },
  } = req.body;
  const { orderId } = req.params;
  if (!id || id == orderId) {
    next();
  }
  next({
    status: 400,
    message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
  });
}

//Verify correct status input
function verifyStatus(req, res, next) {
  const {
    data: { status },
  } = req.body;
  if (!status || status == "invalid") {
    next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });
  } else if (status === "deliverd") {
    next({
      status: 400,
      message: `A delivered order cannot be changed`,
    });
  }
  next();
}

// GET all orders

function list(req, res) {
  res.json({ data: orders });
}

// POST new order

function create(req, res) {
  const {
    data: { deliverTo, mobileNumber, status, dishes },
  } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

// GET specific order

function read(req, res) {
  res.json({ data: res.locals.order });
}

// DELETE order

function destroy(req, res, next) {
  const { orderId } = req.params;
  const { status } = res.locals.order;
  console.log(status);
  if (status === "pending") {
    const index = orders.findIndex((index) => index.id == Number(orderId));
    const deletedId = orders.splice(index, 1);
    res.sendStatus(204);
    return;
  }
  next({
    status: 400,
    message: `An order cannot be deleted unless it is pending`,
  });
}

// PUT order

function update(req, res) {
  const order = res.locals.order;
  const {
    data: { deliverTo, mobileNumber, status, dishes },
  } = req.body;

  //Update order
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.json({ data: order });
}

module.exports = {
  list,
  create: [
    dataExists("deliverTo"),
    dataExists("mobileNumber"),
    verifyDishes,
    verifyQuantity,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    dataExists("deliverTo"),
    dataExists("mobileNumber"),
    verifyStatus,
    verifyDishes,
    verifyQuantity,
    validUpdate,
    update,
  ],
  destroy: [orderExists, destroy],
  orderExists,
};
