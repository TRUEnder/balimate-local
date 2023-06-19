const passport = require('passport')
const LocalPassport = require('passport-local').Strategy

function initializePassport(getUserByEmail, getUserById) {
    async function authentication(email, password, done) {
        try {
            const user = await getUserByEmail(email)
            if (user == null) {
                return done(null, false, { message: 'Email or password is wrong' })
            } else {
                if (password === user.password) {
                    return done(null, user)
                } else {
                    return done(null, false, { message: 'Email or password is wrong' })
                }
            }
        } catch (e) {
            return done(e)
        }
    }

    // Main
    passport.use(new LocalPassport({ usernameField: 'email' }, authentication))

    passport.serializeUser((user, done) => {
        done(null, user.user_id)
    })
    passport.deserializeUser(async (id, done) => {
        const user = await getUserById(id)
        return done(null, user)
    })

    return passport
}


module.exports = initializePassport