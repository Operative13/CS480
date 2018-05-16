const { exec } = new require('child_process');

/**
 * Execute simple shell command (async wrapper).
 * @param {String} cmd
 * @return {Object} { stdout: String, stderr: String }
 */
function sh(cmd, resolve, reject) {
  exec(cmd, (err, stdout, stderr) => {
    console.log(err, stdout, stderr);
    if (err) reject(err);
    if (stderr) reject(stderr);
    resolve(stdout);
  });
}

/**
 * Use shell to execute a command and print the
 * output from stdout. Also returns values from stdout and stderr in through
 * a promise.
 * @returns {Promise<String>} resolveValue is String from stdout rejectValue is
 *  String from stderr
 */
async function call(cmd) {
  return new Promise((resolve, reject) => {
    sh(cmd, resolve, reject);
  });
}

module.exports = call;

