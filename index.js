const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY)
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
    const subscribeCartCollection = client.db('doctorAppoinment').collection('cart')
    const paymentCollection = client.db('doctorAppoinment').collection('payment')


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
      const user = userCollection.find();
      const result = await user.toArray()
      res.send(result)
  })

    // get all team member data
    app.get('/team', async(req, res) =>{
        const team =await teamMemberCollection.find().toArray();
        res.send(team)
    })
    // added a new team member
    app.post('/team', verifyJWT, verifyAdmin, async(req, res)=>{
      const newTeamMember = req.body;
      const result = await teamMemberCollection.insertOne(newTeamMember)
      res.send(result)
    })
    //  delete a teammmber by id
    app.delete("/team/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await teamMemberCollection.deleteOne(query);
      res.send(result);
    });
    // update team data update from client to backend
    app.put('/team/:id', async(req, res) =>{
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const body = req.body;
      const updateTeamMember = {
        $set: {
          image: body.image,
          name: body.name,
          phone: body.phone,
          specialist : body.specialist,
          degree : body.degree, 
          educationalBackground : body.educationalBackground, 
          experienceAndSkills : body.experienceAndSkills, 
          phone : body.phone, 
          registrationNumber : body.registrationNumber, 
          email : body.email, 
          selfDescription :body.selfDescription, 
          facebook :body.facebook, instagram :body.instagram, 
          twitter:body.twitter
        },
      };
      const result = await teamMemberCollection.updateOne(query, updateTeamMember);
      res.send(result);
    });
    // get all single team details data
    app.get('/team/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}
      const result = await teamMemberCollection.findOne(query)
      res.send(result)
    })

    // get all appoinment data
    app.post('/appoinment', verifyJWT, async(req, res) =>{
      const appoinment = req.body;
      const result = await appoinmentBookingCollection.insertOne(appoinment)
      res.send(result)
  })
  // get all appoinment data
    app.get('/appoinment', verifyJWT,verifyAdmin, async(req, res) =>{
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
  //  delete a blog by id
  app.delete("/blogs/:id", verifyJWT, verifyAdmin, async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await blogCollection.deleteOne(query);
    res.send(result);
  });
  // update blog data update from client to backend
  app.put('/blogs/:id', async(req, res) =>{
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const body = req.body;
    const updateBlogs = {
      $set: {
        image: body.image,
        title: body.title,
        category : body.category,
        details : body.details, 
        testimonial : body.testimonial, 
        additional_description : body.additional_description, 
        capabilities_details : body.capabilities_details, 
      },
    };
    const result = await blogCollection.updateOne(query, updateBlogs);
    res.send(result);
  });
  // added new blog 
  app.post('/blogs', verifyJWT, verifyAdmin, async(req, res)=>{
    const newTeamBlog = req.body;
    const result = await blogCollection.insertOne(newTeamBlog)
    res.send(result)
  })
  // get subscribe plan data
  app.post('/subscribecart', async(req, res) =>{
      const cart = req.body;
      const result = await subscribeCartCollection.insertOne(cart)
      res.send(result) 
  })
  app.get('/subscribecart' , async(req, res) =>{
    const email = req.query.email;
    const query = { email: email };
    const result = await subscribeCartCollection.find(query).toArray();
    res.send(result);
  })
  //  delete cart
  app.delete("/subscribecart/:id", verifyJWT, async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await subscribeCartCollection.deleteOne(query);
    res.send(result);
  });
  // create payment intent
  app.post("/create-payment-intent", verifyJWT, async(req, res) =>{
    const { price } = req.body;
    const amount =  price * 100;
    console.log(price, amount);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "usd",
      payment_method_types:['card'],
    });
    res.send({
      clientSecret: paymentIntent.client_secret
    })
  })
  app.get('/payments/:email', verifyJWT, async (req, res) => {
    const query = { email: req.params.email }
    if (req.params.email !== req.decoded.email) {
      return res.status(403).send({ message: 'forbidden access' });
    }
    const result = await paymentCollection.find(query).toArray();
    res.send(result);
  })
    //   Payment related api 
    app.post('/payments', async (req, res) => {
      const payment = req.body;
      const paymentResult = await paymentCollection.insertOne(payment);

      //  carefully delete each item from the cart
      console.log('payment infoo', payment);
      const query = {
        _id: {
          $in: payment.cartIds.map(id => new ObjectId(id))
        }
      };

      const deleteResult = await subscribeCartCollection.deleteMany(query);

      res.send({ paymentResult, deleteResult });
    })

    // get a single payment data by user id
    app.get('/payments' , async(req, res) =>{
      const allPayment = req.body;
      const email = req.query.email;
      const query = { email: email };
      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    })
    // get all payment history data
    app.get('/payment-history', verifyJWT, verifyAdmin, async(req, res) =>{
      const result = await paymentCollection.find().toArray();
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