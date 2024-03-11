const express = require('express');

// CORS: cross origin resources sharing
const cors = require('cors');
const axios = require('axios');
const mongodb = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config()

const app = express();
const mongoURI = process.env.MONGODB_CONNECTION_STRING;
const DB_NAME = process.env.DB_NAME;

// enable CORS (so that other web pages can use our RESTFUl API)
app.use(cors());

// enable recieving and sending of JSON
app.use(express.json());

const MongoClient = mongodb.MongoClient;
const ObjectId = mongodb.ObjectId;


async function connect(uri, dbname) 
{
    let client = await MongoClient.connect(uri);
    _db = client.db(dbname);
    return _db;
}

function generateAccessToken(id, email) 
{
    return jwt.sign({
        'user_id': id,
        'email': email
    }, process.env.TOKEN_SECRET, 
    {
        'expiresIn':'1w'  // w = weeks, d = days, h = hours, m = minutes, s = seconds
    });
}

function verifyToken(req, res, next)
{
    const authHeader = req.headers['authorization'];
    if (authHeader)
    {
        const token = authHeader;
        jwt.verify(token, process.env.TOKEN_SECRET, function(err,payload){
            if (err)
            {
                res.status(400);
                return res.json({
                    'error': err
                })
            } else 
            {
                // the JWT is valid, forward request to the route and store the payload in the request
                req.payload = payload;
                next();
            }
        })
    }
    else
    {
        // error400('Login required to access this route');
        res.status(400);
        return res.json({
            'error': 'Login required to access this route'
        })
    }
}

