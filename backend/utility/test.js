// const { sh, call } = require('./shell');
const { call } = require('./shell');

// sh('ls', (data) => console.log(data.toString()), (data) => console.log(data), ['-vl']);
call('ls -vl').then((data) => console.log(data));