import mongoose from 'mongoose'
import { DB_NAME } from '../constant.js'
const connectDB = async () => {
    // console.log(process.env.MONGODB_URI)
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n mongodb connected!! db host: ${connectionInstance.connection.host}`)//what it is?
    } catch (error) {
        console.log(`error in db connection `, error)
        process.exit(1)//why it is use?
    }
}
export default connectDB