var express = require('express');

var app = express();

app.disable('x-powered-by');

var handlebars = require('express-handlebars').create({defaultLayout: 'main'});

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

// more imports here

// form stuff
var formidable = require('formidable');
app.use(require('body-parser').urlencoded({extended: true}));

// secret cookie
var credentials = require('./credentials.js');
app.use(require('cookie-parser')(credentials.cookieSecret));

var session = require('express-session');
app.use(session({
	resave: false,
	saveUninitialized: true,
	secret: credentials.cookieSecret,
}));

// file system 
var fs = require('fs');


var parseurl = require('parseurl');

// count a page's views per user with express-session
app.use(function(req, res, next) {
	var views = req.session.views;

	if (!views) {
		views = req.session.views = {};
	}

	var pathname = parseurl(req).pathname;

	views[pathname] = (views[pathname] || 0 ) + 1;

	next();
})

app.set('port', process.env.PORT || 3000);

app.use(express.static(__dirname + '/public'));


// routes
app.get('/', function(req, res) {
	res.render('home');
});

app.get('/about', function(req, res) {
	res.render('about');
});

app.get('/contact', function(req, res) {
	res.render('contact', {
		csrf : 'CSRF Token Here'
	});
});


// set cookie
app.get('/cookie', function(req, res) {
	res.cookie('username', 'some username', {expire: new Date() + 9999}).send('username has the value of some username');
})

// list cookies
app.get('/listcookies', function(req, res) {
	console.log('Cookies : ', req.cookies);
	res.send('Look in the console for cookies');
});

// delete cookies
app.get('/deletecookies', function(req, res) {
	res.clearCookie('username');
	res.send('username cookie deleted');
});

// read file 
app.get('/readfile', function(req, res, next){
  fs.readFile('./public/randomfile.txt', function (err, data) {
   if (err) return console.error(err);
   res.send('The File : ' + data.toString());
  });
});

// write file
app.get('/writefile', function(req, res, next) {
	fs.writeFile('./public/randomfile2.txt', 'just some random text', function(err) {
		if(err) return console.error(err);
	});
	fs.readFile('./public/randomfile2.txt', function (err, data) {
   		if (err) return console.error(err);
   	res.send('The File : ' + data.toString());
  });
});


// count page views with session var 
app.get('/viewcount', function(req, res, next) {
	res.send('You have viewed this page ' + req.session.views['/viewcount'] + ' times.');
});


// file upload
app.get('/file-upload', function (req, res) {
	var now = new Date();
	res.render('file-upload', {
		year: now.getFullYear(),
		month: now.getMonth() 
	});
});

app.post('/file-upload/:year/:month',function(req, res) {
	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, file) {
		if (err) return res.redirect(303, '/error');
		console.log('Received File');
		console.log(file);
		res.redirect(303, '/thankyou')
	});
});

// process form (contact.handlebars)
app.post('/process', function(req, res) {
	console.log('Form : ' + req.query.form);
	console.log('CSRF Token : ' + req.body._csrf);
	console.log('Email: ' + req.body.email);
	console.log('Question: ' + req.body.ques);
	res.redirect(303,'/thankyou');
})

// cant find URL
app.use(function(req, res, next) {
	console.log("Looking for URL : " + req.url);
});

// thank you landing page
app.get('/thankyou', function(req, res) {
	res.render('thankyou');
});

// 404 PAGE
app.use(function(req, res, next) {
	res.type('text/html');
	res.status(404);
	res.render('404');
});

// 500 PAGE
app.use(function(err, req, res, next) {
	console.log(err.stack);
	res.type('text/html');
	res.status(500);
	res.render('500');
});

// start listening
app.listen(app.get('port'),function () {
	console.log('Server listening on port ' + app.get('port') + ". Press ctrl-C to stop server.");
});