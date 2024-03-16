// const asyncHandler=(fn)=>{//async way to  process these is called as function overloading
//     async(req,res,next)=>{
//         try {
//             await fn(req,res,next)
//         } catch (error) {
//             console.log(error,"error in handling the errror")
//         }
//     }
// }
export default asyncHandler
export const asyncHandler=(fn)=>async(req,res,next)=>{
try {
    await fn(req,res,next)
} catch (error) {
    res.status(error.code || 500).json({
        success:false,
        message:error.message
    })
}
}

// promise way to function overloading
//export const asyncHandler=(requestHandler)=>{
//     Promise
//     .resolve(requestHandler(req,res,next))
//     .catch((err)=>next(err))
// }