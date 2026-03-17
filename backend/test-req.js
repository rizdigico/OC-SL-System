const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/shop',
    method: 'GET',
    headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NGU4ZThmOGY4ZjhmOGY4ZjhmOGY4ZjgiLCJpYXQiOjE3NzMxMTk2NDMsImV4cCI6MTgwNDY3NzI0M30.UGIRJex0cK-1ShMUbR3U7b1qnRJFjIb0LFNS_PbFMOI'
    }
};

const req = http.request(options, res => {
    console.log(`statusCode: ${res.statusCode}`);
    let data = '';
    res.on('data', d => { data += d; });
    res.on('end', () => { console.log(data); });
});

req.on('error', error => { console.error(error); });
req.end();
