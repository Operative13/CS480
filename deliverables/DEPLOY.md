# CS480 Kingdoms Game

The following is the compliation of instructions to install the 
dependencies of each part of the application and get them running.
Individual instructions can be found in their respective README.md files

Note: the following instructions were tested on Ubuntu using Bash
and may have their own install dependencies that're not project 
dependencies (`curl`, `vim`). Alternatives can be found and the same
instructions instructions will work on Windows with Windows alternative
tools / commands.

## Requires

- [nodejs](https://nodejs.org/en/)
- expo mobile app (on phone for running frontend)

## Install
 
```
git clone git@github.com:Operative13/CS480.git
```  
  
backend:
```
cd CS480/backend
npm i
```

frontend:

```
cd ../frontend
npm i
```

## Setup Configuration Files
**Backend**

Backend config links to the MongoDB URI at which the MongoDB instance
for the app is being hosted.

One way to obtain your own MongoDB URI is to:
1. go to https://mlab.com/welcome/
2. sing up
3. create new MongoDB Deployment
4. click on your deployment
5. create a user & password for that deployment
6. copy the URI, user, and password to backend/config.js

Create your own config.js and replace the values with your own
user, password, and MongoDB URI.
```bash
cd ../backend
cp example.config.js config.js
vim config.js # or use any other text editor
```

Additional configuration is needed to enable *port 
forwarding* at port 3000 to allow public access.
Depending on where the backend is being hosted, this will
need to be configured in different places. 

- AWS: edit the inbound rules for the security group for the EC2 instance
- Personal hosting on VM: 1. add port 3000 to be port forwarded in network settings 
accessed at the default gateway via browser. 2. add port forwarding in virtual 
box / VM network settings (if using a VM).

**Frontend**

You want to be hosting the Node.js app (backend)
on your IP address used within your network (`$ hostname -I`).
Also, it'd be best to have a static IP or a domain name
registered and setup to point to your public IP.

From the computer running the backend using Bash
(or visit some webpage using server computer 
to get your public IP),

```
curl ipinfo.io/ip # get your public IP
``` 

From the computer that'll run the frontend using Bash:

```
cd ../frontend
cp example.config.js config.js
vim config.js # or use any other text editor
```

update the value of the variable with the public IP
or domain name at which the backend is being hosted.

## Run

backend:
```
cd ../backend
nodemon server.js --host $(hostname -I)
```

frontend:
```
cd ../frontend
npm start
```

Now scan the barcode using Expo on your phone or the 
camera's barcode scanner. Alternatively, send a text to
your phone using the console running the frontend which
contains the URI to the hosted Expo / React Native app.