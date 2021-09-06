const generateMessage=(data)=>{
    return {
        text:data.text,
        username:data.username,
        createdAt:new Date().getTime()
    }
}

const generateLoc=(data)=>{
    return {
        url:data.url,
        username:data.username,
        createdAt:new Date().getTime()
    }
}

module.exports={
    generateMessage,
    generateLoc
}