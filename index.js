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
        const usersCollection = db.collection("users");
        const applicationsCollection = db.collection("applications")
        const paymentCollection = db.collection("payments")


        app.get("/api/startup/:email", async (req, res) => {
            const { email } = req.params;
            const result = await startupsCollection.findOne({ founder_email: email });
            res.send(result)

        })


        app.post("/api/startups", async (req, res) => {
            const data = req.body
            console.log(data);

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
            }

            const result = await startupsCollection.insertOne({
                ...addData,
                status: "pending",
            });



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

            }

            const result = await startupsCollection.updateOne(
                { _id: new ObjectId(id) },
                {
                    $set: updateData
                }
            );



            res.send(result);

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


        // Get all opportunities of a startup
        app.get("/api/opportunities/startup/:startupId", async (req, res) => {
            const { startupId } = req.params;

            const result = await opportunitiesCollection
                .find({ startup_id: startupId })
                .toArray();

            res.send(result);
        });






        app.get("/api/opportunities", async (req, res) => {
            try {
                const { role, skill, work, industry } = req.query;

                const filter = {};

                // Role Title Search
                if (role) {
                    filter.role_title = {
                        $regex: role,
                        $options: "i",
                    };
                }

                // Required Skills Search
                if (skill) {
                    filter.required_skills = {
                        $regex: skill,
                        $options: "i",
                    };
                }

                // Work Type Filter
                if (work) {
                    filter.work_type = {
                        $in: [work]
                    };
                }

                if (industry) {
                    filter.industry = {
                        $in: [industry]
                    };
                }

                const opportunities = await opportunitiesCollection
                    .find(filter)
                    .toArray();

                res.send(opportunities);
            } catch (error) {
                console.error(error);
                res.status(500).send({
                    message: "Internal Server Error",
                });
            }
        });


        // Get single opportunity
        app.get("/api/opportunities/:id", async (req, res) => {
            const { id } = req.params;

            const opportunity = await opportunitiesCollection.findOne({
                _id: new ObjectId(id),
            });

            if (!opportunity) {
                return res.status(404).send({ message: "Opportunity not found" });
            }

            const startup = await startupsCollection.findOne({
                _id: new ObjectId(opportunity.startup_id),
            });

            res.send({
                ...opportunity,
                startup_name: startup?.startup_name,
                logo: startup?.logo,
                industry: startup?.industry,
            });
        });




        app.post("/api/opportunities", async (req, res) => {

            const data = req.body;


            const founderEmail = data.founder_email;


            const userCollection = db.collection("user");


            const founder = await userCollection.findOne({
                email: founderEmail
            });



            const opportunityCount =
                await opportunitiesCollection.countDocuments({
                    founder_email: founderEmail
                });



            if (opportunityCount >= 3 && !founder?.isPremium) {

                return res.status(401).send({
                    message: "Premium required"
                });

            }



            const result = await opportunitiesCollection.insertOne({
                ...data,
                createdAt: new Date()
            });


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