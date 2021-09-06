const users=[]

const addUser=({id,username,room})=>{
    //cleaning the data
    username=username.trim()
    room=room.trim()

    //if the data is empty
    if(!username||!room){
        return {
            error:'Username and Room are required'
        }
    }

    //check wheather the username is unnique
    const existing=users.find((user)=>{
        return user.room===room &&user.username===username
    })

    //if not unique
    if(existing){
        return {
            error:"User name is not Unique"
        }
    }

    const user={id,username,room}
    users.push(user)
    return {user}
}

//to remove user
const removeUser=(id)=>{
    const index=users.findIndex((user)=>user.id===id)

    if(index!==-1){
        return users.splice(index,1)[0]
    }
} 

//to get a user by id
const getUser=(id)=>{
    return users.find((user)=>{
        return id===user.id
    })
}

//to get a user in room
const getUserInRoom=(room)=>{
    return users.filter((user)=>{
        return user.room===room
    })
}


module.exports={
    addUser,
    removeUser,
    getUser,
    getUserInRoom
}