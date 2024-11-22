import express from 'express'
import cors from 'cors'
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()
const app = express()
app.use(cors())
app.use(express.urlencoded({ extended: true }))


const clientId = process.env.CLIENT_ID
const clientSecret = process.env.CLIENT_SECRET
const appCredentials = btoa(`${clientId}:${clientSecret}`)
const baseUrl = 'https://sandbox.opengateway.telefonica.com/apigateway'
const PORT = process.env.PORT


const myHeaders = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': `Basic ${appCredentials}`
}


//------------- CIBA AUTHORIZE ---------------------

app.post('/ciba-authorize',async(req,res)=>{
    try {
        const login_hint = req.body.login_hint
        const purpose  = req.body.purpose

        const response = await axios.post(
            `${baseUrl}/bc-authorize`,
            new URLSearchParams({
                login_hint,
                purpose
            }).toString(), 
            {
                headers: myHeaders
            }
        )

        const authReqId = response.data
        res.status(200).send({ authReqId })
        
    } catch (error) {
        res.status(500).send({ error: `An error occurred: ${error.message}` })
    }
})

//------------------ ACESS TOKEN ----------------------------

app.post('/acess-token',async(req,res)=>{
    try {

        const grant_type = req.body.grant_type
        const auth_req_id = req.body.auth_req_id

        const response = await axios.post(
            `${baseUrl}/token`,
            new URLSearchParams({
                grant_type ,
                auth_req_id
            }).toString(), 
            {
                headers: myHeaders
            }
        )

        const access_token = response.data
        res.status(200).send({ access_token })

    } catch (error) {
        res.status(500).send({ error: `An error occurred: ${error.message}` })
    }
})

//------------------ SIM SWAP ----------------------------------

app.post('/sim-swap', async (req, res) => {
    try {
        const phoneNumber = req.body.phoneNumber
        let maxAge = req.body.maxAge

        const authHeader = req.headers.authorization

        if (!authHeader) {
            return res.status(400).send({ error: 'Authentication token not provided' })
        }

        const token = authHeader.split(' ')[1]

        if (!token) {
            return res.status(400).send({ error: 'Invalid or malformed token' })
        }

        maxAge = parseInt(maxAge, 10)

        if (isNaN(maxAge)) {
            return res.status(400).send({ error: 'maxAge must be a valid integer' })
        }

        const response = await axios.post(
            `${baseUrl}/sim-swap/v0/check`,
            {
                phoneNumber: phoneNumber,
                maxAge: maxAge
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`  
                }
            }
        )

        const swaped = response.data
        res.status(200).send({ swaped })

    } catch (error) {
        console.error(error)
        res.status(500).send({ error: `An error occurred: ${error.message}` })
    }
})


//------------------ SERVER CONFIGS ----------------------------

app.listen(PORT,()=> console.log(`Server running on the port ${PORT}`))