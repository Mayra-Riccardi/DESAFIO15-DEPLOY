const path = require('path');
const express = require('express');
const apiRoutes = require('./api/api.routes');
const auth = require('../middlewares/auth');
const { fork } = require('child_process');

const router = express.Router();


//Routes
router.use('/api', apiRoutes);

router.get('/', async(req, res) => {
  res.sendFile('login.html', {root: 'public'})
})

router.get('/login', async(req, res) => {
  res.sendFile('login.html', {root: 'public'})
})//! ESTE GET ES REITERATIVO CON EL HOME, VER DESPUES SI SE DEJA O NO!

router.get('/register', async(req, res) => {
  res.sendFile('signup.html', {root: 'public'})
})

router.get('/info', (req, res) => {
  let data = {
    argv: process.argv.slice(2),
    memory: process.memoryUsage().rss,
    nodeV: process.version,
    processId: process.pid,
    platformName: process.platform,
    dir: process.cwd(),
    path: process.execPath
}
  res.render(path.join(process.cwd(), 'public/info.ejs'), { data })
})//modularizar este metodo!!!!!!

router.get('/randoms', (req, res) => {
  let { cant } = req.query
  cant ? cant : cant = "10000000"
  const randomNums = fork(path.resolve(__dirname, '../utils/randomNums'))
  randomNums.send(cant);
  randomNums.on('message', (data) => {
      res.json(data)
  })
})//lo mismo que el metodo anterior! modularizar!!

router.get('/profile', auth, async (req, res) => {
  const user = req.user;
  res.render('profile.ejs', { username: user.firstname });
});

router.get('/logout', auth, (req, res, next) => {
  req.logOut(() => {
    console.log('User logued out');
    res.redirect('/');
  })
})

module.exports = router;


