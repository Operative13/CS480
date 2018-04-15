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
            lat: null,
            lon: null,
            error: null,
        }

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

    render(){

        const {params} = this.props.navigation.state;
        var game = params.gameInstance;
        //alert(game);

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
