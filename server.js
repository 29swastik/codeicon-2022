var express = require('express');
var app = express();

app.use(express.static('views'));
app.set('view engine', 'ejs');

app.get('/3d/:url', function (req, res) {
    res.render('pages/3d', {
        url: req.params.url
    });
});

app.get('/ar/:url', function (req, res) {
    res.render('/pages/ar', {
        url: req.params.url
    });
})


app.listen(8999);
console.log('Server running on 8999');