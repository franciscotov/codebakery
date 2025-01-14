const { Order, Lineal_Order, Product, Users } = require("../db");
const { getProductById } = require("./productsService");

async function getAllOrdersUser(args) {
  let { userId } = args
try{
 const orders = await Order.findAll({
   where: {
    userId: userId
   }
 })

 const out = [];

    for (let i = 0; i < orders.length; i++) {
      const element = orders[i];
      const formatted = await _formatOrder(element);
      out.push({ __typename: orders, ...formatted });
    }
    console.log(orders);
    return { __typename: "orders", orders: out };
  } catch (err) {
    return {
      __typename: "error",
      name: "db error",
      detail: `Problem getting order: ${err.message}`,
    };
  }
}
async function getAllOrders() {
  try {
    const order = await Order.findAll({
      where: {
        placeStatus: "ticket",
      },
    });

    const out = [];

    for (let i = 0; i < order.length; i++) {
      const element = order[i];
      const formatted = await _formatOrder(element);
      out.push({ __typename: "order", ...formatted });
    }
    return { __typename: "orders", orders: out };
  } catch (err) {
    return {
      __typename: "error",
      name: "db error",
      detail: `Problem getting orders: ${err.message}`,
    };
  }
}

async function getOrdersByUserIdInTicket(userId) {
  try {
    const order = await Order.findAll({
      where: {
        userId: userId,
        placeStatus: "ticket",
      },
    });
    const out = [];

    for (let i = 0; i < order.length; i++) {
      const element = order[i];
      const formatted = await _formatOrder(element);
      out.push({ __typename: order, ...formatted });
    }
    return { __typename: "orders", orders: out };
  } catch (err) {
    return {
      __typename: "error",
      name: "db error",
      detail: `Problem getting order: ${err.message}`,
    };
  }
}

async function getOrdersByUserIdInCart(userId) {
  try {
    const order = await Order.findAll({
      where: {
        userId: userId,
        placeStatus: "cart",
      },
    });
    const out = [];
    for (let i = 0; i < order.length; i++) {
      const element = order[i];
      const formatted = await _formatOrder(element);
      out.push({ __typename: order, ...formatted });
    }
    return { __typename: "orders", orders: out };
  } catch (err) {
    return {
      __typename: "error",
      name: "db error",
      detail: `Problem getting order: ${err.message}`,
    };
  }
}

/**
 * Create new order created by the user
 * By default the placeStatus of the order is "cart"
 * By default the status of the order id "unpaid"
 * @param  {array} products array of products with the id and quantity,
 *  example: [{id:1,quantity:100},{id:3,quantity:10}]
 * @param  {} idUser id of the user going to makethe orden
 */

async function createOrder(products, idUser) {
  if (!Array.isArray(products)) {
    return {
      __typename: "error",
      name: "input error",
      detail: "products, must be a array",
    };
  } else if (!products[0]) {
    return {
      __typename: "error",
      name: "input error",
      detail: "Must be send minimum a 1 product",
    };
  } else if (!products[0].id) {
    return {
      __typename: "error",
      name: "input error",
      detail: "object of array must contain a id of product",
    };
    // Esto no
    throw new Error();
  } else if (!products[0].quantity) {
    return {
      __typename: "error",
      name: "input error",
      detail: "object of array must contain a quantity of the product",
    };
  } else {
    const pass = () => "pass!"; //Es solo por poner algo
  }

  let user = null;
  let order = null;
  //get user to vinculate order (avoid a fake id user is used)
  try {
    user = await Users.findOne({
      where: {
        id: idUser,
      },
    });
    if (!user)
      return {
        __typename: "error",
        name: "id user error",
        detail: `El usuario ${idUser} no existe`,
      };

    order = await Order.create({
      userId: user.id,
    });
  } catch (err) {
    return {
      __typename: "error",
      name: "db error",
      detail: "Error creating new order, orderService " + err.message,
    };
  }
  //Get all products and vinculate with the order
  try {
    for (let product of products) {
      let result = await getProductById({ id: product.id });
      //Al crear la orden se usara el precio del producto en la db, otra opcion es usar el precio del carrito, discutir
      let has = await order.addProduct(result, {
        through: {
          price: result.price,
          quantity: product.quantity,
          discount: product.discount,
        },
      });
    }
  } catch (err) {
    return {
      __typename: "error",
      name: "db error",
      detail:
        "Error in vinculation current products to order, orderService " +
        err.message,
    };
  }
  let formatedOrder = null;
  try {
    formatedOrder = await _formatOrder(order);
  } catch (err) {
    return {
      __typename: "error",
      name: "db error",
      detail: "Error formating order" + err.message,
    };
  }
  return { __typename: "order", ...formatedOrder };
}

