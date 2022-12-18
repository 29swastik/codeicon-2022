var express = require('express');
var app = express();

app.use(express.static('views'));
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
    res.render('pages/3d');
});


app.listen(8999);
console.log('Server running on 8999');
