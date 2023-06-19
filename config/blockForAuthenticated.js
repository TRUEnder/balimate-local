function blockForAuthenticated(req, res, next) {
    // console.log(req.isAuthenticated())
    if (req.isAuthenticated()) {
        return res.redirect(`/user/${req.user.user_id}`)
    } else {
        next()
    }
}

module.exports = blockForAuthenticated