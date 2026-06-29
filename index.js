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
        const usersCollection = db.collection("user");
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
                const { role, skill, work, level, page = 1,
                    limit = 6 } = req.query;


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

                    // console.log(work, work.split(","));

                    filter.work_type = {
                        $in: work.split(",")
                    };
                }

                if (level) {
                    filter.commitment_level = {
                        $in: [level]
                    };
                }


                const skip = (Number(page) - 1) * Number(limit);


                const opportunities = await opportunitiesCollection
                    .find(filter)
                    .skip(skip)
                    .limit(Number(limit))
                    .toArray();

                const total =
                    await opportunitiesCollection.countDocuments(filter);

                res.send({
                    opportunities,
                    total,
                    totalPages: Math.ceil(total / limit),
                    currentPage: Number(page)
                });

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


        app.patch("/api/user/upgrade-premium/:email", async (req, res) => {
            const { email } = req.params;

            // console.log("Email:", email);

            const user = await usersCollection.findOne({ email });

            // console.log(user);

            const result = await usersCollection.updateOne(
                { email },
                {
                    $set: {
                        isPremium: true,
                    },
                }
            );

            // console.log(result);

            res.send(result);
        });



        {/*Collaborator*/ }

        app.post("/api/applications", async (req, res) => {

            const data = req.body;


            const application = {

                opportunity_id: data.opportunity_id,

                applicant_email: data.applicant_email,

                portfolio_link: data.portfolio_link,

                motivation: data.motivation,

                status: "pending",

                applied_at: new Date()

            };


            const alreadyApplied =
                await applicationsCollection.findOne({
                    opportunity_id: data.opportunity_id,
                    applicant_email: data.applicant_email
                });



            if (alreadyApplied) {

                return res.status(400).send({
                    message: "Already applied"
                })

            }



            const result =
                await applicationsCollection.insertOne(application);


            res.send(result);

        })


        // get collaborator applications

        app.get("/api/applications/user/:email", async (req, res) => {


            const email = req.params.email;


            const applications =
                await applicationsCollection.find({
                    applicant_email: email
                }).toArray();




            const result = await Promise.all(

                applications.map(async (app) => {


                    const opportunity =
                        await opportunitiesCollection.findOne({
                            _id: new ObjectId(app.opportunity_id)
                        });



                    let startup = null;


                    if (opportunity?.startup_id) {

                        startup =
                            await startupsCollection.findOne({
                                _id: new ObjectId(opportunity.startup_id)
                            });

                    }



                    return {

                        ...app,

                        opportunity_name:
                            opportunity?.role_title || "Unknown",


                        startup_name:
                            startup?.startup_name || "Unknown"

                    }


                })

            );



            res.send(result);


        });

        app.get(
            "/api/applications/check/:email/:id",
            async (req, res) => {


                const { email, id } = req.params;


                const result =
                    await applicationsCollection.findOne({

                        applicant_email: email,

                        opportunity_id: id

                    });


                res.send(result);


            });



        {/*Founder site*/ }


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