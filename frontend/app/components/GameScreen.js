import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, AsyncStorage,} from 'react-native';
import { StackNavigator } from 'react-navigation'; // Version can be specified in package.json
import MapView from 'react-native-maps';
import {Marker} from 'react-native-maps';

import BaseConnection from 'kingdoms-game-sdk/BaseConnection';
import Game from 'kingdoms-game-sdk/Game';

import IP from '../../config';

export default class GameScreen extends React.Component {
    
    constructor(props){
        super(props);
        this.state = {
            isWinner: false,
            region: {
                latitude: 37.78825,
                longitude: -122.4324,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            },
            userID: null,
            gameID: '',
            lat: null,
            lon: null,
            error: null,
        };
        //initial game id
        const {params} = this.props.navigation.state;
        this.state.gameID = params.gameID;

        let baseConn = new BaseConnection( IP ,'3000');
        this.game = new Game(baseConn);
        //get gameInstance
        if(this.state.gameID === '' || this.state.gameID === null || this.state.gameID === undefined){
            alert('error getting game ID');
            this.props.navigation.pop(1);
        }
        this.game.getGame(this.state.gameID)
            .then((response) => {

            })
            .catch((err) =>{
                alert('getGame' + err);
            });

        //update geolocation of player and game
        //this.updateGeolocation();
        //setInterval(this.updateGeolocation(), 5000);
    }

    componentDidMount(){
        this._loadInitialState().done();
    }

    _loadInitialState = async () => {
        //get id
        let value = await AsyncStorage.getItem('_id');
        //return to menu on error
        if (value == null){
            alert('error getting user ID');
            this.props.navigation.pop(1);
        }
        this.state.userID = value;

    }

    getGeolocation() {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                alert(position.coords.latitude);
                this.setState({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                    error: null,
                });
            },
            (error) => this.setState({ error: error.message }),
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 },
        );
    }

    updateGeolocation(){
        this.getGeolocation();
        this.game.setGeolocation(this.state.userID,this.state.lon,this.state.lat)
            .then((response) => {

            })
            .catch((err) =>{
                alert(this.state.userID + this.state.lon + this.state.lat + 'updateGeolocation' + err);
            });
    }

    render(){
        return(
            <View style={styles.wrapper}>
                <View style={styles.container}>
                    <MapView style={styles.map}
                        region={this.state.region}
                    />
                </View>
                <View style={styles.menuContainer}>
                    <TouchableOpacity
                        style={styles.btn}
                        onPress={() => this.props.navigation.pop(2)}
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
    
    endGame = () => {
        //alert('ending game');
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
