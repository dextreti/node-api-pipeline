const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/products', async (req, res) => {
  try {
    const products = await prisma.products.findMany({
      take: 16, 
      select: {
        product_id: true,
        product_name: true,
        unit_price: true,
      }
    });
    res.json({
      status: "success",
      source: "Northwind Database",
      data: products
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

app.get('/', (req, res) => {
  res.send('API de Northwind funcionando con Prisma y Jenkins 🚀');
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});