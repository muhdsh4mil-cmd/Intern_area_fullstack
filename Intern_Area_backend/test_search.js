const axios = require('axios');

const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api",
});

console.log(axiosInstance.getUri({ url: "/api/friends/search?query=test" }));
console.log(axiosInstance.getUri({ url: "api/friends/search?query=test" }));
