import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, AsyncStorage  } from 'react-native';
import { StackNavigator } from 'react-navigation'; // Version can be specified in package.json

export default class MainMenu extends React.Component {
    
    constructor(props){
        super(props);
    }
    
    render(){
        return(
            <View style={styles.container}>
                    <Text style={styles.header}> - Main Menu - </Text>
                    
                    <TouchableOpacity
                        style={styles.btn}
                        onPress={() => this.props.navigation.navigate('GameSearch')}
                    >
                        <Text>Find Game</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        style={styles.btn}
                        onPress={this.logout}>
                        <Text>Log out</Text>
                    </TouchableOpacity>
                        
                </View>
        );
    } 

    logout = () =>{
        AsyncStorage.removeItem('user');
        this.props.navigation.goBack();
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