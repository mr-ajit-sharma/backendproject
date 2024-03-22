import dotenv from 'dotenv'
dotenv.config(
    {
        path:'./.env'
    }
)
// require('dotenv').config()
import connectDB from './db/index.js'
import {app} from './app.js'

// const port=8000
// console.log(process.env)
connectDB()
.then(()=>{
    app.listen(process.env.PORT  ,()=>{
        console.log(`server is running on the port ${process.env.PORT}`)
    })
    // app.on((err)=>{
    //     console.log(`server is not able to connect on ${process.env.PORT}`,err)
    // })
})
.catch((err)=>{
    console.log(`mongodb connection failed ${err}`)
})






















// const app = express();
// ; (async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
//         app.on('error', (err) => {
//             console.log("given error", err)
//         })
//         app.listen(process.env.PORT, (err) => {
//             if (err) {
//                 console.log(`error in conmnection with the server`)
//             }
//             console.log(`server is running on port ${process.env.PORT}`)
//         })
//     } catch (error) {
//         console.error(`error in the connection with the database`)
//     }
// })()