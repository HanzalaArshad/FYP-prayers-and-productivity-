class ApiResponse{
  constructor(statuscode,message,data){
      this.statuscode=statuscode
            this.success=statuscode<400
                  this.message=message


      this.data=data
  } 
}


export {ApiResponse}