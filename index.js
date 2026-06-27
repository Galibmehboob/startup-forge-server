const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const dotenv = require("dotenv")
dotenv.config();
const cors = require("cors")
const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.json());


const uri = process.env.MONGODB_URI;;



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
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });

        const db = client.db("startup_forge");
        const startupsCollection = db.collection("startups");
        const opportunitiesCollection = db.collection("opportunities")
        const applicationsCollection = db.collection("applications")
        const paymentCollection = db.collection("payments")


        app.get("/api/startup/:email", async (req, res) => {
            const { email } = req.params;
            const result = await startupsCollection.findOne({ founder_email: email });
            res.send(result)

        })


        app.post("/api/startups", async (req, res) => {
            const {
                startup_name,
                logo,
                industry,
                description,
                funding_stage,
                founder_email
            } = req.body;

            const addData = {
                startup_name,
                logo,
                industry,
                description,
                funding_stage,
                founder_email,
                createdAt: new Date(),
                status: "active"
            }

            const result = await startupsCollection.insertOne(addData);
            res.send(result)

        })

        app.patch("/api/startups/:id", async (req, res) => {
            const { id } = req.params;
            const {
                startup_name,
                logo,
                industry,
                description,
                funding_stage,
                founder_email
            } = req.body;

            const updateData = {
                startup_name,
                logo,
                industry,
                description,
                funding_stage,
                founder_email,
                createdAt: new Date(),
                status: "active"
            }

            const result = await startupsCollection.updateOne(
                { _id: new ObjectId(id) },
                {
                    $set: updateData
                }
            );

            res.send(result);

        });

        app.post("/api/opportunities", async (req, res) => {
            const data = req.body;


            const result = await opportunitiesCollection.insertOne({
                ...data
            });
            res.send(result)


        });
        // const {
        //     startup_name,
        //     logo,
        //     industry,
        //     description,
        //     funding_stage,
        //     founder_email
        // } = req.body;

        // const addData = {
        //     startup_name,
        //     logo,
        //     industry,
        //     description,
        //     funding_stage,
        //     founder_email,
        //     createdAt: new Date(),
        //     status: "active"
        // }

        app.get("/api/opportunities/:startupId", async (req, res) => {
            const { startupId } = req.params;

            const result = await opportunitiesCollection
                .find({ startup_id: startupId })
                .toArray();

            res.send(result);
        });

        // Get all opportunities of a startup
        app.get("/api/opportunities/startup/:startupId", async (req, res) => {
            const { startupId } = req.params;

            const result = await opportunitiesCollection
                .find({ startup_id: startupId })
                .toArray();

            res.send(result);
        });


        // Get single opportunity
        app.get("/api/opportunities/:id", async (req, res) => {
            const { id } = req.params;

            const result = await opportunitiesCollection.findOne({
                _id: new ObjectId(id),
            });

            res.send(result);
        });


        // Create opportunity
        app.post("/api/opportunities", async (req, res) => {
            const data = req.body;

            const result = await opportunitiesCollection.insertOne(data);

            res.send(result);
        });


        // Update opportunity
        app.patch("/api/opportunities/:id", async (req, res) => {
            const { id } = req.params;

            const data = req.body;

            const result = await opportunitiesCollection.updateOne(
                {
                    _id: new ObjectId(id),
                },
                {
                    $set: data,
                }
            );

            res.send(result);
        });


        // Delete opportunity
        app.delete("/api/opportunities/:id", async (req, res) => {
            const { id } = req.params;

            const result = await opportunitiesCollection.deleteOne({
                _id: new ObjectId(id),
            });

            res.send(result);
        });





        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);





app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});