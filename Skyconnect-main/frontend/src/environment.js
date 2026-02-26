const server = process.env.NODE_ENV === 'production' ?
    "https://skyconnect-backend2.onrender.com" :
    "http://localhost:8000"


export default server;