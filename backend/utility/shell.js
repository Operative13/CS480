const { spawn } = require('child_process');

/**
 * Execute simple shell command (async wrapper).
 * @param {String} cmd
 * @return {Object} { stdout: String, stderr: String }
 */
function sh(cmd, ...args) {
  // const ls = spawn('ls', ['-lh', '/usr']);
  const command = spawn(cmd, args);

  command.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  command.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
  });

  command.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
}

/**
 * Use shell to execute a command and print the
 * output from stdout
 * @param {String} cmd 
 */
async function call(cmd) {
  let commands = cmd.split(' ');
  return sh(commands[0], commands.splice(1));
}

module.exports = {
  sh,
  call,
};