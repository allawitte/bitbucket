var express = require("express");
var app     = express();
var path    = require("path");
var bodyParser = require('body-parser');

app.use(express.static(__dirname + '/public'));
app.use(require('body-parser').urlencoded({extended: true}));
app.use(bodyParser.json());

var fs = require('fs');
var pdf = require('html-pdf');
var html = fs.readFileSync('./test/index.html', 'utf8');
//var options = { format: 'Letter'};
var options = { "format": "A4",
    "orientation": "landscape",
    "border": {
        "top": "9px",            // default is 0, units: mm, cm, in, px
        "right": 0,
        "bottom": "10px",
        "left": "0.5in"
    }};

var email 	= require("emailjs/email");
var server 	= email.server.connect({
    user:	"alla_88",
    password:"AllaWitte07",
    host:	"mail.inbox.lv",
    ssl:		true
});



var markdownpdf = require("markdown-pdf");
var mdFile = fs.readFileSync('public/src/readme.md', 'utf8');
var fullPath, fileName, shortPath;


// send the message and get a callback with an error or details of the message that was sent
//server.send(message, function(err, message) { console.log(err || message); });
//markdownpdf().from("public/src/readme.md").to("public/pdf/readme.pdf", function () {
//    console.log("Done")
//});
var markdown = require("markdown" ).markdown;
var mdHtmlFile = markdown.toHTML(mdFile);
//console.log(mdHtmlFile)

//pdf.create(mdHtmlFile, options).toFile('./public/pdf/readme123.pdf', function(err, res) {
//    if (err) return console.log(err);
//    console.log(res); // { filename: '/app/businesscard.pdf' }
//});
app.post('/html/', function(req, response){
    let data= req.body;
    //data.fileName;
    //data.fileContent;
   let now = new Date();
    fileName = data.fileName + now.getTime() + '.pdf';
    fullPath = 'public/pdf/' + fileName;
    shortPath = '/pdf/'+fileName;

    //let fileHtml = req.body.fileContent.replace(/>/gi, '>\n\r');
    //console.log('fileHtml', fileHtml);
    pdf.create(req.body.fileContent, options).toFile('./'+fullPath, function(err, res) {
        if (err) return console.log(err);
        response.send(shortPath);
    });
});

app.post('/md/', function(req, response){
    fileName = data.fileName + now.getTime() + '.pdf';
    fullPath = 'public/pdf/' + fileName;
    shortPath = '/pdf/'+fileName;
    pdf.create(req.body.html, options).toFile('./'+fullPath, function(err, res) {
        if (err) return console.log(err);
        response.send(shortPath);
    });
});

app.post('/email/', function(req, response){
    var message	= {
        text:	"i hope this works",
        from:	"you <alla_88@inbox.lv>",
        to:		"someone <alla_88@inbox.lv>, another <newjed@mail.ru>",
        //cc:		"else <else@your-email.com>",
        subject:	"testing bitbacket",
        attachment:
            [
                {path:fullPath, type:"application/pdf", name:fileName}
            ]
    };
    server.send(message, function(err, message) { console.log(err || message); });
});

app.listen(8080);



console.log("Running at Port 8080");






/**
 * Created by Alla on 8/29/2017.
 */
