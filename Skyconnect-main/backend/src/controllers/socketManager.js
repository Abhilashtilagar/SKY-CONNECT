import { Server } from "socket.io"

let connections = {}
let messages = {}
let timeOnline = {}
let usernames = {}

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });


    io.on("connection", (socket) => {

        console.log("SOMETHING CONNECTED")

        socket.on("join-call", (path, username) => {
            console.log(`🔗 User joining: ${username} in room: ${path}`);
            
            if (connections[path] === undefined) {
                connections[path] = []
            }
            connections[path].push(socket.id)
            usernames[socket.id] = username || `User ${socket.id.slice(0, 4)}`;
            timeOnline[socket.id] = new Date();

            // Determine if this user is the host (first to join this room)
            const isHost = connections[path].length === 1;
            console.log(`👥 Room ${path} now has ${connections[path].length} users. ${socket.id} is ${isHost ? 'HOST' : 'participant'}`);

            // Send host status to the joining user
            io.to(socket.id).emit("host-status", { isHost });

            // Notify existing users about the new user
            for (let a = 0; a < connections[path].length - 1; a++) {
                console.log(`📢 Notifying ${connections[path][a]} about new user ${socket.id}`);
                io.to(connections[path][a]).emit("user-joined", {
                    userId: socket.id,
                    username: usernames[socket.id]
                })
            }
            
            // Send existing users list to the new user
            if (connections[path].length > 1) {
                const existingUsers = connections[path].slice(0, -1).map(id => ({
                    userId: id,
                    username: usernames[id]
                }));
                console.log(`📋 Sending existing users to ${socket.id}:`, existingUsers);
                io.to(socket.id).emit("existing-users", existingUsers);
            }

            // Send chat history
            if (messages[path] !== undefined) {
                for (let a = 0; a < messages[path].length; ++a) {
                    io.to(socket.id).emit("chat-message", messages[path][a]['data'],
                        messages[path][a]['sender'], messages[path][a]['socket-id-sender'])
                }
            }
        })

        socket.on("signal", (toId, message) => {
            console.log(`📡 WebRTC Signal: ${usernames[socket.id] || socket.id} -> ${usernames[toId] || toId}, type: ${message.type}`);
            io.to(toId).emit("signal", socket.id, message);
        })

        socket.on("chat-message", (data, sender) => {
            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFound], [roomKey, roomValue]) => {
                    if (!isFound && roomValue.includes(socket.id)) {
                        return [roomKey, true];
                    }
                    return [room, isFound];
                }, ['', false]);

            if (found === true) {
                if (messages[matchingRoom] === undefined) {
                    messages[matchingRoom] = []
                }

                messages[matchingRoom].push({ 'sender': sender, "data": data, "socket-id-sender": socket.id })
                console.log("💬 message", matchingRoom, ":", sender, data)

                connections[matchingRoom].forEach((elem) => {
                    io.to(elem).emit("chat-message", data, sender, socket.id)
                })
            }
        })

        socket.on("screen-share-started", (userId) => {
            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFound], [roomKey, roomValue]) => {
                    if (!isFound && roomValue.includes(socket.id)) {
                        return [roomKey, true];
                    }
                    return [room, isFound];
                }, ['', false]);

            if (found === true) {
                connections[matchingRoom].forEach((elem) => {
                    if (elem !== socket.id) {
                        io.to(elem).emit("screen-share-started", userId)
                    }
                })
            }
        })

        socket.on("screen-share-ended", (userId) => {
            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFound], [roomKey, roomValue]) => {
                    if (!isFound && roomValue.includes(socket.id)) {
                        return [roomKey, true];
                    }
                    return [room, isFound];
                }, ['', false]);

            if (found === true) {
                connections[matchingRoom].forEach((elem) => {
                    if (elem !== socket.id) {
                        io.to(elem).emit("screen-share-ended", userId)
                    }
                })
            }
        })

        socket.on("typing-start", (username) => {
            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFound], [roomKey, roomValue]) => {
                    if (!isFound && roomValue.includes(socket.id)) {
                        return [roomKey, true];
                    }
                    return [room, isFound];
                }, ['', false]);

            if (found === true) {
                connections[matchingRoom].forEach((elem) => {
                    if (elem !== socket.id) {
                        io.to(elem).emit("typing-start", username, socket.id)
                    }
                })
            }
        })

        socket.on("typing-stop", () => {
            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFound], [roomKey, roomValue]) => {
                    if (!isFound && roomValue.includes(socket.id)) {
                        return [roomKey, true];
                    }
                    return [room, isFound];
                }, ['', false]);

            if (found === true) {
                connections[matchingRoom].forEach((elem) => {
                    if (elem !== socket.id) {
                        io.to(elem).emit("typing-stop", socket.id)
                    }
                })
            }
        })

        socket.on("pin-note", (noteData) => {
            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFound], [roomKey, roomValue]) => {
                    if (!isFound && roomValue.includes(socket.id)) {
                        return [roomKey, true];
                    }
                    return [room, isFound];
                }, ['', false]);

            if (found === true) {
                console.log(`📌 Note pinned in ${matchingRoom}:`, noteData.text);
                connections[matchingRoom].forEach((elem) => {
                    io.to(elem).emit("pin-note", noteData)
                })
            }
        })

        socket.on("dismiss-note", () => {
            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFound], [roomKey, roomValue]) => {
                    if (!isFound && roomValue.includes(socket.id)) {
                        return [roomKey, true];
                    }
                    return [room, isFound];
                }, ['', false]);

            if (found === true) {
                console.log(`❌ Note dismissed in ${matchingRoom}`);
                connections[matchingRoom].forEach((elem) => {
                    io.to(elem).emit("dismiss-note")
                })
            }
        })

        socket.on("disconnect", () => {
            console.log(`🔌 User disconnected: ${socket.id}`);
            
            var diffTime = Math.abs(timeOnline[socket.id] - new Date())
            var key

            for (const [k, v] of JSON.parse(JSON.stringify(Object.entries(connections)))) {
                for (let a = 0; a < v.length; ++a) {
                    if (v[a] === socket.id) {
                        key = k

                        console.log(`📢 Notifying room ${key} about user leaving`);
                        for (let a = 0; a < connections[key].length; ++a) {
                            io.to(connections[key][a]).emit('user-left', socket.id)
                        }

                        var index = connections[key].indexOf(socket.id)
                        connections[key].splice(index, 1)

                        if (connections[key].length === 0) {
                            delete connections[key]
                            console.log(`🗑️ Room ${key} deleted (empty)`);
                        }
                    }
                }
            }

            delete usernames[socket.id];
            delete timeOnline[socket.id];
        })


    })


    return io;
}

