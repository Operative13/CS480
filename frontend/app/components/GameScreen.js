import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, AsyncStorage, Modal, KeyboardAvoidingView, TextInput} from 'react-native';
import { StackNavigator } from 'react-navigation'; // Version can be specified in package.json
import MapView from 'react-native-maps';
import {Marker, Circle} from 'react-native-maps';
import CountDown from 'react-native-countdown-component';

import BaseConnection from 'kingdoms-game-sdk/src/BaseConnection';
import Game from 'kingdoms-game-sdk/src/Game';

import castleImg from '../assets/castle256.png'
import fortImg from '../assets/fort256.png'
import redCastleImg from '../assets/redcastle256.png'
import redFortImg from '../assets/redfort256.png'
import blueCastleImg from '../assets/bluecastle256.png'
import blueFortImg from '../assets/bluefort256.png'

import IP from '../../config';

export default class GameScreen extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            region: null,
            playerMarkers:[
                {
                    coordinate: {
                        latitude: 34.0576,
                        longitude: -117.820,
                    },
                    title: "User",
                    pinColor: '#0000ff',
                },
                {
                    coordinate: {
                        latitude: 34.0577,
                        longitude: -117.821,
                    },
                    title: "Enemy",
                    pinColor: '#ff0000',
                },
            ],
            userID: null,
            gameID: '',
            error: null,
            regionSet: false,
            timer: null,
            numErrors: 0,
            nodes: [],
            initialStateSet: false,
            initialGetGame: false,
            score: 0,
            enemyScore: 0,
            timeLeft: 10,
            userTroops: 0,
            troopModalVisible: false,
            workingRegionIndex: null,
            troopTransferNumber: null,
        };
        //initial game id
        const {params} = this.props.navigation.state;
        this.state.gameID = params.gameID;

        //initial region
        if(params.lat && params.lon){
            this.state.region = {
                latitude: params.lat,
                longitude: params.lon,
                latitudeDelta: 0.001,
                longitudeDelta: 0.001,
            };
        }


        let baseConn = new BaseConnection( IP ,'3000');
        this.game = new Game(baseConn, WebSocket);
        this.game.id = this.state.gameID;

      /**
       * getCurrentPosition will be called every x seconds where
       * x is this value
       * @type {number}
       */
        this.geolocationUpdatePeriod = 3000;
    }

    componentWillUnmount(){
        clearInterval(this.state.timer);
    }

    componentDidMount(){
        this._loadInitialState().done();
        this.updateGeolocation();
        let timer = setInterval(this.updateGeolocation, this.geolocationUpdatePeriod);
        this.setState({timer});
        this.game.listenForRegionChange(this.updateNodes, onError = () => this.updateOnNetworkFail);

        console.log("gameID: " + this.state.gameID);
    }

    updateOnNetworkFail = () => {
        this.game.getGame(this.state.gameID)
            .then((response) =>{
                console.log("Network Failed for the websocket, calling getGame");
                this.updateNodes(response);
        })
    }

    _loadInitialState = async () => {
        //console.log('loadinitialstate');
        //get id
        let value = await AsyncStorage.getItem('_id');
        //return to menu on error
        if (value == null){
            alert('error getting user ID');
            this.props.navigation.pop(1);
        }
        this.state.userID = value;
        console.log("userID: " + this.state.userID);

        //get gameInstance
        if(this.state.gameID === '' || this.state.gameID === null || this.state.gameID === undefined){
            alert('error getting game ID');
            this.props.navigation.pop(1);
        }

        this.game.getGame(this.state.gameID)
            .then((response) => {
                console.log(response);
                this.updateNodes(response);
                this.setState({timeLeft: this.calcTimeLeft(response.startTime)});
                this.state.initialGetGame = true;
            })

        this.state.initialStateSet = true;
    };

  /**
   * Get the current latitude and longitude of self
   * -> update game doc with new geolocation of self
   * --> update map markers (this.state.playerMarkers) with all coordinates
   * --> update nodes
   *
   * @returns {Promise<void>}
   */
  updateGeolocation = () => {
        try {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    if (this.state.region === null) {
                        let region = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01
                        };
                    }

                    //update geolocation on server
                    this.game.setGeolocation(this.state.userID, position.coords.longitude, position.coords.latitude)
                        .then((response) => {
                            //console.log(response);
                            this.setState({numErrors: 0});
                            this.checkWinner(response.winner);
                            this.updatePlayers(position, response);
                        })
                        .catch((err) => {
                            console.error(err);
                            //TODO
                            //figure out what the specific way to check for "TypeError: Network request failed" is
                            let numErrors = this.state.numErrors + 1;
                            this.setState({numErrors: numErrors});
                            if (numErrors > 5) {
                                alert(err);
                            }
                        });
                },
                (err) => {
                    console.log(err)
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                }
            );
        }
        catch (error){
            console.log(error);
        }
    };

    /**
     *
     * @param position - position provided by navigator.watchPosition , contains
     *    info on lon and lat of self
     * @param response - game document return from server, contains enemy coordinates
     */
    updatePlayers = (position, response) => {
        try {
            //update players
            if (!this.game.hasOwnProperty('geolocations') || !response) {
                throw new Error(`invalid http response or Game object. game = \n${this.game.toString()}`);
            }

            let coordEnemy = {
                latitude: 0,
                longitude: 0,
            };

            for (let userId in response.geolocations) {
                if (response.geolocations.hasOwnProperty(userId) && userId !== this.state.userID) {
                    coordEnemy.latitude = response.geolocations[userId].lat;
                    coordEnemy.longitude = response.geolocations[userId].lon;
                }
            }

            let playerMarkers = [
                {
                    coordinate: {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    },
                    title: "User",
                    pinColor: '#0000ff',
                },
                {
                    coordinate: coordEnemy,
                    title: "Enemy",
                    pinColor: '#ff0000',
                },
            ];

            this.setState({
                playerMarkers: playerMarkers
            });

            //update players score
            for (let userId in response.scores) {
                if (userId !== 'null' && userId !== this.state.userID) {
                    this.setState({enemyScore: response.scores[userId]})
                }
                if (userId !== 'null' && userId === this.state.userID ){
                    this.setState({score: response.scores[userId]})
                }
            }
            //update player troops
            for (let userId in response.troops) {
                if (userId !== 'null' && userId === this.state.userID ){
                    this.setState({userTroops: response.troops[userId]})
                }
            }
        }
        catch (error){
            console.error(error)
        }
    };

    /**
     * update nodes with response from server
     * @param data {object} - regions from game document return from server,
     *  contains 1 or 2 properties: regions which have lat, lon, radius, owner,
     *  type, and troops
     *  2nd property, troops contains: a object with properties of userIds and
     *  values of their troops like
     *  e.g.:
     *  data = {
     *      regions: [{lat: 123, lon: 123, type: "castle",
     *          troops: 1, owner: "579", radius: 7
     *      }],
     *      troops: {"579": 5, "401": 7}
     *  }
     */
    updateNodes = (response) => {
        let nodes=[];
        let index = 0;

        if(response.troops){
            for(let user in response.troops){
                if(user === this.state.userID){
                    this.setState({userTroops: response.troops[user]});
                }
            }
        }

        //console.log("updateNodes: " + JSON.stringify(regions));
        //console.log(this.game.regions)
        for(let item in response.regions){
            //console.log("node: " + JSON.stringify(item));
            let coord = {
                latitude: response.regions[item].lat,
                longitude: response.regions[item].lon,
            };
            let color;
            if(response.regions[item].owner == null){
                color = '#FAF0E6';
            }
            else if (response.regions[item].owner === this.state.userID){
                color = '#0000ff';
            }
            else {
                color = '#ff0000';
            }

            let troops;
            troops = "Troop Garrison: " + response.regions[item].troops;

            let image;
            if(color === '#0000ff'){
                if(response.regions[item].type == "fort"){
                    image = blueFortImg;
                }
                else if (response.regions[item].type == "castle"){
                    image = blueCastleImg;
                }
            }
            else if (color === '#ff0000'){
                if (response.regions[item].type == "fort") {
                    image = redFortImg;
                }
                else if (response.regions[item].type == "castle") {
                    image = redCastleImg;
                }
            }
            else {
                if (response.regions[item].type == "fort") {
                    image = fortImg;
                }
                else if (response.regions[item].type == "castle") {
                    image = castleImg;
                }
            }

            let node = {
                key: index,
                coordinate: coord,
                color: color,
                title: response.regions[item].type,
                description: troops,
                radius: response.regions[item].radius,
                image: image,
            };
            nodes.push(node);
            index++;

        } // end for loop

        //console.log("nodes: " + JSON.stringify(nodes));
        this.setState({nodes: nodes});
    };

    /**
     * ->checks if the game document has returned a winner and the game should be over
     * @param winner - values of null, userID, or the enemys ID
     */
    checkWinner = (winner) => {
        if(winner != null)
        {
            if(winner === this.state.userID){
                this.endGame(true)
            }
            else {
                this.endGame(false)
            }
        }
    }

    render(){
        if(this.state.region !== null && this.state.initialStateSet && this.state.initialGetGame) {
            return (
                <View style={styles.wrapper}>
                    < View style={styles.container}>


                            <Modal
                                animationType ="slide"
                                transparent={false}
                                visible={this.state.troopModalVisible}
                                onRequestClose={()=>  console.log("troop menu closed")}
                            >

                                <View style={troopModalStyles.modal}>
                                    <Text style={troopModalStyles.title}>
                                        Troop Menu
                                    </Text>
                                    <TextInput
                                        keyboardType='numeric'
                                        style={troopModalStyles.textInput} placeholder='0'
                                        onChangeText={ (troopTransferNumber) => this.setState({troopTransferNumber})}
                                        underlineColorAndroid='transparent'
                                    />

                                    <Text style={troopModalStyles.title}>
                                        Troops With You: {this.state.userTroops}
                                    </Text>
                                    <TouchableOpacity
                                        style={troopModalStyles.btn}
                                        onPress={()=> {
                                            this.transferTroops(this.state.troopTransferNumber);
                                            this.toggleModalOff();
                                        }}
                                    >
                                        <Text>Send Troops</Text>
                                    </TouchableOpacity>

                                    <Text style={troopModalStyles.title}>
                                        Troops Available in Fort: {this.game.regions[Number(this.state.workingRegionIndex)].troops}
                                    </Text>

                                    <TouchableOpacity
                                        style={troopModalStyles.btn}
                                        onPress={()=> {
                                            this.transferTroops(-this.state.troopTransferNumber);
                                            this.toggleModalOff();
                                        }}
                                    >
                                        <Text>Receive Troops</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={troopModalStyles.btn}
                                        onPress={() => this.toggleModalOff()}
                                    >
                                        <Text>Exit Menu</Text>
                                    </TouchableOpacity>
                                </View>
                            </Modal>


                        <MapView style={styles.map}
                                 initialRegion={this.state.region}
                                 onRegionChangeComplete={(region) => this.onRegionChange(region)}
                                 key={"gs-map-view"}
                                 showsCompass={false}
                                 toolbarEnabled={false}
                        >
                            {this.state.playerMarkers.map(marker => (
                                <Marker
                                    key={marker.title}
                                    coordinate={marker.coordinate}
                                    title={marker.title}
                                    pinColor={marker.pinColor}
                                />
                            ))}
                            {this.state.nodes.map(marker => (
                                <Marker
                                    key={marker.key}
                                    description={marker.description}
                                    coordinate={marker.coordinate}
                                    title={marker.title}
                                    image={marker.image}
                                    onPress={()=> this.onBuildingPress(marker.key)}
                                />
                            ))}
                            {this.state.nodes.map(marker => (
                                <Circle
                                    key={marker.key}
                                    center={marker.coordinate}
                                    radius={marker.radius}
                                    fillColor={marker.color}
                                />
                            ))}

                        </MapView>
                        <TouchableOpacity
                            style={styles.btn}
                            onPress={this.quitGame}
                        >
                            <Text>Click Here to Quit</Text>
                        </TouchableOpacity>
                        <View style = {styles.scoreDisplay}>
                            <Text >
                                Troops: {this.state.userTroops} {"   |   "}
                                Score: {this.state.score} {"   "}
                                Enemy: {this.state.enemyScore}
                            </Text>
                        </View>
                        <View style={{flexDirection: 'row', justifyContent: 'center'}}>
                            <CountDown
                                until={this.state.timeLeft}
                                size={15}
                                timeToShow={['M', 'S']}
                            />

                        </View>
                    </View>
                </View>

            );
        }
        else {
            return(
                <View style={{flex: 1, justifyContent: 'center', alignItems: "center",}}>
                    <Text>Loading</Text>
                </View>
            );
        }
    }

    /**
     * ->function to calculate time left in the game
     * @param startTime - formatted time passed by clock
     * @returns {number} - time in seconds to initialize the clock component
     */
    calcTimeLeft = (startTime) => {
        let startDate = new Date(startTime);
        let timeElapsed = (Date.now() - startDate)/1000;
        let timeLeft = 600 - timeElapsed;
        console.log("TIME LEFT: " + timeLeft)
        return timeLeft
    };

    /**
     * ->update MapView region
     * @param region
     */
    onRegionChange(region) {
        if(!this.state.regionSet) return;
        this.setState({ region });
    }

    /**
     * ->set the troop menu Modal ON
     */
    toggleModalOn(){
        this.setState({troopModalVisible: true});
    }

    /**
     * ->set the troop menu Modal off, including setting additional variables to null
     */
    toggleModalOff(){
        this.setState({troopModalVisible: false, troopTransferNumber: null, workingRegionIndex: null});
    }

    /**
     * ->on press function for a React Native Marker that represents a region
     * ->checks for range and ownership before opening a troop transfer menu that is a Modal
     * @param regionIndex - unique key of a region that will be set as a state to be using in the transfer of troops
     */
    onBuildingPress(regionIndex){
        //console.log("on press works, region index: " + regionIndex);

        //if user is inside of the fort that was on pressed
        //then open the drawer
        if(this.measureDist(this.game.regions[regionIndex].lat, this.game.regions[regionIndex].lon,
            this.state.playerMarkers[0].coordinate.latitude, this.state.playerMarkers[0].coordinate.longitude) < this.game.regions[regionIndex].radius
            && this.game.regions[regionIndex].owner === this.state.userID){
            //open drawer
            this.setState({workingRegionIndex: regionIndex});
            this.toggleModalOn();
        }
    }

    /**
     * -> use the sdk to transfer troops to or from a region
     * -> checks for range and ownership
     * @param troopNumber {int} - integer value passed by input form/button combo from troop modal, positive = send , negative = receive
     */
    transferTroops(troopNumber){

        let distance = this.measureDist(
          this.game.regions[Number(this.state.workingRegionIndex)].lat,
          this.game.regions[Number(this.state.workingRegionIndex)].lon,
          this.state.playerMarkers[0].coordinate.latitude,
          this.state.playerMarkers[0].coordinate.longitude);

        let inRange = distance < this.game.regions[Number(this.state.workingRegionIndex)].radius;

        // user is in range of region
        if (inRange){

            // this user owns the region
            if (this.game.regions[Number(this.state.workingRegionIndex)].owner === this.state.userID) {
                console.log("User troops: " + this.state.userTroops);
                if(troopNumber > 0){
                    console.log("Attempted to send to base: " + troopNumber);
                }else{
                    console.log("Attempted to receive from base: " + troopNumber);
                }
                let prev = Number(this.game.regions[Number(this.state.workingRegionIndex)].troops);

                this.game.transferTroopsToBase(this.state.userID, this.state.workingRegionIndex, troopNumber, this.state.gameID)
                    .then(response => {
                        console.log("Base now has: " + response.regions[Number(this.state.workingRegionIndex)].troops);
                    })
                    .catch(error => {
                        console.log("transferTroops error: " + error);
                        alert("Transfer Troops Failed");
                    })
            }
            // user doesn't own the region
            else {
                alert('transferTroops error: user does not own the region');
            }
        }
        // user is not in range of region
        else {
            alert("transferTroops error: user is not in range of the region");
        }
    }

    /**
     * -> function called when user presses the Quit game button
     */
    quitGame = () => {
        clearInterval(this.state.timer);
        this.game.leave(this.state.userID, this.state.gameID);
        AsyncStorage.removeItem('gameID');
        this.props.navigation.pop(2);
    };

    /**
     * -> function called when a winner has been set in the game document
     * @param isWinner - true or false value that will be passed to the GameOver screen
     */
    endGame = (isWinner) => {
        console.log("isWinner in endGame: " + isWinner );
        //alert('ending game');
        clearInterval(this.state.timer);
        this.game.leave(this.state.userID, this.state.gameID);
        AsyncStorage.removeItem('gameID');
        this.props.navigation.navigate('GameOver', {isWinner: isWinner});
    };

    /**
     * Measure the distance in meters between two points
     * (in latitude and longitude)
     * source of code: https://stackoverflow.com/questions/639695/how-to-convert-latitude-or-longitude-to-meters
     * @param lat1
     * @param lon1
     * @param lat2
     * @param lon2
     * @returns {number} distance in meters
     */
    measureDist(lat1, lon1, lat2, lon2){
        let R = 6378.137; // Radius of earth in KM
        let dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180;
        let dLon = lon2 * Math.PI / 180 - lon1 * Math.PI / 180;
        let a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        let d = R * c;
        return d * 1000; // meters
    }

}

