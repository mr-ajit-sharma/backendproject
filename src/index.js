// require('dotenv').config()
import dotenv from 'dotenv'
import connectDB from './db/index.js'

dotenv.config({
    path:'./env'
})


connectDB()



























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