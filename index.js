//Importaciones
const express = require ('express');// como siempre importar libreria de express
const { Server: HttpServer } = require ('http');//los dos puntos son para cambiarle el nombre al servidor
const { Server: SocketServer } = require ('socket.io');//importamos libreria de websocket
const Products = require("./models/data");
const Messages = require ('./models/messages')
const dbConfig = require ('./db/config')
const routes = require('./routers/app.routers')
const MongoStore = require('connect-mongo')
const envConfig = require ('./env.config');
const passport = require('./middlewares/passport');
const MongoContainer = require('./models/containers/Mongodb.container')

const PORT = process.env.PORT || 8080;// definimos puerto
const app = express();//definimos constante para nuestro servidor

const httpServer = new HttpServer(app);
const io = new SocketServer(httpServer);//estos dos ultimos pasos se hacen para imprementar express y socket al tiempo.
const productsDB = new Products('products', dbConfig.mariaDB);//mi clase de productos
const messagesDB = new Messages("messages", dbConfig.sqlite)
const session = require('express-session');




//Middlewares
app.use(express.static('./public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//Configuracion de Sessions
app.use(session({
  /* store: MongoStore.create({mongoUrl:`mongodb+srv://mayricca5:${envConfig.DB_PASSWORD}@youneedsushi.nuk3cgy.mongodb.net/users?retryWrites=true&w=majority`}), */
  secret: envConfig.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  store: MongoStore.create({
    mongoUrl: dbConfig.mongodb.connectTo('sessions')
  }),
  cookie: {
      maxAge: 60000
  }
}))
app.use(passport.initialize());
app.use(passport.session());

//Motor de plantilla
app.set('view engine', 'ejs');

//Routes
app.use(routes)


//Variable
const users = [];

//Socket
io.on("connection", async (socket) => {
    console.log(`New User conected!`);
    console.log(`User ID: ${socket.id}`)

//socket.emit('server-message', "Mensaje desde el servidor")
   const products = await productsDB.getAll();
   socket.emit('products', products);

   socket.on('newProduct', async (newProduct) => {
       await productsDB.save(newProduct);
       const updateProducts = await productsDB.getAll(); 
       io.emit('products', updateProducts)      
    });   


    /* io.emit("message", [...messages]); */

    socket.on("new-user", (username) => {
     const newUser = {
       id: socket.id,
       username: username,
     };
     users.push(newUser);
    });
    
    const messages= await messagesDB.getMessages();
    socket.emit("messages", messages);
    /* console.log(messages) */
    socket.on("new-message", async (msj) => {
        await messagesDB.addMessage({email: msj.user, message: msj.message, date: new Date().toLocaleDateString()});
        const messagesLog = await messagesDB.getMessages();
        io.emit("messages", {messagesLog});
    })
})



//Conexión del Servidor
const connectedServer = httpServer.listen(PORT, () => {
    MongoContainer.connect()
    console.log(`🚀Server active and runing on port: ${PORT}`);
  });
  
  connectedServer.on("error", (error) => {
    console.log(`error:`, error.message);
  });