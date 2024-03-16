import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
const app=express()
app.use(cors({//idr hum log decide krte hain ki kon isko connect kr skata hai
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))
app.use(express.json({limit:"16kb"}))//jab data json form me aye to hme pass use karna h
app.use(express.urlencoded({extended:true,limit:'16kb'}))//idr hum log nesting ke liye allow krte hain
app.use(express.static('public'))//idr hum log files ke liye use krte hai jaise ki favicon
app.use(cookieParser())//server user ke browser me cookie pass krta hai












export default app