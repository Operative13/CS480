import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import { StackNavigator } from 'react-navigation'; // Version can be specified in package.json

export default class GameOver extends React.Component {
    
    constructor(props){
        super(props);
        this.state = {
            endText: "",
        };
        const {params} = this.props.navigation.state;
        const isWinner = params.isWinner;
        console.log("isWinner in GameOver screen: " + isWinner );
        if(isWinner)
            this.state.endText = "WINNER";
        else
            this.state.endText = "LOSER";
    }

    render(){
        return(
            <View style={styles.container}>
                <Text style={styles.header}> - Game Over - </Text>
                <Text style={styles.header}> {this.state.endText} </Text>
        
                <TouchableOpacity
                    style={styles.btn}
                    onPress={() => this.props.navigation.pop(3)}
                >
                    <Text>Return to Main Menu</Text>
                </TouchableOpacity>
            </View>
        );
    }
    

}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2896d3',
        paddingLeft: 40,
        paddingRight: 40,
    },
    header: {
        fontSize: 24,
        marginBottom: 60,
        color: '#fff',
        fontWeight: 'bold',
    },
    textInput: {
        alignSelf: 'stretch',
        padding: 16,
        marginBottom: 20,
        backgroundColor: '#fff',
    },
    btn: {
        alignSelf: 'stretch',
        backgroundColor: '#01c853',
        padding: 20,
        alignItems: 'center',
        marginBottom: 20,
    }
});