const styles = StyleSheet.create({
    wrapper: { flex: 1},
    head: { height: 40, backgroundColor: '#f1f8ff' },
    text: { margin: 6 },
    menuContainer: {
        flex: 0.2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2896d3',
        paddingLeft: 40,
        paddingRight: 40,
    },
    btn: {
        alignSelf: 'stretch',
        backgroundColor: '#FAB913',
        padding: 5,
        alignItems: 'center',
        marginBottom: 10,
        marginTop: 10,
    },
    container: {
        flex: 1,
        padding: 16,
        paddingTop: 30,
        backgroundColor: '#fff'
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    scoreDisplay: {
        alignSelf: 'stretch',
        backgroundColor: '#FAB913',
        padding: 5,
        alignItems: 'center',
        marginBottom: 10,
        marginTop: 0,
    },
});

const troopModalStyles = StyleSheet.create({
    modal: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#000000',
        padding: 50
    },
    btn: {
        alignSelf: 'stretch',
        backgroundColor: '#FAB913',
        padding: 5,
        alignItems: 'center',
        marginTop: 10,
    },
    title: {
        color: '#ffffff',
        marginTop: 10,
    },
    textInput: {
        alignSelf: 'stretch',
        padding: 16,
        marginBottom: 20,
        backgroundColor: '#fff',
    },
});
