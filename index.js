const express = require('express');

// CORS: cross origin resources sharing
const cors = require('cors');
const axios = require('axios');
require('dotenv').config()

const app = express();

// enable CORS (so that other web pages can use our RESTFUl API)
app.use(cors());

// enable recieving and sending of JSON
app.use(express.json());

const BASE_JSON_BIN_URL = process.env.BASE_JSON_BIN_URL;
const BIN_ID = process.env.BIN_ID;
const appointments = [];

const APPT_TYPE = [
    "General Check-up",
    "Urgent Care Appointment",
    "Follow-up Appointment",
    "Chronic Disease Management",
    "Medication Review Appointment",
    "Preventive Care Appointment"
]

async function main() 
{
    let response = await axios.get(BASE_JSON_BIN_URL + "/" + BIN_ID + "/latest");
    for(let a of response.data.record.Appointment)
    {
        const newappt = {
            "id": a.id,
            "clinic": a.clinic,
            "doctor": a.doctor,
            "appttype": a.appttype,
            "date": a.date,
            "time": a.time
        }
        appointments.push(newappt);
    }
}
  
main();

app.get("/", function(req,res){

    res.status(200);
    res.json({
        "message":"Success",
        "data": appointments
    })
});

app.get("/appointments", function(req,res){
    res.status(200);
    res.json({
        "appointments": appointments
    })
});

app.post("/appointments", function(req,res){
    const clinic = req.body.clinic;
    const doctor = req.body.doctor;
    const appttype = req.body.appttype;
    const date = req.body.date;
    const time = req.body.time;

    if (!clinic || !doctor || !appttype || !date || !time) 
    {
        res.status(400);
        res.json({
            "error":"Incomplete Appointment Details"
        });
        return;
    }
    if(APPT_TYPE.indexOf(appttype) == -1)
    {
        res.status(400);
        res.json({
            "error":"Invalid Appointment Type"
        });
        return;
    }
    const newappt = {
        "id": Math.floor(Math.random() * 10000),
        "clinic": clinic,
        "doctor": doctor,
        "appttype": appttype,
        "date": date,
        "time": time
    }
    appointments.push(newappt);
    res.status(200);
    res.json({
        'message':'Appointment created successfully'
    });
});

app.delete("/appointments/:id", function(req,res){
    const indexToDelete = appointments.findIndex(function(a){
        return a.id == req.params.id;
    });

    if(indexToDelete == -1)
    {
        res.status(400);
        res.json({
            "error":"Appointment ID cannot be found"
        });
        return;
    }
    appointments.splice(indexToDelete,1);
    res.status(200);
    res.json({
        'message':'Appointment has been deleted'
    });
});

app.put("/appointments/:id", function(req,res){
    const clinic = req.body.clinic;
    const doctor = req.body.doctor;
    const appttype = req.body.appttype;
    const date = req.body.date;
    const time = req.body.time;

    if (!clinic || !doctor || !appttype || !date || !time) 
    {
        res.status(400);
        res.json({
            "error":"Incomplete Appointment Details"
        });
        return;
    }
    const indexToUpdate = appointments.findIndex(function(a){
        return a.id == req.params.id;
    });

    const newappt = {
        "id": parseInt(req.params.id),
        "clinic": clinic,
        "doctor": doctor,
        "appttype": appttype,
        "date": date,
        "time": time
    }

    appointments[indexToUpdate] = newappt;
    res.status(200);
    res.json({
        'message':'Appointment has been updated'
    });
});


app.listen(9898, function(){
    console.log("server has started at http://localhost:" + 9898);
});