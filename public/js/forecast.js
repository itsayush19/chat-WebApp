const request=require('request');


const forecast=(lat,long,callback)=>{
    const url='http://api.weatherstack.com/current?access_key=bfd0413807013be5671aaba3643645bd&query='+lat+','+long+'&units=m'
    request({url:url,json:true},(error,response)=>{
        if(error){
            callback("Unable to connect to weather service",undefined)
        }else if(response.body.error){
            callback("Unable to find location",undefined)
        }else{
            callback(undefined,"Current Temperature :"+response.body.current.temperature+" C"+"\n"+response.body.current.weather_descriptions)
        }
    })
}

module.exports=forecast;