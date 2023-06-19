function blockForNotAuthenticated(req, res, next) {
    // console.log(req.isAuthenticated())
    if (!req.isAuthenticated()) {
        return res.redirect('/login')
    } else {
        next()
    }
}

module.exports = blockForNotAuthenticated