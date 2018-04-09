const { spawn } = require('child_process');

/**
 * Execute simple shell command (async wrapper).
 * @param {String} cmd
 * @return {Object} { stdout: String, stderr: String }
 */
function sh(cmd, resolve, reject, ...args) {
  const command = spawn(cmd, args);

  console.log(`stdout: $ ${cmd} ${args.join(' ')}`);

  command.stdout.on('data', (data) => resolve(data.toString()));
  command.stderr.on('data', (data) => reject(data.toString()));

  // command.on('close', (code) => {
  //   // console.log(`child process exited with code ${code}`);
  // });
}

/**
 * Use shell to execute a command and print the
 * output from stdout. Also returns values from stdout and stderr in through
 * a promise.
 * @returns {Promise<String>} resolveValue is String from stdout rejectValue is
 *  String from stderr
 */
function call(cmd) {
  let commands = cmd.split(' ');
  return new Promise((resolve, reject) => {
    sh(commands[0], resolve, reject, commands.splice(1));
  });
}

module.exports = {
  call,
};