const { sh, call } = require('./shell');

sh('ls', ['-vl']);
call('ls -vl');