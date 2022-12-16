const { ifError } = require("assert");
const { resolve } = require("path");
const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// Verify if dishId exists

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id == dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not: ${dishId}`,
  });
}

function dataExists(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      next();
    }
    next({ status: 400, message: `Must include a ${propertyName}` });
  };
}

//Verify that price is a valid input

function validPrice(req, res, next) {
  const {
    data: { price },
  } = req.body;
  if (price > 0 && Number.isInteger(price)) {
    next();
  }
  next({ status: 400, message: `${price} is not a valid price` });
}

//Verify correct dish ID is being updated
function validUpdate(req, res, next) {
  const {
    data: { id },
  } = req.body;
  const { dishId } = req.params;
  if (!id || id === dishId) {
    next();
  }
  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
  });
}

// GET all dishes

function list(req, res) {
  res.json({ data: dishes });
}

// POST new dish

function create(req, res) {
  const {
    data: { name, description, price, image_url },
  } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

// GET specific dish

function read(req, res) {
  res.json({ data: res.locals.dish });
}

// PUT specific dish

function update(req, res) {
  const dish = res.locals.dish;
  const {
    data: { name, description, price, image_url },
  } = req.body;

  //Update dish
  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.json({ data: dish });
}

module.exports = {
  list,
  create: [
    dataExists("name"),
    dataExists("description"),
    dataExists("price"),
    dataExists("image_url"),
    validPrice,
    create,
  ],
  read: [dishExists, read],
  update: [
    dishExists,
    dataExists("name"),
    dataExists("description"),
    dataExists("price"),
    dataExists("image_url"),
    validPrice,
    validUpdate,
    update,
  ],
  dishExists,
};
