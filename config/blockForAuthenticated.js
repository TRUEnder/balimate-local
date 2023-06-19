function blockForAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect(`/user/${req.user.user_id}`)
    } else {
        next()
    }
}

module.exports = blockForAuthenticated