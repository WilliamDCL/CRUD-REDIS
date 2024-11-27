require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('redis'); 

const app = express();


const client = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});

(async () => {
  try {
    await client.connect(); 
    console.log('Connected to Redis');
  } catch (error) {
    console.error('Redis connection error:', error);
  }
})();

client.on('error', (err) => console.error('Redis error:', err));

app.use(bodyParser.json());
app.use(express.static('public'));


app.post('/cars', async (req, res) => {
  const { id, brand, model, year, price } = req.body;

  if (!id || !brand || !model || !year || !price) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  try {
    await client.hSet(`car:${id}`, { id, brand, model, year, price });
    res.json({ message: 'Auto añadido/actualizado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/cars', async (req, res) => {
  try {
    const keys = await client.keys('car:*');
    if (keys.length === 0) {
      return res.json([]);
    }

    const cars = await Promise.all(
      keys.map(async (key) => {
        const car = await client.hGetAll(key);
        return car;
      })
    );
    res.json(cars);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/cars/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const car = await client.hGetAll(`car:${id}`);
    if (Object.keys(car).length === 0) {
      return res.status(404).json({ error: 'Auto no encontrado' });
    }
    res.json(car);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/cars/:id', async (req, res) => {
  const { brand, model, year, price } = req.body;
  const { id } = req.params;

  if (!brand || !model || !year || !price) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  try {
    const exists = await client.exists(`car:${id}`);
    if (!exists) {
      return res.status(404).json({ error: 'Auto no encontrado' });
    }

    await client.hSet(`car:${id}`, { brand, model, year, price });
    res.json({ message: 'Auto actualizado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/cars/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await client.del(`car:${id}`);
    if (result === 0) {
      return res.status(404).json({ error: 'Auto no encontrado' });
    }
    res.json({ message: 'Auto eliminado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
