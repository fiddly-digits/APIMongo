require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

// * App de Express
const app = express();
app.use(express.json()); //! Parsea todo a JSON -> Es un Middleware

/*
 * Middleware
 * - Un middleware nos sirve para poder realizar codigo antes de los endpoints.
 * - Son sincronos, se hacen en orden
 * - Tienen acceso a la request y a la response
 * - Tienen una palabra llamada next() -> que indica que puedes continuar.
 */
//req.body['createdAt'] = new Date();
//   console.log('primer middleware next', next);

// ! Endpoint que devuelve el tipo de metodo
app.use((req, res, next) => {
  console.log('Endpoint Type:', req.method);
  next();
});
app.use((req, res, next) => {
  console.log('segundo middleware');
  next();
});

// ! si queremos un middleware para un endopoint en especifico lo ponemos como segundo parametro en el endpoint
// ! Middleware no tiene acceso a la ruta
// ! Ese middleware tiene que ser creado como una funcion

// ! Envia un status de que se esta creando un koder
const getKoderMiddleware = (req, res, next) => {
  console.log('Getting Koder...');
  next();
};

// ! Chequea el objeto y si esta vacio, manda un error de que no envio nada
const checkObjectMiddleware = (req, res, next) => {
  let keys = Object.keys(req.body);
  if (!keys.length) {
    res.status(400);
    res.json({ message: 'Object is Empty' });
    return;
  }
  console.log();
  next();
};

const middlewareEncapsulado = (req, res, next) => {
  console.log('Middleware Encapsulado');
  next();
};

const { DB_USERNAME, DB_PASSWORD, DB_HOST, DB_NAME } = process.env;
const dbURL = `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}/${DB_NAME}`;

/*
 * Colecciones
 * Documentos -> Schemas/Models
 */

const koderSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 3,
    maxlength: 10,
    required: true
  },
  age: {
    type: Number,
    required: true,
    min: 18,
    max: 100
  },
  generation: {
    type: String
  },
  module: {
    type: String
  },
  sex: {
    type: String,
    enum: ['f', 'm', 'o']
  }
});

// ! Modelo -> Capitalizado y en Singular
const Koder = mongoose.model('Koders', koderSchema, 'Koders');

app.get('/', (req, res) => {
  res.json('Estamos en el endpoint de Home');
});

// ! Get All Koders o por filtrar por query params
app.get('/koders', async (req, res) => {
  // ! accedemos a la BD

  try {
    const koders = await Koder.find(req.query); // ! Traemos todos los elementos dentro de nuestra BD
    res.json({
      success: true,
      data: koders
    });
  } catch (err) {
    res.status(400);
    res.json({ success: false, message: err.message });
  }
});

// ! Get Koder By ID

app.get('/koders/:id', getKoderMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const selectedKoder = await Koder.findById(id).exec();
    if (!selectedKoder) {
      res.status(404);
      res.json({ success: false, message: 'The ID was non existant' });
    } else {
      res.json({
        success: true,
        data: selectedKoder
      });
    }
  } catch (err) {
    res.status(400);
    res.json({ success: false, message: err.message });
  }
});

// ! Post Koder
app.post('/koders', checkObjectMiddleware, async (req, res) => {
  console.log(req.body);
  try {
    const newKoder = await Koder.create(req.body);
    res.status(201);
    res.json({
      success: true,
      data: newKoder
    });
  } catch (err) {
    res.status(400);
    res.json({
      success: false,
      message: err.message
    });
  }
});

// ! Delete Koder
app.delete('/koders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deletedKoder = await Koder.findByIdAndDelete(id);
    let statusCode = 200;
    let responseParams = {
      success: true,
      message: 'Koder was eliminated successfully'
    };

    if (!deletedKoder) {
      responseParams.success = false;
      responseParams.message = 'The ID was non existant';
      statusCode = 404;
    }
    res.status(statusCode);
    res.json(responseParams);
  } catch (err) {
    res.status(400);
    res.json({
      success: false,
      message: err.message
    });
  }
});

// ! Tarea, update un Koder
app.patch('/koders/:id', async (req, res) => {
  const { params, body } = req;
  try {
    const modifiedKoder = await Koder.findByIdAndUpdate(params.id, body, {
      //strict: true,
      returnDocument: 'after'
    });
    console.log(modifiedKoder);
    let statusCode = 200;
    let responseParams = {
      success: true,
      message: 'Koder was updated successfully'
    };

    if (!modifiedKoder) {
      responseParams.success = false;
      responseParams.message = 'The ID was non existant';
      statusCode = 404;
    }

    res.status(statusCode);
    res.json(responseParams);
  } catch (err) {
    res.status(400);
    res.json({
      success: false,
      message: err.message
    });
  }
});

/*
 * Hacer un middleware para toda la aplicacion que imprima el metodo en consola
 * Hacer un middleware para el endpoint de obtener un koder donde imprima en consola obteniendo Koder
 * Hacer un middleware para el endpoint de crear koder si no nos mandan informacion, regresar "estas mandando un objeto vacio"
 */

// ! Conexion a la BD
mongoose
  .connect(dbURL)
  .then(() => {
    console.log('DB Connection Succesful');
    // ! Primero se conecta a la BD y en su then se activa la DB con listen
    app.listen(8080, () => {
      console.log('Server is UP!');
    });
  })
  .catch((err) => {
    console.log('Error: ', err);
  });
