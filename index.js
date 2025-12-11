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

        // ---Tuitions Releted Apis--- //

        // Get all tuitions
        app.get('/tuitions', async (req, res) => {
            try {
                const result = await allTuitions.find().project({ schedule: 0, startDate: 0, postedBy: 0 }).toArray()
                res.send(result)
            }
            catch {
                res.status(500).send({ message: 'Failed to fetch tuitions data' });
            }
        })

        // Get tuitions status 
        app.get('/tuitions/approved', async (req, res) => {
            try {
                const result = await allTuitions.find({ status: 'Approved' }).toArray()
                res.send(result)
            }
            catch {
                res.status(500).send({ message: 'Failed to get tuitions status data' });
            }
        })

        app.get('/tuitions/pending', async (req, res) => {
            try {
                const result = await allTuitions.find({ status: 'Pending' }).toArray()
                res.send(result)
            }
            catch {
                res.status(500).send({ message: 'Failed to get tuitions status data' });
            }
        })

        // Post tuition
        app.post('/tuitions', async (req, res) => {
            try {
                const tuition = req.body
                const result = await allTuitions.insertOne(tuition)
                res.send(result)
            }
            catch {
                res.status(500).send({ message: 'Failed to post tuitions data' });
            }
        })

        // Get tuition by email
        app.get('/my-tuitions', async (req, res) => {
            try {
                const { email } = req.query
                const result = await allTuitions.find({ "postedBy.email": email }).toArray()
                res.send(result)
            }
            catch {
                res.status(500).send({ message: 'Failed to get tuitions data' });
            }
        })

        // Delete tuition
        app.delete('/tuitions/:id', async (req, res) => {
            try {
                const { id } = req.params
                const result = await allTuitions.deleteOne({ _id: new ObjectId(id) })
                res.send(result)
            }
            catch {
                res.status(500).send({ message: 'Failed to delete tuition data' });
            }
        })

        // Update tuition
        app.patch('/tuitions/:id', async (req, res) => {
            try {
                const id = req.params.id
                const data = req.body
                // console.log(id);
                // console.log(data);

                const query = { _id: new ObjectId(id) }
                // console.log(req.body);
                const updatedData = {
                    $set: data
                }
                const result = await allTuitions.updateOne(query, updatedData)
                res.send(result)
            }
            catch {
                res.status(500).send({ message: 'Failed to update tuition data' });
            }
        })

        // Tuition details
        app.get('/tuitions/:id', async (req, res) => {
            try {
                const { id } = req.params
                const result = await allTuitions.findOne({ _id: new ObjectId(id) })
                res.send(result)
            }
            catch {
                res.status(500).send({ message: 'Failed to fetch tuitions details data' })
            }
        })

        // ---Tutors Releted Apis--- //

        // Get all tutors
        app.get('/tutors', async (req, res) => {
            try {
                const result = await allTutors.find().project({ email: 0, about: 0, education: 0 }).toArray()
                res.send(result)
            }
            catch {
                res.status(500).send({ message: 'Failed to fetch tutors data' });
            }
        })

        // Tutor details
        app.get('/tutors/:id', async (req, res) => {
            try {
                const { id } = req.params
                const result = await allTutors.findOne({ _id: new ObjectId(id) })
                res.send(result)
            }
            catch {
                res.status(500).send({ message: 'Failed to fetch tutor details' })
            }
        })

        // Post user details
        app.post('/users', async (req, res) => {
            try {
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
            }
            catch {
                res.status(500).send({ message: 'Failed to post role data' })
            }
        })

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

        // ---User Releted Apis--- //

        // Update user info
        app.patch('/users/:id', async (req, res) => {
            try {
                const { id } = req.params
                const { name } = req.body
                const query = { _id: new ObjectId(id) }
                const update = {
                    $set: {
                        name: name
                    }
                }
                const result = await allUsers.updateOne(query, update)
                res.send(result)
            }
            catch {
                res.status(500).send({ message: 'Failed to update user info' })
            }
        })

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
