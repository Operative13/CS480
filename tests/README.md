# CS480/tests

Contains our unit tests for everything. The following instructions are intended
for Linux (Debian variants). 

## Requires

- nodejs
- redis
- mongod (mongodb-server)
- mocha

## Install 


```
# nodejs
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -

# install redis and nodejs
sudo apt install -y redis-server nodejs 

# google how to install mongodb-server (don't install from debian package 
# manager bc that's out dated
```

## Setup

```
chmod +x run.sh
```

## Run

```
./run.sh
```