/**
 * When sequelize generate a order this generata a order with values unordered
 * this function parse the order object get from of sequelize, and parse to the format waited by graphql
 * @param  {ObjectGeneratedSequelize} order
 */

async function _formatOrder(order) {
  if (!order.dataValues) {
    throw Error(
      "function format order expected a order object generated by sequelize"
    );
  }
  const productsOrden = await order.getProducts();
  const userOrden = await order.getUser();
  const lineal_Order = productsOrden.map((p) => p.Lineal_Order);
  //Add every product in the order in a array to return after :)
  let productsOrdersSalida = [];
  for (let i in lineal_Order) {
    productsOrdersSalida.push({
      id: productsOrden[i].id,
      name: productsOrden[i].name,
      price: lineal_Order[i].price,
      discount: productsOrden[i].discount,
      quantity: lineal_Order[i].quantity,
      stock: productsOrden[i].stock,
      image: productsOrden[i].image,
    });
  }
  const out = {
    storeId: order.storeId,
    id: order.id,
    status: order.status,
    name: userOrden.name,
    email: userOrden.email,
    role: userOrden.role,
    userId: userOrden.id,
    creation: order.createdAt.toUTCString(),
    lastModified: order.updatedAt.toUTCString(),
    cancelled: order.cancelled,
    lineal_order: productsOrdersSalida,
  };
  return out;
}
/**
 * Get the order by id
 * @param  {Int} id id of the order searched
 */

async function getOrderById(id) {
  try {
    const order = await Order.findOne({
      where: {
        id,
      },
    });
    const out = await _formatOrder(order);
    return { __typename: "order", ...out };
  } catch (err) {
    return {
      __typename: "error",
      name: "db error",
      detail: "unknow error: " + err.message,
    };
  }
}

async function updateOrderPrices(orderId) {
  try {
    const order = await Order.findOne({
      where: { id: orderId },
    });
    const orderProducts = await order.getProducts();
    const prices = {};

    for (const data of orderProducts) {
      prices[data.id] = data.price;
    }

    const lineal_Order = orderProducts.map((p) => p.Lineal_Order);

    for (const data of lineal_Order) {
      const id = data.productId;
      data.price = prices[id];
      await data.save();
    }

    return { __typename: "booleanResponse", boolean: true };
  } catch (err) {
    return { __typename: "error", name: "unknow", detail: err.message };
  }
}

/**
 * ONLY IF PLACE STATUS IS CART
 * Delete a existing product in the order
 * @param  {} orderId
 * @param  {} productId
 */
async function deleteProductOrder(orderId, productId) {
  try {
    const order = await Order.findOne({ where: { id: orderId } });
    if (order.placeStatus === "cart") {
      const a = await Lineal_Order.destroy({
        where: { orderId, productId },
      });
      if (a === 1) {
        return { __typename: "booleanResponse", boolean: true };
      } else {
        return {
          __typename: "error",
          name: "not existent product",
          detail: `Product ${productId} not exist in the order`,
        };
      }
    } else {
      return {
        __typename: "error",
        name: "concept error, see detail",
        detail: "You cannot delete a product from a ticket",
      };
    }
  } catch (err) {
    return { __typename: "error", name: "unknow", detail: err.message };
  }
}
/**
 * ONLY IF PLACE STATUS IS CART
 * Add new product to existing order
 *
 * If the product already exist in the order only modify the quantity
 * @param  {} orderId
 * @param  {} productId
 * @param  {} quantity
 */
async function addProductToOrder(orderId, productId, quantity, userId) {
  try {
    let order = await Order.findOne({
      where: { id: orderId, placeStatus: "cart" },
    });
    if (!order) {
      order = await Order.create({ userId: userId });
    }
    if (order.placeStatus === "cart") {
      const newProduct = await Product.findOne({
        where: {
          id: productId,
        },
      });
      let has = await order.addProduct(newProduct, {
        through: { price: newProduct.price, quantity },
      });
      return { __typename: "booleanResponse", boolean: true };
    } else {
      return {
        __typename: "error",
        name: "concept error, see detail",
        detail: "You cannot add a product in a ticket order",
      };
    }
  } catch (err) {
    return { __typename: "error", name: "unknow", detail: err.message };
  }
}

