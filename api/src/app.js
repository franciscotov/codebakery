const express = require('express');
const Stripe = require('stripe')
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const { graphqlHTTP } = require("express-graphql");
const cors = require('cors')
const {errorType} = require("./graphql/roots/errorsHandlers/errors")
require('./db.js');
const stripe = new Stripe(process.env.STRIPE_KEY)
const {Order} = require('./db')
/// mercadopago
const mercadopago = require("mercadopago"); //requerimos mercado pago

const {ACCESS_TOKEN} = process.env
mercadopago.configurations.setAccessToken(`${ACCESS_TOKEN}`); //access-key
/// mercadopago
const server = express();
const {schema, root} = require("./graphql/schema");
const { sendEmail } = require('./services/emailService');
const { getOrderById } = require('./services/orderService');
server.name = 'API';
server.use(express.json());
server.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
server.use(bodyParser.json({ limit: '50mb' }));
server.use(cookieParser());
server.use(morgan('dev'));
server.use(cors())
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000'); // update to match the domain you will make the request from
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});


const getErrorCode = errorName =>{
  
  return errorType[errorName]
}
///mercadopago
server.post("/create_preference", (req, res) => {   //ruta para crear preferencia
  let {lineal_order} = req.body
  let items =[]
  lineal_order.map((item ) =>{
    let newitem = {
      title: item.name ,
      unit_price: parseInt(item.price), 
      quantity: parseInt(item.quantity),
      description: item.name,     /// esto  
      picture_url: item.image,    /// esto
      id: item.id                 /// y esto se puede obtener haciendo un curl
    }                             /// posiblemente necesario para ticket 
    items.push(newitem)
  }) 
  let preference = {
		items: items,
    external_reference: JSON.stringify(req.body.id),
    payment_methods: {
      excluded_payment_types: [],
      installments: 1  //Cantidad maxima de cuotas
    },
		back_urls: {
			"success": "http://localhost:3001/feedback",            //luego modificar si se quiere redigir en cada caso
			"failure": "http://localhost:3000/cart",
			"pending": "http://localhost:3001/feedback"
		},
     };

	mercadopago.preferences.create(preference)
		.then(function (response) {
			res.json({id :response.body.id})      //responde con un id 
		}).catch(function (error) {
			
		});
});

server.get('/feedback', async function(req, res) {     //ruta que responde con el status del pago
  
  let orden = await Order.findByPk(parseInt(req.query.external_reference))
  let ordenCompleta = await getOrderById(orden.id)
  let salidaProducts = ``
  ordenCompleta.lineal_order.forEach(pro=>{
    salidaProducts += `<li>${pro.name} (${pro.quantity})</li>` 
  })
  if (req.query.status === 'approved'){
       let message = `<html><span>Hi santi</span> <br>
      <span>You order is created and your payment is processed </span> <br>
      <span>Your products:</span>
      <ul>
      ${salidaProducts}
      </ul>
      </html>`
      orden.placeStatus = 'ticket'
      orden.status = 'paid'
      await orden.save()
      await sendEmail(ordenCompleta.userId, `Order #${ordenCompleta.id} approved`, message)
    }else if (req.query.status === 'pending'){
      let message = `<html><span>Hi santi</span> <br>
      <span>You order is created and we are waiting the payment</span> <br>
      <span>Your products:</span>
      <ul>
      ${salidaProducts}
      </ul>
      </html>`
      orden.placeStatus = 'ticket'
      orden.status = 'unpaid'
      await orden.save()
      await sendEmail(orden.userId, `Order #${orden.id} pending`, `Hi!, ${orden.name} you order is created and we are waiting the payment`)
    }
  

	res.redirect('http://localhost:3000/catalogue')
  // modelo de req query: {
  //   collection_id: '1236059457',
  //   collection_status: 'approved',
  //   payment_id: '1236059457',
  //   status: 'approved',
  //   external_reference: '6',
  //   payment_type: 'credit_card',
  //   merchant_order_id: '2581349882',
  //   preference_id: '746923008-19cd6615-e5fb-4212-86d8-226331b91246',
  //   site_id: 'MLA',
  //   processing_mode: 'aggregator',
  //   merchant_account_id: 'null'
  // },

});

///mercadopago

server.use('/graphql', graphqlHTTP((req)=>{
  
  return ({
  schema: schema,
  extensions({
    result,
    variables,
    document
  }) {
    
    
    
    
  },
  rootValue: root,
  graphiql: true
  
})}))

server.post('/stripe/checkout',async(req,res)=>{
  //console.log('here')
  //console.log(req.body)
  //console.log(req.body.products.id)
  const {id,amount} = req.body
  try {
    const payment = await stripe.paymentIntents.create({
      amount,
      currency:'USD',
      description: "",
      payment_method:id,
      confirm:true
    })
    let order = await Order.findByPk(parseInt(req.body.products.id))
    let ordenCompleta = await getOrderById(order.id)
    let salidaProducts = ``
    ordenCompleta.lineal_order.forEach(pro=>{
      salidaProducts += `<li>${pro.name} (${pro.quantity})</li>` 
    })
    //console.log(payment.status)
    //console.log(order)
    if(payment.status === 'succeeded'){
      order.status = 'paid'
      order.placeStatus = 'ticket'
      await order.save()
      let message = `<html><span>Hi santi</span> <br>
      <span>You order is created and the payment is processed</span> <br>
      <span>Your products:</span>
      <ul>
      ${salidaProducts}
      </ul>
      </html>`
      await sendEmail(ordenCompleta.userId, `Order #${ordenCompleta.id} approved!`, message)
      res.json({message:'successfull transaction'})
    }
    
    
  } catch (error) {
    console.log(error)
    res.send({message:error.message})
  }
})

// Error catching endware.
server.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  const status = err.status || 500;
  const message = err.message || err;
  //console.error(err);
  res.status(status).send(message);
});

module.exports = server;
