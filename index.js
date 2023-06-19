if (process.env.NODE_ENV != 'production') {
    require('dotenv').config()
}

const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios')
const cors = require('cors')
const fs = require('fs')

const app = express()
app.use(cors())

app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static('assets'))

// Local Passport authentication set up

const getUser = require('./config/getUser')
const initializePassport = require('./config/passport-config')
const passport = initializePassport(
    (email) => { return getUser.getUserByEmail(email) },
    async (id) => {
        const user = await getUser.getUserById(id)
        return user
    }
)

// Session Management

const session = require('express-session')
const flash = require('express-flash')
app.use(flash())
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}))
app.use(passport.session())
app.use(passport.initialize())

const methodOverride = require('method-override')
app.use(methodOverride('_method'))


// Blocking direct access to page for authenticated user only
const blockForAuthenticated = require('./config/blockForAuthenticated')
const blockForNotAuthenticated = require('./config/blockForNotAuthenticated')

const { setCurrentUser, user } = require('./config/currentUser')

const uploadImg = require('./config/uploadFile')


// Routing

app.get('/', blockForAuthenticated, (req, res) => {
    res.render('index.ejs')
})

app.get('/signup', blockForAuthenticated, (req, res) => {
    res.render('signup.ejs')
})

app.get('/login', blockForAuthenticated, (req, res) => {
    res.render('login.ejs')
})

app.post('/signup', async (req, res) => {
    if (req.body.password !== req.body.password_confirm) {
        res.render('signup.ejs', {
            errorMessage: "Password confirmation doesn't match"
        })
    } else {
        axios.post('https://api-dot-balimate-dev.et.r.appspot.com/users',
            {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                password: req.body.password
            })
            .then(async (response) => {
                if (response.data.code === 'success') {
                    try {
                        const newUser = await getUser.getUserByEmail(req.body.email);
                        const userid = newUser.user_id
                        res.redirect(`/preference/${userid}`)
                    } catch (err) {
                        res.render('signup.ejs',
                            { errorMessage: 'Something went wrong. Please try again' })
                    }
                }
            })
            .catch((err) => {
                if (err.response.data.error.code === 'ER_DUP_ENTRY') {
                    res.render('signup.ejs',
                        { errorMessage: 'Email is already used' })
                } else {
                    res.render('signup.ejs',
                        { errorMessage: 'Something went wrong. Please try again' })
                }
            })
    }
})

app.post('/login', passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true
}),
    (req, res) => {
        setCurrentUser(req.user.user_id).then(() => {
            res.redirect(`/user/${req.user.user_id}`)
        })
    }
)

app.delete('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(e)
        res.redirect('/')
    })
})

app.get('/preference/:id', blockForAuthenticated, (req, res) => {
    res.render('preference.ejs', { userid: req.params.id })
})

app.post('/preference/:id', (req, res) => {
    if (req.body.categories !== '') {
        axios.post(`https://api-dot-balimate-dev.et.r.appspot.com/users/${req.params.id}/preferences`, {
            categories: JSON.stringify(req.body.categories.split(',')),
            city: req.body.city,
            price: req.body.price
        })
            .then((response) => {
                if (response.data.code === 'success') {
                    res.redirect(`/login`)
                } else if (response.data.code === 'fail') {
                    res.render('preference.ejs', { errorMessage: 'User not found' })
                }
            })
            .catch((err) => {
                res.render(`preference.ejs`,
                    { errorMessage: 'Something went wrong. Please try again' })
            })

    } else {
        res.render('preference.ejs', { errorMessage: 'You have to choose one of the categories', userid: req.params.id })
    }
})

app.get('/user/:id', blockForNotAuthenticated, (req, res) => {
    res.render('index_user.ejs', { userid: req.params.id })
})

app.get('/search', blockForNotAuthenticated, (req, res) => {
    res.render('search.ejs')
})

app.get('/user/:userid/destination/:placeid', blockForNotAuthenticated,
    async (req, res) => {
        if (!req.query.hasOwnProperty('lang')) {
            res.render('destination.ejs', { placeid: req.params.placeid })
        } else {
            res.render('destination_en.ejs', { placeid: req.params.placeid })
        }
    })

app.get('/user/:id/favorites', blockForNotAuthenticated, (req, res) => {
    res.render('favorite.ejs')
})

app.get('/user/:userid/review/:placeid', blockForNotAuthenticated, (req, res) => {
    res.render('review.ejs', { placeid: req.params.placeid })
})

app.post('/upload', (req, res) => {
    const chunkIndex = Number(req.header('X-Chunk-Index'))
    const totalChunks = Number(req.header('X-Total-Chunks'))

    // Append chunk of data on temporary file
    req.on('data', chunk => {
        fs.appendFileSync(`./temp/${req.query.fileName}`, chunk);
    })

    req.on('end', () => {
        if (chunkIndex === totalChunks - 1) {
            console.log(req.query.fileName)
            // Upload image if the chunks is accumulated
            uploadImg(`./temp/${req.query.fileName}`, req.query.fileName)
                .then(() => {
                    // Delete temporary file
                    try {
                        fs.unlinkSync(`./temp/${req.query.fileName}`)
                    } catch (err) {
                        console.log(err)
                    }
                })
        }
    })

    res.status(200).send({
        message: 'success'
    })
})

app.post('/user/:userid/review/:placeid', (req, res) => {
    axios.post(`https://api-dot-balimate-dev.et.r.appspot.com/reviews?userid=${req.params.userid}&placeid=${req.params.placeid}`,
        {
            rating: req.body.rating,
            review: req.body.review,
            photoUrl: req.body.photoUrl
        })
        .then((response) => {
            res.redirect(`../destination/${req.params.placeid}`)
        })
        .catch((err) => {
            res.render('review.ejs', { placeid: req.params.placeid })
        })
})

app.get('/user/:id/reviews', (req, res) => {
    res.render('user_review.ejs')
})

app.use((req, res) => {
    res.status(404)
    res.render('404.ejs')
})


app.listen(process.env.PORT, () => {
    console.log(`Server is listening on port ${process.env.PORT}...`)
})