/**
 * ONLY IF PLACESTATUS IS CART
 * Delete order
 * @param  {Int} orderId
 */
async function deleteOrder(orderId) {
  try {
    const order = await Order.findOne({ where: { id: orderId } });
    if (!order)
      return {
        __typename: "error",
        name: "not exist, see detail",
        detail: `The order with id ${orderId} dont exist`,
      };
    if (order.placeStatus === "cart") {
      await order.destroy();
      return { __typename: "booleanResponse", boolean: true };
    } else {
      return {
        __typename: "error",
        name: "concept error, see detail",
        detail: "You cannot delete a order in place status ticket",
      };
    }
  } catch (err) {
    return { __typename: "error", name: "unknow", detail: err.message };
  }
}
/**
 * Modify the place status of the orden to "ticket"
 * @param  {Int} orderId
 * @param  {String} status  only acept value "cart" or "ticket"
 */
async function updateOrderToTicket(orderId) {
  try {
    const order = await Order.findOne({
      where: { id: orderId },
    });
    if (!order)
      return {
        __typename: "error",
        name: "not exist, see detail",
        detail: `The order with id ${orderId} dont exist`,
      };
    order.placeStatus = "ticket";
    await order.save();

    return { __typename: "booleanResponse", boolean: true };
  } catch (err) {
    return { __typename: "error", name: "unknow", detail: err.message };
  }
}
/**
 * Modify the status of the order between unpaid, paid, sent, received
 *  See: model order datatype ENUM
 * @param  {Int} orderId
 * @param  {String} status string between unpaid, paid, sent, received
 */
async function modifyOrderStatus(orderId, status) {
  try {
    const order = await Order.findOne({
      where: { id: orderId },
    });
    if (status === "cancelled" && order.placeStatus === "ticket") {
      order.cancelled = true;
      await order.save();
      return { __typename: "booleanResponse", boolean: true };
    } else if (order.placeStatus === "ticket") {
      order.status = status;
      order.cancelled = false;
      await order.save();
      return { __typename: "booleanResponse", boolean: true };
    } else {
      return {
        __typename: "error",
        name: "concept error, see detail",
        detail: "You cannot edit the status of an order in cart status",
      };
    }
  } catch (err) {
    return { __typename: "error", name: "unknow", detail: err.message };
  }
}

// esta función fue implementada colo para el uso esclusivo en data population
// de ser usada para conectar con el front debe modificarse a conveniencia,
// en principio recibe solo el id y un booleano con el cual cambiar el la propiedad
// cancelled(se deja abierto en el caso de equivocación)
async function modifyOrderCancelled(orderId, cancelled) {
  try {
    const order = await Order.findOne({
      where: { id: orderId },
    });
    if (order.placeStatus === "ticket") {
      order.cancelled = cancelled;
      await order.save();
      return { __typename: "booleanResponse", boolean: true };
    } else {
      return {
        __typename: "error",
        name: "concept error, see detail",
        detail: "You cannot edit the status of an order in cart status",
      };
    }
  } catch (err) {
    return { __typename: "error", name: "unknow", detail: err.message };
  }
}

async function incrementQuantity(orderId, productId, quantity) {
  let obj = {};
  if (quantity) obj.quantity = quantity;
  try {
    let order = await Lineal_Order.findOne({
      where: { orderId: orderId, productId: productId },
    });
    order.increment(["quantity"], { by: 1 });
    return { __typename: "booleanResponse", boolean: true };
  } catch (err) {
    return { __typename: "error", name: "error", detail: err.message };
  }
}

async function decrementQuantity(orderId, productId, quantity) {
  let obj = {};

  if (quantity) obj.quantity = quantity;
  try {
    let order = await Lineal_Order.findOne({
      where: { orderId: orderId, productId: productId },
    });
    order.decrement(["quantity"], { by: 1 });
    return { __typename: "booleanResponse", boolean: true };
  } catch (err) {
    return { __typename: "error", name: "error", detail: err.message };
  }
}

module.exports = {
  getAllOrders,
  getOrdersByUserIdInCart,
  getOrdersByUserIdInTicket,
  getOrderById,
  createOrder,
  deleteProductOrder,
  addProductToOrder,
  deleteOrder,
  updateOrderToTicket,
  modifyOrderStatus,
  updateOrderPrices,
  incrementQuantity,
  decrementQuantity,
  modifyOrderCancelled,
  getAllOrdersUser,
};
