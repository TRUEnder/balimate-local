const getUser = require('./getUser')

const user = {
    id: null
};

async function setCurrentUser(id) {
    user.id = id
}

module.exports = { setCurrentUser, user }