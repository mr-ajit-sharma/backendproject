import mongoose, { Schema } from 'mongoose'
const subscriptionSchema=new Schema({
    subscriber:{
        type:mongoose.Types.ObjectId,  // reference to the user who is subscribing
        ref:"User"
    },
    channel:{
        type:mongoose.Types.ObjectId,   //reference to the channel that the user is subscribed to
        ref:"User"
    }
},{})
export const Subscription=mongoose.model('Subscription',subscriptionSchema)