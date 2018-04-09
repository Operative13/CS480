import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import { StackNavigator } from 'react-navigation'; // Version can be specified in package.json
import MapView from 'react-native-maps';

export default class GameScreen extends React.Component {
    
    constructor(props){
        super(props);
        this.state = {
            isWinner: false,
            tableData: [
                [ '0', '0', '0', '0', '0'],
                [ '0', '0', '0', '0', '0'],
                [ '0', '0', '0', '0', '0'],
                [ '0', '0', '0', '0', '0'],
                [ '0', '0', '0', '0', '0']
            ],
            region: {
                latitude: 37.78825,
                longitude: -122.4324,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            },
        }
    }
    //Table States
    //Empty: '0'
    //Contested: '1'
    //Host: '2'
    //Enemy player: '3'
    
    render(){
        const state = this.state;
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
    
    //function to convert table state to table style color
    tableStyle = (data) => {
        if(data = '0')
            return {color:'#fffaf0'};
        if(data = '1')
            return {color:'#808080'};
        if(data = '2')
            return {color:'#1aa9d8'};
        if(data = '3')
            return {color:'#d81919'};    
    }
    
    endGame = () => {
        //alert('ending game');
        this.props.navigation.navigate('GameOver', {isWinner: this.state.isWinner});
    }

}

const styles = StyleSheet.create({
    wrapper: { flex: 1},
    container: { flex: 0.8, padding: 16, paddingTop: 30, backgroundColor: '#fff' },
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
    map: {
    
    },
});
