# CS480/tests

Contains our unit tests for everything. The following instructions are intended
for Linux (Debian variants), and some additional instructions and initial
running of the tests was done on Win10.

## Requires

- nodejs
- mongod (mongodb-server)
- mocha

## Install Requirements

#### Ubuntu 16.04

```
# mongodb
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2930ADAE8CAF5059EE73BB4B58712A2291FA4AD5
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.6 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.6.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# nodejs
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -

# install nodejs, mocha
sudo apt install -y nodejs mocha

# from directory: CS480/tests
npm i
```

#### Windows 10

Have git bash or some program to allow you to clone, pull, push, and commit
using git.

Download nodejs lts https://nodejs.org/en/download/

## Setup

Using cmd, powershell, or bash:

```
git clone git@github.com:Operative13/CS480.git
cd tests
npm i
```

#### Ubuntu 16.04

Do this before running the tests. Do this once (process ends if your PC
reboots though).
```
sudo mongod
```

#### Windows 10

should be fine, might need to install the equivalent of the debian packages
mongodb-core, mongodb-server, mongodb-clients

## Run

from the CS480/tests directory

```
npm test
```
