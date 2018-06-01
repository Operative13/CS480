# 0.3.0

Latest and Final Release

None of the bugs should be fatal during 
users' normal usage of the app.

Features Overview:
- user register & login
- user connectivity in a shared game
- accurate users positioning in game using GPS
- capture region interactions
- points and timeout end conditions
- troops as resource on players and in each region
- troops transferrable & use-able to capture an enemy region

Bugs:
- geolocation can be inaccurate or jumpy (more of an issue inherited from web api)
- poor network connection results in slow responses which means the game may not
(another inherit problem, but the design helps by just updating when there is a 
connection to resume normal usage)
update as frequently as it should (UI is always responsive still)
- there might be some infinite async loops (based on reading through logs)
- possible race conditions (one function 
trying to access a game doc that has been deleted as the game found another end
condition) 

Security Vulnerabilities:
- unsecure connection (i.e.: no SSL usage)
- no real user or game authentication / session management system
- `AsyncStorage` of mobile app will serialize the user username & password 
unencrypted
 