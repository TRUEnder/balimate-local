const axios = require('axios')

function getUserByEmail(email) {
    return new Promise((resolve, reject) => {
        axios.get(`https://api-dot-balimate-dev.et.r.appspot.com/users?email=${email}`)
            .then((response) => {
                resolve(response.data.data)
            })
            .catch((err) => {
                reject(err)
            })
    })
}

function getUserById(id) {
    return new Promise((resolve, reject) => {
        axios.get(`https://api-dot-balimate-dev.et.r.appspot.com/users/${id}`)
            .then((response) => {
                resolve(response.data.data)
            })
            .catch(err => {
                reject(err)
            })
    })
}

module.exports = { getUserById, getUserByEmail }