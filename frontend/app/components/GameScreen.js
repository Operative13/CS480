import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, AsyncStorage,} from 'react-native';
import { StackNavigator } from 'react-navigation'; // Version can be specified in package.json
import MapView from 'react-native-maps';
import {Marker, Circle} from 'react-native-maps';

import BaseConnection from 'kingdoms-game-sdk/src/BaseConnection';
import Game from 'kingdoms-game-sdk/src/Game';

import IP from '../../config';

export default class GameScreen extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            isWinner: false,
            region: {
                latitude: 34.0576,
                longitude: -117.8207,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            },
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
        };
        //initial game id
        const {params} = this.props.navigation.state;
        this.state.gameID = params.gameID;

        //initial region
        this.state.region = {
            latitude: params.lat,
            longitude: params.lon,
            latitudeDelta: 0.01,
            longitudeDelta: 0.0011,
        };

        let baseConn = new BaseConnection( IP ,'3000');
        this.game = new Game(baseConn);
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
    }

    _loadInitialState = async () => {
        console.log('loadinitialstate');
        //get id
        let value = await AsyncStorage.getItem('_id');
        //return to menu on error
        if (value == null){
            alert('error getting user ID');
            this.props.navigation.pop(1);
        }
        this.state.userID = value;

        //get gameInstance
        if(this.state.gameID === '' || this.state.gameID === null || this.state.gameID === undefined){
            alert('error getting game ID');
            this.props.navigation.pop(1);
        }
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
        navigator.geolocation.getCurrentPosition(
            (position) => {
                if(!this.state.regionSet){
                    let region = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.0011
                    };
                    this.setState({region,regionSet:true})
                }

                //update geolocation on server
                this.game.setGeolocation(this.state.userID, position.coords.longitude, position.coords.latitude)
                    .then((response) => {
                        console.log(response);
                        this.setState({numErrors: 0});
                        this.updateNodes(response);
                        this.updatePlayers(position,response);
                    })
                    .catch((err) =>{
                        console.error(err);
                        //TODO
                        //figure out what the specific way to check for "TypeError: Network request failed" is
                        let numErrors = this.state.numErrors + 1;
                        this.setState({numErrors: numErrors});
                        if(numErrors > 5){
                            alert(err);
                        }
                    });
            },
            (err) => {console.log(err)},
            {
                enableHighAccuracy: true,
                timeout: 10000,
            }
        );
    };

    /**
     *
     * @param position - position provided by navigator.watchPosition , contains
     *    info on lon and lat of self
     * @param response - game document return from server, contains enemy coordinates
     */
    updatePlayers = (position, response) => {
        let coordEnemy = {
            latitude: 0,
            longitude: 0,
        };

        for (let userId in this.game.geolocations){
            if(response.geolocations.hasOwnProperty(userId) && userId !== this.state.userID){
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
        ]
        this.setState({
            playerMarkers: playerMarkers
        });
    };

    /**
     * ->update nodes with response from server
     * @param response - game document return from server, contains regions which have LatLang, radius, owner, and type
     */
    updateNodes = (response) => {
        let nodes=[];
        console.log("updateNodes: " + JSON.stringify(response));
        for(let item in response.regions){
            console.log("node: " + JSON.stringify(item));
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

            let node = {
                coordinate: coord,
                color: color,
                title: response.regions[item].type,
                radius: response.regions[item].radius,
            };
            nodes.push(node);
        }
        console.log("nodes: " + JSON.stringify(nodes));
        this.setState({nodes: nodes});
    };


    render(){
        return(
            <View style={styles.wrapper}>
                <View style={styles.container}>
                    <MapView style={styles.map}
                        region={this.state.region}
                        onRegionChangeComplete={(region) => this.onRegionChange(region)}
                        key={"gs-map-view"}
                    >
                        {this.state.playerMarkers.map(marker => (
                            <Marker
                                key={marker.title}
                                coordinate={marker.coordinate}
                                title={marker.title}
                                pinColor ={marker.pinColor}
                            />
                        ))}
                        {this.state.nodes.map( marker =>(
                            <Marker
                               coordinate={marker.coordinate}
                               title={marker.title}
                               pinColor={marker.color}
                            />
                        ))}
                        {this.state.nodes.map( marker =>(
                            <Circle
                                center={marker.coordinate}
                                radius={marker.radius}
                                fillColor={marker.color}
                            />
                        ))}

                    </MapView>
                </View>
                <View style={styles.menuContainer}>
                    <TouchableOpacity
                        style={styles.btn}
                        onPress={this.quitGame}
                    >
                        <Text>Quit</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        style={styles.btn}
                        onPress={this.endGame}
                    >
                        <Text>GameOver</Text>
                    </TouchableOpacity>
                </View>
            </View>    
        );
    }

    /**
     * ->update MapView region
     * @param region
     */
    onRegionChange(region) {
        if(!this.state.regionSet) return;
        this.setState({ region });
    }

    quitGame = () => {
        this.game.leave(this.state.userID, this.state.gameID);
        AsyncStorage.removeItem('gameID');
        this.props.navigation.pop(2);
    }


    endGame = () => {
        //alert('ending game');
        this.game.leave(this.state.userID, this.state.gameID);
        AsyncStorage.removeItem('gameID');
        clearInterval(this.state.timer);
        this.props.navigation.navigate('GameOver', {isWinner: this.state.isWinner});
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
        backgroundColor: '#01c853',
        padding: 5,
        alignItems: 'center',
        marginBottom: 20,
    },
    container: {
        flex: 0.8,
        padding: 16,
        paddingTop: 30,
        backgroundColor: '#fff'
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
});
