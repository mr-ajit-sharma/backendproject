class ApiResponse{
    constructor(data,statuscode,message="success"){
        this.message=message,
        this.data=data,
        this.statuscode=statuscode<400
    }
}