async function main() 
{
    const db = await connect(mongoURI,DB_NAME);
    // app.get("/", async function(req,res){

    //     const appointments = await db.collection("appointments").find({}).toArray();

    //     res.status(200);
    //     res.json({
    //         "message":"Success",
    //         "data": appointments
    //     })
    // });
    
    app.get("/api/appointments", async function(req,res){
        try 
        {
            const appointments = await db.collection("appointments").find({}).toArray();
            res.status(200);
            res.json({
                "appointments": appointments
            })
        } catch (error) 
        {
            res.status(500); // internal server error
            res.json({
                'error': error.message
            })
        }
        
    });
    
    app.post("/api/appointments", verifyToken, async function(req,res){
        const clinic = req.body.clinic;
        const doctor = req.body.doctor;
        const appttype = req.body.appttype;
        const date = req.body.date;
        const time = req.body.time;
        const datetime = date + "T" + time;

        const typeresult = await db.collection("appointment_type").findOne({
            'type' : appttype
        });
        if (!clinic || !doctor || !appttype || !date || !time) 
        {
            error400("Incomplete Appointment Details")
            return;
        }
        if(!typeresult)
        {
            error400("Invalid Appointment Type")
            return;
        }
        if(!checkDateFormat(date))
        {
            error400("Invalid Date Given");
            return;
        }
        if(!checkTimeFormat(time))
        {
            error400("Invalid Time Given");
            return;
        }
        try 
        {
            const result = await db.collection("appointments").insertOne({
                "clinic": clinic,
                "doctor": doctor,
                "appttype": typeresult._id,
                "datetime": new Date(datetime),
            });
            res.json({
                'message':'Appointment created successfully',
                'result': result
            });
        } catch (error) 
        {
            res.status(500); // internal server error
            res.json({
                'error': error.message
            })
        }
    });
    
    app.delete("/api/appointments/:id", verifyToken, async function(req,res){
        try 
        {
            const result = await db.collection("appointments").deleteOne({
                "_id" : new ObjectId(req.params.id)
            });
            res.json({
                'message':'Appointment has been deleted',
                'result': result
            });
        } catch (error) 
        {
            res.status(500); // internal server error
            res.json({
                'error': error.message
            })
        }
    });
    
    app.put("/api/appointments/:id", verifyToken, async function(req,res){
        const clinic = req.body.clinic;
        const doctor = req.body.doctor;
        const appttype = req.body.appttype;
        const date = req.body.date;
        const time = req.body.time;
        const datetime = date + "T" + time;

        const typeresult = await db.collection("appointment_type").findOne({
            'type' : appttype
        });
    
        if (!clinic || !doctor || !appttype || !date || !time) 
        {
            error400("Incomplete Appointment Details")
            return;
        }
        if(!typeresult)
        {
            error400("Invalid Appointment Type")
            return;
        }
        if(!checkDateFormat(date))
        {
            error400("Invalid Date Given");
            return;
        }
        if(!checkTimeFormat(time))
        {
            error400("Invalid Time Given");
            return;
        }
        try 
        {
            const result = await db.collection("appointments").updateOne({
                "_id" : new ObjectId(req.params.id)
            },{
                '$set': {
                    "clinic": clinic,
                    "doctor": doctor,
                    "appttype": typeresult._id,
                    "datetime": new Date(datetime),
                }
            });
            res.json({
                'message':'Appointment has been updated successfully',
                'result': result
            });
        } catch (error) 
        {
            res.status(500); // internal server error
            res.json({
                'error': error.message
            })
        }
    });

    app.get("/api/search/doctor/:name", async function(req,res){
        const docname = req.params.name;
        try 
        {
            const appointments = await db.collection("appointments").find({
                'doctor' : {
                    '$regex': docname,
                    '$options': 'i'
                }
            }).toArray();
            res.status(200);
            res.json({
                "appointments": appointments
            })
        } catch (error) 
        {
            res.status(500); // internal server error
            res.json({
                'error': error.message
            })
        }
    });

    app.get("/api/search/clinic/:name", async function(req,res){
        const clinicname = req.params.name;
        try 
        {
            const appointments = await db.collection("appointments").find({
                'clinic' : {
                    '$regex': clinicname,
                    '$options': 'i'
                }
            }).toArray();
            res.status(200);
            res.json({
                "appointments": appointments
            })
        } catch (error) 
        {
            res.status(500); // internal server error
            res.json({
                'error': error.message
            })
        }
    });

    app.get("/api/search/appointments/:type", async function(req,res){
        const appttype = req.params.type;
        try 
        {
            const typeresult = await db.collection("appointment_type").findOne({
                'type' : appttype
            });
            const o_id = new ObjectId(typeresult._id);
            const appointments = await db.collection("appointments").find({
                'appttype' : o_id
            }).toArray();
            res.status(200);
            res.json({
                "appointments": appointments
            })
        } catch (error) 
        {
            res.status(500); // internal server error
            res.json({
                'error': error.message
            })
        }
    });

    app.post('/user', async function(req,res){
        try 
        {
            const hashedPassword = await bcrypt.hash(req.body.password, 12);
            const result = await db.collection('users').insertOne({
                'email': req.body.email,
                'password': hashedPassword
            });
            res.json({
                'result': result
            });
        } catch (error) 
        {
            res.status(500); // internal server error
            res.json({
                'error': error.message
            })
        }
        
    });

    app.post('/login', async function(req,res){
        const { email, password } = req.body;
        if (!email || !password) 
        {
            error400("Email and password are required");
            return;
        }
        const user = await db.collection('users').findOne({
            email: req.body.email
        });
        if(user)
        {
            if (await bcrypt.compare(req.body.password, user.password))
            {
                const token = generateAccessToken(user._id, user.email);
                res.json({
                    'token': token
                })
            }
            else
            {
                error400("Invalid login credentials");
                return;
            }
        }
        else
        {
            error400("Invalid login credentials");
            return;
        }
    });
}

function checkDateFormat(date)
{
    const sd = date.split('-');
    if(sd.length == 3)
        if(sd[0].length == 4)
            if(sd[0] >= 2021 && sd[0] <= 2030)
                if(sd[1].length == 2)
                    if(sd[1] >= 1 && sd[1] <= 12)
                        if(sd[2].length == 2)
                            if(sd[2] >= 1 && sd[2] <= 31)
                                return true;

    return false;
}

function checkTimeFormat(time)
{
    const st = time.split(':');
    if(st.length == 2)
        if(st[0].length == 2)
            if(st[0] >= 0 && st[0] <= 24)
                if(st[1].length == 2)
                    if(st[1] >= 0 && st[1] <= 59)
                        return true;
    return false;
}

function error400(message)
{
    res.status(400);
    res.json({
        "error":message
    });
}
  
main();

app.listen(9898, function(){
    console.log("server has started at http://localhost:" + 9898);
});