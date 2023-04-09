// Load required modules
const express = require('express');
const bodyParser = require('body-parser');
const pg = require('pg');
const cors = require("cors");
const path = require('path');
const logger = require('./utils/logger');

// Configure database connection
const pool = new pg.Pool({
  user: 'me',
  host: 'dpg-cgb0uu5269v4icojn4sg-a.frankfurt-postgres.render.com',
  database: 'myfirstdatabase',
  password: 'PUkUpEya1CKkHDAC010LPP0G5zYavFID',
  port: 5432,
  ssl: true,
  // connectionString:"postgres://me:PUkUpEya1CKkHDAC010LPP0G5zYavFID@dpg-cgb0uu5269v4icojn4sg-a.frankfurt-postgres.render.com/myfirstdatabase"
});

pool.on('error', (err, client) => {
  console.log(err)
});

// Create Express app
const app = express();

// Use middleware to parse JSON requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// allowing multiple origins
app.use(cors());
app.use((req, res, next) => {
  const allowedOrigins = ['*'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', true);
  return next();
});

// Handle GET request to retrieve current products
app.get("/products", (req, res) => {
  try {
    pool.query("SELECT * FROM products ORDER BY productname", (err, result) => {
      if (err) throw err;

      res.status(200).json({
        err: null,
        products: result.rows,

      });
      
    });
  } catch (error) {
    res.status(500).json({
      err: error.message,
      products: null,
    });
  }
});

// Handle GET request to retrieve current product quantity
app.get("/products/:id", (req, res) => {
  const id = req.params.id;
  try {
    pool.query('SELECT * FROM products WHERE id = $1', [id], (err, result) => {
      if (err) throw err;

      res.status(200).json({
        err: null,
        product: result.rows[0]
      });
    });
  } catch (error) {
    res.status(500).json({
      err: error.message,
      product: null
    });
  }
});

// Handle POST request to add or update product quantity
app.post('/product', async (req, res) => {
  const productname = req.body.productname;
  const quantity = req.body.quantity;
  try {
    pool.query('INSERT INTO products (productname, quantity) VALUES ($1, $2)', [productname, quantity], (err, result) => {

      if (err) throw err;
      res.status(201).json({
        err: null,
        product: result.rows[0]
      });
      logger.info(`created, ${productname} ${quantity}`)
    });
    
  } catch (error) {
    res.status(500).json({
      err: error.message,
      product: null
    });
  }
});

// Handle UPDATE request to delete product
app.put('/products/:id', async (req, res) => {
  const id = req.params.id;
  const { productname, quantity } = req.body;
  try {
    pool.query('UPDATE products SET productname = $1, quantity = $2 WHERE id = $3', [productname, quantity, id], (err, result) => {

      if (err) throw err;
      res.status(200).json({
        err: null,
        product: result.rows[0]
      });
      logger.info(`updated, ${productname} ${quantity}`)
    });
    
  } catch (error) {
    res.status(500).json({
      err: error.message,
      product: null
    });
  }
});

// Handle DELETE request to delete product
app.delete('/products/:id', async (req, res) => {
  const id = req.params.id;
  try {
    pool.query('DELETE FROM products WHERE id = $1', [id], (err, result) => {
      
      if (err) throw err;
      res.status(200).json({
        err: null,
        product: result.rows[0]
      });
      logger.info('deleted');
    });
    
  } catch (error) {
    res.status(500).json({
      err: error.message,
      product: null
    });
  }
});

app.get('/logs', async (req, res) => {
  const logFilePath = path.join(__dirname, 'server-info.log');
  res.download(logFilePath);
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
