# CS480/tests

Contains our unit tests for everything. The following instructions are intended
for Linux (Debian variants). 

## Requires

- nodejs
- mongod (mongodb-server)
- mocha

### Potential Requirements

- redis (only if you use /api/notifications/*)

## Install 

```
# mongodb
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 2930ADAE8CAF5059EE73BB4B58712A2291FA4AD5
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.6 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.6.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# nodejs
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -

# install redis, nodejs, mocha
sudo apt install -y redis-server nodejs mocha

# from directory: CS480/tests
npm i
```

## Setup

Do this before running the tests. Do this once (process ends if your PC 
reboots though).
```
sudo mongod
```


## Run

```
npm test
```