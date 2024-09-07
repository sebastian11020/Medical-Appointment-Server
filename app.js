const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const filePath = 'citas.json';
const port = 3000;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

app.use(express.json());
let appointmentCounter = 0;

function readDataFromFile() {
  if (fs.existsSync(filePath)) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const data = fileContent.trim() ? JSON.parse(fileContent) : [];
      console.log('Datos leídos del archivo:', data);
      return data;
    } catch (error) {
      console.error('Error al leer el archivo JSON:', error.message);
      return [];
    }
  } else {
    console.warn('El archivo JSON no existe.');
    return [];
  }
}

function writeDataToFile(data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log('Datos escritos en el archivo:', data);
  } catch (error) {
    console.error('Error al escribir en el archivo JSON:', error.message);
  }
}

app.post('/save', (req, res) => {
  console.log('Solicitud POST recibida para guardar datos:', req.body);
  const dataArray = Array.isArray(req.body) ? req.body : [req.body];
  for (const item of dataArray) {
    if (typeof item.id === 'undefined' || typeof item.arrivalTime === 'undefined') {
      console.warn('Solicitud incorrecta. Cada objeto debe tener un ID y una fecha programada.');
      return res.status(400).send('Cada objeto debe tener un ID y una fecha programada.');
    }
  }

  let existingData = readDataFromFile();

  for (const data of dataArray) {
    const existingItem = existingData.find(item => item.id === data.id);
    if (existingItem) {
      console.warn(`El ID ${data.id} ya existe.`);
      return res.status(400).send(`La CC ${data.id} ya existe. Intenta con otro ID.`);
    }

    const sameTimeItem = existingData.find(item => item.arrivalTime === data.arrivalTime);
    if (sameTimeItem) {
      console.warn(`Ya existe una cita a la misma hora y el mismo día: ${data.arrivalTime}.`);
      return res.status(400).send(`Ya existe una cita a la misma hora y el mismo día: ${data.arrivalTime}.`);
    }
  }

  for (const data of dataArray) {
    const arrivalTime = new Date().toISOString();
    const newData = { ...data, arrivalTime: arrivalTime, modificationCount: 0 };
    existingData.push(newData);
  }

  writeDataToFile(existingData);
  console.log('Datos guardados correctamente.');
  res.send('Datos guardados correctamente.');
});

app.delete('/delete/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  console.log(`Solicitud DELETE recibida para eliminar cita con ID: ${id}`);

  let existingData = readDataFromFile();
  const index = existingData.findIndex(item => item.id === id);

  if (index === -1) {
    console.warn(`No se encontró una cita con el ID: ${id}`);
    return res.status(404).send(`No se encontró una cita con el ID: ${id}`);
  }

  existingData.splice(index, 1);
  writeDataToFile(existingData);
  console.log(`Cita con ID: ${id} eliminada correctamente.`);
  res.send(`Cita con ID: ${id} eliminada correctamente.`);
});

app.get('/', (req, res) => {
  res.send('¡Hola, mundo!');
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});