const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express()
const port = process.env.PORT || 5000

app.use(express.json())
app.use(cors())
const stripe = require('stripe')(process.env.STRIPE_SECRET)

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
        const appliedTuitions = db.collection('applied_tuitions');
        const allPayments = db.collection('all_payments');

        // -----Routes----- //

        // ---Tuitions Releted Apis--- //

        // Get all tuitions
        app.get('/tuitions', async (req, res) => {
            try {
                const result = await allTuitions.find().toArray()
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

        // Applied tuitions
        app.post('/applied-tuition', async (req, res) => {
            try {
                const tutor = req.body
                const query = { email: tutor.email, tuitionId: tutor.tuitionId }
                const isExist = await appliedTuitions.findOne(query)
                if (!!isExist) {
                    return res.status(400).send({ message: 'Already applied' });
                }

                tutor.status = 'Pending'
                // console.log(tutor);
                const result = await appliedTuitions.insertOne(tutor)

                await allTutors.insertOne(tutor)

                res.send(result)
            }
            catch {
                res.status(500).send({ message: 'Failed to post tutor details' })
            }
        })

        // Check if tutor already applied
        app.get('/applied-tuition/check', async (req, res) => {
            try {
                const { email, tuitionId } = req.query
                const exist = await appliedTuitions.findOne({ email, tuitionId })
                res.send({ applied: !!exist })
            }
            catch {
                res.status(500).send({ message: 'Failed to get tutor' })
            }
        })

        // Get application by email
        app.get('/applied-tuition', async (req, res) => {
            try {
                const { email } = req.query
                const result = await appliedTuitions.find({ email: email }).toArray()
                res.send(result)
            }
            catch {
                res.status(500).send({ message: 'Failed to get tutor by email' })
            }
        })

        // Delete application
        app.delete('/applied-tuition/:id', async (req, res) => {
            try {
                const { id } = req.params
                const result = await appliedTuitions.deleteOne({ _id: new ObjectId(id) })
                res.send(result)
            }
            catch {
                res.status(500).send({ message: 'Failed to delete tutor data' })
            }
        })

        // Update application
        app.patch('/applied-tuition/:id', async (req, res) => {
            try {
                const { id } = req.params
                const query = { _id: new ObjectId(id) }
                const updateDet = req.body
                // console.log(updateDet);
                const update = {
                    $set: updateDet
                }
                const result = await appliedTuitions.updateOne(query, update)
                res.send(result)
            }
            catch {
                res.status(500).send({ message: 'Failed to delete tutor data' })
            }
        })

        // Get tutor application by students post
        app.get('/applied-tuition/student', async (req, res) => {
            try {
                const { studentEmail } = req.query
                const result = await appliedTuitions.find({ studentEmail: studentEmail }).toArray()
                res.send(result)
            }
            catch {
                res.status(500).send({ message: 'Failed to get tutor data' })
            }
        })

        // Get tutor (for testing purpose)
        app.get('/applied-tuition/student/:id', async (req, res) => {
            const result = await appliedTuitions.find({ _id: new ObjectId(req.params.id) }).toArray()
            res.send(result)
        })

        // Reject tutor
        app.patch('/applied-tuition/student/:id', async (req, res) => {
            try {
                const query = { _id: new ObjectId(req.params.id) }
                const updateDoc = {
                    $set: { status: 'Rejected' }
                }
                const result = await appliedTuitions.updateOne(query, updateDoc)
                res.send(result)
            }
            catch {
                res.status(500).send({ message: 'Failed to update tutor data' })
            }
        })

        // ---User Releted Apis--- //

        // Post user details
        app.post('/users', async (req, res) => {
            try {
                const user = req.body
                // console.log(user);

                const isExist = await allUsers.findOne({ email: user.email })
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
        app.get('/users/:email', async (req, res) => {
            try {
                const { email } = req.params
                const result = await allUsers.findOne({ email })
                res.send(result)
            }
            catch {
                res.status(500).send({ message: 'Failed to get user details' })
            }
        })

        // Update user info
        app.patch('/users/:id', async (req, res) => {
            try {
                const { id } = req.params
                const newInfo = req.body
                // console.log(newInfo);
                const query = { _id: new ObjectId(id) }
                const update = {
                    $set: newInfo
                }
                const result = await allUsers.updateOne(query, update)
                res.send(result)
            }
            catch {
                res.status(500).send({ message: 'Failed to update user info' })
            }
        })

        // Delete profile
        app.delete('/users/:id', async (req, res) => {
            try {
                const { id } = req.params
                const result = await allUsers.deleteOne({ _id: new ObjectId(id) })
                res.send(result)
            }
            catch {
                res.status(500).send({ message: 'Failed to delete profile' })
            }
        })

        // Get all users
        app.get('/users', async (req, res) => {
            try {
                const result = await allUsers.find().toArray()
                res.send(result)
            }
            catch {
                res.status(500).send({ message: 'Failed to get user' })
            }
        })

        // Update role
        app.patch('/users/role/:id', async (req, res) => {
            const { role } = req.body
            // console.log(role);
            try {
                const query = { _id: new ObjectId(req.params.id) }
                const update = {
                    $set: {
                        role: role
                    }
                }
                const result = await allUsers.updateOne(query, update)
                res.send(result)
            }
            catch {
                res.status(500).send({ message: 'Failed to update user role' })
            }
        })

        // ---Payment releted api's--- //

        // fire payment
        app.post('/create-checkout-session', async (req, res) => {
            const paymentInfo = req.body
            // console.log(paymentInfo);

            const session = await stripe.checkout.sessions.create({
                line_items: [
                    {
                        price_data: {
                            currency: 'bdt',
                            product_data: {
                                name: `Please, pay to ${paymentInfo.name}`
                            },
                            unit_amount: paymentInfo.rate * 100,
                        },
                        quantity: 1
                    },
                ],
                mode: 'payment',
                customer_email: paymentInfo.studentEmail,
                metadata: {
                    tuitionId: paymentInfo.tuitionId,
                    postId: paymentInfo.id,
                    studentEmail: paymentInfo.studentEmail,
                    tutorEmail: paymentInfo.tutorEmail
                },
                success_url: `${process.env.SITE_URL}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.SITE_URL}/dashboard/payment-cancel`,
            })

            // console.log(session);
            res.send({ url: session.url })
        })

        // If payment success
        app.patch('/payment-success', async (req, res) => {
            const { session_id } = req.query
            const session = await stripe.checkout.sessions.retrieve(session_id);
            // console.log(session);
            const transcationId = session.payment_intent;
            // console.log(transcationId);

            // Prevent duplication
            const isExist = await allPayments.findOne({ transcationId: transcationId })
            if (!!isExist) {
                return res.send({ messege: "Already exist" })
            }

            if (session.payment_status === 'paid') {
                const id = session.metadata.postId
                const query = { _id: new ObjectId(id) }
                const update = {
                    $set: {
                        status: 'Paid'
                    }
                }
                const result = await appliedTuitions.updateOne(query, update)

                // Payment collections added
                const paymentDetails = {
                    transcationId: transcationId,
                    amount: session.amount_total / 100,
                    tutorEmail: session.metadata.tutorEmail,
                    studentEmail: session.metadata.studentEmail,
                    tuitionId: session.metadata.tuitionId,
                    postId: session.metadata.postId,
                    paymentStatus: session.payment_status,
                    paidAt: new Date()
                }
                const payment = await allPayments.insertOne(paymentDetails)

                res.send(result, payment)
            }

            res.send({ success: false })
        })

        // Get payment by student email
        app.get('/payment', async (req, res) => {
            try {
                const { email } = req.query
                const result = await allPayments.find({ studentEmail: email }).toArray()
                res.send(result)
            }
            catch {
                res.status(400).send({ message: 'Failed to get payment data' })
            }
        })

        // Get tutor by tutor email
        app.get('/ongoing-tuitions', async (req, res) => {
            try {
                const { email } = req.query
                const result = await allPayments.find({ tutorEmail: email }).toArray()
                res.send(result)
            } catch {
                res.status(400).send({ message: 'Failed to get ongoing tuitions data' })
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
