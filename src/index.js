const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const {generateMessage,generateLoc} = require('./utils/messages');
const {addUser,removeUser,getUser,getUserInRoom}=require('./utils/users')
const forecast = require('../public/js/forecast');
const { ExpressPeerServer } = require("peer");


//app and port
const app=express();
const server=http.createServer(app);
const io=socketio(server);
const port=3000;

//peerServer
const peerServer = ExpressPeerServer(server, {
    debug: true,
    port:"438"
});
app.use("/peerjs",peerServer);



//paths
const publicDirectory=path.join(__dirname,'../public');

app.use(express.static(publicDirectory));

io.on('connection',(socket)=>{
    console.log('New connection')

    //when peer joins
    socket.on('join-vid',(id)=>{
        console.log(id);
        const user=getUser(socket.id);
        console.log(user.room)
        io.to(user.room).emit('vid-join',id);
    })

    //when a user sends a message
    socket.on('recieved',(msg,callback)=>{
        const user=getUser(socket.id)
        const filter=new Filter();
        if(filter.isProfane(msg)){
            return callback('Profanity is not allowed')
        }
        io.to(user.room).emit('sent',generateMessage({
            text:msg,
            username:user.username
        }));
        callback();
    })

    //when a user leaves 
    socket.on('disconnect',()=>{
        const user=removeUser(socket.id)
        if(user){
            io.to(user.room).emit('sent',generateMessage({
                text:user.username+' has left!',
                username:"Admin"
            }))
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getUserInRoom(user.room)
            })
        }
    })

    //when a user sends location
    socket.on('Location',(pos,callback)=>{
        const user=getUser(socket.id)
        io.to(user.room).emit('recievedLoc',generateLoc({
            url:"https://www.google.com/maps?q="+pos.Latitude+","+pos.Longitude,
            username:user.username}))
        callback();
    })

    socket.on('myLoc',(data)=>{
        console.log(data.myLat);
        console.log(data.myLong);
        forecast(data.myLat,data.myLong,(error,forecastData)=>{
            if(error){
                socket.emit('temperature',{
                    temp:error
                })
            }else{
                socket.emit('temperature',{
                    temp:forecastData
                })
            }
        })
    })

    socket.on('Join',(options,callback)=>{

        const {error,user}=addUser({
            id: socket.id,
            username:options.username,
            room:options.room
        })

        if(error){
            return callback(error)
        }

        socket.join(user.room)

        //when a user enters 
        socket.emit('sent',generateMessage({
            text:'Welcome!',
            username:"Admin"
        }));
        socket.broadcast.to(user.room).emit('sent',generateMessage({
            text:user.username+' Joined',
            username:"Admin"
        }))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUserInRoom(user.room),
        })
        
        callback()
    })

})


server.listen(port,()=>{
    console.log('Server is UP');
}) 