const xhr = new XMLHttpRequest();
const request = new XMLHttpRequest();
const dataRequest = new XMLHttpRequest();
const phpSend = new XMLHttpRequest();
const toEmail = new XMLHttpRequest();
const pathTo = 'https://api.bitbucket.org/2.0/repositories/allawitte';

const listContainer = document.querySelector('.list');
const frame = document.getElementById('frame');
const mail = document.getElementById('mail');
const emailInput = document.getElementById('email');
const textInput = document.getElementById('text');
const formData = {}, emailData = {};
var currentDirName;
var token, currentRepo;


listContainer.addEventListener('click', parseRepo);
xhr.addEventListener('load', parse);
request.addEventListener('load', getData);
dataRequest.addEventListener('load', showRaw);
phpSend.addEventListener('load', htmlSendResult);
window.addEventListener('load', getWindow);
mail.addEventListener('click', sendByMail);
emailInput.addEventListener('blur', checkEmail);
emailInput.addEventListener('keydown', releaseEmail);

function checkEmail(e) {
    let email = e.target;
    if (!email.value.match(/.+@.+\..+/i)) {
        email.classList.toggle('border-danger');
        mail.setAttribute('disabled', true);
    }
}

function releaseEmail(e) {
    e.target.classList.toggle('border-danger');
    mail.removeAttribute('disabled');
}

function sendByMail(e) {
    e.preventDefault();
    toEmail.open('POST', '/email/');
    emailData.mail = emailInput.value;
    emailData.text = textInput.value;
    toEmail.setRequestHeader('Content-Type', 'application/json');
    toEmail.send(JSON.stringify(emailData));
}

function htmlSendResult() {
    console.log('phpSend', phpSend.responseText);
    frame.src = phpSend.responseText;
}

function parse() {
    if (xhr.status == 200) {
        JSON.parse(xhr.responseText).values.forEach(item => {
            let li = document.createElement('LI');
            li.dataset.slug = item.slug;
            li.textContent = item.name;
            li.classList.add('folder');
            listContainer.appendChild(li);

        });
    }
    else if (xhr.status == 401) {
        window.location.assign('https://bitbucket.org/site/oauth2/authorize?client_id=whNmQBktVe6nFnXwRr&response_type=token');
    }
}

function getWindow() {
    var nov_reg = "#access_token=(.*)&scopes=";
    token = window.location.hash.match(nov_reg)[1];
    xhr.open('GET',
        pathTo +
        '?access_token=' + token + '&pagelen=100');
    xhr.send();
}

function getData(e) {
    if (request.status == 200) {
        let ul = document.createElement('UL');
        try {
            JSON.parse(request.responseText).values.forEach(item => {
                let li = document.createElement('LI');
                let link = item.links.self.href;
                li.textContent = item.path;
                li.dataset.link = link;
                li.dataset.type = item.type;
                if (item.type !== 'commit_directory') {
                    if (link.match(/\.html|\.md$/)) {
                        console.log(item.path.match(/\w*\.[a-zA-Z]*/)[0]);
                        li.classList.add('file');
                        li.addEventListener('click', getRaw);
                    }
                }
                else {
                    li.classList.add('folder');
                    li.addEventListener('click', parseRepo);
                }
                ul.appendChild(li);
                if (currentRepo.children.length == 0) {
                    currentRepo.appendChild(ul);
                }
            });
        }
        catch (e) {
            console.log('It is not a folder');
        }

    }
}

function getRaw(e) {
    let item = e.target;
    let path = this.textContent.match(/\/(\w+)/);
    console.log('path', path);
    formData.fileName = path ? path[1] : this.textContent;
    currentDirName = item.dataset.link.replace(/([\w\.-]*)$/, '');
    console.log('currentDirName', currentDirName);
    if (item.tagName == 'LI') {
        dataRequest.open('GET', item.dataset.link +
            '?access_token=' + token);
        dataRequest.send();
    }
}

function showRaw() {
    if (dataRequest.status == 200) {
        let data = dataRequest.responseText;
        let htmlMatch = data.match(/[\w*|\W*]*<[[\w*|\W*]*|\/[\w*|\W*]]>[\w*|\W*]*/);
        let head = data.match(/<head>(.*)<\/head>/gi);
        let cssLinks;
        if (head) {
            head = head[0].replace(/> *</g, '>\n\r<');
            cssLinks = head.match(/rel="stylesheet"(.*)href="(.*)\.css/gi);
        }
        else {
            cssLinks = data.match(/rel="stylesheet"(.*)href="(.*)\.css/gi);
        }

        data = data.replace(/> *<img/gi, '>\n\r<img');
        data = data.replace(/img(.*)src="/gi, 'img src="http://test-mobile.allawitte.nl/');
        //data = data.replace(/alt="(.*)" *> *</gi, 'alt="">\n\r<');

        console.log('data', data);

        if (cssLinks) {
            let cssPaths = cssLinks.map(item=>currentDirName + item.match(/href="([\w\/\.-]*)/)[1] + '?access_token=' + token);
            let style = '<style>';
            Promise.all(cssPaths.map(url => fetch(url))).then(responses =>
                Promise.all(responses.map(res => res.text())
                ).then(texts => {
                        style += texts;
                    })).then(()=> {
                style += '.chapter h2, #cover h2 {margin-top: 35%}</style>';
                formData.fileContent = data.replace(/<\/head>/, style + '</head>');
                if (htmlMatch.length) {
                    phpSend.open('POST', '/html/');
                    phpSend.setRequestHeader('Content-Type', 'application/json');
                    phpSend.send(JSON.stringify(formData));
                }
                else {
                    phpSend.open('POST', '/md/');
                    phpSend.setRequestHeader('Content-Type', 'application/json');
                    phpSend.send(JSON.stringify(formData));
                }
            });
        }
    }
}

function parseRepo(e) {
    currentRepo = e.target;
    if (currentRepo.tagName == 'LI') {
        let slug = currentRepo.dataset.slug;
        let path = slug ? pathTo + '/' + slug + '/src/master/' + '?access_token=' + token : currentRepo.dataset.link + '?access_token=' + token + '&page=2&pagelen=10';
        request.open('GET', path);
        request.send();
    }
}
/**
 * Created by Alla on 8/31/2017.
 */
