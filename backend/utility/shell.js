import { exec } from 'child_process';

/**
 * Execute simple shell command (async wrapper).
 * @param {String} cmd
 * @return {Object} { stdout: String, stderr: String }
 */
export async function sh(cmd) {
  return new Promise(function (resolve, reject) {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

/**
 * Use shell to execute a command and print the
 * output from stdout
 * @param {String} cmd 
 */
export async function call(cmd) {
  let { stdout, stderr } = await sh(cmd);
  console.log(`$ ${cmd}`);
  for (let line of stdout.split('\n')) {
    console.log(line);
  }
  
}

export async function callFromServerDirectory(cmd) {
  await call(`cd ${getServerRootDirectory()}; ${cmd}`);
}

export function getServerRootDirectory() {
  return process.cwd().split('.meteor')[0] + 'server/';
}
