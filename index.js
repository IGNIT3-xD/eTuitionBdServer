const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express()
const port = process.env.PORT || 5000

app.use(express.json())
app.use(cors())

const uri = process.env.URI;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();

        // Collections
        const db = client.db('eTuitionBd');
        const allTuitions = db.collection('all_tuitions');
        const allTutors = db.collection('all_tutors');
        const allUsers = db.collection('all_users');

        // -----Routes----- //

        // Get all tuitions
        try {
            app.get('/tuitions', async (req, res) => {
                const result = await allTuitions.find().project({ schedule: 0, startDate: 0, postedBy: 0 }).toArray()
                res.send(result)
            })
        }
        catch {
            res.status(500).send({ message: 'Failed to fetch tuitions data' });
        }

        // Tuition details
        try {
            app.get('/tuitions/:id', async (req, res) => {
                const { id } = req.params
                const result = await allTuitions.findOne({ _id: new ObjectId(id) })
                res.send(result)
            })
        }
        catch {
            res.status(500).send({ message: 'Failed to fetch tuitions details data' })
        }

        // Get all tutors
        try {
            app.get('/tutors', async (req, res) => {
                const result = await allTutors.find().project({ email: 0, about: 0, education: 0 }).toArray()
                res.send(result)
            })
        }
        catch {
            res.status(500).send({ message: 'Failed to fetch tutors data' });
        }

        // Tutor details
        try {
            app.get('/tutors/:id', async (req, res) => {
                const { id } = req.params
                const result = await allTutors.findOne({ _id: new ObjectId(id) })
                res.send(result)
            })
        }
        catch {
            res.status(500).send({ message: 'Failed to fetch tutor details' })
        }

        // Post user details
        try {
            app.post('/users', async (req, res) => {
                const user = req.body
                // console.log(user);

                const isExist = await allUsers.find({ email: user.email }).toArray()
                // console.log(!!isExist);
                if (!!isExist) {
                    // console.log('User already exist');
                    return res.send({ message: 'User already exist' })
                }

                const result = await allUsers.insertOne(user)
                res.send(result)
            })
        }
        catch {
            res.status(500).send({ message: 'Failed to post role data' })
        }

        // Get user by their email
        try {
            app.get('/users/:email', async (req, res) => {
                const { email } = req.params
                const result = await allUsers.findOne({ email })
                res.send(result)
            })
        }
        catch {
            res.status(500).send({ message: 'Failed to get user details' })
        }

        // Update user info
        try {
            app.patch('/users/:id', async (req, res) => {
                const { id } = req.params
                const {name} = req.body
                const query = { _id: new ObjectId(id) }
                const update = {
                    $set: {
                        name: name
                    }
                }
                const result = await allUsers.updateOne(query, update)
                res.send(result)
            })
        }
        catch {
            res.status(500).send({ message: 'Failed to update user info' })
        }

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Server is running')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
