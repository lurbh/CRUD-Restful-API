const express = require('express');

// CORS: cross origin resources sharing
const cors = require('cors');
const axios = require('axios');
const mongodb = require('mongodb');
require('dotenv').config()

const app = express();
const mongoURI = process.env.MONGODB_CONNECTION_STRING;

// enable CORS (so that other web pages can use our RESTFUl API)
app.use(cors());

// enable recieving and sending of JSON
app.use(express.json());

const MongoClient = mongodb.MongoClient;
const ObjectId = mongodb.ObjectId;

async function connect(uri, dbname) {
    let client = await MongoClient.connect(uri, {
        useUnifiedTopology: true
    })
    _db = client.db(dbname);
    return _db;
}

async function main() 
{
    const db = await connect(mongoURI,'Appointment-Management-System');
    app.get("/", async function(req,res){

        const appointments = await db.collection("appointments").find({}).toArray();
        res.status(200);
        res.json({
            "message":"Success",
            "data": appointments
        })
    });
    
    app.get("/appointments", async function(req,res){
        const appointments = await db.collection("appointments").find({}).toArray();
        res.status(200);
        res.json({
            "appointments": appointments
        })
    });
    
    app.post("/appointments", async function(req,res){
        const clinic = req.body.clinic;
        const doctor = req.body.doctor;
        const appttype = req.body.appttype;
        const date = req.body.date;
        const time = req.body.time;
        const datetime = date + "T" + time;

        const typeresult = await db.collection("appointment_type").find({
            'type' : appttype
        }).toArray();
    
        if (!clinic || !doctor || !appttype || !date || !time) 
        {
            res.status(400);
            res.json({
                "error":"Incomplete Appointment Details"
            });
            return;
        }
        if(typeresult.length == 0)
        {
            res.status(400);
            res.json({
                "error":"Invalid Appointment Type"
            });
            return;
        }
        if(!checkDateFormat(date))
        {
            res.status(400);
            res.json({
                "error":"Invalid Date Given"
            });
            return;
        }
        if(!checkTimeFormat(time))
        {
            res.status(400);
            res.json({
                "error":"Invalid Time Given"
            });
            return;
        }
        try 
        {
            const result = db.collection("appointments").insertOne({
                "clinic": clinic,
                "doctor": doctor,
                "appttype": appttype,
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
                'error': e
            })
        }
    });
    
    app.delete("/appointments/:id", function(req,res){
        try 
        {
            const result = db.collection("appointments").deleteOne({
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
                'error': e
            })
        }
    });
    
    app.put("/appointments/:id", async function(req,res){
        const clinic = req.body.clinic;
        const doctor = req.body.doctor;
        const appttype = req.body.appttype;
        const date = req.body.date;
        const time = req.body.time;
        const datetime = date + "T" + time;

        const typeresult = await db.collection("appointment_type").find({
            'type' : appttype
        }).toArray();
    
        if (!clinic || !doctor || !appttype || !date || !time) 
        {
            res.status(400);
            res.json({
                "error":"Incomplete Appointment Details"
            });
            return;
        }
        if(typeresult.length == 0)
        {
            res.status(400);
            res.json({
                "error":"Invalid Appointment Type"
            });
            return;
        }
        if(!checkDateFormat(date))
        {
            res.status(400);
            res.json({
                "error":"Invalid Date Given"
            });
            return;
        }
        if(!checkTimeFormat(time))
        {
            res.status(400);
            res.json({
                "error":"Invalid Time Given"
            });
            return;
        }
        try 
        {
            const result = db.collection("appointments").updateOne({
                "_id" : new ObjectId(req.params.id)
            },{
                '$set': {
                    "clinic": clinic,
                    "doctor": doctor,
                    "appttype": appttype,
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
                'error': e
            })
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
  
main();

app.listen(9898, function(){
    console.log("server has started at http://localhost:" + 9898);
});