const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000;

//middle ware  
app.use(cors());
app.use(express.json())

const verifyJWT = (req, res, next) =>{
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({error: true, message:'unauthorizes access'})
  }
  // bearer token

  const token = authorization.split(' ')[1]

  // verify a token symmetric

  jwt.verify(token, process.env.ACCESS_TOEKN_SECRET, function(err, decoded) {
    if (err) {
      return res.status(401).send({error: true, message:'unauthorizes access'})
    }
    console.log(decoded) // bar

    req.decoded = decoded;
    next()
  });
 }

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.e60xkn0.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const userCollection = client.db('doctorAppoinment').collection('users')
    const teamMemberCollection = client.db('doctorAppoinment').collection('team')
    const appoinmentBookingCollection = client.db('doctorAppoinment').collection('appoinment')
    const serviceCollection = client.db('doctorAppoinment').collection('service')
    const pricingCollection = client.db('doctorAppoinment').collection('pricing')
    const testimonialCollection = client.db('doctorAppoinment').collection('testimonial')
    const blogCollection = client.db('doctorAppoinment').collection('blogs')


    // get a jwt token
    app.post('/jwt', (req, res) =>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOEKN_SECRET, { expiresIn: '1h' })
      res.send({token})
    })

    // verify admin
    const verifyAdmin = async(req, res, next) =>{
      const email = req.decoded.email;
      const query = {email : email}
      const user = await userCollection.findOne(query);
      if (user?.role !== 'admin') {
        return res.status(403).send({error: true, message:"forbidden message"})
      }
      next()
    }
    
    // get all user data by id
    app.post('/users', async(req, res) =>{
      const user = req.body;
      const query = {email: user.email}
      const exstingUser = await userCollection.findOne(query)
      if (exstingUser) {
       return res.send({message: 'User already exists'})
      }
      const result = await userCollection.insertOne(user)
      res.send(result)
  })
  // get verify admin 
  app.get('/users/admin/:email', verifyJWT, async(req, res) =>{
    const email = req.params.email;

    if (req.decoded.email !== email) {
     return res.send({admin: false})
    }
    const query = {email: email}
    const user = await userCollection.findOne(query)
    const result = {admin: user?.role === 'admin'}
    res.send(result)
  })

  // make admin on user 
  app.patch('/users/admin/:id', async(req, res) =>{
    const id = req.params.id;
    const filter = {_id: new ObjectId(id)}
    const updateDoc = {
      $set: { role: 'admin' },
    };
    const result = await userCollection.updateOne(filter, updateDoc)
    res.send(result)
  })

  // delete a user on admin dashboard
  app.delete("/users/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await userCollection.deleteOne(query);
    res.send(result);
  });

  // get all user data
    app.get('/users', verifyJWT, verifyAdmin, async(req, res) =>{
      const user = userCollection.find();console.log(user)
      const result = await user.toArray()
      res.send(result)
  })

    // get all team member data
    app.get('/team', async(req, res) =>{
        const team =await teamMemberCollection.find().toArray();
        res.send(team)
    })

    // get all single team details data
    app.get('/team/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}
      const result = await teamMemberCollection.findOne(query)
      res.send(result)
    })

    // get all appoinment data
    app.post('/appoinment', async(req, res) =>{
      const appoinment = req.body;
      console.log(appoinment)
      const result = await appoinmentBookingCollection.insertOne(appoinment)
      res.send(result)
  })
  // get all appoinment data
    app.get('/appoinment', async(req, res) =>{
      const appoinment =await appoinmentBookingCollection.find().toArray();
      res.send(appoinment)
  })
  
  // get all service data
  app.get('/service', async(req, res) =>{
    const result = await serviceCollection.find().toArray();
    res.send(result)
  })
  // get all single service details data
  app.get('/service/:id', async(req, res) =>{
    const id = req.params.id;
    const query = {_id : new ObjectId(id)}
    const result = await serviceCollection.findOne(query)
    res.send(result)
  })

  // get pricing plan data
  app.get('/pricing', async(req, res) =>{
    const result = await pricingCollection.find().toArray();
    console.log(result);
    res.send(result)
  })

  // get all testimonial data
  app.get('/testimonial' , async(req, res) =>{
    const result = await testimonialCollection.find().toArray();
    res.send(result)
  })

  // get all blog data
  app.get('/blogs' , async(req, res) =>{
    const result = await blogCollection.find().toArray();
    res.send(result)
  })
  // get a single blog data by id
  app.get('/blogs/:id', async(req, res) =>{
    const id = req.params.id;
    const query = {_id : new ObjectId(id)}
    const result = await blogCollection.findOne(query)
    res.send(result)
  })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) =>{
    res.send('Doctor Appoinment server is running')
})
app.listen(port, () =>{
    console.log(`server is running on PORT: ${port}`)
})