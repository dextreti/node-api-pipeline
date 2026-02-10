const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

function Bugs() {
    let x = 10;
    x = 20; // Dead store: Sonar dirá "para qué asignas 10 si luego pones 20"
    
    if (x === x) { // Bug: Comparación idéntica (siempre es true)
        return "esto es un error de lógica";
    }
}


function sendBug() {
    let x = 10;
    x = 20; // Dead store: Sonar dirá "para qué asignas 10 si luego pones 20"
    
    if (x === x) { // Bug: Comparación idéntica (siempre es true)
        return "esto es un error de lógica";
    }
}

// BUG PARA FORZAR FALLO EN JENKINS
function testingBugs() {
    let x = 10;
    x = 20; // Dead store: Sonar dirá "para qué asignas 10 si luego pones 20"
    
    if (x === x) { // Bug: Comparación idéntica (siempre es true)
        return "esto es un error de lógica";
    }
}

// Endpoint para probar la conexión con Northwind
app.get('/products', async (req, res) => {
  try {
    const products = await prisma.products.findMany({
      take: 10, // Solo traemos 10 para probar
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